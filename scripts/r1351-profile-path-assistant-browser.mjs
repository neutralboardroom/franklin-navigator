import fs from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';

const BASE='http://127.0.0.1:4176';
const dir='.r1351-browser-evidence';
fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const which=n=>spawnSync('bash',['-lc','command -v '+n],{encoding:'utf8'}).stdout.trim();
const chromePath=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(which).find(Boolean);
if(!chromePath)throw new Error('R1351_BROWSER_REQUIRED_CHROME_NOT_FOUND');
const userDir='/tmp/franklin-r1351-'+process.pid;fs.rmSync(userDir,{recursive:true,force:true});
const chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*','--no-first-run','--no-default-browser-check','--user-data-dir='+userDir,'about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeErr='';chrome.stderr.on('data',d=>chromeErr+=String(d).slice(-6000));process.on('exit',()=>{try{chrome.kill('SIGKILL')}catch{}});
const activePortFile=userDir+'/DevToolsActivePort';let cdpPort;
for(let i=0;i<200;i++){if(chrome.exitCode!==null)throw new Error('Chrome exited '+chrome.exitCode+' '+chromeErr);try{if(fs.existsSync(activePortFile)){const p=Number(fs.readFileSync(activePortFile,'utf8').trim().split(/\r?\n/)[0]);if(Number.isInteger(p)&&p>0){cdpPort=p;break}}}catch{}await sleep(100)}
if(!cdpPort)throw new Error('DevToolsActivePort unavailable '+chromeErr);
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return r.json()}
let target;for(let i=0;i<120;i++){try{target=(await json('http://127.0.0.1:'+cdpPort+'/json/list')).find(x=>x.type==='page');if(target)break}catch{}await sleep(100)}
if(!target)throw new Error('CDP target unavailable');
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true})});
let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result?.value};
async function waitFor(expr,label,timeout=18000){const t=Date.now();while(Date.now()-t<timeout){try{if(await evaluate(expr))return}catch{}await sleep(120)}throw new Error('Timeout '+label)}
async function nav(path){await send('Page.navigate',{url:BASE+path});await waitFor("document.readyState==='complete'",'document '+path,22000);await sleep(350)}
async function shot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true});fs.writeFileSync(dir+'/'+name,Buffer.from(r.data,'base64'))}
const checks=[];const check=(name,pass,detail='')=>{checks.push({name,pass:Boolean(pass),detail});if(!pass)throw new Error(name+(detail?': '+detail:''))};
await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});
await nav('/claim-profile/');
await evaluate(`(()=>{const i=document.querySelector('#hf310-profile-q');i.value='Franklin Navigator';i.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-hf310-claim-search-form]').requestSubmit();return true})()`);
await waitFor("[...document.querySelectorAll('.r1342-claim-result-action')].some(b=>b.textContent.trim()==='Continue with this profile')",'neutral profile selection');
let state=await evaluate(`(()=>{const cards=[...document.querySelectorAll('.hf310-claim-result')];const card=cards.find(c=>/Franklin Navigator/i.test(c.querySelector('strong')?.textContent||''));const b=card?.querySelector('.r1342-claim-result-action');return{found:!!card,label:b?.textContent?.trim()||'',aria:b?.getAttribute('aria-label')||''}})()`);
check('profile search uses neutral selection wording',state.found&&state.label==='Continue with this profile',JSON.stringify(state));
await evaluate(`(()=>{const card=[...document.querySelectorAll('.hf310-claim-result')].find(c=>/Franklin Navigator/i.test(c.querySelector('strong')?.textContent||''));card.querySelector('.r1342-claim-result-action').click();return true})()`);
await waitFor("document.querySelector('[data-hf310-claim-selected]')&&!document.querySelector('[data-hf310-claim-selected]').hidden",'selected profile panel');
state=await evaluate(`(()=>{const p=document.querySelector('[data-hf310-selected-profile]'),a=[...document.querySelectorAll('[data-hf310-profile-actions] a')].map(x=>({text:x.textContent.trim(),href:x.getAttribute('href')}));return{text:p?.textContent||'',actions:a,url:location.pathname+location.search}})()`);
check('selected profile explains selection does not claim or alter facts',/does not claim the profile or change public facts/i.test(state.text),state.text);
check('selected profile shows free access/correction boundary',/verification and factual corrections\/removal are free/i.test(state.text),state.text);
for(const label of ['Claim or manage this profile','Correct information','Request removal','Preview optional member profile'])check('selected panel preserves '+label,state.actions.some(x=>x.text===label),JSON.stringify(state.actions));
check('claim/manage preserves exact selected profile',state.actions.some(x=>x.text==='Claim or manage this profile'&&/profile=FR-ORG-b00c0ace7943973c/.test(x.href||'')),JSON.stringify(state.actions));
await shot('R1351_PROFILE_SELECTED_EN.png');
await evaluate("document.querySelector('[data-r37-lang=\"es\"]')?.click()");await sleep(400);
state=await evaluate(`document.querySelector('[data-hf310-selected-profile]')?.textContent||''`);
check('new selected-profile summary has Spanish parity',/Seleccionar este resultado no reclama el perfil ni cambia los datos públicos/i.test(state),state);
await shot('R1351_PROFILE_SELECTED_ES.png');
await nav('/assistant/');
await evaluate(`(()=>{const i=document.querySelector('[data-navigator-input]');i.value='I need someone to mow my lawn';document.querySelector('[data-navigator-bot] form').requestSubmit();return true})()`);
await waitFor("document.querySelectorAll('.franklin-assistant-profile-match').length>=2",'English profile cards');
const first=await evaluate(`(()=>({names:[...document.querySelectorAll('.franklin-assistant-profile-match h3')].map(x=>x.textContent.trim()),websites:[...document.querySelectorAll('.franklin-assistant-profile-match')].filter(x=>[...x.querySelectorAll('a')].some(a=>a.textContent.trim()==='Website')).length}))()`);
check('English local profile handoff shows cards',first.names.length>=2,JSON.stringify(first));check('English initial cards include website-bearing profiles',first.websites>=1,JSON.stringify(first));
await evaluate(`(()=>{const i=document.querySelector('[data-navigator-input]');i.value='Which of these have websites?';document.querySelector('[data-navigator-bot] form').requestSubmit();return true})()`);
await waitFor("[...document.querySelectorAll('[data-assistant-mode]')].some(x=>x.dataset.assistantMode==='directory_card_followup')",'English card follow-up');
state=await evaluate(`(()=>{const c=[...document.querySelectorAll('[data-assistant-mode=\"directory_card_followup\"]')].at(-1);return{text:c?.textContent||'',names:[...c.querySelectorAll('.franklin-assistant-profile-match h3')].map(x=>x.textContent.trim()),allHaveWebsite:[...c.querySelectorAll('.franklin-assistant-profile-match')].every(x=>[...x.querySelectorAll('a')].some(a=>a.textContent.trim()==='Website'))}})()`);
check('English website follow-up is answered from displayed cards',/profiles I just showed/i.test(state.text)&&state.names.length>=1&&state.allHaveWebsite,JSON.stringify(state));
check('English website follow-up stays within prior displayed set',state.names.every(n=>first.names.includes(n)),JSON.stringify({before:first.names,after:state.names}));
await shot('R1351_ASSISTANT_WEBSITE_FOLLOWUP_EN.png');
await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Clear / new question')?.click()");await sleep(200);
state=await evaluate(`({history:window.FranklinAssistant?.history?.().length,hidden:document.querySelector('[data-navigator-output]')?.hidden,conversation:document.querySelector('[data-navigator-bot]')?.dataset.franklinConversationLayout||''})`);
check('Clear/new question resets visible conversation',state.history===0&&state.hidden===true&&state.conversation==='',JSON.stringify(state));
await nav('/es/asistente/');
await evaluate(`(()=>{const i=document.querySelector('[data-navigator-input]');i.value='Necesito alguien para cortar el césped';document.querySelector('[data-navigator-bot] form').requestSubmit();return true})()`);
await waitFor("document.querySelectorAll('.franklin-assistant-profile-match').length>=2",'Spanish profile cards');
const esFirst=await evaluate(`[...document.querySelectorAll('.franklin-assistant-profile-match h3')].map(x=>x.textContent.trim())`);
await evaluate(`(()=>{const i=document.querySelector('[data-navigator-input]');i.value='¿Cuáles tienen sitio web?';document.querySelector('[data-navigator-bot] form').requestSubmit();return true})()`);
await waitFor("[...document.querySelectorAll('[data-assistant-mode]')].some(x=>x.dataset.assistantMode==='directory_card_followup')",'Spanish card follow-up');
state=await evaluate(`(()=>{const c=[...document.querySelectorAll('[data-assistant-mode=\"directory_card_followup\"]')].at(-1);return{text:c?.textContent||'',names:[...c.querySelectorAll('.franklin-assistant-profile-match h3')].map(x=>x.textContent.trim()),allHaveWebsite:[...c.querySelectorAll('.franklin-assistant-profile-match')].every(x=>[...x.querySelectorAll('a')].some(a=>a.textContent.trim()==='Sitio web'))}})()`);
check('Spanish website follow-up is answered from displayed cards',/perfiles que acabo de mostrar/i.test(state.text)&&state.names.length>=1&&state.allHaveWebsite,JSON.stringify(state));
check('Spanish website follow-up stays within prior displayed set',state.names.every(n=>esFirst.includes(n)),JSON.stringify({before:esFirst,after:state.names}));
await shot('R1351_ASSISTANT_WEBSITE_FOLLOWUP_ES.png');
const receipt={result:'PASS',release:'FR-NAV1.30.51-HF3.13.33',checks,artifacts:['R1351_PROFILE_SELECTED_EN.png','R1351_PROFILE_SELECTED_ES.png','R1351_ASSISTANT_WEBSITE_FOLLOWUP_EN.png','R1351_ASSISTANT_WEBSITE_FOLLOWUP_ES.png']};
fs.writeFileSync(dir+'/R1351_PROFILE_PATH_ASSISTANT_BROWSER_ACCEPTANCE.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
ws.close();try{chrome.kill('SIGTERM')}catch{}
