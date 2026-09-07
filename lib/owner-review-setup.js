'use strict';
// An explicit owner assignment is not email verification. Confirmation additionally
// requires the existing account password and the one-time code delivered to its inbox.
const {sha256,safeEqual}=require('./security');
const HEX=/^[a-f0-9]{64}$/;
const fail=(code,status=401)=>{throw Object.assign(new Error(code),{code,status});};
function ownerBinding(raw){
 if(!raw)return null;
 const b=JSON.parse(raw);
 if(!b||Array.isArray(b)||Object.keys(b).sort().join(',')!=='accountId,evidenceReceipt,reviewerId'||!/^acct_[A-Za-z0-9]{8,80}$/.test(b.accountId)||!/^[A-Za-z0-9_-]{3,80}$/.test(b.reviewerId)||!/^sha256:[a-f0-9]{64}$/.test(b.evidenceReceipt))throw Error('OWNER_REVIEW_BINDING_INVALID');
 return b;
}
function confirmationConfig(raw){
 if(!raw)return null;
 const c=JSON.parse(raw),keys='accountId,bindingDigest,codeSha256,emailSha256,expiresAt,issuedAt,nonce';
 if(!c||Array.isArray(c)||Object.keys(c).sort().join(',')!==keys||!/^acct_[A-Za-z0-9]{8,80}$/.test(c.accountId)||!HEX.test(c.bindingDigest)||!HEX.test(c.codeSha256)||!HEX.test(c.emailSha256)||!HEX.test(c.nonce)||!Number.isFinite(Date.parse(c.issuedAt))||!Number.isFinite(Date.parse(c.expiresAt))||Date.parse(c.expiresAt)<=Date.parse(c.issuedAt)||Date.parse(c.expiresAt)-Date.parse(c.issuedAt)>86400000)throw Error('OWNER_EMAIL_CONFIRMATION_INVALID');
 return c;
}
function proofHash(c,code){return sha256(JSON.stringify(['FRANKLIN_REVIEW_EMAIL_V1',c.nonce,c.accountId,c.emailSha256,String(code).trim()]));}
async function confirmEmail(d,env,a,binding,email,code,reqId){
 let cfg;try{cfg=confirmationConfig(env.OWNER_REVIEWER_EMAIL_CONFIRMATION);}catch{fail('REVIEW_EMAIL_CONFIRMATION_UNAVAILABLE',503);}
 if(!cfg||cfg.accountId!==a.account_id||!safeEqual(cfg.bindingDigest,binding.digest)||!safeEqual(cfg.emailSha256,sha256(email)))fail('REVIEW_SIGN_IN_FAILED');
 const now=Date.now();
 if(now<Date.parse(cfg.issuedAt)||now>=Date.parse(cfg.expiresAt))fail('REVIEW_EMAIL_CONFIRMATION_EXPIRED',401);
 if(typeof code!=='string'||!/^[A-Za-z0-9_-]{22,86}$/.test(code.trim())||!safeEqual(proofHash(cfg,code),cfg.codeSha256))fail('REVIEW_EMAIL_CONFIRMATION_REQUIRED',401);
 await d.tx(async c=>{
  // Serialize confirmation and account changes. Do not accept a proof for a changed
  // email/password, suspended account, another community, or an already used nonce.
  const current=(await c.query("select password_hash,email_normalized,email_verified_at from franklin_accounts where account_id=$1 and community='FRANKLIN_TN' and state='ACTIVE' for update",[a.account_id])).rows[0];
  if(!current||current.password_hash!==a.password_hash||current.email_normalized!==email)fail('REVIEW_SIGN_IN_FAILED');
  const used=await c.query("insert into franklin_recovery_tokens(token_hash,account_id,purpose,expires_at,consumed_at) values($1,$2,'REVIEWER_EMAIL_VERIFICATION_V1',$3,now()) on conflict do nothing returning token_hash",[sha256('franklin-review-email:'+cfg.nonce),a.account_id,cfg.expiresAt]);
  if(used.rowCount!==1)fail('REVIEW_EMAIL_CONFIRMATION_USED',401);
  await c.query('update franklin_accounts set email_verified_at=coalesce(email_verified_at,now()),updated_at=now() where account_id=$1',[a.account_id]);
  await d.audit(c,'ACCOUNT',a.account_id,'REVIEWER_EMAIL_CONFIRMED','REVIEWER',binding.reviewerId,reqId,{proof:'EMAIL_CODE_AND_EXISTING_PASSWORD',assignmentDigest:binding.digest});
 });
}
module.exports={ownerBinding,confirmationConfig,proofHash,confirmEmail};
