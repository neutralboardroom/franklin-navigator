#!/usr/bin/env python3
from __future__ import annotations
import collections,html,json,pathlib,re,subprocess,sys,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE='736e3cfb5ae6be08758a442ce7bb2f8cedf8b9f0';RELEASE='FR-NAV1.20.0-HF3.1-CANDIDATE'
M1=re.compile(rb'(<meta\s+name=["\']franklin-release["\']\s+content=["\'])[^"\']+(["\'])',re.I);M2=re.compile(rb'(<meta\s+content=["\'])[^"\']+(["\']\s+name=["\']franklin-release["\'])',re.I)
ALLOWED={'dist/assets/hf31-public.js','dist/assets/hf31-public.css','dist/assets/hf31-task-save.css','dist/assets/hf31-deep-public.js','dist/assets/hf31-deep-public.css','dist/assets/hf31-deep-language-runtime.js','dist/assets/community-explorer.js','dist/assets/r37.css','dist/assets/r37-i18n.js'}
BANNED=[r'\bcanonical profiles?\b',r'\bsource routes?\b',r'\bresponsible-source\b',r'\bstable local routes?\b',r'\bfollow-through plan\b',r'\bconflicts? suppressed\b',r'\bfail-closed\b',r'\bqualified successor\b',r'\bconsumer acceptance\b',r'\bcurrent pointer\b',r'\bprofile factory\b',r'\blocal investigator\b',r'\bPF74\b',r'\bruntime pair\b',r'\bproducer candidate\b',r'\bexact artifact\b',r'\bsource-backed\b',r'\bcoverage floor\b',r'\bcurrent evidence state\b',r'\bevidence window\b',r'perfiles? canónicos?',r'rutas? de fuentes?',r'ventana de evidencia',r'fuentes responsables',r'rutas locales estables',r'aceptación del consumidor',r'puntero actual',r'investigador local',r'carga útil',r'respaldad[oa]s? por fuentes']
def run(*a):return subprocess.check_output(a,cwd=ROOT,text=True)
def need(c,m):
 if not c:print('HF31_FAST_FAIL',m,file=sys.stderr);raise SystemExit(1)
def norm(b):
 if M1.search(b):return M1.sub(rb'\1__RELEASE__\2',b,count=1)
 if M2.search(b):return M2.sub(rb'\1__RELEASE__\2',b,count=1)
 raise ValueError('release marker absent')
def body(raw):
 m=re.search(r'<body\b[^>]*>([\s\S]*?)</body>',raw,re.I);raw=m.group(1) if m else raw
 raw=re.sub(r'<script\b[^>]*>[\s\S]*?</script>|<style\b[^>]*>[\s\S]*?</style>|<noscript\b[^>]*>[\s\S]*?</noscript>',' ',raw,flags=re.I)
 return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',raw))).strip()
def main():
 head=run('git','rev-parse','HEAD').strip();need(run('git','merge-base',BASE,head).strip()==BASE,'lineage')
 changed=[x for x in run('git','diff','--name-only',f'{BASE}..{head}').splitlines() if x]
 need(not any(x.startswith(('dist/data/','server/','runtime/')) for x in changed),'protected runtime/data mutation')
 for x in changed:
  if x.startswith('dist/assets/'):need(x in ALLOWED,f'unapproved asset {x}')
  elif x.startswith('dist/'):need(x.endswith('.html'),f'unapproved dist file {x}')
 indexes=sorted((ROOT/'dist').rglob('index.html'));need(len(indexes)==19355,f'index count {len(indexes)}')
 marker=RELEASE.encode()
 for p in indexes:need(marker in p.read_bytes(),f'bad release marker {p.relative_to(ROOT)}')
 profiles=sorted((ROOT/'dist/profiles').glob('*/index.html'));need(len(profiles)==19103,'profile count')
 with tempfile.TemporaryDirectory(prefix='hf31-profile-base-') as td:
  base=pathlib.Path(td);proc=subprocess.Popen(['git','archive',BASE,'dist/profiles'],cwd=ROOT,stdout=subprocess.PIPE);subprocess.run(['tar','-x','-C',str(base)],stdin=proc.stdout,check=True);proc.stdout.close();need(proc.wait()==0,'git archive profiles')
  old=sorted((base/'dist/profiles').glob('*/index.html'));need(len(old)==19103,'base profile count')
  old_map={p.parent.name:p for p in old};need(set(old_map)=={p.parent.name for p in profiles},'profile membership drift')
  for p in profiles:need(norm(p.read_bytes())==norm(old_map[p.parent.name].read_bytes()),f'profile source drift {p.parent.name}')
 # Money tokens on commercial pages remain exact.
 money=re.compile(r'\$\s*\d+(?:\.\d{1,2})?')
 with tempfile.TemporaryDirectory(prefix='hf31-commercial-base-') as td:
  # Git show only the handful of changed commercial pages.
  for rel in changed:
   if not rel.endswith('.html') or not any(k in rel for k in ('membership','business-dashboard','business/')):continue
   try:old=run('git','show',f'{BASE}:{rel}')
   except subprocess.CalledProcessError:continue
   need(collections.Counter(money.findall(old))==collections.Counter(money.findall((ROOT/rel).read_text('utf-8'))),f'price drift {rel}')
 for p in indexes:
  rel=p.relative_to(ROOT).as_posix()
  if rel.startswith('dist/profiles/'):continue
  text=body(p.read_text('utf-8'))
  need(not any(re.search(pat,text,re.I) for pat in BANNED),f'public jargon {rel}')
 j=json.loads((ROOT/'evidence/hf31/PUBLIC_LANGUAGE_ZERO_JARGON_REPORT.json').read_text());need(j.get('result')=='PASS' and j.get('remainingHighConfidenceJargonMatches')==0,'jargon report')
 s=json.loads((ROOT/'evidence/hf31/SPANISH_REGISTER_FINAL_REVIEW.json').read_text());need(s.get('result')=='PASS' and s.get('remainingHighConfidenceInformalRegister')==0 and s.get('spanishPages')==52,'Spanish register')
 s2=json.loads((ROOT/'evidence/hf31/SPANISH_LANGUAGE_FINAL_REPORT.json').read_text());need(s2.get('result')=='PASS' and s2.get('remainingIssues')==0,'Spanish UI/encoding')
 pr=json.loads((ROOT/'evidence/hf31/PROFILE_RENDER_LANGUAGE_RECEIPT.json').read_text());need(pr.get('result')=='PASS' and pr.get('profileFactsChanged') is False,'profile render cleanup')
 explorer=[]
 for p in indexes:
  raw=p.read_text('utf-8')
  if 'data-community-explorer' in raw:explorer.append(p);need('data-hf31-deep-language-runtime="1"' in raw,f'deep runtime {p.relative_to(ROOT)}')
 need(len(explorer)>=40,f'explorer coverage {len(explorer)}')
 b=(ROOT/'dist/sports/bowling/index.html').read_text();need('data-explorer-scope="sport:bowling"' in b and 'id="finder"' in b,'bowling data contract')
 d=(ROOT/'dist/assets/hf31-deep-public.js').read_text();
 for t in ['finder.previousElementSibling!==hero','Explore other sports and activities','hf31-explorer-controls-minimal','section.hidden=true','Manage your Franklin presence']:need(t in d,f'deep UI token {t}')
 rt=(ROOT/'dist/assets/hf31-deep-language-runtime.js').read_text();need('Franklin Family Entertainment Center provides bowling league information' in rt,'bowling plain language runtime')
 pub=(ROOT/'dist/assets/hf31-public.js').read_text();need('function refineProfilePlainLanguage()' in pub and 'refineProfilePlainLanguage();' in pub,'profile render language')
 meta=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text())
 for k,v in [('release',RELEASE),('activeEdition','FRANKLIN_TN'),('profileCount',19103),('profileFactsChanged',False),('pricesChanged',False),('runtimeChanged',False),('checkoutChanged',False),('checkoutRemainsOpen',True)]:need(meta.get(k)==v,f'metadata {k}')
 print(json.dumps({'result':'PASS','head':head,'changedFiles':len(changed),'publicIndexPages':19355,'profilePagesNoSourceFactDrift':19103,'explorerPagesProtected':len(explorer),'publicJargonIssues':0,'spanishIssues':0,'profileRenderCleanup':'PASS','pricesChanged':False,'runtimeDataChanges':0},sort_keys=True))
if __name__=='__main__':main()
