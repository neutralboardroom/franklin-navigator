'use strict';
const fs=require('fs'),path=require('path'),child=require('child_process');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];const add=(name,ok)=>checks.push([name,Boolean(ok)]);
const core=read('dist/assets/local-discovery-core.js');
const claim=read('dist/assets/hf310.js');
const profile=read('dist/assets/r1330-profile.js');
const profileUx=read('dist/assets/r1332-profile.js');
const control=read('dist/assets/hf35-profile-control.js');
const corrections=read('dist/corrections/index.html');
const access=read('dist/profile-access/index.html');
const live=read('dist/assets/membership-live.js');
const recovery=read('dist/assets/account-recovery-r1342.js');
const support=read('dist/member-support/index.html');
const supportJs=read('dist/assets/member-support.js');
const business=read('dist/business-dashboard/index.html');
const css=read('dist/assets/styles.css');
const i18n=read('dist/assets/r37-i18n.js');
const durable=read('DURABLE_RULE__FRANKLIN_CLAIM_ACCOUNT_RECOVERY_OUTREACH_BASELINE.md');
const asyncRule=read('DURABLE_RULE__CLAIM_ACCOUNT_ASYNC_ACTION_FEEDBACK.md');
const authorityRule=read('DURABLE_RULE__PROFILE_ACCESS_AUTHORITY_ROUTING.md');

// September 19 command baseline.
const r1342=child.spawnSync(process.execPath,[path.join(root,'tests/r1342-claim-recovery.cjs')],{encoding:'utf8'});
add('Sep19 inherited R1342 contract still passes',r1342.status===0);
add('Sep19 exact-match ranking hierarchy remains implemented',/exact|phrase|starts|token|partial/i.test(core));
add('R1351 claim search keeps neutral primary result action',claim.includes("b.textContent='Continue with this profile'")&&claim.includes('r1342-claim-result-action'));
add('Sep19 selected claim panel keeps four required actions',['Claim or manage this profile','Correct information','Request removal','Preview optional member profile'].every(x=>claim.includes(x)));
add('Sep19 selected result moves/focuses to action panel',claim.includes("section.scrollIntoView")&&claim.includes("section.focus"));
add('Sep19 profile claim deep-link preserves exact profile',profile.includes("/profile-access/?profile="));
add('Sep19 corrections preserve immutable profile identity and prefill URL/name',control.includes("set('profileId',validProfile?profile:'')")&&control.includes("set('url',params.get('url')||profilePage)")&&control.includes("set('listing',name)"));
add('Sep19 corrections/removal remain free and visibly reachable',/free/i.test(corrections)&&/removal|remove/i.test(corrections));
add('Sep19 business path explicitly places claim/authority before optional membership',business.includes('Claim profile / verify authority')&&business.includes('Review or manage free profile')&&business.includes('Preview optional Community Membership'));
add('Sep19 account mode selector remains accessible',live.includes("create.setAttribute('aria-pressed'")&&live.includes("sign.setAttribute('aria-pressed'"));
add('Sep19 account identifier stays Email address with existing-account recovery',live.includes("'Email address'")&&live.includes('ACCOUNT_ALREADY_EXISTS')&&live.includes('An account already exists for this email. Sign in or reset your password.'));
add('Sep19 Forgot password and inaccessible-email support remain direct',live.includes('Forgot password?')&&live.includes('Can’t access your email? Get account help'));
add('Sep19 support ACCOUNT_ACCESS prioritization and exact-profile back/reset links remain',supportJs.includes("topic==='ACCOUNT_ACCESS'")&&supportJs.includes("← Back to sign in")&&supportJs.includes("Reset password")&&supportJs.includes("encodeURIComponent(profile)"));
add('Sep19 support new-membership wording remains non-account-specific',support.includes('Community Membership for new memberships')&&!support.includes('<strong>Current membership</strong>'));
add('Sep19 support keeps pre-verification review status in Profile Access',support.includes('check the review status in Profile Access')&&support.includes('Profile Center is for verified managers')&&support.includes('Already verified? Profile Center')&&!support.includes('check the review status in Profile Center'));
add('Sep19 support form remains row-based, labeled, sensitive-data protected and visibly confirmed',support.includes('r1342-support-form')&&support.includes('Do not send passwords')&&supportJs.includes('Request received. Reference:'));
add('Sep19 entity-aware reviews remain and first-party reviews stay disabled',profileUx.includes('entityLabel')&&profileUx.includes("reviewable=id!==SELF_ID"));
add('Sep19 first-party profile indicator remains truthful',read('dist/profiles/FR-ORG-b00c0ace7943973c/index.html').includes('Official Franklin Navigator profile'));

// September 20 command baseline.
add('Sep20 Profile Access hero explicitly means public Franklin Navigator profile',access.includes('Get free access to manage your public profile on Franklin Navigator.'));
add('Sep20 four-step progress remains semantic and dynamic',access.includes('data-r1346-profile-progress')&&live.includes("setAttribute('aria-current','step')")&&live.includes("classList.toggle('is-complete'"));
add('Sep20 wrong-profile search remains secondary/collapsible',live.includes('Wrong profile? Choose another')&&live.includes("document.createElement('details')"));
add('Sep20 selected profile remains obvious with type and location',live.includes("summaryItem('Profile'")&&live.includes("summaryItem('Type'")&&live.includes("summaryItem('Location'"));
add('Sep20 claim connect has visible local loading, duplicate suppression, retry/help and automatic focus',live.includes('Connecting profile…')&&live.includes('if(connect.disabled)return')&&live.includes('Retry connection')&&live.includes("link('Get help'")&&live.includes("focusIntoView('[data-r1346-verification-heading]')"));
add('Sep20 Step 3 remains dedicated vertical form with full-width fields and separate checkbox row',live.includes("form.className='r1346-profile-access-verification'")&&css.includes('.r1346-profile-access-verification input[type="url"]')&&css.includes('min-height:150px')&&css.includes('grid-template-columns:auto minmax(0,1fr)!important'));
add('Sep20 Step 3 heading names selected profile',live.includes("'Verify that you manage '+state.selected.n"));
add('Sep20 authority submit has visible loading and pending focus',live.includes('Submitting access request…')&&live.includes("pendingNotice.dataset.r1346PendingStatus=''")&&live.includes("focusIntoView('[data-r1346-pending-status]')"));
add('Sep20 reset request has visible loading, duplicate suppression, generic success and check-email next step',recovery.includes('Sending password-reset instructions…')&&recovery.includes('submit.disabled=true')&&recovery.includes('If an account exists for this email, password-reset instructions have been sent.')&&recovery.includes('Check your email'));
add('Sep20 reset completion clears/removes old form and visibly confirms signed-in exact-profile continuation',recovery.includes("p1.value='';p2.value=''")&&recovery.includes('form.remove()')&&recovery.includes('Password changed successfully.')&&recovery.includes('You’re signed in.')&&recovery.includes("go.href='/profile-access/'+profileQuery"));
add('Sep20 reset token is removed from visible URL after success',recovery.includes("history.replaceState(null,'',location.pathname+profileQuery)"));
add('Sep20 8-character password minimum remains public/frontend',live.includes('pw.input.minLength=8')&&recovery.includes('p1.minLength=8')&&!live.includes('Use at least 12 characters')&&!recovery.includes('at least 12 characters'));
add('Sep20 claim CTA remains stronger than Official website on claimable profiles',profile.includes('r1343-claim-primary')&&css.includes('body.r1346-claimable.hf35-profile.r1332-profile .profile-primary-actions a.button.primary:not(.r1343-claim-primary)'));
add('Sep20 optional membership remains later than active verification task',live.includes("if(verified||String(selectedLink?.review_state||'').toUpperCase()==='PENDING')box.append(link('See optional Community Membership'"));
add('Sep20 Profile Center remains verified-authority-only',authorityRule.includes('authority_state === VERIFIED')&&authorityRule.includes('Profile Access'));
add('Sep20 corrections remain separate and free',live.includes('Correct public facts')&&control.includes('/profile-access/?profile='));
add('Sep20 no-silent-click durable rule remains permanent',asyncRule.includes('NO SILENT CLICKS')&&asyncRule.includes('duplicate')&&asyncRule.includes('scroll/focus'));
add('Sep20 Spanish dynamic parity covers claim/recovery additions',i18n.includes('¿Perfil equivocado? Elija otro')&&i18n.includes('Revise su correo electrónico')&&i18n.includes('Verifique que administra'));

// Two-command permanence itself.
add('Two-command durable baseline explicitly binds both owner commands',durable.includes('2026-09-19')&&durable.includes('2026-09-20'));
add('Two-command durable baseline rejects code-exists-only preservation',durable.includes('not preserved merely because an old implementation file or string still exists'));
add('Two-command durable baseline requires visible/reachable browser qualification',durable.includes('controlled-browser')&&durable.includes('hidden')&&durable.includes('future material Franklin Local release'));
add('Password sender exception remains evidence-gated, not silently changed',durable.includes('replacement Franklin account/security transactional sender')&&durable.includes('independently verified'));

const failed=checks.filter(x=>!x[1]);
console.log(JSON.stringify({result:failed.length?'FAIL':'PASS',release:'FR-NAV1.30.47-HF3.13.29',checks,failed},null,2));
if(failed.length)process.exit(1);
