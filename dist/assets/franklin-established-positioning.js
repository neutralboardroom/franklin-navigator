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
function apply(){
  for(const meta of document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]')){let v=meta.content||'';for(const[a,b]of replacements)v=v.replaceAll(a,b);meta.content=v}
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(!n.nodeValue||!n.nodeValue.trim())continue;let v=n.nodeValue;for(const[a,b]of replacements)v=v.replaceAll(a,b);n.nodeValue=v}
  for(const a of document.querySelectorAll('a[href^="mailto:"]')){let h=a.getAttribute('href')||'';for(const[x,y]of replacements)h=h.replaceAll(x,y);a.setAttribute('href',h)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
