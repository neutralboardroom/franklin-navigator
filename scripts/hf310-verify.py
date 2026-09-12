#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import hashlib,json,sys,re
ROOT=Path(__file__).resolve().parents[1]; DIST=ROOT/'dist'
issues=[]
def chk(cond,msg):
    if not cond: issues.append(msg)
def text(rel): return (DIST/rel).read_text(encoding='utf-8')
def soup(rel): return BeautifulSoup(text(rel),'html.parser')
release=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text())
chk(release.get('release')=='FR-NAV1.29.0-HF3.10','release marker wrong')
manifest=json.loads((DIST/'data/discovery/manifest.json').read_text())
idx=DIST/manifest['index']['file'].lstrip('/')
digest=hashlib.sha256(idx.read_bytes()).hexdigest()
chk(manifest.get('recordCount')==19103,'profile count changed')
chk(digest=='a70510bfb65c76749dd0121fbd3988040ed8147140756f0d8055d23dfc2578bf','profile source hash changed')
chk(digest==manifest['index']['sha256'],'profile manifest digest mismatch')
pages=sum(1 for _ in DIST.rglob('*.html')); chk(pages==19358,f'page count changed: {pages}')
changed_pages=['member-profile-preview/index.html','membership-start/index.html','business-dashboard/index.html','local-growth-engine/index.html','navigator-growth-desk/index.html','claim-profile/index.html']
for rel in changed_pages:
    d=soup(rel)
    chk(d.find('meta',attrs={'name':'franklin-release','content':'FR-NAV1.29.0-HF3.10'}) is not None,f'{rel}: release meta missing')
    chk(d.find('link',href=re.compile(r'/assets/hf310\.css')) is not None,f'{rel}: hf310 css missing')
    chk(d.find('script',src=re.compile(r'/assets/hf310\.js')) is not None,f'{rel}: hf310 js missing')
# Member preview requirements
m=text('member-profile-preview/index.html')
for needle in ['Preview your Community Member profile.','Add About &amp; services','Booking / appointment','LinkedIn','Photos / gallery','How profile information is reviewed','Corrections and removal stay free.']:
    chk(needle in m,f'member preview missing: {needle}')
chk('See what your Community Member profile can become.' not in m,'old preview hero remains')
# Membership requirements
m=text('membership-start/index.html')
for needle in ['Turn your Franklin profile into a fuller local business page.','Keep the focus on your business','Community Membership — $35/year','Membership details &amp; profile review']:
    chk(needle in m,f'membership missing: {needle}')
chk('See membership boundaries and profile information' not in m,'old membership boundaries label remains')
# Business dashboard
m=text('business-dashboard/index.html')
for needle in ['Manage and improve your Franklin business profile.','Find profile','Preview membership','Complete profile','See Community Membership — $35/year','Free business tools']:
    chk(needle in m,f'business dashboard missing: {needle}')
chk('Ordinary Directory ranking and factual accuracy do not change</li>' not in m,'ranking neutrality still shown as paid benefit')
# Growth planner
m=text('local-growth-engine/index.html')
for needle in ['1. Your business','2. Your goal','3. Check your public presence','Your plan for this week','Turn this into a 30/90-day plan','How this planner works &amp; privacy']:
    chk(needle in m,f'growth planner missing: {needle}')
for forbidden in ['growth-flywheel large','local-hero-photo','19,103','What this planner will and will not do.','Free to use on this site.','Ideas waiting for your review']:
    chk(forbidden not in m,f'growth planner still exposes: {forbidden}')
for runtime in ['data-growth-opportunities','data-growth-drafts','data-growth-review-queue','data-growth-ledger','data-growth-capacity']:
    chk(runtime in m,f'growth planner runtime target lost: {runtime}')
# Growth guides
m=text('navigator-growth-desk/index.html')
for needle in ['Find the guide for your business.','Recommended guide','Browse all business guides','Every guide helps you:','Not sure what to work on first?']:
    chk(needle in m,f'growth guides missing: {needle}')
for forbidden in ['13 practical guides for Franklin businesses','local-hero-photo','What is free and what is planned?','If sponsored placements are offered later','Community Membership enrollment is open']:
    chk(forbidden not in m,f'growth guides still exposes: {forbidden}')
for route in ['/navigator-growth-desk/legal/','/navigator-growth-desk/health/','/navigator-growth-desk/home-property/','/navigator-growth-desk/auto/','/navigator-growth-desk/restaurants-hospitality/','/navigator-growth-desk/retail/','/navigator-growth-desk/professional-services/','/navigator-growth-desk/accounting-tax/','/navigator-growth-desk/education-tutoring/','/navigator-growth-desk/senior-services/','/navigator-growth-desk/beauty-fitness/','/navigator-growth-desk/pet-services/','/navigator-growth-desk/community-nonprofit/']:
    chk(route in m,f'growth guide route lost: {route}')
# Claim profile
m=text('claim-profile/index.html')
chk(m.count('data-hf310-claim-search-form')==1,'claim search form count wrong')
chk('/assets/r37-claim.js' not in m,'legacy duplicate claim search script remains')
for needle in ['What would you like to do?','Corrections and removal are free.','Request a free basic public profile']:
    chk(needle in m,f'claim profile missing: {needle}')
chk('Location stays exact.' not in m,'large location policy box remains')
# Contrast stylesheet hardening
acc=text('assets/accessibility.css')
chk('HF3.10 site-wide button contrast hardening' in acc,'contrast hardening missing')
chk('color:#03454b!important' in acc and 'color:#fff!important' in acc,'high contrast button colors missing')
# Critical untouched regressions
sports=text('sports/index.html'); chk('hf34-explorer-card' in sports,'sports static-first cards lost')
profile=text('profiles/FR-ORG-5d72d3ee4e9961c5/index.html'); chk('profile-primary-actions' in profile and 'hf35-competitor-card' in profile,'public profile regression')
cor=text('corrections/index.html'); chk('What information is wrong?' in cor and 'What should it say instead?' in cor,'corrections split fields lost')
report={'release':'FR-NAV1.29.0-HF3.10','base':'FR-NAV1.28.0-HF3.9','profileCount':manifest['recordCount'],'profileSourceSha256':digest,'pageCount':pages,'issues':issues,'issueCount':len(issues),'status':'PASS' if not issues else 'FAIL'}
(ROOT/'HF310_STATIC_QUALIFICATION_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if issues: sys.exit(1)
