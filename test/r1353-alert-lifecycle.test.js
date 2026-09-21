'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {
  VERSION,severityFor,incidentDimensions,alertDecision,ALERT_COOLDOWN_MINUTES,ALERT_DIGEST_MINUTES
}=require('../lib/incident-monitor');

test('R1353 monitor version and policy are bounded',()=>{
  assert.equal(VERSION,'FRANKLIN_ISSUE_MONITOR_3');
  assert.ok(ALERT_COOLDOWN_MINUTES.CRITICAL>=1);
  assert.ok(ALERT_COOLDOWN_MINUTES.HIGH>=1);
  assert.ok(ALERT_COOLDOWN_MINUTES.NORMAL>=1);
  assert.ok(ALERT_DIGEST_MINUTES>=30);
});

test('blocked origin stays enforced but is reclassified as normal security evidence',()=>{
  assert.equal(severityFor({workflow:'PUBLIC_SITE',code:'ORIGIN_NOT_ALLOWED',httpStatus:403}),'NORMAL');
  const server=fs.readFileSync('server.js','utf8');
  assert.match(server,/ORIGIN_NOT_ALLOWED/);
  assert.match(server,/!ALLOWED_ORIGINS\.has\(origin\)/);
  assert.ok(!server.includes("Access-Control-Allow-Origin','*"));
});

test('fingerprint dimensions preserve route method cause component and release evidence',()=>{
  const d=incidentDimensions({
    environment:'PRODUCTION',release:'FR-NAV1.30.53-HF3.13.35',source:'SERVER_ROUTE',
    context:{path:'/api/profile-links?secret=no',method:'POST',reasonCode:'CROSS_ORIGIN_BLOCKED',component:'MEMBERSHIP_RUNTIME'}
  },'PUBLIC_SITE','ORIGIN_NOT_ALLOWED');
  assert.equal(d.environment,'PRODUCTION');
  assert.equal(d.affectedPath,'/api/profile-links');
  assert.equal(d.httpMethod,'POST');
  assert.equal(d.failureCause,'CROSS_ORIGIN_BLOCKED');
  assert.equal(d.component,'MEMBERSHIP_RUNTIME');
  assert.equal(d.releaseIdentity,'FR-NAV1.30.53-HF3.13.35');
});

test('notification lifecycle opens once, cools down, escalates and resolves once',()=>{
  const now=Date.now();
  assert.equal(alertDecision({status:'OPEN',severity:'HIGH',safe_error_code:'FETCH_FAILED',last_alert_at:null},now),'INITIAL');
  assert.equal(alertDecision({status:'OPEN',severity:'HIGH',safe_error_code:'FETCH_FAILED',last_alert_at:new Date(now-1000).toISOString(),last_alert_severity:'HIGH'},now),null);
  assert.equal(alertDecision({status:'OPEN',severity:'HIGH',safe_error_code:'FETCH_FAILED',last_alert_at:new Date(now-(ALERT_COOLDOWN_MINUTES.HIGH+1)*60000).toISOString(),last_alert_severity:'HIGH'},now),'UPDATE');
  assert.equal(alertDecision({status:'OPEN',severity:'CRITICAL',safe_error_code:'FETCH_FAILED',last_alert_at:new Date(now-1000).toISOString(),last_alert_severity:'HIGH'},now),'ESCALATION');
  assert.equal(alertDecision({status:'RESOLVED',severity:'HIGH',safe_error_code:'FETCH_FAILED',last_alert_at:new Date(now-1000).toISOString(),resolved_alert_at:null},now),'RESOLVED');
  assert.equal(alertDecision({status:'RESOLVED',severity:'HIGH',safe_error_code:'FETCH_FAILED',last_alert_at:new Date(now-1000).toISOString(),resolved_alert_at:new Date(now).toISOString()},now),null);
});

test('R1353 source preserves occurrence evidence, reopen and digest semantics',()=>{
  const source=fs.readFileSync('lib/incident-monitor.js','utf8');
  const schema=fs.readFileSync('schema/008_incident_lifecycle.sql','utf8');
  assert.match(source,/occurrence_count=franklin_incidents\.occurrence_count\+1/);
  assert.match(source,/franklin_incident_events/);
  assert.match(source,/reopened_at=case when franklin_incidents\.status='RESOLVED' then now\(\)/);
  assert.match(source,/resolved_alert_at/);
  assert.match(source,/deliverDigestIfDue/);
  assert.match(source,/ORIGIN_NOT_ALLOWED/);
  for(const col of ['affected_path','http_method','failure_cause','component','release_identity','last_alert_severity','resolved_alert_at','reopened_at','last_digest_at'])assert.ok(schema.includes(col),col);
});
