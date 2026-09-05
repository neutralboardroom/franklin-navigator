'use strict';
(() => {
  const API = 'https://franklin-navigator-membership.onrender.com';
  const PLAN = Object.freeze({
    monthly: {label:'Monthly Community Membership', price:'$5/month', lookupKey:'franklin_community_member_monthly_v5'},
    annual: {label:'Annual Community Membership', price:'$50/year', lookupKey:'franklin_community_member_annual_v5'},
    charter: {label:'Franklin Charter Membership', price:'$120 once / 36 months', lookupKey:'franklin_charter_member_36_month_v5'}
  });
  const VALID_PROFILE = /^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/;
  const $ = (selector, root=document) => root.querySelector(selector);
  const params = new URLSearchParams(location.search);

  async function request(path, {method='GET', body}={}) {
    const response = await fetch(API + path, {
      method,
      credentials:'include',
      headers: body ? {'Content-Type':'application/json'} : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error(payload?.error?.message || 'Franklin membership service could not complete this request.');
      error.code = payload?.error?.code || `HTTP_${response.status}`;
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const button = (text, handler, className='button primary') => {
    const node = el('button', text, className);
    node.type = 'button';
    node.addEventListener('click', handler);
    return node;
  };
  const link = (text, href, className='button') => {
    const node = el('a', text, className);
    node.href = href;
    return node;
  };
  const field = (labelText, name, type='text', autocomplete='') => {
    const label = el('label');
    label.append(el('span', labelText));
    const input = document.createElement('input');
    input.name = name; input.type = type; if (autocomplete) input.autocomplete = autocomplete;
    label.append(input);
    return {label,input};
  };
  const notice = (text, kind='') => {
    const node = el('div', text, 'r29-truth');
    if (kind) node.dataset.state = kind;
    return node;
  };
  const errorText = error => {
    if (error?.code === 'PROFILE_VERIFICATION_REQUIRED') return 'This profile must be verified to your account before checkout can open.';
    if (error?.code === 'MEMBERSHIP_ALREADY_ACTIVE') return 'This Franklin profile already has an active membership. No additional payment is needed.';
    if (error?.code === 'COMMERCE_DISABLED') return 'Secure membership checkout is temporarily closed. No payment was created.';
    return error?.message || 'Something went wrong. No payment was created.';
  };

  async function getMe() {
    try { return await request('/api/accounts/me'); }
    catch (error) { if (error.status === 401) return null; throw error; }
  }

  function activeMembership(me) {
    const status = String(me?.membership?.status || '');
    return ['ACTIVE','ACTIVE_CANCELING','GRACE'].includes(status);
  }

  function renderAccount(root, state, rerender) {
    const section = el('section', null, 'r29-panel');
    section.append(el('h2', state.me ? 'Your Franklin account' : 'Sign in or create your Franklin account'));
    if (state.me) {
      section.append(el('p', `Signed in as ${state.me.account?.email || 'your Franklin account'}.`));
      section.append(button('Sign out', async () => {
        try { await request('/api/accounts/logout',{method:'POST',body:{}}); state.me=null; rerender(); }
        catch (error) { state.message=errorText(error); rerender(); }
      }, 'button'));
      return section;
    }

    const tabs = el('div', null, 'actions');
    const register = button('Create account', () => {state.accountMode='register'; rerender();}, state.accountMode==='register'?'button primary':'button');
    const login = button('Sign in', () => {state.accountMode='login'; rerender();}, state.accountMode==='login'?'button primary':'button');
    tabs.append(register,login); section.append(tabs);

    const form = document.createElement('form');
    form.className='r29-panel';
    if (state.accountMode === 'register') {
      const display=field('Your name','displayName','text','name');
      const email=field('Email','email','email','email');
      const password=field('Create password (12+ characters)','password','password','new-password');
      form.append(display.label,email.label,password.label);
      const submit=el('button','Create Franklin account','button primary'); submit.type='submit'; form.append(submit);
      form.addEventListener('submit', async event => {
        event.preventDefault(); submit.disabled=true; state.message='Creating your Franklin account…'; rerender(false);
        try {
          await request('/api/accounts/register',{method:'POST',body:{displayName:display.input.value,email:email.input.value,password:password.input.value}});
          state.me=await getMe(); state.message='Your Franklin account is ready.'; rerender();
        } catch(error) { state.message=errorText(error); rerender(); }
      });
    } else {
      const email=field('Email','email','email','email');
      const password=field('Password','password','password','current-password');
      form.append(email.label,password.label);
      const submit=el('button','Sign in','button primary'); submit.type='submit'; form.append(submit);
      form.addEventListener('submit', async event => {
        event.preventDefault(); submit.disabled=true; state.message='Signing in…'; rerender(false);
        try {
          await request('/api/accounts/login',{method:'POST',body:{email:email.input.value,password:password.input.value}});
          state.me=await getMe(); state.message='Signed in.'; rerender();
        } catch(error) { state.message=errorText(error); rerender(); }
      });
    }
    section.append(form);
    return section;
  }

  function renderProfile(root, state, rerender) {
    const section = el('section', null, 'r29-panel');
    section.append(el('h2','Connect the exact Franklin profile'));
    section.append(el('p','Checkout opens only after your account is verified as authorized for the exact Franklin profile. This prevents a payment from being attached to the wrong business or organization.'));
    const queryProfile = params.get('profile') || '';
    const profileField = field('Franklin profile ID','profileId');
    profileField.input.placeholder='FR-ORG-…';
    profileField.input.value = state.profileId || queryProfile;
    section.append(profileField.label);
    const actions=el('div',null,'actions');
    actions.append(link('Find my profile','/directory/'));
    const save=button('Use this profile', async () => {
      const profileId=profileField.input.value.trim();
      if (!VALID_PROFILE.test(profileId)) {state.message='Choose a valid Franklin profile from Find Local.'; rerender(); return;}
      save.disabled=true; state.message='Connecting your profile…'; rerender(false);
      try {
        await request('/api/profile-links',{method:'POST',body:{profileId}});
        state.profileId=profileId; state.me=await getMe(); state.message='Profile connected. Franklin will show checkout after authority verification.'; rerender();
      } catch(error) {state.message=errorText(error); rerender();}
    },'button primary');
    actions.append(save); section.append(actions);

    const links = state.me?.profileLinks || [];
    if (links.length) {
      const list=el('ul',null,'check-list');
      for (const row of links) {
        const item=el('li');
        item.append(document.createTextNode(`${row.profile_id} — `));
        const strong=el('strong',String(row.authority_state || 'PENDING')); item.append(strong); list.append(item);
      }
      section.append(el('h3','Profile verification status'),list);
    }
    return section;
  }

  function renderMembership(root, state, rerender) {
    const section=el('section',null,'r29-panel');
    section.append(el('h2','Membership'));
    const membership=state.me?.membership;
    if (activeMembership(state.me)) {
      section.append(notice('Your Franklin Community Membership is active. Do not make another payment.','active'));
      const list=el('ul',null,'check-list');
      list.append(el('li',`Status: ${membership.status}`));
      list.append(el('li',`Plan: ${membership.lookup_key || 'Franklin Community Membership'}`));
      if (membership.current_period_end) list.append(el('li',`Current access period through ${new Date(membership.current_period_end).toLocaleDateString()}`));
      section.append(list);
      section.append(button('Manage billing', async () => {
        try {const result=await request('/api/billing/portal',{method:'POST',body:{}}); location.assign(result.url);}
        catch(error){state.message=errorText(error); rerender();}
      }));
      return section;
    }

    const chosenProfile = state.profileId || params.get('profile') || '';
    const linked=(state.me?.profileLinks || []).find(row=>row.profile_id===chosenProfile);
    if (!linked) {
      section.append(notice('Connect the exact Franklin profile above before checkout can open.'));
      return section;
    }
    if (linked.authority_state !== 'VERIFIED') {
      section.append(notice('Profile authority verification is pending. No payment button is shown until verification is complete, so you cannot be charged before Franklin can attach membership correctly.'));
      return section;
    }
    if (!state.ready?.liveCheckoutEnabled) {
      section.append(notice('Secure checkout is temporarily unavailable. No payment can be created right now.'));
      return section;
    }

    section.append(notice('Profile verified. Secure Stripe checkout is available for this exact Franklin profile.'));
    const grid=el('div',null,'r29-plan-grid');
    const requestedPlan=String(params.get('plan')||'').toLowerCase();
    for (const [id,plan] of Object.entries(PLAN)) {
      const card=el('article',null,`r29-plan${id==='charter'?' featured':''}`);
      if(id==='charter') card.append(el('div','BEST LONG-TERM VALUE','r29-plan-badge'));
      card.append(el('h3',plan.label),el('p',plan.price,'r29-price'));
      const pay=button(`Continue to secure ${plan.price} checkout`, async () => {
        pay.disabled=true; state.message='Opening secure Stripe checkout…'; rerender(false);
        try {
          const result=await request('/api/membership/start',{method:'POST',body:{profileId:chosenProfile,lookupKey:plan.lookupKey}});
          location.assign(result.checkoutUrl);
        } catch(error) {state.message=errorText(error); rerender();}
      }, requestedPlan===id?'button primary':'button');
      card.append(pay); grid.append(card);
    }
    section.append(grid);
    section.append(el('p','Monthly and annual memberships renew until canceled. Charter is prepaid for 36 months and does not automatically renew. Payment does not buy factual accuracy, ranking, endorsement, credentials, leads or guaranteed results.','fine-print'));
    return section;
  }

  async function pollMembership(state, rerender) {
    if (!state.me || params.get('checkout') !== 'success') return;
    state.message='Payment returned successfully. Confirming Franklin membership activation…'; rerender(false);
    for (let attempt=0; attempt<12; attempt++) {
      try {
        await new Promise(resolve=>setTimeout(resolve, attempt ? 2500 : 500));
        state.me=await getMe();
        if (activeMembership(state.me)) {
          state.message='Payment confirmed and your Franklin membership is active.';
          rerender(); return;
        }
      } catch {}
    }
    state.message='Stripe returned successfully, but Franklin is still confirming membership activation. Do not pay again. Refresh this page shortly or contact Franklin Navigator support.';
    rerender();
  }

  async function initRoot(root) {
    const mode=root.dataset.membershipLiveMode || 'enroll';
    const state={ready:null,me:null,profileId:params.get('profile')||'',accountMode:'register',message:'Checking secure Franklin membership service…'};
    const render=(full=true) => {
      root.replaceChildren();
      if (state.message) root.append(notice(state.message));
      if (!state.ready) return;
      if (!state.ready.ok || !state.ready.liveCheckoutEnabled) root.append(notice('Franklin membership service is not ready for a new payment. No charge will be created.'));
      root.append(renderAccount(root,state,render));
      if (!state.me) return;
      if (mode==='status') {
        root.append(renderMembership(root,state,render));
        root.append(link('Membership setup','/membership-enroll/'));
        return;
      }
      root.append(renderProfile(root,state,render));
      root.append(renderMembership(root,state,render));
    };
    render();
    try {
      state.ready=await request('/ready');
      state.me=await getMe();
      state.message=state.ready.liveCheckoutEnabled?'Secure Franklin membership service is ready.':'Franklin membership service is online, but checkout is not open.';
      render();
      await pollMembership(state,render);
    } catch(error) {
      state.ready={ok:false,liveCheckoutEnabled:false}; state.message=errorText(error); render();
    }
  }

  function enhanceClaimPage() {
    if (location.pathname !== '/claim-profile/') return;
    const profileId=params.get('profile')||'';
    if (!VALID_PROFILE.test(profileId)) return;
    const target=$('.actions') || $('main');
    if (!target) return;
    target.append(link('Continue to secure membership setup',`/membership-enroll/?profile=${encodeURIComponent(profileId)}`,'button primary'));
  }

  for (const root of document.querySelectorAll('[data-membership-live-root]')) initRoot(root);
  enhanceClaimPage();
})();
