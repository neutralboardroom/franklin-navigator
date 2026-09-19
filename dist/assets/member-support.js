/* R1338 — in-page profile/account support */
'use strict';
(()=>{
 const API='https://franklin-navigator-membership.onrender.com',form=document.querySelector('[data-member-support-form]'),status=document.querySelector('[data-member-support-status]');
 if(!form||!status)return;
 const params=new URLSearchParams(location.search),allowed=new Set(['PROFILE_ACCESS','ACCOUNT_ACCESS','PROFILE_MANAGEMENT','MEMBERSHIP_BILLING','ACCESSIBILITY','OTHER']);
 const topic=String(params.get('topic')||'').toUpperCase();if(allowed.has(topic))form.elements.topic.value=topic;
 const profile=String(params.get('profile')||'').trim();if(/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(profile))form.elements.profileId.value=profile;
 const supportSection=document.querySelector('[data-r1342-support-section]'),supportActions=document.querySelector('[data-r1342-support-actions]'),supportHeading=document.querySelector('[data-r1342-support-heading]');
 if(topic==='ACCOUNT_ACCESS'){
   supportSection?.classList.add('r1342-support-priority');
   if(supportHeading)supportHeading.textContent='Account access help';
   if(supportActions){
     const back=document.createElement('a');back.className='button primary';back.textContent='← Back to sign in';back.href='/profile-access/'+(profile?'?profile='+encodeURIComponent(profile):'');
     const reset=document.createElement('a');reset.className='button';reset.textContent='Reset password';reset.href='/account-recovery/'+(profile?'?profile='+encodeURIComponent(profile):'');
     supportActions.append(back,reset);
   }
   setTimeout(()=>supportHeading?.focus?.({preventScroll:true}),0);
 }

 const clean=(v,n)=>String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
 form.addEventListener('submit',async e=>{
  e.preventDefault();const fd=new FormData(form),lang=(window.FranklinI18n?.language||document.documentElement.lang)==='es'?'SPANISH':'ENGLISH';
  const category='PROFILE_SUPPORT_'+clean(fd.get('topic'),40),name=clean(fd.get('requesterName'),120),email=clean(fd.get('requesterEmail'),200),msg=clean(fd.get('message'),2200),pid=clean(fd.get('profileId'),120);
  const message='Profile/account support request. Topic: '+category+'. Profile: '+(pid||'Not specified')+'. Requester: '+name+' <'+email+'>. Message: '+msg;
  status.textContent=lang==='SPANISH'?'Enviando su solicitud…':'Submitting your request…';status.focus();const submit=form.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
  try{
   const r=await fetch(API+'/api/support/request',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:pid,category,message,preferredLanguage:lang})});let data={};try{data=await r.json()}catch{}
   if(!r.ok)throw new Error(data?.error?.message||'REQUEST_FAILED');
   status.textContent=(lang==='SPANISH'?'Solicitud recibida. Referencia: ':'Request received. Reference: ')+(data.requestId||'—')+(lang==='SPANISH'?' No envíe información confidencial adicional.':' Keep the reference; do not send sensitive information.');
   const keepTopic=form.elements.topic.value,keepProfile=form.elements.profileId.value;form.reset();form.elements.topic.value=keepTopic;form.elements.profileId.value=keepProfile;
  }catch{status.textContent=lang==='SPANISH'?'No pudimos enviar la solicitud. Sus datos siguen en el formulario. Inténtelo de nuevo o escriba a community@franklinnavigator.com.':'We could not submit the request. Your entries are still in the form. Try again or email community@franklinnavigator.com.'}
  finally{if(submit)submit.disabled=false}
 });
})();