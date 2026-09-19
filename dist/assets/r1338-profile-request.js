/* R1339 — bilingual public profile creation request */
'use strict';
(()=> {
 const API='https://franklin-navigator-membership.onrender.com',form=document.querySelector('[data-profile-request-form]'),status=document.querySelector('[data-profile-request-status]');
 if(!form||!status)return;
 const clean=(v,n)=>String(v||'').trim().slice(0,n);
 const isEs=()=>window.FranklinI18n?.language==='es'||document.documentElement.lang==='es';
 const tx=(en,es)=>isEs()?es:en;
 form.addEventListener('submit',async e=>{
   e.preventDefault();const fd=new FormData(form),url=clean(fd.get('officialUrl'),1200);
   if(url){try{const u=new URL(url);if(u.protocol!=='https:')throw 0}catch{status.textContent=tx('Use a public HTTPS website or contact-page link, or leave that field blank.','Use un sitio web HTTPS público o un enlace de contacto, o deje ese campo en blanco.');status.focus();return}}
   const message=`Profile creation request. Public name: ${clean(fd.get('publicName'),180)}. Franklin/Williamson location or service area: ${clean(fd.get('area'),400)}. Official public link: ${url||'Not provided'}. Requester: ${clean(fd.get('requesterName'),120)} <${clean(fd.get('requesterEmail'),200)}>. Notes: ${clean(fd.get('notes'),1200)||'None'}.`;
   status.textContent=tx('Submitting your request…','Enviando su solicitud…');status.focus();
   try{
     const r=await fetch(API+'/api/support/request',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:'PROFILE_CREATION_REQUEST',message,preferredLanguage:isEs()?'SPANISH':'ENGLISH'})});
     let data={};try{data=await r.json()}catch{}
     if(!r.ok)throw new Error();
     status.textContent=tx(
       'Request received. Franklin will review the public information before any profile is created. No claim, membership, payment, or endorsement was created. Reference: ',
       'Solicitud recibida. Franklin revisará la información pública antes de crear cualquier perfil. No se creó ningún reclamo, membresía, pago ni respaldo. Referencia: '
     )+(data.requestId||'—');
     form.reset();
   }catch{
     status.textContent=tx(
       'We could not submit the request. Your entries are still here. Try again or email community@franklinnavigator.com.',
       'No pudimos enviar la solicitud. Sus datos siguen aquí. Inténtelo de nuevo o escriba a community@franklinnavigator.com.'
     );
   }
 });
})();