#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json,hashlib,re,sys
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist';REL='FR-NAV1.26.0-HF3.7';issues=[]
def fail(x): issues.append(x)
def text(rel): return (DIST/rel).read_text(encoding='utf-8')
def soup(rel): return BeautifulSoup(text(rel),'html.parser')

# Exact discovery source must remain byte-bound to its manifest.
manifest=json.loads(text('data/discovery/manifest.json'));idx=DIST/manifest['index']['file'].lstrip('/')
digest=hashlib.sha256(idx.read_bytes()).hexdigest()
if digest!=manifest['index']['sha256']: fail('discovery_index_mutated_or_manifest_mismatch')
if manifest['recordCount']!=19103: fail('unexpected_source_record_count')

# Shared shell was repaired in one global place, not by rewriting 19k pages.
styles=text('assets/styles.css');app=text('assets/app.js')
if 'HF3.7 SITEWIDE HEADER ORDER' not in styles: fail('sitewide_header_css_missing')
if 'HF3.7 shell DOM order' not in app: fail('sitewide_header_dom_fix_missing')

# Membership sales page: compact, concrete, no operational status/internal prose.
m=soup('membership-start/index.html');mt=m.get_text(' ',strip=True)
if REL not in text('membership-start/index.html'): fail('membership_release_missing')
for banned in ['Enrollment status:','Important boundary','Useful community participation before pricing.']:
    if banned in mt: fail('membership_old_copy:'+banned)
if 'Community Membership' not in mt or '$35' not in mt: fail('membership_offer_missing')
if 'No Similar local profiles' not in mt: fail('membership_competitor_free_benefit_missing')
if 'ordinary Directory ranking' not in mt: fail('membership_ranking_neutrality_missing')
if len(m.select('main > section'))>4: fail('membership_still_too_long')

# Member preview: richer, entered-data-only form and one clear price section.
p=soup('member-profile-preview/index.html');pt=p.get_text(' ',strip=True)
for name in ['name','city','category','phone','email','website','about','services','hours','languages','online','photos']:
    if not p.select_one(f'[name="{name}"]'): fail('preview_field_missing:'+name)
if not p.select_one('[data-r28-preview]'): fail('preview_surface_missing')
if 'What changes on a member profile' in pt: fail('preview_duplicate_comparison_section')
if pt.count('$35')!=1: fail('preview_price_repeated')
if 'No Similar local profiles' not in pt: fail('preview_competitor_free_missing')
if 'Ordinary Directory ranking' not in pt: fail('preview_ranking_neutrality_missing')

# Claim page: search-first workflow, no repeated marketing/process sections.
c=soup('claim-profile/index.html');ct=c.get_text(' ',strip=True)
if not c.select_one('form[action="/directory/"] input[name="q"]'): fail('claim_search_form_missing')
for banned in ['Built for Franklin','Profile is not required for an introduction.','Contact details can change']:
    if banned in ct: fail('claim_old_section:'+banned)
if len(c.select('.hf37-claim-actions > article'))!=4: fail('claim_post_selection_actions_wrong')
if '/profile-request/' not in text('claim-profile/index.html'): fail('claim_missing_profile_route_missing')

# Directory: no database-count hero, local sort and normalized display helpers.
d=soup('directory/index.html');dt=d.get_text(' ',strip=True)
if 'Search 19,103 local profiles' in dt: fail('directory_database_count_in_hero')
core=text('assets/local-discovery-core.js');ld=text('assets/local-discovery.js')
if "sort: ['local', 'name'" not in core or 'const localRank = r =>' not in core: fail('directory_local_rank_missing')
if 'contacts = Number(!!r.websiteHref)' not in core: fail('directory_actionability_rank_missing')
if 'member' in re.search(r'const localRank = r => \{.*?\n    \};',core,re.S).group(0).lower(): fail('directory_membership_in_rank')
if 'categoryAliases' not in ld or 'displayLocation' not in ld: fail('directory_display_normalization_missing')
if "tx('Local profiles', 'Perfiles locales')" not in ld: fail('directory_count_deemphasis_missing')

# Profile Factory handoff must exist and explicitly prohibit automatic merge.
handoff=json.loads((ROOT/'PROFILE_FACTORY_RECONCILIATION_HANDOFF__HF37.json').read_text(encoding='utf-8'))
if handoff['sourceRecordCount']!=manifest['recordCount']: fail('handoff_record_count_mismatch')
if handoff['candidateGroupCount']<1: fail('handoff_no_candidates')
if 'do not auto-merge' not in json.dumps(handoff).lower(): fail('handoff_no_no_automerge_rule')
if 'Profile Factory' not in handoff['authority']: fail('handoff_authority_missing')

# Preserve known-good gates from HF3.6.
sports=soup('sports/index.html')
if len(sports.select('.hf34-explorer-card'))<5: fail('sports_static_first_regressed')
profile=soup('profiles/FR-ORG-5d72d3ee4e9961c5/index.html')
if len(profile.select('.profile-primary-actions a'))<3: fail('profile_direct_contact_actions_regressed')
cor=soup('corrections/index.html')
if not cor.select_one('[name="currentInfo"]') or not cor.select_one('[name="correctInfo"]'): fail('correction_fields_regressed')

report={'release':REL,'counts':{'pages':sum(1 for _ in DIST.rglob('*.html')),'profiles':manifest['recordCount'],'profileFactoryCandidateGroups':handoff['candidateGroupCount']},'issues':issues,'issueCount':len(issues)}
(ROOT/'HF37_QUALIFICATION_REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
if issues:sys.exit(1)
