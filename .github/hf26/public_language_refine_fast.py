from pathlib import Path
src=Path('transport/.github/hf26/public_language_refine.py').read_text()
old="""# Recompute changed-file scope against immutable base after all safe refinements.
changes={}
for p in sorted(DIST.rglob('*')):
    if not p.is_file():continue
    rel=p.relative_to(ROOT).as_posix()
    try:before=base_bytes(rel)
    except subprocess.CalledProcessError:before=b''
    after=p.read_bytes()
    if before!=after:changes[rel]={'before':hashlib.sha256(before).hexdigest(),'after':hashlib.sha256(after).hexdigest()}
ev=ROOT/'evidence';ev.mkdir(exist_ok=True);(ev/'HF26_LANGUAGE_PATCH_SCOPE.json').write_text(json.dumps({'schemaVersion':'franklin.hf26.language-patch-scope.v2','baseCommit':'01aecafbfe16202d9d5a80eb6b97443c9ee305ad','changedFileCount':len(changes),'changedFiles':changes,'profileFactsChanged':False,'runtimeChanged':False,'pricesChanged':False,'commerceChanged':False,'spanishVoice':'CONTEXT_SAFE_USTED'},indent=2)+'\\n')
print(json.dumps({'refinedChangedFiles':len(changes)}))
"""
new="""# Recompute changed-file scope efficiently from the immutable checkout's Git index.
changed_names=subprocess.check_output(['git','-C',str(ROOT),'diff','--name-only','HEAD','--','dist'],text=True).splitlines()
changes={rel:{'after':hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()} for rel in sorted(changed_names) if (ROOT/rel).is_file()}
ev=ROOT/'evidence';ev.mkdir(exist_ok=True);(ev/'HF26_LANGUAGE_PATCH_SCOPE.json').write_text(json.dumps({'schemaVersion':'franklin.hf26.language-patch-scope.v3','baseCommit':'01aecafbfe16202d9d5a80eb6b97443c9ee305ad','changedFileCount':len(changes),'changedFiles':changes,'profileFactsChanged':False,'runtimeChanged':False,'pricesChanged':False,'commerceChanged':False,'spanishVoice':'CONTEXT_SAFE_USTED','scopeRule':'git diff HEAD -- dist; after hashes for every changed public file'},indent=2)+'\\n')
print(json.dumps({'refinedChangedFiles':len(changes)}))
"""
assert old in src,'expected slow scope block not found'
exec(compile(src.replace(old,new),'public_language_refine_fast','exec'))
