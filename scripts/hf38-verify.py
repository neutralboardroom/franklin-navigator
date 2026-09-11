#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json,hashlib,re,sys

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
REL='FR-NAV1.27.0-HF3.8'
issues=[]

def fail(x): issues.append(x)
def text(rel): return (DIST/rel).read_text(encoding='utf-8')
def soup(rel): return BeautifulSoup(text(rel),'html.parser')

manifest=json.loads(text('data/discovery/manifest.json'))
idx=DIST/manifest['index']['file'].lstrip('/')
digest=hashlib.sha256(idx.read_bytes()).hexdigest()
if digest!=manifest['index']['sha256']: fail('discovery_index_mutated_or_manifest_mismatch')
if manifest['recordCount']!=19103: fail('unexpected_profile_source_record_count')

for rel in ['member-profile-preview/index.html','profile-studio/index.html','business-dashboard/index.html','community-help-center/index.html']:
    if REL not in text(rel): fail('release_marker_missing:'+rel)
    if '/assets/hf38.css?v=frnav1270' not in text(rel): fail('hf38_css_missing:'+rel)

acc=text('assets/accessibility.css')
if 'HF3.8 shared accessibility hardening' not in acc: fail('shared_accessibility_marker_missing')
for token in ['details>summary:focus-visible','font-size:16px','scroll-margin-top:112px']:
    if token not in acc: fail('shared_accessibility_rule_missing:'+token)

p=soup('member-profile-preview/index.html');pt=p.get_text(' ',strip=True)
for name in ['name','city','category','phone','email','website','about','services','hours','languages','online','photos']:
    if not p.select_one(f'[name="{name}"]'): fail('preview_field_missing:'+name)
if not p.select_one('[data-r38-preview-readiness]'): fail('preview_readiness_missing')
if 'not a public rating' not in pt.lower(): fail('preview_readiness_boundary_missing')
if '/assets/hf38.js?v=frnav1270' not in text('member-profile-preview/index.html'): fail('preview_hf38_js_missing')
if 'No Similar local profiles' not in pt: fail('preview_member_value_regressed')
if 'Ordinary Directory ranking' not in pt: fail('preview_ranking_boundary_regressed')

s=soup('profile-studio/index.html');st=s.get_text(' ',strip=True)
if len(s.select('[data-member-profile-root]'))!=1: fail('profile_studio_live_root_wrong')
if s.select('[data-profile-studio]'): fail('legacy_duplicate_profile_studio_still_present')
if 'Optional device-only design preview' in st: fail('legacy_device_preview_copy_present')
if 'Manage the profile residents will actually see.' not in st: fail('profile_studio_direct_headline_missing')
if '/assets/member-profile-live.js?v=frnav1270' not in text('profile-studio/index.html'): fail('member_editor_cache_bust_missing')
if '/corrections/' not in text('profile-studio/index.html'): fail('profile_studio_free_correction_missing')

member=text('assets/member-profile-live.js')
fields=['summary','tagline','services','hours','serviceArea','accessibility','languages','pricing','experience','credentials','awards','associations','education','publications','offersEvents','website','contactUrl','bookingUrl','quoteUrl','menuUrl','orderUrl','directionsUrl','profileImageUrl','galleryUrls','socialLinks']
for name in fields:
    if f"'{name}'" not in member: fail('member_editor_field_missing:'+name)
for label in ['Profile readiness','Only you see this completion checklist while editing. It is not a public rating.','Save private draft','Submit saved draft for review']:
    if label not in member: fail('member_editor_behavior_missing:'+label)
for unsafe in ['customer records are uploaded','automatic approval','paid ranking']:
    if unsafe in member.lower(): fail('member_editor_unsafe_copy:'+unsafe)

b=soup('business-dashboard/index.html');bt=b.get_text(' ',strip=True)
if len(b.select('.r38-business-step'))!=3: fail('business_step_count_wrong')
for href in ['/claim-profile/','/member-profile-preview/','/profile-studio/','/membership-start/']:
    if not b.select_one(f'a[href="{href}"]'): fail('business_path_missing:'+href)
if '$35' not in bt or 'per year' not in bt: fail('business_price_missing')
if 'Ordinary Directory ranking and factual accuracy do not change' not in bt: fail('business_ranking_boundary_missing')
if text('business-dashboard/index.html').count('<!DOCTYPE html>')!=1: fail('business_duplicate_doctype')
if '/assets/app.js' not in text('business-dashboard/index.html'): fail('business_shell_runtime_missing')

h=soup('community-help-center/index.html');ht=h.get_text(' ',strip=True)
if 'More help & tools' in ht or re.search(r'\bMore help\b',ht): fail('help_vague_more_help_copy_remaining')
if 'Browse help and planning tools' not in ht: fail('help_tools_summary_missing')
if len(h.select('.urgent-card'))<5: fail('urgent_help_cards_regressed')
if not h.select_one('[data-community-help-planner]'): fail('help_planner_regressed')
for phrase in ['Call 911','Call or text 988','Call 211','Poison Control']:
    if phrase not in ht: fail('urgent_resource_regressed:'+phrase)

src=json.loads((ROOT/'HF38_SOURCE_RECONCILIATION_RECEIPT.json').read_text(encoding='utf-8'))
if src['profileFactory']['disposition']!='DEFER_WITH_CAUSE': fail('pf15_21_not_deferred')
if src['localInvestigator']['disposition']!='DEFER_WITH_CAUSE': fail('li31_not_deferred')
if src['profileSourceRecordCount']!=19103: fail('source_receipt_profile_count_wrong')
if src['smarterJusticeDonor']['used'] is not False: fail('smarter_justice_donor_drift')
runtime=json.loads((ROOT/'HF38_RUNTIME_COMPATIBILITY_RECEIPT.json').read_text(encoding='utf-8'))
if runtime['membershipRuntimeCommitObserved']!='a7f2eace8283ebda702d587f6dc98985329699f3': fail('runtime_commit_receipt_wrong')
if set(runtime['membershipRuntimeFieldContract'])!=set(fields): fail('runtime_field_contract_mismatch')
if runtime['runtimeMutation']!='NONE': fail('unexpected_runtime_mutation')
loss=json.loads((ROOT/'HF38_NO_LOSS_LEDGER.json').read_text(encoding='utf-8'))
if loss['profileSourceSha256Before']!=loss['profileSourceSha256After']: fail('no_loss_digest_mismatch')
if loss['canonicalProfileFactsMutated'] is not False: fail('canonical_profile_mutation_claimed')

m=soup('membership-start/index.html');mt=m.get_text(' ',strip=True)
if '$35' not in mt or 'No Similar local profiles' not in mt or 'ordinary Directory ranking' not in mt: fail('membership_invariant_regressed')
c=soup('claim-profile/index.html')
if not c.select_one('form[action="/directory/"] input[name="q"]'): fail('claim_search_regressed')
core=text('assets/local-discovery-core.js')
if "sort: ['local', 'name'" not in core or 'const localRank = r =>' not in core: fail('directory_local_rank_regressed')
match=re.search(r'const localRank = r => \{.*?\n    \};',core,re.S)
if not match or 'member' in match.group(0).lower(): fail('directory_membership_neutrality_regressed')
sports=soup('sports/index.html')
if len(sports.select('.hf34-explorer-card'))<5: fail('sports_static_first_regressed')
profile=soup('profiles/FR-ORG-5d72d3ee4e9961c5/index.html')
if len(profile.select('.profile-primary-actions a'))<3: fail('profile_direct_contact_regressed')
if len(profile.select('.hf35-competitor-card'))<1: fail('free_profile_related_profiles_regressed')
cor=soup('corrections/index.html')
if not cor.select_one('[name="currentInfo"]') or not cor.select_one('[name="correctInfo"]'): fail('correction_fields_regressed')

banned=['Profile Factory','Local Investigator','SCC_INTERNAL','canonical pointer','ingestion pipeline','builder packet','exact package gate','candidate handoff']
for rel in ['member-profile-preview/index.html','profile-studio/index.html','business-dashboard/index.html','community-help-center/index.html']:
    visible=soup(rel).get_text(' ',strip=True).lower()
    for term in banned:
        if term.lower() in visible: fail('public_internal_language:'+rel+':'+term)

report={'release':REL,'profileCount':manifest['recordCount'],'profileSourceSha256':digest,'issues':issues,'issueCount':len(issues),'status':'PASS' if not issues else 'FAIL'}
(ROOT/'HF38_STATIC_QUALIFICATION_REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
if issues: sys.exit(1)
