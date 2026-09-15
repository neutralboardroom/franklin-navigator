(()=>{'use strict';
const API='https://franklin-navigator-membership.onrender.com';
let token='';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function api(path){const r=await fetch(API+path,{headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||'Readiness check failed');return d}
$('[data-readiness-check]').addEventListener('click',async()=>{
 token=$('#readiness-token').value.trim();const err=$('[data-r-error]');err.hidden=true;if(!token){err.textContent='Enter the existing Franklin admin token.';err.hidden=false;return}
 try{
   const d=await api('/admin/readiness'),m=d.monitoring||{};$('#readiness-token').value='';
   $('[data-r-ledger]').textContent=m.ok?'PASS':'CHECK';
   $('[data-r-critical]').textContent=m.openCritical??'—';$('[data-r-high]').textContent=m.openHigh??'—';
   const rows={
     'Franklin release':d.release,'Community':d.community,'Commerce enabled':d.commerceEnabled,
     'Stripe checkout configured':d.stripeCheckoutSessionConfigured,'Stripe webhook configured':d.stripeWebhookConfigured,
     'Billing portal configured':d.portalSessionConfigured,'Profile scope count':d.profileScopeCount,
     'Member fulfillment':d.memberFulfillmentVersion,'Reviewer console':d.reviewerConsoleVersion,
     'Incident ledger':m.ledger,'Owner visibility':m.ownerVisibility,'External alert delivery':m.externalDelivery
   };
   $('[data-r-config]').innerHTML=Object.entries(rows).map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>').join('');
   $('[data-r-note]').textContent=(m.openCritical||m.openHigh)?'Open critical/high incidents require review before outreach readiness can be declared.':'No open critical/high incidents are currently reported by the live monitoring summary. Final outreach readiness still depends on the full evidence receipt and SRE/Revenue Engine verification.';
   $('[data-readiness-output]').hidden=false;
 }catch(e){token='';err.textContent=e.message;err.hidden=false}
});
})();