#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import json,re,sys
BASE='http://127.0.0.1:8765';fail=[]
routes=['/','/sports/','/sports/bowling/','/learning/','/business-dashboard/','/member-profile-preview/','/membership-start/','/community-help-center/','/directory/','/my-franklin/','/corrections/?listing=Carson%27s%20Barbershop&url=https%3A%2F%2Ffranklinnavigator.com%2Fprofiles%2FFR-ORG-5d72d3ee4e9961c5%2F','/profiles/FR-ORG-5d72d3ee4e9961c5/','/es/deportes/','/es/centro-de-ayuda/']

def contrast_failures(page):
    return page.evaluate("""() => {
      const parse=s=>{const m=String(s||'').match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)(?:[, /]+([0-9.]+))?/i);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null};
      const lin=c=>{c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)};
      const lum=c=>.2126*lin(c[0])+.7152*lin(c[1])+.0722*lin(c[2]);
      const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
      const bgFor=el=>{let n=el;while(n&&n!==document.documentElement){const c=parse(getComputedStyle(n).backgroundColor);if(c&&c[3]>.04)return c;n=n.parentElement}return [255,255,255,1]};
      const out=[];const nodes=[...document.querySelectorAll('main h1,main h2,main h3,main p,main label,main li')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity||1)>.15});
      for(const el of nodes.slice(0,280)){const fg=parse(getComputedStyle(el).color),bg=bgFor(el);if(!fg)continue;const min=/^H[1-3]$/.test(el.tagName)?3:4;const cr=ratio(fg,bg);if(cr<min)out.push({tag:el.tagName,text:(el.textContent||'').trim().slice(0,60),contrast:+cr.toFixed(2)});if(out.length>=5)break}return out;
    }""")

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1366,'height':768})
    # Default free-profile API response for ordinary route passes.
    ctx.route('https://franklin-navigator-membership.onrender.com/api/member/public-profile**',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps({'activePaidMember':False,'publication':None})))
    for route in routes:
        page=ctx.new_page();errs=[];page.on('pageerror',lambda e,errs=errs:errs.append(str(e)))
        try:
            page.goto(BASE+route,wait_until='domcontentloaded',timeout=15000);page.wait_for_timeout(450)
            h1=page.locator('h1').first
            if h1.count()==0 or not h1.is_visible():fail.append([route,'h1_not_visible'])
            if page.locator('header nav.nav > a').count()>3:fail.append([route,'nav_too_many'])
            if page.locator('header nav.nav details.hf34-nav-more').count()!=1:fail.append([route,'nav_more_missing'])
            if errs:fail.append([route,'pageerror:'+errs[0][:140]])
            low=contrast_failures(page)
            if low:fail.append([route,'low_contrast:'+json.dumps(low[:2],ensure_ascii=False)])
            if route=='/sports/':
                if page.locator('.hf34-explorer-card').count()<5:fail.append([route,'sports_static_results_lt5'])
                page.locator('[data-explorer-search]').fill('bowling');page.wait_for_timeout(100)
                if page.locator('.hf34-explorer-card:visible').count()<1:fail.append([route,'sports_filter_failed'])
            if route=='/business-dashboard/':
                if page.locator('.hf35-profile-comparison').count()!=1:fail.append([route,'comparison_missing'])
                if page.get_by_text('Active Community Member profiles do not show the Similar local profiles section on their own profile page.').count()<1:fail.append([route,'competitor_free_message_missing'])
            if route=='/member-profile-preview/':
                if page.locator('.hf35-member-preview-comparison').count()!=1:fail.append([route,'preview_comparison_missing'])
            if route=='/community-help-center/':
                if page.locator('.help-hero .actions > a').count()>2:fail.append([route,'hero_too_many_actions'])
                urgent=page.locator('#urgent-help').first
                if urgent.count()==0 or not urgent.is_visible():fail.append([route,'urgent_missing'])
                if page.locator('details.hf35-help-tools').count()!=1:fail.append([route,'help_tools_disclosure_missing'])
            if route=='/directory/':
                if page.locator('details.hf35-directory-advanced').count()!=1:fail.append([route,'advanced_filters_missing'])
                page.wait_for_timeout(1100)
                if page.locator('[data-dir-results] .r22-profile-result').count()<1:fail.append([route,'directory_results_missing'])
            if route=='/my-franklin/':
                pref=page.locator('[data-my-franklin] details.r22-dashboard-card').first
                if pref.count() and pref.get_attribute('open') is not None:fail.append([route,'preferences_open_by_default'])
            if route.startswith('/corrections/'):
                if page.locator('[name="profileId"]').input_value()!='FR-ORG-5d72d3ee4e9961c5':fail.append([route,'profile_prefill_failed'])
                if page.locator('[name="currentInfo"]').count()!=1 or page.locator('[name="correctInfo"]').count()!=1:fail.append([route,'split_correction_fields_missing'])
                page.locator('[name="requestType"]').select_option('PUBLIC_REMOVAL');page.wait_for_timeout(80)
                if page.locator('[name="currentInfo"]').is_visible():fail.append([route,'correction_fields_visible_on_removal'])
                if not page.locator('[name="authorityBasis"]').is_visible():fail.append([route,'removal_fields_hidden'])
            if route.startswith('/profiles/'):
                if page.locator('.profile-primary-actions a').count()<3:fail.append([route,'profile_contact_actions_missing'])
                if page.locator('.r22-profile-side .hf35-competitor-card').count()<1:fail.append([route,'free_profile_similar_section_missing'])
                if page.locator('#manage details.hf35-admin-more').count()!=1:fail.append([route,'profile_admin_disclosure_missing'])
        except Exception as e:fail.append([route,'navigation:'+str(e)[:160]])
        finally:page.close()
    ctx.close()
    # Mock an active member profile and prove competitor suppression + rich integration.
    member=browser.new_context(viewport={'width':1366,'height':768})
    member.route('https://franklin-navigator-membership.onrender.com/api/member/public-profile**',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps({'activePaidMember':True,'publication':{'profileId':'FR-ORG-5d72d3ee4e9961c5','provenance':'MEMBER_SUBMITTED_REVIEWED','fields':{'summary':'A locally owned barbershop serving Franklin.','services':'Haircuts\nBeard trims','hours':'Mon–Fri 9–5','serviceArea':'Franklin','languages':'English','accessibility':'Call for current accessibility details','website':'https://example.com','bookingUrl':'https://example.com/book','galleryUrls':'https://example.com/a.jpg\nhttps://example.com/b.jpg','socialLinks':'https://www.instagram.com/example'}}}})))
    page=member.new_page();page.goto(BASE+'/profiles/FR-ORG-5d72d3ee4e9961c5/',wait_until='domcontentloaded',timeout=15000);page.wait_for_timeout(500)
    if page.locator('.hf35-competitor-card').count()!=0:fail.append(['/profiles/member-mock','competitor_cards_not_removed'])
    if page.locator('.hf35-member-badge').count()!=1:fail.append(['/profiles/member-mock','member_badge_missing'])
    if page.locator('#member-about').count()!=1 or page.locator('#member-services').count()!=1:fail.append(['/profiles/member-mock','member_modules_missing'])
    if page.locator('.hf35-profile-section-nav').count()!=1:fail.append(['/profiles/member-mock','member_section_nav_missing'])
    if page.get_by_role('link',name='Book').count()!=1:fail.append(['/profiles/member-mock','booking_action_missing'])
    page.close();member.close()
    # Sports must remain useful even with JavaScript disabled.
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':1366,'height':768});page=nojs.new_page();page.goto(BASE+'/sports/',wait_until='domcontentloaded',timeout=15000)
    if page.locator('.hf34-explorer-card').count()<5:fail.append(['/sports/','nojs_results_missing'])
    page.close();nojs.close()
    # Mobile horizontal overflow smoke.
    mob=browser.new_context(viewport={'width':390,'height':844})
    for route in ('/','/sports/','/directory/','/business-dashboard/','/community-help-center/','/corrections/','/profiles/FR-ORG-5d72d3ee4e9961c5/'):
        page=mob.new_page();page.goto(BASE+route,wait_until='domcontentloaded',timeout=15000);page.wait_for_timeout(200)
        if page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2'):fail.append([route,'mobile_horizontal_overflow'])
        page.close()
    mob.close();browser.close()
print(json.dumps({'failures':fail,'count':len(fail)},indent=2,ensure_ascii=False))
if fail:sys.exit(1)
