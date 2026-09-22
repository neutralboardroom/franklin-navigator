'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const prod=JSON.parse(fs.readFileSync(path.join(root,'PRODUCTION_RELEASE.json'),'utf8'));
assert.equal(prod.release,'FR-NAV1.30.59-HF3.13.41');
assert.equal(prod.base,'FR-NAV1.30.57-HF3.13.39');
const r=prod.r1356;
assert(r&&r.runtime);
assert(prod.r1357&&prod.r1357.materialScope==='OWNER_LIVE_PROFILE_CLAIM_MANAGEMENT_SCREENSHOT_AUDIT');
assert(prod.r1358&&prod.r1358.materialScope==='CLAIM_CORRECTION_REVIEW_DEPTH_AND_RECOVERY');
assert.equal(r.runtime.commit,'ed02b303120447f1d7a45849272cb0c681fa1f3f');
assert.equal(r.runtime.qualificationResult,'PASS');
assert.equal(r.noResidentFeatureRemoval,true);
assert.equal(r.noProfileFactChange,true);
assert.equal(r.commercial.communityMembershipAnnualUsd,35);
assert.equal(r.commercial.basicProfileManagementFree,true);

const runtime=path.join(root,'runtime','franklin-membership');
const files={
  server:path.join(runtime,'server.js'),
  recovery:path.join(runtime,'lib','account-recovery.js'),
  owner:path.join(runtime,'lib','owner-review-setup.js'),
  reviewer:path.join(runtime,'lib','reviewer-console.js')
};
// The main/public repository keeps only a partial runtime mirror. The exact-source
// artifact builder injects the complete qualified runtime commit before fresh-
// extraction tests, at which point these source-level security assertions become mandatory.
if(Object.values(files).every(fs.existsSync)){
  const server=fs.readFileSync(files.server,'utf8');
  const recovery=fs.readFileSync(files.recovery,'utf8');
  const owner=fs.readFileSync(files.owner,'utf8');
  const reviewer=fs.readFileSync(files.reviewer,'utf8');

  assert.match(server,/FR-NAV1\.30\.59-HF3\.13\.41/);
  assert.match(recovery,/FRANKLIN_ACCOUNT_RECOVERY_R1356/);
  assert.match(recovery,/delete from franklin_review_sessions where account_id=\$1/);
  assert.doesNotMatch(recovery,/delete from franklin_review_sessions[^\n]*\.catch\(/);

  assert.match(owner,/delete from franklin_review_sessions where account_id=\$1/);
  assert.doesNotMatch(owner,/delete from franklin_review_sessions[^\n]*\.catch\(/);

  assert.match(reviewer,/confirmEmail/);
  assert.match(reviewer,/email_verified_at/);
  assert.match(reviewer,/!r\.email_verified_at/);
  assert.match(reviewer,/!current\.email_verified_at/);
  assert.match(reviewer,/REVIEW_EMAIL_CONFIRMATION_REQUIRED|confirmEmail/);
}
console.log(JSON.stringify({result:'PASS',release:prod.release,runtimeCommit:r.runtime.commit,artifactRuntimeSourceAssertions:Object.values(files).every(fs.existsSync)}));
