'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {
  VERSION,fingerprintParts,severityFor,notificationDecision,legacyNotificationFallback
}=require('../lib/incident-monitor');

const digest=parts=>crypto.createHash('sha256').update(parts.join('|')).digest('hex');
const publicBase={
  category:'PUBLIC_SITE',
  workflow:'PUBLIC_SITE',
  code:'ORIGIN_NOT_ALLOWED',
  context:{
    path:'/api/telemetry/issue',
    method:'OPTIONS',
    httpStatus:403,
    originClass:'BLOCKED_PREFLIGHT',
    environment:'PRODUCTION',
    release:'FR-NAV1.30.53-HF3.13.35',
    component:'PUBLIC_SITE'
  }
};

test('R1353 monitor version and public preflight fingerprint are stable across clients',()=>{
  assert.equal(VERSION,'FRANKLIN_ISSUE_MONITOR_3');
  const a=digest(fingerprintParts({...publicBase,accountHash:'client-a',membershipHash:'m-a',profileId:'FR-ORG-alpha'}));
  const b=digest(fingerprintParts({...publicBase,accountHash:'client-b',membershipHash:'m-b',profileId:'FR-ORG-beta'}));
  assert.equal(a,b);
});

test('R1353 fingerprint separates materially different route and cause',()=>{
  const base=digest(fingerprintParts(publicBase));
  const route=digest(fingerprintParts({...publicBase,context:{...publicBase.context,path:'/api/accounts/login'}}));
  const cause=digest(fingerprintParts({...publicBase,context:{...publicBase.context,originClass:'BLOCKED_MUTATION',method:'POST'}}));
  assert.notEqual(base,route);
  assert.notEqual(base,cause);
});

test('telemetry OPTIONS origin rejection remains recorded but does not become HIGH merely from repetition',()=>{
  assert.equal(severityFor({...publicBase,httpStatus:403,count:25}),'NORMAL');
  assert.equal(severityFor({workflow:'CHECKOUT',code:'PAYMENT_FAILED',count:1,context:{path:'/api/membership/start',method:'POST'}}),'HIGH');
});

test('first HIGH occurrence notifies immediately',()=>{
  const row={status:'OPEN',severity:'HIGH',occurrence_count:1,first_seen:'2026-09-21T00:00:00Z'};
  assert.equal(notificationDecision(row,null,{now:Date.parse('2026-09-21T00:01:00Z')}),'INITIAL');
});

test('identical HIGH repeat during cooldown does not notify again',()=>{
  const row={status:'OPEN',severity:'HIGH',occurrence_count:4,first_seen:'2026-09-21T00:00:00Z'};
  const last={kind:'INITIAL',severity:'HIGH',count:1,at:'2026-09-21T00:05:00Z'};
  assert.equal(notificationDecision(row,last,{now:Date.parse('2026-09-21T00:30:00Z'),highCooldownMinutes:60}),null);
});

test('material occurrence growth after cooldown creates useful update',()=>{
  const row={status:'OPEN',severity:'HIGH',occurrence_count:7,first_seen:'2026-09-21T00:00:00Z'};
  const last={kind:'INITIAL',severity:'HIGH',count:1,at:'2026-09-21T00:05:00Z'};
  assert.equal(notificationDecision(row,last,{now:Date.parse('2026-09-21T01:10:00Z'),highCooldownMinutes:60,updateMinOccurrences:5}),'UPDATE');
});

test('severity escalation bypasses ordinary cooldown',()=>{
  const row={status:'OPEN',severity:'CRITICAL',occurrence_count:2,first_seen:'2026-09-21T00:00:00Z'};
  const last={kind:'INITIAL',severity:'HIGH',count:1,at:'2026-09-21T00:10:00Z'};
  assert.equal(notificationDecision(row,last,{now:Date.parse('2026-09-21T00:11:00Z')}),'ESCALATION');
});

test('recovery emits one resolution notification and not duplicates',()=>{
  const row={status:'RESOLVED',severity:'HIGH',occurrence_count:9,first_seen:'2026-09-21T00:00:00Z'};
  const prior={kind:'UPDATE',severity:'HIGH',count:9,at:'2026-09-21T01:00:00Z'};
  assert.equal(notificationDecision(row,prior,{now:Date.parse('2026-09-21T01:05:00Z')}),'RESOLVED');
  assert.equal(notificationDecision(row,{...prior,kind:'RESOLVED'},{now:Date.parse('2026-09-21T01:06:00Z')}),null);
});

test('genuine recurrence after resolved notification emits reopened notification',()=>{
  const row={status:'OPEN',severity:'HIGH',occurrence_count:10,first_seen:'2026-09-21T00:00:00Z'};
  const last={kind:'RESOLVED',severity:'HIGH',count:9,at:'2026-09-21T01:05:00Z'};
  assert.equal(notificationDecision(row,last,{now:Date.parse('2026-09-21T01:06:00Z')}),'REOPENED');
});

test('new CRITICAL incident is never hidden by cooldown state from another incident',()=>{
  const row={status:'OPEN',severity:'CRITICAL',occurrence_count:1,first_seen:'2026-09-21T02:00:00Z'};
  assert.equal(notificationDecision(row,null,{now:Date.parse('2026-09-21T02:00:05Z')}),'INITIAL');
});

test('NORMAL noisy incidents are retained for digest instead of standalone lifecycle email',()=>{
  const row={status:'OPEN',severity:'NORMAL',occurrence_count:50,first_seen:'2026-09-21T00:00:00Z'};
  assert.equal(notificationDecision(row,null,{now:Date.parse('2026-09-21T03:00:00Z')}),null);
});

test('legacy alert state fallback remains in source so deployment does not re-email old incidents as new',()=>{
  const fs=require('node:fs');
  const src=fs.readFileSync('lib/incident-monitor.js','utf8');
  assert.ok(src.includes('fallbackRow?.last_alert_at'));
  assert.ok(src.includes("legacy:true"));
  assert.ok(src.includes("legacy_origin_preflight_storm_reconciliation"));
  assert.ok(src.includes("{notify:false}"));
});

test('already-resolved legacy incident with historical alert is not backfilled as a new recovery email',()=>{
  const legacy=legacyNotificationFallback({
    status:'RESOLVED',
    severity:'HIGH',
    occurrence_count:8,
    last_alert_at:'2026-09-20T12:00:00Z'
  });
  assert.equal(legacy.kind,'RESOLVED');
  const row={status:'RESOLVED',severity:'HIGH',occurrence_count:8,first_seen:'2026-09-20T11:00:00Z'};
  assert.equal(notificationDecision(row,legacy,{now:Date.parse('2026-09-21T06:00:00Z')}),null);
});

test('legacy open incident retains prior alert state instead of being announced as new',()=>{
  const legacy=legacyNotificationFallback({
    status:'OPEN',
    severity:'HIGH',
    occurrence_count:8,
    last_alert_at:'2026-09-21T05:50:00Z'
  });
  assert.equal(legacy.kind,'INITIAL');
  const row={status:'OPEN',severity:'HIGH',occurrence_count:8,first_seen:'2026-09-21T05:00:00Z'};
  assert.equal(notificationDecision(row,legacy,{now:Date.parse('2026-09-21T06:00:00Z'),highCooldownMinutes:60}),null);
});
