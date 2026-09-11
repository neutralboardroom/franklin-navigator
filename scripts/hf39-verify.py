#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json, hashlib, sys

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
RELEASE='FR-NAV1.28.0-HF3.9'
issues=[]

def chk(cond,msg):
    if not cond: issues.append(msg)

def text(rel):
    return (DIST/rel).read_text(encoding='utf-8')

def soup(rel):
    return BeautifulSoup(text(rel),'html.parser')

prod=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text(encoding='utf-8'))
chk(prod.get('release')==RELEASE,'production_release_identity')
chk(prod.get('counts',{}).get('profiles')==19103,'production_profile_count')
manifest=json.loads(text('data/discovery/manifest.json'))
idx=DIST/manifest['index']['file'].lstrip('/')
digest=hashlib.sha256(idx.read_bytes()).hexdigest()
chk(manifest.get('recordCount')==19103,'manifest_profile_count')
chk(digest==manifest['index']['sha256'],'profile_source_digest')
chk(sum(1 for _ in DIST.rglob('*.html'))==19358,'html_page_count')
chk((ROOT/'NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_28_0_HF39.md').exists(),'next_version_improvement_list')
chk((DIST/'assets/hf39.css').exists() and (DIST/'assets/hf39.js').exists(),'hf39_assets')

changed=['index.html','directory/index.html','get-it-done/index.html','today/index.html','activities/index.html','community/index.html','my-franklin/index.html','business-dashboard/index.html','community-help-center/index.html']
for rel in changed:
    s=soup(rel)
    meta=s.find('meta',attrs={'name':'franklin-release'})
    chk(meta and meta.get('content')==RELEASE,f'{rel}:release_meta')
    chk(bool(s.find('link',href=lambda x:x and x.startswith('/assets/hf39.css'))),f'{rel}:hf39_css')
    chk(bool(s.find('script',src=lambda x:x and x.startswith('/assets/hf39.js'))),f'{rel}:hf39_js')

home=text('index.html')
chk('Sources were last refreshed' not in home,'home_public_refresh_language')
hs=soup('index.html')
chk('Franklin Through Time — Then & Now' in hs.get_text(' ',strip=True),'home_then_now')
biz=hs.select_one('.r24-business-section .actions')
chk(biz is not None and len(biz.find_all('a',recursive=False))==1,'home_single_business_cta')

js=text('assets/local-discovery.js')
chk("Source date: " not in js,'directory_source_date_copy')
chk('hf39-compare-choice' in js,'directory_compare_control')
core=text('assets/local-discovery-core.js')
chk('HF3.9 default browse diversification' in core,'directory_diversification')
chk("return 'parks'" in core,'directory_park_family')

gitd=text('get-it-done/index.html')
chk('See all tasks' in gitd,'get_it_done_show_all_copy')
chk('Private on your device · Official sources · Copy/print · My Franklin reminders' in gitd,'get_it_done_compact_trust')

today=text('today/index.html')
for bad in ['Sources last refreshed','Current cards expire automatically','Freshness at a glance','Franklin Splash Park extension','Franklin 9/11 Remembrance Ceremony']:
    chk(bad not in today,f'today_removed:{bad}')
for need in ['Today','Coming up','Registration &amp; deadlines','Check current details']:
    chk(need in today,f'today_present:{need}')

activities=text('activities/index.html')
for bad in ['Last checked:','Past items are removed automatically','Franklin Splash Park extension','Franklin 9/11 Remembrance Ceremony','Showing 65 of 65']:
    chk(bad not in activities,f'activities_removed:{bad}')
for need in ['Happening now &amp; coming up','Activities &amp; local options','Official resources &amp; starting points','Before you register']:
    chk(need in activities,f'activities_present:{need}')

community=text('community/index.html')
chk('Ways to participate' in community,'community_ways_cta')
chk('Volunteer locally' in community,'community_volunteer_copy')
chk('Add to My Franklin' in community,'community_compact_my_franklin')

my=text('my-franklin/index.html')
chk('>Reminders<' in my,'my_franklin_reminders_heading')
chk('Personalize My Franklin' in my,'my_franklin_personalize')
chk('Local address lookups' in my,'my_franklin_local_lookups')
chk('Follow-ups' not in my,'my_franklin_followups_removed')

business=text('business-dashboard/index.html')
for need in ['data-business-primary','data-business-secondary','data-business-membership-cta','Free business tools','Review membership — $35/year']:
    chk(need in business,f'business_present:{need}')
chk('leads, customers or guaranteed results' not in business,'business_defensive_copy_removed')

helptext=text('community-help-center/index.html')
for need in ['Free help · no account required','Make a private help plan','More help &amp; tools','Privacy &amp; safety']:
    chk(need in helptext,f'help_present:{need}')
for bad in ['Prepare, verify and decide what kind of help you need','Legal Aid Society clinics and events','Build a private, review-ready preparation packet','Have a notice, denial, bill or claim letter?']:
    chk(bad not in helptext,f'help_removed:{bad}')
hs=soup('community-help-center/index.html')
chk(len(hs.select('.urgent-card'))==5,'help_urgent_card_count')

receipt={'release':RELEASE,'profileCount':19103,'profileSourceSha256':digest,'pageCount':sum(1 for _ in DIST.rglob('*.html')),'issues':issues,'issueCount':len(issues),'status':'PASS' if not issues else 'FAIL'}
(ROOT/'HF39_STATIC_QUALIFICATION_REPORT.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt,indent=2))
if issues: sys.exit(1)
