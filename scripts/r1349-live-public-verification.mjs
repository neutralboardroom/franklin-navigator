#!/usr/bin/env node
import {spawn,spawnSync} from 'node:child_process';

const BASE='https://franklinnavigator.com';
const profiles=[
  ["Little Hats Italian Market (Cool Springs)","FR-ORG-17d04eafd603-little-hats-italian-market-cool-springs"],
  ["Chris Howell Insurance","FR-ORG-3e820e6c84e2-chris-howell-insurance"],
  ["Daddy's Dogs","FR-ORG-305366afb36e-daddy-s-dogs"],
  ["Buscher Law LLC - Franklin, TN","FR-ORG-61c3753cb5af085e"],
  ["M.L. Rose Craft Beer & Burgers","FR-ORG-f6a218bfcaea-m-l-rose-craft-beer-and-burgers"],
  ["615 Blinds","FR-ORG-f7f66777334f-615-blinds"],
  ["Barton Insurance Group","FR-ORG-259647dc9d6a-barton-insurance-group"],
  ["Benton White Insurance","FR-ORG-0b0ca869c9ebe059"],
  ["Carriage Hill Insurance & Risk Management","FR-ORG-6bce3aef91e8cc79"],
  ["Brave Maggie Designs","FR-ORG-58abf804cb86-brave-maggie-designs"]
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const which=name=>spawnSync('bash',['-lc','command -v '+name],{encoding:'utf8'}).stdout.trim();
const chromePath=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(which).find(Boolean);
if(!chromePath)throw new Error('LIVE_VERIFY_CHROME_NOT_FOUND');
const userDir='/tmp/franklin-r1349-live-'+process.pid;
const chrome=spawn(chromePath,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9222',
  '--user-data-dir='+userDir,'about:blank'
],{stdio:['ignore','ignore','pipe']});
let chromeErr='';chrome.stderr.on('data',d=>chromeErr+=String(d).slice(-4000));
process.on('exit',()=>{try{chrome.kill('SIGKILL')}catch{}});
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return r.json()}
let target;
for(let i=0;i<80;i++){try{const list=await json('http://127.0.0.1:9222/json/list');target=list.find(x=>x.type==='page');if(target)break}catch{}await sleep(100)}
if(!target)throw new Error('Chrome CDP target unavailable: '+chromeErr);
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
let seq=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result?.value};
async function waitFor(expr,label,timeout=15000){const start=Date.now();while(Date.now()-start<timeout){try{if(await evaluate(expr))return}catch{}await sleep(150)}throw new Error('Timeout waiting for '+label)}
async function navigate(url){await send('Page.navigate',{url});await waitFor("document.readyState==='complete'","document ready",20000);await sleep(600)}
await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});

const results=[];
for(const [expected,id] of profiles){
  const url=BASE+'/profiles/'+encodeURIComponent(id)+'/';
  await navigate(url);
  const status=await evaluate("document.body?.textContent?.length>50");
  if(!status)throw new Error(id+': empty body');
  const title=await evaluate("document.querySelector('h1')?.textContent?.trim()||''");
  const body=await evaluate("document.body.textContent");
  const claim=/Claim or manage this profile|Claim this profile/i.test(body);
  const correction=/correct|correction|remove|removal/i.test(body);
  const intended=expected==="Daddy's Dogs" ? /Daddy['’]s Dogs/i.test(title+' '+body) : title.includes(expected) || body.includes(expected);
  if(!intended)throw new Error(id+': intended profile identity not visible; h1='+title);
  if(!claim)throw new Error(id+': claim/manage action not visible');
  if(!correction)throw new Error(id+': correction/removal path not visible');
  const rec={id,expected,h1:title,claimVisible:claim,correctionRemovalVisible:correction};
  if(id==='FR-ORG-305366afb36e-daddy-s-dogs'){
    await waitFor("document.querySelector('[data-related-relevance=\"qualified-override\"]')","Daddy's Dogs R1349 related override",15000);
    const related=await evaluate("document.querySelector('[data-related-relevance=\"qualified-override\"]')?.innerText||''");
    const asset=await evaluate("[...document.scripts].some(s=>s.src.includes('r1349-related-profiles.js'))");
    if(!asset)throw new Error("Daddy's Dogs: R1349 relevance asset not loaded");
    for(const good of ['Back Yard Burgers','Burger Up Franklin','Dog Haus'])if(!related.includes(good))throw new Error("Daddy's Dogs: missing "+good);
    for(const bad of ['615 Blinds','503 Bloomhouse'])if(related.includes(bad))throw new Error("Daddy's Dogs: unrelated result remains "+bad);
    rec.related=related;
    rec.r1349AssetLoaded=asset;
  }
  results.push(rec);
}
console.log(JSON.stringify({result:'PASS',release:'FR-NAV1.30.49-HF3.13.31',base:BASE,count:results.length,profiles:results},null,2));
try{chrome.kill('SIGKILL')}catch{}
