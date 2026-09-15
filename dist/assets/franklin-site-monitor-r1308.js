(()=>{'use strict';
const VERSION='FR-NAV1.30.8-HF3.12.0';
const ENDPOINT='https://franklin-navigator-membership.onrender.com/api/telemetry/issue';
const MEMBERSHIP_HOST='franklin-navigator-membership.onrender.com';
const ASSISTANT_HOST='franklin-navigator-assistant.onrender.com';
const originalFetch=window.fetch?.bind(window);
if(!originalFetch||window.FranklinIssueMonitorR1308)return;

const cleanPath=value=>{try{return new URL(String(value||''),location.origin).pathname.slice(0,220)||'/'}catch{return'/'}};
const profileId=()=>{const m=location.pathname.match(/\/profiles\/(FR-[A-Za-z0-9._-]+)/);return m?m[1]:null};
const correlation=()=>crypto?.randomUUID?.()||('web_'+Date.now().toString(36)+Math.random().toString(36).slice(2,10));
const latencyBucket=ms=>ms>=15000?'15S_PLUS':ms>=8000?'8S_15S':ms>=4000?'4S_8S':ms>=2000?'2S_4S':'UNDER_2S';
function workflowFor(path){
  const p=String(path||'');
  if(/claim-profile|representation|profile-links/.test(p))return'PROFILE_CLAIM';
  if(/membership-enroll|membership-start|checkout/.test(p))return'CHECKOUT';
  if(/membership-status|entitlement|onboarding/.test(p))return'MEMBERSHIP_ENTITLEMENT';
  if(/billing/.test(p))return'BILLING_PORTAL';
  if(/member-profile|api\/member\/profile/.test(p))return'PROFILE_MANAGEMENT';
  if(/member-support|support/.test(p))return'SUPPORT';
  if(/accounts\/register|register/.test(p))return'ACCOUNT_REGISTER';
  if(/accounts\/login|login/.test(p))return'ACCOUNT_LOGIN';
  if(/assistant/.test(p))return'ASSISTANT';
  return'PUBLIC_SITE';
}
function safeEvent(code,extra={}){
  return{
    code:String(code||'CLIENT_FRICTION').toUpperCase().replace(/[^A-Z0-9_.:-]/g,'_').slice(0,96),
    workflow:String(extra.workflow||workflowFor(extra.path||location.pathname)).slice(0,80),
    path:cleanPath(extra.path||location.pathname),
    action:String(extra.action||'').replace(/[^A-Za-z0-9 _.-]/g,'').slice(0,120),
    httpStatus:Number(extra.httpStatus||0)||undefined,
    latencyBucket:String(extra.latencyBucket||'').slice(0,40),
    clientSignal:String(extra.clientSignal||'').replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,80),
    assetType:String(extra.assetType||'').replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,40),
    responseClass:String(extra.responseClass||'').replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,40),
    operation:String(extra.operation||'').replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,80),
    profileId:profileId(),
    correlationId:correlation()
  };
}
function report(code,extra={}){
  const body=JSON.stringify(safeEvent(code,extra));
  originalFetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body,credentials:'include',mode:'cors',keepalive:true,cache:'no-store',referrerPolicy:'no-referrer'}).catch(()=>{});
}
function observeUrl(input){
  try{
    const u=new URL(typeof input==='string'?input:input?.url||'',location.href);
    if(u.href===ENDPOINT||u.pathname==='/api/telemetry/issue')return null;
    if(u.origin===location.origin||u.hostname===MEMBERSHIP_HOST||u.hostname===ASSISTANT_HOST)return u;
  }catch{}
  return null;
}

window.fetch=async function(input,init){
  const u=observeUrl(input),start=performance.now();
  try{
    const response=await originalFetch(input,init);
    if(u){
      const ms=performance.now()-start;
      if(response.status>=500)report('HTTP_5XX',{path:u.pathname,httpStatus:response.status,latencyBucket:latencyBucket(ms),responseClass:'5XX',operation:init?.method||'GET'});
      else if(response.status>=400)report('HTTP_4XX',{path:u.pathname,httpStatus:response.status,latencyBucket:latencyBucket(ms),responseClass:'4XX',operation:init?.method||'GET'});
      else if(ms>=8000)report('SEVERE_LATENCY',{path:u.pathname,httpStatus:response.status,latencyBucket:latencyBucket(ms),responseClass:'SUCCESS',operation:init?.method||'GET'});
    }
    return response;
  }catch(error){
    if(u)report('FETCH_FAILED',{path:u.pathname,clientSignal:error?.name==='AbortError'?'ABORT_OR_TIMEOUT':'NETWORK_FAILURE',operation:init?.method||'GET'});
    throw error;
  }
};

window.addEventListener('error',event=>{
  const target=event.target;
  if(target&&target!==window&&target.tagName){
    const src=target.currentSrc||target.src||target.href||'';
    report('BROKEN_ASSET',{path:cleanPath(src),assetType:String(target.tagName).toUpperCase(),clientSignal:'RESOURCE_ERROR'});
    return;
  }
  report('CLIENT_JS_ERROR',{path:location.pathname,clientSignal:'WINDOW_ERROR'});
},true);
window.addEventListener('unhandledrejection',()=>report('CLIENT_UNHANDLED_REJECTION',{path:location.pathname,clientSignal:'UNHANDLED_REJECTION'}));

window.addEventListener('click',event=>{
  const a=event.target.closest?.('a[href],button[data-href],button[data-action]');
  if(!a)return;
  let href=a.getAttribute('href')||a.dataset.href||'';
  if(!href||href.startsWith('#')||a.target==='_blank'||a.hasAttribute('download'))return;
  let u;try{u=new URL(href,location.href)}catch{return}
  if(u.origin!==location.origin&&!['checkout.stripe.com','billing.stripe.com'].includes(u.hostname))return;
  const from=location.href,action=(a.textContent||a.getAttribute('aria-label')||'navigation').trim().slice(0,80);
  setTimeout(()=>{if(document.visibilityState==='visible'&&location.href===from)report('FAILED_NAVIGATION_ACTION',{path:location.pathname,action,clientSignal:'STILL_ON_SOURCE_AFTER_12S'})},12000);
},true);

window.addEventListener('load',()=>{
  try{
    const nav=performance.getEntriesByType('navigation')[0];
    const responseStatus=Number(nav?.responseStatus||0);
    if(responseStatus>=500)report('PAGE_5XX',{path:location.pathname,httpStatus:responseStatus,responseClass:'5XX'});
    else if(responseStatus===404)report('PAGE_404',{path:location.pathname,httpStatus:404,responseClass:'4XX'});
    if(Number(nav?.domContentLoadedEventEnd||0)>=8000)report('SEVERE_PAGE_LATENCY',{path:location.pathname,latencyBucket:latencyBucket(nav.domContentLoadedEventEnd),responseClass:'NAVIGATION'});
  }catch{}
  const params=new URLSearchParams(location.search);
  if(location.pathname.includes('/membership-enroll/')&&params.get('checkout')==='canceled')report('CHECKOUT_CANCELED',{path:location.pathname,workflow:'CHECKOUT',clientSignal:'STRIPE_RETURN_CANCELED'});
},{once:true});

window.FranklinIssueMonitorR1308=Object.freeze({version:VERSION,report});
})();