#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import json,sys,re
BASE='http://127.0.0.1:8765';fail=[]
ROUTES=['/','/sports/','/sports/bowling/','/get-it-done/','/activities/','/community/','/my-franklin/','/business-dashboard/','/community-help-center/','/directory/','/corrections/?listing=Carson%27s%20Barbershop&url=https%3A%2F%2Ffranklinnavigator.com%2Fprofiles%2FFR-ORG-5d72d3ee4e9961c5%2F&profile=FR-ORG-5d72d3ee4e9961c5','/profiles/FR-ORG-5d72d3ee4e9961c5/','/es/actividades/','/es/mi-franklin/']
def contrast_failures(page):
    return page.evaluate("""() => {
      const parse=s=>{const m=String(s||'').match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)(?:[, /]+([0-9.]+))?/i);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null};
      const lin=c=>{c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)};
      const lum=c=>.2126*lin(c[0])+.7152*lin(c[1])+.0722*lin(c[2]);
      const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
      const bgFor=el=>{let n=el;while(n&&n!==document.documentElement){const c=parse(getComputedStyle(n).backgroundColor);if(c&&c[3]>.04)return c;n=n.parentElement}return [255,255,255,1]};
      const out=[];for(const el of [...document.querySelectorAll('main h1,main h2,main h3,main p,main label,main li,main summary')].slice(0,400)){const r=el.getBoundingClientRect(),s=getComputedStyle(el);if(r.width<=0||r.height<=0||s.visibility==='hidden'||s.display==='none'||Number(s.opacity||1)<=.15)continue;const fg=parse(s.color),bg=bgFor(el);if(!fg)continue;const min=/^H[1-3]$/.test(el.tagName)?3:4;const cr=ratio(fg,bg);if(cr<min){out.push({tag:el.tagName,text:(el.textContent||'').trim().slice(0,55),contrast:+cr.toFixed(2)});if(out.length>=4)break}}return out;
    }""")
def chk(cond,route,msg):
    if not cond:fail.append([route,msg])
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1366,'height':768})
    ctx.route('https://franklin-navigator-membership.onrender.com/api/member/public-profile**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({'activePaidMember':False,'publication':None})))
    for route in ROUTES:
        page=ctx.new_page();errs=[];page.on('pageerror',lambda e,errs=errs:errs.append(str(e)))
        try:
            page.goto(BASE+route,wait_until='domcontentloaded',timeout=20000);page.wait_for_timeout(800)
            chk(page.locator('h1').first.count()>0 and page.locator('h1').first.is_visible(),route,'h1_not_visible')
            chk(page.locator('header .top .r37-language-switch').count()==1,route,'language_not_in_header')
            chk(page.locator('header nav.nav > a').count()<=3,route,'nav_too_many_primary_links')
            if errs:fail.append([route,'pageerror:'+errs[0][:160]])
            low=contrast_failures(page)
            if low:fail.append([route,'low_contrast:'+json.dumps(low,ensure_ascii=False)])
            if route=='/':
                chk(page.locator('.r22-history-grid img:visible').count()>=3,route,'history_not_visible')
                chk(page.locator('.r22-history details').count()==0,route,'history_still_disclosure')
            if route=='/sports/':
                chk(page.locator('.hf34-explorer-card').count()>=5,route,'sports_static_results_missing')
                page.locator('[data-explorer-search]').fill('bowling');page.wait_for_timeout(150)
                chk(page.locator('.hf34-explorer-card:visible').count()>=1,route,'sports_filter_failed')
            if route=='/get-it-done/':
                visible=page.locator('[data-task-grid] article:visible').count();chk(5<=visible<=7,route,'getit_initial_count_wrong')
                chk(page.get_by_text('Save a follow-up').count()==0,route,'getit_repeated_save_visible')
                page.locator('[data-hf36-show-tasks]').click();page.wait_for_timeout(80)
                chk(page.locator('[data-task-grid] article:visible').count()>=12,route,'getit_show_all_failed')
            if route=='/activities/':
                chk(page.locator('.hf36-current-activities').count()==1,route,'activities_current_missing')
                initial=page.locator('[data-explorer-grid] article:visible').count();chk(6<=initial<=10,route,'activities_initial_count_wrong')
                page.locator('[data-hf36-show-activities]').click();page.wait_for_timeout(80)
                chk(page.locator('[data-explorer-grid] article:visible').count()>=60,route,'activities_show_more_failed')
                page.locator('[data-explorer-search]').fill('bowling');page.wait_for_timeout(120)
                chk(page.locator('[data-explorer-grid] article:visible').count()>=1,route,'activities_filter_failed')
            if route=='/community/':
                chk(page.locator('.r22-hero .actions > a').count()==2,route,'community_hero_action_count')
                chk(page.locator('.r22-compact-grid > article').count()<=4,route,'community_primary_cards_too_many')
            if route=='/my-franklin/':
                chk(page.locator('.hf36-saved-hub').count()==1,route,'saved_hub_missing')
                chk(page.locator('[data-hf36-saved-empty]:visible').count()==1,route,'aggregate_empty_missing')
                chk(page.locator('.hf36-saved-block .empty-state:visible').count()==0,route,'individual_empty_states_visible')
                chk(page.locator('#follow-ups').count()==1,route,'reminders_missing')
            if route=='/business-dashboard/':
                chk(page.locator('.hf36-membership-card').count()==1,route,'membership_card_missing')
                chk(page.locator('.hf35-member-focus').count()==0,route,'duplicate_focus_panel')
                chk(page.get_by_text(re.compile('Join Community Membership')).count()>=1,route,'join_cta_missing')
            if route=='/community-help-center/':
                chk(page.locator('.urgent-section:visible').count()==1,route,'urgent_hidden')
                chk(page.locator('.hf36-help-plan-output:visible').count()==0,route,'empty_plan_visible')
                chk(page.locator('details.hf35-help-tools').count()==1,route,'combined_help_details_missing')
                chk(page.locator('main img[src*="pinkerton"]').count()==0,route,'pinkerton_help_image')
            if route=='/directory/':
                page.wait_for_timeout(1300)
                chk(page.locator('[data-dir-results] .r22-profile-result').count()>0,route,'directory_results_missing')
                chk(page.locator('[data-dir-results] .r22-profile-result').count()<=16,route,'directory_too_many_results')
                chk(page.get_by_text('More',exact=True).count()==0,route,'directory_more_clutter')
                page.locator('[data-dir-search]').fill('1799 Kitchen & Bar Room');page.wait_for_timeout(250)
                chk(page.locator('[data-dir-results] .r22-profile-result').count()==1,route,'directory_exact_duplicate_not_suppressed')
            if route.startswith('/corrections/'):
                chk(page.locator('[name="profileId"]').input_value()=='FR-ORG-5d72d3ee4e9961c5',route,'correction_profile_prefill')
                chk(page.locator('[name="currentInfo"]').count()==1 and page.locator('[name="correctInfo"]').count()==1,route,'correction_fields_missing')
            if route.startswith('/profiles/'):
                chk(page.locator('.profile-primary-actions a').count()>=3,route,'profile_contact_actions_missing')
                chk(page.locator('.hf35-competitor-card').count()>=1,route,'free_profile_similar_missing')
        except Exception as e:fail.append([route,'navigation:'+str(e)[:180]])
        finally:page.close()
    ctx.close()
    # Active-member mock: preserve richer profile and remove competitor modules only when entitled.
    member=browser.new_context(viewport={'width':1366,'height':768})
    payload={'activePaidMember':True,'publication':{'profileId':'FR-ORG-5d72d3ee4e9961c5','provenance':'MEMBER_SUBMITTED_REVIEWED','fields':{'summary':'A locally owned barbershop serving Franklin.','services':'Haircuts\nBeard trims','hours':'Mon–Fri 9–5','serviceArea':'Franklin','languages':'English','accessibility':'Call for current accessibility details','website':'https://example.com','bookingUrl':'https://example.com/book','galleryUrls':'https://example.com/a.jpg','socialLinks':'https://www.instagram.com/example'}}}
    member.route('https://franklin-navigator-membership.onrender.com/api/member/public-profile**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps(payload)))
    pg=member.new_page();pg.goto(BASE+'/profiles/FR-ORG-5d72d3ee4e9961c5/',wait_until='domcontentloaded',timeout=20000);pg.wait_for_timeout(600)
    chk(pg.locator('.hf35-competitor-card').count()==0,'/profiles/member-mock','member_competitor_not_removed')
    chk(pg.locator('.hf35-member-badge').count()==1,'/profiles/member-mock','member_badge_missing')
    chk(pg.locator('#member-about').count()==1 and pg.locator('#member-services').count()==1,'/profiles/member-mock','member_modules_missing')
    pg.close();member.close()
    # JS-disabled Sports must still show useful results.
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':1366,'height':768});pg=nojs.new_page();pg.goto(BASE+'/sports/',wait_until='domcontentloaded',timeout=20000)
    chk(pg.locator('.hf34-explorer-card').count()>=5,'/sports/nojs','sports_nojs_results_missing');pg.close();nojs.close()
    # Mobile overflow smoke on the reviewed public routes.
    mob=browser.new_context(viewport={'width':390,'height':844})
    for route in ['/','/get-it-done/','/activities/','/community/','/my-franklin/','/business-dashboard/','/community-help-center/','/directory/','/sports/','/profiles/FR-ORG-5d72d3ee4e9961c5/']:
        pg=mob.new_page();pg.goto(BASE+route,wait_until='domcontentloaded',timeout=20000);pg.wait_for_timeout(300)
        chk(not pg.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2'),route,'mobile_horizontal_overflow');pg.close()
    mob.close();browser.close()
print(json.dumps({'failures':fail,'count':len(fail)},indent=2,ensure_ascii=False))
if fail:sys.exit(1)
