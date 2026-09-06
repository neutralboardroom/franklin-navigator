import json,threading,functools,http.server,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];out=root/'evidence/public_safety_hf1';out.mkdir(parents=True,exist_ok=True)
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root/'dist')))
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
record=json.loads((root/'dist/data/franklin-profiles-01.json').read_text())['records'][0]
profile=record['i'];report=[]
routes=['/','/claim-profile/','/membership-start/','/membership-pricing/','/membership-enroll/','/membership-status/','/member-first-value/','/member-support/','/profile-request/','/profile-studio/','/member-growth-workspace/','/business-dashboard/','/member-profile-preview/','/my-franklin/','/membership-enrollment/']
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
  for lang in ['en','es']:
   context=browser.new_context(viewport={'width':390,'height':844},locale='es-ES' if lang=='es' else 'en-US')
   context.add_init_script(f"localStorage.setItem('franklinLanguage','{lang}')")
   def offline(route):
    if route.request.url.startswith('https://franklin-navigator-membership.onrender.com'):
     if '/ready' in route.request.url:route.fulfill(status=200,json={'ok':True,'liveCheckoutEnabled':False})
     else:route.fulfill(status=401,json={'error':{'code':'AUTH_REQUIRED'}})
    elif not route.request.url.startswith(base):route.abort()
    else:route.continue_()
   context.route('**/*',offline)
   for path in routes:
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    r=page.goto(base+path,wait_until='networkidle');page.wait_for_function('(l)=>document.documentElement.lang===l',arg=lang)
    assert r.status==200 and page.locator('main').is_visible(),path
    assert not errors,(path,lang,errors)
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+2'),path
    if path=='/claim-profile/':
     page.locator('[data-r37-claim-search]').fill(record['n']);page.locator('[data-r37-claim-go]').click();page.locator('.r37-search-result').first.wait_for();page.locator('.r37-search-result').first.click();link=page.locator('a[href^="/membership-enroll/?profile="]');assert link.count()>0;link.first.click();page.wait_for_url('**/membership-enroll/**');page.locator('[data-membership-live-root] form').first.wait_for();assert not errors
    if path=='/membership-enrollment/':
     link=page.locator('a[href="/membership-enroll/"]');assert link.count()>0;link.first.click();page.locator('[data-membership-live-root] form').first.wait_for()
    report.append({'test':'route_and_customer_destination','route':path,'language':lang,'result':'PASS'});page.close()
   context.close()
  for lang in ['en','es']:
   context=browser.new_context(viewport={'width':390,'height':844},locale='es-ES' if lang=='es' else 'en-US');context.add_init_script(f"localStorage.setItem('franklinLanguage','{lang}')")
   calls=[];active=[False];ready=[True]
   def mock(route):
    url=route.request.url
    if url.startswith('https://franklin-navigator-membership.onrender.com'):
     if '/ready' in url:route.fulfill(status=200,json={'ok':True,'liveCheckoutEnabled':ready[0]})
     elif '/api/accounts/me' in url:route.fulfill(status=200,json={'account':{'account_id':'SYNTHETIC','email':'synthetic@example.invalid'},'profileLinks':[{'profile_id':profile,'authority_state':'VERIFIED'}],'membership':{'status':'ACTIVE','lookup_key':'franklin_community_member_monthly_v5'} if active[0] else None})
     elif '/api/membership/start' in url:
      calls.append(route.request.post_data_json)
      if len(calls)==1:route.abort('failed')
      else:route.fulfill(status=409,json={'error':{'code':'PAYMENT_OUTCOME_UNKNOWN'}})
     else:route.fulfill(status=401,json={'error':{'code':'AUTH_REQUIRED'}})
    elif not url.startswith(base):route.abort()
    else:route.continue_()
   context.route('**/*',mock)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+'/membership-enroll/?profile='+profile,wait_until='networkidle');page.locator('.r37-plan button').first.wait_for();page.locator('.r37-plan button').first.click()
   message='No pudimos confirmar esta compra.' if lang=='es' else 'We could not confirm this purchase.'
   page.get_by_text(message,exact=False).first.wait_for();assert len(calls)==1;assert page.locator('.r37-plan').count()==0
   assert 'No payment was created' not in page.locator('main').inner_text();assert not errors
   report.append({'test':'unknown_network_outcome_no_false_reassurance','language':lang,'result':'PASS'})
   resume='Continuar con la misma compra' if lang=='es' else 'Resume the same checkout'
   page.get_by_role('button',name=resume,exact=True).click();page.get_by_role('button',name=resume,exact=True).wait_for();assert len(calls)==2 and calls[0]==calls[1]
   report.append({'test':'resume_retains_same_profile_and_plan','language':lang,'result':'PASS'})
   page.reload(wait_until='networkidle');page.get_by_text(message,exact=False).first.wait_for();assert len(calls)==2 and page.locator('.r37-plan').count()==0
   report.append({'test':'reload_preserves_unknown_purchase_hold','language':lang,'result':'PASS'})
   ready[0]=False;page.reload(wait_until='networkidle');page.get_by_text(message,exact=False).first.wait_for();assert page.get_by_role('button',name=resume,exact=True).count()==0
   report.append({'test':'closed_commerce_keeps_status_and_support_no_purchase','language':lang,'result':'PASS'})
   active[0]=True;check='Consultar el estado de la membresía' if lang=='es' else 'Check membership status';page.get_by_role('button',name=check,exact=True).click();page.wait_for_function("sessionStorage.getItem('franklinPendingPurchaseV1')===null")
   assert page.locator('.r37-plan').count()==0;assert len(calls)==2;assert not errors
   report.append({'test':'confirmed_active_member_clears_pending_without_payment','language':lang,'result':'PASS'})
   page.screenshot(path=str(out/f'member-safety-{lang}.png'),full_page=True);context.close()
  browser.close()
 result={'result':'PASS','assertionGroups':len(report),'groups':report,'provider':'MOCKED_NO_REAL_API_OR_ACCOUNT_MUTATIONS'}
except Exception as e:
 result={'result':'FAIL','completedGroups':report,'error':str(e)}
 raise
finally:
 server.shutdown();(out/'BROWSER_RESULTS.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
