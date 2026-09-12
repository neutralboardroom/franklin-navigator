(()=>{'use strict';
const replacements=[
 ['Included future paid-member benefit','Community Member benefit'],
 ['See how the Community Member display is planned to work for eligible paid members once this feature launches.','See how the Community Member display works for eligible paid members when physical-display fulfillment is available.'],
 ['When paid membership activation and fulfillment are operational, each active paid subscribed location is planned to receive one physical Franklin Navigator Community Member display at no additional membership fee.','Eligible active paid member locations can receive one Franklin Navigator Community Member display at no additional membership fee when physical-display fulfillment is available.'],
 ['Minor accounts and school-data integrations are not part of this pilot.','Minor accounts and school-data integrations are not part of the current Learning Hub.'],
 ['No founding discount','No promotional discount'],
 ['FOUNDING30','current Community Membership offer']
];
function apply(){for(const meta of document.querySelectorAll('meta[name="description"],meta[property="og:description"]')){let v=meta.content||'';for(const[a,b]of replacements)v=v.replaceAll(a,b);meta.content=v}const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(!n.nodeValue||!n.nodeValue.trim())continue;let v=n.nodeValue;for(const[a,b]of replacements)v=v.replaceAll(a,b);n.nodeValue=v}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
