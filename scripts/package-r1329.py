#!/usr/bin/env python3
import argparse, hashlib, json, os, pathlib, shutil, subprocess, tempfile, zipfile

RELEASE='FR-NAV1.30.29-HF3.13.11'
MANIFEST='RELEASE_MANIFEST__R1329.json'
QUALIFICATION='QUALIFICATION_RESULTS__R1329.json'
RECEIPT='RELEASE_RECEIPT__R1329.json'
FIXED_TIME=(2026,9,18,0,0,0)

def sha256_bytes(data): return hashlib.sha256(data).hexdigest()
def sha256_file(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def run_checks():
    commands=[
      ['node','--check','dist/assets/hf310.js'],
      ['node','--check','dist/assets/local-discovery-data.js'],
      ['node','--check','dist/assets/membership-live.js'],
      ['node','tests/r1327-screenshot-refinement.cjs'],
      ['node','tests/r1328-quality-contract.cjs'],
      ['node','tests/r1329-profile-integration.cjs']
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
        if p in (MANIFEST,QUALIFICATION,RECEIPT): raise SystemExit(f'{p} must be generated, not tracked')
        if os.path.islink(p): raise SystemExit(f'symlink not permitted in release package: {p}')
        if not os.path.isfile(p): raise SystemExit(f'tracked member missing/not regular file: {p}')
        out.append(p)
    return sorted(out)

def add_generated(root,members,name,obj):
    data=(json.dumps(obj,indent=2,sort_keys=True)+'\n').encode('utf-8')
    (root/name).write_bytes(data)
    members.append({'path':name,'bytes':len(data),'sha256':sha256_bytes(data)})

def stage(root,files,commit,checks):
    members=[]
    for rel in files:
        src=pathlib.Path(rel); dst=root/rel
        dst.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(src,dst)
        data=dst.read_bytes(); members.append({'path':rel,'bytes':len(data),'sha256':sha256_bytes(data)})
    qualification={
      'receiptType':'IN_PACKAGE_QUALIFICATION_RESULTS','release':RELEASE,'commit':commit,
      'sourceChecks':checks,'sourceChecksResult':'PASS','cleanExtractionValidation':'REQUIRED_AFTER_SEAL',
      'requiredUserOutcome':'Franklin Navigator is searchable/selectable on claim-profile and opens canonical FR-ORG-b00c0ace7943973c public profile.'
    }
    add_generated(root,members,QUALIFICATION,qualification)
    receipt={
      'receiptType':'LOCAL_COMMUNITY_PLATFORM_RELEASE_RECEIPT','binaryStatus':'QUALIFIED_SUCCESSOR',
      'builderRole':'LOCAL_COMMUNITY_PLATFORM','activeEdition':'FRANKLIN_TN','authorityTransfer':False,
      'predecessor':'R1328 / FR-NAV1.30.28-HF3.13.10','predecessorCommit':'72ea3fcba5fac6a21ee54fe188d6402e78eecc0a',
      'successor':'R1329 / '+RELEASE,'commit':commit,
      'sourceState':'QUALIFIED_SOURCE_PACKAGE','sccAcceptedState':'NOT_SELF_ASSERTED',
      'rollbackTarget':'R1328 commit 72ea3fcba5fac6a21ee54fe188d6402e78eecc0a',
      'profileProjectionCount':19104,'canonicalFranklinNavigatorProfileId':'FR-ORG-b00c0ace7943973c',
      'profileFactorySource':'FR-PF-PLATFORM-15.28 targeted owner-directed integration',
      'profileFactoryFullSnapshotPromotion':False,'localInvestigatorV42':'DEFER_WITH_CAUSE_SCC_GATE_PENDING',
      'mailingAddressOnly':True,'physicalOfficeVerified':False,'fabricatedLifecycleState':False,
      'smarterJusticeDonor':'SMARTER_JUSTICE_DONOR_NOT_USED','currentNewSaleOffer':'$35/year Community Membership',
      'freeBoundary':'basic public profile accuracy, factual corrections, and public-profile removal remain free',
      'binaryHashRule':'Final ZIP byte count/SHA-256 are recorded in external R1329_BINARY_ATTESTATION.json.'
    }
    add_generated(root,members,RECEIPT,receipt)
    members=sorted(members,key=lambda x:x['path'])
    manifest={
      'schema':'FRANKLIN_NAVIGATOR_RELEASE_MANIFEST_V1','release':RELEASE,'commit':commit,
      'generatedManifestSelfHashRule':'Manifest covers every packaged member except itself; archive byte hash is stored in external attestation.',
      'memberCountExcludingManifest':len(members),'members':members
    }
    (root/MANIFEST).write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n',encoding='utf-8')
    return manifest

def build_zip(staging,out_path):
    paths=sorted(str(p.relative_to(staging)).replace(os.sep,'/') for p in staging.rglob('*') if p.is_file())
    with zipfile.ZipFile(out_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9,strict_timestamps=True) as z:
        for rel in paths:
            data=(staging/rel).read_bytes()
            info=zipfile.ZipInfo(rel,FIXED_TIME); info.create_system=3; info.external_attr=(0o100644<<16); info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--out-dir',default='release-out'); args=ap.parse_args()
    out=pathlib.Path(args.out_dir); out.mkdir(parents=True,exist_ok=True)
    checks=run_checks()
    commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
    files=tracked_files()
    with tempfile.TemporaryDirectory(prefix='r1329-stage-') as td:
        staging=pathlib.Path(td); manifest=stage(staging,files,commit,checks)
        a=out/'R1329_A.zip'; b=out/'R1329_B.zip'; build_zip(staging,a); build_zip(staging,b)
        sha_a=sha256_file(a); sha_b=sha256_file(b)
        if a.read_bytes()!=b.read_bytes() or sha_a!=sha_b: raise SystemExit('deterministic double build failed')
        final=out/'FRANKLIN_NAVIGATOR__R1329__FR-NAV1.30.29-HF3.13.11__QUALIFIED_SUCCESSOR.zip'
        os.replace(a,final); b.unlink()
        att={
          'receiptType':'EXTERNAL_RELEASE_BINARY_ATTESTATION','release':RELEASE,'commit':commit,
          'filename':final.name,'bytes':final.stat().st_size,'sha256':sha256_file(final),
          'deterministicDoubleBuild':'PASS_BYTE_IDENTICAL','sourceChecks':'PASS','manifest':MANIFEST,
          'manifestMembersExcludingSelf':manifest['memberCountExcludingManifest'],'cleanExtractionValidation':'PENDING_VALIDATOR'
        }
        (out/'R1329_BINARY_ATTESTATION.json').write_text(json.dumps(att,indent=2,sort_keys=True)+'\n',encoding='utf-8')
        print(json.dumps(att,sort_keys=True))
if __name__=='__main__': main()
