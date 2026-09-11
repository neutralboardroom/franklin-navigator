#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import re,sys,json
BASE='http://127.0.0.1:8765'
fail=[]
routes=['/','/sports/','/sports/bowling/','/community/','/my-franklin/','/business-dashboard/','/community-help-center/','/directory/','/profiles/FR-ORG-5d72d3ee4e9961c5/']
def rgb_luma(value):
    m=re.search(r'rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)',value or '')
    if not m:return 0
    r,g,b=map(int,m.groups());return .2126*r+.7152*g+.0722*b
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1366,'height':768})
    for route in routes:
        page=ctx.new_page();errs=[];page.on('pageerror',lambda e,errs=errs:errs.append(str(e)))
        try:
            page.goto(BASE+route,wait_until='domcontentloaded',timeout=10000)
            page.wait_for_timeout(350)
            h1=page.locator('h1').first
            if h1.count()==0 or not h1.is_visible():fail.append([route,'h1_not_visible'])
            nav=page.locator('header nav.nav > a')
            if nav.count()>3:fail.append([route,'nav_too_many_browser'])
            if page.locator('header nav.nav details.hf34-nav-more').count()!=1:fail.append([route,'more_nav_missing_browser'])
            if errs:fail.append([route,'pageerror:'+errs[0][:160]])
            if route in ('/business-dashboard/','/directory/'):
                color=h1.evaluate("el=>getComputedStyle(el).color") if h1.count() else ''
                if rgb_luma(color)>210:fail.append([route,'light_on_light_heading'])
            if route=='/business-dashboard/':
                if page.locator('.r29-hero .actions a').count()>2:fail.append([route,'too_many_hero_actions'])
            if route=='/sports/':
                if page.locator('.hf34-explorer-card').count()<5:fail.append([route,'insufficient_static_sports_results'])
                page.locator('[data-explorer-search]').fill('bowling')
                page.wait_for_timeout(100)
                if page.locator('.hf34-explorer-card:visible').count()<1:fail.append([route,'sports_filter_failed'])
            if route=='/sports/bowling/' and page.locator('.hf34-explorer-card').count()<1:fail.append([route,'bowling_no_result'])
            if route=='/community-help-center/':
                urgent=page.locator('.urgent-section').first
                if urgent.count()==0 or not urgent.is_visible():fail.append([route,'urgent_not_visible'])
                elif urgent.bounding_box() and urgent.bounding_box()['y']>900:fail.append([route,'urgent_buried'])
            if route.startswith('/profiles/'):
                if page.locator('.profile-primary-actions a').count()<2:fail.append([route,'profile_actions_hidden'])
        except Exception as e:fail.append([route,'navigation:'+str(e)[:180]])
        finally:page.close()
    # Correction page: readable + profile id fallback from URL.
    page=ctx.new_page();target='https://franklinnavigator.com/profiles/FR-ORG-5d72d3ee4e9961c5/'
    page.goto(BASE+'/corrections/?listing=Carson%27s%20Barbershop&url='+target.replace(':','%3A').replace('/','%2F'),wait_until='domcontentloaded',timeout=10000);page.wait_for_timeout(150)
    h1=page.locator('h1').first;color=h1.evaluate("el=>getComputedStyle(el).color")
    if rgb_luma(color)>210:fail.append(['/corrections/','correction_heading_low_contrast'])
    if page.locator('[name="profileId"]').input_value()!='FR-ORG-5d72d3ee4e9961c5':fail.append(['/corrections/','profile_id_fallback_failed'])
    if page.locator('.hf34-internal-field').is_visible():fail.append(['/corrections/','internal_profile_id_visible'])
    page.close();ctx.close()
    # JavaScript-disabled Sports must still show useful local results.
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':1366,'height':768});page=nojs.new_page();page.goto(BASE+'/sports/',wait_until='domcontentloaded',timeout=10000)
    if page.locator('.hf34-explorer-card').count()<5:fail.append(['/sports/','nojs_results_missing']);page.close();nojs.close()
    # Mobile overflow smoke.
    mob=browser.new_context(viewport={'width':390,'height':844});page=mob.new_page();page.goto(BASE+'/sports/',wait_until='domcontentloaded',timeout=10000);page.wait_for_timeout(150)
    overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2')
    if overflow:fail.append(['/sports/','mobile_horizontal_overflow']);page.close();mob.close();browser.close()
print(json.dumps({'failures':fail,'count':len(fail)},indent=2))
if fail:sys.exit(1)
