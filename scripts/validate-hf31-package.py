#!/usr/bin/env python3
from __future__ import annotations
import json,pathlib,re,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
RELEASE='FR-NAV1.20.0-HF3.1-CANDIDATE'
def need(c,m):
 if not c:print('HF31_PACKAGE_FAIL',m,file=sys.stderr);raise SystemExit(1)
def main():
 meta=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text('utf-8'))
 for k,v in [('release',RELEASE),('activeEdition','FRANKLIN_TN'),('profileCount',19103),('profileFactsChanged',False),('pricesChanged',False),('runtimeChanged',False),('checkoutChanged',False),('checkoutRemainsOpen',True)]:need(meta.get(k)==v,f'metadata {k}')
 indexes=sorted((ROOT/'dist').rglob('index.html'));need(len(indexes)==19355,f'index count {len(indexes)}')
 marker=RELEASE.encode()
 for p in indexes:need(marker in p.read_bytes(),f'release marker {p.relative_to(ROOT)}')
 profiles=sorted((ROOT/'dist/profiles').glob('*/index.html'));need(len(profiles)==19103,f'profile count {len(profiles)}')
 explorer=[]
 for p in indexes:
  s=p.read_text('utf-8')
  if 'data-community-explorer' in s:
   explorer.append(p);need('data-hf31-deep-language-runtime="1"' in s,f'deep runtime {p.relative_to(ROOT)}')
 need(len(explorer)>=50,f'explorer coverage {len(explorer)}')
 for f,key,value in [
  ('evidence/hf31/PUBLIC_LANGUAGE_ZERO_JARGON_REPORT.json','remainingHighConfidenceJargonMatches',0),
  ('evidence/hf31/SPANISH_LANGUAGE_FINAL_REPORT.json','remainingIssues',0),
  ('evidence/hf31/SPANISH_REGISTER_FINAL_REVIEW.json','remainingHighConfidenceInformalRegister',0),
 ]:
  d=json.loads((ROOT/f).read_text('utf-8'));need(d.get(key)==value and d.get('result')=='PASS',f'{f} not PASS/0')
 p=json.loads((ROOT/'evidence/hf31/PROFILE_RENDER_LANGUAGE_RECEIPT.json').read_text('utf-8'));need(p.get('result')=='PASS' and p.get('profileFactsChanged') is False,'profile render receipt')
 b=(ROOT/'dist/sports/bowling/index.html').read_text('utf-8');need('data-explorer-scope="sport:bowling"' in b and 'id="finder"' in b,'bowling functional contract')
 d=(ROOT/'dist/assets/hf31-deep-public.js').read_text('utf-8')
 for t in ['finder.previousElementSibling!==hero','Explore other sports and activities','hf31-explorer-controls-minimal','section.hidden=true','Manage your Franklin presence']:need(t in d,f'deep nav token {t}')
 r=(ROOT/'dist/assets/hf31-deep-language-runtime.js').read_text('utf-8');need('Franklin Family Entertainment Center provides bowling league information' in r,'bowling plain language runtime')
 u=(ROOT/'dist/assets/hf31-public.js').read_text('utf-8');need('function refineProfilePlainLanguage()' in u and 'refineProfilePlainLanguage();' in u,'profile render plain language')
 need((ROOT/'NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_20_0_HF31.md').is_file(),'next-version list missing')
 print(json.dumps({'result':'PASS','release':RELEASE,'publicIndexPages':19355,'profiles':19103,'deepExplorerPages':len(explorer),'publicJargonIssues':0,'spanishIssues':0,'profileSourceFactsChanged':False,'pricesChanged':False,'runtimeChanged':False},sort_keys=True))
if __name__=='__main__':main()
