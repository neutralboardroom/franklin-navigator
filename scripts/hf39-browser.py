#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
from pathlib import Path
from urllib.parse import urlparse
import json, sys

BASE='http://127.0.0.1:8765'
API='https://franklin-navigator-membership.onrender.com'
ROOT=Path(__file__).resolve().parents[1]
SCREENS=ROOT/'hf39-review-screenshots'
SCREENS.mkdir(exist_ok=True)
fail=[]

def chk(cond,route,msg):
    if not cond: fail.append([route,msg])

def cors_headers():
    return {'Access-Control-Allow-Origin':BASE,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json'}

def handler(active=False):
    def fn(route):
        req=route.request; path=urlparse(req.url).path
        if req.method=='OPTIONS':
            route.fulfill(status=204,headers=cors_headers(),body=''); return
        if path=='/api/accounts/me': payload={'account':{'displayName':'Sample owner'}}
        elif path=='/api/member/profiles': payload={'reviewCoverageConfigured':True,'profiles':[{'profile_id':'FR-ORG-5d72d3ee4e9961c5','name':"Carson's Barbershop",'authority_state':'VERIFIED'}]}
        elif path=='/api/member/public-profile': payload={'activePaidMember':active,'publication':None}
        else: payload={}
        route.fulfill(status=200,headers=cors_headers(),body=json.dumps(payload))
    return fn

def header_order(page,route):
    boxes=page.evaluate("""() => {const b=document.querySelector('header .brand')?.getBoundingClientRect(),n=document.querySelector('header nav.nav')?.getBoundingClientRect(),l=document.querySelector('header .r37-language-switch')?.getBoundingClientRect();return b&&n&&l?{b:b.x,n:n.x,l:l.x}:null}""")
    chk(bool(boxes) and boxes['b'] < boxes['n'] < boxes['l'],route,'header_visual_order_wrong')

def no_overflow(page,route):
    chk(not page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2'),route,'horizontal_overflow')

routes=['/','/directory/','/get-it-done/','/today/','/activities/','/community/','/my-franklin/','/business-dashboard/','/community-help-center/']
review=[]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1366,'height':768})
    ctx.route(API+'/**',handler(False))
    for route in routes:
        pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e,errs=errs:errs.append(str(e)))
        try:
            pg.goto(BASE+route,wait_until='domcontentloaded',timeout=30000); pg.wait_for_timeout(1100)
            chk(pg.locator('h1').first.count()>0 and pg.locator('h1').first.is_visible(),route,'h1_not_visible')
            header_order(pg,route); no_overflow(pg,route)
            name=route.strip('/').replace('/','-') or 'home'; pg.screenshot(path=str(SCREENS/f'{name}.png'),full_page=True)
            if errs: fail.append([route,'pageerror:'+errs[0][:180]])
            review.append({'route':route,'desktop':'PASS' if not errs else 'CHECKED_WITH_ERROR'})
        except Exception as e:
            fail.append([route,'navigation:'+str(e)[:220]])
        finally: pg.close()

    pg=ctx.new_page(); pg.goto(BASE+'/',wait_until='domcontentloaded'); pg.wait_for_timeout(500)
    chk(pg.get_by_text('Sources were last refreshed',exact=False).count()==0,'/','refresh_copy_visible')
    chk(pg.get_by_text('Franklin Through Time — Then & Now',exact=True).count()==1,'/','then_now_missing')
    chk(pg.locator('.r24-business-section .actions a').count()==1,'/','business_cta_not_single')
    chk(pg.get_by_text('About · services · photos · website · booking · social links',exact=True).count()==1,'/','member_preview_value_missing'); pg.close()

    pg=ctx.new_page(); pg.goto(BASE+'/directory/',wait_until='domcontentloaded'); pg.wait_for_timeout(1700)
    cards=pg.locator('[data-dir-results] .r22-profile-result')
    chk(0<cards.count()<=16,'/directory/','directory_card_count')
    chk(pg.get_by_text('Source date:',exact=False).count()==0,'/directory/','directory_source_date_visible')
    chk(pg.locator('.hf39-compare-choice input[type="checkbox"]').count()==cards.count(),'/directory/','directory_compare_checkbox_missing')
    cats=[x.strip() for x in pg.locator('[data-dir-results] .category-tag').all_text_contents() if x.strip()]
    chk(len(set(cats))>=4,'/directory/','directory_default_not_diverse')
    chk(sum(1 for x in cats if x=='Park & recreation')<=2,'/directory/','directory_parks_dominate_first_page')
    pg.close()

    pg=ctx.new_page(); pg.goto(BASE+'/get-it-done/',wait_until='domcontentloaded'); pg.wait_for_timeout(500)
    visible=pg.locator('.task-card:visible'); chk(visible.count()==6,'/get-it-done/','starter_task_count')
    cols=pg.locator('[data-task-grid]').evaluate("el=>getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length")
    chk(cols==3,'/get-it-done/','desktop_grid_not_3x2')
    pg.locator('[data-task-search]').fill('permit'); pg.wait_for_timeout(100)
    chk(pg.locator('.task-card:visible').count()==1,'/get-it-done/','task_search_not_filtering')
    chk(pg.get_by_text('Private on your device · Official sources · Copy/print · My Franklin reminders',exact=True).count()==1,'/get-it-done/','compact_trust_missing'); pg.close()

    pg=ctx.new_page(); pg.goto(BASE+'/today/',wait_until='domcontentloaded'); pg.wait_for_timeout(500)
    chk(pg.get_by_text('Franklin Splash Park extension',exact=False).count()==0,'/today/','expired_splash_visible')
    chk(pg.get_by_text('Franklin 9/11 Remembrance Ceremony',exact=False).count()==0,'/today/','expired_memorial_visible')
    chk(pg.get_by_text('Freshness at a glance',exact=False).count()==0,'/today/','freshness_panel_visible')
    for label in ['Today','Coming up','Registration & deadlines']:
        chk(pg.get_by_text(label,exact=True).count()>=1,'/today/','group_missing:'+label)
    pg.close()

    pg=ctx.new_page(); pg.goto(BASE+'/activities/',wait_until='domcontentloaded'); pg.wait_for_timeout(900)
    chk(pg.get_by_text('Franklin Splash Park extension',exact=False).count()==0,'/activities/','expired_splash_visible')
    chk(pg.get_by_text('Franklin 9/11 Remembrance Ceremony',exact=False).count()==0,'/activities/','expired_memorial_visible')
    chk(pg.get_by_text('Last checked:',exact=False).count()==0,'/activities/','last_checked_visible')
    chk(pg.get_by_text('Activities & local options',exact=True).count()==1,'/activities/','activity_summary_missing')
    chk(pg.get_by_text('Official resources & starting points',exact=True).count()==1,'/activities/','official_resources_disclosure_missing')
    pg.close()

    pg=ctx.new_page(); pg.goto(BASE+'/community/',wait_until='domcontentloaded'); pg.wait_for_timeout(350)
    chk(pg.get_by_text('Ways to participate',exact=True).count()>=1,'/community/','ways_cta_missing')
    chk(pg.get_by_text('Volunteer locally',exact=True).count()==1,'/community/','volunteer_copy_missing')
    chk(pg.get_by_text('Add to My Franklin',exact=True).count()==1,'/community/','compact_my_franklin_missing'); pg.close()

    pg=ctx.new_page(); pg.goto(BASE+'/my-franklin/',wait_until='domcontentloaded'); pg.wait_for_timeout(900)
    chk(pg.get_by_text('Reminders',exact=True).count()==1,'/my-franklin/','reminders_heading_missing')
    chk(pg.get_by_text('Follow-ups',exact=True).count()==0,'/my-franklin/','followups_still_visible')
    chk(pg.locator('.hf36-saved-blocks').is_hidden(),'/my-franklin/','empty_saved_blocks_not_hidden')
    chk(pg.get_by_text('Personalize My Franklin',exact=True).count()==1,'/my-franklin/','personalize_summary_missing')
    chk(pg.get_by_text('Local address lookups',exact=True).count()==1,'/my-franklin/','address_lookup_summary_missing'); pg.close()

    pg=ctx.new_page(); pg.goto(BASE+'/business-dashboard/',wait_until='domcontentloaded'); pg.wait_for_timeout(750)
    chk(pg.locator('[data-business-primary]').inner_text()=='Preview my member profile','/business-dashboard/','nonmember_next_action_wrong')
    chk(pg.locator('[data-business-membership-cta]').inner_text()=='Review membership — $35/year','/business-dashboard/','nonmember_membership_cta_wrong')
    chk(pg.get_by_text('Free business tools',exact=True).count()==1,'/business-dashboard/','free_business_tools_copy')
    pg.close()

    pg=ctx.new_page(); pg.goto(BASE+'/community-help-center/',wait_until='domcontentloaded'); pg.wait_for_timeout(450)
    chk(pg.locator('.urgent-card').count()==5,'/community-help-center/','urgent_card_count')
    chk(pg.get_by_text('More help & tools',exact=True).count()==1,'/community-help-center/','compact_more_help_missing')
    chk(pg.get_by_text('Preparation Studio',exact=False).count()==0,'/community-help-center/','deep_preparation_content_still_visible')
    chk(pg.get_by_text('Legal Aid Society clinics and events',exact=False).count()==0,'/community-help-center/','legal_directory_still_embedded')
    pg.get_by_text('More help & tools',exact=True).click(); pg.wait_for_timeout(100)
    chk(pg.get_by_text('Preparation tools',exact=True).count()==1,'/community-help-center/','preparation_link_missing')
    pg.close()

    # Active-member state on business dashboard.
    act=browser.new_context(viewport={'width':1366,'height':768}); act.route(API+'/**',handler(True))
    pg=act.new_page(); pg.goto(BASE+'/business-dashboard/',wait_until='domcontentloaded'); pg.wait_for_timeout(700)
    chk(pg.locator('[data-business-primary]').inner_text()=='Manage my member profile','/business-dashboard/active','active_member_next_action_wrong')
    chk(pg.locator('[data-business-membership-cta]').inner_text()=='Manage membership','/business-dashboard/active','active_member_membership_cta_wrong')
    chk(not pg.locator('[data-business-readiness]').is_hidden(),'/business-dashboard/active','active_member_readiness_hidden'); pg.close(); act.close()

    # Critical regressions untouched by HF3.9.
    pg=ctx.new_page(); pg.goto(BASE+'/sports/',wait_until='domcontentloaded'); pg.wait_for_timeout(500)
    chk(pg.locator('.hf34-explorer-card').count()>=5,'/sports/','sports_static_results_missing'); pg.close()
    pg=ctx.new_page(); pg.goto(BASE+"/corrections/?listing=Carson%27s%20Barbershop&profile=FR-ORG-5d72d3ee4e9961c5",wait_until='domcontentloaded'); pg.wait_for_timeout(300)
    chk(pg.locator('[name="profileId"]').input_value()=='FR-ORG-5d72d3ee4e9961c5','/corrections/','correction_profile_prefill'); pg.close()
    pg=ctx.new_page(); pg.goto(BASE+'/profiles/FR-ORG-5d72d3ee4e9961c5/',wait_until='domcontentloaded'); pg.wait_for_timeout(600)
    chk(pg.locator('.profile-primary-actions a').count()>=3,'/profiles/sample','profile_contact_actions_missing')
    chk(pg.locator('.hf35-competitor-card').count()>=1,'/profiles/sample','free_profile_related_profiles_missing'); pg.close()
    ctx.close()

    nojs=browser.new_context(java_script_enabled=False,viewport={'width':1366,'height':768})
    pg=nojs.new_page(); pg.goto(BASE+'/sports/',wait_until='domcontentloaded',timeout=25000)
    chk(pg.locator('.hf34-explorer-card').count()>=5,'/sports/nojs','sports_nojs_results_missing'); pg.close(); nojs.close()

    mob=browser.new_context(viewport={'width':390,'height':844}); mob.route(API+'/**',handler(False))
    mobile_routes=routes+['/sports/','/profiles/FR-ORG-5d72d3ee4e9961c5/','/es/deportes/','/es/centro-de-ayuda/']
    for route in mobile_routes:
        pg=mob.new_page()
        try:
            pg.goto(BASE+route,wait_until='domcontentloaded',timeout=30000); pg.wait_for_timeout(500); no_overflow(pg,route); review.append({'route':route,'mobile':'PASS'})
        except Exception as e: fail.append([route,'mobile_navigation:'+str(e)[:180]])
        finally: pg.close()
    mob.close(); browser.close()

receipt={'release':'FR-NAV1.28.0-HF3.9','routesReviewed':routes,'mobileRoutes':mobile_routes,'screenshots':[str(x.relative_to(ROOT)) for x in sorted(SCREENS.glob('*.png'))],'failures':fail,'failureCount':len(fail),'status':'PASS' if not fail else 'FAIL'}
(ROOT/'HF39_BROWSER_QUALIFICATION_REPORT.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt,indent=2))
if fail: sys.exit(1)
