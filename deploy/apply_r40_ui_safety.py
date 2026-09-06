from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1]
base={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [root/'dist/assets/app.js',root/'dist/assets/membership-live.js',root/'dist/data/r37-es-public-strings.json']}
expected={'dist/assets/app.js':'62b4b1f9b9853dc90fb57bf928cbdbe830a758b03533bf454ca1e5b080e346b6','dist/assets/membership-live.js':'881e8ab8693fe322492e794e1af316078228a82a91c1fd9654a3c0dcba3a7c9c','dist/data/r37-es-public-strings.json':'6a092b630cc5609967037a4f1b14df0166bff546cd7210e7ebb3638a08b90e9c'}
assert base==expected, 'Pinned R40 source differs; do not overwrite newer changes'
p=root/'dist/assets/app.js';s=p.read_text();assert s.count('if(claimRoot){')==1
s=s.replace('if(claimRoot){',"if(claimRoot&&q('[data-claim-profile-lookup]',claimRoot)&&q('[data-claim-profile-form]',claimRoot)){",1);p.write_text(s)
p=root/'dist/assets/membership-live.js';s=p.read_text();a=s.index('  const friendlyError=');b=s.index('\n',a)
new="""  const CHECKOUT_PENDING_MESSAGE='We could not confirm the payment outcome. Do not pay again. Check membership status or contact support.';
  const friendlyError=(e,payment=false)=>{if(e?.code==='PROFILE_VERIFICATION_REQUIRED')return'We still need to confirm that you represent this profile before payment can open.';if(e?.code==='MEMBERSHIP_ALREADY_ACTIVE')return'This profile already has an active Community Membership. Do not pay again.';if(e?.code==='COMMERCE_DISABLED')return'Checkout is not open. Check membership status for any earlier payment.';if(payment||['PAYMENT_OUTCOME_UNKNOWN','CHECKOUT_PENDING','CHECKOUT_PLAN_CONFLICT','CHECKOUT_RECOVERY_REQUIRED'].includes(e?.code))return CHECKOUT_PENDING_MESSAGE;return'We could not complete this request. Please try again or contact support.'};
  const pendingKey=state=>{const account=state.me?.account?.accountId||state.me?.account?.account_id||state.me?.account?.id;const profile=state.selected?.i;return account&&profile?'franklin.checkout.pending.v1:'+account+':'+profile:null};
  const isPending=state=>{if(state.purchasePending)return true;try{const key=pendingKey(state);return Boolean(key&&sessionStorage.getItem(key))}catch{return false}};
  const setPending=(state,value)=>{state.purchasePending=value;try{const key=pendingKey(state);if(key){if(value)sessionStorage.setItem(key,'pending');else sessionStorage.removeItem(key)}}catch{}};
  const CHECKOUT_NOT_STARTED=new Set(['COMMERCE_DISABLED','CHECKOUT_INFRASTRUCTURE_NOT_READY','PROFILE_VERIFICATION_REQUIRED','MEMBERSHIP_ALREADY_ACTIVE','PLAN_INVALID','PROFILE_INVALID','AUTH_REQUIRED']);"""
s=s[:a]+new+s[b:]
needle="if(!state.ready?.liveCheckoutEnabled){"
insert="""if(isPending(state)){s.append(notice(CHECKOUT_PENDING_MESSAGE,'warn'));const recovery=el('div',null,'r37-member-actions');recovery.append(button('Check membership status',async()=>{try{state.me=await getMe();if(active(state.me)){setPending(state,false);state.message='Payment confirmed. Membership active.'}else state.message=CHECKOUT_PENDING_MESSAGE}catch{state.message=CHECKOUT_PENDING_MESSAGE}rerender()},'button primary'),link('Get support','/member-support/'));s.append(recovery);return s}"""
assert s.count(needle)==1;s=s.replace(needle,insert+needle,1)
needle="pay.disabled=true;state.message='Opening secure checkout…';rerender(false);"
replace="if(isPending(state))return;setPending(state,true);pay.disabled=true;state.message='Opening secure checkout…';rerender(false);"
assert s.count(needle)==1;s=s.replace(needle,replace,1)
needle="location.assign(result.checkoutUrl)}catch(e){state.message=friendlyError(e);rerender()}"
replace="""const checkout=new URL(result.checkoutUrl);if(checkout.protocol!=='https:'||checkout.host!=='checkout.stripe.com'||checkout.username||checkout.password)throw new Error('Invalid checkout destination');location.assign(checkout.href)}catch(e){if(CHECKOUT_NOT_STARTED.has(e?.code))setPending(state,false);if(e?.code==='COMMERCE_DISABLED')state.ready={...state.ready,liveCheckoutEnabled:false};state.message=friendlyError(e,true);rerender()}"""
assert s.count(needle)==1;s=s.replace(needle,replace,1)
s=s.replace('Secure checkout is temporarily unavailable. No payment will be created.','Checkout is not open. Check membership status for any earlier payment.')
s=s.replace("state.me=null;state.selected=null;","state.me=null;state.selected=null;state.purchasePending=false;",1)
p.write_text(s)
p=root/'dist/data/r37-es-public-strings.json';d=json.loads(p.read_text());d['translations'].update({
 'We could not confirm the payment outcome. Do not pay again. Check membership status or contact support.':'No pudimos confirmar el resultado del pago. No vuelva a pagar. Revise el estado de su membresía o contacte con soporte.',
 'Checkout is not open. Check membership status for any earlier payment.':'El pago no está disponible. Revise el estado de su membresía para consultar cualquier pago anterior.',
 'Check membership status':'Revisar el estado de la membresía',
 'We could not complete this request. Please try again or contact support.':'No pudimos completar esta solicitud. Inténtelo de nuevo o contacte con soporte.',
});d['count']=len(d['translations']);d['checkoutSafetyHotfix']={'version':'FRANKLIN_PUBLIC_CHECKOUT_SAFETY_HF1','scope':'Unknown-outcome recovery copy; no pricing or entitlement changes'};p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
changed={n:{'before':sha,'after':hashlib.sha256((root/n).read_bytes()).hexdigest()} for n,sha in base.items()}
(root/'deploy').mkdir(exist_ok=True)
(root/'deploy/UI_SAFETY_DELTA.json').write_text(json.dumps(changed,indent=2)+'\n');print(json.dumps(changed,indent=2))
