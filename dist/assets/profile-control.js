'use strict';
(()=>{
  const API='https://franklin-navigator-membership.onrender.com';
  const q=(s,r=document)=>r.querySelector(s);
  const form=q('[data-profile-control-form]'); if(!form)return;
  const lang=document.documentElement.lang==='es'?'es':'en';
  const tx=(en,es)=>lang==='es'?es:en;
  const params=new URLSearchParams(location.search);
  const listing=q('[name="listing"]',form),url=q('[name="url"]',form),profile=q('[name="profileId"]',form),type=q('[name="requestType"]',form),status=q('[data-profile-control-status]');
  if(params.get('listing'))listing.value=params.get('listing').slice(0,180);
  if(params.get('url'))url.value=params.get('url').slice(0,800);
  if(params.get('profile')&&/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(params.get('profile')))profile.value=params.get('profile');
  if(params.get('action')==='PUBLIC_REMOVAL')type.value='PUBLIC_REMOVAL';
  function sync(){const removal=type.value==='PUBLIC_REMOVAL';for(const el of form.querySelectorAll('[data-removal-only]'))el.hidden=!removal;const authority=q('[name="authorityConfirmed"]',form);if(authority)authority.required=removal;}
  type.addEventListener('change',sync);sync();
  form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const fd=new FormData(form),kind=String(fd.get('requestType')||'CORRECTION'),isRemoval=kind==='PUBLIC_REMOVAL';status.className='r37-status';status.textContent=tx('Submitting your free request…','Enviando su solicitud gratuita…');
    const lines=[isRemoval?'PUBLIC PROFILE REMOVAL REQUEST':'FACTUAL PROFILE CORRECTION REQUEST',`Listing: ${String(fd.get('listing')||'').trim()}`,`Requester: ${String(fd.get('requesterName')||'').trim()} <${String(fd.get('requesterEmail')||'').trim()}>`,`Page: ${String(fd.get('url')||'').trim()||'not supplied'}`];
    if(isRemoval)lines.push(`Authority statement: ${String(fd.get('authorityBasis')||'').trim()}`,`Authority attested: ${fd.get('authorityConfirmed')?'yes':'no'}`);
    lines.push(`Details: ${String(fd.get('details')||'').trim()}`,'No membership or payment is required for this request.');
    const body={category:isRemoval?'PROFILE_PUBLIC_REMOVAL':'PROFILE_FACTUAL_CORRECTION',profileId:String(fd.get('profileId')||'').trim(),preferredLanguage:lang==='es'?'SPANISH':'ENGLISH',message:lines.join('\n')};
    try{const r=await fetch(API+'/api/support/request',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data?.error?.message||'request failed');form.querySelector('button[type="submit"]').disabled=true;status.className='r37-status good';status.textContent=tx(`Request received. Reference ${data.requestId}. No payment was made. Franklin Navigator will review it and contact you if verification or more information is needed.`,`Solicitud recibida. Referencia ${data.requestId}. No se realizó ningún pago. Franklin Navigator la revisará y se comunicará con usted si necesita verificación o más información.`);status.focus();}
    catch{status.className='r37-status warn';status.textContent=tx('We could not submit the request. No payment was made. Please try again or email community@franklinnavigator.com.','No pudimos enviar la solicitud. No se realizó ningún pago. Inténtelo de nuevo o escriba a community@franklinnavigator.com.');status.focus();}
  });
})();
