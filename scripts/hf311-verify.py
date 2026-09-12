from pathlib import Path
import json, re
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
RELEASE='FR-NAV1.30.0-HF3.11'
issues=[]; checks=0

def check(cond,msg):
    global checks
    checks+=1
    if not cond: issues.append(msg)

def loadj(rel): return json.loads((ROOT/rel).read_text())

prod=loadj('PRODUCTION_RELEASE.json')
check(prod.get('release')==RELEASE,'release identity drift')
check(prod.get('base')=='FR-NAV1.29.0-HF3.10','base identity drift')
manifest=loadj('dist/data/discovery/manifest.json')
check(manifest.get('recordCount')==19103,'profile count changed without accepted PF import')
page_count=sum(1 for _ in DIST.rglob('*.html'))
check(page_count==19358,f'page count drift {page_count} != 19358')

# Current public catalogs must all expose one and only one new-sale plan at $35/year.
for rel in ['dist/data/membership-checkout-catalog.json','dist/data/membership-pricing.json','dist/data/community-membership-v4.json','dist/data/r29-v6-public-offer.json']:
    d=loadj(rel)
    choices=d.get('choices') or d.get('paidChoices') or d.get('publicChoices') or []
    check(len(choices)==1,f'{rel}: expected exactly one public choice')
    if choices:
        c=choices[0]; amount=c.get('amountUsd',c.get('priceUsd'))
        check(amount==35,f'{rel}: amount is not 35')
        check(str(c.get('billing','')).upper()=='RECURRING_ANNUAL',f'{rel}: billing is not recurring annual')
        check(c.get('id','').lower()=='annual',f'{rel}: id is not annual')

# Publicly shipped legacy offer artifacts must no longer exist at their former public paths.
for rel in ['dist/data/r28-community-strategy-receipt.json','dist/data/r29-payment-readiness.json','dist/data/r23-pricing-preview.json','dist/assets/r25-membership.js','dist/assets/r26-membership.js']:
    check(not (ROOT/rel).exists(),f'legacy public artifact still shipped: {rel}')
    check((ROOT/'evidence/hf311/historical_public_asset_archive'/Path(rel).name).exists(),f'historical archive missing for {rel}')

# No retired sale prices or retired sale labels anywhere in public HTML/JS/JSON.
ban=[re.compile(x,re.I) for x in [
    r'\$5\s*/\s*month',r'\$50\s*/\s*year',r'\$120\b',r'\$5\s*/\s*mes',r'\$50\s*/\s*año',
    r'once for three years',r'franklin charter membership',r'one-time 36-month term',r'36 prepaid months'
]]
for p in DIST.rglob('*'):
    if p.suffix.lower() not in {'.html','.js','.json','.md','.txt'}: continue
    text=p.read_text(errors='ignore')
    for pat in ban:
        if pat.search(text): issues.append(f'retired public offer text {pat.pattern} in {p.relative_to(ROOT)}')
    checks+=len(ban)

# Legacy preview helper may remain for compatibility, but its executable plan surface must be annual-only.
r28=(DIST/'assets/r28-community.js').read_text()
check(bool(re.search(r"const\s+plans\s*=\s*\{\s*annual\s*:\s*\{[^}]*price\s*:\s*35[^}]*billing\s*:\s*['\"]per year['\"]",r28,re.S)),'r28 preview helper missing current $35/year annual plan')
check(not re.search(r"price\s*:\s*(?:5|50|90|120)(?!\d)",r28),'r28 preview helper still contains retired prices')
check(bool(re.search(r"const\s+selectedPlan\s*=\s*\(\s*\)\s*=>\s*plans\.annual\s*;",r28)),'r28 preview helper can still select a retired plan')
check('plans.monthly' not in r28 and 'plans.charter' not in r28,'r28 preview helper exposes a retired plan key')

# High-value routes must show current plan and no retired offer language.
route_files={
 '/':'dist/index.html','/member-profile-preview/':'dist/member-profile-preview/index.html',
 '/membership-start/':'dist/membership-start/index.html','/business-dashboard/':'dist/business-dashboard/index.html',
 '/membership-pricing/':'dist/membership-pricing/index.html','/member-support/':'dist/member-support/index.html'
}
for route,rel in route_files.items():
    text=(ROOT/rel).read_text(errors='ignore')
    visible=' '.join(BeautifulSoup(text,'html.parser').stripped_strings)
    if route!='/': check('$35' in visible,f'{route}: current $35 membership missing')
    for pat in ban: check(not pat.search(visible),f'{route}: retired plan visible: {pat.pattern}')

home=BeautifulSoup((DIST/'index.html').read_text(),'html.parser')
preview=[a for a in home.find_all('a') if a.get('href')=='/member-profile-preview/']
check(bool(preview),'homepage member-profile preview route missing')

receipt=loadj('HF311_COMMERCIAL_TRUTH_RECEIPT.json')
check(receipt.get('retiredNewSalePlansRemovedFromPublicPresentation') is True,'commercial truth receipt missing retired-plan suppression')
check(receipt.get('historicalExistingMemberServicingPreserved') is True,'historical servicing boundary missing')
check(receipt.get('profileFactory15_23ConsumerDisposition','').startswith('DEFER_WITH_CAUSE'),'PF15.23 disposition not explicit')
check(receipt.get('localInvestigator33ConsumerDisposition','').startswith('DEFER_WITH_CAUSE'),'LI33 disposition not explicit')
check(receipt.get('smarterJusticeDonor')=='NOT_USED','Smarter Justice boundary drift')
check(receipt.get('currentSuccessorRule') is True,'current-successor rule missing from receipt')

report={'release':RELEASE,'status':'PASS' if not issues else 'FAIL','checks':checks,'failures':len(issues),'issues':issues,'pageCount':page_count,'profileCount':manifest.get('recordCount'),'commercialTruth':'SINGLE_NEW_SALE_PLAN_35_YEAR','retiredPublicOfferHits':0 if not issues else None,'profileFactoryDisposition':'PF15.23_DEFER_WITH_CAUSE','localInvestigatorDisposition':'LI33_DEFER_WITH_CAUSE'}
(ROOT/'HF311_STATIC_QUALIFICATION_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if issues: raise SystemExit(1)
