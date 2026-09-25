'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const server=()=>fs.readFileSync('server.js','utf8');
const reviewer=()=>fs.readFileSync('lib/reviewer-console.js','utf8');

test('R1361 public account response does not expose reviewer or protected-admin eligibility flags',()=>{
  const src=server();
  const route=src.match(/if\(req\.method==='GET'&&url\.pathname==='\/api\/accounts\/me'\)\{[\s\S]{0,1800}?\},reqId\);\}/);
  assert.ok(route,'accounts/me route not found');
  assert.doesNotMatch(route[0],/reviewerAccessAvailable/);
  assert.doesNotMatch(route[0],/protectedAdminProfileIds/);
  assert.match(route[0],/profileLinks:links\.rows,membership/);
});

test('R1361 protected Franklin administrator reconciliation remains server-side',()=>{
  const src=server();
  assert.match(src,/reconcileProtectedAdminAccess\(session,reqId\)/);
  assert.match(src,/protectedAdminAccessForAccount/);
  assert.match(src,/PROTECTED_ADMIN_ACCESS_RECONCILED/);
});

test('R1361 reviewer authority remains isolated to private reviewer routes',()=>{
  const src=reviewer();
  assert.match(src,/\/review\//);
  assert.match(src,/\/api\/reviewer\//);
  assert.match(src,/checkOrigin\(req\)/);
  assert.match(src,/X-Robots-Tag','noindex, nofollow, noarchive'/);
  assert.match(src,/Cache-Control','no-store, private'/);
  assert.match(src,/SameSite=Strict/);
});

test('R1361 runtime release identity advances without changing commerce policy',()=>{
  const src=server();
  assert.match(src,/FR-NAV1\.30\.61-HF3\.13\.43/);
  assert.match(src,/const COMMERCE_ENABLED =/);
});
