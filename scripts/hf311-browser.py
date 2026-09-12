from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE='http://127.0.0.1:8765'
RELEASE='FR-NAV1.30.0-HF3.11'
failures=[]; reviewed=[]
retired=['$5/month','$50/year','$120','Franklin Charter Membership','once for three years']

def assert_true(cond,msg):
    if not cond: failures.append(msg)

with sync_playwright() as p:
    browser=p.chromium.launch()
    page=browser.new_page(viewport={'width':1366,'height':768})
    page.goto(BASE+'/',wait_until='networkidle')
    reviewed.append('/')
    cta=page.get_by_role('link',name='Preview my member profile')
    assert_true(cta.count()==1,'homepage Preview my member profile CTA missing or duplicated')
    if cta.count()==1:
        cta.click(); page.wait_for_load_state('networkidle')
        assert_true(page.url.rstrip('/').endswith('/member-profile-preview'),'homepage preview CTA did not open member-profile-preview')
        reviewed.append('/member-profile-preview/')
        body=page.locator('body').inner_text()
        assert_true('$35/year' in body,'preview page missing $35/year')
        for term in retired: assert_true(term.lower() not in body.lower(),f'preview page shows retired term {term}')
    for route in ['/membership-start/','/business-dashboard/','/membership-pricing/','/member-support/']:
        page.goto(BASE+route,wait_until='networkidle'); reviewed.append(route)
        body=page.locator('body').inner_text()
        assert_true('$35' in body,f'{route} missing $35 current membership')
        for term in retired: assert_true(term.lower() not in body.lower(),f'{route} shows retired term {term}')
    # Fetch public catalogs through the same server and verify one new-sale choice.
    for url in ['/data/membership-checkout-catalog.json','/data/membership-pricing.json','/data/community-membership-v4.json','/data/r29-v6-public-offer.json']:
        resp=page.request.get(BASE+url)
        assert_true(resp.ok,f'{url} not fetchable')
        if resp.ok:
            d=resp.json(); choices=d.get('choices') or d.get('paidChoices') or d.get('publicChoices') or []
            assert_true(len(choices)==1,f'{url} does not expose exactly one public plan')
            if choices:
                amount=choices[0].get('amountUsd',choices[0].get('priceUsd'))
                assert_true(amount==35,f'{url} public plan is not $35')
    # Mobile pass on the two entry routes.
    mobile=browser.new_page(viewport={'width':390,'height':844})
    for route in ['/','/member-profile-preview/','/membership-start/']:
        mobile.goto(BASE+route,wait_until='networkidle')
        text=mobile.locator('body').inner_text()
        if route!='/': assert_true('$35' in text,f'mobile {route} missing $35 current membership')
        for term in retired: assert_true(term.lower() not in text.lower(),f'mobile {route} shows retired term {term}')
    browser.close()

report={'release':RELEASE,'status':'PASS' if not failures else 'FAIL','routesReviewed':reviewed,'failureCount':len(failures),'failures':failures,'homepagePreviewRegression':'PASS' if not failures else 'FAIL','desktopWidth':1366,'mobileWidth':390}
(ROOT/'HF311_BROWSER_QUALIFICATION_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if failures: raise SystemExit(1)
