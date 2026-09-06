from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1]
expected={'dist/assets/app.js':'62b4b1f9b9853dc90fb57bf928cbdbe830a758b03533bf454ca1e5b080e346b6','dist/assets/membership-live.js':'881e8ab8693fe322492e794e1af316078228a82a91c1fd9654a3c0dcba3a7c9c','dist/data/r37-es-public-strings.json':'6a092b630cc5609967037a4f1b14df0166bff546cd7210e7ebb3638a08b90e9c'}
for name,digest in expected.items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest,'Pinned R40 source changed: '+name
app=root/'dist/assets/app.js';s=app.read_text();old='if(claimRoot){';new="if(claimRoot && q('[data-claim-profile-lookup]',claimRoot) && q('[data-claim-profile-form]',claimRoot)){"
assert s.count(old)==1;s=s.replace(old,new,1);app.write_text(s)
p=root/'dist/assets/membership-live.js';s=p.read_text();start=s.index('  const friendlyError=');end=s.index('\n  async function getMe',start)
s=s[:start]+'''  const pendingMessage='We could not confirm this purchase. Check your membership status before trying again. Do not pay again while we check.';
  const pendingCodes=new Set(['CHECKOUT_PENDING','PAYMENT_OUTCOME_UNKNOWN','CHECKOUT_RECOVERY_REQUIRED','CHECKOUT_PLAN_CONFLICT']);
  const friendlyError=e=>{if(e?.code==='PROFILE_VERIFICATION_REQUIRED')return'We still need to confirm that you represent this profile before payment can open.';if(e?.code==='MEMBERSHIP_ALREADY_ACTIVE')return'This profile already has an active Community Membership. Do not pay again.';if(e?.code==='COMMERCE_DISABLED')return'Secure checkout is temporarily unavailable. No payment was created.';if(pendingCodes.has(e?.code))return pendingMessage;return'We could not complete this request. Please check your account or contact Franklin Navigator support.'};
  const pendingKey='franklinPendingPurchaseV1';
  function readPending(){try{const v=JSON.parse(sessionStorage.getItem(pendingKey)||'null');return v&&typeof v.profileId==='string'&&Object.values(PLAN).some(p=>p.lookupKey===v.lookupKey)?v:null}catch{return null}}
  function clearPending(state){state.pendingPurchase=null;try{sessionStorage.removeItem(pendingKey)}catch{}}
  async function openPurchase(state,rerender,selected,p){
    if(state.purchaseBusy)return;
    state.purchaseBusy=true;
    state.pendingPurchase={profileId:selected.i,lookupKey:p.lookupKey,accountId:state.me?.account?.account_id};
    try{sessionStorage.setItem(pendingKey,JSON.stringify(state.pendingPurchase))}catch{}
    state.message='Opening secure checkout…';rerender();
    try{
      const result=await request('/api/membership/start',{method:'POST',body:{profileId:selected.i,lookupKey:p.lookupKey}});
      const destination=new URL(result.checkoutUrl);
      if(destination.protocol!=='https:'||destination.hostname!=='checkout.stripe.com'||destination.username||destination.password)throw new Error('Unconfirmed checkout destination');
      location.assign(destination.href);
    }catch(e){
      state.purchaseBusy=false;
      if(['PROFILE_VERIFICATION_REQUIRED','MEMBERSHIP_ALREADY_ACTIVE','COMMERCE_DISABLED','PLAN_INVALID'].includes(e?.code)){clearPending(state);state.message=friendlyError(e)}else state.message=pendingMessage;
      rerender();
    }
  }
''' +s[end:]
s=s.replace("if(active(state.me)){const p=planFor", "if(active(state.me)){clearPending(state);const p=planFor",1)
anchor="s.append(notice('Profile verified. Choose the membership term that fits your organization.','good'));"
pending='''const pending=state.pendingPurchase;if(pending&&pending.profileId===selected.i&&pending.accountId===state.me?.account?.account_id){s.append(notice(state.purchaseBusy?'Opening secure checkout…':pendingMessage,'warn'));const actions=el('div',null,'r37-member-actions');const check=button('Check membership status',async()=>{try{state.me=await getMe();if(active(state.me)){clearPending(state);state.message='Payment confirmed. Membership active.'}else state.message=pendingMessage}catch{state.message=pendingMessage}rerender()},'button primary');check.disabled=state.purchaseBusy;actions.append(check);if(!state.purchaseBusy){const original=Object.values(PLAN).find(p=>p.lookupKey===pending.lookupKey);if(original)actions.append(button('Resume the same checkout',()=>openPurchase(state,rerender,selected,original),'button'));}actions.append(link('Get support','/member-support/'));s.append(actions);s.append(el('p','Resuming continues the same purchase. Do not start a different payment while its status is uncertain.','fine-print'));return s;}'''
assert s.count(anchor)==1;s=s.replace(anchor,pending+anchor,1)
old="async()=>{pay.disabled=true;state.message='Opening secure checkout…';rerender(false);try{const result=await request('/api/membership/start',{method:'POST',body:{profileId:selected.i,lookupKey:p.lookupKey}});location.assign(result.checkoutUrl)}catch(e){state.message=friendlyError(e);rerender()}}"
assert s.count(old)==1;s=s.replace(old,"()=>openPurchase(state,rerender,selected,p)",1)
s=s.replace("const state={ready:null,me:null,selected:null", "const state={pendingPurchase:readPending(),purchaseBusy:false,ready:null,me:null,selected:null",1)
start=s.index('const pending=state.pendingPurchase;');end=s.index("s.append(notice('Profile verified. Choose",start);block=s[start:end].replace('if(!state.purchaseBusy){const original=',"if(!state.purchaseBusy&&state.ready?.liveCheckoutEnabled&&linked?.authority_state==='VERIFIED'){const original=")
s=s[:start]+s[end:];where=s.index("if(!linked||linked.authority_state!=='VERIFIED')");s=s[:where]+block+s[where:];p.write_text(s)
translations={
'We could not confirm this purchase. Check your membership status before trying again. Do not pay again while we check.':'No pudimos confirmar esta compra. Consulta el estado de tu membresía antes de intentarlo de nuevo. No vuelvas a pagar mientras la revisamos.',
'We could not complete this request. Please check your account or contact Franklin Navigator support.':'No pudimos completar esta solicitud. Revisa tu cuenta o contacta al equipo de ayuda de Franklin Navigator.',
'Check membership status':'Consultar el estado de la membresía',
'Resume the same checkout':'Continuar con la misma compra',
'Resuming continues the same purchase. Do not start a different payment while its status is uncertain.':'Al continuar, retomas la misma compra. No inicies otro pago mientras no se haya confirmado su estado.'}
p=root/'dist/data/r37-es-public-strings.json';j=json.loads(p.read_text());j['translations'].update(translations);j['count']=len(j['translations']);j['r40_1PaymentSafetyStrings']=len(translations);p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
outputs={'dist/assets/app.js':'52b9738fcc3fed719cc15ac1f4893fe5923d7c0fa40e0b84ff5107e5ed5c326b','dist/assets/membership-live.js':'229c982f55e4ef20e9c616fc0497f2abf0d88ca8d46b92e33fc9446a8188c9b4','dist/data/r37-es-public-strings.json':'3b4f3779447c4a56fdd3d53365aa74d1246ef6aee5db459eff58cfcbb9671bc2'}
for name,digest in outputs.items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest,'Corrected output mismatch '+name
print('Exact claim initialization and truthful resumable purchase UI applied in EN/ES')
