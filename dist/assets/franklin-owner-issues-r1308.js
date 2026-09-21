(()=>{'use strict';
const API='https://franklin-navigator-membership.onrender.com';
let token='';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const dashboard=$('[data-owner-dashboard]'),errorBox=$('[data-owner-error]'),statusBox=$('[data-owner-connection]');
async function api(path,options={}){
  const r=await fetch(API+path,{...options,headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,...options.headers},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d?.error?.message||'Owner request failed');
  return d;
}
function showError(message=''){errorBox.hidden=!message;errorBox.textContent=message}
function renderIncident(x){
  const context=x.safe_context&&typeof x.safe_context==='object'?Object.entries(x.safe_context).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join(''):'';
  return `<article class="owner-incident" data-incident="${esc(x.incident_id)}">
    <h3>${esc(x.workflow)} · ${esc(x.safe_error_code)}</h3>
    <div class="owner-incident-meta"><span class="owner-pill is-${esc(String(x.severity||'').toLowerCase())}">${esc(x.severity)}</span><span class="owner-pill">${esc(x.status)}</span><span class="owner-pill">${esc(x.category)}</span><span class="owner-pill">×${esc(x.occurrence_count)}</span></div>
    <dl><dt>Incident fingerprint</dt><dd>${esc(x.fingerprint_sha256||'—')}</dd><dt>First seen</dt><dd>${esc(x.first_seen)}</dd><dt>Last seen</dt><dd>${esc(x.last_seen)}</dd><dt>Affected route</dt><dd>${esc(x.affected_path||'—')}</dd><dt>HTTP method</dt><dd>${esc(x.http_method||'—')}</dd><dt>Failure cause</dt><dd>${esc(x.failure_cause||'—')}</dd><dt>Component</dt><dd>${esc(x.component||'—')}</dd><dt>Release</dt><dd>${esc(x.release_identity||'—')}</dd><dt>Correlation</dt><dd>${esc(x.correlation_id||'—')}</dd><dt>Profile</dt><dd>${esc(x.profile_id||'—')}</dd><dt>Alert delivery</dt><dd>${esc(x.alert_delivery_state)}</dd><dt>Last notification</dt><dd>${esc(x.last_notification_kind||'—')}</dd><dt>Last alert</dt><dd>${esc(x.last_alert_at||'—')}</dd><dt>Reopened</dt><dd>${esc(x.reopened_at||'—')}</dd><dt>Resolved</dt><dd>${esc(x.resolved_at||'—')}</dd>${context}</dl>
    <div class="owner-incident-actions">${x.status==='OPEN'?'<button class="button" data-action="acknowledge">Acknowledge</button>':''}<button class="button" data-action="resolve">Resolve</button><button class="button" data-action="suppress">Suppress</button></div>
  </article>`;
}
async function refresh(){
  showError('');
  const status=$('[data-filter-status]').value,severity=$('[data-filter-severity]').value;
  const [summary,list]=await Promise.all([api('/admin/incidents/summary'),api('/admin/incidents?status='+encodeURIComponent(status)+'&severity='+encodeURIComponent(severity)+'&limit=100')]);
  $('[data-summary-critical]').textContent=summary.openCritical;
  $('[data-summary-high]').textContent=summary.openHigh;
  $('[data-summary-delivery]').textContent=summary.externalDelivery==='CONFIGURATION_AUTHORITY_REQUIRED'?'Config required':summary.externalDelivery;
  const p=summary.alertCooldownMinutes||{};$('[data-summary-policy]').textContent=`Critical ${p.CRITICAL||'—'}m · High ${p.HIGH||'—'}m · Normal ${p.NORMAL||'—'}m · Digest ${summary.alertDigestMinutes||'—'}m`;
  $('[data-owner-incidents]').innerHTML=list.incidents.length?list.incidents.map(renderIncident).join(''):'<div class="owner-empty">No incidents match this view.</div>';
}
$('[data-owner-connect]').addEventListener('click',async()=>{
  token=$('#owner-token').value.trim();if(!token){showError('Enter the existing Franklin admin token.');return}
  try{await refresh();dashboard.hidden=false;statusBox.textContent='Connected';$('#owner-token').value='';showError('')}catch(e){token='';dashboard.hidden=true;statusBox.textContent='Not connected';showError(e.message)}
});
$('[data-owner-refresh]').addEventListener('click',()=>refresh().catch(e=>showError(e.message)));
$('[data-filter-status]').addEventListener('change',()=>refresh().catch(e=>showError(e.message)));
$('[data-filter-severity]').addEventListener('change',()=>refresh().catch(e=>showError(e.message)));
$('[data-owner-incidents]').addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b)return;
  const card=b.closest('[data-incident]'),id=card?.dataset.incident,action=b.dataset.action;if(!id)return;
  let resolutionNote='';
  if(action==='resolve')resolutionNote=prompt('Optional safe resolution note. Do not include passwords, tokens, card data or unnecessary personal information.','')||'';
  try{await api('/admin/incidents/'+encodeURIComponent(id)+'/'+action,{method:'POST',body:JSON.stringify({resolutionNote})});await refresh()}catch(err){showError(err.message)}
});
})();