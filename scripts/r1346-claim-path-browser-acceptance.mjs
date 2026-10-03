import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'.r1346-browser-evidence');
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const BASE='http://127.0.0.1:4173';
const PROFILE='FR-ORG-b00c0ace7943973c';
const PROFILE_NAME='Franklin Navigator';
const results={schema:'franklin.r1346.claim-path-browser-acceptance.v1',result:'PASS',checks:[],screenshots:[]};
const check=(name,pass,detail='')=>{results.checks.push({name,pass:Boolean(pass),detail:String(detail||'')});if(!pass)results.result='FAIL'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let chrome;
for(const c of ['google-chrome','chromium','chromium-browser']){try{const p=spawn(c,['--version']);await new Promise((res,rej)=>{p.once('exit',code=>code===0?res():rej());p.once('error',rej)});chrome=c;break}catch{}}
if(!chrome)throw new Error('Chrome/Chromium not found');
const port=9223;
const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage',`--remote-debugging-port=${port}`,'about:blank'],{stdio:'ignore'});
const cdp=async(method,params={})=>{const list=await fetch(`http://127.0.0.1:${port}/json`);const pages=await list.json();const page=pages.find(x=>x.type==='page');if(!page)throw new Error('CDP page missing');const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});const id=Math.floor(Math.random()*1e9);const promise=new Promise((res,rej)=>{ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id===id){ws.close();m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}}});ws.send(JSON.stringify({id,method,params}));return promise};
async function send(method,params={}){return cdp(method,params)}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text||'evaluate failed');return r.result?.value}
async function navigate(url){await send('Page.navigate',{url});for(let i=0;i<120;i++){if(await evaluate("document.readyState==='complete'"))break;await sleep(100)}}
async function waitFor(expression,label,timeout=10000){const started=Date.now();while(Date.now()-started<timeout){try{if(await evaluate(expression))return}catch{}await sleep(100)}throw new Error('Timeout waiting for '+label)}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(OUT,name),Buffer.from(r.data,'base64'))}

try{
  for(let i=0;i<80;i++){try{await fetch(`http://127.0.0.1:${port}/json`);break}catch{await sleep(100)}}
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});
  await navigate(BASE+'/profile-access/?profile='+encodeURIComponent(PROFILE));

  // Stub runtime calls with deterministic first-party fixture behavior.
  await evaluate(`(()=>{
    const PROFILE=${JSON.stringify(PROFILE)},NAME=${JSON.stringify(PROFILE_NAME)};
    let linked=false,pending=false,signed=true;
    const body=x=>Promise.resolve(new Response(JSON.stringify(x),{status:200,headers:{'Content-Type':'application/json'}}));
    window.fetch=(input,init={})=>{
      const u=String(input),method=String(init.method||'GET').toUpperCase();
      if(u.includes('/ready'))return body({ok:true,liveCheckoutEnabled:false});
      if(u.includes('/api/accounts/me'))return body({account:signed?{accountId:'fixture-account',email:'fixture@franklin.invalid'}:null,profileLinks:linked?[{profile_id:PROFILE,authority_state:'PENDING',review_state:pending?'PENDING':'',review_revision:1,review_created_at:new Date().toISOString(),review_updated_at:new Date().toISOString()}]:[]});
      if(u.includes('/api/profile-links')&&method==='POST'){linked=true;return body({ok:true})}
      if(u.includes('/api/member/representation/request')&&method==='POST'){pending=true;return body({ok:true})}
      if(u.includes('/api/accounts/logout')){signed=false;return body({ok:true})}
      if(u.includes('/api/accounts/login')){signed=true;return body({ok:true})}
      if(u.includes('/api/accounts/password-reset/request'))return body({ok:true});
      if(u.includes('/api/accounts/password-reset/complete')){signed=true;return body({ok:true})}
      if(u.includes('/data/franklin-profiles-manifest.json'))return body({chunks:[{file:'/fixture-profiles.json'}]});
      if(u.includes('/fixture-profiles.json'))return body({records:[{i:PROFILE,n:NAME,c:'Community resource',l:'Franklin, Tennessee',g:'Franklin, Tennessee',w:'https://franklinnavigator.com'}]});
      if(u.includes('/data/discovery/r1329-franklin-navigator-profile.json'))return body({schemaVersion:'franklin.discovery-overlay.v1',community:'FRANKLIN_TN',profileId:PROFILE,sourceRelease:'FR-PF-PLATFORM-15.28',addressType:'MAILING_ADDRESS_ONLY',physicalLocationVerified:false,categories:['Community resource'],types:['Organization'],areas:['Franklin, Tennessee'],websites:['https://franklinnavigator.com'],dates:['2026-09-01'],records:[[PROFILE,NAME,'Franklin, Tennessee',0,0,0,0,'','',0,false,'']]});
      return body({});
    };
    location.reload();
  })()`);
  await sleep(300);
  await waitFor("document.body.textContent.includes('Franklin Navigator')",'profile access render');
  check('progress exposes current step semantics',await evaluate("document.querySelector('[data-r1346-profile-progress] [aria-current=step]')!==null"));

  await waitFor("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Sign in')","sign in mode button");
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Sign in').click()");
  await waitFor("[...document.querySelectorAll('a')].some(a=>a.textContent.includes('Forgot password'))","forgot link");
  const recoveryHref=await evaluate("[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Forgot password')).getAttribute('href')");
  check('forgot-password link preserves exact profile',String(recoveryHref).includes(PROFILE),String(recoveryHref));

  await navigate(BASE+recoveryHref);
  await waitFor("document.querySelector('.r1342-recovery-form input[type=email]')","reset email form");
  const resetRequestImmediate=await evaluate("(()=>{const i=document.querySelector('.r1342-recovery-form input[type=email]');i.value='controlled-fixture@franklin.invalid';i.dispatchEvent(new Event('input',{bubbles:true}));const f=document.querySelector('.r1342-recovery-form');f.requestSubmit();const b=f.querySelector('button[type=submit]');return{disabled:b?.disabled===true,loading:document.body.textContent.includes('Sending password-reset instructions…')}})()");
  check('reset request immediately disables duplicate submit',resetRequestImmediate?.disabled===true,JSON.stringify(resetRequestImmediate));
  check('reset request shows local loading feedback',resetRequestImmediate?.loading===true,JSON.stringify(resetRequestImmediate));
  await waitFor("document.body.textContent.includes('Check your email')","reset request acknowledgement");
  check('reset acknowledgement is generic',await evaluate("document.body.textContent.includes('If an account exists for this email, password-reset instructions have been sent.')"));
  check('reset acknowledgement replaces old request form',await evaluate("document.querySelector('.r1342-recovery-form')===null"));

  await navigate(BASE+'/account-recovery/?profile='+encodeURIComponent(PROFILE)+'&r1346=reset#token='+('A'.repeat(48))+'&profile='+encodeURIComponent(PROFILE));
  await waitFor("document.querySelectorAll('.r1342-recovery-form input[type=password]').length===2","new password form");
  check('frontend password minimum is 8',await evaluate("[...document.querySelectorAll('.r1342-recovery-form input[type=password]')].every(i=>i.minLength===8)"));
  const resetCompleteImmediate=await evaluate("(()=>{const a=[...document.querySelectorAll('.r1342-recovery-form input[type=password]')];for(const i of a){i.value='12345678';i.dispatchEvent(new Event('input',{bubbles:true}))}const f=document.querySelector('.r1342-recovery-form');f.requestSubmit();const b=f.querySelector('button[type=submit]');return{disabled:b?.disabled===true,loading:document.body.textContent.includes('Changing password…')}})()");
  check('reset completion immediately disables duplicate submit',resetCompleteImmediate?.disabled===true,JSON.stringify(resetCompleteImmediate));
  check('reset completion shows local loading feedback',resetCompleteImmediate?.loading===true,JSON.stringify(resetCompleteImmediate));
  await waitFor("document.body.textContent.includes('Password changed successfully.')","reset complete success");
  check('old reset form removed after success',await evaluate("document.querySelector('.r1342-recovery-form')===null"));
  check('reset success confirms signed-in state',await evaluate("document.body.textContent.includes('You’re signed in.')"));
  check('reset success preserves exact-profile return',await evaluate("document.querySelector('.r1346-recovery-success a')?.getAttribute('href').includes('"+PROFILE+"')"));
  check('reset token removed from visible URL',await evaluate("!location.hash.includes('token=')"));

  const continueHref=await evaluate("document.querySelector('.r1346-recovery-success a').getAttribute('href')");
  await navigate(BASE+continueHref);
  await waitFor("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Start management verification')","connect action");
  check('same exact profile survives password recovery',await evaluate("location.search.includes('"+PROFILE+"') && document.body.textContent.includes('Franklin Navigator')"));
  check('profile switcher is secondary/collapsed',await evaluate("document.querySelector('details.r1346-profile-change:not([open])>summary')?.textContent.includes('Wrong profile?')"));

  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Start management verification').click()");
  await sleep(40);
  check('connect action shows loading beside action',await evaluate("document.body.textContent.includes('Starting management verification…')"));
  await waitFor("document.querySelector('[data-r1346-verification-heading]')!==null","verification step");
  check('verification heading names selected profile',await evaluate("document.querySelector('[data-r1346-verification-heading]')?.textContent==='Verify that you manage '+PROFILE_NAME"));
  check('Step 3 receives accessible focus after connection',await evaluate("document.activeElement===document.querySelector('[data-r1346-verification-heading]')"));

  const desktop=await evaluate(`(()=>{const f=document.querySelector('.r1346-profile-access-verification'),u=f?.querySelector('input[type=url]'),t=f?.querySelector('textarea'),c=f?.querySelector('input[type=checkbox]');if(!f||!u||!t||!c)return null;const fr=f.getBoundingClientRect(),ur=u.getBoundingClientRect(),tr=t.getBoundingClientRect(),labels=[...f.querySelectorAll('label')];return{formW:fr.width,urlW:ur.width,textW:tr.width,textH:tr.height,labelled:[u,t,c].every(x=>x.labels?.length>0),labelTops:labels.map(x=>{const r=x.getBoundingClientRect();return[r.top,r.bottom]}),checkboxRequired:c.required}})()`);
  check('desktop verification form exists',Boolean(desktop));
  check('desktop URL input uses available width',desktop.urlW/desktop.formW>.92,JSON.stringify(desktop));
  check('desktop textarea is full-width and comfortably tall',desktop.textW/desktop.formW>.92&&desktop.textH>=145,JSON.stringify(desktop));
  check('verification controls have accessible labels',desktop.labelled&&desktop.checkboxRequired,JSON.stringify(desktop));
  check('desktop labels/fields do not vertically collide',desktop.labelTops.every((x,i,a)=>i===a.length-1||x[1]<=a[i+1][0]+1),JSON.stringify(desktop));
  await screenshot('R1346_STEP3_DESKTOP.png');results.screenshots.push('R1346_STEP3_DESKTOP.png');

  await evaluate("document.querySelector('.r1346-profile-access-verification input[type=url]').focus()");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
  await sleep(80);
  check('keyboard Tab reaches profile website reuse action after URL input',await evaluate("document.activeElement?.textContent.trim()==='Use official website as evidence'"));

  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await sleep(150);
  const mobile=await evaluate(`(()=>{const f=document.querySelector('.r1346-profile-access-verification'),u=f?.querySelector('input[type=url]'),t=f?.querySelector('textarea');if(!f||!u||!t)return null;const fr=f.getBoundingClientRect(),ur=u.getBoundingClientRect(),tr=t.getBoundingClientRect();return{formW:fr.width,urlW:ur.width,textW:tr.width,textH:tr.height,bodyW:document.documentElement.scrollWidth,viewport:innerWidth}})()`);
  check('mobile verification form exists',Boolean(mobile));
  check('mobile controls fit viewport',mobile&&mobile.bodyW<=mobile.viewport+2,JSON.stringify(mobile));
  check('mobile URL/textarea stay full-width',mobile&&mobile.urlW/mobile.formW>.9&&mobile.textW/mobile.formW>.9,JSON.stringify(mobile));
  await screenshot('R1346_STEP3_MOBILE.png');results.screenshots.push('R1346_STEP3_MOBILE.png');

  fs.writeFileSync(path.join(OUT,'R1346_CLAIM_PATH_BROWSER_ACCEPTANCE.json'),JSON.stringify(results,null,2)+'\n');
  if(results.result!=='PASS')throw new Error('Browser acceptance failed: '+JSON.stringify(results.checks.filter(x=>!x.pass)));
  console.log(JSON.stringify(results,null,2));
}finally{
  proc.kill('SIGTERM');
}
