/* R1355 — context-aware, no-code account recovery with exact-profile continuity */
(()=>{'use strict';
const API='https://franklin-navigator-membership.onrender.com';
const REVIEW='https://franklin-navigator-membership.onrender.com/review/';
const root=document.querySelector('[data-account-recovery]');if(!root)return;
const qs=new URLSearchParams(location.search),frag=new URLSearchParams(location.hash.replace(/^#/,''));
const validProfile=v=>/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(String(v||''));
const profile=validProfile(frag.get('profile'))?frag.get('profile'):(validProfile(qs.get('profile'))?qs.get('profile'):'');
const token=String(frag.get('token')||'').trim();
const returnMode=qs.get('return')==='reviewer'?'reviewer':(profile?'profile':'generic');
const cleanQs=new URLSearchParams();
if(returnMode==='reviewer')cleanQs.set('return','reviewer');
if(profile)cleanQs.set('profile',profile);
history.replaceState(null,'',location.pathname+(cleanQs.size?'?'+cleanQs.toString():''));
const status=document.querySelector('[data-recovery-status]');
const body=document.querySelector('[data-recovery-body]');
const title=document.querySelector('[data-recovery-title]');
const lead=document.querySelector('[data-recovery-lead]');
const context=document.querySelector('[data-recovery-context]');
const profileQuery=profile?'?profile='+encodeURIComponent(profile):'';
const destination=returnMode==='reviewer'?REVIEW:(profile?'/profile-access/'+profileQuery:'/profile-access/');
const support='/member-support/?topic=ACCOUNT_ACCESS'+(profile?'&profile='+encodeURIComponent(profile):'');
const selectedProfileName=profile==='FR-ORG-b00c0ace7943973c'?'Franklin Navigator':'your selected Franklin profile';
const setStatus=(text,kind='')=>{status.hidden=!text;status.textContent=text||'';status.className='r37-status'+(kind?' '+kind:'')};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
async function api(path,payload){const r=await fetch(API+path,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});let d={};try{d=await r.json()}catch{}if(!r.ok){const e=new Error(d?.error?.message||'Franklin could not complete this request.');e.code=d?.error?.code||'REQUEST_FAILED';throw e}return d}
function secondaryActions(){const d=el('div',undefined,'r1342-recovery-actions');const back=el('a','← Back to sign in','button');back.href=destination;const help=el('a','Can’t access your email? Get account help','button');help.href=support;d.append(back,help);return d}
function passwordField(labelText){const label=el('label');const text=el('span',labelText);const wrap=el('span',undefined,'r1355-password-wrap');const input=document.createElement('input');input.type='password';input.autocomplete='new-password';input.minLength=8;input.maxLength=256;input.required=true;const toggle=el('button','Show','r1355-password-toggle');toggle.type='button';toggle.setAttribute('aria-label','Show '+labelText.toLowerCase());toggle.setAttribute('aria-pressed','false');toggle.addEventListener('click',()=>{const showing=input.type==='text';input.type=showing?'password':'text';toggle.textContent=showing?'Show':'Hide';toggle.setAttribute('aria-pressed',showing?'false':'true');toggle.setAttribute('aria-label',(showing?'Show ':'Hide ')+labelText.toLowerCase())});wrap.append(input,toggle);label.append(text,wrap);return{label,input}}
function configureContext(){
 if(returnMode==='reviewer'){title.textContent='Reset your Franklin password.';lead.textContent='Reset the password for your authorized Franklin account, then return to reviewer sign in.'}
 else if(profile){title.textContent='Recover your account without losing your selected profile.';lead.textContent='Password reset is self-service. Your selected profile stays attached, and membership, payment, and management authority do not change.'}
 else{title.textContent='Reset your Franklin account password.';lead.textContent='Password reset is self-service. Membership, payment, and profile-management authority do not change because you reset a password.'}
 if(profile&&context){context.hidden=false;context.textContent='Your selected Franklin profile will stay attached through password recovery.'}
}
function requestView(){
 setStatus('Enter your Franklin account email.');
 body.replaceChildren();const card=el('section',undefined,'r1342-recovery-card');card.append(el('div','Account recovery','eyebrow'),el('h2','Reset your password'),el('p','Enter the email address you use for your Franklin account. For privacy, the response is the same whether or not an account exists.'));
 const form=el('form',undefined,'r1342-recovery-form');const label=el('label');label.append(el('span','Email address'));const input=document.createElement('input');input.type='email';input.name='email';input.autocomplete='email';input.required=true;label.append(input);const submit=el('button','Send password-reset instructions','button primary');submit.type='submit';form.append(label,submit);
 form.addEventListener('submit',async e=>{e.preventDefault();if(submit.disabled)return;submit.disabled=true;submit.textContent='Sending…';setStatus('');try{
   await api('/api/accounts/password-reset/request',{email:input.value,profileId:profile,returnMode});
   body.replaceChildren();const success=el('section',undefined,'r1342-recovery-card r1346-recovery-success');success.append(el('h2','Check your email'),el('p','If an account exists for this email, password-reset instructions have been sent.'),el('p','Use the secure single-use link in the email to choose a new password. The link expires.'),secondaryActions());body.append(success);setStatus('');
 }catch(err){submit.disabled=false;submit.textContent='Send password-reset instructions';setStatus(err?.code==='RATE_LIMITED'?'Too many password-reset requests. Please wait before trying again.':'Password recovery is temporarily unavailable. Try again or use account help.','warn')}});card.append(form,secondaryActions());body.append(card);input.focus();
}
function resetView(){
 setStatus('Choose a new password.');
 body.replaceChildren();const card=el('section',undefined,'r1342-recovery-card');card.append(el('div','Secure password reset','eyebrow'),el('h2','Choose a new password'),el('p','Use at least 8 characters. Long passwords and passphrases are welcome. This reset link can be used only once.'));
 const form=el('form',undefined,'r1342-recovery-form'),a=passwordField('New password'),b=passwordField('Confirm new password'),submit=el('button','Set new password','button primary'),local=el('div',undefined,'r37-status');submit.type='submit';local.hidden=true;local.setAttribute('role','status');local.setAttribute('aria-live','polite');form.append(a.label,b.label,submit,local);
 form.addEventListener('submit',async e=>{e.preventDefault();if(a.input.value!==b.input.value){local.hidden=false;local.className='r37-status warn';local.textContent='The passwords do not match.';b.input.focus();return}if(submit.disabled)return;submit.disabled=true;submit.textContent='Changing password…';local.hidden=true;try{
   await api('/api/accounts/password-reset/complete',{token,password:a.input.value});a.input.value='';b.input.value='';
   body.replaceChildren();const success=el('section',undefined,'r1342-recovery-card r1346-recovery-success');success.append(el('h2','Password changed successfully.'),el('p','Your Franklin account is signed in with a fresh session.'));
   const go=el('a',returnMode==='reviewer'?'Return to reviewer sign in':(profile?'Continue to profile access':'Continue'),'button primary');go.href=destination;success.append(go,secondaryActions());body.append(success);setStatus('');
 }catch(err){submit.disabled=false;submit.textContent='Set new password';local.hidden=false;local.className='r37-status warn';local.textContent=err?.code==='RESET_TOKEN_INVALID'?'This password-reset link is invalid, expired, or has already been used. Request a new reset link.':err?.code==='PASSWORD_INVALID'?'Use a password with at least 8 characters.':'Password reset could not be completed. Request a new link or use account help.'}});
 card.append(form);body.append(card);a.input.focus();
}
configureContext();token?resetView():requestView();
})();