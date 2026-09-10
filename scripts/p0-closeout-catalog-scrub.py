#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, re

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist/data'
patterns=[
    re.compile(r'\$5/month',re.I),
    re.compile(r'\$50/year',re.I),
    re.compile(r'\$90\s*(?:/|for)\s*(?:three|36)',re.I),
    re.compile(r'\$120',re.I),
    re.compile(r'franklin_community_member_monthly_v5'),
    re.compile(r'franklin_community_member_annual_v5'),
    re.compile(r'franklin_charter_member_36_month_v[56]')
]
def stale(value):
    return isinstance(value,str) and any(rx.search(value) for rx in patterns)
def contains_stale(value):
    if stale(value): return True
    if isinstance(value,list): return any(contains_stale(v) for v in value)
    if isinstance(value,dict): return any(stale(k) or contains_stale(v) for k,v in value.items())
    return False

en_path=DIST/'r37-en-public-strings.json'
en=json.loads(en_path.read_text('utf-8'))
en['strings']=[row for row in en.get('strings',[]) if not contains_stale(row)]
en['count']=len(en['strings'])
for key in list(en):
    if key not in {'strings','count'} and contains_stale(en[key]): en.pop(key,None)
en_path.write_text(json.dumps(en,ensure_ascii=False,indent=2,sort_keys=True)+'\n','utf-8')

es_path=DIST/'r37-es-public-strings.json'
es=json.loads(es_path.read_text('utf-8'))
es['translations']={k:v for k,v in es.get('translations',{}).items() if not stale(k) and not contains_stale(v)}
es['count']=len(es['translations'])
for key in list(es):
    if key not in {'translations','count'} and contains_stale(es[key]): es.pop(key,None)
es['sourceCount']=en['count']
es['sourceCatalogSha256']=hashlib.sha256(en_path.read_bytes()).hexdigest()
es_path.write_text(json.dumps(es,ensure_ascii=False,indent=2,sort_keys=True)+'\n','utf-8')

for p in (en_path,es_path):
    text=p.read_text('utf-8')
    leftovers=[rx.pattern for rx in patterns if rx.search(text)]
    if leftovers: raise SystemExit(f'PUBLIC_CATALOG_SCRUB_INCOMPLETE:{p.name}:{leftovers}')
print(json.dumps({'result':'PASS','englishCount':en['count'],'spanishCount':es['count'],'retiredPricePatterns':0}))
