#!/usr/bin/env python3
from pathlib import Path
import argparse, html, re, hashlib, json
ROOT=Path(__file__).resolve().parents[1]
PROFILE_ROOT=ROOT/'dist/profiles'
CSS_PATH=ROOT/'dist/assets/hf36.css'
BROAD=[
    'Downtown Business or Organization','Local Business','Business or Organization','Local Organization or Place',
    'Current Regional Chamber Member','Professional Services','Health and Medical','Shopping','Corporate Office',
    'Unknown or Unclassified Nonprofit','Education','Human Services'
]
def normalized(v): return re.sub(r'\s+',' ',html.unescape(v or '')).strip().lower()
def record(text):
    m=re.search(r'<body[^>]*\bdata-profile-id="([^"]+)"',text,re.I); pid=html.unescape(m.group(1)).strip() if m else ''
    m=re.search(r'<div[^>]*class="[^"]*\beyebrow\b[^"]*"[^>]*>(.*?)</div>',text,re.I|re.S)
    cat=normalized(re.sub(r'<[^>]+>',' ',m.group(1)) if m else '')
    related='hf35-competitor-card' in text and ('Related local profiles' in text or 'Similar local profiles' in text)
    return pid,cat,related

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--check',action='store_true'); args=ap.parse_args()
    broad={normalized(x) for x in BROAD}; ids=[]
    for p in sorted(PROFILE_ROOT.glob('*/index.html')):
        text=p.read_text(encoding='utf-8',errors='ignore')
        pid,cat,related=record(text)
        if pid and related and cat in broad:
            ids.append(pid)
            if '/assets/hf36.css' not in text: raise SystemExit(f'R1350_SHARED_CSS_MISSING {pid}')
            label=next(x for x in BROAD if normalized(x)==cat)
            encoded=label.replace(' ','%20')
            if not re.search(r'category='+re.escape(encoded), text, re.I): raise SystemExit(f'R1350_BREADCRUMB_BINDING_MISSING {pid} {label}')
    if not ids: raise SystemExit('R1350_BROAD_PROFILE_SET_EMPTY')
    css=CSS_PATH.read_text(encoding='utf-8')
    for cat in BROAD:
        encoded=cat.replace(' ','%20')
        token=f'body.hf35-profile:has(.breadcrumbs a[href*="category={encoded}" i])'
        if token not in css: raise SystemExit(f'R1350_CATEGORY_GUARD_MISSING {cat}')
    if 'data-related-relevance="qualified-override"' not in css: raise SystemExit('R1350_QUALIFIED_OVERRIDE_EXCEPTION_MISSING')
    daddy='FR-ORG-305366afb36e-daddy-s-dogs'; mlrose='FR-ORG-f6a218bfcaea-m-l-rose-craft-beer-and-burgers'
    if daddy not in ids: raise SystemExit('R1350_DADDYS_DOGS_NOT_IN_BROAD_SET')
    if mlrose in ids: raise SystemExit('R1350_SPECIFIC_CATEGORY_OVERHIDDEN')
    meta=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text(encoding='utf-8'))
    if meta.get('release')=='FR-NAV1.30.50-HF3.13.32' and len(ids)!=1184:
        raise SystemExit(f'R1350_RELEASE_MEASUREMENT_DRIFT expected=1184 actual={len(ids)}')
    digest=hashlib.sha256(('\n'.join(ids)).encode()).hexdigest()
    print({'result':'PASS','mappedBroadProfiles':len(ids),'mapSha256':digest,'specificCategoryControl':mlrose})
if __name__=='__main__': main()
