'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const src=()=>fs.readFileSync('server.js','utf8');
function section(text,start,end){
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`section not found: ${start}`);
  return text.slice(a,b);
}

test('R1362 public health and readiness responses expose only bounded service status',()=>{
  const text=src();
  const health=section(text,"url.pathname==='/health'","url.pathname==='/ready'");
  const ready=section(text,"url.pathname==='/ready'","url.pathname==='/api/catalog'");
  assert.match(health,/\{ok:healthy,release:RELEASE,community:COMMUNITY\}/);
  assert.match(ready,/\{ok:infrastructureReady,release:RELEASE,community:COMMUNITY\}/);
  for(const route of [health,ready]){
    assert.doesNotMatch(route,/reviewerConsoleConfigured:/);
    assert.doesNotMatch(route,/reviewCoverageConfigured:/);
    assert.doesNotMatch(route,/ownerAlertDelivery:/);
    assert.doesNotMatch(route,/ownerAlertDeliveryConfigured:/);
    assert.doesNotMatch(route,/stripeCheckoutSessionConfigured:/);
    assert.doesNotMatch(route,/stripeWebhookConfigured:/);
    assert.doesNotMatch(route,/portalSessionConfigured:/);
    assert.doesNotMatch(route,/missing:/);
    assert.doesNotMatch(route,/startupError:/);
    assert.doesNotMatch(route,/schemaDigest,/);
    assert.doesNotMatch(route,/migration,/);
  }
});

test('R1362 detailed operational readiness remains available only behind admin authorization',()=>{
  const text=src();
  const auth=text.indexOf("if(url.pathname.startsWith('/admin/'))");
  const readiness=text.indexOf("url.pathname==='/admin/readiness'");
  assert.ok(auth>=0&&readiness>auth,'admin readiness must remain behind admin authorization');
  const admin=section(text,"url.pathname==='/admin/readiness'","const incidentAction=");
  assert.match(admin,/serviceReady:infrastructureReady/);
  assert.match(admin,/reviewerConsoleConfigured:reviewerConsole\.configured/);
  assert.match(admin,/ownerAlertDeliveryConfigured:incidentMonitor\.externalDeliveryConfigured\(\)/);
  assert.match(admin,/schemaVersion:SCHEMA_VERSION,schemaDigest,migration,database/);
  assert.match(admin,/startupError:/);
});

test('R1362 advances the runtime release without changing commerce policy',()=>{
  const text=src();
  assert.match(text,/FR-NAV1\.30\.62-HF3\.13\.44/);
  assert.match(text,/const COMMERCE_ENABLED =/);
});


test('R1362 runtime fails closed if deployment release identity drifts from embedded source',()=>{
  const text=src();
  assert.match(text,/const EMBEDDED_RELEASE = 'FR-NAV1\.30\.62-HF3\.13\.44'/);
  assert.match(text,/CONFIGURED_RELEASE && CONFIGURED_RELEASE!==EMBEDDED_RELEASE/);
  assert.match(text,/LOCAL_RELEASE_MISMATCH/);
  assert.match(text,/const RELEASE = EMBEDDED_RELEASE/);
});
