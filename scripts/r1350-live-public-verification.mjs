#!/usr/bin/env node
import fs from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';

const BASE='https://franklinnavigator.com';
const API='https://franklin-navigator-membership.onrender.com';
const DADDY='FR-ORG-305366afb36e-daddy-s-dogs';
const CONTROL='FR-ORG-f6a218bfcaea-m-l-rose-craft-beer-and-burgers';
const RELEASE='FR-NAV1.30.50-HF3.13.32';
const dir='.r1350-live-evidence';
fs.rmSync(dir,{recursive:true,force:true});
fs.mkdirSync(dir,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const which=n=>spawnSync('bash',['-lc','command -v '+n],{encoding:'utf8'}).stdout.trim();
const chromePath=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(which).find(Boolean);
if(!chromePath)throw new Error('R1350_LIVE_VERIFY_CHROME_NOT_FOUND');

const userDir='/tmp/franklin-r1350-live-'+process.pid;
fs.rmSync(userDir,{recursive:true,force:true});
const chrome=spawn(chromePath,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  '--remote-allow-origins=*','--no-first-run','--no-default-browser-check',
  '--user-data-dir='+userDir,'about:blank'
],{stdio:['ignore','ignore','pipe']});
let chromeErr='';
chrome.stderr.on('data',d=>chromeErr+=String(d).slice(-6000));
process.on('exit',()=>{try{chrome.kill('SIGKILL')}catch{}});

async function json(url,opts){const r=await fetch(url,opts);if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return r.json()}
const activePortFile=userDir+'/DevToolsActivePort';
let cdpPort;
for(let i=0;i<200;i++){
  if(chrome.exitCode!==null)throw new Error('Chrome exited before CDP ready exit='+chrome.exitCode+' '+chromeErr);
  try{
    if(fs.existsSync(activePortFile)){
      const p=Number(fs.readFileSync(activePortFile,'utf8').trim().split(/\r?\n/)[0]);
      if(Number.isInteger(p)&&p>0){cdpPort=p;break}
    }
  }catch{}
  await sleep(100);
}
if(!cdpPort)throw new Error('Chrome DevToolsActivePort unavailable '+chromeErr);

let target;
for(let i=0;i<120;i++){
  try{
    target=(await json('http://127.0.0.1:'+cdpPort+'/json/list')).find(x=>x.type==='page');
    if(target)break;
  }catch{}
  await sleep(100);
}
if(!target)throw new Error('Chrome CDP target unavailable port='+cdpPort+' '+chromeErr);

const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true})});
let seq=0;
const pending=new Map();
ws.addEventListener('message',e=>{
  const m=JSON.parse(String(e.data));
  if(m.id&&pending.has(m.id)){
    const p=pending.get(m.id); pending.delete(m.id);
    m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);
  }
});
const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq; pending.set(id,{resolve,reject});
  ws.send(JSON.stringify({id,method,params}));
});
const evaluate=async expression=>{
  const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});
  if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result?.value;
};
async function waitFor(expr,label,timeout=18000){
  const t=Date.now();
  while(Date.now()-t<timeout){
    try{if(await evaluate(expr))return}catch{}
    await sleep(120);
  }
  throw new Error('Timeout waiting for '+label);
}
async function navigate(path){
  await send('Page.navigate',{url:BASE+path});
  await waitFor("document.readyState==='complete'",'document ready '+path,22000);
  await sleep(700);
}
async function screenshot(name){
  const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true});
  fs.writeFileSync(dir+'/'+name,Buffer.from(r.data,'base64'));
}
const checks=[];
const check=(name,ok,detail='')=>{
  checks.push({name,pass:Boolean(ok),detail});
  if(!ok)throw new Error(name+(detail?': '+detail:''));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});

// Independent release/runtime identity checks.
const hf36=await (await fetch(BASE+'/assets/hf36.js?live-r1350-verify=1')).text();
check('live hf36 asset carries R1350 release identity',hf36.includes(RELEASE));
const health=await json(API+'/health',{headers:{Origin:BASE}});
check('live membership runtime reports R1350',health?.ok===true&&health?.release===RELEASE,JSON.stringify({ok:health?.ok,release:health?.release,startupReady:health?.startupReady}));
check('live membership runtime startup ready',health?.startupReady===true,JSON.stringify({startupReady:health?.startupReady}));

// No-JavaScript: Daddy's broad category static filler remains in source but must be hidden by CSS.
await send('Emulation.setScriptExecutionDisabled',{value:true});
await navigate('/profiles/'+DADDY+'/');
let state=await evaluate(`(()=>{
  const c=document.querySelector('.hf35-competitor-card');
  return {
    h1:document.querySelector('h1')?.textContent?.trim()||'',
    exists:!!c,
    display:c?getComputedStyle(c).display:null,
    text:c?.textContent||'',
    claim:[...document.querySelectorAll('a')].some(a=>/Claim or manage this profile/i.test(a.textContent||'')),
    correction:/correction|removal|remove/i.test(document.body.textContent||'')
  }
})()`);
check("Daddy's Dogs identity visible with JS disabled",/Daddy['’]s Dogs/i.test(state.h1),JSON.stringify(state));
check("Daddy's Dogs static related module remains in DOM",state.exists,JSON.stringify(state));
check("Daddy's Dogs broad-category filler hidden with JS disabled",state.display==='none',JSON.stringify(state));
check("Daddy's Dogs raw static filler is actually being guarded",/615 Blinds/.test(state.text)&&/503 Bloomhouse/.test(state.text),state.text);
check("Daddy's Dogs claim path remains visible with JS disabled",state.claim,JSON.stringify(state));
check("Daddy's Dogs correction/removal remains visible with JS disabled",state.correction,JSON.stringify(state));
await screenshot('R1350_LIVE_DADDYS_NOJS.png');

// No-JavaScript: specific-category control must not be over-hidden.
await navigate('/profiles/'+CONTROL+'/');
state=await evaluate(`(()=>{
  const c=document.querySelector('.hf35-competitor-card');
  return {h1:document.querySelector('h1')?.textContent?.trim()||'',exists:!!c,display:c?getComputedStyle(c).display:null,text:c?.textContent||''}
})()`);
check('specific-category control identity visible',/M\.L\. Rose Craft Beer & Burgers/i.test(state.h1),JSON.stringify(state));
check('specific-category related module remains visible with JS disabled',state.exists&&state.display!=='none',JSON.stringify(state));
await screenshot('R1350_LIVE_SPECIFIC_CONTROL_NOJS.png');

// JavaScript on: Daddy's qualified R1349 override must replace hidden filler with relevant food options.
await send('Emulation.setScriptExecutionDisabled',{value:false});
await navigate('/profiles/'+DADDY+'/');
await waitFor("document.querySelector('[data-related-relevance="qualified-override"]')","Daddy qualified related override",18000);
state=await evaluate(`(()=>{
  const c=document.querySelector('[data-related-relevance="qualified-override"]');
  return {
    h1:document.querySelector('h1')?.textContent?.trim()||'',
    display:c?getComputedStyle(c).display:null,
    relevance:c?.dataset.relatedRelevance||'',
    vertical:c?.dataset.relatedVertical||'',
    text:c?.textContent||'',
    asset:[...document.scripts].some(s=>s.src.includes('r1349-related-profiles.js'))
  }
})()`);
check("Daddy's Dogs qualified override visible with JS enabled",state.relevance==='qualified-override'&&state.display!=='none',JSON.stringify(state));
check("Daddy's Dogs R1349 relevance asset loaded",state.asset,JSON.stringify(state));
for(const good of ['Back Yard Burgers','Burger Up Franklin','Dog Haus'])check('Daddy related includes '+good,state.text.includes(good),state.text);
for(const bad of ['615 Blinds','503 Bloomhouse','Amendment XVIII Cocktail Club'])check('Daddy related excludes '+bad,!state.text.includes(bad),state.text);
check('Daddy related neutrality language preserved',/Not ranked or endorsed/i.test(state.text),state.text);
await screenshot('R1350_LIVE_DADDYS_JS_OVERRIDE.png');

const receipt={
  result:'PASS',
  release:RELEASE,
  base:BASE,
  verifiedAt:new Date().toISOString(),
  chromeDynamicDevToolsPort:true,
  checks,
  noJs:{
    daddyBroadStaticFillerHidden:true,
    specificCategoryControlVisible:true
  },
  jsEnabled:{
    daddyQualifiedOverrideVisible:true,
    expectedRelated:['Back Yard Burgers','Burger Up Franklin','Dog Haus'],
    excludedUnrelated:['615 Blinds','503 Bloomhouse','Amendment XVIII Cocktail Club']
  },
  runtime:{release:health.release,startupReady:health.startupReady},
  screenshots:[
    'R1350_LIVE_DADDYS_NOJS.png',
    'R1350_LIVE_SPECIFIC_CONTROL_NOJS.png',
    'R1350_LIVE_DADDYS_JS_OVERRIDE.png'
  ]
};
fs.writeFileSync(dir+'/R1350_LIVE_PUBLIC_VERIFICATION.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
ws.close();
try{chrome.kill('SIGTERM')}catch{}
