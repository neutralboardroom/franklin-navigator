'use strict';
(() => {
  const API='https://franklin-navigator-membership.onrender.com';
  const $=(s,r=document)=>r.querySelector(s);
  const root=$('[data-membership-admin-root]');
  if(!root)return;
  const status=$('[data-admin-status]');
  const account=$('[data-admin-account]');
  const profile=$('[data-admin-profile]');
  const token=$('[data-admin-token]');
  const sub=$('[data-admin-subscription]');
  const result=$('[data-admin-result]');
  const verifyBtn=$('[data-admin-verify]');
  const reconcileBtn=$('[data-admin-reconcile]');
  const refreshBtn=$('[data-admin-refresh]');

  const show=(text)=>{if(status)status.textContent=text;};
  const showResult=(value)=>{if(result)result.textContent=typeof value==='string'?value:JSON.stringify(value,null,2);};
  async function req(path,{method='GET',body,admin=false}={}){
    const headers={};
    if(body)headers['Content-Type']='application/json';
    if(admin){const t=token.value.trim();if(!t)throw new Error('Enter the Render ADMIN_TOKEN in this page. Do not paste it into chat.');headers.Authorization='Bearer '+t;}
    const r=await fetch(API+path,{method,credentials:'include',headers,body:body?JSON.stringify(body):undefined});
    let p={};try{p=await r.json();}catch{}
    if(!r.ok){const e=new Error(p?.error?.message||`Request failed (${r.status})`);e.code=p?.error?.code;throw e;}return p;
  }
  async function refresh(){
    show('Reading your signed-in Franklin account…');showResult('');
    try{
      const me=await req('/api/accounts/me');
      account.value=me.account?.account_id||'';
      profile.replaceChildren();
      for(const link of me.profileLinks||[]){const o=document.createElement('option');o.value=link.profile_id;o.textContent=`${link.profile_id} — ${link.authority_state}`;profile.append(o);}
      if(!(me.profileLinks||[]).length){const o=document.createElement('option');o.value='';o.textContent='No linked profile yet';profile.append(o);}
      show(`Signed in as ${me.account?.email||'Franklin account'}. ${me.membership?.status?`Membership: ${me.membership.status}.`:''}`);
      showResult(me);
    }catch(e){show(e.message);showResult('Sign in on /membership-enroll/ first, then return here.');}
  }
  verifyBtn?.addEventListener('click',async()=>{
    const accountId=account.value.trim(),profileId=profile.value.trim();
    if(!accountId||!profileId){show('A signed-in account with a linked profile is required.');return;}
    verifyBtn.disabled=true;show('Verifying exact Franklin profile authority…');
    try{const out=await req('/admin/profile-links/verify',{method:'POST',admin:true,body:{accountId,profileId,state:'VERIFIED'}});show('Profile authority verified.');showResult(out);await refresh();}
    catch(e){show(e.message);showResult({code:e.code||null});}finally{verifyBtn.disabled=false;}
  });
  reconcileBtn?.addEventListener('click',async()=>{
    const accountId=account.value.trim(),profileId=profile.value.trim(),subscriptionId=sub.value.trim();
    if(!accountId||!profileId||!subscriptionId){show('Account, profile, and existing Stripe subscription ID are required.');return;}
    reconcileBtn.disabled=true;show('Reconciling the existing paid subscription without creating a new charge…');
    try{const out=await req('/admin/memberships/reconcile',{method:'POST',admin:true,body:{accountId,profileId,subscriptionId}});show('Existing paid subscription reconciled. No new charge was created.');showResult(out);await refresh();}
    catch(e){show(e.message);showResult({code:e.code||null});}finally{reconcileBtn.disabled=false;}
  });
  refreshBtn?.addEventListener('click',refresh);
  refresh();
})();
