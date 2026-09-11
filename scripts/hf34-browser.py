#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import re,sys,json
BASE='http://127.0.0.1:8765'
fail=[]
routes=['/','/sports/','/sports/bowling/','/activities/','/learning/','/community/','/my-franklin/','/business-dashboard/','/member-profile-preview/','/membership-start/','/community-help-center/','/directory/','/everyday-help/','/profiles/FR-ORG-5d72d3ee4e9961c5/','/es/deportes/','/es/centro-de-ayuda/']
def rgb_luma(value):
    m=re.search(r'rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)',value or '')
    if not m:return 0
    r,g,b=map(int,m.groups());return .2126*r+.7152*g+.0722*b

def contrast_failures(page):
    # Check visible representative copy against the nearest non-transparent background.
    return page.evaluate("""() => {
      const parse = s => { const m=String(s||'').match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)(?:[, /]+([0-9.]+))?/i); return m ? [Number(m[1]),Number(m[2]),Number(m[3]),m[4]===undefined?1:Number(m[4])] : null };
      const lin = c => { c/=255; return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4) };
      const lum = rgb => .2126*lin(rgb[0])+.7152*lin(rgb[1])+.0722*lin(rgb[2]);
      const ratio = (a,b) => { const x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05) };
      const bgFor = el => { let n=el; while(n && n!==document.documentElement){ const c=parse(getComputedStyle(n).backgroundColor); if(c && c[3]>.04)return c; n=n.parentElement } return [255,255,255,1] };
      const out=[];
      const nodes=[...document.querySelectorAll('main h1,main h2,main h3,main p,main label')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity||1)>.15});
      for(const el of nodes.slice(0,220)){ const fg=parse(getComputedStyle(el).color),bg=bgFor(el); if(!fg)continue; const min=/^H[1-3]$/.test(el.tagName)?3:4; const cr=ratio(fg,bg); if(cr<min)out.push({tag:el.tagName,text:(el.textContent||'').trim().slice(0,70),contrast:Number(cr.toFixed(2)),fg:getComputedStyle(el).color,bg:bg.slice(0,3).join(',')}); if(out.length>=8)break }
      return out;
    }""")

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1366,'height':768})
    for route in routes:
        page=ctx.new_page();errs=[];page.on('pageerror',lambda e,errs=errs:errs.append(str(e)))
        try:
            page.goto(BASE+route,wait_until='domcontentloaded',timeout=12000)
            page.wait_for_timeout(400)
            h1=page.locator('h1').first
            if h1.count()==0 or not h1.is_visible():fail.append([route,'h1_not_visible'])
            nav=page.locator('header nav.nav > a')
            if nav.count()>3:fail.append([route,'nav_too_many_browser'])
            if page.locator('header nav.nav details.hf34-nav-more').count()!=1:fail.append([route,'more_nav_missing_browser'])
            if errs:fail.append([route,'pageerror:'+errs[0][:160]])
            low=contrast_failures(page)
            if low:fail.append([route,'low_contrast:'+json.dumps(low[:2],ensure_ascii=False)])
            if route=='/business-dashboard/':
                if page.locator('.r29-hero .actions a').count()>2:fail.append([route,'too_many_hero_actions'])
                if page.get_by_text('Active member profiles do not show Similar local profiles on their own profile page.').count()<1:fail.append([route,'member_competitor_free_benefit_missing'])
            if route=='/member-profile-preview/':
                if page.get_by_text('No Similar local profiles section on your active member profile').count()<1:fail.append([route,'member_preview_difference_missing'])
            if route=='/membership-start/':
                if page.get_by_text('Active member profiles do not show Similar local profiles on their own profile page.').count()<1:fail.append([route,'membership_decision_benefit_missing'])
            if route=='/sports/':
                if page.locator('.hf34-explorer-card').count()<5:fail.append([route,'insufficient_static_sports_results'])
                page.locator('[data-explorer-search]').fill('bowling')
                page.wait_for_timeout(100)
                if page.locator('.hf34-explorer-card:visible').count()<1:fail.append([route,'sports_filter_failed'])
            if route=='/sports/bowling/' and page.locator('.hf34-explorer-card').count()<1:fail.append([route,'bowling_no_result'])
            if route in ('/community-help-center/','/es/centro-de-ayuda/'):
                urgent=page.locator('.urgent-section').first
                if urgent.count()==0 or not urgent.is_visible():fail.append([route,'urgent_not_visible'])
                elif urgent.bounding_box() and urgent.bounding_box()['y']>900:fail.append([route,'urgent_buried'])
            if route.startswith('/profiles/'):
                if page.locator('.profile-primary-actions a').count()<2:fail.append([route,'profile_actions_hidden'])
        except Exception as e:fail.append([route,'navigation:'+str(e)[:180]])
        finally:page.close()
    # Correction page: readable + profile id fallback from URL.
    page=ctx.new_page();target='https://franklinnavigator.com/profiles/FR-ORG-5d72d3ee4e9961c5/'
    encoded=target.replace(':','%3A').replace('/','%2F')
    page.goto(BASE+'/corrections/?listing=Carson%27s%20Barbershop&url='+encoded,wait_until='domcontentloaded',timeout=12000);page.wait_for_timeout(200)
    h1=page.locator('h1').first;color=h1.evaluate("el=>getComputedStyle(el).color")
    if rgb_luma(color)>210:fail.append(['/corrections/','correction_heading_low_contrast'])
    low=contrast_failures(page)
    if low:fail.append(['/corrections/','low_contrast:'+json.dumps(low[:2])])
    if page.locator('[name="profileId"]').input_value()!='FR-ORG-5d72d3ee4e9961c5':fail.append(['/corrections/','profile_id_fallback_failed'])
    if page.locator('.hf34-internal-field').is_visible():fail.append(['/corrections/','internal_profile_id_visible'])
    page.close();ctx.close()
    # JavaScript-disabled Sports must still show useful local results.
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':1366,'height':768});page=nojs.new_page();page.goto(BASE+'/sports/',wait_until='domcontentloaded',timeout=12000)
    if page.locator('.hf34-explorer-card').count()<5:fail.append(['/sports/','nojs_results_missing'])
    page.close();nojs.close()
    # Mobile overflow smoke across key surfaces.
    mob=browser.new_context(viewport={'width':390,'height':844})
    for route in ('/sports/','/directory/','/business-dashboard/','/profiles/FR-ORG-5d72d3ee4e9961c5/'):
        page=mob.new_page();page.goto(BASE+route,wait_until='domcontentloaded',timeout=12000);page.wait_for_timeout(180)
        overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2')
        if overflow:fail.append([route,'mobile_horizontal_overflow'])
        page.close()
    mob.close();browser.close()
print(json.dumps({'failures':fail,'count':len(fail)},indent=2,ensure_ascii=False))
if fail:sys.exit(1)
