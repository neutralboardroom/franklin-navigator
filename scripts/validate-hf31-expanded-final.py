#!/usr/bin/env python3
from __future__ import annotations
import collections,html,json,pathlib,re,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE='736e3cfb5ae6be08758a442ce7bb2f8cedf8b9f0'
RELEASE='FR-NAV1.20.0-HF3.1-CANDIDATE'
META_RE=re.compile(r'(<meta\s+name=["\']franklin-release["\']\s+content=["\'])[^"\']+(["\'][^>]*>)',re.I)
META_RE2=re.compile(r'(<meta\s+content=["\'])[^"\']+(["\']\s+name=["\']franklin-release["\'][^>]*>)',re.I)
ALLOWED_ASSETS={
'dist/assets/hf31-public.js','dist/assets/hf31-public.css','dist/assets/hf31-task-save.css','dist/assets/hf31-deep-public.js','dist/assets/hf31-deep-public.css','dist/assets/hf31-deep-language-runtime.js','dist/assets/community-explorer.js','dist/assets/r37.css','dist/assets/r37-i18n.js'}
BANNED=[r'\bcanonical profiles?\b',r'\bsource routes?\b',r'\bresponsible-source\b',r'\bstable local routes?\b',r'\bfollow-through plan\b',r'\bconflicts? suppressed\b',r'\bfail-closed\b',r'\bqualified successor\b',r'\bconsumer acceptance\b',r'\bcurrent pointer\b',r'\bprofile factory\b',r'\blocal investigator\b',r'\bPF74\b',r'\bruntime pair\b',r'\bproducer candidate\b',r'\bexact artifact\b',r'\bsource-backed\b',r'\bcoverage floor\b',r'\bcurrent evidence state\b',r'\bevidence window\b',r'perfiles? canónicos?',r'rutas? de fuentes?',r'ventana de evidencia',r'fuentes responsables',r'rutas locales estables',r'aceptación del consumidor',r'puntero actual',r'investigador local',r'carga útil',r'respaldad[oa]s? por fuentes']

def run(*args):return subprocess.check_output(args,cwd=ROOT,text=True)
def fail(m):print('HF31_EXPANDED_FINAL_FAIL',m,file=sys.stderr);raise SystemExit(1)
def norm_release(s):s=META_RE.sub(r'\1__RELEASE__\2',s);return META_RE2.sub(r'\1__RELEASE__\2',s)
def body_text(raw):
 m=re.search(r'<body\b[^>]*>([\s\S]*?)</body>',raw,re.I);raw=m.group(1) if m else raw
 raw=re.sub(r'<script\b[^>]*>[\s\S]*?</script>|<style\b[^>]*>[\s\S]*?</style>|<noscript\b[^>]*>[\s\S]*?</noscript>',' ',raw,flags=re.I)
 return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',raw))).strip()
def main():
 head=run('git','rev-parse','HEAD').strip();merge=run('git','merge-base',BASE,head).strip()
 if merge!=BASE:fail('HF3.0 is not merge base')
 changed=[x for x in run('git','diff','--name-only',f'{BASE}..{head}').splitlines() if x]
 if any(x.startswith(('dist/data/','server/','runtime/')) for x in changed):fail('protected data/server/runtime mutation')
 for x in changed:
  if x.startswith('dist/assets/') and x not in ALLOWED_ASSETS:fail(f'unapproved asset mutation {x}')
  if x.startswith('dist/') and not (x.endswith('.html') or x in ALLOWED_ASSETS):fail(f'unapproved dist mutation {x}')
 indexes=sorted((ROOT/'dist').rglob('index.html'))
 if len(indexes)!=19355:fail(f'index count {len(indexes)}')
 for p in indexes:
  s=p.read_text('utf-8')
  if f'name="franklin-release" content="{RELEASE}"' not in s and f'content="{RELEASE}" name="franklin-release"' not in s:fail(f'release marker mismatch {p.relative_to(ROOT)}')
 profiles=sorted((ROOT/'dist/profiles').glob('*/index.html'))
 if len(profiles)!=19103:fail(f'profile count {len(profiles)}')
 drift=[]
 for p in profiles:
  rel=p.relative_to(ROOT).as_posix();base=run('git','show',f'{BASE}:{rel}');cur=p.read_text('utf-8')
  if norm_release(base)!=norm_release(cur):drift.append(rel)
  if len(drift)>=5:break
 if drift:fail(f'profile source drift beyond release marker {drift}')
 # Preserve all numeric membership pricing tokens on changed commercial pages.
 amount=re.compile(r'\$\s*\d+(?:\.\d{1,2})?')
 for rel in changed:
  if not rel.endswith('.html') or not any(k in rel for k in ('membership','business-dashboard','business/')):continue
  try:base=run('git','show',f'{BASE}:{rel}')
  except subprocess.CalledProcessError:continue
  if collections.Counter(amount.findall(base))!=collections.Counter(amount.findall((ROOT/rel).read_text('utf-8'))):fail(f'price token drift {rel}')
 # Public static jargon gate excludes immutable profile source HTML; profile render cleanup is separately required.
 static=[]
 for p in indexes:
  rel=p.relative_to(ROOT).as_posix()
  if rel.startswith('dist/profiles/'):continue
  text=body_text(p.read_text('utf-8'))
  for pat in BANNED:
   if re.search(pat,text,re.I):static.append((rel,pat));break
  if len(static)>=5:break
 if static:fail(f'public jargon remains {static}')
 jargon=json.loads((ROOT/'evidence/hf31/PUBLIC_LANGUAGE_ZERO_JARGON_REPORT.json').read_text('utf-8'))
 if jargon.get('result')!='PASS' or jargon.get('remainingHighConfidenceJargonMatches')!=0:fail('zero-jargon report not PASS/0')
 profile_lang=json.loads((ROOT/'evidence/hf31/PROFILE_RENDER_LANGUAGE_RECEIPT.json').read_text('utf-8'))
 if profile_lang.get('result')!='PASS' or profile_lang.get('profileFactsChanged') is not False:fail('profile render language receipt invalid')
 sp=json.loads((ROOT/'evidence/hf31/SPANISH_REGISTER_FINAL_REVIEW.json').read_text('utf-8'))
 if sp.get('result')!='PASS' or sp.get('remainingHighConfidenceInformalRegister')!=0 or sp.get('spanishPages')!=52:fail('Spanish formal-register review invalid')
 sp2=json.loads((ROOT/'evidence/hf31/SPANISH_LANGUAGE_FINAL_REPORT.json').read_text('utf-8'))
 if sp2.get('result')!='PASS' or sp2.get('remainingIssues')!=0:fail('Spanish UI/encoding report invalid')
 explorer=[]
 for p in indexes:
  s=p.read_text('utf-8')
  if 'data-community-explorer' in s:
   explorer.append(p)
   if 'data-hf31-deep-language-runtime="1"' not in s:fail(f'deep runtime not injected {p.relative_to(ROOT)}')
 if len(explorer)<40:fail(f'explorer coverage only {len(explorer)} pages')
 bowling=(ROOT/'dist/sports/bowling/index.html').read_text('utf-8')
 if 'data-explorer-scope="sport:bowling"' not in bowling or 'id="finder"' not in bowling:fail('bowling source behavior missing')
 deep=(ROOT/'dist/assets/hf31-deep-public.js').read_text('utf-8')
 for token in ['finder.previousElementSibling!==hero','Explore other sports and activities','hf31-explorer-controls-minimal','section.hidden=true','Manage your Franklin presence']:
  if token not in deep:fail(f'deep navigation token missing {token}')
 runtime=(ROOT/'dist/assets/hf31-deep-language-runtime.js').read_text('utf-8')
 if 'Franklin Family Entertainment Center provides bowling league information' not in runtime:fail('bowling dynamic plain-language result missing')
 pub=(ROOT/'dist/assets/hf31-public.js').read_text('utf-8')
 if 'function refineProfilePlainLanguage()' not in pub or 'refineProfilePlainLanguage();' not in pub:fail('profile render jargon cleanup missing')
 meta=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text('utf-8'))
 for k,v in [('release',RELEASE),('activeEdition','FRANKLIN_TN'),('profileCount',19103),('profileFactsChanged',False),('pricesChanged',False),('runtimeChanged',False),('checkoutChanged',False),('checkoutRemainsOpen',True)]:
  if meta.get(k)!=v:fail(f'metadata mismatch {k}={meta.get(k)!r}')
 print(json.dumps({'result':'PASS','head':head,'changedFiles':len(changed),'publicIndexPages':19355,'profilePagesNoSourceFactDrift':19103,'explorerPagesDeepNavigationProtected':len(explorer),'staticJargonIssues':0,'profileRenderedJargonCleanup':'PASS','spanishPages':52,'spanishHighConfidenceIssues':0,'protectedRuntimeDataChanges':0,'pricesChanged':False},sort_keys=True))
if __name__=='__main__':main()
