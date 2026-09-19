/* R1342 — public password recovery with exact-profile continuity */
(()=>{'use strict';
const API='https://franklin-navigator-membership.onrender.com';
const root=document.querySelector('[data-account-recovery]');if(!root)return;
const qs=new URLSearchParams(location.search),frag=new URLSearchParams(location.hash.replace(/^#/,''));
const validProfile=v=>/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(String(v||''));
const profile=validProfile(frag.get('profile'))?frag.get('profile'):(validProfile(qs.get('profile'))?qs.get('profile'):'');
const token=String(frag.get('token')||'');
const status=document.querySelector('[data-recovery-status]');
const body=document.querySelector('[data-recovery-body]');
const profileQuery=profile?'?profile='+encodeURIComponent(profile):'';
const signIn='/profile-access/'+profileQuery;
const support='/member-support/?topic=ACCOUNT_ACCESS'+(profile?'&profile='+encodeURIComponent(profile):'');
const setStatus=(text,kind='')=>{status.textContent=text;status.className='r37-status'+(kind?' '+kind:'');status.focus({preventScroll:true})};
async function api(path,payload){const r=await fetch(API+path,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let d={};try{d=await r.json()}catch{}if(!r.ok){const e=new Error(d?.error?.message||'Franklin could not complete this request.');e.code=d?.error?.code||'REQUEST_FAILED';throw e}return d}
function actions(){const d=document.createElement('div');d.className='r1342-recovery-actions';const back=document.createElement('a');back.className='button';back.href=signIn;back.textContent='← Back to sign in';const help=document.createElement('a');help.className='button';help.href=support;help.textContent='Can’t access your email? Get account help';d.append(back,help);return d}
function requestView(){
  body.replaceChildren();const card=document.createElement('section');card.className='r1342-recovery-card';card.innerHTML='<div class="eyebrow">Account recovery</div><h2>Reset your password</h2><p>Enter the email address you use for your Franklin account. For privacy, the response is the same whether or not an account exists.</p>';
  const form=document.createElement('form');form.className='r1342-recovery-form';
  const label=document.createElement('label');label.textContent='Email address';const input=document.createElement('input');input.type='email';input.name='email';input.autocomplete='email';input.required=true;label.append(input);
  const submit=document.createElement('button');submit.type='submit';submit.className='button primary';submit.textContent='Send password-reset instructions';
  form.append(label,submit);form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;setStatus('Sending reset instructions…');try{const d=await api('/api/accounts/password-reset/request',{email:input.value,profileId:profile});setStatus(d.message||"If an account exists for this email, we've sent password-reset instructions.",'good');form.reset()}catch(err){setStatus(err?.code==='RATE_LIMITED'?'Too many password-reset requests. Please wait before trying again.':'Password recovery is temporarily unavailable. Try again or use account help.','warn')}finally{submit.disabled=false}});
  card.append(form,actions());body.append(card);input.focus();
}
function resetView(){
  body.replaceChildren();const card=document.createElement('section');card.className='r1342-recovery-card';card.innerHTML='<div class="eyebrow">Secure password reset</div><h2>Choose a new password</h2><p>Use at least 12 characters. This reset link can be used only once.</p>';
  const form=document.createElement('form');form.className='r1342-recovery-form';
  const l1=document.createElement('label');l1.textContent='New password';const p1=document.createElement('input');p1.type='password';p1.autocomplete='new-password';p1.minLength=12;p1.required=true;l1.append(p1);
  const l2=document.createElement('label');l2.textContent='Confirm new password';const p2=document.createElement('input');p2.type='password';p2.autocomplete='new-password';p2.minLength=12;p2.required=true;l2.append(p2);
  const submit=document.createElement('button');submit.type='submit';submit.className='button primary';submit.textContent='Set new password';
  form.append(l1,l2,submit);form.addEventListener('submit',async e=>{e.preventDefault();if(p1.value!==p2.value){setStatus('The passwords do not match.','warn');p2.focus();return}submit.disabled=true;setStatus('Resetting your password…');try{await api('/api/accounts/password-reset/complete',{token,password:p1.value});history.replaceState(null,'',location.pathname+profileQuery);setStatus('Password reset complete. You are signed in and can continue with the same selected profile.','good');const go=document.createElement('a');go.className='button primary';go.href='/profile-access/'+profileQuery;go.textContent='Continue to profile access';card.append(go);go.focus()}catch(err){setStatus(err?.code==='RESET_TOKEN_INVALID'?'This password-reset link is invalid, expired, or has already been used. Request a new reset link.':err?.code==='PASSWORD_INVALID'?'Use a password with at least 12 characters.':'Password reset could not be completed. Request a new link or use account help.','warn')}finally{submit.disabled=false}});
  card.append(form,actions());body.append(card);p1.focus();
}
if(profile){const c=document.querySelector('[data-recovery-context]');if(c){c.hidden=false;c.textContent='Your selected Franklin profile will stay attached through password recovery.'}}
token?resetView():requestView();
})();