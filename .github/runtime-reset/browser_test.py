from playwright.sync_api import sync_playwright
from pathlib import Path
import json,sys
fixture=json.loads(Path(sys.argv[1]).read_text())
origin=fixture['origin']; email=fixture['email']; code=fixture['emailCode']; new='Synthetic_reset_password_987654321!'
rows=[]
def ok(name,value):
    rows.append({'id':name,'pass':bool(value)})
    assert value,name
with sync_playwright() as p:
    browser=p.chromium.launch()
    context=browser.new_context(viewport={'width':390,'height':900})
    page=context.new_page()
    page.goto(origin+'/review/',wait_until='networkidle')
    link=page.get_by_role('link',name='Forgot your password?')
    ok('forgot_password_link_visible',link.is_visible())
    link.click(); page.wait_for_url('**/review/reset/')
    ok('reset_page_noindex',page.locator('meta[name=robots]').get_attribute('content')=='noindex,nofollow,noarchive')
    page.locator('#email').fill(email)
    page.locator('#email-code').fill(code)
    page.locator('#new-password').fill(new)
    page.locator('#confirm-password').fill(new)
    page.get_by_role('button',name='Reset password').click()
    page.locator('#status').filter(has_text='Password reset.').wait_for()
    ok('reset_success','Password reset.' in page.locator('#status').inner_text())
    page.get_by_role('link',name='Back to reviewer sign in').click(); page.wait_for_url('**/review/')
    page.locator('#email').fill(email); page.locator('#password').fill(new)
    page.get_by_role('button',name='Sign in to reviews').click()
    page.locator('#workspace').wait_for(state='visible')
    ok('new_password_signin_without_code',page.locator('#workspace').is_visible())
    page.goto(origin+'/review/reset/',wait_until='networkidle')
    page.locator('#email').fill(email); page.locator('#email-code').fill(code)
    page.locator('#new-password').fill('Another_synthetic_password_12345!')
    page.locator('#confirm-password').fill('Another_synthetic_password_12345!')
    page.get_by_role('button',name='Reset password').click(); page.wait_for_timeout(200)
    ok('one_time_code_reuse_rejected','already been used' in page.locator('#status').inner_text())
    context.close(); browser.close()
out={'result':'PASS','pass':sum(x['pass'] for x in rows),'fail':sum(not x['pass'] for x in rows),'results':rows,'realOwnerCredentialsUsed':False,'realPayments':0,'productionMutations':0}
Path(sys.argv[2]).write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out))
