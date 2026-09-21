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
const schema='issues_'+crypto.randomUUID().replaceAll('-','');
const init=new Pool({connectionString:u.href,ssl:false});
const port=Number(process.env.TEST_PORT||18186);
const base='http://127.0.0.1:'+port;
const admin='synthetic-monitor-admin-'.repeat(3);
const sentinel='SYNTHETIC_SECRET_SHOULD_NEVER_PERSIST_987654321';
let child,pool;

async function call(method,url,body,headers={}){
  return new Promise((resolve,reject)=>{
    const data=body===undefined?'':JSON.stringify(body);
    const req=http.request(base+url,{method,headers:{origin:'https://franklinnavigator.com','content-type':'application/json',...headers}},res=>{
      let raw='';res.on('data',c=>raw+=c);res.on('end',()=>{let parsed;try{parsed=JSON.parse(raw)}catch{parsed=raw}resolve({status:res.statusCode,headers:res.headers,body:parsed})});
    });
    req.on('error',reject);req.setTimeout(10000,()=>req.destroy(Error('TIMEOUT')));req.end(data);
  });
}
async function waitReady(){
  for(let i=0;i<160;i++){
    try{const r=await call('GET','/health');if(r.status===200)return r}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  throw Error('MONITOR_RUNTIME_START_FAILED');
}
async function stop(){if(child){try{process.kill(-child.pid,'SIGTERM')}catch{}await new Promise(r=>child.once('exit',r));child=null}}

(async()=>{
  await init.query('create schema '+schema);await init.end();
  u.searchParams.set('options','-c search_path='+schema+',public');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'franklin-r1308-'));
  fs.cpSync(ROOT,tmp,{recursive:true,filter:s=>!s.includes('/node_modules')&&!s.includes('/evidence')});
  fs.symlinkSync(path.join(ROOT,'node_modules'),path.join(tmp,'node_modules'),'dir');
  const env={...process.env,
    DATABASE_URL:u.href,PGSSL_DISABLE:'true',PORT:String(port),
    SESSION_SECRET:'synthetic-session-secret-'.repeat(3),
    LOCAL_ASSERTION_SECRET:'synthetic-assertion-secret-'.repeat(3),
    SRE_SHARED_SECRET:'synthetic-sre-secret-'.repeat(3),
    ADMIN_TOKEN:admin,STRIPE_SECRET_KEY:'sk_live_'+'1'.repeat(32),
    STRIPE_WEBHOOK_SECRET:'whsec_'+'2'.repeat(32),
    STRIPE_ACCOUNT_ID:'acct_SYNTHETICMONITOR',
    COMMERCE_ENABLED:'false',LOCAL_RELEASE:'FR-NAV1.30.53-HF3.13.35',
    MEMBER_REVIEWERS:'synthetic-reviewer',REVIEWER_ACCOUNT_BINDINGS:'[]',
    FRANKLIN_ISOLATED_TEST:'true'
  };
  child=spawn('node',['server.js'],{cwd:tmp,env,stdio:['ignore','pipe','pipe'],detached:true});
  const procLog=fs.createWriteStream(path.join(tmp,'monitor-process.log'),{flags:'a'});child.stdout.pipe(procLog);child.stderr.pipe(procLog);
  await waitReady();
  pool=new Pool({connectionString:u.href,ssl:false});

  const health=await call('GET','/health');
  assert.equal(health.body.release,'FR-NAV1.30.53-HF3.13.35');
  assert.equal(health.body.issueMonitorVersion,'FRANKLIN_ISSUE_MONITOR_3');

  const unauth=await call('GET','/admin/incidents');
  assert.equal(unauth.status,401);

  for(let i=0;i<6;i++){
    const blocked=await call('OPTIONS','/api/telemetry/issue',undefined,{
      origin:'https://blocked-'+i+'.example',
      'x-forwarded-for':'198.51.100.'+(20+i)
    });
    assert.equal(blocked.status,403,JSON.stringify(blocked.body));
  }
  const originRows=await call('GET','/admin/incidents?status=OPEN&severity=&limit=100',undefined,{authorization:'Bearer '+admin});
  const originIncidents=originRows.body.incidents.filter(x=>x.safe_error_code==='ORIGIN_NOT_ALLOWED'&&x.affected_path==='/api/telemetry/issue'&&x.http_method==='OPTIONS');
  assert.equal(originIncidents.length,1,JSON.stringify(originIncidents));
  assert.equal(Number(originIncidents[0].occurrence_count),6);
  assert.equal(originIncidents[0].severity,'NORMAL');
  assert.match(originIncidents[0].fingerprint_sha256,/^[a-f0-9]{64}$/);
  assert.equal(originIncidents[0].safe_context.originClass,'BLOCKED_PREFLIGHT');

  for(let i=0;i<5;i++){
    const r=await call('POST','/api/telemetry/issue',{
      workflow:'PUBLIC_SITE',code:'CLIENT_JS_ERROR',path:'/synthetic-monitor-test',action:'SELF_TEST',
      password:sentinel,token:sentinel,cardNumber:sentinel,message:sentinel
    },{'x-forwarded-for':'203.0.113.10'});
    assert.equal(r.status,202,JSON.stringify(r.body));
    assert.equal(Object.hasOwn(r.body,'incidentId'),false);
  }

  const owner=await call('GET','/admin/incidents?status=OPEN&severity=&limit=100',undefined,{authorization:'Bearer '+admin});
  assert.equal(owner.status,200,JSON.stringify(owner.body));
  const client=owner.body.incidents.find(x=>x.safe_error_code==='CLIENT_JS_ERROR');
  assert(client);
  assert.equal(Number(client.occurrence_count),5);
  assert.equal(client.community,'FRANKLIN_TN');
  assert(!JSON.stringify(client).includes(sentinel));
  assert.equal(client.severity,'HIGH');

  const a=await call('POST','/api/accounts/login',{email:'nobody@example.invalid',password:'wrong-synthetic-password'},{'x-forwarded-for':'203.0.113.11'});
  const b=await call('POST','/api/accounts/login',{email:'nobody@example.invalid',password:'wrong-synthetic-password'},{'x-forwarded-for':'203.0.113.12'});
  assert.equal(a.status,401);assert.equal(b.status,401);
  const logins=await call('GET','/admin/incidents?status=OPEN&severity=&limit=100',undefined,{authorization:'Bearer '+admin});
  const loginRows=logins.body.incidents.filter(x=>x.safe_error_code==='LOGIN_INVALID');
  assert.equal(loginRows.length,2);
  assert(loginRows.every(x=>x.account_ref_hash&&!JSON.stringify(x).includes('nobody@example.invalid')));

  const support=await call('POST','/api/support/request',{message:'short'});
  assert.equal(support.status,400);
  const broken=await call('GET','/api/member/public-profile?profileId=not-a-valid-profile');
  assert([400,404].includes(broken.status));

  const summary=await call('GET','/admin/incidents/summary',undefined,{authorization:'Bearer '+admin});
  assert.equal(summary.status,200);
  assert.equal(summary.body.ownerVisibility,true);
  assert.equal(summary.body.externalDelivery,'CONFIGURATION_AUTHORITY_REQUIRED');
  assert.equal(summary.body.version,'FRANKLIN_ISSUE_MONITOR_3');
  assert.equal(summary.body.alertCooldownMinutes.CRITICAL,15);
  assert.equal(summary.body.alertCooldownMinutes.HIGH,60);
  assert.equal(summary.body.alertDigestMinutes,720);
  assert.equal(summary.body.recoveryNotifications,true);

  const digest=await call('GET','/admin/incidents/digest?hours=12&limit=50',undefined,{authorization:'Bearer '+admin});
  assert.equal(digest.status,200,JSON.stringify(digest.body));
  assert(digest.body.items.some(x=>x.code==='ORIGIN_NOT_ALLOWED'&&x.occurrences===6));

  const readiness=await call('GET','/admin/readiness',undefined,{authorization:'Bearer '+admin});
  assert.equal(readiness.status,200,JSON.stringify(readiness.body));
  assert.equal(readiness.body.monitoring.ledger,true);
  assert.equal(readiness.body.monitoring.ownerVisibility,true);

  const resolve=await call('POST','/admin/incidents/'+client.incident_id+'/resolve',{resolutionNote:'Synthetic isolated acceptance issue resolved.'},{authorization:'Bearer '+admin});
  assert.equal(resolve.status,200);
  assert.equal(resolve.body.incident.status,'RESOLVED');

  const resolvedOrigin=await call('POST','/admin/incidents/'+originIncidents[0].incident_id+'/resolve',{resolutionNote:'Synthetic blocked-preflight acceptance incident resolved.'},{authorization:'Bearer '+admin});
  assert.equal(resolvedOrigin.status,200);
  const recurrence=await call('OPTIONS','/api/telemetry/issue',undefined,{origin:'https://blocked-recurrence.example','x-forwarded-for':'198.51.100.99'});
  assert.equal(recurrence.status,403);
  const reopenedRows=await call('GET','/admin/incidents?status=OPEN&severity=&limit=100',undefined,{authorization:'Bearer '+admin});
  const reopened=reopenedRows.body.incidents.find(x=>x.incident_id===originIncidents[0].incident_id);
  assert(reopened);
  assert.equal(Number(reopened.occurrence_count),7);
  assert(reopened.reopened_at);

  await pool.query("insert into franklin_dead_letters(dead_letter_id,reason_code,state,safe_context) values('dead_SYNTHETICR1308','SYNTHETIC_FAILURE','OPEN','{}'::jsonb)");
  const readiness2=await call('GET','/admin/readiness',undefined,{authorization:'Bearer '+admin});
  assert.equal(readiness2.status,200);
  const after=await call('GET','/admin/incidents?status=OPEN&severity=HIGH&limit=100',undefined,{authorization:'Bearer '+admin});
  assert(after.body.incidents.some(x=>x.safe_error_code==='DEAD_LETTER_OPEN'));

  const rows=(await pool.query('select safe_context,account_ref_hash,membership_ref_hash from franklin_incidents')).rows;
  assert(!JSON.stringify(rows).includes(sentinel));
  assert(!JSON.stringify(rows).includes('wrong-synthetic-password'));
  assert.equal((await pool.query("select count(*)::int n from franklin_incidents where safe_error_code='SYNTHETIC_MONITOR_CHECK' and status='RESOLVED'")).rows[0].n,1);

  console.log(JSON.stringify({
    result:'PASS',release:'FR-NAV1.30.53-HF3.13.35',actualPostgres:true,actualHttp:true,
    secretsExcluded:true,deduplication:true,recurrenceCount:true,ownerAuthFailClosed:true,
    publicPreflightGrouped:true,publicPreflightSeverity:'NORMAL',digestVisible:true,reopenState:true,
    userIssueIsolation:true,resolutionState:true,externalNotificationState:'CONFIGURATION_AUTHORITY_REQUIRED',
    deadLetterIncident:true,realCharges:0,productionMutations:0
  }));
  await stop();await pool.end();fs.rmSync(tmp,{recursive:true,force:true});
})().catch(async e=>{console.error(e);await stop().catch(()=>{});await pool?.end().catch(()=>{});process.exit(1)});
