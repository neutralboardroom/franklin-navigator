import fs from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';

const PROFILE='FR-ORG-b00c0ace7943973c';
const BASE='http://127.0.0.1:4173';
const evidenceDir='.r1346-browser-evidence';
fs.mkdirSync(evidenceDir,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const which=name=>spawnSync('bash',['-lc','command -v '+name],{encoding:'utf8'}).stdout.trim();
const chromePath=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(which).find(Boolean);
if(!chromePath)throw new Error('R1346_BROWSER_REQUIRED_CHROME_NOT_FOUND');

const userDir='/tmp/franklin-r1346-chrome-'+process.pid;
fs.rmSync(userDir,{recursive:true,force:true});
const chrome=spawn(chromePath,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  '--user-data-dir='+userDir,'about:blank'
],{stdio:['ignore','ignore','pipe']});
let chromeErr='';chrome.stderr.on('data',d=>chromeErr+=String(d).slice(-4000));
process.on('exit',()=>{try{chrome.kill('SIGKILL')}catch{}});

async function json(url,opts){const r=await fetch(url,opts);if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return r.json()}
const activePortFile=userDir+'/DevToolsActivePort';
let cdpPort='';
for(let i=0;i<200;i++){
  if(fs.existsSync(activePortFile)){
    const line=fs.readFileSync(activePortFile,'utf8').split(/\r?\n/)[0]?.trim();
    if(/^\d+$/.test(line)){cdpPort=line;break}
  }
  if(chrome.exitCode!==null)break;
  await sleep(100);
}
if(!cdpPort)throw new Error('Chrome DevToolsActivePort unavailable: '+chromeErr);
let target;
for(let i=0;i<100;i++){try{const list=await json('http://127.0.0.1:'+cdpPort+'/json/list');target=list.find(x=>x.type==='page');if(target)break}catch{}await sleep(100)}
if(!target)throw new Error('Chrome CDP target unavailable on dynamic port '+cdpPort+': '+chromeErr);

const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
let seq=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(m.id&&pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);if(m.error)reject(new Error(m.error.message));else resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error('Evaluate failed: '+JSON.stringify(r.exceptionDetails));return r.result?.value};
async function waitFor(expression,label,timeout=10000){const started=Date.now();while(Date.now()-started<timeout){try{if(await evaluate(expression))return}catch{}await sleep(100)}let debug={};try{debug=await evaluate("({url:location.href,body:(document.body?.innerText||'').slice(0,4000),errors:window.__r1346Errors||[]})")}catch{}throw new Error('Timeout waiting for '+label+' '+JSON.stringify(debug))}
async function navigate(url){await send('Page.navigate',{url});await waitFor("document.readyState==='complete'","document ready",10000);await sleep(120)}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true});fs.writeFileSync(evidenceDir+'/'+name,Buffer.from(r.data,'base64'))}
const check=(name,ok,detail='')=>{results.checks.push({name,pass:Boolean(ok),detail});if(!ok)throw new Error(name+(detail?': '+detail:''))};
const results={release:'FR-NAV1.30.46-HF3.13.28',fixture:'CONTROLLED_BROWSER_FIXTURE_NO_PRODUCTION_ACCOUNT_MUTATION',checks:[],screenshots:[],result:'IN_PROGRESS'};

await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});
const mock=`(()=>{
  const API='https://franklin-navigator-membership.onrender.com';
  const PROFILE='${PROFILE}';
  const nativeFetch=window.fetch.bind(window);
  const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  window.__r1346ApiCalls=[];window.__r1346Errors=[];
  addEventListener('error',e=>window.__r1346Errors.push(String(e.message||e.error||'window error')));
  addEventListener('unhandledrejection',e=>window.__r1346Errors.push(String(e.reason?.message||e.reason||'unhandled rejection')));
  window.fetch=async(input,init={})=>{
    const u=new URL(typeof input==='string'?input:input.url,location.href);
    if(u.origin!==API)return nativeFetch(input,init);
    const path=u.pathname,method=String(init.method||'GET').toUpperCase();
    window.__r1346ApiCalls.push({path,method});
    if(path==='/ready')return response({ok:true,liveCheckoutEnabled:true});
    if(path==='/api/accounts/me'){
      if(sessionStorage.getItem('r1346-signed-in')!=='1')return response({ok:false,error:{code:'AUTH_REQUIRED',message:'Sign in required.'}},401);
      const linked=sessionStorage.getItem('r1346-linked')==='1',review=sessionStorage.getItem('r1346-pending')==='1';
      return response({ok:true,account:{accountId:'acct_r1346_controlled',email:'controlled-fixture@franklin.invalid'},profileLinks:linked?[{profile_id:PROFILE,authority_state:'PENDING',verified_at:null,review_state:review?'PENDING':null,review_revision:review?1:0,review_updated_at:review?'2026-09-20T03:30:00Z':null}]:[],membership:null});
    }
    if(path==='/api/accounts/login'){sessionStorage.setItem('r1346-signed-in','1');await delay(120);return response({ok:true})}
    if(path==='/api/accounts/password-reset/request'){await delay(250);return response({ok:true,message:'If an account exists for this email, password-reset instructions have been sent.'},202)}
    if(path==='/api/accounts/password-reset/complete'){await delay(250);sessionStorage.setItem('r1346-signed-in','1');return response({ok:true,message:'Password reset complete. You are signed in.'})}
    if(path==='/api/profile-links'&&method==='POST'){await delay(300);sessionStorage.setItem('r1346-linked','1');return response({ok:true})}
    if(path==='/api/member/representation/request'&&method==='POST'){await delay(250);sessionStorage.setItem('r1346-pending','1');return response({ok:true,state:'PENDING',revision:1})}
    if(path==='/api/member/representation/release'&&method==='POST'){sessionStorage.setItem('r1346-pending','0');return response({ok:true,state:'REVOKED',revision:2})}
    if(path==='/api/accounts/logout'){sessionStorage.clear();return response({ok:true})}
    if(path==='/api/membership/start')return response({ok:false,error:{code:'PROFILE_VERIFICATION_REQUIRED',message:'Verify first.'}},409);
    return response({ok:false,error:{code:'FIXTURE_UNHANDLED',message:path}},404);
  };
})();`;
await send('Page.addScriptToEvaluateOnNewDocument',{source:mock});

// Exact profile -> account-recovery path.
await navigate(BASE+'/profile-access/?profile='+encodeURIComponent(PROFILE));
await waitFor("document.querySelector('[data-membership-live-root]') && document.body.textContent.includes('Franklin Navigator')","exact selected profile");
check('exact profile remains selected on Profile Access',await evaluate("location.search.includes('"+PROFILE+"') && document.body.textContent.includes('Franklin Navigator')"));
check('claim hero clarifies public profile',await evaluate("document.querySelector('h1')?.textContent.includes('public profile on Franklin Navigator')"));
check('progress exposes current step semantics',await evaluate("document.querySelector('[data-r1346-profile-progress] [aria-current=step]')!==null"));

await waitFor("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Sign in')","sign in mode button");
await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Sign in').click()");
await waitFor("[...document.querySelectorAll('a')].some(a=>a.textContent.includes('Forgot password'))","forgot link");
const recoveryHref=await evaluate("[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Forgot password')).getAttribute('href')");
check('forgot-password link preserves exact profile',String(recoveryHref).includes(PROFILE),String(recoveryHref));

// Reset request: visible loading + generic acknowledgement.
await navigate(BASE+recoveryHref);
await waitFor("document.querySelector('.r1342-recovery-form input[type=email]')","reset email form");
await evaluate("(()=>{const i=document.querySelector('.r1342-recovery-form input[type=email]');i.value='controlled-fixture@franklin.invalid';i.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.r1342-recovery-form').requestSubmit()})()");
await sleep(40);
check('reset request immediately disables duplicate submit',await evaluate("document.querySelector('.r1342-recovery-form button[type=submit]')?.disabled===true"));
check('reset request shows local loading feedback',await evaluate("document.body.textContent.includes('Sending password-reset instructions…')"));
await waitFor("document.body.textContent.includes('Check your email')","reset request acknowledgement");
check('reset acknowledgement is generic',await evaluate("document.body.textContent.includes('If an account exists for this email, password-reset instructions have been sent.')"));
check('reset acknowledgement replaces old request form',await evaluate("document.querySelector('.r1342-recovery-form')===null"));

// Reset completion: 8-char password, old form replaced, exact profile preserved.
await navigate(BASE+'/account-recovery/?profile='+encodeURIComponent(PROFILE)+'&r1346=reset#token='+('A'.repeat(48))+'&profile='+encodeURIComponent(PROFILE));
await waitFor("document.querySelectorAll('.r1342-recovery-form input[type=password]').length===2","new password form");
check('frontend password minimum is 8',await evaluate("[...document.querySelectorAll('.r1342-recovery-form input[type=password]')].every(i=>i.minLength===8)"));
await evaluate("(()=>{const a=[...document.querySelectorAll('.r1342-recovery-form input[type=password]')];for(const i of a){i.value='12345678';i.dispatchEvent(new Event('input',{bubbles:true}))}document.querySelector('.r1342-recovery-form').requestSubmit()})()");
await sleep(40);
check('reset completion immediately disables duplicate submit',await evaluate("document.querySelector('.r1342-recovery-form button[type=submit]')?.disabled===true"));
check('reset completion shows local loading feedback',await evaluate("document.body.textContent.includes('Changing password…')"));
await waitFor("document.body.textContent.includes('Password changed successfully.')","reset complete success");
check('old reset form removed after success',await evaluate("document.querySelector('.r1342-recovery-form')===null"));
check('reset success confirms signed-in state',await evaluate("document.body.textContent.includes('You’re signed in.')"));
check('reset success preserves exact-profile return',await evaluate("document.querySelector('.r1346-recovery-success a')?.getAttribute('href').includes('"+PROFILE+"')"));
check('reset token removed from visible URL',await evaluate("!location.hash.includes('token=')"));

// Continue back to exact Profile Access signed in.
const continueHref=await evaluate("document.querySelector('.r1346-recovery-success a').getAttribute('href')");
await navigate(BASE+continueHref);
await waitFor("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Continue with this profile')","connect action");
check('same exact profile survives password recovery',await evaluate("location.search.includes('"+PROFILE+"') && document.body.textContent.includes('Franklin Navigator')"));
check('profile switcher is secondary/collapsed',await evaluate("document.querySelector('details.r1346-profile-change:not([open])>summary')?.textContent.includes('Wrong profile?')"));

// Continue with profile: local loading + auto advance/focus.
await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Continue with this profile').click()");
await sleep(40);
check('connect action shows loading beside action',await evaluate("document.body.textContent.includes('Connecting profile…')"));
await waitFor("document.querySelector('[data-r1346-verification-heading]')!==null","verification step");
check('verification heading names selected profile',await evaluate("document.querySelector('[data-r1346-verification-heading]')?.textContent==='Verify that you manage Franklin Navigator'"));
check('Step 3 receives accessible focus after connection',await evaluate("document.activeElement===document.querySelector('[data-r1346-verification-heading]')"));

// Desktop form geometry/accessibility.
const desktop=await evaluate(`(()=>{const f=document.querySelector('.r1346-profile-access-verification'),u=f?.querySelector('input[type=url]'),t=f?.querySelector('textarea'),c=f?.querySelector('input[type=checkbox]');if(!f||!u||!t||!c)return null;const fr=f.getBoundingClientRect(),ur=u.getBoundingClientRect(),tr=t.getBoundingClientRect(),labels=[...f.querySelectorAll('label')];return{formW:fr.width,urlW:ur.width,textW:tr.width,textH:tr.height,labelled:[u,t,c].every(x=>x.labels?.length>0),labelTops:labels.map(x=>{const r=x.getBoundingClientRect();return[r.top,r.bottom]}),checkboxRequired:c.required}})()`);
check('desktop verification form exists',Boolean(desktop));
check('desktop URL input uses available width',desktop.urlW/desktop.formW>.92,JSON.stringify(desktop));
check('desktop textarea is full-width and comfortably tall',desktop.textW/desktop.formW>.92&&desktop.textH>=145,JSON.stringify(desktop));
check('verification controls have accessible labels',desktop.labelled&&desktop.checkboxRequired,JSON.stringify(desktop));
check('desktop labels/fields do not vertically collide',desktop.labelTops.every((x,i,a)=>i===a.length-1||x[1]<=a[i+1][0]+1),JSON.stringify(desktop));
await screenshot('R1346_STEP3_DESKTOP.png');results.screenshots.push('R1346_STEP3_DESKTOP.png');

// Keyboard order.
await evaluate("document.querySelector('.r1346-profile-access-verification input[type=url]').focus()");
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
await sleep(80);
check('keyboard Tab advances from URL input to authorization textarea',await evaluate("document.activeElement===document.querySelector('.r1346-profile-access-verification textarea')"));

// Mobile geometry + screenshot.
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await sleep(120);
const mobile=await evaluate(`(()=>{const f=document.querySelector('.r1346-profile-access-verification'),u=f?.querySelector('input[type=url]'),t=f?.querySelector('textarea'),c=f?.querySelector('.p0-check');if(!f||!u||!t||!c)return null;const fr=f.getBoundingClientRect(),ur=u.getBoundingClientRect(),tr=t.getBoundingClientRect(),cr=c.getBoundingClientRect();return{formW:fr.width,urlW:ur.width,textW:tr.width,textH:tr.height,checkboxW:cr.width,viewport:innerWidth,scrollW:document.documentElement.scrollWidth}})()`);
check('mobile form fits viewport without horizontal overflow',mobile.scrollW<=mobile.viewport+1,JSON.stringify(mobile));
check('mobile verification fields remain full-width',mobile.urlW/mobile.formW>.9&&mobile.textW/mobile.formW>.9&&mobile.textH>=165,JSON.stringify(mobile));
await screenshot('R1346_STEP3_MOBILE.png');results.screenshots.push('R1346_STEP3_MOBILE.png');

// Restore desktop and submit safe fixture access request.
await send('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});
await evaluate(`(()=>{const f=document.querySelector('.r1346-profile-access-verification');const u=f.querySelector('input[type=url]');const t=f.querySelector('textarea');const c=f.querySelector('input[type=checkbox]');u.value='https://franklinnavigator.com/';t.value='Controlled acceptance fixture: authorized local product owner test with no production profile mutation.';c.checked=true;for(const x of[u,t,c])x.dispatchEvent(new Event('input',{bubbles:true}));f.requestSubmit()})()`);
await sleep(40);
check('verification submit shows local loading feedback',await evaluate("document.body.textContent.includes('Submitting your request. Please keep this page open.')"));
await waitFor("document.querySelector('[data-r1346-pending-status]')!==null","pending review state");
check('pending review is clearly visible',await evaluate("document.body.textContent.includes('Waiting for review')&&document.body.textContent.includes('Access request submitted')"));
check('pending hero is state-aware',await evaluate("document.querySelector('[data-r1352-profile-hero-title]')?.textContent==='Your management request is being reviewed.'"));
check('Step 3 changes to Verification pending',await evaluate("document.querySelector('[data-r1346-profile-progress] [data-step=\"3\"]')?.textContent.trim()==='3 Verification pending'"));
check('pending status appears before signed-in account section',await evaluate("(()=>{const p=document.querySelector('[data-r1346-pending-status]'),a=[...document.querySelectorAll('.r37-member-step')].find(x=>x.textContent.includes('Signed in as'));return !!p&&!!a&&p.getBoundingClientRect().top<a.getBoundingClientRect().top})()"));
check('pending state removes verification form',await evaluate("document.querySelector('.r1346-profile-access-verification')===null"));
check('pending state names exact profile',await evaluate("document.querySelector('[data-r1346-pending-status]')?.textContent.includes('Franklin Navigator')"));
window.__unused=0;
await navigate(BASE+'/profile-access/?profile='+encodeURIComponent(PROFILE));
await waitFor("document.querySelector('[data-r1346-pending-status]')!==null","pending survives reload");
check('pending request survives full reload',await evaluate("document.querySelector('[data-r1346-pending-status]')!==null && document.querySelector('.r1346-profile-access-verification')===null"));
check('exact profile survives pending reload',await evaluate("location.search.includes('"+PROFILE+"')&&document.body.textContent.includes('Franklin Navigator')"));
check('signed-in account survives pending reload',await evaluate("document.body.textContent.includes('controlled-fixture@franklin.invalid')"));
check('no membership/payment API was started',await evaluate("!window.__r1346ApiCalls.some(x=>x.path==='/api/membership/start')"));
check('Profile Center is unavailable before VERIFIED authority',await evaluate("![...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.startsWith('/profile-studio/'))"));
check('free correction path remains available',await evaluate("[...document.querySelectorAll('a')].some(a=>a.textContent.includes('Correct public facts')&&a.getAttribute('href')?.startsWith('/corrections/'))"));

results.result='PASS';
fs.writeFileSync(evidenceDir+'/R1346_CLAIM_PATH_BROWSER_ACCEPTANCE.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
ws.close();chrome.kill('SIGTERM');
