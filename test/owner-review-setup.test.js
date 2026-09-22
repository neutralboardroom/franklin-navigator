'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {ownerBinding,confirmationConfig,proofHash,resetPasswordWithEmailProof}=require('../lib/owner-review-setup');
const {createReviewerConsole,parseBindings}=require('../lib/reviewer-console');
const owner={accountId:'acct_SYNTHETICOWNER12345',reviewerId:'synthetic-reviewer',evidenceReceipt:'sha256:'+'a'.repeat(64)};
const issuedAt='2026-01-01T00:00:00Z';
const c={accountId:owner.accountId,bindingDigest:'b'.repeat(64),codeSha256:'c'.repeat(64),emailSha256:'d'.repeat(64),nonce:'e'.repeat(64),issuedAt,expiresAt:'2026-01-02T00:00:00Z'};
test('absent owner assignment creates no permission',()=>assert.equal(ownerBinding(''),null));
test('explicit complete owner assignment is retained',()=>assert.deepEqual(ownerBinding(JSON.stringify(owner)),owner));
for(const p of [{accountId:'reviewer@example.invalid'},{admin:true},{evidenceReceipt:'unproved'},{reviewerId:'../x'}])test('invalid owner binding fails '+JSON.stringify(p),()=>assert.throws(()=>ownerBinding(JSON.stringify({...owner,...p}))));
test('valid limited confirmation config is accepted',()=>assert.deepEqual(confirmationConfig(JSON.stringify(c)),c));
for(const p of [{expiresAt:'2026-01-02T00:00:01Z'},{expiresAt:issuedAt},{issuedAt:'invalid'},{nonce:'short'},{code:'not allowed'},{codeSha256:'xyz'}])test('invalid confirmation config rejected '+JSON.stringify(p),()=>assert.throws(()=>confirmationConfig(JSON.stringify({...c,...p}))));
test('proof digest binds nonce, account and exact email',()=>{const x=proofHash(c,'synthetic_code_123456789');for(const p of [{nonce:'f'.repeat(64)},{accountId:'acct_OTHER12345'},{emailSha256:'f'.repeat(64)}])assert.notEqual(proofHash({...c,...p},'synthetic_code_123456789'),x);});
test('owner assignment supplements but does not replace existing reviewers',()=>{const other={...owner,accountId:'acct_SYNTHETICOTHER12345',reviewerId:'other-reviewer'};const api=createReviewerConsole({env:{SESSION_SECRET:'s'.repeat(40),MEMBER_REVIEWERS:other.reviewerId,REVIEWER_ACCOUNT_BINDINGS:JSON.stringify([other]),OWNER_REVIEWER_BINDING:JSON.stringify(owner)},profileNames:{}});assert.equal(api.configured,true);assert.deepEqual(api.allowedReviewerIds.sort(),['other-reviewer','synthetic-reviewer']);});
test('conflicting owner and existing assignments fail closed',()=>{const api=createReviewerConsole({env:{SESSION_SECRET:'s'.repeat(40),MEMBER_REVIEWERS:'other-reviewer',REVIEWER_ACCOUNT_BINDINGS:JSON.stringify([{...owner,reviewerId:'other-reviewer'}]),OWNER_REVIEWER_BINDING:JSON.stringify(owner)},profileNames:{}});assert.equal(api.configured,false);});

test('R1356 owner recovery fails closed if reviewer-session invalidation fails',async()=>{
  const email='reviewer@example.invalid',code='synthetic_code_12345678901';
  const binding={reviewerId:owner.reviewerId,digest:'b'.repeat(64)};
  const proof={accountId:owner.accountId,bindingDigest:binding.digest,emailSha256:require('node:crypto').createHash('sha256').update(email).digest('hex'),nonce:'f'.repeat(64),issuedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString()};
  proof.codeSha256=proofHash(proof,code);
  let audited=false;
  const client={query:async(sql,vals=[])=>{
    if(sql.startsWith('select password_hash,email_normalized,email_verified_at'))return {rows:[{password_hash:'old-hash',email_normalized:email,email_verified_at:null}],rowCount:1};
    if(sql.startsWith('select token_hash from franklin_recovery_tokens'))return {rows:[],rowCount:0};
    if(sql.startsWith('insert into franklin_recovery_tokens'))return {rows:[{token_hash:vals[0]}],rowCount:1};
    if(sql.startsWith('update franklin_accounts set password_hash='))return {rows:[],rowCount:1};
    if(sql.startsWith('delete from franklin_sessions'))return {rows:[],rowCount:1};
    if(sql.startsWith('delete from franklin_review_sessions'))throw new Error('review session delete failed');
    throw new Error('unexpected query '+sql);
  }};
  const d={tx:async fn=>fn(client),audit:async()=>{audited=true;}};
  await assert.rejects(()=>resetPasswordWithEmailProof(d,{OWNER_REVIEWER_EMAIL_CONFIRMATION:JSON.stringify(proof)},{account_id:owner.accountId,password_hash:'old-hash'},binding,email,code,'new secure password 123','r15'),/review session delete failed/);
  assert.equal(audited,false);
});
