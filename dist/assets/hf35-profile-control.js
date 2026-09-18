/* R1338 — profile-aware free correction/removal continuity */
'use strict';
(()=> {
  const API='https://franklin-navigator-membership.onrender.com';
  const form=document.querySelector('[data-profile-control-form]'),status=document.querySelector('[data-profile-control-status]'),context=document.querySelector('[data-profile-control-context]');
  if(!form||!status)return;
  const params=new URLSearchParams(location.search),es=document.documentElement.lang==='es';
  const profile=String(params.get('profile')||'').trim(),validProfile=/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(profile);
  const profilePage=validProfile?location.origin+'/profiles/'+profile+'/':'';
  const set=(name,value)=>{if(form.elements[name]&&value&&!form.elements[name].value)form.elements[name].value=value};
  set('profileId',validProfile?profile:'');set('listing',params.get('listing')||'');set('url',params.get('url')||profilePage);
  if(params.get('action')==='PUBLIC_REMOVAL')form.elements.requestType.value='PUBLIC_REMOVAL';
  const returnBox=document.createElement('div');returnBox.className='r37-member-actions';status.after(returnBox);
  const showContext=name=>{
    if(!context||!validProfile)return;
    context.hidden=false;context.replaceChildren();
    const strong=document.createElement('strong');strong.textContent=name|| (es?'Perfil seleccionado':'Selected profile');
    const span=document.createElement('span');span.textContent=es?' Esta solicitud permanecerá vinculada a esta página de perfil.':' This request will stay linked to this profile page.';
    context.append(strong,span);
  };
  const prefill=async()=>{
    if(!validProfile)return;
    let name=String(form.elements.listing?.value||'').trim();
    if(!name){try{const r=await fetch('/profiles/'+encodeURIComponent(profile)+'/',{credentials:'same-origin'});if(r.ok){const doc=new DOMParser().parseFromString(await r.text(),'text/html');name=doc.querySelector('.r22-profile-hero h1,h1')?.textContent?.trim()||'';set('listing',name)}}catch{}}
    showContext(name);
  };
  const sync=()=>{
    const removal=form.elements.requestType.value==='PUBLIC_REMOVAL';
    form.querySelectorAll('[data-removal-only]').forEach(n=>{n.hidden=!removal;n.querySelectorAll('input,textarea,select').forEach(x=>x.required=removal&&x.name!=='removalReason')});
    form.querySelectorAll('[data-correction-only]').forEach(n=>{n.hidden=removal;n.querySelectorAll('input,textarea,select').forEach(x=>x.required=!removal&&x.name!=='evidenceUrl')});
    status.textContent=removal?(es?'La solicitud de retiro es gratuita. Franklin puede confirmar su autorización antes de retirar el perfil de la vista pública.':'Removal is free. Franklin may confirm your authority before removing the profile from public view.'):(es?'La corrección factual es gratuita y será revisada antes de actualizar la información pública.':'Factual correction is free and will be reviewed before public information is updated.');
  };
  form.elements.requestType.addEventListener('change',sync);sync();prefill();
  const clean=(v,n)=>String(v||'').trim().slice(0,n);
  form.addEventListener('submit',async e=>{
    e.preventDefault();returnBox.replaceChildren();
    const fd=new FormData(form),type=fd.get('requestType'),removal=type==='PUBLIC_REMOVAL';
    if(removal&&!fd.get('authorityConfirmed')){status.textContent=es?'Confirme su autorización para solicitar el retiro.':'Confirm your authority to request public removal.';status.focus();return}
    const message=removal
      ? `Profile public-removal request. Listing: ${clean(fd.get('listing'),180)}. Profile: ${clean(fd.get('profileId'),120)}. URL: ${clean(fd.get('url'),1200)}. Requester: ${clean(fd.get('requesterName'),120)} <${clean(fd.get('requesterEmail'),200)}>. Authority: ${clean(fd.get('authorityBasis'),300)}. Reason: ${clean(fd.get('removalReason'),1800)||'Not provided'}.`
      : `Profile factual-correction request. Listing: ${clean(fd.get('listing'),180)}. Profile: ${clean(fd.get('profileId'),120)}. URL: ${clean(fd.get('url'),1200)}. Requester: ${clean(fd.get('requesterName'),120)} <${clean(fd.get('requesterEmail'),200)}>. Current information: ${clean(fd.get('currentInfo'),1400)}. Requested correction: ${clean(fd.get('correctInfo'),1400)}. Public evidence: ${clean(fd.get('evidenceUrl'),1200)||'Not provided'}.`;
    status.textContent=es?'Enviando su solicitud…':'Submitting your request…';status.focus();
    try{
      const r=await fetch(API+'/api/support/request',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:validProfile?profile:'',category:removal?'PROFILE_PUBLIC_REMOVAL':'PROFILE_FACTUAL_CORRECTION',message,preferredLanguage:es?'SPANISH':'ENGLISH'})});
      let data={};try{data=await r.json()}catch{}
      if(!r.ok)throw new Error(data?.error?.message||'REQUEST_FAILED');
      status.textContent=(es?'Solicitud recibida. No se inició ningún pago ni membresía. Referencia: ':'Request received. No payment or membership was started. Reference: ')+(data.requestId||'—');
      returnBox.replaceChildren();
      if(validProfile){const a=document.createElement('a');a.className='button primary';a.href='/profiles/'+encodeURIComponent(profile)+'/';a.textContent=es?'Volver al perfil':'Return to profile';returnBox.append(a);const center=document.createElement('a');center.className='button';center.href='/profile-studio/?profile='+encodeURIComponent(profile);center.textContent=es?'Abrir Centro de Perfil':'Open Profile Center';returnBox.append(center)}
      const help=document.createElement('a');help.className='button';help.href='mailto:community@franklinnavigator.com';help.textContent=es?'Contactar soporte':'Contact support';returnBox.append(help);
    }catch{
      status.textContent=es?'No pudimos enviar la solicitud. Sus datos siguen en el formulario. Inténtelo de nuevo o escriba a community@franklinnavigator.com.':'We could not submit the request. Your entries are still in the form. Try again or email community@franklinnavigator.com.';
    }
  });
})();