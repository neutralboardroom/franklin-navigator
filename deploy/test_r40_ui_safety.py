from pathlib import Path
import json,mimetypes,subprocess
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]/'dist'
BASE='https://franklinnavigator.com'
manifest=json.loads((ROOT/'data/franklin-profiles-manifest.json').read_text())
profile=json.loads((ROOT/manifest['chunks'][0]['file'].lstrip('/')).read_text())['records'][0]
oldapp=subprocess.check_output(['git','show','9d90aadcae37c132b5ea6204cbda81273609089f:dist/assets/app.js'])
# All document, asset, and API requests are fulfilled from local source or fixtures.
# No real account, claim, provider object, or payment is created.
def local_response(route):
    f=ROOT/unquote(urlparse(route.request.url).path).lstrip('/')
    if f.is_dir():f=f/'index.html'
    if not f.is_file():return route.fulfill(status=404,body='Not found')
    return route.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
out=[]
screens=Path('ui-safety-evidence');screens.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for language in ['en','es']:
        for baseline in [True,False]:
            ctx=browser.new_context();ctx.add_init_script(f"localStorage.setItem('franklinLanguage','{language}')")
            page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            def guard(route):
                url=route.request.url
                if url.startswith(BASE):
                    if baseline and url.endswith('/assets/app.js'):route.fulfill(status=200,body=oldapp,content_type='application/javascript')
                    else:local_response(route)
                else:route.abort()
            ctx.route('**/*',guard)
            page.goto(BASE+'/claim-profile/',wait_until='networkidle')
            page.locator('[data-r37-claim-search]').fill(profile['n'])
            page.locator('[data-r37-claim-go]').click()
            page.locator('.r37-search-result').first.wait_for()
            page.locator('.r37-search-result').first.click()
            page.locator('a[href*="membership-enroll/?profile="]').wait_for()
            if baseline:assert any('addEventListener' in x for x in errors),errors
            else:assert not errors,errors
            out.append({'test':'claim_search_'+language+('_baseline_reproduced' if baseline else '_corrected'),'pass':True,'pageErrors':errors})
            if not baseline:page.screenshot(path=str(screens/f'claim_{language}.png'),full_page=True)
            ctx.close()
        for scenario in ['network_failure','provider_502','server_500','unknown_409','unsafe_redirect','closed_checkout']:
            ctx=browser.new_context();ctx.add_init_script(f"localStorage.setItem('franklinLanguage','{language}')")
            page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));calls=[]
            me={'ok':True,'account':{'account_id':'acct_SYNTHETIC_BROWSER','email':'fixture@example.invalid'},'profileLinks':[{'profile_id':profile['i'],'authority_state':'VERIFIED'}],'membership':None}
            def routefn(route):
                req=route.request;u=req.url
                if u.startswith(BASE):return local_response(route)
                if not u.startswith('https://franklin-navigator-membership.onrender.com'):return route.abort()
                path=u.split('.onrender.com',1)[1]
                headers={'Access-Control-Allow-Origin':BASE,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}
                if req.method=='OPTIONS':return route.fulfill(status=204,headers=headers,body='')
                if path=='/ready':data={'ok':True,'liveCheckoutEnabled':True,'commerceEnabled':True}
                elif path=='/api/accounts/me':data=me
                elif path=='/api/membership/start':
                    calls.append(req.post_data_json)
                    if scenario=='network_failure':return route.abort('failed')
                    code={'provider_502':(502,'HTTP_502'),'server_500':(500,'INTERNAL_ERROR'),'unknown_409':(409,'PAYMENT_OUTCOME_UNKNOWN'),'closed_checkout':(423,'COMMERCE_DISABLED')}.get(scenario)
                    if code:return route.fulfill(status=code[0],headers=headers,json={'error':{'code':code[1]}})
                    data={'checkoutUrl':'https://checkout.stripe.com.evil.invalid/pay'}
                else:raise AssertionError('Unexpected request '+path)
                route.fulfill(status=200,headers=headers,json=data)
            ctx.route('**/*',routefn)
            page.goto(BASE+'/membership-enroll/?profile='+profile['i'],wait_until='networkidle')
            pay=page.locator('.r37-plan button').first;pay.wait_for();pay.click();page.wait_for_timeout(300)
            assert len(calls)==1,calls
            assert not errors,errors
            text=page.locator('[data-membership-live-root]').inner_text()
            assert 'No payment was created' not in text
            assert page.locator('.r37-plan button').count()==0,text
            if scenario!='closed_checkout':
                assert ('No vuelva a pagar' if language=='es' else 'Do not pay again') in text,text
                page.reload(wait_until='networkidle')
                assert page.locator('.r37-plan button').count()==0
                status=page.get_by_role('button',name='Revisar el estado de la membresía' if language=='es' else 'Check membership status')
                status.click();page.wait_for_timeout(150)
                assert len(calls)==1
                assert page.locator('.r37-plan button').count()==0
                # No membership yet is NOT proof that no payment exists.
                # Only verified activation clears the held UI here.
                me['membership']={'status':'ACTIVE','lookup_key':'franklin_community_member_monthly_v5'}
                status.click();page.wait_for_timeout(250)
                assert page.locator('.r37-plan button').count()==0
            out.append({'test':scenario+'_'+language,'pass':True,'simulatedCheckoutRequests':len(calls),'realProviderCalls':0})
            if scenario=='provider_502':page.screenshot(path=str(screens/f'membership_{language}.png'),full_page=True)
            ctx.close()
    browser.close()
report={'result':'PASS','tests':out,'testCount':len(out),'environment':'ISOLATED_CHROMIUM_REAL_R40_PAGES_SYNTHETIC_API','realProviderCalls':0,'productionDeployment':False}
(screens/'UI_HF1_BROWSER_RESULTS.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
