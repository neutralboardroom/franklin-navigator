(()=>{
  const root=document.querySelector('[data-preparation-studio]');
  if(!root)return;
  const form=root.querySelector('[data-preparation-form]');
  const verticalSelect=form.elements.vertical;
  const trackSelect=form.elements.track;
  const checklist=root.querySelector('[data-preparation-checklist]');
  const output=root.querySelector('[data-preparation-output]');
  const status=root.querySelector('[data-preparation-status]');
  const copyButton=root.querySelector('[data-preparation-copy]');
  const downloadButton=root.querySelector('[data-preparation-download]');
  const printButton=root.querySelector('[data-preparation-print]');
  let catalog=null;
  let packet=null;

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const renderTracks=()=>{
    const vertical=catalog?.verticals?.[verticalSelect.value];
    trackSelect.innerHTML='<option value="">Choose a preparation track</option>'+(vertical?.tracks||[]).map(item=>`<option value="${esc(item.id)}">${esc(item.title)}</option>`).join('');
    checklist.innerHTML='<p class="empty-state">Choose a track to see its preparation checklist.</p>';
    packet=null;output.innerHTML='<p class="empty-state">Your device-only packet will appear here.</p>';copyButton.disabled=downloadButton.disabled=printButton.disabled=true;
  };
  const renderChecklist=()=>{
    const vertical=catalog?.verticals?.[verticalSelect.value];
    const track=vertical?.tracks?.find(item=>item.id===trackSelect.value);
    if(!track){checklist.innerHTML='<p class="empty-state">Choose a track to see its preparation checklist.</p>';return}
    checklist.innerHTML=track.checklist.map((item,index)=>`<label class="check-row"><input type="checkbox" name="prepared" value="${index}"> ${esc(item)}</label>`).join('');
  };
  const buildPacket=()=>{
    const verticalId=verticalSelect.value;
    const vertical=catalog?.verticals?.[verticalId];
    const track=vertical?.tracks?.find(item=>item.id===trackSelect.value);
    if(!vertical||!track)return null;
    const selected=new Set([...form.querySelectorAll('input[name="prepared"]:checked')].map(item=>Number(item.value)));
    const urgency=form.elements.urgency.value;
    const firstAction=urgency==='today'?vertical.todayBoundary:urgency==='soon'?'Confirm changing requirements, deadlines, cost and availability at the responsible source before acting.':'Use this packet to organize broad questions before sharing any personal story or document.';
    return {schemaVersion:'franklin.preparation-packet.device-only.v1',candidate:catalog.candidate,communityId:'FRANKLIN_TN',state:'LOCAL_ONLY_NOT_SUBMITTED',verticalId,verticalLabel:vertical.label,trackId:track.id,title:track.title,urgency,stage:form.elements.stage.value,boundary:vertical.boundary,firstAction,steps:track.steps,checklist:track.checklist.map((item,index)=>({item,status:selected.has(index)?'READY_TO_REVIEW':'TO_PREPARE'})),questions:track.questions,sourceRoutes:track.sourceRoutes,directoryRoute:track.directoryRoute,donorPatterns:track.donorCapabilityIds,privacy:{fixedChoiceOnly:true,narrativeCollected:false,documentUpload:false,browserStorage:false,networkSubmission:false,externalAi:false},externalEffects:{send:false,submit:false,file:false,schedule:false,pay:false},professionalAdvice:false,authorityTransfer:false};
  };
  const renderPacket=()=>{
    const ready=packet.checklist.filter(item=>item.status==='READY_TO_REVIEW').length;
    output.innerHTML=`<div class="eyebrow">${esc(packet.verticalLabel)} · ${esc(packet.stage.replaceAll('-',' '))}</div><h2>${esc(packet.title)}</h2><p class="urgent-callout"><strong>Start here:</strong> ${esc(packet.firstAction)}</p><h3>Your preparation steps</h3><ol class="check-list">${packet.steps.map(item=>`<li>${esc(item)}</li>`).join('')}</ol><h3>Checklist snapshot</h3><p>${ready} of ${packet.checklist.length} broad preparation items marked ready to review.</p><ul class="check-list">${packet.checklist.map(item=>`<li><strong>${item.status==='READY_TO_REVIEW'?'Ready to review':'Still to prepare'}:</strong> ${esc(item.item)}</li>`).join('')}</ul><h3>Questions to carry forward</h3><ul class="check-list">${packet.questions.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><div class="actions">${packet.sourceRoutes.map(route=>`<a class="button" href="${esc(route)}">Open supporting route</a>`).join('')}<a class="button primary" href="${esc(packet.directoryRoute)}">Search local listings</a></div><p class="notice">${esc(packet.boundary)}</p>`;
    copyButton.disabled=downloadButton.disabled=printButton.disabled=false;
    output.focus();
  };
  const textPacket=()=>[packet.title,`Urgency: ${packet.urgency}`,`Stage: ${packet.stage}`,`Start here: ${packet.firstAction}`,'','Preparation steps:',...packet.steps.map((item,index)=>`${index+1}. ${item}`),'','Checklist:',...packet.checklist.map(item=>`- [${item.status==='READY_TO_REVIEW'?'x':' '}] ${item.item}`),'','Questions:',...packet.questions.map(item=>`- ${item}`),'','Boundary:',packet.boundary,'','LOCAL_ONLY_NOT_SUBMITTED'].join('\n');

  form.addEventListener('submit',event=>{event.preventDefault();packet=buildPacket();if(!packet)return;renderPacket()});
  form.addEventListener('reset',()=>setTimeout(()=>{renderTracks();status.textContent='Cleared. Nothing was saved or submitted.'},0));
  verticalSelect.addEventListener('change',renderTracks);
  trackSelect.addEventListener('change',renderChecklist);
  copyButton.addEventListener('click',async()=>{if(!packet)return;await navigator.clipboard.writeText(textPacket());status.textContent='Preparation packet copied. Nothing was submitted.'});
  downloadButton.addEventListener('click',()=>{if(!packet)return;const blob=new Blob([JSON.stringify(packet,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`franklin-${packet.verticalId}-${packet.trackId}-preparation.json`;link.click();URL.revokeObjectURL(url);status.textContent='Preparation packet downloaded to your device.'});
  printButton.addEventListener('click',()=>{if(packet)window.print()});
  root.querySelectorAll('[data-preparation-jump]').forEach(button=>button.addEventListener('click',()=>{verticalSelect.value=button.dataset.preparationJump;renderTracks();document.querySelector('#build-preparation-packet')?.scrollIntoView({block:'start'});verticalSelect.focus()}));

  fetch('/data/franklin-preparation-studio.json').then(response=>{if(!response.ok)throw new Error('PREPARATION_DATA_UNAVAILABLE');return response.json()}).then(data=>{catalog=data;verticalSelect.disabled=false;status.textContent='Ready. Choose one broad area and preparation track.'}).catch(()=>{status.textContent='The Preparation Studio could not load. The rest of Franklin Navigator remains available.';form.querySelector('button[type="submit"]').disabled=true});
})();
