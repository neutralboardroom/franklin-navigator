#!/usr/bin/env python3
from __future__ import annotations
import pathlib, re, json

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
RELEASE = 'FR-NAV1.19.0-HF3.0-CANDIDATE'
META_RE = re.compile(r'<meta\s+name=["\']franklin-release["\']\s+content=["\']([^"\']+)', re.I)
META_RE_REVERSED = re.compile(r'<meta\s+content=["\']([^"\']+)["\']\s+name=["\']franklin-release["\']', re.I)
EXPECTED_COPY = {
    'dist/index.html': 'Sources were last refreshed September 3, 2026. Time-sensitive items link to the original source; confirm current details there before acting.',
    'dist/today/index.html': 'Sources last refreshed September 3, 2026 · confirm changing details at the original source',
    'dist/es/index.html': 'Fuentes revisadas por última vez el 3 de septiembre de 2026. Los elementos con fecha enlazan a la fuente original; confirme allí los detalles actuales antes de actuar.',
    'dist/es/hoy/index.html': 'Fuentes revisadas por última vez el 3 de septiembre de 2026 · confirme los datos cambiantes en la fuente original',
}
REQUIRED = [
    'PRODUCTION_RELEASE.json',
    'dist/assets/hf27-navigation.js','dist/assets/hf29-design.js','dist/assets/hf29-design.css','dist/assets/hf29-popup.css',
    'dist/assets/hf28-directory.js','dist/assets/r37-i18n.js',
    'evidence/hf30/RULE_AND_SOURCE_RECONCILIATION_RECEIPT.json',
    'evidence/hf30/NO_LOSS_LEDGER.json','evidence/hf30/LOCAL_PLATFORM_PRIORITY_QUEUE.json',
    'evidence/hf30/DONOR_CAPABILITY_REGISTRY.json','evidence/hf30/AI_PRODUCT_AUDIT.json',
]

def fail(msg):
    print('HF30_RELEASE_FAIL',msg); raise SystemExit(1)
for rel in REQUIRED:
    if not (ROOT/rel).is_file(): fail('missing '+rel)

meta=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text('utf-8'))
if meta.get('release')!=RELEASE: fail('PRODUCTION_RELEASE release mismatch')
if meta.get('activeEdition')!='FRANKLIN_TN': fail('active edition mismatch')
if meta.get('writableProductLane')!='LOCAL_COMMUNITY_EDITION:FRANKLIN_TN': fail('writable lane mismatch')
if meta.get('profileCount')!=19103: fail('profile count drift')
for key in ['profileFactsChanged','pricesChanged','runtimeChanged']:
    if meta.get(key) is not False: fail(key+' must be false')
if meta.get('checkoutRemainsOpen') is not True: fail('checkout truth regressed')

htmls=sorted(DIST.rglob('index.html'))
if len(htmls)!=19355: fail(f'public index count {len(htmls)} != 19355')
profiles=0
for path in htmls:
    rel=path.relative_to(DIST).as_posix()
    if rel.startswith('profiles/'): profiles+=1
    text=path.read_text('utf-8')
    m=META_RE.search(text) or META_RE_REVERSED.search(text)
    if not m or m.group(1)!=RELEASE: fail('stale/missing release marker '+rel)
if profiles!=19103: fail(f'profile page count {profiles} != 19103')
for rel,needle in EXPECTED_COPY.items():
    if (ROOT/rel).read_text('utf-8').count(needle)!=1: fail('freshness wording mismatch '+rel)

# Static retained-behavior gates relevant to this no-logic-change successor.
nav=(DIST/'assets/hf27-navigation.js').read_text('utf-8')
design=(DIST/'assets/hf29-design.js').read_text('utf-8')
popup=(DIST/'assets/hf29-popup.css').read_text('utf-8')
directory=(DIST/'assets/hf28-directory.js').read_text('utf-8')
for needle in ['function canonicalHeaderItems','normalizeHeaderLinks','section.hidden=true']:
    if needle not in nav: fail('navigation regression '+needle)
for needle in ['simplifyAssistantExamples','simplifyTodayFilters','simplifyTodayCardActions','simplifyAssistantDialogStructure','isSafetyResult']:
    if needle not in design: fail('design regression '+needle)
for needle in ['hf29-primary-result','hf29-assistant-extra','data-hf29-safety-pinned','hf29-dialog-more-menu']:
    if needle not in popup: fail('popup regression '+needle)
for needle in ['hf28-more-filters','data-dir-type','data-dir-area','data-dir-sort','data-compare-id','hf28-result-more']:
    if needle not in directory: fail('Find Local regression '+needle)

print(json.dumps({
    'status':'PASS','release':RELEASE,'activeEdition':'FRANKLIN_TN',
    'publicIndexPages':len(htmls),'profilePages':profiles,'releaseMarkersExact':len(htmls),
    'freshnessCopyPages':len(EXPECTED_COPY),'profileFactsChanged':False,'pricesChanged':False,'runtimeChanged':False,
    'checkoutRemainsOpen':True,'retainedDesignAssistantAndFindLocalStaticGates':'PASS'
},sort_keys=True))
