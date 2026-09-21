'use strict';
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const VERSION='FRANKLIN_ISSUE_MONITOR_3';
const COMMUNITY='FRANKLIN_TN';
const VALID_STATUS=new Set(['OPEN','ACKNOWLEDGED','RESOLVED','SUPPRESSED']);
const VALID_SEVERITY=new Set(['CRITICAL','HIGH','NORMAL']);
const SAFE_CONTEXT_KEYS=new Set([
  'action','path','httpStatus','latencyBucket','retryCount','state','provider','source',
  'eventType','outcome','reasonCode','routeClass','method','ageBucket','count','component',
  'checkoutState','membershipState','entitlementState','claimState','supportCategory',
  'clientSignal','assetType','responseClass','operation','environment','failureCause','release','deploy','originClass'
]);
const SECRET_KEY_RE=/(password|passcode|secret|token|cookie|authorization|card|cvv|cvc|bank|routing|session|api.?key|webhook.?secret|email|message|body|payload)/i;
const SAFE_CODE_RE=/^[A-Z0-9][A-Z0-9_.:-]{1,95}$/;
const SAFE_WORKFLOW_RE=/^[A-Z0-9][A-Z0-9_.:-]{1,79}$/;
const BROAD_PUBLIC_CODES=new Set(['ORIGIN_NOT_ALLOWED','FETCH_FAILED','FAILED_NAVIGATION_ACTION','BROKEN_ASSET','SEVERE_PAGE_LATENCY','SEVERE_LATENCY','HTTP_5XX','PAGE_5XX']);
function envMinutes(name,fallback,min=1,max=1440){const n=Number(process.env[name]||fallback);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback;}
const ALERT_COOLDOWN_MINUTES=Object.freeze({
  CRITICAL:envMinutes('FRANKLIN_ALERT_CRITICAL_COOLDOWN_MINUTES',15),
  HIGH:envMinutes('FRANKLIN_ALERT_HIGH_COOLDOWN_MINUTES',60),
  NORMAL:envMinutes('FRANKLIN_ALERT_NORMAL_COOLDOWN_MINUTES',360)
});
const ALERT_DIGEST_MINUTES=envMinutes('FRANKLIN_ALERT_DIGEST_MINUTES',360,30,1440);

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
  if(c==='ORIGIN_NOT_ALLOWED'&&Number(httpStatus||0)===403)return'NORMAL';
  if(critical.has(c))return'CRITICAL';
  if(high.has(c))return'HIGH';
  if(count>=3&&s>=500)return'CRITICAL';
  if(count>=3&&/(LOGIN|REGISTER|CLAIM|CHECKOUT|BILLING|PROFILE|SUPPORT)/.test(w))return'HIGH';
  if(count>=5)return'HIGH';
  return'NORMAL';
}
function hashRef(sha256,value){const v=clean(value,180);return v?sha256('FRANKLIN_TN:'+v):null}
function profileRef(value){const v=clean(value,120);return /^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(v)?v:null}
function incidentDimensions(input={},workflow='UNKNOWN',code='UNKNOWN',context=redactContext(input.context||{})){
  const environment=clean(input.environment||context.environment||(process.env.RENDER_SERVICE_ID?'PRODUCTION':'LOCAL'),32).toUpperCase().replace(/[^A-Z0-9_.:-]/g,'_')||'PRODUCTION';
  const affectedPath=safePath(context.path||input.path||'/');
  const httpMethod=clean(context.method||context.operation||input.method||'',16).toUpperCase().replace(/[^A-Z]/g,'')||'UNKNOWN';
  const failureCause=safeCode(context.failureCause||context.reasonCode||context.clientSignal||context.responseClass||code, safeCode(code));
  const component=safeCode(context.component||input.component||input.source||workflow, safeWorkflow(workflow));
  const releaseIdentity=clean(context.release||input.release||process.env.LOCAL_RELEASE||'',80)||null;
  return{environment,affectedPath,httpMethod,failureCause,component,releaseIdentity};
}
function alertDecision(row,now=Date.now()){
  const status=String(row.status||'').toUpperCase(),severity=String(row.severity||'').toUpperCase(),code=safeCode(row.safe_error_code||row.code||'UNKNOWN');
  if(status==='RESOLVED')return row.last_alert_at&&!row.resolved_alert_at?'RESOLVED':null;
  if(status!=='OPEN')return null;
  const alertable=severity==='CRITICAL'||severity==='HIGH'||code==='ORIGIN_NOT_ALLOWED';
  if(!alertable)return null;
  if(!row.last_alert_at)return'INITIAL';
  if(row.last_alert_severity&&rank(severity)>rank(String(row.last_alert_severity).toUpperCase()))return'ESCALATION';
  const last=Date.parse(row.last_alert_at);if(!Number.isFinite(last))return'UPDATE';
  const minutes=ALERT_COOLDOWN_MINUTES[severity]||ALERT_COOLDOWN_MINUTES.NORMAL;
  return now-last>=minutes*60000?'UPDATE':null;
}

function createIncidentMonitor({query,tx,newId,sha256}){
  if(typeof query!=='function'||typeof tx!=='function'||typeof newId!=='function'||typeof sha256!=='function')throw new Error('INCIDENT_MONITOR_DEPENDENCY_MISSING');
  const pending=[];
  const spoolPath=process.env.FRANKLIN_ISSUE_SPOOL_PATH||path.join(process.cwd(),'.franklin-issue-spool.jsonl');
  function queueSafe(input,error){
    const queued={
      workflow:safeWorkflow(input.workflow||'RUNTIME'),code:safeCode(input.code||error?.code||'INCIDENT_PERSIST_FAILED'),
      category:clean(input.category||categoryFor(input.workflow,input.code),60),severity:VALID_SEVERITY.has(String(input.severity||'').toUpperCase())?String(input.severity).toUpperCase():undefined,
      source:clean(input.source||'FRANKLIN_PLATFORM',60),requestId:clean(input.requestId||input.correlationId,120),
      profileId:profileRef(input.profileId),httpStatus:Number(input.httpStatus||0)||0,context:redactContext(input.context||{})
    };
    if(pending.length<500)pending.push(queued);
    try{fs.appendFileSync(spoolPath,JSON.stringify({...queued,queuedAt:new Date().toISOString()})+'\n',{encoding:'utf8',mode:0o600});}catch{}
    return queued;
  }
  function loadSpool(){
    try{
      if(!fs.existsSync(spoolPath))return;
      const lines=fs.readFileSync(spoolPath,'utf8').split(/\r?\n/).filter(Boolean).slice(-500);
      for(const line of lines){try{const row=JSON.parse(line);if(row&&pending.length<500)pending.push(row);}catch{}}
      fs.writeFileSync(spoolPath,'',{encoding:'utf8',mode:0o600});
    }catch{}
  }
  loadSpool();

  const alertConfig=Object.freeze({
    apiKey:String(process.env.FRANKLIN_ALERT_RESEND_API_KEY||process.env.RESEND_API_KEY||'').trim(),
    to:String(process.env.FRANKLIN_ALERT_TO_EMAIL||'').trim(),
    from:String(process.env.FRANKLIN_ALERT_FROM_EMAIL||'').trim()
  });
  const ALERT_EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function externalDeliveryConfigured(){
    return /^re_[A-Za-z0-9_\-]{12,}$/.test(alertConfig.apiKey)
      && ALERT_EMAIL_RE.test(alertConfig.to)
      && ALERT_EMAIL_RE.test(alertConfig.from);
  }
  function externalDeliveryStatus(){
    return externalDeliveryConfigured()?'RESEND_EMAIL_CONFIGURED':'CONFIGURATION_AUTHORITY_REQUIRED';
  }
  function alertText(row,kind='UPDATE'){
    const context=row.safe_context&&typeof row.safe_context==='object'?row.safe_context:{};
    const resolved=kind==='RESOLVED',first=kind==='INITIAL';
    const heading=resolved?'Franklin Navigator incident resolved':first?'Franklin Navigator incident opened':'Franklin Navigator incident still active';
    const firstMs=Date.parse(row.first_seen||''),resolvedMs=Date.parse(row.resolved_at||'');
    const duration=Number.isFinite(firstMs)&&Number.isFinite(resolvedMs)?Math.max(0,Math.round((resolvedMs-firstMs)/60000))+' minutes':null;
    return [
      heading,'',
      'Community: '+COMMUNITY,
      'Code: '+safeCode(row.safe_error_code),
      'First seen: '+clean(row.first_seen,80),
      resolved?'Resolved at: '+clean(row.resolved_at,80):'Last seen: '+clean(row.last_seen,80),
      duration?'Duration: '+duration:null,
      'Occurrences: '+Number(row.occurrence_count||1),
      'Current severity: '+clean(row.severity,16),
      'Affected route/component: '+clean(row.affected_path||context.path||row.component||row.workflow,220),
      'Status: '+clean(row.status,24),
      row.http_method?'Method: '+clean(row.http_method,16):null,
      row.failure_cause?'Failure cause: '+clean(row.failure_cause,96):null,
      row.release_identity?'Release: '+clean(row.release_identity,80):null,
      row.profile_id?'Profile: '+profileRef(row.profile_id):null,
      Object.keys(context).length?'Latest safe evidence: '+JSON.stringify(redactContext(context)):null,
      '',
      'Review the authenticated Franklin owner incident console before taking action.',
      'No passwords, tokens, payment credentials, raw support messages, or raw Assistant questions are included in this alert.'
    ].filter(Boolean).join('\n');
  }
  async function sendResendAlert(row,kind='UPDATE'){
    if(!externalDeliveryConfigured())throw Object.assign(new Error('OWNER_ALERT_DELIVERY_NOT_CONFIGURED'),{code:'OWNER_ALERT_DELIVERY_NOT_CONFIGURED'});
    const subject=kind==='RESOLVED'
      ?'[Franklin Navigator] Resolved: '+clean(row.workflow,60)+' / '+safeCode(row.safe_error_code)
      :'[Franklin Navigator] '+clean(row.severity,16)+' incident: '+clean(row.workflow,60)+' / '+safeCode(row.safe_error_code);
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:'Bearer '+alertConfig.apiKey,'Content-Type':'application/json'},
      body:JSON.stringify({from:alertConfig.from,to:[alertConfig.to],subject,text:alertText(row,kind)}),
      signal:AbortSignal.timeout(8000)
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.id)throw Object.assign(new Error('OWNER_ALERT_DELIVERY_FAILED'),{code:'OWNER_ALERT_DELIVERY_FAILED'});
    return {id:clean(payload.id,120)};
  }
  async function sendResendDigest(rows){
    if(!externalDeliveryConfigured())throw Object.assign(new Error('OWNER_ALERT_DELIVERY_NOT_CONFIGURED'),{code:'OWNER_ALERT_DELIVERY_NOT_CONFIGURED'});
    const lines=['Franklin Navigator incident digest','',...rows.map(row=>[
      row.workflow+' / '+row.safe_error_code,
      'Severity: '+row.severity,
      'Occurrences: '+Number(row.occurrence_count||1),
      'First/last: '+clean(row.first_seen,40)+' / '+clean(row.last_seen,40),
      'Affected: '+clean(row.affected_path||row.component||'—',180)
    ].join(' · '))];
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:'Bearer '+alertConfig.apiKey,'Content-Type':'application/json'},
      body:JSON.stringify({from:alertConfig.from,to:[alertConfig.to],subject:'[Franklin Navigator] Incident digest',text:lines.join('\n')}),
      signal:AbortSignal.timeout(8000)
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.id)throw Object.assign(new Error('OWNER_ALERT_DIGEST_FAILED'),{code:'OWNER_ALERT_DIGEST_FAILED'});
    return{id:clean(payload.id,120)};
  }
  async function deliverPendingAlerts(){
    if(!externalDeliveryConfigured())return {configured:false,delivery:'CONFIGURATION_AUTHORITY_REQUIRED',attempted:0,delivered:0,failed:0};
    const rows=(await query(`
      select incident_id,category,severity,workflow,safe_error_code,status,safe_context,profile_id,
             occurrence_count,first_seen,last_seen,last_alert_at,last_alert_severity,resolved_at,resolved_alert_at,
             affected_path,http_method,failure_cause,component,release_identity
      from franklin_incidents
      where (status='OPEN' and (severity in ('CRITICAL','HIGH') or safe_error_code='ORIGIN_NOT_ALLOWED'))
         or (status='RESOLVED' and last_alert_at is not null and resolved_alert_at is null)
      order by case when status='RESOLVED' then 0 when severity='CRITICAL' then 1 when severity='HIGH' then 2 else 3 end,last_seen desc
      limit 100
    `)).rows;
    let delivered=0,failed=0,attempted=0;
    for(const row of rows){
      const kind=alertDecision(row);if(!kind)continue;attempted++;
      try{
        await sendResendAlert(row,kind);
        if(kind==='RESOLVED')await query("update franklin_incidents set alert_delivery_state='DELIVERED',resolved_alert_at=now(),last_notification_kind='RESOLVED',updated_at=now() where incident_id=$1",[row.incident_id]);
        else await query("update franklin_incidents set alert_delivery_state='DELIVERED',last_alert_at=now(),last_alert_severity=severity,last_notification_kind=$2,updated_at=now() where incident_id=$1",[row.incident_id,kind]);
        delivered++;
      }catch(error){
        await query("update franklin_incidents set alert_delivery_state='FAILED',last_notification_kind='FAILED',updated_at=now() where incident_id=$1",[row.incident_id]).catch(()=>{});
        failed++;
      }
    }
    return {configured:true,delivery:'RESEND_EMAIL_CONFIGURED',attempted,delivered,failed};
  }
  async function digestSnapshot(limit=50){
    const n=Math.max(1,Math.min(100,Number(limit)||50));
    const rows=(await query(`
      select incident_id,severity,workflow,safe_error_code,status,first_seen,last_seen,occurrence_count,
             affected_path,component,last_digest_at
      from franklin_incidents
      where severity='NORMAL' and status in ('OPEN','RESOLVED') and occurrence_count>1
        and safe_error_code<>'ORIGIN_NOT_ALLOWED'
      order by last_seen desc limit $1
    `,[n])).rows;
    return {community:COMMUNITY,intervalMinutes:ALERT_DIGEST_MINUTES,incidents:rows};
  }
  async function deliverDigestIfDue(){
    if(!externalDeliveryConfigured())return {configured:false,attempted:0,delivered:0};
    const rows=(await query(`
      select incident_id,severity,workflow,safe_error_code,status,first_seen,last_seen,occurrence_count,
             affected_path,component,last_digest_at
      from franklin_incidents
      where severity='NORMAL' and status='OPEN' and occurrence_count>1 and safe_error_code<>'ORIGIN_NOT_ALLOWED'
        and (last_digest_at is null or last_digest_at<now()-($1::text||' minutes')::interval)
      order by last_seen desc limit 50
    `,[String(ALERT_DIGEST_MINUTES)])).rows;
    if(!rows.length)return {configured:true,attempted:0,delivered:0};
    await sendResendDigest(rows);
    await query('update franklin_incidents set last_digest_at=now(),updated_at=now() where incident_id=any($1::text[])',[rows.map(x=>x.incident_id)]);
    return {configured:true,attempted:rows.length,delivered:1};
  }

  async function persistRecord(input={},client=null){
    const workflow=safeWorkflow(input.workflow||'UNKNOWN');
    const code=safeCode(input.code||'UNKNOWN');
    const category=clean(input.category||categoryFor(workflow,code),60).toUpperCase().replace(/[^A-Z0-9_-]/g,'_')||'RUNTIME';
    const context=redactContext({...input.context,httpStatus:input.httpStatus??input.context?.httpStatus});
    const accountHash=hashRef(sha256,input.accountId||input.accountRef);
    const membershipHash=hashRef(sha256,input.membershipId||input.membershipRef);
    const profileId=profileRef(input.profileId);
    const dimensions=incidentDimensions(input,workflow,code,context);
    const broadLegacy=/^(RUNTIME|PUBLIC_SITE|PAYMENT_MEMBERSHIP)$/.test(category)&&/^(SERVICE_NOT_READY|DATABASE_NOT_CONFIGURED|CHECKOUT_INFRASTRUCTURE_NOT_READY|STRIPE_API_NOT_CONFIGURED|STRIPE_CHECKOUT_NOT_CONFIGURED|STRIPE_API_REQUEST_FAILED|WEBHOOK_PROCESSING_FAILED|CLIENT_JS_ERROR|CLIENT_UNHANDLED_REJECTION|BROKEN_ASSET|HTTP_5XX)$/.test(code);
    const broadPublic=(category==='PUBLIC_SITE'||workflow==='PUBLIC_SITE')&&BROAD_PUBLIC_CODES.has(code);
    const broad=broadLegacy||broadPublic;
    const releaseSensitive=/DEPLOY|RELEASE|CONFIG|MIGRATION/.test(code);
    const fingerprint=sha256([
      COMMUNITY,dimensions.environment,category,workflow,code,dimensions.affectedPath,dimensions.httpMethod,
      dimensions.failureCause,dimensions.component,releaseSensitive?(dimensions.releaseIdentity||''):'',
      broad?'':(accountHash||''),broad?'':(profileId||''),broad?'':(membershipHash||'')
    ].join('|'));
    const db=client||{query};
    const initialSeverity=severityFor({workflow,code,httpStatus:input.httpStatus,hint:input.severity,count:1});
    const incidentId=newId('incident');
    const correlationId=clean(input.correlationId||input.requestId,120)||null;
    const source=clean(input.source||'FRANKLIN_PLATFORM',60).toUpperCase().replace(/[^A-Z0-9_.:-]/g,'_')||'FRANKLIN_PLATFORM';
    const inserted=await db.query(`
      insert into franklin_incidents(
        incident_id,community,fingerprint_sha256,category,severity,workflow,safe_error_code,source,
        correlation_id,profile_id,account_ref_hash,membership_ref_hash,safe_context,status,
        alert_delivery_state,first_seen,last_seen,occurrence_count,updated_at,
        environment,affected_path,http_method,failure_cause,component,release_identity,last_state_change_at
      ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,'OPEN','EXTERNAL_CONFIG_REQUIRED',now(),now(),1,now(),
        $14,$15,$16,$17,$18,$19,now())
      on conflict(fingerprint_sha256) do update set
        last_seen=now(),occurrence_count=franklin_incidents.occurrence_count+1,
        correlation_id=coalesce(excluded.correlation_id,franklin_incidents.correlation_id),
        profile_id=coalesce(excluded.profile_id,franklin_incidents.profile_id),
        safe_context=excluded.safe_context,environment=excluded.environment,affected_path=excluded.affected_path,
        http_method=excluded.http_method,failure_cause=excluded.failure_cause,component=excluded.component,
        release_identity=coalesce(excluded.release_identity,franklin_incidents.release_identity),
        status=case when franklin_incidents.status='RESOLVED' then 'OPEN' else franklin_incidents.status end,
        resolved_at=case when franklin_incidents.status='RESOLVED' then null else franklin_incidents.resolved_at end,
        resolution_note=case when franklin_incidents.status='RESOLVED' then null else franklin_incidents.resolution_note end,
        resolved_alert_at=case when franklin_incidents.status='RESOLVED' then null else franklin_incidents.resolved_alert_at end,
        last_alert_at=case when franklin_incidents.status='RESOLVED' then null else franklin_incidents.last_alert_at end,
        last_alert_severity=case when franklin_incidents.status='RESOLVED' then null else franklin_incidents.last_alert_severity end,
        reopened_at=case when franklin_incidents.status='RESOLVED' then now() else franklin_incidents.reopened_at end,
        last_state_change_at=case when franklin_incidents.status='RESOLVED' then now() else franklin_incidents.last_state_change_at end,
        updated_at=now()
      returning incident_id,severity,occurrence_count,status,last_alert_at,last_alert_severity,reopened_at
    `,[incidentId,COMMUNITY,fingerprint,category,initialSeverity,workflow,code,source,correlationId,profileId,accountHash,membershipHash,JSON.stringify(context),
      dimensions.environment,dimensions.affectedPath,dimensions.httpMethod,dimensions.failureCause,dimensions.component,dimensions.releaseIdentity]);
    const row=inserted.rows[0];
    const escalated=severityFor({workflow,code,httpStatus:input.httpStatus,hint:input.severity,count:Number(row.occurrence_count||1)});
    if(rank(escalated)>rank(row.severity)){
      await db.query("update franklin_incidents set severity=$2,last_alert_at=null,last_alert_severity=null,last_notification_kind=null,last_state_change_at=now(),updated_at=now() where incident_id=$1",[row.incident_id,escalated]);
      row.severity=escalated;
    }
    await db.query('insert into franklin_incident_events(event_id,incident_id,community,correlation_id,safe_context) values($1,$2,$3,$4,$5::jsonb)',[newId('ievt'),row.incident_id,COMMUNITY,correlationId,JSON.stringify(context)]);
    return {...row,category,workflow,code,fingerprint,dimensions,externalDelivery:externalDeliveryStatus()};
  }

  async function record(input={},client=null){
    try{return await persistRecord(input,client)}
    catch(error){
      if(client)throw error;
      const queued=queueSafe(input,error);
      return {queued:true,severity:severityFor({workflow:queued.workflow,code:queued.code,httpStatus:queued.httpStatus,hint:queued.severity,count:1}),externalDelivery:externalDeliveryStatus()};
    }
  }
  async function flushPending(){
    let flushed=0;
    while(pending.length){
      const item=pending[0];
      try{await persistRecord(item);pending.shift();flushed++;}
      catch{break}
    }
    if(!pending.length)try{fs.writeFileSync(spoolPath,'',{encoding:'utf8',mode:0o600});}catch{}
    return {flushed,pending:pending.length};
  }

  async function list({status='OPEN',severity=[],limit=100}={}){
    const statuses=String(status||'OPEN').split(',').map(x=>x.trim().toUpperCase()).filter(x=>VALID_STATUS.has(x));
    const sevs=(Array.isArray(severity)?severity:String(severity||'').split(',')).map(x=>String(x).trim().toUpperCase()).filter(x=>VALID_SEVERITY.has(x));
    const n=Math.max(1,Math.min(200,Number(limit)||100));
    const rows=(await query(`
      select incident_id,community,category,severity,workflow,safe_error_code,source,correlation_id,
             profile_id,account_ref_hash,membership_ref_hash,safe_context,status,first_seen,last_seen,
             occurrence_count,alert_delivery_state,last_alert_at,last_alert_severity,last_notification_kind,resolution_note,resolved_at,resolved_alert_at,reopened_at,last_digest_at,last_state_change_at,
             fingerprint_sha256,environment,affected_path,http_method,failure_cause,component,release_identity,updated_at
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
    return {community:COMMUNITY,counts,openCritical,openHigh,externalDelivery:externalDeliveryStatus(),ownerVisibility:true,version:VERSION,alertCooldownMinutes:ALERT_COOLDOWN_MINUTES,alertDigestMinutes:ALERT_DIGEST_MINUTES};
  }

  async function setStatus(incidentId,status,note=''){
    const id=clean(incidentId,120),next=String(status||'').toUpperCase();
    if(!/^incident_[A-Za-z0-9]+$/.test(id)||!VALID_STATUS.has(next))throw Object.assign(new Error('INCIDENT_STATE_INVALID'),{code:'INCIDENT_STATE_INVALID',status:400});
    const resolution=clean(note,500)||null;
    const result=await query(`
      update franklin_incidents set status=$2,resolution_note=$3,
        resolved_at=case when $2='RESOLVED' then now() else resolved_at end,
        resolved_alert_at=case when $2='RESOLVED' then null else resolved_alert_at end,
        last_state_change_at=now(),updated_at=now()
      where incident_id=$1
      returning incident_id,status,resolution_note,resolved_at,resolved_alert_at
    `,[id,next,resolution]);
    if(!result.rowCount)throw Object.assign(new Error('INCIDENT_NOT_FOUND'),{code:'INCIDENT_NOT_FOUND',status:404});
    return result.rows[0];
  }

  async function scanDerivedIssues(){
    await flushPending();
    const checks=[];
    async function safeScan(name,fn){try{const n=await fn();checks.push({name,result:'PASS',count:Number(n||0)});}catch(error){checks.push({name,result:'ERROR',code:safeCode(error.code||error.constructor?.name)});}}
    await safeScan('recovered_public_site_5xx',async()=>{
      const rows=(await query(`
        select incident_id,last_seen
        from franklin_incidents
        where status='OPEN'
          and category='PUBLIC_SITE'
          and workflow='PUBLIC_SITE'
          and safe_error_code='HTTP_5XX'
          and source='CLIENT_TELEMETRY'
          and last_seen<now()-interval '2 hours'
        order by last_seen asc
        limit 100
      `)).rows;
      for(const row of rows)await setStatus(
        row.incident_id,
        'RESOLVED',
        'Auto-resolved after a two-hour quiet recovery window with no repeated public-site 5xx telemetry. A new occurrence will reopen the incident.'
      );
      return rows.length;
    });
    await safeScan('origin_not_allowed_security_control',async()=>{
      const result=await query("update franklin_incidents set severity='NORMAL',last_state_change_at=now(),updated_at=now() where status in ('OPEN','ACKNOWLEDGED') and safe_error_code='ORIGIN_NOT_ALLOWED' and severity<>'NORMAL'");
      return result.rowCount||0;
    });
    await safeScan('quiet_public_recovery',async()=>{
      const rows=(await query(`
        select incident_id from franklin_incidents
        where status='OPEN' and category='PUBLIC_SITE'
          and safe_error_code=any($1::text[])
          and last_seen<now()-interval '2 hours'
        order by last_seen asc limit 100
      `,[[...BROAD_PUBLIC_CODES]])).rows;
      for(const row of rows)await setStatus(row.incident_id,'RESOLVED','Auto-resolved after a two-hour quiet recovery window. A genuine recurrence will reopen this same fingerprinted incident.');
      return rows.length;
    });
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
    const out={community:COMMUNITY,version:VERSION,ledger:false,ownerVisibility:true,externalDelivery:externalDeliveryStatus(),alertDeliveryConfigured:externalDeliveryConfigured(),checks:[]};
    try{
      const q=await query('select 1 ok');out.database=Boolean(q.rowCount);out.checks.push({name:'database',result:out.database?'PASS':'FAIL'});
      const table=await query("select 1 from information_schema.tables where table_schema=current_schema() and table_name='franklin_incidents'");
      out.ledger=Boolean(table.rowCount);out.checks.push({name:'incident_ledger',result:out.ledger?'PASS':'FAIL'});
      const s=await summary();out.openCritical=s.openCritical;out.openHigh=s.openHigh;
      const derived=await scanDerivedIssues();out.derivedScan=derived;
      out.alertDelivery=await deliverPendingAlerts();
      out.digestDelivery=await deliverDigestIfDue();
    }catch(error){out.checks.push({name:'monitor_runtime',result:'FAIL',code:safeCode(error.code||error.constructor?.name)});}
    out.ok=out.database===true&&out.ledger===true;
    return out;
  }

  async function selfTest(){
    const sentinel='SHOULD_NOT_PERSIST_SECRET';
    const redacted=redactContext({path:'/synthetic',password:sentinel,token:sentinel,cardNumber:sentinel,action:'SELF_TEST'});
    if(JSON.stringify(redacted).includes(sentinel))throw new Error('INCIDENT_REDACTION_SELF_TEST_FAILED');
    if(severityFor({workflow:'ENTITLEMENT',code:'MEMBERSHIP_ENTITLEMENT_MISMATCH'})!=='CRITICAL')throw new Error('INCIDENT_SEVERITY_SELF_TEST_FAILED');
    if(severityFor({workflow:'PUBLIC_SITE',code:'ORIGIN_NOT_ALLOWED',httpStatus:403})!=='NORMAL')throw new Error('INCIDENT_ORIGIN_CLASSIFICATION_SELF_TEST_FAILED');
    const first=await persistRecord({category:'RUNTIME',workflow:'MONITOR_SELF_TEST',code:'SYNTHETIC_MONITOR_CHECK',source:'STARTUP_SELF_TEST',context:{path:'/synthetic',action:'SELF_TEST',password:sentinel}});
    const second=await persistRecord({category:'RUNTIME',workflow:'MONITOR_SELF_TEST',code:'SYNTHETIC_MONITOR_CHECK',source:'STARTUP_SELF_TEST',context:{path:'/synthetic',action:'SELF_TEST',token:sentinel}});
    if(first.incident_id!==second.incident_id||Number(second.occurrence_count)<=Number(first.occurrence_count))throw new Error('INCIDENT_DEDUP_SELF_TEST_FAILED');
    const row=(await query('select safe_context from franklin_incidents where incident_id=$1',[second.incident_id])).rows[0];
    if(!row||JSON.stringify(row.safe_context).includes(sentinel))throw new Error('INCIDENT_LEDGER_SECRET_SELF_TEST_FAILED');
    await setStatus(second.incident_id,'RESOLVED','Automated startup monitoring self-test passed.');
    return {ok:true,dedup:true,redaction:true,resolution:true,originSecurityClassification:true,externalDelivery:externalDeliveryStatus(),alertDeliveryConfigured:externalDeliveryConfigured(),pending:pending.length};
  }

  return Object.freeze({version:VERSION,record,flushPending,list,summary,setStatus,scanDerivedIssues,deliverPendingAlerts,deliverDigestIfDue,digestSnapshot,readinessSnapshot,selfTest,redactContext,severityFor,externalDeliveryConfigured,externalDeliveryStatus,pendingCount:()=>pending.length,alertCooldownMinutes:ALERT_COOLDOWN_MINUTES,alertDigestMinutes:ALERT_DIGEST_MINUTES});
}
module.exports={VERSION,COMMUNITY,createIncidentMonitor,redactContext,severityFor,safeWorkflow,safeCode,incidentDimensions,alertDecision,ALERT_COOLDOWN_MINUTES,ALERT_DIGEST_MINUTES};
