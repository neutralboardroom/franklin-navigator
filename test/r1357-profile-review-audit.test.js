'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const reviewer=()=>fs.readFileSync('lib/reviewer-console.js','utf8');
const app=()=>fs.readFileSync('review/app.js','utf8');
const server=()=>fs.readFileSync('server.js','utf8');

test('R1357 forbids ordinary reviewer self-decisions without first-party exception',()=>{
  const src=reviewer();
  assert.ok(src.includes("FRANKLIN_REVIEWER_CONSOLE_4"));
  assert.match(src,/if\(who&&b\.accountId===who\.account_id\)fail\('REVIEW_SELF_DECISION_FORBIDDEN',403\)/);
  assert.doesNotMatch(src,/firstPartyOwnerException/);
  assert.match(src,/selfReviewConflict:Boolean/);
});

test('R1357 reviewer UI exposes self-conflict and blocks consequential choices',()=>{
  const src=app();
  assert.ok(src.includes('selfReviewConflict'));
  assert.ok(src.includes('you cannot review your own profile-access request'));
  assert.match(src,/if\(selected\.selfReviewConflict\)\{blocked=true/);
  assert.ok(src.includes('Back to review requests'));
});

test('R1357 reviewer sign-in gives visible progress feedback',()=>{
  const src=app();
  assert.ok(src.includes("signingIn:'Signing in…'"));
  assert.ok(src.includes("opening:'Opening secure reviewer workspace…'"));
  assert.ok(src.includes("$('login-button').textContent=t('signingIn')"));
});

test('R1357 reviewer evidence shows the exact submitted destination and warns on generic homepages',()=>{
  const src=app();
  assert.ok(src.includes('function evidenceLink'));
  assert.ok(src.includes("u.hostname+(u.pathname==='/'?'':u.pathname)+(u.search||'')"));
  assert.ok(src.includes('This evidence link points only to a homepage.'));
});

test('R1357 protects the official Franklin Navigator profile from new ordinary claim links',()=>{
  const src=server();
  assert.ok(src.includes("profileId==='FR-ORG-b00c0ace7943973c'"));
  assert.ok(src.includes('PROFILE_SYSTEM_MANAGED'));
  assert.ok(src.includes('reused:true'));
});

test('R1357 release identity is current',()=>{
  assert.ok(server().includes('FR-NAV1.30.58-HF3.13.40'));
});
