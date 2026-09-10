#!/usr/bin/env python3
from __future__ import annotations
import collections, json, pathlib, re, subprocess, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE='736e3cfb5ae6be08758a442ce7bb2f8cedf8b9f0'
RELEASE='FR-NAV1.20.0-HF3.1-CANDIDATE'
META_RE=re.compile(r'(<meta\s+name=["\']franklin-release["\']\s+content=["\'])[^"\']+(["\'][^>]*>)',re.I)
META_RE2=re.compile(r'(<meta\s+content=["\'])[^"\']+(["\']\s+name=["\']franklin-release["\'][^>]*>)',re.I)
ALLOWED_DIST_ASSETS={
 'dist/assets/hf31-public.js','dist/assets/hf31-public.css','dist/assets/hf31-task-save.css',
 'dist/assets/hf31-deep-public.js','dist/assets/hf31-deep-public.css','dist/assets/hf31-deep-language-runtime.js',
 'dist/assets/community-explorer.js','dist/assets/r37.css','dist/assets/r37-i18n.js'
}
BANNED_PUBLIC_PATTERNS=[
 r'\bcanonical profiles?\b',r'\bsource routes?\b',r'\bresponsible-source\b',r'\bstable local routes?\b',r'\bfollow-through plan\b',
 r'\bconflicts? suppressed\b',r'\bfail-closed\b',r'\bqualified successor\b',r'\bconsumer acceptance\b',r'\bcurrent pointer\b',
 r'\bprofile factory\b',r'\blocal investigator\b',r'\bPF74\b',r'\bruntime pair\b',r'\bproducer candidate\b',r'\bexact artifact\b',
 r'\bsource-backed\b',r'\bcoverage floor\b',r'\bcurrent evidence state\b',r'\bevidence window\b',
 r'perfiles? canónicos?',r'rutas? de fuentes?',r'ventana de evidencia',r'fuentes responsables',r'rutas locales estables',
 r'aceptación del consumidor',r'puntero actual',r'investigador local',r'carga útil',r'respaldad[oa]s? por fuentes'
]

def run(*args:str)->str:return subprocess.check_output(list(args),cwd=ROOT,text=True)
def git_show(ref:str,path:str)->str:return run('git','show',f'{ref}:{path}')
def fail(msg:str):print('HF31_EXPANDED_FAIL',msg,file=sys.stderr);raise SystemExit(1)
def release_normalized(text:str)->str:
 text=META_RE.sub(r'\1__RELEASE__\2',text)
 text=META_RE2.sub(r'\1__RELEASE__\2',text)
 return text

def visible_body(raw:str)->str:
 m=re.search(r'<body\b[^>]*>([\s\S]*?)</body>',raw,re.I);raw=m.group(1) if m else raw
 raw=re.sub(r'<script\b[^>]*>[\s\S]*?</script>',' ',raw,flags=re.I)
 raw=re.sub(r'<style\b[^>]*>[\s\S]*?</style>',' ',raw,flags=re.I)
 raw=re.sub(r'<noscript\b[^>]*>[\s\S]*?</noscript>',' ',raw,flags=re.I)
 raw=re.sub(r'<[^>]+>',' ',raw)
 return re.sub(r'\s+',' ',raw).strip()

def main():
 head=run('git','rev-parse','HEAD').strip()
 merge=run('git','merge-base',BASE,head).strip()
 if merge!=BASE:fail(f'lineage merge-base {merge} != {BASE}')
 changed=[x for x in run('git','diff','--name-only',f'{BASE}..{head}').splitlines() if x]
 if any(p.startswith(('dist/data/','server/','runtime/')) for p in changed):fail('protected data/server/runtime path changed')
 for p in changed:
  if p.startswith('dist/assets/') and p not in ALLOWED_DIST_ASSETS:fail(f'unapproved public asset mutation: {p}')
  if p.startswith('dist/') and not (p.endswith('.html') or p in ALLOWED_DIST_ASSETS):fail(f'unapproved dist mutation: {p}')

 indexes=sorted((ROOT/'dist').rglob('index.html'))
 if len(indexes)!=19355:fail(f'index page count {len(indexes)} != 19355')
 marker=f'<meta name="franklin-release" content="{RELEASE}"'
 marker_alt=f'<meta content="{RELEASE}" name="franklin-release"'
 bad=[]
 for p in indexes:
  s=p.read_text('utf-8')
  if marker not in s and marker_alt not in s:bad.append(p.relative_to(ROOT).as_posix())
 if bad:fail(f'{len(bad)} index pages lack exact HF3.1 marker; sample={bad[:3]}')

 profiles=sorted((ROOT/'dist/profiles').glob('*/index.html'))
 if len(profiles)!=19103:fail(f'profile page count {len(profiles)} != 19103')
 drift=[]
 for p in profiles:
  rel=p.relative_to(ROOT).as_posix();current=p.read_text('utf-8')
  try:base=git_show(BASE,rel)
  except subprocess.CalledProcessError:drift.append(rel);continue
  if release_normalized(current)!=release_normalized(base):drift.append(rel)
  if len(drift)>=10:break
 if drift:fail(f'profile fact/content drift beyond release marker: {drift}')

 # Membership/price token invariance across public membership/business surfaces.
 price_paths=[p for p in changed if p.endswith('.html') and any(x in p for x in ('membership','business-dashboard','business/'))]
 amount_re=re.compile(r'\$\s*\d+(?:\.\d{1,2})?')
 for rel in price_paths:
  current=(ROOT/rel).read_text('utf-8')
  try:base=git_show(BASE,rel)
  except subprocess.CalledProcessError:continue
  if collections.Counter(amount_re.findall(current))!=collections.Counter(amount_re.findall(base)):fail(f'price token drift: {rel}')

 spanish=json.loads((ROOT/'evidence/hf31/SPANISH_LANGUAGE_FINAL_REPORT.json').read_text('utf-8'))
 if spanish.get('result')!='PASS' or spanish.get('remainingIssues')!=0:fail('Spanish final language gate not clean')
 jargon_path=ROOT/'evidence/hf31/PUBLIC_LANGUAGE_ZERO_JARGON_REPORT.json'
 if not jargon_path.exists():fail('zero-jargon report missing')
 jargon=json.loads(jargon_path.read_text('utf-8'))
 if jargon.get('result')!='PASS' or jargon.get('remainingHighConfidenceJargonMatches')!=0:fail('public zero-jargon gate not clean')

 explorer=[]
 for p in indexes:
  s=p.read_text('utf-8')
  if 'data-community-explorer' in s:
   explorer.append(p)
   if 'data-hf31-deep-language-runtime="1"' not in s:fail(f'deep runtime missing: {p.relative_to(ROOT)}')
 if len(explorer)<40:fail(f'explorer coverage unexpectedly low: {len(explorer)}')

 bowling=(ROOT/'dist/sports/bowling/index.html').read_text('utf-8')
 if 'data-explorer-scope="sport:bowling"' not in bowling or 'id="finder"' not in bowling:fail('bowling functional source contract missing')
 deep=(ROOT/'dist/assets/hf31-deep-public.js').read_text('utf-8')
 for token in ['finder.previousElementSibling!==hero','Explore other sports and activities','hf31-explorer-controls-minimal','section.hidden=true','Manage your Franklin presence']:
  if token not in deep:fail(f'deep-page navigation contract missing token: {token}')
 deep_runtime=(ROOT/'dist/assets/hf31-deep-language-runtime.js').read_text('utf-8')
 if 'First-party Franklin venue route' not in deep_runtime or 'Franklin Family Entertainment Center provides bowling league information' not in deep_runtime:fail('dynamic bowling plain-language normalization missing')

 # Static body scan for the highest-confidence implementation/governance phrases.
 suspects=[]
 for p in indexes:
  text=visible_body(p.read_text('utf-8'))
  for pat in BANNED_PUBLIC_PATTERNS:
   if re.search(pat,text,re.I):suspects.append((p.relative_to(ROOT).as_posix(),pat));break
  if len(suspects)>=10:break
 if suspects:fail(f'high-confidence internal language remains: {suspects}')

 meta=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text('utf-8'))
 for key,val in [('release',RELEASE),('activeEdition','FRANKLIN_TN'),('profileCount',19103),('profileFactsChanged',False),('pricesChanged',False),('runtimeChanged',False),('checkoutChanged',False)]:
  if meta.get(key)!=val:fail(f'metadata mismatch {key}={meta.get(key)!r}')
 print(json.dumps({'result':'PASS','head':head,'changedFiles':len(changed),'publicIndexPages':len(indexes),'profilePagesNoFactDrift':len(profiles),'explorerPagesDeepRuntimeProtected':len(explorer),'spanishIssues':0,'publicJargonIssues':0,'protectedRuntimeDataChanges':0},sort_keys=True))
if __name__=='__main__':main()
