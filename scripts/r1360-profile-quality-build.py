#!/usr/bin/env python3
import json, hashlib, html, os, re, sys, gzip, base64
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
OVERLAY_PATH=ROOT/'r1360-input'/'pf1537-consumer-overlay.json'
RUNTIME=ROOT/'runtime'/'franklin-membership'
TARGET='FR-NAV1.30.60-HF3.13.42'

def bsha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write_json(p,obj):
    Path(p).write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')

def main():
    if OVERLAY_PATH.exists():
        ov=json.loads(OVERLAY_PATH.read_text(encoding='utf-8'))
    else:
        packed=(ROOT/'r1360-input'/'pf1537-consumer-overlay.json.gz.b64').read_text(encoding='utf-8').strip()
        ov=json.loads(gzip.decompress(base64.b64decode(packed)).decode('utf-8'))
    if ov.get('profileFactoryVersion')!='FR-PF-PLATFORM-15.37' or ov.get('targetRelease')!=TARGET:
        raise SystemExit('R1360 overlay identity mismatch')
    aliases=dict(ov['aliases']); holds=set(ov['reviewHeldProfileIds']); corrections=dict(ov['unsafeLocationCorrections'])
    if len(aliases)!=99 or len(holds)!=2: raise SystemExit('R1360 overlay counts mismatch')

    # Read old locations before mutating chunks so related-card copies can be scrubbed everywhere.
    old_by_id={}
    chunk_paths=sorted((DIST/'data').glob('franklin-profiles-[0-9][0-9].json'))
    for p in chunk_paths:
        d=json.loads(p.read_text(encoding='utf-8'))
        for row in d.get('records',[]): old_by_id[row.get('i')]=row.get('l') or ''

    literal_replacements={}
    for pid,meta in corrections.items():
        old=old_by_id.get(pid,'')
        new=meta.get('safe_location') or 'Franklin, Tennessee'
        if old and old!=new:
            prior=literal_replacements.get(old)
            literal_replacements[old]=new if not prior or prior==new else 'Franklin, Tennessee'

    public_phrase_replacements={
        "Current named resource in City of Franklin's official public sitemap/directory; street address is not asserted by the cited source.":'Franklin, Tennessee',
        "Current named resource in the assigned community's official public directory; street address is not asserted by the cited source.":'Franklin, Tennessee',
        "Current named member/resource serving the Williamson, Inc. directory community; a street address is not asserted by the cited source.":'Franklin, Tennessee',
        "Current official directory listing for the assigned community; exact street address not asserted by the cited source.":'Franklin, Tennessee',
    }

    # Canonical public projection: filter aliases/review holds and apply PF-approved safe locations.
    total=0; chunks=[]
    for p in chunk_paths:
        d=json.loads(p.read_text(encoding='utf-8'))
        rows=[]
        for row in d.get('records',[]):
            pid=row.get('i')
            if pid in aliases or pid in holds: continue
            if pid in corrections:
                row=dict(row); row['l']=corrections[pid].get('safe_location') or 'Franklin, Tennessee'
            rows.append(row)
        d['records']=rows
        write_json(p,d)
        chunks.append({'file':'/data/'+p.name,'records':len(rows),'bytes':p.stat().st_size,'sha256':bsha(p)})
        total+=len(rows)
    expected=ov['expected']['eligibleBasePublicCountAfter']
    if total!=expected: raise SystemExit(f'public profile count {total} != {expected}')

    manifest_path=DIST/'data'/'franklin-profiles-manifest.json'
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest.update({
        'sourceRelease':'FR-PF-PLATFORM-15.37',
        'recordCount':total,
        'heldInPublicProjection':len(holds),
        'sourceSha256':ov['readySnapshotSha256'],
        'handoffSha256':ov['publicDisplayHandoffSha256'],
        'r1360AliasHandoffSha256':ov['aliasHandoffSha256'],
        'r1360ProfileFactoryArtifactSha256':ov['profileFactoryArtifactSha256'],
        'r1360TargetRelease':TARGET,
        'r1360AliasCount':len(aliases),
        'chunks':chunks
    })
    write_json(manifest_path,manifest)

    alias_public={'schema':'franklin.profile-aliases.r1360.v1','community':'FRANKLIN_TN','release':TARGET,'profileFactoryVersion':'FR-PF-PLATFORM-15.37','profileFactoryArtifactSha256':ov['profileFactoryArtifactSha256'],'aliases':aliases,'reviewHeldProfileIds':sorted(holds)}
    write_json(DIST/'data'/'profile-aliases-r1360.json',alias_public)

    # Public pages: safe location text in own profiles + related cards.
    alias_token_re=re.compile('|'.join(re.escape(x) for x in aliases))
    profile_root=DIST/'profiles'
    changed_html=0
    for page in profile_root.glob('*/index.html'):
        pid=page.parent.name
        text=page.read_text(encoding='utf-8')
        original=text
        if pid in aliases:
            canonical=aliases[pid]
            target=f'/profiles/{canonical}/'
            text=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://franklinnavigator.com{target}"><meta http-equiv="refresh" content="0;url={target}"><title>Profile moved | Franklin Navigator</title></head><body><main><h1>This profile has moved.</h1><p>Franklin Navigator now uses one canonical public profile for this entity.</p><p><a href="{target}">Open the current profile</a></p></main><script>location.replace({json.dumps(target)})</script></body></html>'''
        elif pid in holds:
            text='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Profile under review | Franklin Navigator</title></head><body><main><h1>This profile is under review.</h1><p>It is not currently available as a public claim or membership profile.</p><p><a href="/directory/">Return to Find Local</a></p></main></body></html>'''
        else:
            for old,new in literal_replacements.items():
                if old in text: text=text.replace(old,new)
                old_esc=html.escape(old,quote=True)
                if old_esc!=old and old_esc in text: text=text.replace(old_esc,html.escape(new,quote=True))
            for old,new in public_phrase_replacements.items(): text=text.replace(old,new)
            text=alias_token_re.sub(lambda m:aliases[m.group(0)],text)
            for held in holds:
                text=re.sub(r'<p><a href="/profiles/'+re.escape(held)+r'/">.*?</p>','',text,flags=re.S)
        if text!=original:
            page.write_text(text,encoding='utf-8'); changed_html+=1

    # Runtime scope mirrors the same canonical public identity boundary.
    scope_path=RUNTIME/'data'/'member-profile-scope.json'
    scope=json.loads(scope_path.read_text(encoding='utf-8'))
    profiles=scope.get('profiles',{})
    for pid in list(profiles):
        if pid in aliases or pid in holds: profiles.pop(pid,None)
    protected_extra=1 if 'FR-ORG-b00c0ace7943973c' in profiles else 0
    if len(profiles)!=expected+protected_extra: raise SystemExit(f'runtime canonical scope {len(profiles)} != {expected}+{protected_extra}')
    scope['profiles']=profiles; scope['profileCount']=len(profiles); scope['sourcePublicCommit']='R1360_PF15.37_CANONICAL_PROJECTION'
    write_json(scope_path,scope)
    write_json(RUNTIME/'data'/'profile-aliases-r1360.json',alias_public)

    # Verification scans: no alias/held profiles in chunks and no PF unsafe pattern in public profile HTML/data.
    unsafe=re.compile(ov['unsafePattern'],re.I)
    unsafe_hits=[]
    for p in chunk_paths:
        txt=p.read_text(encoding='utf-8')
        if unsafe.search(txt): unsafe_hits.append(str(p.relative_to(ROOT)))
    for page in profile_root.glob('*/index.html'):
        txt=page.read_text(encoding='utf-8')
        if unsafe.search(txt): unsafe_hits.append(str(page.relative_to(ROOT)))
    if unsafe_hits:
        raise SystemExit('unsafe public display hits remain: '+', '.join(unsafe_hits[:20]))
    print(json.dumps({'ok':True,'release':TARGET,'profileFactory':'FR-PF-PLATFORM-15.37','canonicalPublicProfiles':total,'aliases':len(aliases),'reviewHeld':len(holds),'unsafePublicDisplayHitsAfter':0,'changedProfilePages':changed_html},sort_keys=True))

if __name__=='__main__': main()
