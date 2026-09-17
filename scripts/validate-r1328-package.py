#!/usr/bin/env python3
import argparse, hashlib, json, os, pathlib, subprocess, tempfile, zipfile

MANIFEST='RELEASE_MANIFEST__R1328.json'
def sha256_bytes(data): return hashlib.sha256(data).hexdigest()
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('zip_path'); args=ap.parse_args(); zp=pathlib.Path(args.zip_path)
    if not zp.is_file(): raise SystemExit('package missing')
    with zipfile.ZipFile(zp,'r') as z:
        infos=z.infolist(); names=[i.filename for i in infos]
        if len(names)!=len(set(names)): raise SystemExit('duplicate archive member')
        for i in infos:
            p=pathlib.PurePosixPath(i.filename)
            if p.is_absolute() or '..' in p.parts or '\\' in i.filename: raise SystemExit(f'unsafe archive path: {i.filename}')
            mode=(i.external_attr>>16)&0o170000
            if mode not in (0,0o100000): raise SystemExit(f'non-regular archive member: {i.filename}')
        if MANIFEST not in names: raise SystemExit('release manifest missing')
        manifest=json.loads(z.read(MANIFEST))
        expected={m['path']:m for m in manifest['members']}
        actual=set(names)-{MANIFEST}
        if actual!=set(expected): raise SystemExit('manifest/member set mismatch')
        for name,m in expected.items():
            data=z.read(name)
            if len(data)!=m['bytes'] or sha256_bytes(data)!=m['sha256']: raise SystemExit(f'manifest mismatch: {name}')
        with tempfile.TemporaryDirectory(prefix='r1328-extract-') as td:
            root=pathlib.Path(td); z.extractall(root)
            subprocess.run(['node','tests/r1327-screenshot-refinement.cjs'],cwd=root,check=True)
            subprocess.run(['node','tests/r1328-quality-contract.cjs'],cwd=root,check=True)
    print(json.dumps({'result':'PASS','archive':zp.name,'members':len(names),'manifestMembers':len(expected),'cleanExtraction':True},sort_keys=True))
if __name__=='__main__': main()
