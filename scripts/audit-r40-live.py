#!/usr/bin/env python3
"""Read-only Franklin R40 production audit. No login, payment or data writes."""
import concurrent.futures, hashlib, json, os, re, sys, time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlsplit, urlunsplit, urlencode

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'audit-output'; OUT.mkdir(exist_ok=True)
DOMAIN='https://franklinnavigator.com'
API='https://franklin-navigator-membership.onrender.com'
RELEASE='FR-NAV1.15.0-CANDIDATE-R40'
RUN=os.environ.get('GITHUB_RUN_ID',str(int(time.time())))
CRITICAL=['/','/membership-start/','/membership-pricing/','/membership-enroll/','/membership-enrollment/','/membership-status/','/claim-profile/','/member-first-value/','/member-support/','/profile-request/','/profile-studio/','/member-growth-workspace/','/business-dashboard/','/member-profile-preview/','/my-franklin/']
FORBIDDEN=['source/currentness information','After authority verification','account-bound billing controls','Activation boundary','has been reconciled','account-bound billing tools','Membership service is available']
LIMITATIONS=['nothing is uploaded','nothing is published','execution: off','execution off','planning preview','checkout remains closed','checkout is closed','preview does not activate','when operational']

def stamp():return datetime.now(timezone.utc).isoformat()
def sha(data):return hashlib.sha256(data).hexdigest()
def fetch(url,method='GET',origin=None):
    headers={'User-Agent':'FranklinNavigatorReleaseAudit/1.0','Cache-Control':'no-cache','Pragma':'no-cache'}
    if origin: headers['Origin']=origin
    if method=='OPTIONS':headers['Access-Control-Request-Method']='POST';headers['Access-Control-Request-Headers']='content-type'
    parsed=urlsplit(url); query=parsed.query+('&' if parsed.query else '')+urlencode({'release_audit':RUN})
    url=urlunsplit((parsed.scheme,parsed.netloc,parsed.path,query,''))
    for attempt in range(2):
        try:
            with urlopen(Request(url,headers=headers,method=method),timeout=25) as r:return r.status,r.read(),dict(r.headers),r.url
        except HTTPError as e:return e.code,e.read(),dict(e.headers),e.url
        except Exception as e:
            if attempt: return 0,b'',{},type(e).__name__
            time.sleep(.5)

class MainText(HTMLParser):
    def __init__(self):super().__init__();self.main=0;self.skip=0;self.parts=[];self.h1=0;self.controls=0
    def handle_starttag(self,tag,attrs):
        if tag=='main':self.main+=1
        if tag in ('script','style'):self.skip+=1
        if self.main and tag=='h1':self.h1+=1
        if self.main and tag in ('input','select','textarea','button'):self.controls+=1
    def handle_endtag(self,tag):
        if tag=='main':self.main=max(0,self.main-1)
        if tag in ('script','style'):self.skip=max(0,self.skip-1)
    def handle_data(self,text):
        if self.main and not self.skip:self.parts.append(text)

def route_for(p):
    s='/'+p.relative_to(ROOT/'dist').as_posix()
    return s[:-10] if s.endswith('index.html') else s

def check_file(p):
    route=route_for(p);status,data,headers,final=fetch(DOMAIN+route)
    expected=p.read_bytes();ok=status==200 and sha(data)==sha(expected)
    if route=='/404.html':ok=status in (200,404) and sha(data)==sha(expected)
    row={'route':route,'status':status,'exactBytes':sha(data)==sha(expected),'expectedSha256':sha(expected),'observedSha256':sha(data),'ok':ok}
    if p.suffix=='.html':
        parser=MainText();parser.feed(data.decode('utf-8','replace'));text=' '.join(' '.join(parser.parts).split())
        row.update(mainWords=len(text.split()),headings=parser.h1,controls=parser.controls)
        if not text:row['contentReview']='NO_MAIN_TEXT'
        flags=[s for s in LIMITATIONS if s in text.lower()]
        if flags:row['limitedFunctionalityText']=flags
        bad=[s for s in FORBIDDEN if s.lower() in text.lower()]
        if bad:row['publicLanguageFindings']=bad
    return row

report={'auditType':'LOCAL_PRODUCT_READ_ONLY_LIVE_OBSERVATION','startedAtUtc':stamp(),'release':RELEASE,'sourceArchiveSha256':'8cbadeeb187386e2825098fe28c395035e5ef00fe1e9be6a2181657be14cfefc','expectedPublicTreeSha256':'f18dfb9b29c5d9b912870dab212a6b438c7b79a4202bd11b7317b4e511775f4b','sourceCommit':'9d90aadcae37c132b5ea6204cbda81273609089f','actionsRunId':RUN,'externalMutations':0,'authenticatedLifecycle':'NOT_TESTED_NO_CREDENTIALS_USED','sreAcceptance':'NOT_CLAIMED','sccAcceptance':'NOT_CLAIMED','authorityTransfer':False}
# Refuse to audit an older deployment as R40. Bound retries accommodate CDN propagation only.
build_path=ROOT/'dist/FRANKLIN_BUILD_MANIFEST.json'
for attempt in range(12):
    status,data,_,_=fetch(DOMAIN+'/FRANKLIN_BUILD_MANIFEST.json')
    if status==200 and sha(data)==sha(build_path.read_bytes()):break
    time.sleep(10)
else:
    report.update(result='HOLD_DEPLOYMENT_NOT_EXACT_R40',manifestStatus=status,finishedAtUtc=stamp())
    (OUT/'R40_LIVE_AUDIT.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));sys.exit(1)

htmls=sorted((ROOT/'dist').rglob('*.html'),key=lambda p:p.as_posix())
public=[p for p in htmls if not p.relative_to(ROOT/'dist').as_posix().startswith('profiles/')]
profiles=[p for p in htmls if p.relative_to(ROOT/'dist').as_posix().startswith('profiles/')]
sample=[profiles[i] for i in sorted(set([0,len(profiles)-1]+[i*len(profiles)//24 for i in range(24)]))]
assets=sorted([p for p in (ROOT/'dist/assets').rglob('*') if p.is_file() and p.suffix in ('.js','.css')])
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:rows=list(executor.map(check_file,public+sample+assets+[build_path]))
report['routes']=rows
report['httpSummary']={'checkedFiles':len(rows),'publicHtmlPages':len(public),'sampledProfilePages':len(sample),'scriptAndStyleAssets':len(assets),'failed':[r for r in rows if not r['ok']],'limitedFunctionalityRoutes':[{'route':r['route'],'phrases':r['limitedFunctionalityText']} for r in rows if r.get('limitedFunctionalityText')],'publicLanguageFindings':[r for r in rows if r.get('publicLanguageFindings')]}
report['runtime']={}
for path in ['/health','/ready','/api/catalog','/api/accounts/me','/api/membership/status']:
    status,data,headers,_=fetch(API+path,origin=DOMAIN)
    try:payload=json.loads(data)
    except:payload={}
    if path in ['/health','/ready']:
        payload={k:payload.get(k) for k in ['ok','release','community','database','startupReady','commerceEnabled','liveCheckoutEnabled','stripeCheckoutSessionConfigured','stripeWebhookConfigured','portalSessionConfigured'] if k in payload}
    elif path=='/api/catalog':payload={'catalogSha256':sha(data),'bytes':len(data)}
    else:payload={'errorCode':payload.get('error',{}).get('code')}
    report['runtime'][path]={'status':status,'payload':payload,'allowOrigin':headers.get('Access-Control-Allow-Origin',headers.get('access-control-allow-origin'))}
report['cors']=[]
for origin,expected in [(DOMAIN,204),('https://www.franklinnavigator.com',204),('https://unrelated.example',403)]:
    status,_,headers,_=fetch(API+'/api/accounts/login',method='OPTIONS',origin=origin)
    report['cors'].append({'origin':origin,'status':status,'expectedStatus':expected,'ok':status==expected})

try:
    from playwright.sync_api import sync_playwright
    browser_rows=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        for lang in ['en','es']:
            context=browser.new_context(viewport={'width':390,'height':844},locale='es-ES' if lang=='es' else 'en-US',color_scheme='light')
            context.add_init_script("localStorage.setItem('franklinLanguage',"+json.dumps(lang)+");")
            blocked=[]
            def read_only(route):
                if route.request.method not in ['GET','HEAD','OPTIONS']:
                    blocked.append({'method':route.request.method,'path':urlsplit(route.request.url).path});route.abort()
                else:route.continue_()
            context.route('**/*',read_only)
            for route in CRITICAL:
                page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)[:300]))
                row={'route':route,'language':lang}
                try:
                    response=page.goto(DOMAIN+route+'?release_audit='+RUN,wait_until='domcontentloaded',timeout=30000)
                    page.wait_for_function('(lang)=>document.documentElement.lang===lang',arg=lang,timeout=15000)
                    page.wait_for_timeout(900)
                    if route in ['/membership-status/','/membership-enroll/','/membership-enrollment/']:
                        page.locator('[data-membership-live-root] form').first.wait_for(timeout=20000)
                    row.update(status=response.status if response else 0,title=page.title(),h1=page.locator('h1').first.inner_text(),htmlLanguage=page.locator('html').get_attribute('lang'),overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth + 2'),mainVisible=page.locator('main').is_visible(),scriptErrors=errors)
                    text=page.locator('main').inner_text()
                    row['publicLanguageFindings']=[s for s in FORBIDDEN if s.lower() in text.lower()]
                    if route in ['/','/membership-status/','/profile-studio/']:
                        page.screenshot(path=str(OUT/('r40-'+(route.strip('/').replace('/','-') or 'home')+'-'+lang+'.png')),full_page=True)
                    row['ok']=row['status']==200 and row['mainVisible'] and not row['overflow'] and not errors and not row['publicLanguageFindings']
                except Exception as exc:row.update(ok=False,error=str(exc)[:600])
                browser_rows.append(row);page.close()
            report.setdefault('blockedBrowserMutations',[]).extend(blocked);context.close()
        browser.close()
    report['browser']=browser_rows
except Exception as exc:report['browserError']=str(exc)[:1000]

report['finishedAtUtc']=stamp()
report['publicSurfacePass']=not report['httpSummary']['failed'] and not report['httpSummary']['publicLanguageFindings'] and bool(report.get('browser')) and all(r['ok'] for r in report.get('browser',[]))
report['runtimeInfrastructurePass']=report['runtime']['/ready']['status']==200 and all(r['ok'] for r in report['cors']) and report['runtime']['/api/accounts/me']['status']==401 and report['runtime']['/api/membership/status']['status']==401
report['result']='PASS_PUBLIC_SURFACE_WITH_EXPLICIT_FUNCTIONALITY_LIMITATIONS' if report['publicSurfacePass'] else 'HOLD_LIVE_FINDINGS'
report['paidLaunchAccepted']=False
(OUT/'R40_LIVE_AUDIT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
summary={k:v for k,v in report.items() if k not in ['routes','browser']}
print(json.dumps(summary,ensure_ascii=False,indent=2))
print('BROWSER_FAILURES',json.dumps([r for r in report.get('browser',[]) if not r['ok']],ensure_ascii=False))
# Paid lifecycle and feature fulfillment require separate evidence, even if this audit passes.
sys.exit(0 if report['publicSurfacePass'] and report['runtimeInfrastructurePass'] else 1)
