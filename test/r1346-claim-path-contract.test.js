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
  assert.match(server,/FR-NAV1\.30\.53-HF3\.13\.35/);
  assert.match(server,/PASSWORD_MIN_LENGTH/);
  assert.match(server,/review_state/);
  assert.match(server,/review_revision/);
  assert.match(server,/review_updated_at/);
  assert.match(security,/PASSWORD_MIN_LENGTH = 8/);
  assert.match(recovery,/password\.length<PASSWORD_MIN_LENGTH/);
  assert.match(recovery,/password-reset instructions have been sent/);
  assert.doesNotMatch(recovery,/at least 12 characters/);
});
