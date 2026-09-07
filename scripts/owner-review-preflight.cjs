'use strict';
// Optional, bounded READ-ONLY deployment check. Never grants a role, changes account
// verification, creates a session, publishes content, or performs a provider write.
const crypto=require('node:crypto');
const digest=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
function settings(env){
  const accountId=String(env.OWNER_REVIEW_PREFLIGHT_ACCOUNT||'').trim();
  if(!accountId)return null;
  const emailSha256=String(env.OWNER_REVIEW_PREFLIGHT_EMAIL_SHA256||'').trim();
  const assignmentSha256=String(env.OWNER_REVIEW_PREFLIGHT_ASSIGNMENT_SHA256||'').trim();
  if(!/^acct_[A-Za-z0-9]{8,80}$/.test(accountId)||!(/^[a-f0-9]{64}$/.test(emailSha256)&&/^[a-f0-9]{64}$/.test(assignmentSha256)))throw Error('PREFLIGHT_CONFIGURATION_INVALID');
  return{accountId,emailSha256,assignmentSha256};
}
async function inspect(client,cfg){
  await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try{
    await client.query("SET LOCAL statement_timeout='5000ms'");
    const found=await client.query(`SELECT community,state,email_normalized,email_verified_at IS NOT NULL AS email_verified,length(password_hash)>30 AS credential_present FROM franklin_accounts WHERE account_id=$1`,[cfg.accountId]);
    const a=found.rows.length===1?found.rows[0]:null;
    const checks={exactlyOneAccount:found.rows.length===1,franklinAccount:a?.community==='FRANKLIN_TN',active:a?.state==='ACTIVE',expectedEmailMatches:Boolean(a&&digest(a.email_normalized)===cfg.emailSha256),emailVerified:a?.email_verified===true,credentialPresent:a?.credential_present===true};
    const ok=Object.values(checks).every(x=>x===true);
    let memberships=null,reviewHistory=null;
    if(ok){
      const m=await client.query(`SELECT count(*)::integer AS total,count(*) FILTER (WHERE m.status IN ('ACTIVE','ACTIVE_CANCELING','GRACE') AND e.access_state IN ('ACTIVE','ACTIVE_CANCELING','GRACE') AND (e.expires_at IS NULL OR e.expires_at>now()))::integer AS active_access,count(*) FILTER (WHERE m.first_value_completed_at IS NOT NULL)::integer AS first_value_recorded FROM franklin_memberships m LEFT JOIN franklin_entitlements e USING(membership_id) WHERE m.account_id=$1`,[cfg.accountId]);
      memberships=m.rows[0];
      const t=await client.query("SELECT to_regclass('franklin_reviewer_sessions') IS NOT NULL AS reviewer_schema_available");
      reviewHistory={reviewerSchemaAvailable:t.rows[0]?.reviewer_schema_available===true};
    }
    await client.query('COMMIT');
    return{event:'FRANKLIN_OWNER_REVIEW_PREFLIGHT',schemaVersion:'franklin.readonly-owner-preflight.v1',at:new Date().toISOString(),mode:'READ_ONLY_NO_SESSION_OR_ROLE_CHANGE',accountReferenceSha256:digest(cfg.accountId),assignmentSha256:cfg.assignmentSha256,checks,eligibleForExplicitReviewerBinding:ok,memberships,reviewHistory,actualPasswordAuthenticationPerformed:false,providerPaymentVerificationPerformed:false,productMutations:0};
  }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}
}
async function main(env=process.env){
  let cfg,pool,client;
  try{
    cfg=settings(env);if(!cfg)return;
    if(!env.DATABASE_URL)throw Error('PREFLIGHT_DATABASE_MISSING');
    const {Pool}=require('pg');pool=new Pool({connectionString:env.DATABASE_URL,max:1,connectionTimeoutMillis:8000,idleTimeoutMillis:1000,ssl:env.PGSSL_DISABLE==='true'?false:{rejectUnauthorized:false}});
    client=await pool.connect();console.log(JSON.stringify(await inspect(client,cfg)));
  }catch(error){console.error(JSON.stringify({event:'FRANKLIN_OWNER_REVIEW_PREFLIGHT',mode:'READ_ONLY_NO_SESSION_OR_ROLE_CHANGE',at:new Date().toISOString(),eligibleForExplicitReviewerBinding:false,errorCode:/^PREFLIGHT_[A-Z_]+$/.test(error.message)?error.message:'PREFLIGHT_READ_UNAVAILABLE',productMutations:0}));}
  finally{if(client)client.release();if(pool)await pool.end().catch(()=>{});}
}
module.exports={settings,inspect,digest};if(require.main===module)main();
