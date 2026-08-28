(() => {
  const root=document.querySelector('[data-local-growth-engine]');
  if(!root)return;
  const q=(selector,scope=root)=>scope.querySelector(selector);
  const qa=(selector,scope=root)=>[...scope.querySelectorAll(selector)];
  const form=q('[data-growth-onboarding]');
  const status=q('[data-growth-status]');
  const audit=q('[data-growth-audit]');
  const actions=q('[data-growth-actions]');
  const week=q('[data-growth-week]');
  const opportunities=q('[data-growth-opportunities]');
  const drafts=q('[data-growth-drafts]');
  const queue=q('[data-growth-review-queue]');
  const ledger=q('[data-growth-ledger]');
  const capacity=q('[data-growth-capacity]');
  const copy=q('[data-growth-copy]');
  const download=q('[data-growth-download]');
  const clear=q('[data-growth-clear]');
  let catalog=null;
  let workspace=null;

  const text=(element,value)=>{if(element)element.textContent=value};
  const make=(tag,className,content)=>{const node=document.createElement(tag);if(className)node.className=className;if(content!==undefined)node.textContent=content;return node};
  const checked=id=>Boolean(q(`[name="${id}"]`)?.checked);
  const capacityLimit={light:1,steady:3,active:5};
  const permissionLabel={MEMBER_REVIEW:'Review before using',DRAFT_ONLY:'Draft for your review',DEVICE_ONLY:'Keep on this device'};
  const statusLabel={NOT_ADDED:'Not saved for review',WAITING_FOR_REVIEW:'Waiting for your review',APPROVED_ON_DEVICE_NOT_PUBLISHED:'Reviewed — not published',RETURNED_TO_DRAFT:'Back in draft',COMPLETE_ON_DEVICE:'Completed on this device',COMPLETE_DEVICE_ONLY:'Completed on this device'};
  const safeDownload=(name,payload)=>{const blob=new Blob([`${JSON.stringify(payload,null,2)}\n`],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),0)};
  const copyText=async value=>{try{await navigator.clipboard.writeText(value);return true}catch{return false}};

  const auditProfile=profile=>{
    const checks=[
      ['Public identity','Name and category are accurate',profile.identity],
      ['Contact path','Website or contact route is clear',profile.contact],
      ['Service clarity','Services, audience and area are clear',profile.services],
      ['Next step','Call to action is specific',profile.cta],
      ['Changing details','Time-sensitive details were checked',profile.currentness]
    ];
    const passed=checks.filter(item=>item[2]).length;
    return {score:passed*20,checks:checks.map(([label,detail,ready])=>({label,detail,status:ready?'Ready':'Needs review'}))};
  };

  const prioritize=(goal,chosenCapacity,profileAudit)=>catalog.universalActions.map(action=>{
    let score=action.goals.includes(goal)?5:0;
    if(action.id==='correct-profile'&&profileAudit.score<100)score+=8;
    if(action.id==='clarify-cta'&&profileAudit.checks.find(item=>item.label==='Next step')?.status!=='Ready')score+=6;
    if(action.effort===chosenCapacity)score+=2;
    return {...action,priorityScore:score};
  }).sort((a,b)=>b.priorityScore-a.priorityScore||a.id.localeCompare(b.id)).slice(0,capacityLimit[chosenCapacity]||3);

  const render=()=>{
    if(!workspace)return;
    audit.replaceChildren();
    const score=make('div','growth-score');score.setAttribute('aria-label',`Listing checklist score ${workspace.audit.score} out of 100`);score.append(make('strong','',`${workspace.audit.score}/100`),make('span','',' listing checklist'));
    audit.append(score);
    const auditList=make('ul','check-list');workspace.audit.checks.forEach(item=>{const row=make('li','');row.append(make('strong','',`${item.label}: ${item.status}. `),document.createTextNode(item.detail));auditList.append(row)});audit.append(auditList);

    actions.replaceChildren();workspace.actions.forEach((action,index)=>{const card=make('article','card growth-action');card.append(make('div','eyebrow',index===0?'Start here':`Priority ${index+1}`),make('h3','',action.title),make('p','',action.why),make('span','badge',permissionLabel[action.permission]||action.permission));const link=make('a','','Open this tool');link.href=action.route;card.append(link);actions.append(card)});

    week.replaceChildren();workspace.actions.forEach((action,index)=>{const row=make('li','growth-week-item');row.append(make('strong','',index===0?'Start here: ':`Then: `),document.createTextNode(action.title));week.append(row)});

    opportunities.replaceChildren();catalog.opportunityFeed.forEach(item=>{const card=make('article','card');card.append(make('h3','',item.title),make('p','',item.why));const link=make('a','','Review and verify');link.href=item.route;card.append(link);opportunities.append(card)});

    drafts.replaceChildren();
    const verticalPrompt=catalog.verticalPrompts[workspace.vertical];
    const draftItems=[
      {type:'Call-to-action draft',body:`Make the next step clear for ${workspace.audience}: explain what to prepare, how to contact the business, and what will happen next. ${verticalPrompt}`},
      {type:'Educational content brief',body:`Create a short Franklin-focused guide that answers one common question before contact. ${verticalPrompt} Verify every changing fact and include appropriate professional boundaries.`},
      {type:'Community participation brief',body:'Choose one useful Franklin contribution—education, volunteering, a verified event idea or a community project. Prepare the concept only; do not publish, invite, spend or contact anyone automatically.'}
    ];
    workspace.draftItems=draftItems.map((item,index)=>({...item,id:`draft-${index+1}`,status:'NOT_ADDED'}));
    workspace.draftItems.forEach(item=>{const card=make('article','card growth-draft');card.dataset.draftId=item.id;card.append(make('div','eyebrow',item.type),make('p','',item.body));const button=make('button','button small','Save for my review');button.type='button';button.addEventListener('click',()=>{item.status='WAITING_FOR_REVIEW';renderQueue();button.textContent='Saved for review';button.disabled=true});card.append(button);drafts.append(card)});
    renderQueue();renderLedger();
    text(capacity,`${workspace.actions.length} growth actions prepared · ${workspace.draftItems.length} drafts available · free to use · no per-action charges`);
  };

  const renderQueue=()=>{
    queue.replaceChildren();
    const items=workspace?.draftItems?.filter(item=>item.status!=='NOT_ADDED')||[];
    if(!items.length){queue.append(make('p','empty-state','No drafts are waiting for review.'));return}
    items.forEach(item=>{const card=make('article','review-row');card.append(make('strong','',item.type),make('span','badge',statusLabel[item.status]||'Review status updated'));const controls=make('div','plan-actions');for(const [label,next] of [['Mark reviewed','APPROVED_ON_DEVICE_NOT_PUBLISHED'],['Return to draft','RETURNED_TO_DRAFT']]){const button=make('button','button small',label);button.type='button';button.addEventListener('click',()=>{item.status=next;if(next.startsWith('APPROVED'))workspace.ledger.push({label:`Reviewed ${item.type}`,status:'COMPLETE_ON_DEVICE'});renderQueue();renderLedger()});controls.append(button)}card.append(controls);queue.append(card)});
  };

  const renderLedger=()=>{ledger.replaceChildren();(workspace?.ledger||[]).forEach(item=>{const row=make('li','');row.append(make('strong','','Done: '),document.createTextNode(item.label));ledger.append(row)})};
  const packetText=()=>workspace?[
    'FRANKLIN BUSINESS GROWTH PLAN','Prepared by Franklin Navigator','',
    `Business type: ${workspace.verticalLabel}`,`Goal: ${workspace.goalLabel}`,`Time available: ${workspace.capacityLabel}`,`Customers you want to reach: ${workspace.audience}`,`Main roadblock: ${workspace.constraint||'None selected'}`,'',
    `Listing checklist: ${workspace.audit.score}/100`,'Top actions:',...workspace.actions.map((item,index)=>`${index+1}. ${item.title} — ${permissionLabel[item.permission]||item.permission}`),'',
    'Safety: Drafts require review. Nothing was submitted, saved, sent, published, purchased or billed. No result is guaranteed.'
  ].join('\n'):'';

  form?.addEventListener('submit',event=>{
    event.preventDefault();if(!catalog){text(status,'The Business Growth Planner could not load. Please refresh and try again.');return}
    const data=new FormData(form);const vertical=String(data.get('vertical')||'');const goal=String(data.get('goal')||'');const chosenCapacity=String(data.get('capacity')||'steady');
    if(!catalog.verticalPrompts[vertical]||!catalog.goals.some(item=>item.id===goal)){text(status,'Choose a business type and growth goal.');status.focus();return}
    const profileAudit=auditProfile({identity:checked('identity'),contact:checked('contact'),services:checked('services'),cta:checked('cta'),currentness:checked('currentness')});
    const actionsForWeek=prioritize(goal,chosenCapacity,profileAudit);
    const verticalLabel=q('[name="vertical"] option:checked')?.textContent||vertical;
    const goalLabel=q('[name="goal"] option:checked')?.textContent||goal;
    const capacityLabel=q('[name="capacity"] option:checked')?.textContent||chosenCapacity;
    workspace={schemaVersion:'franklin.local-growth-workspace.device-preview.v1',state:'DEVICE_ONLY_NOT_SAVED_NOT_SUBMITTED',communityId:'FRANKLIN_TN',vertical,verticalLabel,goal,goalLabel,capacity:chosenCapacity,capacityLabel,tier:String(data.get('tier')||'INDIVIDUAL'),audience:String(data.get('audience')||'local customers').trim().slice(0,120)||'local customers',constraint:String(data.get('constraint')||'').trim().slice(0,160),audit:profileAudit,actions:actionsForWeek,ledger:[{label:'Listing checklist reviewed',status:'COMPLETE_DEVICE_ONLY'},{label:`${actionsForWeek.length} priority action${actionsForWeek.length===1?'':'s'} selected`,status:'COMPLETE_DEVICE_ONLY'}],externalEffects:{submit:false,send:false,publish:false,spend:false,charge:false}};
    render();text(status,'Your Franklin business plan is ready. Review every draft before using it. Nothing was saved or submitted.');copy.disabled=false;download.disabled=false;status.focus();
  });

  form?.addEventListener('reset',()=>setTimeout(()=>{workspace=null;for(const node of [audit,actions,week,opportunities,drafts,queue,ledger])node?.replaceChildren();text(status,'Choose broad business facts and goals to prepare a private plan that stays on this device.');text(capacity,'Free to use · no per-action charges');copy.disabled=true;download.disabled=true},0));
  clear?.addEventListener('click',()=>form?.reset());
  copy?.addEventListener('click',async()=>{const ok=await copyText(packetText());copy.textContent=ok?'Copied':'Select and copy the plan';if(ok)setTimeout(()=>copy.textContent='Copy plan',1800)});
  download?.addEventListener('click',()=>workspace&&safeDownload('franklin-local-growth-plan.json',{...workspace,draftItems:workspace.draftItems,notice:'Prepared on this device. Not submitted, saved, published, purchased or charged.'}));

  fetch('/data/franklin-local-growth-engine.json',{credentials:'same-origin'}).then(response=>{if(!response.ok)throw new Error('contract unavailable');return response.json()}).then(payload=>{
    if(payload.schemaVersion!=='smarter.franklin.local-growth-engine.v1'||payload.runtimeTruth.checkoutActive!==false||payload.runtimeTruth.persistentTenantStateActive!==false||payload.authorityTransfer!==false)throw new Error('contract invalid');
    catalog=payload;text(status,'Choose broad business facts and goals to prepare a private plan that stays on this device.');
  }).catch(()=>text(status,'The Business Growth Planner could not load. Please refresh and try again.'));
})();
