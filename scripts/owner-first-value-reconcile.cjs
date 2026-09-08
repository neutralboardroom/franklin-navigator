'use strict';
// Narrow Franklin launch closeout: reconcile first value from a real authenticated
// existing-member benefit. This does not create/edit/publish member content, grant profile
// authority, charge/refund/cancel, or create another membership.
const crypto=require('node:crypto');
const {Pool}=require('pg');
const VERSION='FRANKLIN_EXISTING_MEMBER_FIRST_VALUE_1';
const SRE_AUTHORITY='ISSUE_9_COMMENT_5579376162';
const ACTIVE=new Set(['ACTIVE','ACTIVE_CANCELING','GRACE']);
const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const fail=code=>{throw Object.assign(new Error(code),{code});};
function config(env=process.env){
  if(!/^(1|true|yes|on)$/i.test(String(env.OWNER_FIRST_VALUE_RECONCILE||'false')))return null;
  const accountId=String(env.OWNER_REVIEW_PREFLIGHT_ACCOUNT||'').trim();
  if(!/^acct_[A-Za-z0-9]{8,80}$/.test(accountId))fail('FIRST_VALUE_ACCOUNT_CONFIG_INVALID');
  const db=String(env.DATABASE_URL||'').trim();
  if(!db)fail('FIRST_VALUE_DATABASE_MISSING');
  const stripeKey=String(env.STRIPE_SECRET_KEY||'').trim();
  if(!/^(sk|rk)_live_[A-Za-z0-9]{16,}$/.test(stripeKey))fail('FIRST_VALUE_STRIPE_LIVE_KEY_REQUIRED');
  const publicOrigin=String(env.PUBLIC_ORIGIN||'https://franklinnavigator.com').replace(/\/$/,'');
  if(publicOrigin!=='https://franklinnavigator.com')fail('FIRST_VALUE_PUBLIC_ORIGIN_INVALID');
  return{accountId,db,stripeKey,publicOrigin};
}
function activeMembership(row,now=Date.now()){
  if(!row||row.account_state!=='ACTIVE'||row.email_verified!==true||row.authority_state!=='VERIFIED')return false;
  if(!ACTIVE.has(String(row.status||''))||row.access_state!=='ACTIVE')return false;
  if(row.current_period_end&&new Date(row.current_period_end).getTime()<=now)return false;
  if(row.expires_at&&new Date(row.expires_at).getTime()<=now)return false;
  return true;
}
function realBenefit(row){return Boolean(row&&(row.rich_profile===true||row.growth_desk===true||row.local_visibility_tools===true));}
async function stripeRequest(cfg,pathname,{method='GET',params,idempotencyKey,errorCode='FIRST_VALUE_PROVIDER_REQUEST_FAILED'}={}){
  const headers={Authorization:'Bearer '+cfg.stripeKey};
  let body;
  if(method==='POST'){
    headers['Content-Type']='application/x-www-form-urlencoded';
    if(idempotencyKey)headers['Idempotency-Key']=idempotencyKey;
    body=(params||new URLSearchParams()).toString();
  }
  let response;
  try{response=await fetch('https://api.stripe.com'+pathname,{method,headers,body,signal:AbortSignal.timeout(10000)});}catch{fail(errorCode);}
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)fail(errorCode);
  return payload;
}
function provider(cfg){return{
  async verifyAndCreatePortal(row){
    const customer=await stripeRequest(cfg,'/v1/customers/'+encodeURIComponent(row.stripe_customer_id),{errorCode:'FIRST_VALUE_PROVIDER_CUSTOMER_READ_FAILED'});
    if(customer.deleted||customer.id!==row.stripe_customer_id||customer.livemode!==true)fail('FIRST_VALUE_CUSTOMER_NOT_LIVE');
    const subscription=await stripeRequest(cfg,'/v1/subscriptions/'+encodeURIComponent(row.stripe_subscription_id),{errorCode:'FIRST_VALUE_PROVIDER_SUBSCRIPTION_READ_FAILED'});
    if(subscription.id!==row.stripe_subscription_id||subscription.livemode!==true||!['active','trialing','past_due'].includes(String(subscription.status||'')))fail('FIRST_VALUE_SUBSCRIPTION_NOT_ACTIVE');
    const configs=await stripeRequest(cfg,'/v1/billing_portal/configurations?active=true&is_default=true&limit=10',{errorCode:'FIRST_VALUE_PROVIDER_PORTAL_CONFIG_READ_FAILED'});
    const portalConfig=(configs.data||[]).find(x=>x&&x.active===true&&x.is_default===true);
    if(!portalConfig?.features?.subscription_cancel?.enabled)fail('FIRST_VALUE_DIRECT_CANCELLATION_NOT_AVAILABLE');
    const params=new URLSearchParams({customer:row.stripe_customer_id,return_url:cfg.publicOrigin+'/membership-status/'});
    const session=await stripeRequest(cfg,'/v1/billing_portal/sessions',{method:'POST',params,idempotencyKey:'franklin-first-value-'+sha256(row.membership_id).slice(0,40),errorCode:'FIRST_VALUE_PROVIDER_PORTAL_SESSION_CREATE_FAILED'});
    if(!/^bps_/.test(String(session.id||''))||!/^https:\/\/billing\.stripe\.com\//.test(String(session.url||'')))fail('FIRST_VALUE_PORTAL_SESSION_INVALID');
    return{customerLive:true,subscriptionLive:true,directCancellationAccess:true,portalSessionCreated:true};
  }
};}
async function inspect(client,cfg){
  const accountHash=sha256(cfg.accountId);
  const rows=(await client.query(`
    select m.membership_id,m.account_id,m.profile_id,m.status,m.current_period_end,m.first_value_completed_at,
           m.stripe_customer_id,m.stripe_subscription_id,
           e.access_state,e.growth_desk,e.rich_profile,e.local_visibility_tools,e.expires_at,
           l.authority_state,a.state as account_state,(a.email_verified_at is not null) as email_verified,
           (select count(*)::integer from franklin_sessions s where s.account_id=m.account_id and s.expires_at>now()) as active_regular_sessions,
           (select count(*)::integer from franklin_audit_log al where al.actor_type='ACCOUNT' and al.actor_ref_hash=$2 and al.action_type='REVIEW_SESSION_CREATED' and al.created_at>now()-interval '6 hours') as recent_password_auth_events
      from franklin_memberships m
      join franklin_accounts a on a.account_id=m.account_id
      join franklin_entitlements e on e.membership_id=m.membership_id
      join franklin_profile_links l on l.account_id=m.account_id and l.profile_id=m.profile_id
     where m.account_id=$1
     order by m.updated_at desc`,[cfg.accountId,accountHash])).rows;
  const eligible=rows.filter(row=>activeMembership(row));
  if(eligible.length!==1)fail('FIRST_VALUE_EXACT_ACTIVE_MEMBERSHIP_REQUIRED');
  const row=eligible[0];
  if(Number(row.active_regular_sessions||0)<1)fail('FIRST_VALUE_MEMBER_SESSION_REQUIRED');
  if(Number(row.recent_password_auth_events||0)<1)fail('FIRST_VALUE_PASSWORD_AUTH_REQUIRED');
  if(!realBenefit(row))fail('FIRST_VALUE_MEMBER_BENEFIT_REQUIRED');
  if(!/^cus_/.test(String(row.stripe_customer_id||''))||!/^sub_/.test(String(row.stripe_subscription_id||'')))fail('FIRST_VALUE_PROVIDER_BINDING_REQUIRED');
  return row;
}
async function reconcile(client,cfg,providerClient){
  const row=await inspect(client,cfg);
  if(row.first_value_completed_at)return{result:'ALREADY_RECORDED',version:VERSION,providerCalls:0,financialMutations:0,profileOrContentMutations:0};
  const providerEvidence=await providerClient.verifyAndCreatePortal(row);
  await client.query('begin');
  try{
    await client.query('select pg_advisory_xact_lock(3316404,1)');
    const current=(await client.query(`
      select m.membership_id,m.status,m.current_period_end,m.first_value_completed_at,m.stripe_customer_id,m.stripe_subscription_id,
             e.access_state,e.growth_desk,e.rich_profile,e.local_visibility_tools,e.expires_at,
             l.authority_state,a.state as account_state,(a.email_verified_at is not null) as email_verified,
             (select count(*)::integer from franklin_sessions s where s.account_id=m.account_id and s.expires_at>now()) as active_regular_sessions,
             (select count(*)::integer from franklin_audit_log al where al.actor_type='ACCOUNT' and al.actor_ref_hash=$2 and al.action_type='REVIEW_SESSION_CREATED' and al.created_at>now()-interval '6 hours') as recent_password_auth_events
        from franklin_memberships m
        join franklin_accounts a on a.account_id=m.account_id
        join franklin_entitlements e on e.membership_id=m.membership_id
        join franklin_profile_links l on l.account_id=m.account_id and l.profile_id=m.profile_id
       where m.account_id=$1 and m.membership_id=$3
       for update of m`,[cfg.accountId,sha256(cfg.accountId),row.membership_id])).rows[0];
    if(!current||!activeMembership(current)||Number(current.active_regular_sessions||0)<1||Number(current.recent_password_auth_events||0)<1||!realBenefit(current))fail('FIRST_VALUE_RECHECK_FAILED');
    if(current.stripe_customer_id!==row.stripe_customer_id||current.stripe_subscription_id!==row.stripe_subscription_id)fail('FIRST_VALUE_PROVIDER_BINDING_CHANGED');
    if(current.first_value_completed_at){await client.query('commit');return{result:'ALREADY_RECORDED_AFTER_RECHECK',version:VERSION,providerCalls:1,financialMutations:0,profileOrContentMutations:0};}
    const benefit={richProfile:current.rich_profile===true,growthDesk:current.growth_desk===true,localVisibilityTools:current.local_visibility_tools===true};
    const safeContext={version:VERSION,method:'AUTHENTICATED_EXISTING_MEMBER_BENEFIT',sreAuthority:SRE_AUTHORITY,passwordAuthenticated:true,activeMemberSession:true,verifiedProfile:true,memberBenefit:benefit,providerCustomerVerified:providerEvidence.customerLive===true,providerSubscriptionVerified:providerEvidence.subscriptionLive===true,billingPortalSessionCreated:providerEvidence.portalSessionCreated===true,directCancellationAccess:providerEvidence.directCancellationAccess===true,memberPublicationRequired:false,chargeCreated:false,refundCreated:false,cancellationExecuted:false,duplicateMembershipCreated:false};
    const receiptSha256=sha256(JSON.stringify(safeContext));
    await client.query(`update franklin_memberships set first_value_completed_at=now(),updated_at=now() where membership_id=$1`,[row.membership_id]);
    await client.query(`insert into franklin_audit_log(audit_id,actor_type,actor_ref_hash,action_type,target_type,target_ref_hash,request_id,safe_context) values($1,'SYSTEM',$2,'MEMBER_FIRST_VALUE_EXISTING_BENEFIT_RECONCILED','MEMBERSHIP',$3,$4,$5::jsonb)`,['audit_'+crypto.randomUUID().replaceAll('-',''),sha256('LOCAL_EXISTING_MEMBER_FIRST_VALUE_V1'),sha256(row.membership_id),'firstvalue_'+receiptSha256.slice(0,24),JSON.stringify({...safeContext,receiptSha256})]);
    await client.query('commit');
    return{result:'PASS_RECORDED',version:VERSION,receiptSha256,benefit,providerEvidence:{customerLive:true,subscriptionLive:true,billingPortalSessionCreated:true,directCancellationAccess:true},financialMutations:0,profileOrContentMutations:0,providerSessionObjectsCreated:1};
  }catch(error){await client.query('rollback').catch(()=>{});throw error;}
}
async function main(env=process.env){
  const cfg=config(env);if(!cfg){console.log(JSON.stringify({event:'FRANKLIN_EXISTING_MEMBER_FIRST_VALUE',version:VERSION,result:'DISABLED'}));return;}
  const pool=new Pool({connectionString:cfg.db,max:1,connectionTimeoutMillis:8000,idleTimeoutMillis:1000,ssl:env.PGSSL_DISABLE==='true'?false:{rejectUnauthorized:false}});
  let client;
  try{client=await pool.connect();const result=await reconcile(client,cfg,provider(cfg));console.log(JSON.stringify({event:'FRANKLIN_EXISTING_MEMBER_FIRST_VALUE',at:new Date().toISOString(),...result}));}
  catch(error){console.error(JSON.stringify({event:'FRANKLIN_EXISTING_MEMBER_FIRST_VALUE',at:new Date().toISOString(),result:'FAIL',errorCode:/^FIRST_VALUE_[A-Z0-9_]+$/.test(String(error.code||error.message))?String(error.code||error.message):'FIRST_VALUE_RECONCILE_FAILED',financialMutations:0,profileOrContentMutations:0}));process.exitCode=1;}
  finally{if(client)client.release();await pool.end().catch(()=>{});}
}
module.exports={VERSION,SRE_AUTHORITY,config,activeMembership,realBenefit,inspect,reconcile,provider,sha256};if(require.main===module)main();
