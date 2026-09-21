'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const http=require('node:http');
const {spawn}=require('node:child_process');
const {Pool}=require('pg');

const ROOT=path.resolve(__dirname,'..');
const db=process.env.TEST_DATABASE_URL||'';
const u=new URL(db||'https://invalid');
assert(['127.0.0.1','localhost'].includes(u.hostname)&&u.pathname.includes('test'),'Dedicated loopback test DB required');
const schema='recognition_'+crypto.randomUUID().replaceAll('-','');
const init=new Pool({connectionString:u.href,ssl:false});
const port=Number(process.env.TEST_PORT||18188);
const base='http://127.0.0.1:'+port;
const admin='synthetic-recognition-admin-'.repeat(3);
const sessionSecret='synthetic-recognition-session-secret-'.repeat(3);
const sessionToken='synthetic-r1354-session-token';
const account='acct_r1354_recognition';
const profile='FR-ORG-b00c0ace7943973c';
const freeProfile='FR-CIV-0158-carnton';
const year=2026;
let child,pool,tmp;

const sha=v=>crypto.createHash('sha256').update(String(v)).digest('hex');
async function call(method,url,body,headers={}){
  return new Promise((resolve,reject)=>{
    const data=body===undefined?'':JSON.stringify(body);
    const req=http.request(base+url,{method,headers:{origin:'https://franklinnavigator.com','content-type':'application/json',...headers}},res=>{
      let raw='';res.on('data',c=>raw+=c);res.on('end',()=>{let parsed;try{parsed=JSON.parse(raw)}catch{parsed=raw}resolve({status:res.statusCode,headers:res.headers,body:parsed,raw})});
    });
    req.on('error',reject);req.setTimeout(10000,()=>req.destroy(Error('TIMEOUT')));req.end(data);
  });
}
const memberHeaders=()=>({cookie:`__Host-franklin_session=${sessionToken}`});
async function waitReady(){for(let i=0;i<180;i++){try{const r=await call('GET','/health');if(r.status===200)return r}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('RECOGNITION_RUNTIME_START_FAILED');}
async function stop(){if(child){try{process.kill(-child.pid,'SIGTERM')}catch{}await new Promise(r=>child.once('exit',r));child=null}}

(async()=>{
  await init.query('create schema '+schema);await init.end();
  u.searchParams.set('options','-c search_path='+schema+',public');
  tmp=fs.mkdtempSync(path.join(os.tmpdir(),'franklin-r1354-'));
  fs.cpSync(ROOT,tmp,{recursive:true,filter:s=>!s.includes('/node_modules')&&!s.includes('/evidence')});
  fs.symlinkSync(path.join(ROOT,'node_modules'),path.join(tmp,'node_modules'),'dir');
  const env={...process.env,
    DATABASE_URL:u.href,PGSSL_DISABLE:'true',PORT:String(port),
    SESSION_SECRET:sessionSecret,
    LOCAL_ASSERTION_SECRET:'synthetic-assertion-secret-'.repeat(3),
    SRE_SHARED_SECRET:'synthetic-sre-secret-'.repeat(3),
    ADMIN_TOKEN:admin,STRIPE_SECRET_KEY:'sk_live_'+'1'.repeat(32),
    STRIPE_WEBHOOK_SECRET:'whsec_'+'2'.repeat(32),
    STRIPE_ACCOUNT_ID:'acct_SYNTHETICRECOGNITION',
    COMMERCE_ENABLED:'false',LOCAL_RELEASE:'FR-NAV1.30.54-HF3.13.36',
    MEMBER_REVIEWERS:'synthetic-reviewer',REVIEWER_ACCOUNT_BINDINGS:'[]',
    FRANKLIN_DECAL_PROGRAM_ACTIVE:'true',FRANKLIN_DECAL_PILOT_INVENTORY:'25',
    FRANKLIN_ISOLATED_TEST:'true'
  };
  child=spawn('node',['server.js'],{cwd:tmp,env,stdio:['ignore','pipe','pipe'],detached:true});
  const procLog=fs.createWriteStream(path.join(tmp,'recognition-process.log'),{flags:'a'});child.stdout.pipe(procLog);child.stderr.pipe(procLog);
  const health=await waitReady();
  assert.equal(health.body.release,'FR-NAV1.30.54-HF3.13.36');
  assert.equal(health.body.memberRecognitionVersion,'FRANKLIN_MEMBER_RECOGNITION_HF3_8');
  pool=new Pool({connectionString:u.href,ssl:false});

  await pool.query(`insert into franklin_accounts(account_id,community,email,email_normalized,password_hash,state) values($1,'FRANKLIN_TN',$2,$2,'synthetic','ACTIVE')`,[account,'recognition@example.invalid']);
  await pool.query(`insert into franklin_sessions(session_hash,account_id,expires_at) values($1,$2,now()+interval '1 day')`,[sha(sessionSecret+':'+sessionToken),account]);
  await pool.query(`insert into franklin_profile_links(link_id,account_id,profile_id,authority_state,verified_at) values('link_r1354',$1,$2,'VERIFIED',now())`,[account,profile]);

  // Free/basic profile management alone must never unlock paid recognition.
  let pub=await call('GET','/api/member/public-recognition?profileId='+encodeURIComponent(profile));
  assert.equal(pub.status,200,JSON.stringify(pub.body));
  assert.equal(pub.body.recognition.currentMembershipActive,false);
  assert.deepEqual(pub.body.recognition.participationYears,[]);
  let member=await call('GET','/api/member/recognition',undefined,memberHeaders());
  assert.equal(member.status,200,JSON.stringify(member.body));
  assert.equal(member.body.recognition.activePaidMember,false);

  // Authoritative active membership + entitlement unlocks digital recognition.
  await pool.query(`insert into franklin_memberships(membership_id,account_id,profile_id,lookup_key,status,current_period_end,last_event_created) values('member_r1354',$1,$2,'community_annual','ACTIVE','2027-09-21T00:00:00Z',1)`,[account,profile]);
  await pool.query(`insert into franklin_entitlements(membership_id,access_state,growth_desk,rich_profile,local_visibility_tools,expires_at) values('member_r1354','ACTIVE',true,true,true,'2027-09-21T00:00:00Z')`);
  // Simulate one prior qualifying year to prove historical display survives.
  await pool.query(`insert into franklin_member_recognition_years(recognition_id,membership_id,account_id,profile_id,recognition_year,recognition_state,last_authoritative_status) values('recognition_2025','member_r1354',$1,$2,2025,'HISTORICAL','ACTIVE')`,[account,profile]);

  pub=await call('GET','/api/member/public-recognition?profileId='+encodeURIComponent(profile));
  assert.equal(pub.status,200,JSON.stringify(pub.body));
  assert.equal(pub.body.recognition.currentMembershipActive,true);
  assert.equal(pub.body.recognition.currentQualifyingYear,year);
  assert.equal(pub.body.recognition.currentYearRecognitionActive,true);
  assert.deepEqual(pub.body.recognition.participationYears,[2026,2025]);
  assert.equal(pub.body.recognition.verificationUrl,`https://franklinnavigator.com/membership-verification/?profile=${profile}`);
  assert(!pub.raw.includes('mailing_address'));
  assert(!pub.raw.includes('123 Test'));

  member=await call('GET','/api/member/recognition',undefined,memberHeaders());
  assert.equal(member.status,200,JSON.stringify(member.body));
  assert.equal(member.body.recognition.activePaidMember,true);
  assert.equal(member.body.recognition.recognition.year,year);
  assert.equal(member.body.recognition.fulfillment.status,'ELIGIBLE_ADDRESS_NEEDED');
  assert.equal(member.body.recognition.fulfillment.addressConfirmed,false);
  const fulfillmentId=member.body.recognition.fulfillment.fulfillment_id;
  assert.match(fulfillmentId,/^decal_/);

  // Physical fulfillment is gated on confirmed private mailing address.
  const premature=await call('POST','/api/member/recognition/decal-request',{},memberHeaders());
  assert.equal(premature.status,409,JSON.stringify(premature.body));
  assert.equal(premature.body.error.code,'MAILING_ADDRESS_CONFIRMATION_REQUIRED');

  const address={recipient:'Franklin Navigator Test',line1:'123 Test Fulfillment St',city:'Franklin',region:'TN',postalCode:'37064',country:'US'};
  const addressSet=await call('POST','/api/member/recognition/mailing-address',{address},memberHeaders());
  assert.equal(addressSet.status,200,JSON.stringify(addressSet.body));
  assert.equal(addressSet.body.fulfillment.status,'ELIGIBLE_READY');
  assert.equal(addressSet.body.fulfillment.addressConfirmed,true);
  assert(!addressSet.raw.includes('123 Test Fulfillment St'));

  const request1=await call('POST','/api/member/recognition/decal-request',{},memberHeaders());
  const request2=await call('POST','/api/member/recognition/decal-request',{},memberHeaders());
  assert.equal(request1.status,200,JSON.stringify(request1.body));
  assert.equal(request2.status,200,JSON.stringify(request2.body));
  assert.equal(request1.body.fulfillment.status,'FULFILLMENT_REQUESTED');
  assert.equal(request2.body.fulfillment.status,'FULFILLMENT_REQUESTED');
  assert.equal((await pool.query(`select count(*)::int n from franklin_member_recognition_years where profile_id=$1 and recognition_year=$2`,[profile,year])).rows[0].n,1);
  assert.equal((await pool.query(`select count(*)::int n from franklin_member_decal_fulfillment where profile_id=$1 and recognition_year=$2`,[profile,year])).rows[0].n,1);

  // If entitlement ends before fulfillment, it must not remain automatically fulfillable.
  await pool.query(`update franklin_memberships set status='TERMINATED',updated_at=now() where membership_id='member_r1354'`);
  await pool.query(`update franklin_entitlements set access_state='INACTIVE',rich_profile=false,updated_at=now() where membership_id='member_r1354'`);
  pub=await call('GET','/api/member/public-recognition?profileId='+encodeURIComponent(profile));
  assert.equal(pub.body.recognition.currentMembershipActive,false);
  assert.deepEqual(pub.body.recognition.participationYears,[2026,2025]);
  assert.equal((await pool.query(`select status from franklin_member_decal_fulfillment where fulfillment_id=$1`,[fulfillmentId])).rows[0].status,'NOT_ELIGIBLE');

  // Re-activation in the same year reuses the same annual recognition/decal row.
  await pool.query(`update franklin_memberships set status='ACTIVE',current_period_end='2027-09-21T00:00:00Z',updated_at=now() where membership_id='member_r1354'`);
  await pool.query(`update franklin_entitlements set access_state='ACTIVE',rich_profile=true,expires_at='2027-09-21T00:00:00Z',updated_at=now() where membership_id='member_r1354'`);
  member=await call('GET','/api/member/recognition',undefined,memberHeaders());
  assert.equal(member.body.recognition.fulfillment.status,'ELIGIBLE_READY');
  const request3=await call('POST','/api/member/recognition/decal-request',{},memberHeaders());
  assert.equal(request3.body.fulfillment.status,'FULFILLMENT_REQUESTED');

  // Fulfillment can be marked once via internal operator handoff, quantity capped at one.
  const fulfilled=await call('POST','/internal/member-recognition/fulfillment',{fulfillmentId,status:'FULFILLED',note:'Synthetic acceptance fulfillment.'},{authorization:'Bearer '+admin});
  assert.equal(fulfilled.status,200,JSON.stringify(fulfilled.body));
  assert.equal(fulfilled.body.fulfillment.status,'FULFILLED');
  assert.equal(fulfilled.body.fulfillment.quantity_fulfilled,1);
  const replacement=await call('POST','/api/member/recognition/replacement-request',{},memberHeaders());
  assert.equal(replacement.status,200,JSON.stringify(replacement.body));
  assert.equal(replacement.body.fulfillment.status,'REPLACEMENT_REVIEW');

  // A later lapse preserves historical recognition and already-fulfilled record rather than rewriting history.
  await pool.query(`update franklin_memberships set status='TERMINATED',updated_at=now() where membership_id='member_r1354'`);
  await pool.query(`update franklin_entitlements set access_state='INACTIVE',rich_profile=false,updated_at=now() where membership_id='member_r1354'`);
  pub=await call('GET','/api/member/public-recognition?profileId='+encodeURIComponent(profile));
  assert.equal(pub.body.recognition.currentMembershipActive,false);
  assert.deepEqual(pub.body.recognition.participationYears,[2026,2025]);
  const fulfilledRow=(await pool.query(`select status,quantity_fulfilled,mailing_address from franklin_member_decal_fulfillment where fulfillment_id=$1`,[fulfillmentId])).rows[0];
  assert.equal(fulfilledRow.status,'REPLACEMENT_REVIEW');
  assert.equal(fulfilledRow.quantity_fulfilled,1);
  assert.equal(fulfilledRow.mailing_address.line1,'123 Test Fulfillment St');
  assert(!JSON.stringify(pub.body).includes('123 Test Fulfillment St'));

  // A separate free profile remains free and unrecognized.
  pub=await call('GET','/api/member/public-recognition?profileId='+encodeURIComponent(freeProfile));
  assert.equal(pub.status,200);
  assert.equal(pub.body.recognition.currentMembershipActive,false);
  assert.deepEqual(pub.body.recognition.participationYears,[]);

  const metrics=await call('GET','/internal/member-recognition/metrics',undefined,{authorization:'Bearer '+admin});
  assert.equal(metrics.status,200,JSON.stringify(metrics.body));
  assert.equal(metrics.body.metrics.currentYear,year);
  assert.equal(metrics.body.metrics.programActive,true);
  assert.equal(metrics.body.metrics.pilotInventory,25);

  console.log(JSON.stringify({
    result:'PASS',release:'FR-NAV1.30.54-HF3.13.36',actualPostgres:true,actualHttp:true,
    authoritativeEntitlement:true,currentYearRecognition:true,historicalYears:true,stableVerificationUrl:true,
    privateMailingAddress:true,duplicateYearBlocked:true,duplicateDecalBlocked:true,lapseRemovesCurrentStatus:true,
    fulfilledHistoryPreserved:true,replacementControlled:true,realCharges:0,productionMutations:0
  }));
  await stop();await pool.end();fs.rmSync(tmp,{recursive:true,force:true});
})().catch(async e=>{console.error(e);await stop().catch(()=>{});await pool?.end().catch(()=>{});if(tmp)fs.rmSync(tmp,{recursive:true,force:true});process.exit(1)});
