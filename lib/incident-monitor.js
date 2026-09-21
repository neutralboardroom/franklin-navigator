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
  'clientSignal','assetType','responseClass','operation','environment','release','deployment','originClass'
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
function severityFor({workflow,code,httpStatus=0,hint,count=1,context={}}){
  if(VALID_SEVERITY.has(String(hint||'').toUpperCase()))return String(hint).toUpperCase();
  const w=safeWorkflow(workflow),c=safeCode(code),s=Number(httpStatus||0),ctx=redactContext(context);
  const method=clean(ctx.method||ctx.operation,16).toUpperCase();
  const pathKey=safePath(ctx.path||'/');
  if(c==='ORIGIN_NOT_ALLOWED'&&method==='OPTIONS'&&pathKey==='/api/telemetry/issue')return'NORMAL';
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
function normalizeMethod(value){return clean(value||'UNKNOWN',16).toUpperCase().replace(/[^A-Z]/g,'')||'UNKNOWN'}
function normalizedCause(context={}){
  const ctx=redactContext(context);
  if(ctx.reasonCode)return safeCode(ctx.reasonCode,'UNKNOWN');
  if(ctx.clientSignal)return safeCode(ctx.clientSignal,'UNKNOWN');
  if(ctx.responseClass)return safeCode(ctx.responseClass,'UNKNOWN');
  if(Number(ctx.httpStatus||0))return 'HTTP_'+String(Math.floor(Number(ctx.httpStatus)/100))+'XX';
  if(ctx.latencyBucket)return safeCode(ctx.latencyBucket,'UNKNOWN');
  return'UNKNOWN';
}
function fingerprintParts({category,workflow,code,context={},accountHash='',profileId='',membershipHash=''}) {
  const ctx=redactContext(context),cat=clean(category,60).toUpperCase(),wf=safeWorkflow(workflow),err=safeCode(code);
  const publicScoped=/^(PUBLIC_SITE|RUNTIME|PAYMENT_MEMBERSHIP)$/.test(cat);
  const method=normalizeMethod(ctx.method||ctx.operation);
  const pathKey=safePath(ctx.path||'/');
  const cause=normalizedCause(ctx);
  const component=safeCode(ctx.component||cat||'RUNTIME','RUNTIME');
  const environment=safeCode(ctx.environment||'PRODUCTION','PRODUCTION');
  const releaseSensitive=/^(BROKEN_ASSET|CLIENT_JS_ERROR|CLIENT_UNHANDLED_REJECTION|FAILED_NAVIGATION_ACTION|FETCH_FAILED|SEVERE_LATENCY|SEVERE_PAGE_LATENCY|PAGE_5XX|HTTP_5XX)$/.test(err);
  const releaseKey=releaseSensitive?clean(ctx.release,80):'';
  return [COMMUNITY,environment,cat,wf,err,pathKey,method,cause,component,releaseKey,publicScoped?'':accountHash,publicScoped?'':membershipHash,publicScoped?'':(profileId||'')];
}
function rankSeverityValue(value){return rank(String(value||'NORMAL').toUpperCase())}
function notificationDecision(row,last,{now=Date.now(),criticalCooldownMinutes=15,highCooldownMinutes=60,updateMinOccurrences=5,durationEscalationMinutes=120}={}){
  const status=String(row.status||'OPEN').toUpperCase();
  const severity=String(row.severity||'NORMAL').toUpperCase();
  if(status==='RESOLVED'){
    if(!last||last.kind==='RESOLVED')return null;
    return'RESOLVED';
  }
  if(!['OPEN','ACKNOWLEDGED'].includes(status)||!['CRITICAL','HIGH'].includes(severity))return null;
  if(!last)return'INITIAL';
  if(last.kind==='RESOLVED')return'REOPENED';
  if(rankSeverityValue(severity)>rankSeverityValue(last.severity))return'ESCALATION';
  const lastAt=Date.parse(last.at||'')||0;
  const cooldownMs=(severity==='CRITICAL'?criticalCooldownMinutes:highCooldownMinutes)*60000;
  if(now-lastAt<cooldownMs)return null;
  const delta=Math.max(0,Number(row.occurrence_count||0)-Number(last.count||0));
  const firstMs=Date.parse(row.first_seen||'')||now;
  const durationMinutes=Math.max(0,(now-firstMs)/60000);
  if(delta>=updateMinOccurrences||durationMinutes>=durationEscalationMinutes)return'UPDATE';
  return null;
}
function hashRef(sha256,value){const v=clean(value,180);return v?sha256('FRANKLIN_TN:'+v):null}
function profileRef(value){const v=clean(value,120);return /^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(v)?v:null}

function createIncidentMonitor({query,tx,newId,sha256,release='UNKNOWN',environment='PRODUCTION'}){
  if(typeof query!=='function'||typeof tx!=='function'||typeof newId!=='function'||typeof sha256!=='function')throw new Error('INCIDENT_MONITOR_DEPENDENCY_MISSING');
  const pending=[];
  const runtimeRelease=clean(release,80)||'UNKNOWN';
  const runtimeEnvironment=safeCode(environment,'PRODUCTION');
  let deliveryTimer=null;
  let deliveryPromise=null;
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
  const criticalCooldownMinutes=Math.max(1,Math.min(240,Number(process.env.FRANKLIN_ALERT_CRITICAL_COOLDOWN_MINUTES||15)));
  const highCooldownMinutes=Math.max(5,Math.min(1440,Number(process.env.FRANKLIN_ALERT_HIGH_COOLDOWN_MINUTES||60)));
  const normalCooldownMinutes=Math.max(15,Math.min(10080,Number(process.env.FRANKLIN_ALERT_NORMAL_COOLDOWN_MINUTES||360)));
  const digestMinutes=Math.max(30,Math.min(10080,Number(process.env.FRANKLIN_ALERT_DIGEST_MINUTES||720)));
  const updateMinOccurrences=Math.max(2,Math.min(1000,Number(process.env.FRANKLIN_ALERT_UPDATE_MIN_OCCURRENCES||5)));
  const durationEscalationMinutes=Math.max(15,Math.min(10080,Number(process.env.FRANKLIN_ALERT_DURATION_ESCALATION_MINUTES||120)));
  function scheduleAlertDelivery(){
    if(deliveryTimer||deliveryPromise||!externalDeliveryConfigured())return;
    deliveryTimer=setTimeout(()=>{deliveryTimer=null;deliverPendingAlerts().catch(()=>{});},150);
    deliveryTimer.unref?.();
  }
  function alertText(row,kind='INITIAL'){
    const context=row.safe_context&&typeof row.safe_context==='object'?row.safe_context:{};
    return [
      kind==='RESOLVED'?'Franklin Navigator incident resolved':kind==='UPDATE'?'Franklin Navigator incident still active':kind==='ESCALATION'?'Franklin Navigator incident escalated':kind==='REOPENED'?'Franklin Navigator incident reopened':'Franklin Navigator owner incident alert',
      '',
      'Community: '+COMMUNITY,
      'Severity: '+clean(row.severity,16),
      'Category: '+clean(row.category,60),
      'Workflow: '+clean(row.workflow,80),
      'Code: '+safeCode(row.safe_error_code),
      'Incident: '+clean(row.incident_id,120),
      'Status: '+clean(row.status,24),
      'Occurrences: '+Number(row.occurrence_count||1),
      'First seen: '+clean(row.first_seen,80),
      'Last seen: '+clean(row.last_seen,80),
      row.profile_id?'Profile: '+profileRef(row.profile_id):null,
      Object.keys(context).length?'Safe context: '+JSON.stringify(redactContext(context)):null,
      '',
      'Review the authenticated Franklin owner incident console before taking action.',
      'No passwords, tokens, payment credentials, raw support messages, or raw Assistant questions are included in this alert.'
    ].filter(Boolean).join('\n');
  }
  async function sendResendAlert(row,kind='INITIAL'){
    if(!externalDeliveryConfigured())throw Object.assign(new Error('OWNER_ALERT_DELIVERY_NOT_CONFIGURED'),{code:'OWNER_ALERT_DELIVERY_NOT_CONFIGURED'});
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:'Bearer '+alertConfig.apiKey,'Content-Type':'application/json'},
      body:JSON.stringify({
        from:alertConfig.from,
        to:[alertConfig.to],
        subject:'[Franklin Navigator] '+(kind==='RESOLVED'?'RESOLVED ':kind==='UPDATE'?'UPDATE ':kind==='ESCALATION'?'ESCALATED ':kind==='REOPENED'?'REOPENED ':'')+clean(row.severity,16)+' incident: '+clean(row.workflow,60)+' / '+safeCode(row.safe_error_code),
        text:alertText(row,kind)
      }),
      signal:AbortSignal.timeout(8000)
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.id)throw Object.assign(new Error('OWNER_ALERT_DELIVERY_FAILED'),{code:'OWNER_ALERT_DELIVERY_FAILED'});
    return {id:clean(payload.id,120)};
  }
  async function lastNotification(incidentId){
    const row=(await query(`
      select safe_context,occurred_at
      from franklin_incident_events
      where incident_id=$1 and safe_context->>'eventType' like 'OWNER_ALERT_%'
      order by occurred_at desc
      limit 1
    `,[incidentId])).rows[0];
    if(!row)return null;
    const ctx=row.safe_context&&typeof row.safe_context==='object'?row.safe_context:{};
    return {kind:String(ctx.eventType||'').replace(/^OWNER_ALERT_/,'')||'INITIAL',severity:String(ctx.reasonCode||'NORMAL'),count:Number(ctx.count||0),state:String(ctx.state||''),at:row.occurred_at};
  }
  async function markNotification(row,kind){
    await query('insert into franklin_incident_events(event_id,incident_id,community,correlation_id,safe_context) values($1,$2,$3,$4,$5::jsonb)',[
      newId('ievt'),row.incident_id,COMMUNITY,row.correlation_id||null,
      JSON.stringify({eventType:'OWNER_ALERT_'+kind,state:row.status,count:Number(row.occurrence_count||0),reasonCode:row.severity})
    ]);
  }
  async function deliverPendingAlerts(){
    if(deliveryPromise)return deliveryPromise;
    deliveryPromise=(async()=>{
      if(!externalDeliveryConfigured())return {configured:false,delivery:'CONFIGURATION_AUTHORITY_REQUIRED',attempted:0,delivered:0,failed:0,suppressed:0};
      const rows=(await query(`
        select incident_id,fingerprint_sha256,category,severity,workflow,safe_error_code,status,safe_context,profile_id,
               correlation_id,occurrence_count,first_seen,last_seen,last_alert_at,resolved_at,resolution_note
        from franklin_incidents
        where (
          status in ('OPEN','ACKNOWLEDGED') and severity in ('CRITICAL','HIGH')
        ) or (
          status='RESOLVED' and resolved_at>now()-interval '7 days' and last_alert_at is not null
        )
        order by case severity when 'CRITICAL' then 1 when 'HIGH' then 2 else 3 end,last_seen desc
        limit 100
      `)).rows;
      let delivered=0,failed=0,suppressed=0;
      for(const row of rows){
        const last=await lastNotification(row.incident_id);
        const kind=notificationDecision(row,last,{criticalCooldownMinutes,highCooldownMinutes,updateMinOccurrences,durationEscalationMinutes});
        if(!kind){suppressed++;continue;}
        try{
          await sendResendAlert(row,kind);
          await query("update franklin_incidents set alert_delivery_state='DELIVERED',last_alert_at=now(),updated_at=now() where incident_id=$1",[row.incident_id]);
          await markNotification(row,kind);
          delivered++;
        }catch(error){
          await query("update franklin_incidents set alert_delivery_state='FAILED',last_alert_at=now(),updated_at=now() where incident_id=$1",[row.incident_id]).catch(()=>{});
          failed++;
        }
      }
      return {configured:true,delivery:'RESEND_EMAIL_CONFIGURED',attempted:rows.length,delivered,failed,suppressed};
    })();
    try{return await deliveryPromise}finally{deliveryPromise=null}
  }

  async function persistRecord(input={},client=null){
    const workflow=safeWorkflow(input.workflow||'UNKNOWN');
    const code=safeCode(input.code||'UNKNOWN');
    const category=clean(input.category||categoryFor(workflow,code),60).toUpperCase().replace(/[^A-Z0-9_-]/g,'_')||'RUNTIME';
    const context=redactContext({...input.context,httpStatus:input.httpStatus??input.context?.httpStatus,environment:input.context?.environment||runtimeEnvironment,release:input.context?.release||runtimeRelease,component:input.context?.component||input.category||categoryFor(workflow,code)});
    const accountHash=hashRef(sha256,input.accountId||input.accountRef);
    const membershipHash=hashRef(sha256,input.membershipId||input.membershipRef);
    const profileId=profileRef(input.profileId);
    const fingerprint=sha256(fingerprintParts({category,workflow,code,context,accountHash:accountHash||'',profileId:profileId||'',membershipHash:membershipHash||''}).join('|'));
    const db=client||{query};
    const initialSeverity=severityFor({workflow,code,httpStatus:input.httpStatus,hint:input.severity,count:1,context});
    const incidentId=newId('incident');
    const correlationId=clean(input.correlationId||input.requestId,120)||null;
    const source=clean(input.source||'FRANKLIN_PLATFORM',60).toUpperCase().replace(/[^A-Z0-9_.:-]/g,'_')||'FRANKLIN_PLATFORM';
    const prior=(await db.query('select incident_id,status from franklin_incidents where fingerprint_sha256=$1 limit 1',[fingerprint])).rows[0]||null;
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
    const escalated=severityFor({workflow,code,httpStatus:input.httpStatus,hint:input.severity,count:Number(row.occurrence_count||1),context});
    if(rank(escalated)>rank(row.severity)){
      await db.query('update franklin_incidents set severity=$2,updated_at=now() where incident_id=$1',[row.incident_id,escalated]);
      row.severity=escalated;
    }
    await db.query('insert into franklin_incident_events(event_id,incident_id,community,correlation_id,safe_context) values($1,$2,$3,$4,$5::jsonb)',[newId('ievt'),row.incident_id,COMMUNITY,correlationId,JSON.stringify(context)]);
    if(prior?.status==='RESOLVED'){
      await db.query('insert into franklin_incident_events(event_id,incident_id,community,correlation_id,safe_context) values($1,$2,$3,$4,$5::jsonb)',[
        newId('ievt'),row.incident_id,COMMUNITY,correlationId,JSON.stringify({eventType:'INCIDENT_REOPENED',state:'OPEN',count:Number(row.occurrence_count||1)})
      ]);
    }
    return {...row,category,workflow,code,reopened:prior?.status==='RESOLVED',externalDelivery:externalDeliveryStatus()};
  }

  async function record(input={},client=null){
    try{
      const out=await persistRecord(input,client);
      if(!client)scheduleAlertDelivery();
      return out;
    }
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
      select incident_id,community,fingerprint_sha256,category,severity,workflow,safe_error_code,source,correlation_id,
             profile_id,account_ref_hash,membership_ref_hash,safe_context,status,first_seen,last_seen,
             occurrence_count,alert_delivery_state,last_alert_at,resolution_note,resolved_at,updated_at,
             safe_context->>'path' as affected_path,coalesce(safe_context->>'method',safe_context->>'operation') as http_method,
             coalesce(safe_context->>'reasonCode',safe_context->>'clientSignal',safe_context->>'responseClass') as failure_cause,
             safe_context->>'component' as component,safe_context->>'release' as release_identity,
             (
               select replace(e.safe_context->>'eventType','OWNER_ALERT_','')
               from franklin_incident_events e
               where e.incident_id=franklin_incidents.incident_id and e.safe_context->>'eventType' like 'OWNER_ALERT_%'
               order by e.occurred_at desc limit 1
             ) as last_notification_kind,
             (
               select e.occurred_at
               from franklin_incident_events e
               where e.incident_id=franklin_incidents.incident_id and e.safe_context->>'eventType'='INCIDENT_REOPENED'
               order by e.occurred_at desc limit 1
             ) as reopened_at
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
    return {community:COMMUNITY,counts,openCritical,openHigh,externalDelivery:externalDeliveryStatus(),ownerVisibility:true,version:VERSION,alertCooldownMinutes:{CRITICAL:criticalCooldownMinutes,HIGH:highCooldownMinutes,NORMAL:normalCooldownMinutes},alertDigestMinutes:digestMinutes,deduplication:'community+environment+category+workflow+code+route+method+normalized-cause+component+scoped-identity',recoveryNotifications:true};
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
    if(next==='RESOLVED')scheduleAlertDelivery();
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

  async function digest({hours=12,limit=50}={}){
    const h=Math.max(1,Math.min(168,Number(hours)||12)),n=Math.max(1,Math.min(100,Number(limit)||50));
    const rows=(await query(`
      select incident_id,fingerprint_sha256,category,severity,workflow,safe_error_code,status,first_seen,last_seen,
             occurrence_count,safe_context,resolved_at
      from franklin_incidents
      where severity='NORMAL' and (
        status in ('OPEN','ACKNOWLEDGED') or (status='RESOLVED' and resolved_at>now()-($1::text||' hours')::interval)
      )
      order by last_seen desc limit $2
    `,[String(h),n])).rows;
    return {community:COMMUNITY,hours:h,count:rows.length,items:rows.map(row=>({incidentId:row.incident_id,fingerprint:row.fingerprint_sha256,code:row.safe_error_code,workflow:row.workflow,status:row.status,occurrences:Number(row.occurrence_count||0),firstSeen:row.first_seen,lastSeen:row.last_seen,context:redactContext(row.safe_context||{})}))};
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
    }catch(error){out.checks.push({name:'monitor_runtime',result:'FAIL',code:safeCode(error.code||error.constructor?.name)});}
    out.ok=out.database===true&&out.ledger===true;
    return out;
  }

  async function selfTest(){
    const sentinel='SHOULD_NOT_PERSIST_SECRET';
    const redacted=redactContext({path:'/synthetic',password:sentinel,token:sentinel,cardNumber:sentinel,action:'SELF_TEST'});
    if(JSON.stringify(redacted).includes(sentinel))throw new Error('INCIDENT_REDACTION_SELF_TEST_FAILED');
    if(severityFor({workflow:'ENTITLEMENT',code:'MEMBERSHIP_ENTITLEMENT_MISMATCH'})!=='CRITICAL')throw new Error('INCIDENT_SEVERITY_SELF_TEST_FAILED');
    const first=await persistRecord({category:'RUNTIME',workflow:'MONITOR_SELF_TEST',code:'SYNTHETIC_MONITOR_CHECK',source:'STARTUP_SELF_TEST',context:{path:'/synthetic',action:'SELF_TEST',password:sentinel}});
    const second=await persistRecord({category:'RUNTIME',workflow:'MONITOR_SELF_TEST',code:'SYNTHETIC_MONITOR_CHECK',source:'STARTUP_SELF_TEST',context:{path:'/synthetic',action:'SELF_TEST',token:sentinel}});
    if(first.incident_id!==second.incident_id||Number(second.occurrence_count)<=Number(first.occurrence_count))throw new Error('INCIDENT_DEDUP_SELF_TEST_FAILED');
    const row=(await query('select safe_context from franklin_incidents where incident_id=$1',[second.incident_id])).rows[0];
    if(!row||JSON.stringify(row.safe_context).includes(sentinel))throw new Error('INCIDENT_LEDGER_SECRET_SELF_TEST_FAILED');
    await setStatus(second.incident_id,'RESOLVED','Automated startup monitoring self-test passed.');
    const originA=await persistRecord({category:'PUBLIC_SITE',workflow:'PUBLIC_SITE',code:'ORIGIN_NOT_ALLOWED',source:'STARTUP_SELF_TEST',accountId:'synthetic-a',context:{path:'/api/telemetry/issue',method:'OPTIONS',httpStatus:403,originClass:'BLOCKED_PREFLIGHT'}});
    const originB=await persistRecord({category:'PUBLIC_SITE',workflow:'PUBLIC_SITE',code:'ORIGIN_NOT_ALLOWED',source:'STARTUP_SELF_TEST',accountId:'synthetic-b',context:{path:'/api/telemetry/issue',method:'OPTIONS',httpStatus:403,originClass:'BLOCKED_PREFLIGHT'}});
    if(originA.incident_id!==originB.incident_id)throw new Error('INCIDENT_PUBLIC_PREFLIGHT_GROUPING_SELF_TEST_FAILED');
    if(originB.severity!=='NORMAL')throw new Error('INCIDENT_PUBLIC_PREFLIGHT_SEVERITY_SELF_TEST_FAILED');
    await setStatus(originB.incident_id,'RESOLVED','Automated startup public-preflight grouping self-test passed.');
    return {ok:true,dedup:true,redaction:true,resolution:true,publicPreflightGrouping:true,externalDelivery:externalDeliveryStatus(),alertDeliveryConfigured:externalDeliveryConfigured(),pending:pending.length};
  }

  return Object.freeze({version:VERSION,record,flushPending,list,summary,digest,setStatus,scanDerivedIssues,deliverPendingAlerts,readinessSnapshot,selfTest,redactContext,severityFor,externalDeliveryConfigured,externalDeliveryStatus,pendingCount:()=>pending.length});
}
module.exports={VERSION,COMMUNITY,createIncidentMonitor,redactContext,severityFor,safeWorkflow,safeCode,fingerprintParts,normalizedCause,notificationDecision};
