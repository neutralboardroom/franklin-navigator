(()=>{
  const root=document.querySelector('[data-member-growth-workspace]');
  if(!root)return;
  const form=root.querySelector('[data-member-growth-form]');
  const output=root.querySelector('[data-member-growth-output]');
  const status=root.querySelector('[data-member-growth-status]');
  const copy=root.querySelector('[data-member-growth-copy]');
  const download=root.querySelector('[data-member-growth-download]');
  const print=root.querySelector('[data-member-growth-print]');
  let contract=null;
  let workspace=null;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const actionCatalog={
    correct:{title:'Verify the source-backed public profile',why:'Accurate identity, category, service area and contact facts support every later action.',route:'/claim-profile/',permission:'MEMBER_REVIEW',goals:['discovery','trust','conversion']},
    cta:{title:'Clarify the next customer step',why:'A specific, accurate call to action reduces uncertainty without promising an outcome.',route:'/navigator-growth-desk/',permission:'DRAFT_ONLY',goals:['conversion','trust']},
    useful:{title:'Prepare one useful local education draft',why:'Bounded, accurate guidance can demonstrate value without collecting private customer information.',route:'/navigator-growth-desk/',permission:'DRAFT_ONLY',goals:['trust','discovery','retention']},
    local:{title:'Review one qualified Franklin opportunity route',why:'Verify dates and participation terms at the responsible source before acting.',route:'/live-local/',permission:'MEMBER_REVIEW',goals:['community','discovery','retention']},
    measure:{title:'Record one first-value signal',why:'Separate completed improvements from leads, customers and revenue.',route:'/member-value/',permission:'DEVICE_ONLY',goals:['discovery','trust','conversion','retention','community']}
  };
  const build=()=>{
    if(!contract)return null;
    const data=new FormData(form);
    const capacity=data.get('capacity');
    const limit=capacity==='light'?1:capacity==='active'?5:3;
    const audit=['identity','contact','services','cta','currentness'].map(id=>({id,ready:data.get(id)==='on'}));
    const passed=audit.filter(item=>item.ready).length;
    const goal=data.get('goal');
    const scored=Object.entries(actionCatalog).map(([id,item])=>({id,...item,score:(item.goals.includes(goal)?5:0)+(id==='correct'&&passed<5?8:0)+(id==='cta'&&!audit.find(row=>row.id==='cta').ready?6:0)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
    const selected=scored.slice(0,limit).map((item,index)=>({...item,cadence:index===0?'Next 7 days':index<3?'Next 30 days':'Next 90 days',state:item.permission==='DEVICE_ONLY'?'Ready on device':'Waiting for your review'}));
    return {schemaVersion:'franklin.member-growth-workspace.device-preview.v1',candidate:contract.candidate,state:'DEVICE_ONLY_PREVIEW_NOT_ACCOUNT_NOT_ENTITLEMENT',communityId:'FRANKLIN_TN',vertical:data.get('vertical'),goal:data.get('goal'),capacity,tier:data.get('tier'),constraint:data.get('constraint'),profileAudit:{score:passed*20,checks:audit},nextBestActions:selected,opportunityFeed:[{title:'Review qualified Live Local discovery routes',route:'/live-local/',dynamicClaim:false}],permissionQueue:selected.map(item=>({title:item.title,permission:item.permission,state:item.state,externalExecution:false})),memberValueLedger:[{signal:'public profile reviewed',state:'COMPLETE_DEVICE_ONLY'},{signal:'next-best actions prioritized',state:'COMPLETE_DEVICE_ONLY'},{signal:'weekly plan prepared',state:'COMPLETE_DEVICE_ONLY'}],fairUse:{incrementalLaunchPriceUsd:0,automaticCharge:false},collaboration:{tier:data.get('tier'),state:'PREVIEW_ONLY_NO_SHARED_STATE'},externalEffects:{send:false,publish:false,spend:false,charge:false,submit:false,createAccount:false,claimProfile:false},authorityTransfer:false};
  };
  const render=()=>{
    const groups=['Next 7 days','Next 30 days','Next 90 days'];
    output.innerHTML=`<div class="eyebrow">Device-only member workspace preview</div><h2>${esc(workspace.vertical)} growth plan</h2><div class="growth-score"><strong>${workspace.profileAudit.score}/100</strong><span>private profile-readiness snapshot</span></div><p class="fine-print">An unchecked item means “review it”; it is not a public score or negative claim.</p>${groups.map(group=>`<section class="member-cadence"><h3>${group}</h3><div class="grid">${workspace.nextBestActions.filter(item=>item.cadence===group).map(item=>`<article class="card"><h4>${esc(item.title)}</h4><p>${esc(item.why)}</p><p><strong>Permission:</strong> ${esc(item.state)}</p><a class="button" href="${esc(item.route)}">Open supporting route</a></article>`).join('')||'<p class="empty-state">No additional action assigned for this cadence.</p>'}</div></section>`).join('')}<section><h3>Member-value ledger</h3><ul class="check-list">${workspace.memberValueLedger.map(item=>`<li>${esc(item.signal)} · ${esc(item.state.replaceAll('_',' ').toLowerCase())}</li>`).join('')}</ul></section><p class="notice"><strong>No account or entitlement was created.</strong> This preview did not save, submit, send, publish, spend or charge. Team and location controls are demonstrated only; shared state is not active.</p>`;
    copy.disabled=download.disabled=print.disabled=false;
    output.focus();
  };
  form.addEventListener('submit',event=>{event.preventDefault();workspace=build();if(workspace)render()});
  form.addEventListener('reset',()=>setTimeout(()=>{workspace=null;output.innerHTML='<p class="empty-state">Your private workspace preview will appear here.</p>';copy.disabled=download.disabled=print.disabled=true;status.textContent='Cleared. Nothing was saved or submitted.'},0));
  copy.addEventListener('click',async()=>{if(!workspace)return;await navigator.clipboard.writeText(JSON.stringify(workspace,null,2));status.textContent='Workspace preview copied. Nothing was submitted.'});
  download.addEventListener('click',()=>{if(!workspace)return;const blob=new Blob([JSON.stringify(workspace,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='franklin-member-growth-workspace-preview.json';link.click();URL.revokeObjectURL(url);status.textContent='Workspace preview downloaded to your device.'});
  print.addEventListener('click',()=>workspace&&window.print());
  fetch('/data/franklin-member-growth-workspace.json').then(response=>{if(!response.ok)throw new Error('MEMBER_GROWTH_DATA_UNAVAILABLE');return response.json()}).then(data=>{contract=data;form.querySelector('button[type="submit"]').disabled=false;status.textContent='Ready. Use broad business facts only.'}).catch(()=>{status.textContent='The workspace preview could not load. Free profiles and the directory remain available.'});
})();
