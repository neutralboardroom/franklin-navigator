'use strict';
(()=>{
  const API='https://franklin-navigator-membership.onrender.com';
  const SALE_PLAN=Object.freeze({label:'Franklin Navigator Community Membership',price:'$35/year',lookupKey:'franklin_community_member_annual_v6'});
  const historicalPlanLabel=key=>{const k=String(key||'').toLowerCase();if(k.includes('monthly'))return'Existing monthly Community Membership';if(k.includes('charter')||k.includes('36_month'))return'Existing fixed-term Community Membership';if(k.includes('annual'))return'Existing annual Community Membership';return'Community Membership'};
  const params=new URLSearchParams(location.search),$=(s,r=document)=>r.querySelector(s);
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
  const button=(text,fn,cls='button primary')=>{const n=el('button',text,cls);n.type='button';n.addEventListener('click',fn);return n};
  const link=(text,href,cls='button')=>{const n=el('a',text,cls);n.href=href;return n};
  const field=(labelText,name,type='text',autocomplete='')=>{const label=el('label');label.append(el('span',labelText));const input=document.createElement('input');input.name=name;input.type=type;if(autocomplete)input.autocomplete=autocomplete;label.append(input);return{label,input}};
  const notice=(text,kind='')=>{const n=el('div',text,`r37-status${kind?' '+kind:''}`);n.setAttribute('role','status');return n};
  const planFor=key=>key===SALE_PLAN.lookupKey?SALE_PLAN:{label:historicalPlanLabel(key),price:''};
  async function request(path,{method='GET',body}={}){const response=await fetch(API+path,{method,credentials:'include',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});let payload={};try{payload=await response.json()}catch{}if(!response.ok){const e=new Error(payload?.error?.message||'Franklin could not complete this request.');e.code=payload?.error?.code||`HTTP_${response.status}`;e.status=response.status;throw e}return payload}
  const CHECKOUT_PENDING_MESSAGE='We could not confirm the payment outcome. Do not pay again. Check membership status or contact support.';
  const friendlyError=(e,payment=false)=>{if(e?.code==='PROFILE_VERIFICATION_REQUIRED')return'We still need to confirm that you represent this profile before payment can open.';if(e?.code==='MEMBERSHIP_ALREADY_ACTIVE')return'This profile already has an active Community Membership. Do not pay again.';if(e?.code==='PROFILE_MEMBERSHIP_ALREADY_ACTIVE')return'This public profile already has an active Community Membership through another verified manager. Use the existing manager account or contact support before making another payment.';if(e?.code==='COMMERCE_DISABLED')return'Checkout is not open. Check membership status for any earlier payment.';if(e?.code==='PLAN_RETIRED')return'That membership option is no longer available for new enrollment. The current membership is $35/year.';if(payment||['PAYMENT_OUTCOME_UNKNOWN','CHECKOUT_PENDING','CHECKOUT_PLAN_CONFLICT','CHECKOUT_RECOVERY_REQUIRED'].includes(e?.code))return CHECKOUT_PENDING_MESSAGE;return'We could not complete this request. Please try again or contact support.'};
  const pendingKey=state=>{const account=state.me?.account?.accountId||state.me?.account?.account_id||state.me?.account?.id;const profile=state.selected?.i;return account&&profile?'franklin.checkout.pending.v1:'+account+':'+profile:null};
  const isPending=state=>{if(state.purchasePending)return true;try{const key=pendingKey(state);return Boolean(key&&sessionStorage.getItem(key))}catch{return false}};
  const setPending=(state,value)=>{state.purchasePending=value;try{const key=pendingKey(state);if(key){if(value)sessionStorage.setItem(key,'pending');else sessionStorage.removeItem(key)}}catch{}};
  const CHECKOUT_NOT_STARTED=new Set(['COMMERCE_DISABLED','CHECKOUT_INFRASTRUCTURE_NOT_READY','PROFILE_VERIFICATION_REQUIRED','PROFILE_MEMBERSHIP_ALREADY_ACTIVE','MEMBERSHIP_ALREADY_ACTIVE','PLAN_INVALID','PLAN_RETIRED','PROFILE_INVALID','AUTH_REQUIRED']);
  async function getMe(){try{return await request('/api/accounts/me')}catch(e){if(e.status===401)return null;throw e}}
  const active=me=>['ACTIVE','ACTIVE_CANCELING','GRACE'].includes(String(me?.membership?.status||''));
  let profiles=null;
  async function loadTargetedProfileOverlay(){const raw=await fetch('/data/discovery/r1329-franklin-navigator-profile.json',{credentials:'omit',cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('overlay');return r.json()});if(raw?.schemaVersion!=='franklin.discovery-overlay.v1'||raw?.community!=='FRANKLIN_TN'||raw?.profileId!=='FR-ORG-b00c0ace7943973c'||raw?.sourceRelease!=='FR-PF-PLATFORM-15.28'||raw?.addressType!=='MAILING_ADDRESS_ONLY'||raw?.physicalLocationVerified!==false||!Array.isArray(raw.records)||raw.records.length!==1)throw new Error('overlay');const a=raw.records[0];return {i:a[0],n:a[1],l:a[2],c:raw.categories?.[a[3]]||'',t:raw.types?.[a[4]]||'',g:raw.areas?.[a[5]]||'',w:raw.websites?.[a[6]]||null,p:a[7]||'',e:a[8]||'',d:raw.dates?.[a[9]]||'',h:a[10]===true,x:a[11]};}
  async function loadProfiles(){if(profiles)return profiles;const manifest=await fetch('/data/franklin-profiles-manifest.json').then(r=>r.json());const chunks=await Promise.all(manifest.chunks.map(c=>fetch(c.file).then(r=>r.json())));const base=chunks.flatMap(c=>c.records);const add=await loadTargetedProfileOverlay();if(base.some(r=>r.i===add.i))throw new Error('duplicate targeted profile');profiles=base.concat(add).map(r=>({...r,s:`${r.n} ${r.c||''} ${r.g||''} ${r.l||''}`.toLowerCase()}));return profiles}
  async function profileName(id){if(!id)return'';const rows=await loadProfiles();return rows.find(r=>r.i===id)?.n||'Your Franklin profile'}
  function accountSection(state,rerender){const s=el('section',null,'r37-member-step');s.append(el('h2',state.me?'Your account':'Create an account or sign in'));if(state.me){s.append(el('p',`Signed in as ${state.me.account?.email||'your Franklin account'}.`));s.append(button('Sign out',async()=>{try{await request('/api/accounts/logout',{method:'POST',body:{}});state.me=null;state.purchasePending=false;state.message='Signed out.';rerender()}catch(e){state.message=friendlyError(e);rerender()}},'button'));return s}const tabs=el('div',null,'r37-member-actions'),create=button('Create account',()=>{state.accountMode='register';rerender()},state.accountMode==='register'?'button primary':'button'),sign=button('Sign in',()=>{state.accountMode='login';rerender()},state.accountMode==='login'?'button primary':'button');tabs.append(create,sign);s.append(tabs);const form=document.createElement('form');form.className='r37-member-step';if(state.accountMode==='register'){const name=field('Your name','displayName','text','name'),email=field('Email','email','email','email'),pw=field('Create password (12+ characters)','password','password','new-password');form.append(name.label,email.label,pw.label,el('p','Tip: a work or organization email can make profile verification easier when one is available. A personal email is still allowed.','fine-print'));const submit=el('button','Create account','button primary');submit.type='submit';form.append(submit);form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;try{await request('/api/accounts/register',{method:'POST',body:{displayName:name.input.value,email:email.input.value,password:pw.input.value}});state.me=await getMe();state.message='Your Franklin account is ready.'}catch(err){state.message=friendlyError(err)}rerender()})}else{const email=field('Email','email','email','email'),pw=field('Password','password','password','current-password');form.append(email.label,pw.label);const submit=el('button','Sign in','button primary');submit.type='submit';form.append(submit);form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;try{await request('/api/accounts/login',{method:'POST',body:{email:email.input.value,password:pw.input.value}});state.me=await getMe();state.message='Signed in.'}catch(err){state.message=friendlyError(err)}rerender()})}s.append(form);const help=el('div',null,'r37-member-actions');help.append(link('Need help signing in?','/member-support/?topic=ACCOUNT_ACCESS'),link('Correct a profile without signing in','/corrections/'));s.append(help);return s}
  function profileSection(state,rerender){
    const s=el('section',null,'r37-member-step');
    s.append(el('h2',state.selected?'Your selected profile':'Find your profile'));
    if(state.selected){
      const selected=el('div',null,'r37-account-summary');
      selected.append(summaryItem('Profile',state.selected.n),summaryItem('Location',[state.selected.l||state.selected.g].filter(Boolean).join(' · ')||'Franklin area'));
      const selectedActions=el('div',null,'r37-member-actions');
      selectedActions.append(link('View public profile','/profiles/'+encodeURIComponent(state.selected.i)+'/'));
      s.append(selected,selectedActions,el('p','Your selected profile stays with you through sign-in and access review. You do not need to search for it again.','fine-print'));
    }else{
      s.append(el('p','Search by business, professional practice, organization, category or location, then choose the matching listing.'));
    }
    const search=el('div',null,'r37-member-search'),fieldSearch=field(state.selected?'Choose a different profile':'Business, professional or organization','profileSearch','search','organization'),go=button('Search',()=>runSearch());
    fieldSearch.input.placeholder='Start typing a name or category';search.append(fieldSearch.label,go);s.append(search);
    const results=el('div',null,'r37-search-results');results.setAttribute('aria-live','polite');s.append(results);
    const choose=row=>{
      state.selected=row;
      state.message='Profile selected. Continue with this profile to connect it to your Franklin account.';
      try{const next=new URL(location.href);next.searchParams.set('profile',row.i);history.replaceState(history.state,'',next)}catch{}
      rerender();
    };
    const runSearch=async()=>{
      const q=fieldSearch.input.value.trim().toLowerCase();
      if(q.length<2){results.textContent='Type at least two characters.';return}
      results.textContent='Searching Franklin profiles…';
      try{
        const rows=(await loadProfiles()).filter(r=>r.s.includes(q)).slice(0,12);results.replaceChildren();
        if(!rows.length){results.append(el('p','No matching profile found.'));results.append(link('Request a Franklin profile','/profile-request/'));return}
        for(const row of rows){
          const b=button('',()=>choose(row),'r37-search-result'),txt=el('span'),strong=el('strong',row.n),small=el('small',[(window.FranklinI18n?.category?.(row.c)||row.c),row.l||row.g].filter(Boolean).join(' · ')),pick=el('span','Choose this profile');
          txt.append(strong,small);b.append(txt,pick);results.append(b);
        }
      }catch{results.textContent='Profile search could not load. Please try again.'}
    };
    fieldSearch.input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch()}});
    const links=state.me?.profileLinks||[];
    if(!state.selected&&links.length){
      const known=el('div',null,'r37-member-actions');
      known.append(el('span','Profiles already connected to this account:'));
      loadProfiles().then(rows=>{
        for(const item of links){
          const row=rows.find(x=>x.i===item.profile_id);
          if(!row)continue;
          known.append(button(row.n,()=>choose(row),'button'));
        }
      }).catch(()=>{});
      s.append(known);
      return s;
    }
    if(!state.selected)return s;
    const linked=links.find(r=>r.profile_id===state.selected.i);
    const actions=el('div',null,'r37-member-actions');
    if(!linked){
      actions.append(button('Continue with this profile',async()=>{
        try{
          await request('/api/profile-links',{method:'POST',body:{profileId:state.selected.i}});
          state.me=await getMe();
          state.message='Profile connected to your account. Next, confirm that you are authorized to manage it.';
          rerender();
        }catch(e){state.message=friendlyError(e);rerender()}
      },'button primary'));
      actions.append(link('Correct public facts instead',`/corrections/?profile=${encodeURIComponent(state.selected.i)}&url=${encodeURIComponent(location.origin+'/profiles/'+state.selected.i+'/')}`));
      s.append(actions,notice('No payment or membership is required to connect a profile and request management access.','good'));
      return s;
    }
    const studio='/profile-studio/?profile='+encodeURIComponent(state.selected.i);
    const correction='/corrections/?profile='+encodeURIComponent(state.selected.i)+'&url='+encodeURIComponent(location.origin+'/profiles/'+state.selected.i+'/');
    if(linked.authority_state==='VERIFIED'){
      s.append(notice('Profile access verified. You can manage this profile now.','good'));
      actions.append(link('Open Profile Center',studio,'button primary'),link('Correct public facts',correction));
    }else if(linked.authority_state==='DISPUTED'){
      s.append(notice('This profile has an access dispute. Contact support so Franklin can review it safely.','warn'));
      actions.append(link('Get profile support','/member-support/?profile='+encodeURIComponent(state.selected.i),'button primary'),link('Correct public facts',correction));
    }else{
      s.append(notice('Profile access is not yet verified. Open Profile Center to submit or check your access request.','warn'));
      actions.append(link('Request or check profile access',studio,'button primary'),link('Correct public facts',correction));
    }
    s.append(actions);
    return s;
  }
  function membershipSection(state,rerender){const s=el('section',null,'r37-member-step');s.append(el('h2','Community Membership'));if(active(state.me)){const p=planFor(state.me.membership?.lookup_key);const needsPayment=String(state.me.membership?.status||'')==='GRACE';s.append(notice(needsPayment?'Payment needs attention. Your existing membership is being recovered—do not start another membership.':'Membership active. Do not make another payment.',needsPayment?'warn':'good'));const summary=el('div',null,'r37-account-summary');summary.append(summaryItem('Plan',`${p.label}${p.price?' — '+p.price:''}`),summaryItem('Profile',state.profileLabel||'Your connected Franklin profile'),summaryItem('Benefits','Member profile tools, Growth Desk and community participation'),summaryItem('Billing',needsPayment?'Update your payment method securely through Stripe':'Managed securely through Stripe'));s.append(summary);const actions=el('div',null,'r37-member-actions');actions.append(button(needsPayment?'Update payment method':'Manage or cancel billing',async()=>{try{const result=await request('/api/billing/portal',{method:'POST',body:{}});location.assign(result.url)}catch(e){state.message=friendlyError(e);rerender()}},needsPayment?'button primary':'button'));if(!needsPayment)actions.prepend(link('Use my member benefits','/member-first-value/','button primary'));const manageId=state.selected?.i||state.me?.membership?.profile_id||(state.me?.profileLinks||[]).find(r=>r.authority_state==='VERIFIED')?.profile_id||'';actions.append(link('Manage my profile','/profile-studio/'+(manageId?'?profile='+encodeURIComponent(manageId):'')));actions.append(link('Get support','/member-support/'));s.append(actions);return s}const selected=state.selected,linked=selected&&(state.me?.profileLinks||[]).find(r=>r.profile_id===selected.i);if(!selected){s.append(notice('Choose your profile above before selecting a membership.'));return s}if(!linked||linked.authority_state!=='VERIFIED'){s.append(notice('We’re still confirming that you represent this profile. Checkout will appear after the review is complete.','warn'));return s}if(isPending(state)){s.append(notice(CHECKOUT_PENDING_MESSAGE,'warn'));const recovery=el('div',null,'r37-member-actions');recovery.append(button('Check membership status',async()=>{try{state.me=await getMe();if(active(state.me)){setPending(state,false);state.message='Payment confirmed. Membership active.'}else state.message=CHECKOUT_PENDING_MESSAGE}catch{state.message=CHECKOUT_PENDING_MESSAGE}rerender()},'button primary'),link('Get support','/member-support/'));s.append(recovery);return s}if(!state.ready?.liveCheckoutEnabled){s.append(notice('Checkout is not open. Check membership status for any earlier payment.','warn'));return s}s.append(notice('Profile verified. Franklin Navigator Community Membership is $35/year and renews annually until canceled.','good'));const grid=el('div',null,'r37-plan-grid');const card=el('article',null,'r37-plan recommended');card.append(el('h3',SALE_PLAN.label),el('p',SALE_PLAN.price,'r37-plan-price'),el('p','Renews annually until canceled.'));const pay=button('Continue — $35/year',async()=>{if(isPending(state))return;setPending(state,true);pay.disabled=true;state.message='Opening secure checkout…';rerender(false);try{const result=await request('/api/membership/start',{method:'POST',body:{profileId:selected.i,lookupKey:SALE_PLAN.lookupKey}});const checkout=new URL(result.checkoutUrl);if(checkout.protocol!=='https:'||checkout.host!=='checkout.stripe.com'||checkout.username||checkout.password)throw new Error('Invalid checkout destination');location.assign(checkout.href)}catch(e){if(CHECKOUT_NOT_STARTED.has(e?.code))setPending(state,false);if(e?.code==='COMMERCE_DISABLED')state.ready={...state.ready,liveCheckoutEnabled:false};state.message=friendlyError(e,true);rerender()}},'button primary');card.append(pay);grid.append(card);s.append(grid);s.append(el('p','Factual corrections and requests to remove a profile from public view are free and do not require membership. Membership does not buy factual accuracy, ranking, endorsement, credentials, leads or guaranteed results.','fine-print'));return s}
  const summaryItem=(label,value)=>{const n=el('div',null,'r37-summary-item');n.append(el('strong',label),el('span',value));return n};
  async function poll(state,rerender){if(!state.me||params.get('checkout')!=='success')return;state.message='Payment processing — do not pay again.';rerender(false);for(let i=0;i<12;i++){try{await new Promise(r=>setTimeout(r,i?2500:500));state.me=await getMe();if(active(state.me)){state.message='Payment confirmed. Membership active.';rerender();return}}catch{}}state.message='Payment processing — do not pay again. Franklin is still confirming your membership. Refresh shortly or contact member support.';rerender()}
  async function init(root){
    const mode=root.dataset.membershipLiveMode||'account';
    const profileMode=mode==='profile';
    const state={ready:null,me:null,selected:null,profileLabel:'',accountMode:'register',message:profileMode?'Checking free profile-management access…':'Checking membership availability…'};
    const render=()=>{
      root.replaceChildren();
      if(state.message)root.append(notice(state.message));
      if(!state.ready)return;
      if(active(state.me)&&!profileMode){
        profileName((state.me.profileLinks||[]).find(r=>r.authority_state==='VERIFIED')?.profile_id).then(n=>{if(n&&state.profileLabel!==n){state.profileLabel=n;render()}});
        root.append(accountSection(state,render),membershipSection(state,render));return;
      }
      if(profileMode&&state.selected&&!state.me)root.append(notice(`Selected profile: ${state.selected.n}. Sign in or create a free account to continue with this exact profile. You will not need to search again.`,'good'));
      root.append(accountSection(state,render));
      if(state.me){
        root.append(profileSection(state,render));
        if(profileMode){
          const box=el('section',null,'r37-member-step');
          box.append(el('h2','Profile management is free'),el('p','Claiming a profile, requesting factual corrections or removal, and managing an approved profile photo/logo do not require Community Membership.'));
          const verified=(state.me.profileLinks||[]).find(r=>r.authority_state==='VERIFIED'&&(!state.selected||r.profile_id===state.selected.i));
          if(verified)box.append(link('Open Profile Center','/profile-studio/?profile='+encodeURIComponent(verified.profile_id),'button primary'));
          box.append(link('See optional Community Membership','/membership-start/'));
          root.append(box);
        }else root.append(membershipSection(state,render));
      }
    };
    render();
    try{
      state.ready=await request('/ready');state.me=await getMe();
      state.message=profileMode?'Profile accounts and claim access are available. No membership or payment is required.':(state.ready.liveCheckoutEnabled?'Membership sign-in is available.':'Membership accounts are available; new checkout is currently closed.');
      const pre=params.get('profile');if(pre){const rows=await loadProfiles();state.selected=rows.find(r=>r.i===pre)||null}
      render();if(!profileMode)await poll(state,render);
    }catch(e){state.ready={ok:false,liveCheckoutEnabled:false};state.message=friendlyError(e);render();}
  }
  for(const root of document.querySelectorAll('[data-membership-live-root]'))init(root);
})();
