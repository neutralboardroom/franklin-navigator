'use strict';
const crypto=require('node:crypto');

const VERSION='FRANKLIN_ISSUE_MONITOR_1';
const COMMUNITY='FRANKLIN_TN';
const VALID_STATUS=new Set(['OPEN','ACKNOWLEDGED','RESOLVED','SUPPRESSED']);
const VALID_SEVERITY=new Set(['CRITICAL','HIGH','NORMAL']);
const SAFE_CONTEXT_KEYS=new Set([
  'action','path','httpStatus','latencyBucket','retryCount','state','provider','source',
  'eventType','outcome','reasonCode','routeClass','method','ageBucket','count','component',
  'checkoutState','membershipState','entitlementState','claimState','supportCategory',
  'clientSignal','assetType','responseClass','operation'
]);
const SECRET_KEY_RE=/(password|passcode|secret|token|cookie|authorization|card|cvv|cvc|bank|routing|session|api.?key|webhook.?secret|email|message|body|payload)/i;
const SAFE_CODE_RE=/^[A-Z0-9][A-Z0-9_.:-]{1,95}$/;
const SAFE_WORKFLOW_RE=/^[A-Z0-9][A-Z0-9_.:-]{1,79}$/;

function clean(value,max=160){
  return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
function safeCode(value,fallback='UNKNOWN'){
  const v=clean(value,96).toUpperCase().replace(/[^A-Z0-9_.:-]+/g,'_');
  return SAFE_CODE_RE.test(v)?v:fallback;
}
function safeWorkflow(value){
  const v=clean(value,80).toUpperCase().replace(/[^A-Z0-9_.:-]+/g,'_');
  return SAFE_WORKFLOW_RE.test(v)?v:'UNKNOWN';
}
function safePath(value){
  let p=clean(value,240);
  try{p=new URL(p,'https://franklinnavigator.com').pathname}catch{p=p.split('?')[0].split('#')[0]}
  if(!p.startsWith('/'))p='/';
  return p.replace(/[^A-Za-z0-9/_\-.]/g,'').slice(0,220)||'/';
}
function redactContext(input={}){
  const out={};
  if(!input||Array.isArray(input)||typeof input!=='object')return out;
  for(const [key,value] of Object.entries(input)){
    if(!SAFE_CONTEXT_KEYS.has(key)||SECRET_KEY_RE.test(key)||value==null)continue;
    if(key==='path')out.path=safePath(value);
    else if(['httpStatus','retryCount','count'].includes(key))out[key]=Number.isFinite(Number(value))?Number(value):undefined;
    else out[key]=clean(value,160);
  }
  return Object.fromEntries(Object.entries(out).filter(([,v])=>v!==undefined&&v!==''));
}
function rank(severity){return severity==='CRITICAL'?3:severity==='HIGH'?2:1}
function categoryFor(workflow,code){
  const w=safeWorkflow(workflow),c=safeCode(code);
  if(/WEBHOOK|STRIPE|PAYMENT|CHECKOUT|BILLING/.test(w+' '+c))return'PAYMENT_MEMBERSHIP';
  if(/CLAIM|REPRESENTATION|PROFILE_LINK/.test(w+' '+c))return'PROFILE_CLAIM';
  if(/PROFILE_MANAGEMENT|MEMBER_PROFILE|PUBLICATION/.test(w+' '+c))return'MEMBER_PROFILE';
  if(/LOGIN|REGISTER|ACCOUNT|AUTH|SESSION|PASSWORD/.test(w+' '+c))return'ACCOUNT_ACCESS';
  if(/ENTITLEMENT|FIRST_VALUE|ONBOARDING/.test(w+' '+c))return'MEMBERSHIP_ENTITLEMENT';
  if(/SUPPORT/.test(w+' '+c))return'SUPPORT';
  if(/SITE|CLIENT|NAVIGATION|FORM|ASSET|404|ROUTE/.test(w+' '+c))return'PUBLIC_SITE';
  return'RUNTIME';
}
function severityFor({workflow,code,httpStatus=0,hint,count=1}){
  if(VALID_SEVERITY.has(String(hint||'').toUpperCase()))return String(hint).toUpperCase();
  const w=safeWorkflow(workflow),c=safeCode(code),s=Number(httpStatus||0);
  const critical=new Set([
    'SERVICE_NOT_READY','DATABASE_NOT_CONFIGURED','CHECKOUT_INFRASTRUCTURE_NOT_READY',
    'STRIPE_API_NOT_CONFIGURED','STRIPE_CHECKOUT_NOT_CONFIGURED','ENTITLEMENT_INVARIANT_FAILED',
    'MEMBERSHIP_ENTITLEMENT_MISMATCH','ENTITLEMENT_WITHOUT_VALID_MEMBERSHIP',
    'MEMBERSHIP_SERVICE_UNAVAILABLE','BROAD_PROFILE_MANAGEMENT_OUTAGE'
  ]);
  const high=new Set([
    'STRIPE_API_REQUEST_FAILED','STRIPE_CHECKOUT_CREATE_FAILED','PORTAL_SESSION_CREATE_FAILED',
    'PAYMENT_FAILED','ASYNC_PAYMENT_FAILED','DEAD_LETTER_OPEN','CHECKOUT_OUTCOME_UNKNOWN',
    'PROFILE_CLAIM_STUCK','PROFILE_VERIFICATION_FAILED','PROFILE_OWNER_CONFLICT',
    'MEMBER_PROFILE_SAVE_FAILED','SUPPORT_SUBMISSION_FAILED','WEBHOOK_PROCESSING_FAILED',
    'STRIPE_ACCOUNT_MISMATCH'
  ]);
  if(critical.has(c))return'CRITICAL';
  if(high.has(c))return'HIGH';
  if(count>=3&&s>=500)return'CRITICAL';
  if(count>=3&&/(LOGIN|REGISTER|CLAIM|CHECKOUT|BILLING|PROFILE|SUPPORT)/.test(w))return'HIGH';
  if(count>=5)return'HIGH';
  return'NORMAL';
}
function hashRef(sha256,value){const v=clean(value,180);return v?sha256('FRANKLIN_TN:'+v):null}
function profileRef(value){const v=clean(value,120);return /^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(v)?v:null}

function createIncidentMonitor({query,tx,newId,sha256}){
  if(typeof query!=='function'||typeof tx!=='function'||typeof newId!=='function'||typeof sha256!=='function')throw new Error('INCIDENT_MONITOR_DEPENDENCY_MISSING');

  async function record(input={},client=null){
    const workflow=safeWorkflow(input.workflow||'UNKNOWN');
    const code=safeCode(input.code||'UNKNOWN');
    const category=clean(input.category||categoryFor(workflow,code),60).toUpperCase().replace(/[^A-Z0-9_-]/g,'_')||'RUNTIME';
    const context=redactContext({...input.context,httpStatus:input.httpStatus??input.context?.httpStatus});
    const accountHash=hashRef(sha256,input.accountId||input.accountRef);
    const membershipHash=hashRef(sha256,input.membershipId||input.membershipRef);
    const profileId=profileRef(input.profileId);
    const broad=/^(RUNTIME|PUBLIC_SITE|PAYMENT_MEMBERSHIP)$/.test(category)&&/^(SERVICE_NOT_READY|DATABASE_NOT_CONFIGURED|CHECKOUT_INFRASTRUCTURE_NOT_READY|STRIPE_API_NOT_CONFIGURED|STRIPE_CHECKOUT_NOT_CONFIGURED|STRIPE_API_REQUEST_FAILED|WEBHOOK_PROCESSING_FAILED|CLIENT_JS_ERROR|CLIENT_UNHANDLED_REJECTION|BROKEN_ASSET|HTTP_5XX)$/.test(code);
    const fingerprint=sha256([COMMUNITY,category,workflow,code,broad?'':(accountHash||''),profileId||'',broad?'':(membershipHash||'')].join('|'));
    const db=client||{query};
    const initialSeverity=severityFor({workflow,code,httpStatus:input.httpStatus,hint:input.severity,count:1});
    const incidentId=newId('incident');
    const correlationId=clean(input.correlationId||input.requestId,120)||null;
    const source=clean(input.source||'FRANKLIN_PLATFORM',60).toUpperCase().replace(/[^A-Z0-9_.:-]/g,'_')||'FRANKLIN_PLATFORM';
    const inserted=await db.query(`
      insert into franklin_incidents(
        incident_id,community,fingerprint_sha256,category,severity,workflow,safe_error_code,source,
        correlation_id,profile_id,account_ref_hash,membership_ref_hash,safe_context,status,
        alert_delivery_state,first_seen,last_seen,occurrence_count,updated_at
      ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,'OPEN','EXTERNAL_CONFIG_REQUIRED',now(),now(),1,now())
      on conflict(fingerprint_sha256) do update set
        last_seen=now(),occurrence_count=franklin_incidents.occurrence_count+1,
        correlation_id=coalesce(excluded.correlation_id,franklin_incidents.correlation_id),
        profile_id=coalesce(excluded.profile_id,franklin_incidents.profile_id),
        safe_context=excluded.safe_context,
        status=case when franklin_incidents.status='RESOLVED' then 'OPEN' else franklin_incidents.status end,
        resolved_at=case when franklin_incidents.status='RESOLVED' then null else franklin_incidents.resolved_at end,
        resolution_note=case when franklin_incidents.status='RESOLVED' then null else franklin_incidents.resolution_note end,
        updated_at=now()
      returning incident_id,severity,occurrence_count,status
    `,[incidentId,COMMUNITY,fingerprint,category,initialSeverity,workflow,code,source,correlationId,profileId,accountHash,membershipHash,JSON.stringify(context)]);
    const row=inserted.rows[0];
    const escalated=severityFor({workflow,code,httpStatus:input.httpStatus,hint:input.severity,count:Number(row.occurrence_count||1)});
    if(rank(escalated)>rank(row.severity)){
      await db.query('update franklin_incidents set severity=$2,updated_at=now() where incident_id=$1',[row.incident_id,escalated]);
      row.severity=escalated;
    }
    await db.query('insert into franklin_incident_events(event_id,incident_id,community,correlation_id,safe_context) values($1,$2,$3,$4,$5::jsonb)',[newId('ievt'),row.incident_id,COMMUNITY,correlationId,JSON.stringify(context)]);
    return {...row,category,workflow,code,externalDelivery:'CONFIGURATION_AUTHORITY_REQUIRED'};
  }

  async function list({status='OPEN',severity=[],limit=100}={}){
    const statuses=String(status||'OPEN').split(',').map(x=>x.trim().toUpperCase()).filter(x=>VALID_STATUS.has(x));
    const sevs=(Array.isArray(severity)?severity:String(severity||'').split(',')).map(x=>String(x).trim().toUpperCase()).filter(x=>VALID_SEVERITY.has(x));
    const n=Math.max(1,Math.min(200,Number(limit)||100));
    const rows=(await query(`
      select incident_id,community,category,severity,workflow,safe_error_code,source,correlation_id,
             profile_id,account_ref_hash,membership_ref_hash,safe_context,status,first_seen,last_seen,
             occurrence_count,alert_delivery_state,last_alert_at,resolution_note,resolved_at,updated_at
      from franklin_incidents
      where ($1::text[] is null or status=any($1))
        and ($2::text[] is null or severity=any($2))
      order by case severity when 'CRITICAL' then 1 when 'HIGH' then 2 else 3 end,last_seen desc
      limit $3
    `,[statuses.length?statuses:null,sevs.length?sevs:null,n])).rows;
    return rows;
  }

  async function summary(){
    const counts=(await query(`
      select status,severity,count(*)::int as count
      from franklin_incidents group by status,severity
      order by status,severity
    `)).rows;
    const openCritical=counts.filter(x=>x.status==='OPEN'&&x.severity==='CRITICAL').reduce((a,x)=>a+Number(x.count),0);
    const openHigh=counts.filter(x=>x.status==='OPEN'&&x.severity==='HIGH').reduce((a,x)=>a+Number(x.count),0);
    return {community:COMMUNITY,counts,openCritical,openHigh,externalDelivery:'CONFIGURATION_AUTHORITY_REQUIRED',ownerVisibility:true,version:VERSION};
  }

  async function setStatus(incidentId,status,note=''){
    const id=clean(incidentId,120),next=String(status||'').toUpperCase();
    if(!/^incident_[A-Za-z0-9]+$/.test(id)||!VALID_STATUS.has(next))throw Object.assign(new Error('INCIDENT_STATE_INVALID'),{code:'INCIDENT_STATE_INVALID',status:400});
    const resolution=clean(note,500)||null;
    const result=await query(`
      update franklin_incidents set status=$2,resolution_note=$3,
        resolved_at=case when $2='RESOLVED' then now() else null end,updated_at=now()
      where incident_id=$1
      returning incident_id,status,resolution_note,resolved_at
    `,[id,next,resolution]);
    if(!result.rowCount)throw Object.assign(new Error('INCIDENT_NOT_FOUND'),{code:'INCIDENT_NOT_FOUND',status:404});
    return result.rows[0];
  }

  async function scanDerivedIssues(){
    const checks=[];
    async function safeScan(name,fn){try{const n=await fn();checks.push({name,result:'PASS',count:Number(n||0)});}catch(error){checks.push({name,result:'ERROR',code:safeCode(error.code||error.constructor?.name)});}}
    await safeScan('dead_letters',async()=>{
      const rows=(await query("select dead_letter_id,reason_code from franklin_dead_letters where state='OPEN' order by created_at desc limit 100")).rows;
      for(const row of rows)await record({category:'PAYMENT_MEMBERSHIP',workflow:'WEBHOOK',code:'DEAD_LETTER_OPEN',severity:'HIGH',source:'DERIVED_SCAN',context:{reasonCode:row.reason_code}});
      return rows.length;
    });
    await safeScan('checkout_outcomes',async()=>{
      const rows=(await query("select state,count(*)::int as count from franklin_purchase_reservations where state in ('OUTCOME_UNKNOWN','REVIEW_REQUIRED') group by state")).rows;
      for(const row of rows)await record({category:'PAYMENT_MEMBERSHIP',workflow:'CHECKOUT',code:'CHECKOUT_OUTCOME_UNKNOWN',severity:'HIGH',source:'DERIVED_SCAN',context:{checkoutState:row.state,count:row.count}});
      return rows.reduce((a,x)=>a+Number(x.count||0),0);
    });
    await safeScan('stale_checkout_intents',async()=>{
      const rows=(await query("select intent_id,account_id,profile_id,state from franklin_checkout_intents where created_at<now()-interval '45 minutes' and state not in ('FULFILLED','RECEIVED') order by created_at limit 100")).rows;
      for(const row of rows)await record({category:'PAYMENT_MEMBERSHIP',workflow:'CHECKOUT',code:'CHECKOUT_STALE',source:'DERIVED_SCAN',accountId:row.account_id,profileId:row.profile_id,context:{checkoutState:row.state,ageBucket:'45M_PLUS'}});
      return rows.length;
    });
    await safeScan('membership_entitlement_consistency',async()=>{
      const rows=(await query(`
        select m.membership_id,m.account_id,m.profile_id,m.status,e.access_state
        from franklin_memberships m left join franklin_entitlements e using(membership_id)
        where m.status in ('ACTIVE','ACTIVE_CANCELING','GRACE')
          and (m.current_period_end is null or m.current_period_end>now())
          and (e.membership_id is null or e.access_state<>'ACTIVE')
        limit 100
      `)).rows;
      for(const row of rows)await record({category:'MEMBERSHIP_ENTITLEMENT',workflow:'ENTITLEMENT',code:'MEMBERSHIP_ENTITLEMENT_MISMATCH',severity:'CRITICAL',source:'DERIVED_SCAN',accountId:row.account_id,profileId:row.profile_id,membershipId:row.membership_id,context:{membershipState:row.status,entitlementState:row.access_state||'MISSING'}});
      const reverse=(await query(`
        select m.membership_id,m.account_id,m.profile_id,m.status,e.access_state
        from franklin_entitlements e join franklin_memberships m using(membership_id)
        where e.access_state='ACTIVE' and (m.status not in ('ACTIVE','ACTIVE_CANCELING','GRACE') or (m.current_period_end is not null and m.current_period_end<=now()))
        limit 100
      `)).rows;
      for(const row of reverse)await record({category:'MEMBERSHIP_ENTITLEMENT',workflow:'ENTITLEMENT',code:'ENTITLEMENT_WITHOUT_VALID_MEMBERSHIP',severity:'CRITICAL',source:'DERIVED_SCAN',accountId:row.account_id,profileId:row.profile_id,membershipId:row.membership_id,context:{membershipState:row.status,entitlementState:row.access_state}});
      return rows.length+reverse.length;
    });
    await safeScan('stuck_claims',async()=>{
      const rows=(await query("select account_id,profile_id,state from franklin_representation_reviews where state='PENDING' and updated_at<now()-interval '24 hours' limit 100")).rows;
      for(const row of rows)await record({category:'PROFILE_CLAIM',workflow:'CLAIM',code:'PROFILE_CLAIM_STUCK',severity:'HIGH',source:'DERIVED_SCAN',accountId:row.account_id,profileId:row.profile_id,context:{claimState:row.state,ageBucket:'24H_PLUS'}});
      return rows.length;
    });
    await safeScan('unresolved_support',async()=>{
      const rows=(await query("select request_id,account_id,profile_id,category from franklin_support_requests where state='OPEN' and created_at<now()-interval '24 hours' limit 100")).rows;
      for(const row of rows)await record({category:'SUPPORT',workflow:'SUPPORT',code:'SUPPORT_UNRESOLVED',source:'DERIVED_SCAN',accountId:row.account_id,profileId:row.profile_id,context:{supportCategory:row.category,ageBucket:'24H_PLUS'}});
      return rows.length;
    });
    return {ok:checks.every(x=>x.result==='PASS'),checks,at:new Date().toISOString()};
  }

  async function readinessSnapshot(){
    const out={community:COMMUNITY,version:VERSION,ledger:false,ownerVisibility:true,externalDelivery:'CONFIGURATION_AUTHORITY_REQUIRED',checks:[]};
    try{
      const q=await query('select 1 ok');out.database=Boolean(q.rowCount);out.checks.push({name:'database',result:out.database?'PASS':'FAIL'});
      const table=await query("select 1 from information_schema.tables where table_schema=current_schema() and table_name='franklin_incidents'");
      out.ledger=Boolean(table.rowCount);out.checks.push({name:'incident_ledger',result:out.ledger?'PASS':'FAIL'});
      const s=await summary();out.openCritical=s.openCritical;out.openHigh=s.openHigh;
      const derived=await scanDerivedIssues();out.derivedScan=derived;
    }catch(error){out.checks.push({name:'monitor_runtime',result:'FAIL',code:safeCode(error.code||error.constructor?.name)});}
    out.ok=out.database===true&&out.ledger===true;
    return out;
  }

  return Object.freeze({version:VERSION,record,list,summary,setStatus,scanDerivedIssues,readinessSnapshot,redactContext,severityFor});
}
module.exports={VERSION,COMMUNITY,createIncidentMonitor,redactContext,severityFor,safeWorkflow,safeCode};
