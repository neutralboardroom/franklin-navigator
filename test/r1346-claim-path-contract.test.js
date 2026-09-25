'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('R1346 runtime claim/recovery contract remains aligned',()=>{
  const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
  const security=fs.readFileSync(path.join(root,'lib/security.js'),'utf8');
  const recovery=fs.readFileSync(path.join(root,'lib/account-recovery.js'),'utf8');
  const reviewer=fs.readFileSync(path.join(root,'lib/reviewer-console.js'),'utf8');
  const reviewerHtml=fs.readFileSync(path.join(root,'review/index.html'),'utf8');
  assert.match(server,/FR-NAV1\.30\.61-HF3\.13\.43/);
  assert.match(server,/PASSWORD_MIN_LENGTH/);
  assert.match(server,/review_state/);
  assert.match(server,/review_revision/);
  assert.match(server,/review_updated_at/);
  assert.match(security,/PASSWORD_MIN_LENGTH = 8/);
  assert.match(recovery,/password\.length<PASSWORD_MIN_LENGTH/);
  assert.match(recovery,/password-reset instructions have been sent/);
  assert.doesNotMatch(recovery,/at least 12 characters/);
  assert.match(reviewer,/password\.length<PASSWORD_MIN_LENGTH/);
  assert.doesNotMatch(reviewer,/password\.length<12/);
  assert.match(reviewerHtml,/minlength="8"/);
  assert.doesNotMatch(reviewerHtml,/minlength="12"/);
});
