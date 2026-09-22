/* R1338 — profile-aware free correction/removal continuity */
'use strict';
(()=> {
  const API='https://franklin-navigator-membership.onrender.com';
  const form=document.querySelector('[data-profile-control-form]'),status=document.querySelector('[data-profile-control-status]'),context=document.querySelector('[data-profile-control-context]'),returnBoxTop=document.querySelector('[data-profile-control-return]'),submitButton=document.querySelector('[data-profile-control-submit]');
  if(!form||!status)return;
  const params=new URLSearchParams(location.search),es=document.documentElement.lang==='es';
  const profile=String(params.get('profile')||'').trim(),validProfile=/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(profile);
  const profilePage=validProfile?location.origin+'/profiles/'+profile+'/':'';
  const claimCta=document.querySelector('[data-r1344-claim-cta]');if(claimCta&&validProfile)claimCta.href='/profile-access/?profile='+encodeURIComponent(profile);
  const set=(name,value)=>{if(form.elements[name]&&value&&!form.elements[name].value)form.elements[name].value=value};
  set('profileId',validProfile?profile:'');set('listing',params.get('listing')||'');if(validProfile){form.elements.url.value=profilePage;form.elements.url.readOnly=true;}else set('url',params.get('url')||'');
  if(params.get('action')==='PUBLIC_REMOVAL')form.elements.requestType.value='PUBLIC_REMOVAL';
  const returnBox=document.createElement('div');returnBox.className='r37-member-actions';status.after(returnBox);
  const showContext=name=>{
    if(!context||!validProfile)return;
    context.hidden=false;context.replaceChildren();
    const strong=document.createElement('strong');strong.textContent=name|| (es?'Perfil seleccionado':'Selected profile');
    const span=document.createElement('span');span.textContent=es?' Esta solicitud permanecerá vinculada a esta página de perfil.':' This request will stay linked to this profile page.';
    context.append(strong,span);if(returnBoxTop){returnBoxTop.hidden=false;returnBoxTop.replaceChildren();const back=document.createElement('a');back.className='button';back.href='/profiles/'+encodeURIComponent(profile)+'/';back.textContent=es?'Volver a este perfil':'Back to this profile';returnBoxTop.append(back);}
  };
  const prefill=async()=>{
    if(!validProfile)return;
    let name=String(form.elements.listing?.value||'').trim();
    if(!name){try{const r=await fetch('/profiles/'+encodeURIComponent(profile)+'/',{credentials:'same-origin'});if(r.ok){const doc=new DOMParser().parseFromString(await r.text(),'text/html');name=doc.querySelector('.r22-profile-hero h1,h1')?.textContent?.trim()||'';set('listing',name)}}catch{}}
    if(!name&&profile==='FR-ORG-b00c0ace7943973c'){name='Franklin Navigator';set('listing',name)}
    if(validProfile&&form.elements.listing.value)form.elements.listing.readOnly=true;showContext(name);
  };
  const sync=()=>{
    const removal=form.elements.requestType.value==='PUBLIC_REMOVAL';
    form.querySelectorAll('[data-removal-only]').forEach(n=>{n.hidden=!removal;n.querySelectorAll('input,textarea,select').forEach(x=>x.required=removal&&!['evidenceUrl'].includes(x.name))});
    form.querySelectorAll('[data-correction-only]').forEach(n=>{n.hidden=removal;n.querySelectorAll('input,textarea,select').forEach(x=>x.required=!removal)});
    if(submitButton)submitButton.textContent=removal?(es?'Enviar solicitud gratuita de retiro':'Submit free removal request'):(es?'Enviar corrección gratuita':'Submit free correction request');
    status.textContent=removal?(es?'La solicitud de retiro es gratuita. Franklin Navigator puede confirmar su autorización antes de retirar el perfil de la vista pública.':'Removal is free. Franklin Navigator may confirm your authority before removing the profile from public view.'):(es?'La corrección factual es gratuita y será revisada antes de actualizar la información pública.':'Factual correction is free and will be reviewed before public information is updated.');
  };
  form.elements.requestType.addEventListener('change',sync);
  document.querySelector('[data-switch-removal]')?.addEventListener('click',()=>{form.elements.requestType.value='PUBLIC_REMOVAL';sync();form.scrollIntoView({behavior:'smooth',block:'start'});form.elements.authorityBasis?.focus()});
  document.querySelector('[data-switch-correction]')?.addEventListener('click',()=>{form.elements.requestType.value='CORRECTION';sync();form.scrollIntoView({behavior:'smooth',block:'start'});form.elements.currentInfo?.focus()});
  sync();prefill();
  fetch(API+'/api/accounts/me',{credentials:'include',cache:'no-store'}).then(r=>r.ok?r.json():null).then(me=>{if(!me?.account)return;set('requesterName',me.account.display_name||'');set('requesterEmail',me.account.email||'')}).catch(()=>{});
  const clean=(v,n)=>String(v||'').trim().slice(0,n);
  const reviewBox=document.createElement('section');reviewBox.className='card r1359-request-review';reviewBox.hidden=true;reviewBox.tabIndex=-1;form.after(reviewBox);
  let submitting=false;
  const hideReview=()=>{reviewBox.hidden=true;reviewBox.replaceChildren()};
  const reviewLine=(label,value)=>{
    const row=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');
    strong.textContent=label;span.textContent=value||'—';row.append(strong,span);return row;
  };
  const buildMessage=(fd,removal)=>removal
    ? `Profile public-removal request. Listing: ${clean(fd.get('listing'),180)}. Profile: ${clean(fd.get('profileId'),120)}. URL: ${clean(fd.get('url'),1200)}. Requester: ${clean(fd.get('requesterName'),120)} <${clean(fd.get('requesterEmail'),200)}>. Authority: ${clean(fd.get('authorityBasis'),300)}. Removal category: ${clean(fd.get('removalCategory'),120)}. Reason: ${clean(fd.get('removalReason'),1800)}. Public evidence: ${clean(fd.get('evidenceUrl'),1200)||'Not provided'}.`
    : `Profile factual-correction request. Listing: ${clean(fd.get('listing'),180)}. Profile: ${clean(fd.get('profileId'),120)}. URL: ${clean(fd.get('url'),1200)}. Requester: ${clean(fd.get('requesterName'),120)} <${clean(fd.get('requesterEmail'),200)}>. Correction field: ${clean(fd.get('correctionField'),120)}. Current information: ${clean(fd.get('currentInfo'),1400)}. Requested correction: ${clean(fd.get('correctInfo'),1400)}. Public evidence: ${clean(fd.get('evidenceUrl'),1200)||'Not provided'}.`;
  const submitRequest=async(fd,removal)=>{
    if(submitting)return;submitting=true;hideReview();if(submitButton)submitButton.disabled=true;
    status.textContent=es?'Enviando su solicitud…':'Submitting your request…';try{status.focus({preventScroll:true})}catch{status.focus()}
    try{
      const r=await fetch(API+'/api/support/request',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:validProfile?profile:'',category:removal?'PROFILE_PUBLIC_REMOVAL':'PROFILE_FACTUAL_CORRECTION',message:buildMessage(fd,removal),preferredLanguage:es?'SPANISH':'ENGLISH'})});
      let data={};try{data=await r.json()}catch{}
      if(!r.ok)throw new Error(data?.error?.message||'REQUEST_FAILED');
      status.textContent=(es?'Solicitud recibida. No se inició ningún pago ni membresía. Guarde esta referencia: ':'Request received. No payment or membership was started. Keep this reference: ')+(data.requestId||'—');
      returnBox.replaceChildren();
      if(validProfile){
        if(!removal){const claim=document.createElement('a');claim.className='button r1343-claim-primary';claim.href='/profile-access/?profile='+encodeURIComponent(profile);claim.textContent=es?'Reclamar o administrar este perfil':'Claim or manage this profile';returnBox.append(claim)}
        const a=document.createElement('a');a.className='button';a.href='/profiles/'+encodeURIComponent(profile)+'/';a.textContent=es?'Volver al perfil':'Return to profile';returnBox.append(a)
      }
      const help=document.createElement('a');help.className='button';help.href='mailto:community@franklinnavigator.com';help.textContent=es?'Contactar soporte':'Contact support';returnBox.append(help);
    }catch{
      status.textContent=es?'No pudimos enviar la solicitud. Sus datos siguen en el formulario. Inténtelo de nuevo o escriba a community@franklinnavigator.com.':'We could not submit the request. Your entries are still in the form. Try again or email community@franklinnavigator.com.';
      if(submitButton)submitButton.disabled=false;
    }finally{submitting=false}
  };
  const showReview=(fd,removal)=>{
    hideReview();
    const eyebrow=document.createElement('div');eyebrow.className='eyebrow';eyebrow.textContent=removal?(es?'Antes de enviar':'Before you submit'):(es?'Revise su corrección':'Review your correction');
    const h=document.createElement('h2');h.textContent=removal?(es?'Confirme la solicitud de retiro':'Confirm this removal request'):(es?'Confirm this correction':'Confirm this correction');
    const intro=document.createElement('p');intro.textContent=removal?(es?'Revise el perfil y el motivo. El retiro no ocurre hasta que Franklin Navigator revise la solicitud.':'Review the exact profile and reason. Public removal does not occur until Franklin Navigator reviews the request.'):(es?'Revise el perfil y el cambio solicitado antes de enviarlo.':'Review the exact profile and requested change before submitting it.');
    const summary=document.createElement('div');summary.className='r1359-review-summary';
    summary.append(reviewLine(es?'Perfil':'Profile',clean(fd.get('listing'),180)||clean(fd.get('profileId'),120)));
    if(removal){
      summary.append(reviewLine(es?'Motivo':'Reason category',clean(fd.get('removalCategory'),120)),reviewLine(es?'Explicación':'Explanation',clean(fd.get('removalReason'),1800)));
    }else{
      summary.append(reviewLine(es?'Campo':'Field',clean(fd.get('correctionField'),120)),reviewLine(es?'Información actual':'Current information',clean(fd.get('currentInfo'),1400)),reviewLine(es?'Cambio solicitado':'Requested change',clean(fd.get('correctInfo'),1400)));
    }
    const evidence=clean(fd.get('evidenceUrl'),1200);if(evidence)summary.append(reviewLine(es?'Evidencia':'Evidence',evidence));
    const actions=document.createElement('div');actions.className='r37-member-actions';
    const confirm=document.createElement('button');confirm.type='button';confirm.className='button primary';confirm.textContent=removal?(es?'Enviar solicitud de retiro':'Submit removal request'):(es?'Enviar corrección':'Submit correction');
    const back=document.createElement('button');back.type='button';back.className='button';back.textContent=es?'Volver y editar':'Go back and edit';
    confirm.addEventListener('click',()=>submitRequest(new FormData(form),removal));
    back.addEventListener('click',()=>{hideReview();const target=removal?form.elements.removalReason:form.elements.currentInfo;target?.focus();});
    actions.append(confirm,back);reviewBox.append(eyebrow,h,intro,summary,actions);reviewBox.hidden=false;
    reviewBox.scrollIntoView({behavior:'smooth',block:'nearest'});try{reviewBox.focus({preventScroll:true})}catch{reviewBox.focus()}
  };
  form.elements.requestType.addEventListener('change',hideReview);
  form.addEventListener('input',()=>{if(!reviewBox.hidden)hideReview()});
  form.addEventListener('submit',e=>{
    e.preventDefault();if(submitting)return;returnBox.replaceChildren();
    const fd=new FormData(form),type=fd.get('requestType'),removal=type==='PUBLIC_REMOVAL';
    if(removal&&!fd.get('authorityConfirmed')){status.textContent=es?'Confirme su autorización para solicitar el retiro.':'Confirm your authority to request public removal.';status.focus();return}
    if(removal&&clean(fd.get('removalReason'),1800).length<10){status.textContent=es?'Explique brevemente por qué solicita el retiro.':'Briefly explain why you are requesting removal.';status.focus();return}
    showReview(fd,removal);
  });
})();