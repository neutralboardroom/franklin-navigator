#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json,re,sys
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist';REL='FR-NAV1.23.0-HF3.4'
issues=[];counts={'pages':0,'profiles':0,'explorers':0}
def route(p):
    r=p.relative_to(DIST).as_posix();return '/' if r=='index.html' else '/'+(r[:-10] if r.endswith('/index.html') else r)
for p in DIST.rglob('*.html'):
    counts['pages']+=1;r=route(p);txt=p.read_text(encoding='utf-8',errors='replace');s=BeautifulSoup(txt,'html.parser')
    m=s.select_one('meta[name="franklin-release"]')
    if not m or m.get('content')!=REL:issues.append((r,'release_identity'))
    if not s.select_one('link[href^="/assets/hf34.css"]'):issues.append((r,'missing_hf34_css'))
    nav=s.select_one('header nav.nav')
    if nav:
        direct=[a for a in nav.find_all('a',recursive=False)]
        if len(direct)>3:issues.append((r,'nav_too_many'))
        if not nav.select_one('details.hf34-nav-more'):issues.append((r,'nav_missing_more'))
    foot=s.select_one('footer .footer-links')
    if foot and len(foot.find_all('a'))>6:issues.append((r,'footer_too_many'))
    if 'hf33-next-version' in txt or 'hf33-explorer-preload' in txt:issues.append((r,'hf33_leak'))
    if s.select_one('[data-community-explorer]'):
        counts['explorers']+=1
        if 'hf31-deep-language-runtime.js' in txt or 'community-explorer.js' in txt:issues.append((r,'legacy_explorer_runtime'))
        if not s.select_one('script[src^="/assets/hf34-explorer.js"]'):issues.append((r,'missing_explorer_runtime'))
        if len(s.select('.hf34-explorer-card'))<1:issues.append((r,'no_static_explorer_results'))
    if r.startswith('/profiles/'):
        counts['profiles']+=1;pid=r.rstrip('/').split('/')[-1]
        links=[a.get('href','') for a in s.find_all('a',href=True) if a.get('href','').startswith('/corrections/')]
        if not any(('profile='+pid) in h for h in links):issues.append((r,'profile_correction_missing_id'))
        if not s.select_one('script[src^="/assets/hf34-member-public.js"]'):issues.append((r,'member_runtime_missing'))
    if r=='/corrections/':
        if not s.select_one('.hf34-internal-field'):issues.append((r,'correction_internal_field_not_hidden'))
    if r in ('/business-dashboard/','/es/negocios/'):
        if 'controlled audience plans' in txt.lower() or 'raw list export' in txt.lower():issues.append((r,'business_jargon'))
        if txt.count('Find or review my profile')>1:issues.append((r,'duplicate_business_cta'))
        if 'Active member profiles do not show Similar local profiles on their own profile page.' not in txt and r=='/business-dashboard/':issues.append((r,'member_focus_benefit_missing'))
    if r in ('/community-help-center/','/es/centro-de-ayuda/'):
        if not s.select_one('.hf34-help-more details'):issues.append((r,'help_not_collapsed'))
    if r in ('/directory/','/es/directorio/') and not ('hf34-directory' in (s.body.get('class',[]) if s.body else [])):issues.append((r,'directory_class_missing'))
    if r in ('/my-franklin/','/es/mi-franklin/'):
        if not s.select_one('.hf34-my-tools'):issues.append((r,'my_franklin_tools_not_compacted'))
        if s.select_one('.r22-dashboard-side'):issues.append((r,'my_franklin_side_rail_remains'))
    if r=='/member-profile-preview/' and 'No Similar local profiles section on your active member profile' not in txt:issues.append((r,'member_preview_difference_missing'))
    if r=='/membership-start/' and 'Active member profiles do not show Similar local profiles on their own profile page.' not in txt:issues.append((r,'membership_decision_benefit_missing'))
# Shared runtime/asset invariants.
for asset in ('hf34.css','hf34-explorer.js','hf34-member-public.js','profile-control.js'):
    if not (DIST/'assets'/asset).exists():issues.append(('/assets',f'missing_{asset}'))
i18n=(DIST/'assets/r37-i18n.js').read_text(encoding='utf-8')
if 'HF2.7 shared navigation and next-action hierarchy loader' in i18n or 'hf27-navigation.js' in i18n:issues.append(('/assets/r37-i18n.js','legacy_nav_loader_remains'))
member=(DIST/'assets/hf34-member-public.js').read_text(encoding='utf-8')
if 'competitorCards' not in member or 'Explore ' not in member:issues.append(('/assets/hf34-member-public.js','active_member_competitor_suppression_incomplete'))
# Release governance.
prod=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text(encoding='utf-8'))
if prod.get('release')!=REL:issues.append(('/PRODUCTION_RELEASE.json','release_mismatch'))
if prod.get('parentSourceCommit')!='1da2b9b9c52a71291292e1ce4ebf3fc104502648':issues.append(('/PRODUCTION_RELEASE.json','wrong_rollback_parent'))
if prod.get('nextVersionImprovementList')!='NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_23_0_HF34.md':issues.append(('/PRODUCTION_RELEASE.json','next_version_list_mismatch'))
if not (ROOT/'NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_23_0_HF34.md').exists():issues.append(('/','next_version_list_missing'))
# Exact no-loss scale checks.
if counts['profiles']!=19103:issues.append(('/profiles',f'profile_count_{counts["profiles"]}'))
if counts['explorers']!=50:issues.append(('/explorers',f'explorer_count_{counts["explorers"]}'))
report={'release':REL,'counts':counts,'issues':issues[:500],'issueCount':len(issues)}
(ROOT/'HF34_QUALIFICATION_REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
if issues:sys.exit(1)
