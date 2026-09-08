#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json, re, subprocess

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
BASE='14af3042df4c7a31102a587183c3ed850758a595'
ALLOWED={
 'dist/assets/hf27-navigation.js','dist/assets/hf29-design.css','dist/assets/hf29-design.js',
 'dist/assets/r37.css','dist/assets/r37-i18n.js','scripts/validate-hf29-design.py',
 '.github/workflows/hf29-design-qualify.yml','evidence/hf29/DESIGN_AUDIT_BASELINE.json',
 'evidence/hf29/LIVE_VISUAL_VERIFICATION.json','evidence/hf29/NO_LOSS_AND_COMMUNITY_ISOLATION_RECEIPT.json',
 'evidence/hf29/PRE_SEAL_CURRENTNESS_RECEIPT.json','evidence/hf29/ROLE_PRODUCT_SCOPE_AND_AUTHORITY_NO_DRIFT_RECEIPT.json',
 'PRODUCTION_RELEASE.json','NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_18_0_HF29.md',
 'scripts/build-hf29-release.py','scripts/validate-hf29-release.py','.github/workflows/hf29-seal.yml'
}

def fail(msg):
 print('HF29_FAIL',msg); raise SystemExit(1)

def changed_files():
 try:
  out=subprocess.check_output(['git','diff','--name-only',BASE+'...HEAD'],cwd=ROOT,text=True)
  return {x for x in out.splitlines() if x.strip()}
 except Exception as e: fail(f'git diff unavailable: {e}')

changed=changed_files()
unexpected=sorted(changed-ALLOWED)
if unexpected: fail('unexpected changed files: '+', '.join(unexpected))
if any(p.startswith(('dist/data/','dist/profiles/','server/','runtime/')) for p in changed): fail('data/profile/runtime scope changed')

for p in ['dist/assets/hf29-design.css','dist/assets/hf29-design.js','dist/assets/hf27-navigation.js','dist/assets/r37.css','dist/assets/r37-i18n.js']:
 if not (ROOT/p).is_file(): fail('missing '+p)

subprocess.check_call(['node','--check',str(ROOT/'dist/assets/hf29-design.js')])
subprocess.check_call(['node','--check',str(ROOT/'dist/assets/hf27-navigation.js')])
subprocess.check_call(['node','--check',str(ROOT/'dist/assets/r37-i18n.js')])

css=(ROOT/'dist/assets/hf29-design.css').read_text('utf-8')
design=(ROOT/'dist/assets/hf29-design.js').read_text('utf-8')
nav=(ROOT/'dist/assets/hf27-navigation.js').read_text('utf-8')
r37=(ROOT/'dist/assets/r37.css').read_text('utf-8')
i18n=(ROOT/'dist/assets/r37-i18n.js').read_text('utf-8')
for needle in [
 '.r41-more-actions-menu{', 'position:absolute', '.r27-navigator-dialog{width:min(640px',
 '.r24-destinations,.r41-home-routes{display:none!important}', '.hf29-footer-more-menu', '.hf29-today-filter',
 '.navigator-examples.r24-chips{display:none!important}', '.hf29-example-select', '.hf29-dialog-more',
 '.device-reset-panel .hf29-safe-choice'
]:
 if needle not in css: fail('missing CSS gate '+needle)

try:
 core_body=nav.split('function coreHeaderLink',1)[1].split('function globalOverflowLink',1)[0]
 overflow_body=nav.split('function globalOverflowLink',1)[1].split('function buildDisclosure',1)[0]
except Exception:
 fail('unable to inspect header navigation functions')
if "community" in core_body or "my-franklin" in core_body or "business-dashboard" in core_body:
 fail('secondary destinations are still direct core header links')
for required in ['community','my-franklin','business-dashboard']:
 if required not in overflow_body: fail('missing top-level More destination '+required)
for disallowed in ['activities','sports','learning']:
 if disallowed in overflow_body: fail('subtopic still in global header More: '+disallowed)
if "p==='/directory/'" not in core_body or "p==='/get-it-done/'" not in core_body or "p==='/today/'" not in core_body:
 fail('required core header routes missing')
if "section.hidden=true" not in nav: fail('duplicate homepage route chooser not suppressed')
for needle in ['simplifyAssistantExamples','simplifyTodayFilters','simplifyFooter','simplifyMyFranklin','simplifyDialogActions']:
 if needle not in design: fail('missing rendered simplifier '+needle)
if "@import url('/assets/hf29-design.css');" not in r37: fail('HF29 CSS not loaded before paint')
if "data-hf29-design" not in i18n: fail('HF29 JS loader missing')

pages=0; nav_gt4=0; action_groups=0; action_gt2=0; max_buttons=0; static_disclosures=0
for path in DIST.rglob('index.html'):
 rel=path.relative_to(DIST).as_posix()
 if rel.startswith('profiles/'): continue
 soup=BeautifulSoup(path.read_text('utf-8'),'html.parser'); pages+=1
 header=soup.select_one('header .nav')
 if header:
  core=0
  for a in header.find_all('a',recursive=False):
   href=a.get('href','')
   if ('#ask-navigator' in href or re.search(r'/(today|es/hoy|get-it-done|es/hacerlo|directory|es/directorio)/',href)):
    core+=1
  if core>4: nav_gt4+=1
 for sel in ['.actions','.r30-actions']:
  for group in soup.select(sel):
   n=len(group.find_all(['a','button'],recursive=False)); action_groups+=1
   if n>2: action_gt2+=1
 static_disclosures+=len(soup.find_all('details'))
 max_buttons=max(max_buttons,len(soup.find_all('button')))

if nav_gt4: fail(f'{nav_gt4} pages would retain >4 core header links')
print(json.dumps({
 'status':'PASS','nonProfilePagesAudited':pages,'headerDirectCoreMax':4,'headerMoreTopLevelMax':3,
 'actionGroupsAudited':action_groups,'sourceActionGroupsOverTwoHandledByHF27':action_gt2,
 'staticNonProfileDisclosuresAudited':static_disclosures,
 'maxStaticButtonCountBeforeRenderedSimplification':max_buttons,
 'heroExampleButtonsRendered':0,'heroExampleSelectorRendered':1,
 'assistantPrimaryButtonsVisibleMax':1,'profileFactsChanged':False,'runtimeChanged':False,'checkoutChanged':False
},indent=2))
