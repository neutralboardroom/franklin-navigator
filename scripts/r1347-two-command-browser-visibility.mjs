import fs from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';

const PROFILE='FR-ORG-b00c0ace7943973c';
const BASE='http://127.0.0.1:4174';
const dir='.r1347-two-command-evidence';
fs.mkdirSync(dir,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const which=n=>spawnSync('bash',['-lc','command -v '+n],{encoding:'utf8'}).stdout.trim();
const chromePath=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(which).find(Boolean);
if(!chromePath)throw new Error('R1347_BROWSER_REQUIRED_CHROME_NOT_FOUND');
const userDir='/tmp/franklin-r1347-'+process.pid;
const chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9223','--user-data-dir='+userDir,'about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeErr='';chrome.stderr.on('data',d=>chromeErr+=String(d).slice(-4000));
process.on('exit',()=>{try{chrome.kill('SIGKILL')}catch{}});
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return r.json()}
let target;
for(let i=0;i<80;i++){try{target=(await json('http://127.0.0.1:9223/json/list')).find(x=>x.type==='page');if(target)break}catch{}await sleep(100)}
if(!target)throw new Error('Chrome CDP target unavailable '+chromeErr);
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true})});
let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result?.value};
async function waitFor(expr,label,timeout=12000){const t=Date.now();while(Date.now()-t<timeout){try{if(await evaluate(expr))return}catch{}await sleep(120)}throw new Error('Timeout waiting for '+label)}
async function navigate(path){await send('Page.navigate',{url:BASE+path});await waitFor("document.readyState==='complete'","document ready");await sleep(250)}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true});fs.writeFileSync(dir+'/'+name,Buffer.from(r.data,'base64'))}
const result={release:'FR-NAV1.30.47-HF3.13.29',profileId:PROFILE,checks:[],screenshots:[],result:'IN_PROGRESS'};
const check=(name,ok,detail='')=>{result.checks.push({name,pass:Boolean(ok),detail});if(!ok)throw new Error(name+(detail?': '+detail:''))};
await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});

// Public profile: claim is visible/prominent; correction route not buried; official indicator truthful.
await navigate('/profiles/'+PROFILE+'/');
await waitFor("[...document.querySelectorAll('a')].some(a=>a.textContent.trim()==='Claim or manage this profile')","public claim CTA");
const pub=await evaluate(`(()=>{const links=[...document.querySelectorAll('a')],claim=links.find(a=>a.textContent.trim()==='Claim or manage this profile'),correct=links.find(a=>/Review|Correct|correct/i.test(a.textContent)),official=[...document.querySelectorAll('*')].find(n=>n.textContent?.trim()==='Official Franklin Navigator profile');const vis=n=>{if(!n)return false;const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.width>1&&r.height>1&&s.display!=='none'&&s.visibility!=='hidden'};return{claim:vis(claim),claimHref:claim?.getAttribute('href'),claimClass:claim?.className,correct:vis(correct),official:vis(official),claimRect:claim?claim.getBoundingClientRect().toJSON():null}})()`);
check('public Claim/manage is visibly rendered',pub.claim,JSON.stringify(pub));
check('public Claim/manage deep-links exact profile',String(pub.claimHref).includes(PROFILE),String(pub.claimHref));
check('public Claim/manage keeps primary ownership class',String(pub.claimClass).includes('r1343-claim-primary'),String(pub.claimClass));
check('public correction/review route remains visible',pub.correct,JSON.stringify(pub));
check('first-party Official Franklin Navigator indicator remains visible',pub.official,JSON.stringify(pub));
await screenshot('R1347_PUBLIC_PROFILE_DESKTOP.png');result.screenshots.push('R1347_PUBLIC_PROFILE_DESKTOP.png');

// Claim page: exact profile preselection and four actions visibly reachable.
await navigate('/claim-profile/?profile='+encodeURIComponent(PROFILE));
await waitFor("document.querySelector('[data-hf310-claim-selected]')?.hidden===false","selected profile panel");
const claim=await evaluate(`(()=>{const sec=document.querySelector('[data-hf310-claim-selected]'),actions=[...sec.querySelectorAll('a')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href'),rect:a.getBoundingClientRect().toJSON()}));return{hidden:sec.hidden,text:sec.textContent,actions,scrollW:document.documentElement.scrollWidth,viewport:innerWidth}})()`);
check('exact-profile claim page bypasses search as normal path',!claim.hidden&&claim.text.includes('Franklin Navigator'));
for(const label of ['Claim or manage this profile','Correct information','Request removal','Preview optional member profile'])check('selected panel visibly retains '+label,claim.actions.some(a=>a.text===label&&a.rect.width>1&&a.rect.height>1));
check('selected panel claim action preserves exact profile',claim.actions.some(a=>a.text==='Claim or manage this profile'&&a.href.includes(PROFILE)));
await screenshot('R1347_CLAIM_SELECTED_DESKTOP.png');result.screenshots.push('R1347_CLAIM_SELECTED_DESKTOP.png');

// Correction: identity/name/url context auto-preserved and free routes visible.
await navigate('/corrections/?profile='+encodeURIComponent(PROFILE));
await waitFor("document.querySelector('[name=listing]')?.value==='Franklin Navigator'","correction listing prefill");
const corr=await evaluate(`(()=>({listing:document.querySelector('[name=listing]')?.value,url:document.querySelector('[name=url]')?.value,pid:document.querySelector('[name=profileId]')?.value,ctx:document.querySelector('[data-profile-control-context]')?.textContent,claimVisible:document.querySelector('[data-r1344-claim-cta]')?.getBoundingClientRect().height>1,free:document.body.textContent.includes('No membership or payment is required.')}))()`);
check('correction keeps immutable exact profile ID',corr.pid===PROFILE,JSON.stringify(corr));
check('correction prefills profile name and URL',corr.listing==='Franklin Navigator'&&String(corr.url).includes('/profiles/'+PROFILE+'/'),JSON.stringify(corr));
check('correction context and free status remain visible',String(corr.ctx).includes('Franklin Navigator')&&corr.claimVisible&&corr.free,JSON.stringify(corr));

// Business path stays free-first and ownership-before-membership.
await navigate('/business-dashboard/');
const biz=await evaluate(`(()=>{const path=document.querySelector('.r1342-business-path'),spans=[...path?.querySelectorAll('span')||[]].map((n,i)=>({i,text:n.textContent.replace(/\\s+/g,' ').trim(),h:n.getBoundingClientRect().height})),membership=document.querySelector('.hf310-dashboard-membership');return{spans,pathH:path?.getBoundingClientRect().height||0,membershipH:membership?.getBoundingClientRect().height||0,precedes:Boolean(path&&membership&&(path.compareDocumentPosition(membership)&Node.DOCUMENT_POSITION_FOLLOWING))}})()`);
check('business ownership path is visibly rendered before optional membership',biz.pathH>1&&biz.membershipH>1&&biz.precedes,JSON.stringify(biz));
check('business path keeps five ordered free-first steps',biz.spans.length===5&&
  /Find profile/i.test(biz.spans[0].text)&&
  /Claim.*verify authority/i.test(biz.spans[1].text)&&
  /Manage.*free profile|free profile.*manage/i.test(biz.spans[2].text)&&
  /Preview.*membership/i.test(biz.spans[3].text)&&
  /Join if useful/i.test(biz.spans[4].text)&&
  biz.spans.every(x=>x.h>1),JSON.stringify(biz));

// Account support: topic routing is visible, specific, and exact-profile preserving.
await navigate('/member-support/?topic=ACCOUNT_ACCESS&profile='+encodeURIComponent(PROFILE));
await waitFor("document.querySelector('[data-r1342-support-heading]')?.textContent==='Account access help'","Account Access support priority");
const sup=await evaluate(`(()=>{const links=[...document.querySelectorAll('[data-r1342-support-actions] a')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href'),h:a.getBoundingClientRect().height}));return{heading:document.querySelector('[data-r1342-support-heading]')?.textContent,links,membership:document.body.textContent.includes('Community Membership for new memberships'),badCurrent:document.body.textContent.includes('Current membership — $35/year'),form:document.querySelector('[data-member-support-form]')?.getBoundingClientRect().height||0,warning:document.body.textContent.includes('Do not send passwords'),reviewInAccess:document.body.textContent.includes('check the review status in Profile Access'),verifiedOnly:document.body.textContent.includes('Profile Center is for verified managers'),oldWrongRoute:document.body.textContent.includes('check the review status in Profile Center'),verifiedCenter:[...document.querySelectorAll('a')].some(a=>a.textContent.trim()==='Already verified? Profile Center'&&a.getAttribute('href')==='/profile-studio/'&&a.getBoundingClientRect().height>1)}})()`);
check('support prioritizes Account Access visibly',sup.heading==='Account access help'&&sup.form>1,JSON.stringify(sup));
check('support has visible exact-profile Back to sign in',sup.links.some(x=>x.text==='← Back to sign in'&&x.href.includes(PROFILE)&&x.h>1),JSON.stringify(sup));
check('support has visible exact-profile Reset password',sup.links.some(x=>x.text==='Reset password'&&x.href.includes(PROFILE)&&x.h>1),JSON.stringify(sup));
check('support membership wording does not imply visitor current plan',sup.membership&&!sup.badCurrent);
check('support routes pre-verification review status to Profile Access',sup.reviewInAccess&&sup.verifiedOnly&&!sup.oldWrongRoute,JSON.stringify(sup));
check('support labels Profile Center as verified-manager-only',sup.verifiedCenter,JSON.stringify(sup));
check('support keeps sensitive-data warning visible',sup.warning);

// Mobile non-burial / overflow checks across key Sep19 surfaces.
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(150);
for(const [path,label,selector] of [
 ['/profiles/'+PROFILE+'/','mobile public claim','a.r1343-claim-primary'],
 ['/claim-profile/?profile='+encodeURIComponent(PROFILE),'mobile selected claim panel','[data-hf310-claim-selected]'],
 ['/corrections/?profile='+encodeURIComponent(PROFILE),'mobile correction form','[data-profile-control-form]'],
 ['/member-support/?topic=ACCOUNT_ACCESS&profile='+encodeURIComponent(PROFILE),'mobile support form','[data-member-support-form]']
]){
 await navigate(path);await waitFor(`document.querySelector('${selector}')!==null`,label);
 const geom=await evaluate(`(()=>{const n=document.querySelector('${selector}'),r=n.getBoundingClientRect();return{w:r.width,h:r.height,scrollW:document.documentElement.scrollWidth,viewport:innerWidth,display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility}})()`);
 check(label+' remains visible',geom.w>1&&geom.h>1&&geom.display!=='none'&&geom.visibility!=='hidden',JSON.stringify(geom));
 check(label+' has no page horizontal overflow',geom.scrollW<=geom.viewport+1,JSON.stringify(geom));
}
await screenshot('R1347_SUPPORT_MOBILE.png');result.screenshots.push('R1347_SUPPORT_MOBILE.png');

result.result='PASS';fs.writeFileSync(dir+'/R1347_TWO_COMMAND_VISIBILITY_ACCEPTANCE.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
ws.close();chrome.kill('SIGTERM');
