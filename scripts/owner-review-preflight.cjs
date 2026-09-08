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
    let memberships=null,reviewHistory=null,authenticatedLifecycle=null,memberWorkflow=null;
    if(ok){
      const m=await client.query(`SELECT count(*)::integer AS total,count(*) FILTER (WHERE m.status IN ('ACTIVE','ACTIVE_CANCELING','GRACE') AND e.access_state IN ('ACTIVE','ACTIVE_CANCELING','GRACE') AND (e.expires_at IS NULL OR e.expires_at>now()))::integer AS active_access,count(*) FILTER (WHERE m.first_value_completed_at IS NOT NULL)::integer AS first_value_recorded FROM franklin_memberships m LEFT JOIN franklin_entitlements e USING(membership_id) WHERE m.account_id=$1`,[cfg.accountId]);
      memberships=m.rows[0];
      const t=await client.query("SELECT to_regclass('franklin_review_sessions') IS NOT NULL AS reviewer_schema_available,to_regclass('franklin_member_publications') IS NOT NULL AS publication_schema_available,to_regclass('franklin_member_value_receipts') IS NOT NULL AS value_schema_available,to_regclass('franklin_member_drafts') IS NOT NULL AS draft_schema_available,to_regclass('franklin_representation_reviews') IS NOT NULL AS representation_schema_available");
      const schemas=t.rows[0]||{};
      const reviewSession=schemas.reviewer_schema_available?await client.query(`SELECT count(*)::integer AS active_sessions,max(created_at) AS latest_created_at,max(expires_at) AS latest_expires_at FROM franklin_review_sessions WHERE account_id=$1 AND expires_at>now()`,[cfg.accountId]):{rows:[{active_sessions:0,latest_created_at:null,latest_expires_at:null}]};
      const recentAuth=await client.query(`SELECT count(*)::integer AS recent_auth_events,max(created_at) AS latest_auth_at FROM franklin_audit_log WHERE actor_type='ACCOUNT' AND actor_ref_hash=$1 AND action_type='REVIEW_SESSION_CREATED' AND created_at>now()-interval '6 hours'`,[digest(cfg.accountId)]);
      const regularSession=await client.query(`SELECT count(*)::integer AS active_sessions,max(last_seen_at) AS latest_seen_at FROM franklin_sessions WHERE account_id=$1 AND expires_at>now()`,[cfg.accountId]);
      const lifecycle=await client.query(`
        SELECT
          count(*) FILTER (WHERE m.status IN ('ACTIVE','ACTIVE_CANCELING','GRACE') AND e.access_state IN ('ACTIVE','ACTIVE_CANCELING','GRACE') AND (e.expires_at IS NULL OR e.expires_at>now()))::integer AS active_memberships,
          count(*) FILTER (WHERE l.authority_state='VERIFIED')::integer AS verified_profile_links,
          count(*) FILTER (WHERE m.stripe_customer_id IS NOT NULL)::integer AS customer_bound_memberships,
          count(*) FILTER (WHERE m.stripe_subscription_id IS NOT NULL)::integer AS recurring_subscription_bound_memberships,
          count(*) FILTER (WHERE e.rich_profile=true)::integer AS rich_profile_entitlements,
          count(*) FILTER (WHERE e.growth_desk=true)::integer AS growth_desk_entitlements,
          count(*) FILTER (WHERE e.local_visibility_tools=true)::integer AS local_visibility_entitlements,
          count(*) FILTER (WHERE p.profile_id IS NOT NULL AND p.removed_at IS NULL)::integer AS active_reviewed_publications,
          count(*) FILTER (WHERE m.first_value_completed_at IS NOT NULL)::integer AS membership_first_value_flags,
          count(*) FILTER (WHERE v.membership_id IS NOT NULL AND p.profile_id IS NOT NULL AND p.removed_at IS NULL AND v.profile_id=m.profile_id AND v.revision=p.revision AND v.fields_sha256=p.fields_sha256)::integer AS exact_public_readback_receipts
        FROM franklin_memberships m
        LEFT JOIN franklin_entitlements e USING(membership_id)
        LEFT JOIN franklin_profile_links l ON l.account_id=m.account_id AND l.profile_id=m.profile_id
        LEFT JOIN franklin_member_publications p ON p.account_id=m.account_id AND p.profile_id=m.profile_id
        LEFT JOIN franklin_member_value_receipts v ON v.membership_id=m.membership_id
        WHERE m.account_id=$1`,[cfg.accountId]);
      const workflow=await client.query(`
        SELECT m.profile_id,l.authority_state,e.growth_desk,e.rich_profile,e.local_visibility_tools,d.state AS draft_state,d.revision AS draft_revision,
               (d.rights_confirmed_at IS NOT NULL) AS rights_confirmed,r.state AS representation_state,r.revision AS representation_revision,
               (SELECT count(*)::integer FROM franklin_member_review_history h WHERE h.account_id=m.account_id AND h.profile_id=m.profile_id) AS review_decisions,
               (SELECT count(*)::integer FROM franklin_member_publications p WHERE p.account_id=m.account_id AND p.profile_id=m.profile_id AND p.removed_at IS NULL) AS active_publications,
               (SELECT count(*)::integer FROM franklin_member_value_receipts v WHERE v.membership_id=m.membership_id) AS value_receipts
        FROM franklin_memberships m
        LEFT JOIN franklin_entitlements e USING(membership_id)
        LEFT JOIN franklin_profile_links l ON l.account_id=m.account_id AND l.profile_id=m.profile_id
        LEFT JOIN franklin_member_drafts d ON d.account_id=m.account_id AND d.profile_id=m.profile_id
        LEFT JOIN franklin_representation_reviews r ON r.account_id=m.account_id AND r.profile_id=m.profile_id
        WHERE m.account_id=$1 ORDER BY m.created_at LIMIT 5`,[cfg.accountId]);
      const rs=reviewSession.rows[0],ra=recentAuth.rows[0],acctSession=regularSession.rows[0],lc=lifecycle.rows[0];
      reviewHistory={reviewerSchemaAvailable:schemas.reviewer_schema_available===true,publicationSchemaAvailable:schemas.publication_schema_available===true,valueSchemaAvailable:schemas.value_schema_available===true,draftSchemaAvailable:schemas.draft_schema_available===true,representationSchemaAvailable:schemas.representation_schema_available===true,activeReviewerSessions:Number(rs.active_sessions||0),latestReviewerSessionCreatedAt:rs.latest_created_at||null,latestReviewerSessionExpiresAt:rs.latest_expires_at||null,recentPasswordAuthenticatedReviewerEvents:Number(ra.recent_auth_events||0),latestPasswordAuthenticatedReviewerAt:ra.latest_auth_at||null};
      authenticatedLifecycle={activeRegularAccountSessions:Number(acctSession.active_sessions||0),latestRegularAccountSessionSeenAt:acctSession.latest_seen_at||null,activeMemberships:Number(lc.active_memberships||0),verifiedProfileLinks:Number(lc.verified_profile_links||0),customerBoundMemberships:Number(lc.customer_bound_memberships||0),recurringSubscriptionBoundMemberships:Number(lc.recurring_subscription_bound_memberships||0),richProfileEntitlements:Number(lc.rich_profile_entitlements||0),growthDeskEntitlements:Number(lc.growth_desk_entitlements||0),localVisibilityEntitlements:Number(lc.local_visibility_entitlements||0),activeReviewedPublications:Number(lc.active_reviewed_publications||0),membershipFirstValueFlags:Number(lc.membership_first_value_flags||0),exactPublicReadbackReceipts:Number(lc.exact_public_readback_receipts||0)};
      memberWorkflow=workflow.rows.map(row=>({profileReferenceSha256:digest(row.profile_id),authorityState:row.authority_state||null,memberBenefits:{richProfile:row.rich_profile===true,growthDesk:row.growth_desk===true,localVisibilityTools:row.local_visibility_tools===true},draftState:row.draft_state||null,draftRevision:row.draft_revision==null?null:Number(row.draft_revision),rightsConfirmed:row.rights_confirmed===true,representationState:row.representation_state||null,representationRevision:row.representation_revision==null?null:Number(row.representation_revision),reviewDecisions:Number(row.review_decisions||0),activePublications:Number(row.active_publications||0),valueReceipts:Number(row.value_receipts||0)}));
    }
    await client.query('COMMIT');
    return{event:'FRANKLIN_OWNER_REVIEW_PREFLIGHT',schemaVersion:'franklin.readonly-owner-preflight.v4',at:new Date().toISOString(),mode:'READ_ONLY_NO_SESSION_OR_ROLE_CHANGE',accountReferenceSha256:digest(cfg.accountId),assignmentSha256:cfg.assignmentSha256,checks,eligibleForExplicitReviewerBinding:ok,memberships,reviewHistory,authenticatedLifecycle,memberWorkflow,actualPasswordAuthenticationPerformed:Boolean(reviewHistory&&reviewHistory.recentPasswordAuthenticatedReviewerEvents>0),providerPaymentVerificationPerformed:false,productMutations:0};
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
