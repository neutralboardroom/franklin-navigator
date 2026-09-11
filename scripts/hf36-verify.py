#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json,sys,re
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist';REL='FR-NAV1.25.0-HF3.6'
issues=[]
def fail(msg):issues.append(msg)
def soup(rel):
    p=DIST/rel
    if not p.exists():fail('missing:'+rel);return None
    return BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
def text(n):return ' '.join(n.get_text(' ',strip=True).split()) if n else ''
htmls=list(DIST.rglob('*.html'))
profiles=list((DIST/'profiles').glob('*/index.html')) if (DIST/'profiles').exists() else []
if len(profiles)!=19103:fail(f'profile_count:{len(profiles)}')
# Site-wide shell integrity: one release, one HF36 asset pair, language in header whenever present.
for p in htmls:
    raw=p.read_text(encoding='utf-8',errors='ignore')
    if REL not in raw:fail('release_missing:'+p.relative_to(DIST).as_posix())
    if '/assets/hf36.css?v=frnav1250' not in raw:fail('hf36_css_missing:'+p.relative_to(DIST).as_posix())
    if '/assets/hf36.js?v=frnav1250' not in raw:fail('hf36_js_missing:'+p.relative_to(DIST).as_posix())
    if 'r37-language-switch' in raw and 'hf36-language-in-header' not in raw:fail('language_not_moved:'+p.relative_to(DIST).as_posix())
    if len(issues)>40:break
# Reviewed pages.
home=soup('index.html')
if home:
    if home.select_one('.r22-history details'):fail('home_history_still_collapsed')
    if len(home.select('.r22-history-grid img'))<3:fail('home_history_images_missing')
    if not home.select_one('.hf36-history-visible'):fail('home_history_visible_wrapper_missing')
    if len(home.select('.r24-home-events article'))>2:fail('home_too_many_current_cards')
getit=soup('get-it-done/index.html')
if getit:
    if len(getit.select('[data-task-grid] article'))<12:fail('getit_task_loss')
    if len(getit.select('[data-task-grid] .hf36-extra-task'))<5:fail('getit_extra_tasks_not_collapsed')
    if getit.select('[data-task-grid] [data-r22-remind]'):fail('getit_repeated_followups_remain')
    if 'no qualified guide was removed' in text(getit).lower():fail('getit_internal_language')
    if not getit.select_one('[data-hf36-show-tasks]'):fail('getit_show_all_missing')
act=soup('activities/index.html')
if act:
    if len(act.select('[data-explorer-grid] article'))<60:fail('activities_record_loss')
    if len(act.select('.hf36-extra-activity'))<50:fail('activities_initial_collapse_missing')
    if not act.select_one('.hf36-current-activities'):fail('activities_current_not_promoted')
    if 'Explore other sports and activities' in text(act):fail('activities_malformed_block_remains')
    for h in act.select('main h2,main h3'):
        if not text(h):fail('activities_blank_heading')
com=soup('community/index.html')
if com:
    hero=com.select_one('.r22-hero .actions')
    if hero and len(hero.find_all('a',recursive=False))>2:fail('community_hero_too_many_actions')
    if len(com.select('.r22-compact-grid > article'))>4:fail('community_too_many_primary_cards')
    if not com.select_one('details.hf36-community-resources'):fail('community_resources_not_collapsed')
    if any('/es/' in (a.get('href') or '') for a in com.select('.hf36-stay-connected .actions a')):fail('community_duplicate_spanish_cta')
my=soup('my-franklin/index.html')
if my:
    if not my.select_one('.hf36-saved-hub'):fail('myfranklin_saved_hub_missing')
    if my.select_one('#assistant-next-steps'):fail('myfranklin_old_assistant_card_remains')
    if len(my.select('.hf36-saved-block'))!=3:fail('myfranklin_saved_blocks_wrong')
    if not my.select_one('#follow-ups'):fail('myfranklin_reminders_missing')
biz=soup('business-dashboard/index.html')
if biz:
    if biz.select('.hf35-member-focus'):fail('business_duplicate_focus_panel')
    if not biz.select_one('.hf36-membership-card'):fail('business_compact_membership_card_missing')
    if not biz.find(string=re.compile(r'Join Community Membership')):fail('business_join_cta_missing')
    if not biz.select_one('.hf36-membership-trust'):fail('business_trust_note_missing')
help_=soup('community-help-center/index.html')
if help_:
    if any('pinkerton' in (img.get('src') or '').lower() for img in help_.select('main img')):fail('help_pinkerton_remains')
    if len(help_.select('details.hf35-help-tools'))!=1:fail('help_combined_details_missing')
    if help_.select_one('.hf34-help-more'):fail('help_duplicate_specialized_section')
dir_=soup('directory/index.html')
if dir_:
    if not dir_.select_one('[data-dir-sort] option[value="local"]'):fail('directory_local_sort_missing')
    if not dir_.select_one('body.hf36-directory'):fail('directory_class_missing')
# Preserve static-first sports pages and profile actions.
sports=soup('sports/index.html')
if sports and len(sports.select('.hf34-explorer-card'))<5:fail('sports_static_results_lost')
prof=soup('profiles/FR-ORG-5d72d3ee4e9961c5/index.html')
if prof:
    if len(prof.select('.profile-primary-actions a'))<3:fail('profile_contact_actions_lost')
    if not prof.select_one('.hf35-competitor-card'):fail('free_profile_similar_module_lost')
cor=soup('corrections/index.html')
if cor:
    for field in ['currentInfo','correctInfo','evidenceUrl']:
        if not cor.select_one(f'[name="{field}"]'):fail('correction_field_lost:'+field)
# Runtime source checks.
core=(DIST/'assets/local-discovery-core.js').read_text(encoding='utf-8')
js=(DIST/'assets/local-discovery.js').read_text(encoding='utf-8')
if 'HF3.6 local relevance and conservative duplicate suppression' not in core:fail('directory_core_patch_missing')
if "'local'" not in core:fail('directory_local_sort_runtime_missing')
if 'HF3.6 compact resident-facing directory card' not in js:fail('directory_card_patch_missing')
if 'const perPage = 16;' not in js:fail('directory_page_size_wrong')
report={'release':REL,'counts':{'pages':len(htmls),'profiles':len(profiles)},'issues':issues,'issueCount':len(issues)}
(ROOT/'HF36_QUALIFICATION_REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
if issues:sys.exit(1)
