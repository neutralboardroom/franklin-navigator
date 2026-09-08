from pathlib import Path
import base64,lzma,json,hashlib,sys
sha=lambda b:hashlib.sha256(b).hexdigest()
root=Path(sys.argv[1]).resolve()
transport=Path(__file__).with_name('patch.b64')
raw=base64.b64decode(transport.read_text().strip(),validate=True)
assert sha(raw)=='d7fa57a3794e4f50bf173d887f1b98cc8d4fa4138a024b906df9d6b90891ecab'
d=json.loads(lzma.decompress(raw))
assert d['schema']=='franklin.runtime.password-recovery-closeout.v1'
assert d['base']=='a9c918b656ced6386b1af604fde51d4a7e88d3b9'
production={}
ci_only={}
for n,o in d['files'].items():
    p=(root/n).resolve(); assert p.is_relative_to(root)
    is_ci_test=n.startswith('test/')
    if 'baseSha256' in o and not (is_ci_test and not p.exists()):
        assert p.exists() and sha(p.read_bytes())==o['baseSha256'],n
    elif 'baseSha256' not in o:
        assert not p.exists(),n
    b=o['text'].encode(); assert sha(b)==o['sha256'],n
    p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(b)
    (ci_only if is_ci_test else production)[n]=o['sha256']
ev=root/'evidence'; ev.mkdir(exist_ok=True)
(ev/'PASSWORD_RECOVERY_SOURCE_BINDING.json').write_text(json.dumps({'base':d['base'],'patchSha256':sha(raw),'productionFiles':production,'ciOnlyTestFiles':ci_only,'commerceEnabled':False,'financialMutations':0,'authorityTransfer':False},indent=2)+'\n')
print(json.dumps({'result':'PASS','productionFiles':len(production),'ciOnlyTestFiles':len(ci_only),'patchSha256':sha(raw)}))
