'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const reviewer=fs.readFileSync('lib/reviewer-console.js','utf8');
const recovery=fs.readFileSync('lib/account-recovery.js','utf8');
const security=fs.readFileSync('lib/security.js','utf8');
const server=fs.readFileSync('server.js','utf8');
const reviewHtml=fs.readFileSync('review/index.html','utf8');
const reviewApp=fs.readFileSync('review/app.js','utf8');
const resetHtml=fs.readFileSync('review/reset.html','utf8');
const resetJs=fs.readFileSync('review/reset.js','utf8');

test('R1355 reviewer authentication uses the canonical Franklin password policy',()=>{
  assert.match(security,/PASSWORD_MIN_LENGTH = 8/);
  assert.match(reviewer,/password\.length<PASSWORD_MIN_LENGTH/);
  assert.doesNotMatch(reviewer,/password\.length<12/);
  assert.match(reviewHtml,/minlength="8"/);
  assert.doesNotMatch(reviewHtml,/minlength="12"/);
});

test('R1355 reviewer sign-in has no first-sign-in email code dependency',()=>{
  assert.doesNotMatch(reviewHtml,/email-code|confirmation code \(first sign-in only\)/i);
  assert.doesNotMatch(reviewApp,/\$\('email-code'\)|emailCode:/);
  assert.match(reviewApp,/Authorized Franklin account/);
  assert.match(reviewApp,/history\.replaceState/);
});

test('R1355 reviewer recovery hands off to secure public link recovery',()=>{
  assert.match(resetHtml,/account-recovery\/\?return=reviewer/);
  assert.doesNotMatch(resetHtml,/email-code|one-time-code|name="emailCode"/i);
  assert.match(resetJs,/franklinReviewerOriginProfile/);
  assert.match(resetJs,/return','reviewer/);
});

test('R1355 password reset email uses a branded HTML action and remains single-use',()=>{
  assert.match(server,/Franklin Navigator <\$\{resetEmailConfig\.from\}>/);
  assert.match(server,/>Reset your password<\/a>/);
  assert.match(server,/within 30 minutes/);
  assert.match(recovery,/update franklin_recovery_tokens set consumed_at=now\(\)/);
  assert.match(recovery,/delete from franklin_sessions/);
  assert.match(recovery,/delete from franklin_review_sessions/);
});

test('R1355 recovery context carries reviewer return without granting profile authority',()=>{
  assert.match(recovery,/returnMode=body\.returnMode==='reviewer'\?'reviewer':''/);
  assert.match(recovery,/sendResetEmail\(account\.email,raw,profileId,returnMode\)/);
  assert.doesNotMatch(recovery,/authority_state='VERIFIED'/);
});
