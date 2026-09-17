#!/usr/bin/env python3
import argparse, hashlib, json, os, pathlib, shutil, subprocess, tempfile, zipfile

RELEASE='FR-NAV1.30.28-HF3.13.10'
MANIFEST='RELEASE_MANIFEST__R1328.json'
QUALIFICATION='QUALIFICATION_RESULTS__R1328.json'
FIXED_TIME=(2026,9,17,0,0,0)

def sha256_bytes(data): return hashlib.sha256(data).hexdigest()
def sha256_file(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def run_checks():
    commands=[
      ['node','--check','dist/assets/r1328-quality.js'],
      ['node','--check','dist/assets/franklin-established-positioning.js'],
      ['node','tests/r1327-screenshot-refinement.cjs'],
      ['node','tests/r1328-quality-contract.cjs']
    ]
    results=[]
    for cmd in commands:
        subprocess.run(cmd,check=True)
        results.append({'command':' '.join(cmd),'result':'PASS'})
    return results

def tracked_files():
    raw=subprocess.check_output(['git','ls-files','-z'])
    out=[]
    for b in raw.split(b'\0'):
        if not b: continue
        p=b.decode('utf-8')
        pp=pathlib.PurePosixPath(p)
        if pp.is_absolute() or '..' in pp.parts or p.startswith('.git/'):
            raise SystemExit(f'unsafe tracked path: {p}')
        if p in (MANIFEST,QUALIFICATION): raise SystemExit(f'{p} must be generated, not tracked')
        if os.path.islink(p): raise SystemExit(f'symlink not permitted in release package: {p}')
        if not os.path.isfile(p): raise SystemExit(f'tracked member missing/not regular file: {p}')
        out.append(p)
    return sorted(out)

def stage(root, files, commit, checks):
    members=[]
    for rel in files:
        src=pathlib.Path(rel); dst=root/rel; dst.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(src,dst)
        data=dst.read_bytes(); members.append({'path':rel,'bytes':len(data),'sha256':sha256_bytes(data)})
    qualification={
      'receiptType':'IN_PACKAGE_QUALIFICATION_RESULTS','release':RELEASE,'commit':commit,
      'sourceChecks':checks,'sourceChecksResult':'PASS','cleanExtractionValidation':'REQUIRED_AFTER_SEAL'
    }
    qdata=(json.dumps(qualification,indent=2,sort_keys=True)+'\n').encode('utf-8'); (root/QUALIFICATION).write_bytes(qdata)
    members.append({'path':QUALIFICATION,'bytes':len(qdata),'sha256':sha256_bytes(qdata)})
    members=sorted(members,key=lambda x:x['path'])
    manifest={
      'schema':'FRANKLIN_NAVIGATOR_RELEASE_MANIFEST_V1',
      'release':RELEASE,
      'commit':commit,
      'generatedManifestSelfHashRule':'Manifest covers every packaged member except its own self-hash; archive byte hash is stored in external attestation.',
      'memberCountExcludingManifest':len(members),
      'members':members
    }
    (root/MANIFEST).write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n',encoding='utf-8')
    return manifest

def build_zip(staging, out_path):
    paths=sorted(str(p.relative_to(staging)).replace(os.sep,'/') for p in staging.rglob('*') if p.is_file())
    with zipfile.ZipFile(out_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9,strict_timestamps=True) as z:
        for rel in paths:
            data=(staging/rel).read_bytes(); info=zipfile.ZipInfo(rel,FIXED_TIME); info.create_system=3; info.external_attr=(0o100644<<16); info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--out-dir',default='release-out'); args=ap.parse_args()
    out=pathlib.Path(args.out_dir); out.mkdir(parents=True,exist_ok=True)
    checks=run_checks(); commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(); files=tracked_files()
    with tempfile.TemporaryDirectory(prefix='r1328-stage-') as td:
        staging=pathlib.Path(td); manifest=stage(staging,files,commit,checks)
        a=out/'R1328_A.zip'; b=out/'R1328_B.zip'; build_zip(staging,a); build_zip(staging,b)
        sha_a=sha256_file(a); sha_b=sha256_file(b)
        if a.read_bytes()!=b.read_bytes() or sha_a!=sha_b: raise SystemExit('deterministic double build failed')
        final=out/'FRANKLIN_NAVIGATOR__R1328__FR-NAV1.30.28-HF3.13.10__QUALIFIED_SUCCESSOR.zip'; os.replace(a,final); b.unlink()
        att={
          'receiptType':'EXTERNAL_RELEASE_BINARY_ATTESTATION','release':RELEASE,'commit':commit,
          'filename':final.name,'bytes':final.stat().st_size,'sha256':sha256_file(final),
          'deterministicDoubleBuild':'PASS_BYTE_IDENTICAL','sourceChecks':'PASS',
          'manifest':MANIFEST,'manifestMembersExcludingSelf':manifest['memberCountExcludingManifest'],
          'cleanExtractionValidation':'PENDING_VALIDATOR'
        }
        (out/'R1328_BINARY_ATTESTATION.json').write_text(json.dumps(att,indent=2,sort_keys=True)+'\n',encoding='utf-8')
        print(json.dumps(att,sort_keys=True))
if __name__=='__main__': main()
