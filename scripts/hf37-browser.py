#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import json,sys,re
BASE='http://127.0.0.1:8765';fail=[]
def chk(cond,route,msg):
    if not cond:fail.append([route,msg])
def contrast_failures(page):
    return page.evaluate("""() => {const parse=s=>{const m=String(s||'').match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)(?:[, /]+([0-9.]+))?/i);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null};const lin=c=>{c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)};const lum=c=>.2126*lin(c[0])+.7152*lin(c[1])+.0722*lin(c[2]);const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);const bgFor=el=>{let n=el;while(n&&n!==document.documentElement){const c=parse(getComputedStyle(n).backgroundColor);if(c&&c[3]>.04)return c;n=n.parentElement}return [255,255,255,1]};const out=[];for(const el of [...document.querySelectorAll('main h1,main h2,main h3,main p,main label,main li,main summary')].slice(0,500)){const r=el.getBoundingClientRect(),s=getComputedStyle(el);if(r.width<=0||r.height<=0||s.visibility==='hidden'||s.display==='none'||Number(s.opacity||1)<=.15)continue;const fg=parse(s.color),bg=bgFor(el);if(!fg)continue;const min=/^H[1-3]$/.test(el.tagName)?3:4;const cr=ratio(fg,bg);if(cr<min){out.push({tag:el.tagName,text:(el.textContent||'').trim().slice(0,60),contrast:+cr.toFixed(2)});if(out.length>=5)break}}return out}""")

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1366,'height':768})
    ctx.route('https://franklin-navigator-membership.onrender.com/api/member/public-profile**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({'activePaidMember':False,'publication':None})))
    routes=['/membership-start/','/member-profile-preview/','/claim-profile/','/directory/','/sports/','/corrections/?listing=Carson%27s%20Barbershop&url=https%3A%2F%2Ffranklinnavigator.com%2Fprofiles%2FFR-ORG-5d72d3ee4e9961c5%2F&profile=FR-ORG-5d72d3ee4e9961c5','/profiles/FR-ORG-5d72d3ee4e9961c5/']
    for route in routes:
        page=ctx.new_page();errs=[];page.on('pageerror',lambda e,errs=errs:errs.append(str(e)))
        try:
            page.goto(BASE+route,wait_until='domcontentloaded',timeout=20000);page.wait_for_timeout(900)
            chk(page.locator('h1').first.count()>0 and page.locator('h1').first.is_visible(),route,'h1_not_visible')
            # Shared header: brand visually left of nav, language visually right of nav.
            boxes=page.evaluate("""() => {const b=document.querySelector('header .brand')?.getBoundingClientRect(),n=document.querySelector('header nav.nav')?.getBoundingClientRect(),l=document.querySelector('header .r37-language-switch')?.getBoundingClientRect();return b&&n&&l?{b:b.x,n:n.x,l:l.x}:null}""")
            chk(bool(boxes) and boxes['b'] < boxes['n'] < boxes['l'],route,'header_order_wrong')
            if errs:fail.append([route,'pageerror:'+errs[0][:180]])
            low=contrast_failures(page)
            if low:fail.append([route,'low_contrast:'+json.dumps(low,ensure_ascii=False)])
            if route=='/membership-start/':
                chk(page.get_by_text('Enrollment status:',exact=False).count()==0,route,'operational_status_visible')
                chk(page.locator('main > section').count()<=4,route,'membership_too_long')
                chk(page.get_by_text('No Similar local profiles',exact=False).count()>=1,route,'competitor_free_value_missing')
                chk(page.get_by_text(re.compile(r'ordinary Directory ranking',re.I)).count()>=1,route,'ranking_neutrality_missing')
            if route=='/member-profile-preview/':
                for name in ['name','city','category','phone','email','website','about','services','hours','languages','online','photos']:
                    chk(page.locator(f'[name="{name}"]').count()==1,route,'field_missing:'+name)
                page.locator('[name="name"]').fill('Sample Franklin Co')
                page.locator('[name="city"]').fill('Franklin, TN')
                page.locator('[name="category"]').fill('Home services')
                page.locator('[name="phone"]').fill('(615) 555-0123')
                page.locator('[name="email"]').fill('hello@example.com')
                page.locator('[name="website"]').fill('https://example.com')
                page.locator('[name="about"]').fill('Local sample description entered only for this preview.')
                page.locator('[name="services"]').fill('Repairs, Maintenance')
                page.locator('[name="hours"]').fill('Mon-Fri 9-5')
                page.locator('[name="languages"]').fill('English, Spanish')
                page.locator('[name="online"]').fill('https://www.linkedin.com/company/example')
                page.locator('[name="photos"]').check();page.wait_for_timeout(100)
                chk(page.locator('.hf37-member-preview').get_by_text('Sample Franklin Co').count()==1,route,'preview_name_not_rendered')
                chk(page.locator('.hf37-preview-actions a').count()==3,route,'preview_contact_actions_wrong')
                chk(page.locator('.hf37-member-preview').get_by_text('Repairs').count()>=1,route,'preview_services_missing')
                chk(page.locator('.hf37-member-preview').get_by_text('Mon-Fri 9-5').count()==1,route,'preview_hours_missing')
                chk(page.locator('.hf37-member-preview').get_by_text('Photos / gallery').count()==1,route,'preview_gallery_module_missing')
                chk(page.locator('.hf37-member-preview').evaluate('(e)=>getComputedStyle(e).position')=='sticky',route,'preview_not_sticky_desktop')
            if route=='/claim-profile/':
                form=page.locator('form[action="/directory/"]');chk(form.count()==1,route,'search_first_form_missing')
                chk(page.get_by_text('Built for Franklin',exact=False).count()==0,route,'old_marketing_box_visible')
                chk(page.locator('.hf37-claim-actions > article').count()==4,route,'claim_actions_wrong')
                chk(page.locator('a[href="/profile-request/"]').count()>=1,route,'profile_request_route_missing')
            if route=='/directory/':
                page.wait_for_timeout(1300)
                cards=page.locator('[data-dir-results] .r22-profile-result');chk(cards.count()>0 and cards.count()<=16,route,'directory_result_count_wrong')
                chk(page.locator('[data-dir-count]').inner_text().strip() in ['Local profiles','Perfiles locales'],route,'directory_default_count_too_loud')
                first=cards.first.locator('h3').inner_text().strip() if cards.count() else ''
                chk(first!='1 Surface Llc',route,'directory_still_plain_alphabetical')
                page.locator('[data-dir-search]').fill('10000 MINUTES');page.wait_for_timeout(250)
                if page.locator('[data-dir-results] .r22-profile-result').count():
                    txt=page.locator('[data-dir-results] .r22-profile-result').first.inner_text()
                    chk('Public IRS filing address geocoded in Williamson County' not in txt,route,'producer_irs_copy_visible')
                    chk('Community / faith organization' in txt,route,'category_not_normalized')
                page.locator('[data-dir-search]').fill('1799 Kitchen & Bar Room');page.wait_for_timeout(250)
                chk(page.locator('[data-dir-results] .r22-profile-result').count()==1,route,'exact_duplicate_regressed')
            if route=='/sports/':
                chk(page.locator('.hf34-explorer-card').count()>=5,route,'sports_static_results_missing')
            if route.startswith('/corrections/'):
                chk(page.locator('[name="profileId"]').input_value()=='FR-ORG-5d72d3ee4e9961c5',route,'correction_profile_prefill')
                chk(page.locator('[name="currentInfo"]').count()==1 and page.locator('[name="correctInfo"]').count()==1,route,'correction_fields_missing')
            if route.startswith('/profiles/'):
                chk(page.locator('.profile-primary-actions a').count()>=3,route,'profile_contact_actions_missing')
                chk(page.locator('.hf35-competitor-card').count()>=1,route,'free_profile_similar_missing')
        except Exception as e:fail.append([route,'navigation:'+str(e)[:220]])
        finally:page.close()
    ctx.close()

    # Active member entitlement must still suppress competitors and preserve richer modules.
    member=browser.new_context(viewport={'width':1366,'height':768})
    payload={'activePaidMember':True,'publication':{'profileId':'FR-ORG-5d72d3ee4e9961c5','provenance':'MEMBER_SUBMITTED_REVIEWED','fields':{'summary':'A locally owned barbershop serving Franklin.','services':'Haircuts\nBeard trims','hours':'Mon–Fri 9–5','serviceArea':'Franklin','languages':'English','accessibility':'Call for current accessibility details','website':'https://example.com','bookingUrl':'https://example.com/book','galleryUrls':'https://example.com/a.jpg','socialLinks':'https://www.instagram.com/example'}}}
    member.route('https://franklin-navigator-membership.onrender.com/api/member/public-profile**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps(payload)))
    pg=member.new_page();pg.goto(BASE+'/profiles/FR-ORG-5d72d3ee4e9961c5/',wait_until='domcontentloaded',timeout=20000);pg.wait_for_timeout(700)
    chk(pg.locator('.hf35-competitor-card').count()==0,'/profiles/member-mock','member_competitor_not_removed')
    chk(pg.locator('.hf35-member-badge').count()==1,'/profiles/member-mock','member_badge_missing')
    chk(pg.locator('#member-about').count()==1 and pg.locator('#member-services').count()==1,'/profiles/member-mock','member_modules_missing');pg.close();member.close()

    # Sports remains useful without JS.
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':1366,'height':768});pg=nojs.new_page();pg.goto(BASE+'/sports/',wait_until='domcontentloaded',timeout=20000)
    chk(pg.locator('.hf34-explorer-card').count()>=5,'/sports/nojs','sports_nojs_results_missing');pg.close();nojs.close()

    # Mobile containment on changed pages and preserved core pages.
    mob=browser.new_context(viewport={'width':390,'height':844})
    for route in ['/membership-start/','/member-profile-preview/','/claim-profile/','/directory/','/sports/','/profiles/FR-ORG-5d72d3ee4e9961c5/']:
        pg=mob.new_page();pg.goto(BASE+route,wait_until='domcontentloaded',timeout=20000);pg.wait_for_timeout(450)
        chk(not pg.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2'),route,'mobile_horizontal_overflow');pg.close()
    mob.close();browser.close()

print(json.dumps({'failures':fail,'count':len(fail)},indent=2,ensure_ascii=False))
if fail:sys.exit(1)
