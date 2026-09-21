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
  const textAreaField=(labelText,name,rows=4)=>{const label=el('label');label.append(el('span',labelText));const input=document.createElement('textarea');input.name=name;input.rows=rows;label.append(input);return{label,input}};
  const notice=(text,kind='')=>{const n=el('div',text,`r37-status${kind?' '+kind:''}`);n.setAttribute('role','status');return n};
  const focusIntoView=(selector)=>setTimeout(()=>{const n=document.querySelector(selector);if(!n)return;n.setAttribute('tabindex','-1');n.scrollIntoView({behavior:'smooth',block:'center'});n.focus({preventScroll:true})},0);
  const updateProfileProgress=state=>{const nav=document.querySelector('[data-r1346-profile-progress]');if(!nav)return;const linked=state.selected&&(state.me?.profileLinks||[]).find(x=>x.profile_id===state.selected.i);const review=String(linked?.review_state||'').toUpperCase(),pending=review==='PENDING'&&linked?.authority_state!=='VERIFIED';const current=!state.selected?1:!state.me?2:(linked?.authority_state==='VERIFIED'?4:3);for(const item of nav.querySelectorAll('[data-step]')){const step=Number(item.dataset.step),base=item.dataset.label||item.textContent.replace(/^✓?\s*\d+\s+/,'').replace(/\s+— Current$/,'');let label=base;if(step===3&&pending)label='Verification pending';item.classList.toggle('is-complete',step<current);item.classList.toggle('is-current',step===current);item.classList.toggle('is-future',step>current);if(step===current)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');item.textContent=(step<current?'✓ ':'')+step+' '+label+(step===current&&!pending?' — Current':'')}};
  const updateProfileHero=state=>{const hero=document.querySelector('[data-r1352-profile-hero]'),title=document.querySelector('[data-r1352-profile-hero-title]'),lead=document.querySelector('[data-r1352-profile-hero-lead]');if(!hero||!title||!lead)return;const linked=state.selected&&(state.me?.profileLinks||[]).find(x=>x.profile_id===state.selected.i),review=String(linked?.review_state||'').toUpperCase();hero.classList.toggle('is-pending',review==='PENDING');if(review==='PENDING'){title.textContent='Your management request is being reviewed.';lead.textContent=`Your request to manage ${state.selected?.n||'this profile'} has been received. Franklin will review it; Profile Center becomes available after approval. No payment is required.`}else if(state.me&&state.selected&&linked?.authority_state!=='VERIFIED'){title.textContent=`You’re signed in. Next, verify that you manage ${state.selected.n}.`;lead.textContent='Submit reliable public evidence of your authority. Claiming and basic profile management are free; Community Membership is optional.'}else if(linked?.authority_state==='VERIFIED'){title.textContent=`Management access verified for ${state.selected?.n||'your profile'}.`;lead.textContent='Open Profile Center to manage approved member-controlled information. Source-backed public facts remain separately reviewed.'}else{title.textContent='Get free access to manage your public profile on Franklin Navigator.';lead.textContent='Start with the exact public profile, then create or sign in to your Franklin account and confirm that you are authorized to manage it. If you arrived from a profile page, that profile stays selected through sign-in. No membership or payment is required.'}};
  const planFor=key=>key===SALE_PLAN.lookupKey?SALE_PLAN:{label:historicalPlanLabel(key),price:''};
  async function request(path,{method='GET',body}={}){const response=await fetch(API+path,{method,credentials:'include',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});let payload={};try{payload=await response.json()}catch{}if(!response.ok){const e=new Error(payload?.error?.message||'Franklin could not complete this request.');e.code=payload?.error?.code||`HTTP_${response.status}`;e.status=response.status;throw e}return payload}
  const CHECKOUT_PENDING_MESSAGE='We could not confirm the payment outcome. Do not pay again. Check membership status or contact support.';
  const friendlyError=(e,payment=false)=>{if(e?.code==='ACCOUNT_ALREADY_EXISTS')return'An account already exists for this email. Sign in or reset your password.';if(e?.code==='LOGIN_INVALID')return'Email or password is incorrect. Use Forgot password? if you need to reset it.';if(e?.code==='PROFILE_VERIFICATION_REQUIRED')return'We still need to confirm that you represent this profile before payment can open.';if(e?.code==='MEMBERSHIP_ALREADY_ACTIVE')return'This profile already has an active Community Membership. Do not pay again.';if(e?.code==='PROFILE_MEMBERSHIP_ALREADY_ACTIVE')return'This public profile already has an active Community Membership through another verified manager. Use the existing manager account or contact support before making another payment.';if(e?.code==='COMMERCE_DISABLED')return'Checkout is not open. Check membership status for any earlier payment.';if(e?.code==='PLAN_RETIRED')return'That membership option is no longer available for new enrollment. The current membership is $35/year.';if(payment||['PAYMENT_OUTCOME_UNKNOWN','CHECKOUT_PENDING','CHECKOUT_PLAN_CONFLICT','CHECKOUT_RECOVERY_REQUIRED'].includes(e?.code))return CHECKOUT_PENDING_MESSAGE;return'We could not complete this request. Please try again or contact support.'};
  const withSubmissionTimeout=(promise,ms=12000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{const e=new Error('Submission status uncertain');e.code='SUBMISSION_STATUS_UNCERTAIN';reject(e)},ms);promise.then(v=>{clearTimeout(timer);resolve(v)},e=>{clearTimeout(timer);reject(e)})});
  const submissionUncertainText='We could not confirm whether your request was received. Do not submit again yet. Refresh the page or status first; if it remains unclear, contact verification support.';
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
  const normalizedName=value=>String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\b(?:llc|inc|incorporated|corp|corporation|pc|pllc|ltd)\b/g,'').replace(/\s+/g,' ').trim();
  const nameMatchRank=(name,query)=>{const n=normalizedName(name),q=normalizedName(query);if(!q)return 0;if(n===q)return 0;if((' '+n+' ').includes(' '+q+' '))return 1;if(n.startsWith(q))return 2;const tokens=q.split(' ').filter(Boolean);if(tokens.length&&tokens.every(t=>n.includes(t)))return 3;return 4;};
  const profileParam=state=>state?.selected?.i&&/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(state.selected.i)?state.selected.i:'';
  const recoveryHref=state=>'/account-recovery/'+(profileParam(state)?'?profile='+encodeURIComponent(profileParam(state)):'');
  const accountHelpHref=state=>'/member-support/?topic=ACCOUNT_ACCESS'+(profileParam(state)?'&profile='+encodeURIComponent(profileParam(state)):'');
  function accountSection(state,rerender){
    const s=el('section',null,'r37-member-step r1342-account-step');
    s.append(el('h2',state.me?'Your account':'Create an account or sign in'));
    if(state.me){
      s.append(el('p',`Signed in as ${state.me.account?.email||'your Franklin account'}.`));
      if(state.me.reviewerAccessAvailable===true){const reviewer=el('div',null,'r37-member-actions r1352-private-reviewer-link');reviewer.append(link('Open reviewer workspace',API+'/review/','button'));s.append(reviewer,el('p','Private reviewer access is available for this authorized account.','fine-print'));}
      s.append(button('Sign out',async()=>{try{await request('/api/accounts/logout',{method:'POST',body:{}});state.me=null;state.purchasePending=false;state.message='Signed out.';rerender()}catch(e){state.message=friendlyError(e);rerender()}},'button'));
      return s;
    }
    const tabs=el('div',null,'r37-member-actions r1342-account-modes');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Account access');
    const create=button('Create account',()=>{state.accountMode='register';rerender()},state.accountMode==='register'?'button primary':'button');
    const sign=button('Sign in',()=>{state.accountMode='login';rerender()},state.accountMode==='login'?'button primary':'button');
    create.setAttribute('aria-pressed',state.accountMode==='register'?'true':'false');sign.setAttribute('aria-pressed',state.accountMode==='login'?'true':'false');
    tabs.append(create,sign);s.append(tabs);
    const form=document.createElement('form');form.className='r37-member-step r1342-account-form';
    if(state.accountMode==='register'){
      const name=field('Your name','displayName','text','name'),email=field('Email address','email','email','email'),pw=field('Create password','password','password','new-password');
      pw.input.minLength=8;pw.input.maxLength=256;
      pw.label.append(el('span','Use at least 8 characters. Long passwords and passphrases are welcome.','fine-print r1342-field-help'));
      form.append(name.label,email.label,pw.label,el('p','Tip: a work or organization email can make profile verification easier when one is available. A personal email is still allowed.','fine-print'));
      const existing=el('p','Already have an account? ','fine-print');const switcher=button('Sign in',()=>{state.accountMode='login';rerender()},'link-button');existing.append(switcher);form.append(existing);
      const submit=el('button','Create account','button primary');submit.type='submit';form.append(submit);
      form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;try{
        await request('/api/accounts/register',{method:'POST',body:{displayName:name.input.value,email:email.input.value,password:pw.input.value}});
        state.me=await getMe();state.message='Your Franklin account is ready.';
      }catch(err){
        if(err?.code==='ACCOUNT_ALREADY_EXISTS'){state.accountMode='login';state.recoveryEmail=email.input.value;state.message='An account already exists for this email. Sign in or reset your password.';}
        else state.message=friendlyError(err);
      }rerender()});
    }else{
      const email=field('Email address','email','email','email'),pw=field('Password','password','password','current-password');
      if(state.recoveryEmail)email.input.value=state.recoveryEmail;
      form.append(email.label,pw.label);
      const submit=el('button','Sign in','button primary');submit.type='submit';form.append(submit);
      form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;try{await request('/api/accounts/login',{method:'POST',body:{email:email.input.value,password:pw.input.value}});state.me=await getMe();state.message='Signed in.'}catch(err){state.recoveryEmail=email.input.value;state.message=friendlyError(err)}rerender()});
      const help=el('div',null,'r37-member-actions r1342-signin-help');
      help.append(link('Forgot password?',recoveryHref(state),'button'),link('Can’t access your email? Get account help',accountHelpHref(state),'button'));
      form.append(help);
    }
    s.append(form);
    const free=el('div',null,'r37-member-actions');free.append(link('Correct a profile without signing in','/corrections/'+(profileParam(state)?'?profile='+encodeURIComponent(profileParam(state)):'')));s.append(free);
    return s;
  }
  function profileSection(state,rerender){
    const s=el('section',null,'r37-member-step');
    const links=state.me?.profileLinks||[];
    const linked=state.selected&&links.find(r=>r.profile_id===state.selected.i);
    const review=String(linked?.review_state||'').toUpperCase();
    const taskHeading=el('h2',review==='PENDING'?'Waiting for review':state.selected?'Your selected profile':'Find your profile');s.append(taskHeading);
    if(review==='PENDING'&&state.selected){
      const when=linked.review_updated_at?(()=>{try{return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(linked.review_updated_at))}catch{return''}})():'';
      const pendingCard=el('div',null,'r1352-pending-card');pendingCard.dataset.r1346PendingStatus='';pendingCard.setAttribute('role','status');pendingCard.setAttribute('aria-live','polite');
      pendingCard.append(el('h2','Access request submitted'),el('h3','Waiting for review'),el('p',`Your request to manage ${state.selected.n} has been received.`),el('p','Franklin reviews the submitted evidence. After approval, Profile Center becomes available. No payment is required.'),el('p',when?'Last updated '+when+'.':'','fine-print'));s.append(pendingCard);
    }
    if(state.selected){
      const selected=el('div',null,'r37-account-summary');
      selected.append(summaryItem('Profile',state.selected.n),summaryItem('Type',[state.selected.c,state.selected.t].filter(Boolean).join(' · ')||'Franklin profile'),summaryItem('Location',[state.selected.l||state.selected.g].filter(Boolean).join(' · ')||'Franklin area'));
      const selectedActions=el('div',null,'r37-member-actions r1346-selected-profile-actions');
      selectedActions.append(link('View public profile','/profiles/'+encodeURIComponent(state.selected.i)+'/'));
      const pathSummary=el('div',null,'r1351-profile-path-summary');
      pathSummary.append(el('strong','This exact profile is selected.'),el('p','Franklin checks your account and access state before showing the next action. Selecting this profile does not claim it or change public facts.'),el('p','Profile access requests and factual corrections/removal are free. Community Membership is optional.','fine-print'));
      s.append(selected,selectedActions,pathSummary,el('p','This exact public listing stays selected through sign-in, password recovery, and access review.','fine-print'));
    }else{
      s.append(el('p','Search by business, professional practice, organization, category or location, then choose the matching listing.'));
    }
    const search=el('div',null,'r37-member-search'),fieldSearch=field(state.selected?'Choose a different profile':'Business, professional or organization','profileSearch','search','organization'),go=button('Search',()=>runSearch());
    fieldSearch.input.placeholder='Start typing a name or category';search.append(fieldSearch.label,go);
    const results=el('div',null,'r37-search-results');results.setAttribute('aria-live','polite');
    if(state.selected){const chooser=document.createElement('details');chooser.className='r1346-profile-change';const summary=document.createElement('summary');summary.textContent='Wrong profile? Choose another';chooser.append(summary,search,results);s.append(chooser)}else{s.append(search,results)}
    const choose=row=>{
      state.selected=row;
      state.message='Profile selected. Continue with this profile to connect it to your Franklin account.';setTimeout(()=>{s.scrollIntoView({behavior:'smooth',block:'start'});s.setAttribute('tabindex','-1');s.focus({preventScroll:true})},0);
      try{const next=new URL(location.href);next.searchParams.set('profile',row.i);history.replaceState(history.state,'',next)}catch{}
      rerender();
    };
    const runSearch=async()=>{
      const q=fieldSearch.input.value.trim().toLowerCase();
      if(q.length<2){results.textContent='Type at least two characters.';return}
      results.textContent='Searching Franklin profiles…';
      try{
        const rows=(await loadProfiles()).filter(r=>r.s.includes(q)).sort((a,b)=>nameMatchRank(a.n,q)-nameMatchRank(b.n,q)||String(a.n).localeCompare(String(b.n))).slice(0,12);results.replaceChildren();
        if(!rows.length){results.append(el('p','No matching profile found.'));results.append(link('Request a Franklin profile','/profile-request/'));return}
        for(const row of rows){
          const b=button('',()=>choose(row),'r37-search-result r1342-claim-result'),txt=el('span'),strong=el('strong',row.n),small=el('small',[(window.FranklinI18n?.category?.(row.c)||row.c),row.l||row.g].filter(Boolean).join(' · ')),pick=el('span','Continue with this profile','r1342-claim-result-action');
          txt.append(strong,small);b.append(txt,pick);results.append(b);
        }
      }catch{results.textContent='Profile search could not load. Please try again.'}
    };
    fieldSearch.input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch()}});
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
    if(linked&&linked.authority_state!=='VERIFIED'&&review!=='PENDING')taskHeading.textContent='Verify that you manage '+state.selected.n;
    const actions=el('div',null,'r37-member-actions');
    if(!linked){
      const connectStatus=notice('Ready to connect this exact profile.','');connectStatus.classList.add('r1346-inline-action-status');connectStatus.setAttribute('aria-live','polite');
      const connect=button('Continue with this profile',async()=>{
        if(connect.disabled)return;connect.disabled=true;connect.textContent='Connecting profile…';connectStatus.textContent='Connecting profile…';connectStatus.className='r37-status r1346-inline-action-status';
        try{
          await request('/api/profile-links',{method:'POST',body:{profileId:state.selected.i}});
          state.me=await getMe();
          state.message='';
          rerender();
          focusIntoView('[data-r1346-verification-heading]');
        }catch(e){connect.disabled=false;connect.textContent='Retry connection';connectStatus.textContent=friendlyError(e)+' You can retry or get help.';connectStatus.className='r37-status warn r1346-inline-action-status'}
      },'button primary');
      actions.append(connect);
      actions.append(link('Correct public facts instead',`/corrections/?profile=${encodeURIComponent(state.selected.i)}&url=${encodeURIComponent(location.origin+'/profiles/'+state.selected.i+'/')}`));
      actions.append(link('Get help','/member-support/?topic=PROFILE_ACCESS&profile='+encodeURIComponent(state.selected.i)));
      s.append(actions,connectStatus,notice('No payment or membership is required to connect a profile and request management access.','good'));
      return s;
    }
    const studio='/profile-studio/?profile='+encodeURIComponent(state.selected.i);
    const access='/profile-access/?profile='+encodeURIComponent(state.selected.i);
    const correction='/corrections/?profile='+encodeURIComponent(state.selected.i)+'&url='+encodeURIComponent(location.origin+'/profiles/'+state.selected.i+'/');
    if(linked.authority_state==='VERIFIED'){
      s.append(notice('Profile access verified. You can manage this profile now.','good'));
      actions.append(link('Open Profile Center',studio,'button primary'),link('Correct public facts',correction));
    }else if(linked.authority_state==='DISPUTED'){
      s.append(notice('This profile has an access dispute. Contact support so Franklin can review it safely.','warn'));
      actions.append(link('Get profile support','/member-support/?profile='+encodeURIComponent(state.selected.i),'button primary'),link('Correct public facts',correction));
    }else if(!state.profileMode){
      s.append(notice('Profile access is not yet verified. Complete free management verification before membership can continue.','warn'));
      actions.append(link('Continue free profile access',access,'button primary'),link('Correct public facts',correction));
    }else{
      if(review==='PENDING'){
        actions.classList.add('r1352-pending-actions');
        actions.append(button('Refresh status',async()=>{try{state.me=await getMe();state.message='Profile-access status refreshed.'}catch(e){state.message=friendlyError(e)}rerender()},'button'));
        actions.append(link('Correct public facts',correction));
        actions.append(button('Withdraw access request',async()=>{const confirmWithdraw=window.FranklinI18n?.translate?.('Withdraw this profile-access request? You can request access again later if you remain authorized.')||'Withdraw this profile-access request? You can request access again later if you remain authorized.';if(!window.confirm(confirmWithdraw))return;try{await request('/api/member/representation/release',{method:'POST',body:{profileId:state.selected.i,expectedRevision:linked.review_revision||0}});state.me=await getMe();state.message='Your profile-access request was withdrawn. No membership or payment was changed.'}catch(e){state.message=friendlyError(e)}rerender()},'button'));
      }else{
        const stateCopy={
          CHANGES_REQUESTED:'Franklin needs more information before this access request can be approved.',
          REJECTED:'The previous access request was not approved. You may submit new evidence if you are authorized.',
          REVOKED:'Previous management access ended. You may request access again if you are currently authorized.'
        };
        if(stateCopy[review])s.append(notice(stateCopy[review],'warn'));
        const verifyHeading=el('h3','Verify that you manage '+state.selected.n);verifyHeading.dataset.r1346VerificationHeading='';s.append(verifyHeading,el('p','Claiming and basic profile management are free. Franklin reviews access before Profile Center tools are enabled; a claim never changes public facts by itself.'));
        const proofHelp=el('div',null,'r1352-proof-help');proofHelp.append(el('strong','What counts as proof?'),el('p','Use a reliable public source showing your connection or authority, such as an official website or team page, an organization page naming your role, an official public contact channel, or another reliable public source. No website? Another official public page can be used; verification support can help with other cases.'));s.append(proofHelp);
        const form=document.createElement('form');form.className='r1346-profile-access-verification';
        const evidence=field('Official website or public page showing your connection','evidenceUrl','url','url');evidence.input.placeholder='https://';
        if(state.selected.w){const evidenceActions=el('div',null,'r1352-evidence-actions');evidenceActions.append(button('Use website already on this profile',()=>{evidence.input.value=state.selected.w;evidence.input.focus()},'button'));form.append(evidenceActions,evidence.label)}else form.append(evidence.label);
        const statement=textAreaField('How are you authorized to manage this profile?','statement',6);statement.input.required=true;statement.input.minLength=30;statement.input.maxLength=1200;
        const confirmLabel=el('label',null,'p0-check'),confirmBox=document.createElement('input');confirmBox.type='checkbox';confirmBox.required=true;confirmBox.name='authorityConfirmed';confirmLabel.append(confirmBox,document.createTextNode(' I confirm that I own, manage, work for, or am otherwise authorized to act for this profile.'));
        const submit=el('button',review==='CHANGES_REQUESTED'?'Submit updated access request':'Submit access request','button primary');submit.type='submit';
        const submitStatus=notice('','');submitStatus.classList.add('r1346-inline-action-status');submitStatus.hidden=true;submitStatus.setAttribute('aria-live','polite');
        form.append(statement.label,confirmLabel,submit,submitStatus);
        form.addEventListener('submit',async e=>{e.preventDefault();if(submit.disabled)return;submit.disabled=true;submit.textContent='Submitting…';submitStatus.hidden=false;submitStatus.textContent='Submitting your request. Please keep this page open.';submitStatus.className='r37-status r1346-inline-action-status r1352-profile-access-verification-status';try{
          await withSubmissionTimeout(request('/api/member/representation/request',{method:'POST',body:{profileId:state.selected.i,expectedRevision:linked.review_revision||0,evidenceUrl:evidence.input.value,statement:statement.input.value,authorityConfirmed:confirmBox.checked}}));
          state.me=await getMe();state.message='';rerender();focusIntoView('[data-r1346-pending-status]');
        }catch(err){if(err?.code==='SUBMISSION_STATUS_UNCERTAIN'){submitStatus.textContent=submissionUncertainText;submitStatus.className='r37-status warn r1346-inline-action-status r1352-profile-access-verification-status';return}submit.disabled=false;submit.textContent=review==='CHANGES_REQUESTED'?'Submit updated access request':'Submit access request';submitStatus.textContent=friendlyError(err)+' Review the form and try again.';submitStatus.className='r37-status warn r1346-inline-action-status r1352-profile-access-verification-status'}});
        s.append(form);
        actions.append(link('Correct public facts',correction));
        actions.append(link('Help with verification','/member-support/?topic=PROFILE_ACCESS&profile='+encodeURIComponent(state.selected.i)));
      }
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
    const state={ready:null,me:null,selected:null,profileLabel:'',accountMode:'register',profileMode,message:profileMode?'Checking free profile-management access…':'Checking membership availability…'};
    const render=()=>{
      root.replaceChildren();
      updateProfileProgress(state);updateProfileHero(state);
      if(state.message)root.append(notice(state.message));
      if(!state.ready)return;
      if(active(state.me)&&!profileMode){
        profileName((state.me.profileLinks||[]).find(r=>r.authority_state==='VERIFIED')?.profile_id).then(n=>{if(n&&state.profileLabel!==n){state.profileLabel=n;render()}});
        root.append(accountSection(state,render),membershipSection(state,render));return;
      }
      if(profileMode&&state.selected&&!state.me)root.append(notice(`Selected profile: ${state.selected.n}. Sign in or create a free account to continue with this exact profile. You will not need to search again.`,'good'));
      const selectedLink=state.selected&&(state.me?.profileLinks||[]).find(r=>r.profile_id===state.selected.i),pendingReview=String(selectedLink?.review_state||'').toUpperCase()==='PENDING';
      if(state.me&&profileMode&&pendingReview)root.append(profileSection(state,render),accountSection(state,render));else root.append(accountSection(state,render));
      if(state.me){
        if(!(profileMode&&pendingReview))root.append(profileSection(state,render));
        if(profileMode){
          const box=el('section',null,'r37-member-step');
          box.append(el('h2','Profile management is free'),el('p','Claiming a profile, requesting factual corrections or removal, and managing an approved profile photo/logo do not require Community Membership.'));
          const verified=selectedLink?.authority_state==='VERIFIED'?selectedLink:null;
          if(verified)box.append(link('Open Profile Center','/profile-studio/?profile='+encodeURIComponent(verified.profile_id),'button primary'));
          if(verified||String(selectedLink?.review_state||'').toUpperCase()==='PENDING')box.append(link('See optional Community Membership','/membership-start/'));
          root.append(box);
        }else root.append(membershipSection(state,render));
      }
    };
    render();
    try{
      state.ready=await request('/ready');state.me=await getMe();
      state.message=profileMode?'':(state.ready.liveCheckoutEnabled?'Membership sign-in is available.':'Membership accounts are available; new checkout is currently closed.');
      const pre=params.get('profile');if(pre){const rows=await loadProfiles();state.selected=rows.find(r=>r.i===pre)||null}
      render();if(!profileMode)await poll(state,render);
    }catch(e){state.ready={ok:false,liveCheckoutEnabled:false};state.message=friendlyError(e);render();}
  }
  for(const root of document.querySelectorAll('[data-membership-live-root]'))init(root);
})();
