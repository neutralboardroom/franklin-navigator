'use strict';
const fs=require('fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const profile=read('dist/assets/r1330-profile.js');
const live=read('dist/assets/membership-live.js');
const corrections=read('dist/corrections/index.html');
const control=read('dist/assets/hf35-profile-control.js');
const i18n=read('dist/assets/r37-i18n.js');
const checks=[];const ok=(name,v)=>{assert.ok(v,name);checks.push(name)};

ok('official Franklin Navigator profile uses protected administrator presentation',
  profile.includes("isNavigatorSelf&&!viewerLink")&&profile.includes("actionText='Correct factual listing details'")&&profile.includes('protected administrator access'));
ok('ordinary unclaimed profiles use clear free claim CTA',
  profile.includes("labelText='Management not yet verified'")&&profile.includes("actionText='Manage this profile — free'"));
ok('public profile uses consistent correction and removal wording',
  profile.includes('Correct factual listing details')&&profile.includes('Request removal'));
ok('direct profile-access path protects official platform profile',
  live.includes("state.selected.i===SELF_ID")&&live.includes('Ordinary public claims are not accepted'));
ok('pending state is status-aware and names Franklin Navigator team',
  live.includes("title.textContent='Access request pending.'")&&live.includes('The Franklin Navigator team reviews the submitted evidence'));
ok('reviewer handoff no longer places account email in URL fragment',
  !live.includes("reviewerContext.set('email'")&&live.includes('Open secure reviewer workspace'));
ok('profile switcher uses plain language',
  live.includes("summary.textContent='Wrong profile? Choose another'"));
ok('correction/removal page exposes required fields and direct removal action',
  corrections.includes('Explain the removal request <span class="fine-print">(required)</span>')&&corrections.includes('name="removalCategory"')&&
  corrections.includes('data-switch-removal')&&corrections.includes('data-switch-correction'));
ok('correction/removal page offers evidence for both request types',
  corrections.includes('Official source or evidence link (optional)')&&!corrections.includes('data-correction-only>Official source'));
ok('bound correction request canonicalizes profile URL and provides return path',
  control.includes("form.elements.url.value=profilePage")&&control.includes('Back to this profile'));
ok('removal requires reason and confirmation before submission',
  control.includes("clean(fd.get('removalReason'),1800).length<10")&&control.includes('Submit this removal request for this exact profile?'));
ok('signed-in correction form can reuse account contact details without requiring sign-in',
  control.includes("fetch(API+'/api/accounts/me'")&&control.includes("set('requesterEmail'"));
ok('Spanish parity covers audited high-value labels',
  i18n.includes("'Wrong profile? Choose another':'¿Perfil equivocado? Elija otro'")&&
  i18n.includes("'Correct public facts':'Corregir datos públicos'")&&
  i18n.includes("'Open secure reviewer workspace':'Abrir espacio seguro de revisión'"));

console.log(JSON.stringify({result:'PASS',release:'FR-NAV1.30.58-HF3.13.40',checks:checks.length,items:checks},null,2));
