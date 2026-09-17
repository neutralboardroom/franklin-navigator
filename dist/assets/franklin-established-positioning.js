(()=>{'use strict';
const replacements=[
 ['Included future paid-member benefit','Community Member benefit'],
 ['See how the Community Member display is planned to work for eligible paid members once this feature launches.','See how the Community Member display works for eligible paid members when physical-display fulfillment is available.'],
 ['When paid membership activation and fulfillment are operational, each active paid subscribed location is planned to receive one physical Franklin Navigator Community Member display at no additional membership fee.','Eligible active paid member locations can receive one Franklin Navigator Community Member display at no additional membership fee when physical-display fulfillment is available.'],
 ['Minor accounts and school-data integrations are not part of this pilot.','Minor accounts and school-data integrations are not part of the current Learning Hub.'],
 ['The first release deliberately excludes direct minor accounts, persistent minor profiles or chat history, school-system integrations and automated high-impact decisions.','The current Learning Hub does not include direct minor accounts, persistent minor profiles or chat history, school-system integrations or automated high-impact decisions.'],
 ['The new whole-situation planner','The whole-situation planner'],
 ['new whole-situation planner','whole-situation planner'],
 ['No founding discount','No promotional discount'],
 ['Franklin founding-member conversation','Franklin Community Membership conversation'],
 ['Franklin founding membership request','Franklin Community Membership request'],
 ['founding-member conversation','Community Membership conversation'],
 ['founding membership request','Community Membership request'],
 ['Founding30 estimate','Current membership estimate'],
 ['FOUNDING30','current Community Membership offer']
];
function loadScript(src,key){
  return new Promise((resolve,reject)=>{
    const old=document.querySelector(`script[data-${key}]`);
    if(old){if(old.dataset.loaded==='1')return resolve(old);old.addEventListener('load',()=>resolve(old),{once:true});old.addEventListener('error',reject,{once:true});return}
    const s=document.createElement('script');s.src=src;s.defer=true;s.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';s.addEventListener('load',()=>{s.dataset.loaded='1';resolve(s)},{once:true});s.addEventListener('error',reject,{once:true});document.head.append(s);
  });
}
function loadCss(href,key){if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';document.head.append(l)}
function apply(){
  for(const meta of document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]')){let v=meta.content||'';for(const[a,b]of replacements)v=v.replaceAll(a,b);meta.content=v}
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(!n.nodeValue||!n.nodeValue.trim())continue;let v=n.nodeValue;for(const[a,b]of replacements)v=v.replaceAll(a,b);n.nodeValue=v}
  for(const a of document.querySelectorAll('a[href^="mailto:"]')){let h=a.getAttribute('href')||'';for(const[x,y]of replacements)h=h.replaceAll(x,y);a.setAttribute('href',h)}
  loadCss('/assets/r1328-quality.css?v=frnav1328','franklin-quality-r1328-css');
  loadScript('/assets/r1326-business-journey.js?v=frnav1326','franklin-business-journey-r1326')
    .catch(()=>null)
    .then(()=>loadScript('/assets/r1327-refinement.js?v=frnav1327','franklin-refinement-r1327'))
    .catch(()=>null)
    .then(()=>loadScript('/assets/r1328-quality.js?v=frnav1328','franklin-quality-r1328'))
    .catch(()=>{});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
