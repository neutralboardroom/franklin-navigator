import fs from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
const BASE='http://127.0.0.1:4175';
const DADDY='FR-ORG-305366afb36e-daddy-s-dogs';
const CONTROL='FR-ORG-f6a218bfcaea-m-l-rose-craft-beer-and-burgers';
const dir='.r1350-related-evidence';fs.mkdirSync(dir,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const which=n=>spawnSync('bash',['-lc','command -v '+n],{encoding:'utf8'}).stdout.trim();
const chromePath=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(which).find(Boolean);
if(!chromePath)throw new Error('R1350_BROWSER_REQUIRED_CHROME_NOT_FOUND');
const userDir='/tmp/franklin-r1350-'+process.pid;
fs.rmSync(userDir,{recursive:true,force:true});
const chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*','--no-first-run','--no-default-browser-check','--user-data-dir='+userDir,'about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeErr='';chrome.stderr.on('data',d=>chromeErr+=String(d).slice(-4000));process.on('exit',()=>{try{chrome.kill('SIGKILL')}catch{}});
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return r.json()}
const activePortFile=userDir+'/DevToolsActivePort';
let cdpPort;
for(let i=0;i<600;i++){
  if(chrome.exitCode!==null)throw new Error('Chrome exited before CDP became ready exit='+chrome.exitCode+' '+chromeErr);
  try{
    if(fs.existsSync(activePortFile)){
      const lines=fs.readFileSync(activePortFile,'utf8').trim().split(/\r?\n/);
      const p=Number(lines[0]);
      if(Number.isInteger(p)&&p>0){cdpPort=p;break}
    }
  }catch{}
  await sleep(100)
}
if(!cdpPort)throw new Error('Chrome DevToolsActivePort unavailable '+chromeErr);
let target;for(let i=0;i<120;i++){try{target=(await json('http://127.0.0.1:'+cdpPort+'/json/list')).find(x=>x.type==='page');if(target)break}catch{}await sleep(100)}
if(!target)throw new Error('Chrome CDP target unavailable port='+cdpPort+' '+chromeErr);
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true})});
let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result?.value};
async function wait(expr,label,timeout=12000){const t=Date.now();while(Date.now()-t<timeout){try{if(await evaluate(expr))return}catch{}await sleep(100)}throw new Error('Timeout '+label)}
async function nav(path){await send('Page.navigate',{url:BASE+path});await wait("document.readyState==='complete'",'document ready');await sleep(180)}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true});fs.writeFileSync(dir+'/'+name,Buffer.from(r.data,'base64'))}
const out={release:'FR-NAV1.30.57-HF3.13.39',checks:[],result:'IN_PROGRESS'};
const check=(name,ok,detail='')=>{out.checks.push({name,pass:Boolean(ok),detail});if(!ok)throw new Error(name+' '+detail)};
await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});
await send('Emulation.setScriptExecutionDisabled',{value:true});
await nav('/profiles/'+DADDY+'/');
let s=await evaluate(`(()=>{const c=document.querySelector('.hf35-competitor-card');return{exists:!!c,display:c?getComputedStyle(c).display:null,text:c?.textContent||''}})()`);
check('Daddy static related module remains in source fixture',s.exists,JSON.stringify(s));
check('Daddy broad category card hidden with JS disabled',s.display==='none',JSON.stringify(s));
await screenshot('R1350_DADDYS_NOJS.png');
await nav('/profiles/'+CONTROL+'/');
s=await evaluate(`(()=>{const c=document.querySelector('.hf35-competitor-card');return{exists:!!c,display:c?getComputedStyle(c).display:null}})()`);
check('specific-category control keeps related module',s.exists&&s.display!=='none',JSON.stringify(s));
await send('Emulation.setScriptExecutionDisabled',{value:false});
await nav('/profiles/'+DADDY+'/');
await wait("document.querySelector('.hf35-competitor-card')?.dataset.relatedRelevance==='qualified-override'",'qualified override');
s=await evaluate(`(()=>{const c=document.querySelector('.hf35-competitor-card');const t=c?.textContent||'';return{display:c?getComputedStyle(c).display:null,relevance:c?.dataset.relatedRelevance||'',text:t}})()`);
check('Daddy qualified JS override visible',s.display!=='none'&&s.relevance==='qualified-override',JSON.stringify(s));
check('Daddy qualified set present',/Back Yard Burgers/.test(s.text)&&/Burger Up Franklin/.test(s.text)&&/Dog Haus/.test(s.text),s.text);
check('Daddy unrelated static names absent after override',!/615 Blinds|503 Bloomhouse/.test(s.text),s.text);
await screenshot('R1350_DADDYS_JS_OVERRIDE.png');
out.result='PASS';fs.writeFileSync(dir+'/R1350_RELATED_PROFILE_NOJS_ACCEPTANCE.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out));
ws.close();try{chrome.kill('SIGTERM')}catch{}
