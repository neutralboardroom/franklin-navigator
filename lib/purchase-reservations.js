'use strict';
const crypto=require('node:crypto');
const VERSION='FRANKLIN_CHECKOUT_SAFETY_1';
const RETRY_WINDOW_MS=20*60*60*1000;
const LEASE_MS=120000;
const pending=(error,code='CHECKOUT_PENDING')=>error(code,'We are checking this purchase. Check your membership status and do not pay again.',409);
const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='checkout.stripe.com'&&!u.username&&!u.password;}catch{return false;}};
async function startSafePurchase(deps,args){
  const {tx,newId,publicError,createSession,verifyAllowed}=deps;
  const now=deps.now||Date.now;
  if(args.community!=='FRANKLIN_TN')throw publicError('COMMUNITY_MISMATCH','This membership belongs to another community.',403);
  const context='FRANKLIN_TN:LIVE';
  const key=crypto.createHash('sha256').update(JSON.stringify([context,args.accountId,args.profileId])).digest('hex');
  const lock=Buffer.from(key,'hex');
  const decision=await tx(async client=>{
    await client.query('select pg_advisory_xact_lock($1,$2)',[lock.readInt32BE(0),lock.readInt32BE(4)]);
    await verifyAllowed(client);
    let row=(await client.query('select * from franklin_purchase_reservations where reservation_key=$1 for update',[key])).rows[0];
    if(!row){
      const legacy=await client.query("select intent_id from franklin_checkout_intents where account_id=$1 and profile_id=$2 and state<>'FULFILLED' limit 1",[args.accountId,args.profileId]);
      if(legacy.rowCount)return{pending:true,code:'CHECKOUT_RECOVERY_REQUIRED'};
      const intentId=newId('checkout');
      const snapshot={plan:args.plan,intentId,email:args.email,profileId:args.profileId,stripeCustomerId:args.stripeCustomerId||null,publicOrigin:args.publicOrigin};
      await client.query("insert into franklin_checkout_intents(intent_id,account_id,profile_id,lookup_key,expires_at) values($1,$2,$3,$4,now()+interval '24 hours')",[intentId,args.accountId,args.profileId,args.plan.lookupKey]);
      row=(await client.query("insert into franklin_purchase_reservations(reservation_key,context,account_id,profile_id,lookup_key,intent_id,request_snapshot,state) values($1,$2,$3,$4,$5,$6,$7::jsonb,'RESERVED') returning *",[key,context,args.accountId,args.profileId,args.plan.lookupKey,intentId,JSON.stringify(snapshot)])).rows[0];
    }
    if(row.lookup_key!==args.plan.lookupKey)return{pending:true,code:'CHECKOUT_PLAN_CONFLICT'};
    if(row.state==='READY'){
      if(!safeUrl(row.checkout_url)||!/^cs_/.test(row.checkout_session_id||''))return{pending:true,code:'CHECKOUT_RECOVERY_REQUIRED'};
      return{reused:true,checkoutUrl:row.checkout_url,checkoutSessionId:row.checkout_session_id,intentId:row.intent_id};
    }
    if(row.state==='REVIEW_REQUIRED')return{pending:true,code:'CHECKOUT_RECOVERY_REQUIRED'};
    if(row.first_attempt_at&&now()-new Date(row.first_attempt_at).getTime()>=RETRY_WINDOW_MS){
      await client.query("update franklin_purchase_reservations set state='REVIEW_REQUIRED',lease_token=null,lease_until=null,updated_at=now() where reservation_key=$1",[key]);
      return{pending:true,code:'CHECKOUT_RECOVERY_REQUIRED'};
    }
    if(row.state==='CREATING'&&new Date(row.lease_until).getTime()>now())return{pending:true,code:'CHECKOUT_PENDING'};
    const token=newId('attempt');const at=new Date(now()).toISOString();const until=new Date(now()+LEASE_MS).toISOString();
    await client.query("update franklin_purchase_reservations set state='CREATING',lease_token=$2,lease_until=$3,first_attempt_at=coalesce(first_attempt_at,$4),attempt_count=attempt_count+1,updated_at=now() where reservation_key=$1",[key,token,until,at]);
    return{token,snapshot:row.request_snapshot};
  });
  if(decision.pending)throw pending(publicError,decision.code);
  if(decision.reused)return decision;
  try{
    const session=await createSession(decision.snapshot);
    if(!/^cs_/.test(session?.id||'')||!safeUrl(session?.url))throw new Error('INVALID_CHECKOUT_RESPONSE');
    const saved=await tx(async client=>{
      const update=await client.query("update franklin_purchase_reservations set state='READY',checkout_session_id=$3,checkout_url=$4,lease_token=null,lease_until=null,updated_at=now() where reservation_key=$1 and lease_token=$2 and state='CREATING' returning intent_id",[key,decision.token,session.id,session.url]);
      if(!update.rowCount)return null;
      const intentId=update.rows[0].intent_id;
      await client.query("update franklin_checkout_intents set stripe_checkout_session_id=$2,state=case when state='FULFILLED' then state else 'SESSION_CREATED' end,updated_at=now() where intent_id=$1",[intentId,session.id]);
      return{checkoutUrl:session.url,checkoutSessionId:session.id,intentId,reused:false};
    });
    if(!saved)throw new Error('PURCHASE_LEASE_CHANGED');
    return saved;
  }catch{
    await tx(client=>client.query("update franklin_purchase_reservations set state='OUTCOME_UNKNOWN',lease_token=null,lease_until=null,updated_at=now() where reservation_key=$1 and lease_token=$2 and state='CREATING'",[key,decision.token])).catch(()=>{});
    throw pending(publicError,'PAYMENT_OUTCOME_UNKNOWN');
  }
}
module.exports={startSafePurchase,VERSION,RETRY_WINDOW_MS,LEASE_MS};
