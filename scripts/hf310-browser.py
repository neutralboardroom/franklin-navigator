#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
from pathlib import Path
from urllib.parse import urlparse
import json,sys
BASE='http://127.0.0.1:8765'; API='https://franklin-navigator-membership.onrender.com'
ROOT=Path(__file__).resolve().parents[1]; SHOTS=ROOT/'hf310-review-screenshots'; SHOTS.mkdir(exist_ok=True)
fail=[]
def chk(cond,route,msg):
    if not cond: fail.append([route,msg])
def cors(): return {'Access-Control-Allow-Origin':BASE,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json'}
def handler(active=False,profile=True):
    def fn(route):
        req=route.request; path=urlparse(req.url).path
        if req.method=='OPTIONS': route.fulfill(status=204,headers=cors(),body=''); return
        if path=='/api/accounts/me': payload={'account':{'displayName':'Sample owner'}}
        elif path=='/api/member/profiles': payload={'profiles':([{'profile_id':'FR-ORG-5d72d3ee4e9961c5','name':"Carson's Barbershop",'authority_state':'VERIFIED'}] if profile else [])}
        elif path=='/api/member/public-profile': payload={'activePaidMember':active,'publication':None}
        else: payload={}
        route.fulfill(status=200,headers=cors(),body=json.dumps(payload))
    return fn

def no_overflow(page,route): chk(not page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2'),route,'horizontal_overflow')
def header_order(page,route):
    b=page.evaluate("""() => {const x=document.querySelector('header .brand')?.getBoundingClientRect(),n=document.querySelector('header nav.nav')?.getBoundingClientRect(),l=document.querySelector('header .r37-language-switch')?.getBoundingClientRect();return x&&n&&l?{x:x.x,n:n.x,l:l.x}:null}""")
    chk(bool(b) and b['x']<b['n']<b['l'],route,'header_order_wrong')
def button_contrast(page,route):
    bad=page.evaluate("""() => {
      const rgb=s=>{const m=String(s).match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);return m?[+m[1],+m[2],+m[3]]:null};
      const lum=c=>{const v=c.map(x=>x/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2]};
      const ratio=(a,b)=>{a=lum(a);b=lum(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
      const bg=el=>{let n=el;while(n){const c=getComputedStyle(n).backgroundColor;if(c&&!/rgba\([^)]*,\s*0\)/.test(c)&&c!=='transparent')return rgb(c);n=n.parentElement}return [255,255,255]};
      return [...document.querySelectorAll('a.button,button.button')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0}).map(el=>{const c=rgb(getComputedStyle(el).color),b=bg(el);return {t:(el.textContent||'').trim(),r:c&&b?ratio(c,b):99}}).filter(x=>x.r<4.5)
    }""")
    chk(not bad,route,'button_contrast:'+json.dumps(bad[:3]))

routes=['/member-profile-preview/','/membership-start/','/business-dashboard/','/local-growth-engine/','/navigator-growth-desk/','/claim-profile/','/','/directory/','/get-it-done/','/today/','/activities/','/community/','/my-franklin/','/community-help-center/','/sports/']
review=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1366,'height':768}); ctx.route(API+'/**',handler(False,False))
    for route in routes:
        pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e,errs=errs:errs.append(str(e)))
        try:
            pg.goto(BASE+route,wait_until='domcontentloaded',timeout=30000); pg.wait_for_timeout(700)
            chk(pg.locator('h1').first.count()>0 and pg.locator('h1').first.is_visible(),route,'h1_missing')
            header_order(pg,route); no_overflow(pg,route); button_contrast(pg,route)
            if errs: fail.append([route,'pageerror:'+errs[0][:180]])
            if route in routes[:6]: pg.screenshot(path=str(SHOTS/(route.strip('/').replace('/','-')+'.png')),full_page=True)
            review.append({'route':route,'desktop':'PASS'})
        except Exception as e: fail.append([route,'navigation:'+str(e)[:180]])
        finally: pg.close()
    # Real-profile member preview prefill and richer preview.
    pg=ctx.new_page(); route='/member-profile-preview/?profile=FR-ORG-5d72d3ee4e9961c5'; pg.goto(BASE+route,wait_until='domcontentloaded'); pg.wait_for_timeout(1600)
    chk(pg.locator('input[name="name"]').input_value()=="Carson's Barbershop",route,'profile_name_not_prefilled')
    chk(pg.locator('input[name="category"]').is_editable()==False,route,'canonical_category_not_readonly')
    chk(pg.get_by_text("Carson's Barbershop",exact=True).count()>=1,route,'real_business_not_in_preview')
    for label in ['Website','Call','Email']:
        chk(pg.locator('.hf310-preview-actions').get_by_text(label,exact=True).count()==1,route,'preview_action_missing:'+label)
    chk(pg.locator('.hf310-preview-section').count()>=4,route,'rich_preview_sections_missing'); pg.close()
    # Membership sales page should be concise and have one decision card.
    pg=ctx.new_page(); route='/membership-start/'; pg.goto(BASE+route,wait_until='domcontentloaded'); pg.wait_for_timeout(400)
    chk(pg.locator('.hf310-decision-card').count()==1,route,'membership_decision_card_count')
    chk(pg.locator('.hf310-member-example').count()==1,route,'member_visual_example_missing')
    chk(pg.get_by_text('Membership details & profile review',exact=True).count()==1,route,'membership_details_label_missing'); pg.close()
    # Growth planner: no marketing blockers; result appears only after build.
    pg=ctx.new_page(); route='/local-growth-engine/'; pg.goto(BASE+route,wait_until='domcontentloaded'); pg.wait_for_timeout(500)
    chk(pg.locator('.local-hero-photo').count()==0,route,'large_photo_still_visible')
    chk(pg.get_by_text('19,103',exact=True).count()==0,route,'database_metric_visible')
    chk(not pg.locator('[data-hf310-plan-output]').evaluate("el=>el.classList.contains('is-ready')"),route,'empty_plan_marked_ready')
    pg.locator('[name="vertical"]').select_option('professional-services'); pg.locator('[name="goal"]').select_option('discovery'); pg.locator('[name="identity"]').check(); pg.get_by_role('button',name='Build my plan').click(); pg.wait_for_timeout(700)
    chk(pg.locator('[data-hf310-plan-output]').evaluate("el=>el.classList.contains('is-ready')"),route,'plan_not_ready_after_submit')
    chk(pg.locator('[data-growth-actions] .growth-action').count()>=1,route,'priority_actions_missing')
    chk(pg.locator('[data-growth-copy]').is_enabled(),route,'copy_plan_not_enabled'); pg.close()
    # Claim page: one search, suggestions, selected profile actions preserve ID.
    pg=ctx.new_page(); route='/claim-profile/'; pg.goto(BASE+route,wait_until='domcontentloaded'); pg.locator('#hf310-profile-q').fill('Carson'); pg.wait_for_timeout(1400)
    chk(pg.locator('[data-hf310-claim-search-form]').count()==1,route,'claim_search_count')
    chk(pg.locator('.r37-claim-search').count()==0,route,'legacy_duplicate_search_visible')
    chk(pg.locator('.hf310-claim-result').count()>=1,route,'live_claim_results_missing'); pg.locator('.hf310-claim-result').first.click(); pg.wait_for_timeout(150)
    chk(not pg.locator('[data-hf310-claim-selected]').is_hidden(),route,'selected_profile_panel_hidden')
    acts=pg.locator('[data-hf310-profile-actions] a'); chk(acts.count()==4,route,'selected_profile_action_count')
    hrefs=acts.evaluate_all("els=>els.map(e=>e.getAttribute('href'))"); chk(all('FR-ORG-5d72d3ee4e9961c5' in h for h in hrefs),route,'profile_id_not_carried_forward'); pg.close()
    # Critical unchanged regressions.
    pg=ctx.new_page(); pg.goto(BASE+'/profiles/FR-ORG-5d72d3ee4e9961c5/',wait_until='domcontentloaded'); pg.wait_for_timeout(300)
    chk(pg.locator('.profile-primary-actions a').count()>=3,'/profiles/sample','profile_contacts_lost'); chk(pg.locator('.hf35-competitor-card').count()>=1,'/profiles/sample','free_related_profiles_lost'); pg.close()
    pg=ctx.new_page(); pg.goto(BASE+'/corrections/?profile=FR-ORG-5d72d3ee4e9961c5',wait_until='domcontentloaded'); pg.wait_for_timeout(250)
    chk(pg.locator('[name="profileId"]').input_value()=='FR-ORG-5d72d3ee4e9961c5','/corrections/','correction_profile_prefill_lost'); pg.close()
    ctx.close()
    # Active-member/state-aware checks.
    act=browser.new_context(viewport={'width':1366,'height':768}); act.route(API+'/**',handler(True,True))
    pg=act.new_page(); pg.goto(BASE+'/business-dashboard/',wait_until='domcontentloaded'); pg.wait_for_timeout(1000)
    chk("Carson's Barbershop" in pg.locator('[data-hf310-business-heading]').inner_text(),'/business-dashboard/active','business_name_not_shown')
    chk(pg.locator('[data-business-primary]').inner_text()=='Manage my member profile','/business-dashboard/active','active_primary_wrong')
    chk(pg.locator('[data-business-membership-cta]').inner_text()=='Manage membership','/business-dashboard/active','active_membership_cta_wrong'); pg.close()
    pg=act.new_page(); pg.goto(BASE+'/navigator-growth-desk/',wait_until='domcontentloaded'); pg.wait_for_timeout(1000)
    chk(pg.get_by_text('Beauty, fitness & wellness',exact=True).count()>=1,'/navigator-growth-desk/active','profile_guide_recommendation_wrong'); pg.close(); act.close()
    # Sports remains useful without JS.
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':1366,'height':768}); pg=nojs.new_page(); pg.goto(BASE+'/sports/',wait_until='domcontentloaded'); chk(pg.locator('.hf34-explorer-card').count()>=5,'/sports/nojs','sports_nojs_lost'); pg.close(); nojs.close()
    # Mobile overflow + button contrast on changed pages.
    mob=browser.new_context(viewport={'width':390,'height':844}); mob.route(API+'/**',handler(False,False))
    for route in routes[:6]:
        pg=mob.new_page()
        try: pg.goto(BASE+route,wait_until='domcontentloaded',timeout=30000); pg.wait_for_timeout(500); no_overflow(pg,route+'/mobile'); button_contrast(pg,route+'/mobile'); review.append({'route':route,'mobile':'PASS'})
        except Exception as e: fail.append([route,'mobile:'+str(e)[:180]])
        finally: pg.close()
    mob.close(); browser.close()
report={'release':'FR-NAV1.29.0-HF3.10','routesReviewed':routes,'screenshots':[str(x.relative_to(ROOT)) for x in sorted(SHOTS.glob('*.png'))],'failures':fail,'failureCount':len(fail),'status':'PASS' if not fail else 'FAIL'}
(ROOT/'HF310_BROWSER_QUALIFICATION_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if fail: sys.exit(1)
