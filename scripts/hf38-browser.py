#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
from pathlib import Path
from urllib.parse import urlparse
import json,sys,shutil

BASE='http://127.0.0.1:8765'
API='https://franklin-navigator-membership.onrender.com'
ROOT=Path(__file__).resolve().parents[1]
fail=[]
captured={'save':None}
screens=ROOT/'hf38-review-screenshots'
screens.mkdir(exist_ok=True)

def chk(cond,route,msg):
    if not cond: fail.append([route,msg])

def contrast_failures(page):
    return page.evaluate("""() => {
      const parse=s=>{const m=String(s||'').match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)(?:[, /]+([0-9.]+))?/i);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null};
      const lin=c=>{c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)};
      const lum=c=>.2126*lin(c[0])+.7152*lin(c[1])+.0722*lin(c[2]);
      const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
      const bgFor=el=>{let n=el;while(n&&n!==document.documentElement){const c=parse(getComputedStyle(n).backgroundColor);if(c&&c[3]>.04)return c;n=n.parentElement}return [255,255,255,1]};
      const out=[];
      for(const el of [...document.querySelectorAll('main h1,main h2,main h3,main p,main label,main li,main summary')].slice(0,650)){
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        if(r.width<=0||r.height<=0||s.visibility==='hidden'||s.display==='none'||Number(s.opacity||1)<=.15)continue;
        const fg=parse(s.color),bg=bgFor(el);if(!fg)continue;
        const min=/^H[1-3]$/.test(el.tagName)?3:4;
        const cr=ratio(fg,bg);if(cr<min){out.push({tag:el.tagName,text:(el.textContent||'').trim().slice(0,60),contrast:+cr.toFixed(2)});if(out.length>=5)break}
      }return out
    }""")

def cors_headers():
    return {'Access-Control-Allow-Origin':BASE,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json'}

def api_handler(route):
    req=route.request
    path=urlparse(req.url).path
    if req.method=='OPTIONS':
        route.fulfill(status=204,headers=cors_headers(),body='')
        return
    if path=='/api/accounts/me':
        payload={'account':{'displayName':'Sample member'}}
    elif path=='/api/member/profiles':
        payload={'reviewCoverageConfigured':True,'profiles':[{'profile_id':'FR-ORG-5d72d3ee4e9961c5','name':"Carson's Barbershop",'authority_state':'VERIFIED'}]}
    elif path=='/api/member/profile':
        payload={'draft':{'state':'DRAFT','revision':7,'fields':{'summary':'A locally owned sample description for browser qualification.','services':'Haircuts and beard trims'}},'publication':None}
    elif path=='/api/member/public-profile':
        payload={'activePaidMember':False,'publication':None}
    elif path=='/api/member/profile/save' and req.method=='POST':
        try: captured['save']=json.loads(req.post_data or '{}')
        except Exception: captured['save']={}
        payload={'revision':8,'state':'DRAFT'}
    else:
        payload={}
    route.fulfill(status=200,headers=cors_headers(),body=json.dumps(payload))

changed=['/business-dashboard/','/member-profile-preview/','/profile-studio/','/community-help-center/']
regression=['/','/today/','/get-it-done/','/sports/','/sports/bowling/','/activities/','/community/','/my-franklin/','/membership-start/','/claim-profile/','/directory/','/profiles/FR-ORG-5d72d3ee4e9961c5/','/corrections/?listing=Carson%27s%20Barbershop&profile=FR-ORG-5d72d3ee4e9961c5','/es/deportes/','/es/centro-de-ayuda/']
routes=changed+regression
review=[]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1366,'height':768})
    ctx.route(API+'/**',api_handler)
    for route in routes:
        page=ctx.new_page()
        errs=[]
        page.on('pageerror',lambda e,errs=errs:errs.append(str(e)))
        try:
            page.goto(BASE+route,wait_until='domcontentloaded',timeout=25000)
            page.wait_for_timeout(700)
            chk(page.locator('h1').first.count()>0 and page.locator('h1').first.is_visible(),route,'h1_not_visible')
            boxes=page.evaluate("""() => {
              const b=document.querySelector('header .brand')?.getBoundingClientRect(),
                    n=document.querySelector('header nav.nav')?.getBoundingClientRect(),
                    l=document.querySelector('header .r37-language-switch')?.getBoundingClientRect();
              return b&&n&&l?{b:b.x,n:n.x,l:l.x}:null
            }""")
            chk(bool(boxes) and boxes['b'] < boxes['n'] < boxes['l'],route,'header_visual_order_wrong')
            if route in changed:
                dom=page.evaluate("""() => [...document.querySelector('header .wrap.top')?.children||[]].map(x=>x.className||x.tagName)""")
                joined='|'.join(map(str,dom))
                chk(joined.find('brand') < joined.find('nav') < joined.find('language'),route,'header_dom_order_wrong')
                low=contrast_failures(page)
                if low: fail.append([route,'low_contrast:'+json.dumps(low,ensure_ascii=False)])
                for a in page.locator('a[target="_blank"]').all():
                    rel=(a.get_attribute('rel') or '').lower()
                    chk('noopener' in rel,route,'external_blank_missing_noopener')
                page.keyboard.press('Tab')
                tag=page.evaluate('document.activeElement && document.activeElement.tagName')
                chk(tag not in [None,'BODY','HTML'],route,'keyboard_first_tab_not_focusable')
                name=route.strip('/').replace('/','-') or 'home'
                page.screenshot(path=str(screens/f'{name}.png'),full_page=True)
            if errs: fail.append([route,'pageerror:'+errs[0][:180]])
            review.append({'route':route,'desktop':'PASS' if not errs else 'CHECKED_WITH_ERROR'})
        except Exception as e:
            fail.append([route,'navigation:'+str(e)[:220]])
        finally:
            page.close()

    pg=ctx.new_page()
    pg.goto(BASE+'/member-profile-preview/',wait_until='domcontentloaded',timeout=25000);pg.wait_for_timeout(500)
    chk(pg.locator('[data-r38-preview-progress]').count()==1,'/member-profile-preview/','preview_readiness_progress_missing')
    initial=int(pg.locator('[data-r38-preview-progress]').get_attribute('value') or '0')
    pg.locator('[name="name"]').fill('Sample Franklin Co')
    pg.locator('[name="city"]').fill('Franklin, TN')
    pg.locator('[name="category"]').fill('Home services')
    pg.locator('[name="website"]').fill('https://example.com')
    pg.locator('[name="about"]').fill('A public sample description long enough for the preview readiness check.')
    pg.locator('[name="services"]').fill('Repairs, maintenance')
    preview_hours=pg.locator('[name="hours"]');preview_hours.fill('Mon-Fri 9-5')
    pg.locator('[name="online"]').fill('https://www.linkedin.com/company/example')
    pg.wait_for_timeout(150)
    final=int(pg.locator('[data-r38-preview-progress]').get_attribute('value') or '0')
    chk(initial==0 and final==6,'/member-profile-preview/','preview_readiness_not_reactive')
    chk(pg.get_by_text('not a public rating',exact=False).count()>=1,'/member-profile-preview/','preview_rating_boundary_missing')
    pg.close()

    pg=ctx.new_page()
    pg.goto(BASE+'/profile-studio/',wait_until='domcontentloaded',timeout=25000);pg.wait_for_timeout(900)
    required=['summary','tagline','services','hours','serviceArea','accessibility','languages','pricing','experience','credentials','awards','associations','education','publications','offersEvents','website','contactUrl','bookingUrl','quoteUrl','menuUrl','orderUrl','directionsUrl','profileImageUrl','galleryUrls','socialLinks']
    for name in required:
        chk(pg.locator(f'[name="{name}"]').count()==1,'/profile-studio/','member_field_missing:'+name)
    chk(pg.locator('.r38-member-readiness progress').count()==1,'/profile-studio/','member_readiness_missing')
    before=int(pg.locator('.r38-member-readiness progress').get_attribute('value') or '0')
    pg.locator('[name="website"]').fill('https://example.com')
    pg.locator('[name="hours"]').fill('Mon-Fri 9-5')
    pg.locator('[name="languages"]').fill('English, Spanish')
    pg.locator('[name="socialLinks"]').fill('https://www.instagram.com/example')
    pg.wait_for_timeout(120)
    after=int(pg.locator('.r38-member-readiness progress').get_attribute('value') or '0')
    chk(after>before,'/profile-studio/','member_readiness_not_reactive')
    pg.get_by_role('button',name='Save private draft').click();pg.wait_for_timeout(180)
    chk(bool(captured['save']) and 'fields' in captured['save'],'/profile-studio/','member_save_payload_missing')
    if captured['save'] and 'fields' in captured['save']:
        for name in ['summary','hours','socialLinks','profileImageUrl','quoteUrl']:
            chk(name in captured['save']['fields'],'/profile-studio/','member_save_payload_field_missing:'+name)
    chk(pg.get_by_text('Your draft is saved on the server. It is not public.',exact=False).count()>=1,'/profile-studio/','member_save_confirmation_missing')
    pg.close()

    pg=ctx.new_page();pg.goto(BASE+'/directory/',wait_until='domcontentloaded',timeout=25000);pg.wait_for_timeout(1300)
    cards=pg.locator('[data-dir-results] .r22-profile-result')
    chk(cards.count()>0 and cards.count()<=16,'/directory/','directory_result_count_wrong')
    chk(pg.locator('[data-dir-count]').inner_text().strip() in ['Local profiles','Perfiles locales'],'/directory/','directory_count_copy_regressed')
    pg.close()
    pg=ctx.new_page();pg.goto(BASE+'/sports/',wait_until='domcontentloaded',timeout=25000);pg.wait_for_timeout(500)
    chk(pg.locator('.hf34-explorer-card').count()>=5,'/sports/','sports_static_results_missing');pg.close()
    pg=ctx.new_page();pg.goto(BASE+'/corrections/?listing=Carson%27s%20Barbershop&profile=FR-ORG-5d72d3ee4e9961c5',wait_until='domcontentloaded',timeout=25000);pg.wait_for_timeout(400)
    chk(pg.locator('[name="profileId"]').input_value()=='FR-ORG-5d72d3ee4e9961c5','/corrections/','correction_profile_prefill')
    chk(pg.locator('[name="currentInfo"]').count()==1 and pg.locator('[name="correctInfo"]').count()==1,'/corrections/','correction_fields_missing');pg.close()
    pg=ctx.new_page();pg.goto(BASE+'/profiles/FR-ORG-5d72d3ee4e9961c5/',wait_until='domcontentloaded',timeout=25000);pg.wait_for_timeout(700)
    chk(pg.locator('.profile-primary-actions a').count()>=3,'/profiles/sample','profile_contact_actions_missing')
    chk(pg.locator('.hf35-competitor-card').count()>=1,'/profiles/sample','free_profile_related_profiles_missing');pg.close()
    ctx.close()

    nojs=browser.new_context(java_script_enabled=False,viewport={'width':1366,'height':768})
    pg=nojs.new_page();pg.goto(BASE+'/sports/',wait_until='domcontentloaded',timeout=25000)
    chk(pg.locator('.hf34-explorer-card').count()>=5,'/sports/nojs','sports_nojs_results_missing');pg.close();nojs.close()

    mob=browser.new_context(viewport={'width':390,'height':844})
    mob.route(API+'/**',api_handler)
    mobile_routes=changed+['/directory/','/sports/','/profiles/FR-ORG-5d72d3ee4e9961c5/','/es/deportes/','/es/centro-de-ayuda/']
    for route in mobile_routes:
        pg=mob.new_page()
        try:
            pg.goto(BASE+route,wait_until='domcontentloaded',timeout=25000);pg.wait_for_timeout(500)
            chk(not pg.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2'),route,'mobile_horizontal_overflow')
            review.append({'route':route,'mobile':'PASS'})
        except Exception as e:
            fail.append([route,'mobile_navigation:'+str(e)[:180]])
        finally:
            pg.close()
    mob.close();browser.close()

receipt={
 'release':'FR-NAV1.27.0-HF3.8',
 'routesReviewed':len(routes),
 'desktopChangedPages':changed,
 'mobileRoutes':mobile_routes,
 'screenshots':[str(p.relative_to(ROOT)) for p in sorted(screens.glob('*.png'))],
 'memberStudioSavePayloadFields':sorted((captured.get('save') or {}).get('fields',{}).keys()),
 'failures':fail,
 'failureCount':len(fail),
 'status':'PASS' if not fail else 'FAIL'
}
(ROOT/'HF38_BROWSER_QUALIFICATION_REPORT.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt,indent=2))
shutil.rmtree(ROOT/'scripts/__pycache__',ignore_errors=True)
if fail: sys.exit(1)
