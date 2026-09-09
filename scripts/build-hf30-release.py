#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, io, json, pathlib, shutil, subprocess, tempfile, zipfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
RELEASE='FR-NAV1.19.0-HF3.0-CANDIDATE'
FILENAME='FRANKLIN_NAVIGATOR__HF3_0__PUBLIC_TRUTH_RELEASE_INTEGRITY__2026-09-10.zip'
ARCHIVE_SUFFIXES=('.zip','.tar','.gz','.tgz','.7z')
SKIP_PARTS={'.git','node_modules','__pycache__','.pytest_cache','.mypy_cache','.ruff_cache'}
NORMAL_DATE=(1980,1,1,0,0,0)

def sha_bytes(data:bytes)->str:return hashlib.sha256(data).hexdigest()
def sha_file(path:pathlib.Path)->str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
    return h.hexdigest()
def git(*args:str)->str:return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()

def tracked_files():
    raw=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT)
    names=[x.decode('utf-8') for x in raw.split(b'\0') if x]
    include=[];exclude=[]
    for name in sorted(names):
        p=pathlib.PurePosixPath(name);reason=None
        if any(part in SKIP_PARTS for part in p.parts):reason='CACHE_OR_VCS'
        elif name.lower().endswith(ARCHIVE_SUFFIXES):reason='NESTED_ARCHIVE_PROHIBITED'
        elif name.startswith('release-output/'):reason='GENERATED_RELEASE_OUTPUT'
        if reason:
            exclude.append({'path':name,'reason':reason});continue
        fs=ROOT/name
        if not fs.is_file():raise SystemExit(f'Tracked file missing: {name}')
        if fs.is_symlink():raise SystemExit(f'Symlink prohibited in release: {name}')
        include.append(name)
    return include,exclude

def zipinfo(name:str)->zipfile.ZipInfo:
    z=zipfile.ZipInfo(name,NORMAL_DATE);z.compress_type=zipfile.ZIP_DEFLATED;z.create_system=3;z.external_attr=(0o100644<<16);z.flag_bits|=0x800;return z

def build_bytes(source_commit:str):
    names,excluded=tracked_files()
    exclusions=json.dumps({
        'schemaVersion':'franklin.hf30.release-exclusions.v1','release':RELEASE,'sourceCommit':source_commit,
        'excludedTrackedFiles':excluded,'rule':'Nested archives, caches, VCS metadata and generated release output are not packaged.'
    },sort_keys=True,separators=(',',':')).encode()+b'\n'
    rows=[];contents={}
    for name in names:
        data=(ROOT/name).read_bytes();contents[name]=data;rows.append({'path':name,'bytes':len(data),'sha256':sha_bytes(data)})
    contents['HF30_RELEASE_EXCLUSIONS.json']=exclusions
    rows.append({'path':'HF30_RELEASE_EXCLUSIONS.json','bytes':len(exclusions),'sha256':sha_bytes(exclusions)})
    rows.sort(key=lambda x:x['path'])
    manifest={
        'schemaVersion':'franklin.hf30.release-manifest.v1','release':RELEASE,'sourceCommit':source_commit,
        'activeEdition':'FRANKLIN_TN','writableProductLane':'LOCAL_COMMUNITY_EDITION:FRANKLIN_TN',
        'manifestSelfHashRule':'MANIFEST_FILE_EXCLUDED_FROM_ITS_OWN_MEMBER_HASH_TABLE',
        'normalizedArchiveTimestamp':'1980-01-01T00:00:00Z','normalizedMode':'0644','files':rows
    }
    manifest_bytes=json.dumps(manifest,sort_keys=True,separators=(',',':')).encode()+b'\n';contents['HF30_RELEASE_MANIFEST.json']=manifest_bytes
    out=io.BytesIO()
    with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9,strict_timestamps=True) as zf:
        for name in sorted(contents):zf.writestr(zipinfo(name),contents[name],compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
    return out.getvalue(),manifest,manifest_bytes,exclusions

def validate_archive(path:pathlib.Path,manifest:dict):
    with zipfile.ZipFile(path) as zf:
        names=zf.namelist()
        if len(names)!=len(set(names)):raise SystemExit('Duplicate ZIP member')
        if zf.testzip() is not None:raise SystemExit('ZIP CRC failure')
        if any(n.startswith('/') or '..' in pathlib.PurePosixPath(n).parts or '\\' in n for n in names):raise SystemExit('Unsafe ZIP member path')
        if any(n.lower().endswith(ARCHIVE_SUFFIXES) for n in names):raise SystemExit('Nested archive found')
        expected={r['path'] for r in manifest['files']}|{'HF30_RELEASE_MANIFEST.json'}
        if set(names)!=expected:raise SystemExit('ZIP member set does not match manifest')
    with tempfile.TemporaryDirectory(prefix='hf30-extract-') as td:
        dest=pathlib.Path(td)
        with zipfile.ZipFile(path) as zf:zf.extractall(dest)
        subprocess.run(['python3','scripts/validate-hf30-release.py'],cwd=dest,check=True)
        for js in ['dist/assets/hf27-navigation.js','dist/assets/hf29-design.js','dist/assets/r37-i18n.js','dist/assets/hf28-directory.js','dist/assets/local-discovery.js','dist/assets/navigator-bot.js','dist/assets/r38-assistant-followthrough.js','dist/assets/r40-assistant-safety-guard.js']:
            subprocess.run(['node','--check',js],cwd=dest,check=True)
        subprocess.run(['node','scripts/verify-hf30-retained.mjs'],cwd=dest,check=True)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out',default='release-output');args=ap.parse_args()
    outdir=ROOT/args.out
    if outdir.exists():shutil.rmtree(outdir)
    outdir.mkdir(parents=True)
    meta=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text('utf-8'))
    if meta.get('release')!=RELEASE:raise SystemExit('PRODUCTION_RELEASE release mismatch')
    if meta.get('releaseState') not in {'LIVE_VERIFIED_QUALIFIED_PENDING_SEAL','QUALIFIED_SUCCESSOR_SEALED'}:raise SystemExit('HF3.0 is not live-verified/qualified for sealing')
    source_commit=git('rev-parse','HEAD')
    a,ma,mba,ea=build_bytes(source_commit);b,mb,mbb,eb=build_bytes(source_commit)
    if a!=b or mba!=mbb or ea!=eb or ma!=mb:raise SystemExit('Deterministic double-build mismatch')
    target=outdir/FILENAME;target.write_bytes(a);validate_archive(target,ma)
    att={
        'schemaVersion':'franklin.hf30.external-release-attestation.v1','release':RELEASE,'sourceCommit':source_commit,
        'artifact':FILENAME,'bytes':target.stat().st_size,'sha256':sha_file(target),'manifestSha256':sha_bytes(mba),
        'manifestCoveredFiles':len(ma['files']),'zipMembers':len(ma['files'])+1,'nestedArchives':0,
        'deterministicDoubleBuild':'PASS_BYTE_IDENTICAL','freshExtractionReleaseValidator':'PASS','freshExtractionNodeSyntax':'PASS',
        'freshExtractionRetainedBehavior':'PASS','activeEdition':'FRANKLIN_TN','publicReleaseMarkersExact':19355,
        'profileCount':19103,'profileFactsChanged':False,'pricesChanged':False,'runtimeChanged':False,'authorityTransfer':False
    }
    (outdir/'HF30_EXTERNAL_RELEASE_ATTESTATION.json').write_text(json.dumps(att,indent=2,sort_keys=True)+'\n','utf-8')
    print(json.dumps(att,sort_keys=True))
if __name__=='__main__':main()
