#!/usr/bin/env python3
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1]
p=root/'server.js'; data=p.read_bytes(); text=data.decode()
if 'FRANKLIN_CHECKOUT_SAFETY_1' in text:
    print('Safety source already applied'); raise SystemExit(0)
assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()=='66a7f15f0f9607292683a8fbf8e338586a8c074b','Runtime source changed: rebase required'
line="const {initialState, applyEvent, accessAllowed, mapStripeEvent} = require('./lib/lifecycle');"
assert text.count(line)==1
text=text.replace(line,line+"\nconst {startSafePurchase} = require('./lib/purchase-reservations');\nconst CHECKOUT_SAFETY_VERSION='FRANKLIN_CHECKOUT_SAFETY_1';")
migration="""async function initializePurchaseReservations(){const sql=fs.readFileSync(path.join(__dirname,'schema','002_purchase_reservations.sql'),'utf8');const digest=sha256(sql);await tx(async client=>{await client.query('select pg_advisory_xact_lock(3316401,1)');const prior=(await client.query('select digest_sha256 from franklin_schema_migrations where version=$1',[CHECKOUT_SAFETY_VERSION])).rows[0];if(prior&&prior.digest_sha256!==digest)throw new Error('checkout_safety_migration_digest_mismatch');await client.query(sql);await client.query('insert into franklin_schema_migrations(version,digest_sha256) values($1,$2) on conflict(version) do nothing',[CHECKOUT_SAFETY_VERSION,digest]);});}\n"""
text=text.replace('async function initializeDatabase(){',migration+'async function initializeDatabase(){',1)
assert text.count('await pool.query(schema);')==1
text=text.replace('await pool.query(schema);','await pool.query(schema);await initializePurchaseReservations();',1)
old='async function createStripeCheckoutSession({plan,intentId,email,profileId,stripeCustomerId=null})'
new='async function createStripeCheckoutSession({plan,intentId,email,profileId,stripeCustomerId=null,publicOrigin=PUBLIC_ORIGIN})'
assert old in text;text=text.replace(old,new,1)
text=text.replace("params.set('success_url',PUBLIC_ORIGIN+", "params.set('success_url',publicOrigin+",1)
text=text.replace("params.set('cancel_url',PUBLIC_ORIGIN+'/membership-enrollment/?checkout=canceled');", "params.set('cancel_url',publicOrigin+'/membership-enroll/?checkout=canceled');",1)
start="  if(req.method==='POST'&&url.pathname==='/api/membership/start')"
lines=text.splitlines(keepends=True); indices=[i for i,l in enumerate(lines) if l.startswith(start)]
assert len(indices)==1
handler="""  if(req.method==='POST'&&url.pathname==='/api/membership/start'){
    if(!COMMERCE_ENABLED)throw publicError('COMMERCE_DISABLED','Franklin Navigator membership checkout is not open yet.',423);
    if(!checkoutInfrastructureConfigured())throw publicError('CHECKOUT_INFRASTRUCTURE_NOT_READY','Secure membership checkout is not ready yet.',503);
    const session=await requireSession(req);const body=await readBody(req);const profileId=normalizeProfile(body.profileId);const plan=getPlan(body.lookupKey);
    if(!plan)throw publicError('PLAN_INVALID','Choose an available Franklin membership plan.');
    const verifyAllowed=async client=>{const verified=await client.query(`select 1 from franklin_profile_links where account_id=$1 and profile_id=$2 and authority_state='VERIFIED'`,[session.account_id,profileId]);if(!verified.rowCount)throw publicError('PROFILE_VERIFICATION_REQUIRED','Verify your connection to this Franklin profile before enrollment.',409);const membership=(await client.query(`select * from franklin_memberships where account_id=$1 and profile_id=$2 order by updated_at desc limit 1`,[session.account_id,profileId])).rows[0];if(membership&&accessAllowed(membership.status,membership.current_period_end))throw publicError('MEMBERSHIP_ALREADY_ACTIVE','This Franklin profile already has an active membership.',409);return membership;};
    const existing=await verifyAllowed({query});
    const purchase=await startSafePurchase({tx,newId,publicError,createSession:createStripeCheckoutSession,verifyAllowed},{community:COMMUNITY,accountId:session.account_id,profileId,plan,email:session.email,stripeCustomerId:existing?.stripe_customer_id||null,publicOrigin:PUBLIC_ORIGIN});
    return sendJson(req,res,200,{ok:true,...purchase,plan:{lookupKey:plan.lookupKey,priceUsd:plan.regularUsd,autoRenew:plan.autoRenew,termMonths:plan.termMonths,billingMode:plan.billingMode,stripePriceId:plan.stripePriceId}},reqId);
  }
"""
lines[indices[0]]=handler;text=''.join(lines)
text=text.replace('{ok:healthy,release:RELEASE,','{ok:healthy,release:RELEASE,checkoutSafetyVersion:CHECKOUT_SAFETY_VERSION,',1)
text=text.replace('{ok:infrastructureReady,release:RELEASE,','{ok:infrastructureReady,release:RELEASE,checkoutSafetyVersion:CHECKOUT_SAFETY_VERSION,',1)
p.write_text(text)
(root/'evidence').mkdir(exist_ok=True)
(root/'evidence/CHECKOUT_SAFETY_SOURCE_BINDING.json').write_text(json.dumps({'patch':'FRANKLIN_CHECKOUT_SAFETY_1','baseCommit':'6d4f87fc975ae0201351060c69f0d3ab05d8236c','baseServerGitBlob':'66a7f15f0f9607292683a8fbf8e338586a8c074b','correctedServerSha256':hashlib.sha256(text.encode()).hexdigest(),'publicCheckoutOpened':False,'deployment':'NOT_CLAIMED'},indent=2)+'\n')
print('Pinned runtime source correction applied; commerce configuration unchanged')
