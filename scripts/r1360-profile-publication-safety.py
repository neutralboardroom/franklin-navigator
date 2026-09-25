#!/usr/bin/env python3
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
DISC=sorted((DIST/'data'/'discovery').glob('profiles-*.json'));CLAIM=sorted((DIST/'data').glob('franklin-profiles-*.json'))
OUT=DIST/'data'/'profile-identity-safety.json'
TECH_RX=re.compile(r'(?:source coordinate|street address not asserted|exact coordinates retained|public irs filing address geocoded|assigned community|current named member/resource|provider address exact-matched|locality qualified|source-backed service area|service/location identity source-backed|\bPF\d+\b|current official directory listing)',re.I)
PF_RX=re.compile(r'\bPF\d+\b',re.I)
def norm_name(s):
 s=str(s or '').lower();s=re.sub(r'[^a-z0-9]+',' ',s);s=re.sub(r'\b(?:llc|inc|incorporated|corp|corporation|pc|pllc|ltd)\b',' ',s);return ' '.join(s.split())
def norm_addr(s):
 s=str(s or '').lower();s=re.sub(r'\b(?:suite|ste|unit|#)\s*[a-z0-9-]+\b',' ',s);s=re.sub(r'[^a-z0-9]+',' ',s);return ' '.join(s.split())
def is_technical(s):return bool(TECH_RX.search(str(s or '')))
def fallback(area):
 a=str(area or '').lower()
 if 'williamson' in a:return 'Williamson County, Tennessee'
 if 'nearby' in a or 'regional' in a:return 'Franklin area'
 return 'Franklin, Tennessee'
def public_location(raw,area):
 s=' '.join(str(raw or '').split())
 if not s:return fallback(area)
 for prefix in [r'^Public IRS filing address geocoded in Williamson County:\s*',r'^Official TDHS/TDOE provider address exact-matched by Census:\s*']:
  if re.search(prefix,s,re.I):
   v=re.sub(prefix,'',s,flags=re.I).strip(' .;—-');return v or fallback(area)
 s=re.sub(r'\s*[—;-]\s*(?:listed in Visit Franklin community guide|official school roster|locality qualified by the cited(?: current)? community directory|source-backed service area|service/location identity source-backed|regional service materially serving Franklin|department street address not asserted|current official directory listing for the assigned community).*$', '', s, flags=re.I)
 s=re.sub(r';?\s*street address not asserted(?: in this release)?\.?$', '', s, flags=re.I)
 s=re.sub(r'\s*[—;-]\s*exact coordinates retained.*$', '', s, flags=re.I);s=PF_RX.sub('',s);s=' '.join(s.split()).strip(' .;—-')
 return fallback(area) if not s or is_technical(s) else s
def score(r):
 return (0 if is_technical(r['loc']) else 100,30 if r.get('exact') else 0,12 if r.get('website') else 0,5 if r.get('phone') else 0,5 if r.get('email') else 0,3 if str(r['id']).startswith('FR-ORG-') else 0,-len(str(r['id'])))
def load_discovery():
 rows=[];docs={}
 for fp in DISC:
  j=json.loads(fp.read_text('utf-8'));docs[fp]=j
  for rr in j.get('records',[]):
   rows.append({'id':rr[0],'name':rr[1],'loc':rr[2],'cat':j['categories'][rr[3]],'type':j['types'][rr[4]],'area':j['areas'][rr[5]],'website':j['websites'][rr[6]] if rr[6]<len(j['websites']) else '','phone':rr[7] if len(rr)>7 else '','email':rr[8] if len(rr)>8 else '','exact':bool(rr[10]) if len(rr)>10 else False,'fp':fp,'raw':rr})
 return rows,docs
rows,docs=load_discovery();by_name={}
for r in rows:by_name.setdefault(norm_name(r['name']),[]).append(r)
previous={}
if OUT.exists():
 try:previous=json.loads(OUT.read_text('utf-8'))
 except Exception:previous={}
aliases=dict(previous.get('aliases') or {});holds=dict(previous.get('holds') or {})
aliases.update({'FR-ORG-adba2e46b06e6112':'FR-ORG-0086-the-factory-at-franklin'})
for group in by_name.values():
 addr_groups={}
 for r in group:
  if is_technical(r['loc']):continue
  a=norm_addr(r['loc'])
  if a:addr_groups.setdefault(a,[]).append(r)
 for ag in addr_groups.values():
  if len(ag)<2:continue
  canonical=max(ag,key=score)
  for r in ag:
   if r['id']!=canonical['id']:aliases.setdefault(r['id'],canonical['id'])
for group in by_name.values():
 normals=[r for r in group if not is_technical(r['loc'])];technical=[r for r in group if is_technical(r['loc'])]
 if normals and technical:
  for r in technical:
   if r['id'] not in aliases:holds[r['id']]={'reason':'AMBIGUOUS_SAME_NAME_TECHNICAL_LOCATION','name':r['name'],'candidateIds':[x['id'] for x in normals]}
for fp,j in docs.items():
 out=[]
 for rr in j.get('records',[]):
  if rr[0] in aliases or rr[0] in holds:continue
  rr[2]=public_location(rr[2],j['areas'][rr[5]]);out.append(rr)
 j['records']=out;fp.write_text(json.dumps(j,ensure_ascii=False,separators=(',',':'))+'\n','utf-8')
for fp in CLAIM:
 j=json.loads(fp.read_text('utf-8'));out=[]
 for r in j.get('records',[]):
  if r.get('i') in aliases or r.get('i') in holds:continue
  r['l']=public_location(r.get('l'),r.get('g'));out.append(r)
 j['records']=out;fp.write_text(json.dumps(j,ensure_ascii=False,separators=(',',':'))+'\n','utf-8')
for mp in [DIST/'data'/'discovery'/'manifest.json',DIST/'data'/'franklin-profiles-manifest.json']:
 if not mp.exists():continue
 j=json.loads(mp.read_text('utf-8'))
 if 'recordCount' in j:j['recordCount']=sum(len(v.get('records',[])) for v in docs.values()) if 'discovery' in str(mp) else sum(len(json.loads(p.read_text('utf-8')).get('records',[])) for p in CLAIM)
 if 'profileCount' in j:j['profileCount']=sum(len(json.loads(p.read_text('utf-8')).get('records',[])) for p in CLAIM)
 for ch in j.get('chunks',[]) if isinstance(j.get('chunks'),list) else []:
  file=ch.get('file','').lstrip('/');p=DIST/file.removeprefix('data/') if file.startswith('data/') else ROOT/file
  if not p.exists():p=DIST/'data'/Path(file).name
  if p.exists():
   try:
    n=len(json.loads(p.read_text('utf-8')).get('records',[]))
    for key in ('count','recordCount','profiles'):
     if key in ch:ch[key]=n
   except Exception:pass
 mp.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n','utf-8')
profile_root=DIST/'profiles';changed_html=0
for p in profile_root.glob('*/index.html'):
 pid=p.parent.name;text=p.read_text('utf-8',errors='replace');before=text;rec=next((r for r in rows if r['id']==pid),None)
 if rec:
  clean=public_location(rec['loc'],rec['area'])
  if rec['loc'] and clean!=rec['loc']:text=text.replace(rec['loc'],clean)
 if pid in aliases:
  target=aliases[pid];target_rec=next((r for r in rows if r['id']==target),None);name=(target_rec or rec or {'name':'this profile'})['name'];url=f'/profiles/{target}/'
  body=f'<main id="main"><section class="section"><div class="wrap narrow"><div class="eyebrow">Profile identity updated</div><h1>{name}</h1><p>This listing has been reconciled with the canonical Franklin Navigator profile for this organization.</p><p><a class="button primary" href="{url}">Open the current profile</a></p></div></section></main>'
  text=re.sub(r'<main id="main">[\s\S]*?</main>',body,text,count=1);text=re.sub(r'<link href="https://franklinnavigator\.com/profiles/[^"]+/" rel="canonical"/?>',f'<link href="https://franklinnavigator.com{url}" rel="canonical"/>',text,count=1)
  if '<meta name="robots"' not in text:text=text.replace('</head>',f'<meta name="robots" content="noindex,follow"/><meta http-equiv="refresh" content="0;url={url}"/></head>',1)
 elif pid in holds:
  replacement='<section id="manage"><h2>Profile identity review</h2><p>Franklin Navigator is reconciling this listing with another profile that may represent the same organization. Management access is temporarily unavailable so authority cannot be attached to the wrong identity.</p><div class="actions"><a class="button" href="/corrections/?profile='+pid+'">Report incorrect profile information</a></div></section>'
  text=re.sub(r'<section id="manage">[\s\S]*?</section>',replacement,text,count=1)
  if '<meta name="robots"' not in text:text=text.replace('</head>','<meta name="robots" content="noindex,follow"/></head>',1)
 if text!=before:p.write_text(text,'utf-8');changed_html+=1
payload={'schemaVersion':'franklin.profile-identity-safety.v1','community':'FRANKLIN_TN','aliases':aliases,'holds':holds,'counts':{'sourceProfiles':max(len(rows),int((previous.get('counts') or {}).get('sourceProfiles',0) or 0)),'aliases':len(aliases),'holds':len(holds),'publicDiscoveryProfiles':sum(len(v.get('records',[])) for v in docs.values()),'profileHtmlChanged':max(changed_html,int((previous.get('counts') or {}).get('profileHtmlChanged',0) or 0))},'policy':{'alias':'redirect_to_canonical','hold':'not_searchable_or_claimable_until_identity_review'},'source':'LOCAL_COMMUNITY_PLATFORM_R1360_FAIL_CLOSED_PUBLICATION_SAFETY'}
OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2,sort_keys=True)+'\n','utf-8');print(json.dumps(payload['counts'],sort_keys=True))
