(()=>{
  const root=document.querySelector('[data-home-rights-center]');
  if(!root)return;
  const form=root.querySelector('[data-home-rights-form]');
  const trackSelect=form.elements.track;
  const roleBox=root.querySelector('[data-home-document-roles]');
  const output=root.querySelector('[data-home-rights-output]');
  const status=root.querySelector('[data-home-rights-status]');
  const copy=root.querySelector('[data-home-rights-copy]');
  const download=root.querySelector('[data-home-rights-download]');
  const print=root.querySelector('[data-home-rights-print]');
  let catalog=null;
  let packet=null;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const renderInputs=()=>{
    trackSelect.innerHTML='<option value="">Choose a home or property track</option>'+catalog.tracks.map(item=>`<option value="${esc(item.id)}">${esc(item.title)}</option>`).join('');
    roleBox.innerHTML=catalog.documentRoles.map(item=>`<label class="check-row"><input type="checkbox" name="documentRole" value="${esc(item.id)}"> ${esc(item.label)}</label>`).join('');
  };
  const build=()=>{
    const track=catalog?.tracks.find(item=>item.id===trackSelect.value);
    if(!track)return null;
    const roles=[...form.querySelectorAll('[name="documentRole"]:checked')].map(item=>item.value);
    const fields=[...form.querySelectorAll('[name="broadField"]:checked')].map(item=>item.value);
    return {schemaVersion:'franklin.home-rights-packet.device-only.v1',candidate:catalog.candidate,state:'LOCAL_ONLY_NOT_SUBMITTED',communityId:'FRANKLIN_TN',trackId:track.id,title:track.title,urgency:form.elements.urgency.value,stage:form.elements.stage.value,firstAction:form.elements.urgency.value==='today'?catalog.todayBoundary:'Confirm every changing date, requirement, cost and availability on the official or first-party website before acting.',steps:track.steps,questions:track.questions,sourceRoutes:track.sourceRoutes,directoryRoute:track.directoryRoute,selectedDocumentRoles:roles,comparison:roles.map(role=>({documentRole:role,fields:fields.map(field=>({field,status:'VERIFY_FROM_ORIGINAL_PRIVATELY'}))})),boundary:catalog.boundary,privacy:{fixedChoiceOnly:true,narrativeCollected:false,documentTextCollected:false,fileUpload:false,browserStorage:false,networkSubmission:false,externalAi:false},externalEffects:{send:false,submit:false,file:false,schedule:false,pay:false,interpret:false},professionalAdvice:false,authorityTransfer:false};
  };
  const render=()=>{
    output.innerHTML=`<div class="eyebrow">Home &amp; property · private preparation</div><h2>${esc(packet.title)}</h2><p class="urgent-callout"><strong>Start here:</strong> ${esc(packet.firstAction)}</p><h3>Preparation steps</h3><ol class="check-list">${packet.steps.map(item=>`<li>${esc(item)}</li>`).join('')}</ol><h3>Document-role comparison</h3>${packet.comparison.length?`<div class="comparison-table" role="table" aria-label="Document fields to verify">${packet.comparison.map(item=>`<article class="card" role="row"><h4>${esc(item.documentRole.replaceAll('-',' '))}</h4><ul class="check-list">${item.fields.map(field=>`<li>${esc(field.field.replaceAll('-',' '))}: verify from original privately</li>`).join('')}</ul></article>`).join('')}</div>`:'<p class="empty-state">No document roles selected. You can still use the preparation steps and questions.</p>'}<h3>Questions to carry forward</h3><ul class="check-list">${packet.questions.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><div class="actions">${packet.sourceRoutes.map(route=>`<a class="button" href="${esc(route)}">Open supporting route</a>`).join('')}<a class="button primary" href="${esc(packet.directoryRoute)}">Find qualified local options</a></div><p class="notice">${esc(packet.boundary)} No document was uploaded, read or interpreted.</p>`;
    copy.disabled=download.disabled=print.disabled=false;
    output.focus();
  };
  form.addEventListener('submit',event=>{event.preventDefault();packet=build();if(packet)render()});
  form.addEventListener('reset',()=>setTimeout(()=>{packet=null;output.innerHTML='<p class="empty-state">Your private preparation packet will appear here.</p>';copy.disabled=download.disabled=print.disabled=true;status.textContent='Cleared. Nothing was saved or submitted.'},0));
  copy.addEventListener('click',async()=>{if(!packet)return;await navigator.clipboard.writeText(JSON.stringify(packet,null,2));status.textContent='Packet copied. Nothing was submitted.'});
  download.addEventListener('click',()=>{if(!packet)return;const blob=new Blob([JSON.stringify(packet,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`franklin-${packet.trackId}-home-rights-packet.json`;link.click();URL.revokeObjectURL(url);status.textContent='Packet downloaded to your device.'});
  print.addEventListener('click',()=>packet&&window.print());
  root.querySelectorAll('[data-home-track-jump]').forEach(button=>button.addEventListener('click',()=>{trackSelect.value=button.dataset.homeTrackJump;document.querySelector('#build-home-rights-packet')?.scrollIntoView({block:'start'});trackSelect.focus()}));
  fetch('/data/franklin-home-rights-center.json').then(response=>{if(!response.ok)throw new Error('HOME_RIGHTS_DATA_UNAVAILABLE');return response.json()}).then(data=>{catalog=data;renderInputs();form.querySelector('button[type="submit"]').disabled=false;status.textContent='Ready. Select broad roles and fields only—never document text.'}).catch(()=>{status.textContent='The Home Rights Center could not load. Official and professional routes remain available.'});
})();
