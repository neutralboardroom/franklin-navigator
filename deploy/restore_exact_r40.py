#!/usr/bin/env python3
"""Restore exact sealed R40 public bytes from the pinned R39 carrier.
No network, secrets, prices, payments, memberships, or other editions are changed.
The recipe is a byte-copy delta, not a new product version. Both input and full
output tree digests are checked before replacing dist. Source qualification is
bound to R40 archive 8cbadee...; deployment/live acceptance stays separate.
"""
from pathlib import Path, PurePosixPath
import base64, hashlib, io, json, shutil, stat, tarfile, tempfile, zlib, zipfile
ROOT = Path(__file__).resolve().parents[1]
OLD_PAYLOAD_SHA = '89ca122f543c330bbd9bc09f6f0465149b589bb78fa6ed82d1ffa9e022e5e664'
OLD_DIST_SHA = '3737192fded91b8cef5a2814ae39953fa6664bc1610e179ddd5382c0a2651686'
NEW_DIST_SHA = 'f18dfb9b29c5d9b912870dab212a6b438c7b79a4202bd11b7317b4e511775f4b'
RELEASE = 'FR-NAV1.15.0-CANDIDATE-R40'
SOURCE_ZIP_SHA = '8cbadeeb187386e2825098fe28c395035e5ef00fe1e9be6a2181657be14cfefc'
RECIPE_B64 = ''.join((ROOT/'deploy'/f'r40-delta-{i}.txt').read_text('ascii').strip() for i in range(1,4))
RECIPE_SHA = 'af95665e249fb3058f593da04e86cc6be2b126e014dd8816521f73b5418b90dc'

def fail(message):
    raise SystemExit(message)

def safe(name):
    p = PurePosixPath(name)
    return bool(name) and not p.is_absolute() and '..' not in p.parts and '\\' not in name

def digest(files):
    records = ''.join(f'{name}\0{len(data)}\0{hashlib.sha256(data).hexdigest()}\n' for name,data in sorted(files.items()))
    return hashlib.sha256(records.encode('utf-8')).hexdigest()

payload = (ROOT/'deploy'/'R39_GITHUB_DEPLOYMENT_PAYLOAD.zip').read_bytes()
if hashlib.sha256(payload).hexdigest() != OLD_PAYLOAD_SHA: fail('Pinned R39 carrier hash mismatch')
with zipfile.ZipFile(io.BytesIO(payload)) as outer:
    if outer.testzip() is not None: fail('Carrier CRC failure')
    if len(outer.namelist()) != len(set(outer.namelist())): fail('Duplicate ZIP path')
    if any(not safe(i.filename) or stat.S_ISLNK(i.external_attr>>16) for i in outer.infolist()): fail('Unsafe carrier')
    tar_bytes = outer.read('R39_STATIC_DIST.tar.gz')
files = {}
with tarfile.open(fileobj=io.BytesIO(tar_bytes), mode='r:gz') as tar:
    seen = set()
    for member in tar.getmembers():
        if not safe(member.name) or member.name in seen or not (member.isfile() or member.isdir()): fail('Unsafe tar entry')
        seen.add(member.name)
        if member.isfile() and member.name.startswith('dist/'):
            files[member.name] = tar.extractfile(member).read()
if len(files)!=19481 or digest(files)!=OLD_DIST_SHA: fail('Pinned R39 public tree mismatch')
recipe_bytes=zlib.decompress(base64.b64decode(RECIPE_B64,validate=True))
if hashlib.sha256(recipe_bytes).hexdigest()!=RECIPE_SHA: fail('Delta integrity failure')
recipe=json.loads(recipe_bytes)
for name in list(files):
    if name.endswith('.html'):
        text=files[name].decode('utf-8')
        for before,after in recipe['replacements'].items(): text=text.replace(before,after)
        files[name]=text.encode('utf-8')
name='dist/data/r37-es-public-strings.json'
files[name]=(json.dumps(json.loads(files[name]),ensure_ascii=False,indent=2)+'\n').encode('utf-8')
for name,ops in recipe['patches'].items():
    if not safe(name) or not name.startswith('dist/'): fail('Delta target outside public tree')
    original=files.get(name,b''); out=[]
    for op in ops:
        if isinstance(op,list):
            start,count=op
            if not isinstance(start,int) or not isinstance(count,int) or start<0 or count<0 or start+count>len(original): fail('Invalid copy bounds')
            out.append(original[start:start+count])
        else: out.append(base64.b64decode(op,validate=True))
    files[name]=b''.join(out)
for name in recipe['deleted']:
    if not safe(name) or not name.startswith('dist/'): fail('Invalid removal target')
    files.pop(name,None)
if len(files)!=19481 or digest(files)!=NEW_DIST_SHA: fail('R40 full public tree digest mismatch; original dist untouched')
if sum(n.startswith('dist/profiles/') and n.endswith('/index.html') for n in files)!=19103: fail('Profile count mismatch')
build=json.loads(files['dist/FRANKLIN_BUILD_MANIFEST.json'])
if build['release']!=RELEASE or build['commerce']['publicCheckoutOpen'] is not False: fail('Release or closed-checkout invariant failed')
if set(recipe['rootFiles']) != {'README.md','PRODUCTION_RELEASE.json'}: fail('Unexpected root target')
root_files={n:base64.b64decode(b,validate=True) for n,b in recipe['rootFiles'].items()}
if json.loads(root_files['PRODUCTION_RELEASE.json'])['release']!=RELEASE: fail('Production identity mismatch')
with tempfile.TemporaryDirectory(prefix='r40-restore-',dir=ROOT) as temp:
    stage=Path(temp)
    for name,data in files.items():
        target=stage/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
    if (ROOT/'dist').is_symlink(): fail('Refusing symlink dist')
    if (ROOT/'dist').exists(): shutil.rmtree(ROOT/'dist')
    shutil.move(str(stage/'dist'),str(ROOT/'dist'))
for name,data in root_files.items(): (ROOT/name).write_bytes(data)
receipt={'release':RELEASE,'sourceArchiveSha256':SOURCE_ZIP_SHA,'sourceTreeSha256':'f0ffaa860b8e0f81737a8bc2f71eb8c64edd8043cfebd1c14ed5e18f15663de9','publicTreeSha256':NEW_DIST_SHA,'files':len(files),'profiles':19103,'result':'PASS_EXACT_SEALED_PUBLIC_BYTES','publicCheckoutOpen':False,'deploymentPerformed':False,'liveAcceptance':'NOT_CLAIMED','restorationMethod':'PINNED_R39_CARRIER_WITH_HASH_VERIFIED_BYTE_DELTA'}
(ROOT/'deploy'/'R40_EXACT_RESTORATION_RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt,sort_keys=True))
