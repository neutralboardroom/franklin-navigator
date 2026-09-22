'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {VERSION,managerFields}=require('../lib/member-fulfillment');

test('R1359 verified-manager field contract is narrow and safe',()=>{
  assert.equal(VERSION,'FRANKLIN_MEMBER_FULFILLMENT_HF3_9');
  const out=managerFields({
    summary:'A Franklin business serving local residents.',
    publicPhone:'(615) 555-0123',
    website:'https://example.org/',
    contactUrl:'https://example.org/contact',
    bookingUrl:'',
    hours:'Mon–Fri 9–5',
    serviceArea:'Franklin, Tennessee',
    languages:'English, Spanish',
    accessibility:'Call ahead for accessibility details.'
  });
  assert.equal(out.website,'https://example.org/');
  assert.match(out.publicPhone,/615/);
  assert.equal(Object.keys(out).length,9);
});

test('R1359 verified-manager fields fail closed on unknown or unsafe values',()=>{
  assert.throws(()=>managerFields({summary:'ok',credentials:'invented'}),e=>e.code==='FIELD_NOT_EDITABLE');
  assert.throws(()=>managerFields({website:'http://example.org'}),e=>e.code==='PUBLIC_URL_INVALID');
  assert.throws(()=>managerFields({publicPhone:'not-a-phone'}),e=>e.code==='FIELD_INVALID');
});

test('R1359 migration preserves immutable manager history',()=>{
  const sql=fs.readFileSync(require('node:path').join(__dirname,'../schema/011_verified_manager_profile.sql'),'utf8');
  assert.match(sql,/franklin_manager_profile_history/);
  assert.match(sql,/unique\(account_id,profile_id,revision\)/i);
  assert.doesNotMatch(sql,/drop\s+table/i);
});

test('R1359 protected administrator reconciliation is distinct from self-review',()=>{
  const server=fs.readFileSync(require('node:path').join(__dirname,'../server.js'),'utf8');
  assert.match(server,/reconcileProtectedAdminAccess/);
  assert.match(server,/PROTECTED_ADMIN_BINDING/);
  const reviewer=fs.readFileSync(require('node:path').join(__dirname,'../lib/reviewer-console.js'),'utf8');
  assert.match(reviewer,/REVIEW_SELF_DECISION_FORBIDDEN/);
  assert.match(reviewer,/protectedAdminAccessForAccount/);
});

// R1359 qualification trigger preserves all inherited reviewer/claim suites.
