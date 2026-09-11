#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json,sys,re
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist';REL='FR-NAV1.24.0-HF3.5'
issues=[];counts={'pages':0,'profiles':0,'explorers':0}
def route(p):
    r=p.relative_to(DIST).as_posix();return '/' if r=='index.html' else '/'+(r[:-10] if r.endswith('/index.html') else r)
for p in DIST.rglob('*.html'):
    counts['pages']+=1;r=route(p);txt=p.read_text(encoding='utf-8',errors='replace');s=BeautifulSoup(txt,'html.parser')
    m=s.select_one('meta[name="franklin-release"]')
    if not m or m.get('content')!=REL:issues.append((r,'release_identity'))
    if not s.select_one('link[href^="/assets/hf35.css"]'):issues.append((r,'missing_hf35_css'))
    nav=s.select_one('header nav.nav')
    if nav:
        direct=nav.find_all('a',recursive=False)
        if len(direct)>3:issues.append((r,'nav_direct_links_gt3'))
        if not nav.select_one('details.hf34-nav-more'):issues.append((r,'nav_more_missing'))
    foot=s.select_one('footer .footer-links')
    if foot and len(foot.find_all('a'))>6:issues.append((r,'footer_gt6'))
    if s.select_one('[data-community-explorer]'):
        counts['explorers']+=1
        if len(s.select('.hf34-explorer-card'))<1:issues.append((r,'explorer_static_results_missing'))
    if r.startswith('/profiles/'):
        counts['profiles']+=1
        if not s.select_one('.hf35-contact-label'):issues.append((r,'profile_contact_label_missing'))
        if not s.select_one('script[src^="/assets/hf35-member-public.js"]'):issues.append((r,'profile_hf35_member_runtime_missing'))
        if s.select_one('script[src*="hf34-member-public.js"]'):issues.append((r,'profile_old_member_runtime_present'))
        about_listing=[x for x in s.select('.r22-profile-side h2') if re.search(r'About this listing|Acerca de este listado',x.get_text(' ',strip=True),re.I)]
        if about_listing:issues.append((r,'profile_about_listing_card_present'))
    if r=='/corrections/':
        for name in ('currentInfo','correctInfo','evidenceUrl','removalReason'):
            if not s.select_one(f'[name="{name}"]'):issues.append((r,f'correction_{name}_missing'))
        if not s.select_one('script[src^="/assets/hf35-profile-control.js"]'):issues.append((r,'correction_runtime_missing'))
        if s.select_one('textarea[name="details"]'):issues.append((r,'old_correction_details_present'))
    if r in ('/directory/','/es/directorio/'):
        d=s.select_one('details.hf35-directory-advanced')
        if not d:issues.append((r,'directory_advanced_missing'))
        elif not all(d.select_one(f'[data-dir-{x}]') for x in ('type','area','sort')):issues.append((r,'directory_advanced_controls_missing'))
    if r in ('/business-dashboard/','/es/negocios/'):
        if not s.select_one('.hf35-profile-comparison'):issues.append((r,'business_comparison_missing'))
        if not s.select_one('.hf35-member-focus'):issues.append((r,'business_member_focus_missing'))
        lower=txt.lower()
        if 'controlled audience plans' in lower or 'raw list export' in lower:issues.append((r,'business_internal_jargon'))
    if r in ('/community-help-center/','/es/centro-de-ayuda/'):
        if not s.select_one('details.hf35-help-tools'):issues.append((r,'help_tools_not_collapsed'))
        hero=s.select_one('.help-hero .actions')
        if hero and len(hero.find_all('a',recursive=False))>2:issues.append((r,'help_hero_gt2_actions'))
        if 'server submission' in txt.lower() or 'external ai' in txt.lower():issues.append((r,'help_internal_privacy_jargon'))
    if r in ('/my-franklin/','/es/mi-franklin/'):
        pref=s.select_one('[data-my-franklin] details.r22-dashboard-card')
        if pref and pref.has_attr('open'):issues.append((r,'my_franklin_preferences_open'))
    if r in ('/member-profile-preview/','/es/vista-previa-de-perfil/'):
        if not s.select_one('.hf35-member-preview-comparison'):issues.append((r,'member_preview_comparison_missing'))
if counts['profiles']!=19103:issues.append(('GLOBAL',f'profile_count_{counts["profiles"]}'))
for asset in ('hf35.css','hf35-member-public.js','hf35-profile-control.js'):
    if not (DIST/'assets'/asset).exists():issues.append(('/assets',asset+'_missing'))
pr=ROOT/'PRODUCTION_RELEASE.json'
if not pr.exists():issues.append(('GLOBAL','production_release_missing'))
else:
    try:
        d=json.loads(pr.read_text(encoding='utf-8'))
        if d.get('release')!=REL:issues.append(('GLOBAL','production_release_identity'))
        if d.get('dataAndAuthorityBoundaries',{}).get('profileFactsChanged') is not False:issues.append(('GLOBAL','profile_authority_boundary'))
    except:issues.append(('GLOBAL','production_release_invalid'))
report={'release':REL,'counts':counts,'issues':issues[:1000],'issueCount':len(issues)}
(ROOT/'HF35_QUALIFICATION_REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
if issues:sys.exit(1)
