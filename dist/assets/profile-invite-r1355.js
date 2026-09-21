/* R1355 — secure one-time profile invitation acceptance. Email control is not profile authority. */
(()=>{'use strict';
const API='https://franklin-navigator-membership.onrender.com',root=document.querySelector('[data-profile-invite]');if(!root)return;
const status=document.querySelector('[data-invite-status]'),body=document.querySelector('[data-invite-body]');
const frag=new URLSearchParams(location.hash.replace(/^#/,'')),token=String(frag.get('token')||'').trim();
let invitation=null,me=null;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const setStatus=(text,kind='')=>{status.textContent=text;status.className='r37-status'+(kind?' '+kind:'')};
async function api(path,{method='POST',payload}={}){const r=await fetch(API+path,{method,credentials:'include',headers:payload?{'Content-Type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined,cache:'no-store'});let d={};try{d=await r.json()}catch{}if(!r.ok){const e=new Error(d?.error?.message||'Franklin could not complete this request.');e.code=d?.error?.code||'REQUEST_FAILED';throw e}return d}
async function getMe(){try{return await api('/api/accounts/me',{method:'GET'})}catch{return null}}
function field(label,type='text',autocomplete=''){const l=el('label');l.append(el('span',label));const i=document.createElement('input');i.type=type;i.required=true;if(autocomplete)i.autocomplete=autocomplete;l.append(i);return{label:l,input:i}}
function actionLink(text,href,cls='button'){const a=el('a',text,cls);a.href=href;return a}
async function accept(){setStatus('Confirming your invitation…');try{const d=await api('/api/profile-invitations/accept',{payload:{token}});history.replaceState(null,'',location.pathname);setStatus('Invitation confirmed. Continue with free management verification.','good');location.assign('/profile-access/?profile='+encodeURIComponent(d.profileId)+'&source=invite')}catch(e){if(e.code==='INVITATION_EMAIL_MISMATCH'){setStatus('This invitation belongs to a different email address. Sign out and use the email that received the invitation.','warn');render()}else setStatus(e.message||'This invitation could not be confirmed.','warn')}}
async function signOut(){try{await api('/api/accounts/logout',{payload:{}})}catch{}me=null;render();setStatus('Signed out. Use the email address that received this invitation.')}
function render(){
 body.replaceChildren();if(!invitation)return;
 const card=el('section',undefined,'r1342-recovery-card');card.append(el('div','Profile invitation','eyebrow'),el('h2',invitation.profileName),el('p','Invitation sent to '+invitation.emailHint+'.'),el('p','Clicking the email invitation proves control of that inbox. It does not prove ownership, employment, credentials, or authority to manage this profile.'));
 if(me?.account){
   card.append(el('p','You are already signed in. Continue only if this is the account for the invited email address.'));
   const actions=el('div',undefined,'r1342-recovery-actions'),go=el('button','Continue with this account','button primary'),out=el('button','Sign out and use another account','button');go.type='button';out.type='button';go.onclick=accept;out.onclick=signOut;actions.append(go,out);card.append(actions);body.append(card);return;
 }
 const tabs=el('div',undefined,'actions'),signIn=el('button','Sign in','button primary'),create=el('button','Create free account','button');signIn.type=create.type='button';tabs.append(signIn,create);card.append(tabs);
 const form=document.createElement('form');form.className='r1342-recovery-form';card.append(form);
 const renderForm=mode=>{
   form.replaceChildren();
   if(mode==='signin'){
     signIn.className='button primary';create.className='button';
     const email=field('Email address','email','username'),pw=field('Password','password','current-password'),submit=el('button','Sign in and continue','button primary');submit.type='submit';
     const forgot=actionLink('Forgot password?','/account-recovery/?profile='+encodeURIComponent(invitation.profileId),'button');form.append(email.label,pw.label,submit,forgot);
     form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;setStatus('Signing in…');try{await api('/api/accounts/login',{payload:{email:email.input.value,password:pw.input.value}});me=await getMe();await accept()}catch(err){submit.disabled=false;setStatus(err.code==='LOGIN_INVALID'?'Email or password is incorrect. Use Forgot password if needed.':err.message,'warn')}};
   }else{
     signIn.className='button';create.className='button primary';
     const name=field('Your name','text','name'),email=field('Email address','email','email'),pw=field('Create password (8+ characters)','password','new-password'),submit=el('button','Create account and continue','button primary');submit.type='submit';pw.input.minLength=8;
     form.append(name.label,email.label,pw.label,submit);
     form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;setStatus('Creating your Franklin account…');try{await api('/api/accounts/register',{payload:{displayName:name.input.value,email:email.input.value,password:pw.input.value}});me=await getMe();await accept()}catch(err){submit.disabled=false;setStatus(err.code==='ACCOUNT_ALREADY_EXISTS'?'An account already exists for this email. Choose Sign in or reset the password.':err.message,'warn')}};
   }
 };
 signIn.onclick=()=>renderForm('signin');create.onclick=()=>renderForm('create');renderForm('signin');
 card.append(el('p','After the invitation is confirmed, Franklin will still ask you to verify that you are authorized to manage the exact profile. No membership or payment is required.','fine-print'));
 body.append(card);
}
async function init(){
 if(!token){setStatus('This invitation link is missing or invalid. Ask Franklin for a new invitation.','warn');body.append(actionLink('Get profile access help','/member-support/?topic=PROFILE_ACCESS','button'));return}
 try{invitation=await api('/api/profile-invitations/inspect',{payload:{token}});me=await getMe();setStatus('Secure invitation ready.','good');render()}catch(e){setStatus(e.message||'This invitation link is invalid, expired, or already used.','warn');body.append(actionLink('Get profile access help','/member-support/?topic=PROFILE_ACCESS','button'))}
}
init();
})();