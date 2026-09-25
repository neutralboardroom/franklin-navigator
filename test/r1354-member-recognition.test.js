'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {
  VERSION,FULFILLMENT_STATES,currentRecognitionYear,activeAuthoritative,
  desiredFulfillmentStatus,normalizeMailingAddress,publicShape
}=require('../lib/member-recognition');

test('recognition runtime version and current year are deterministic',()=>{
  assert.equal(VERSION,'FRANKLIN_MEMBER_RECOGNITION_HF3_8');
  assert.equal(currentRecognitionYear(Date.parse('2026-09-21T00:00:00Z')),2026);
});

test('only authoritative active paid membership qualifies for current digital recognition',()=>{
  const good={account_state:'ACTIVE',authority_state:'VERIFIED',access_state:'ACTIVE',rich_profile:true,status:'ACTIVE',current_period_end:'2027-01-01T00:00:00Z',expires_at:'2027-01-01T00:00:00Z'};
  assert.equal(activeAuthoritative(good,Date.parse('2026-09-21T00:00:00Z')),true);
  assert.equal(activeAuthoritative({...good,authority_state:'PENDING'},Date.parse('2026-09-21T00:00:00Z')),false);
  assert.equal(activeAuthoritative({...good,access_state:'INACTIVE'},Date.parse('2026-09-21T00:00:00Z')),false);
  assert.equal(activeAuthoritative({...good,status:'TERMINATED'},Date.parse('2026-09-21T00:00:00Z')),false);
});

test('physical decal state never unlocks merely from free claim or inactive entitlement',()=>{
  assert.equal(desiredFulfillmentStatus({active:false,programActive:true,addressConfirmed:true,currentStatus:'ELIGIBLE_READY'}),'NOT_ELIGIBLE');
  assert.equal(desiredFulfillmentStatus({active:true,programActive:false,addressConfirmed:true,currentStatus:'NOT_OFFERED'}),'NOT_OFFERED');
  assert.equal(desiredFulfillmentStatus({active:true,programActive:true,addressConfirmed:false,currentStatus:'NOT_ELIGIBLE'}),'ELIGIBLE_ADDRESS_NEEDED');
  assert.equal(desiredFulfillmentStatus({active:true,programActive:true,addressConfirmed:true,currentStatus:'ELIGIBLE_ADDRESS_NEEDED'}),'ELIGIBLE_READY');
});

test('requested but unfulfilled decal becomes ineligible if paid entitlement lapses',()=>{
  assert.equal(desiredFulfillmentStatus({active:false,programActive:true,addressConfirmed:true,currentStatus:'FULFILLMENT_REQUESTED'}),'NOT_ELIGIBLE');
  assert.equal(desiredFulfillmentStatus({active:false,programActive:true,addressConfirmed:true,currentStatus:'FULFILLED'}),'FULFILLED');
});

test('mailing address must be explicitly complete and stays a separate private object',()=>{
  assert.throws(()=>normalizeMailingAddress({line1:'123 Main St'}),/MAILING_ADDRESS_REQUIRED/);
  const a=normalizeMailingAddress({recipient:'Franklin Shop',line1:'123 Main St',city:'Franklin',region:'tn',postalCode:'37064'});
  assert.deepEqual(a,{recipient:'Franklin Shop',line1:'123 Main St',line2:'',city:'Franklin',region:'TN',postalCode:'37064',country:'US'});
});

test('public verification shape contains stable Franklin URL, history and no private fulfillment data',()=>{
  const r=publicShape({profileId:'FR-ORG-test',profileName:'Test Shop',history:[2024,2026,2025,2026],currentActive:true,currentYear:2026,updatedAt:'2026-09-21T00:00:00Z',publicOrigin:'https://franklinnavigator.com'});
  assert.equal(r.verificationUrl,'https://franklinnavigator.com/membership-verification/?profile=FR-ORG-test');
  assert.deepEqual(r.participationYears,[2026,2025,2024]);
  assert.equal(r.currentYearRecognitionActive,true);
  assert.equal(Object.hasOwn(r,'mailingAddress'),false);
  assert.match(r.explanation,/not a government license/i);
  assert.match(r.explanation,/endorsement/i);
});

test('fulfillment state model is complete and limited to command-authorized states',()=>{
  assert.deepEqual([...FULFILLMENT_STATES].sort(),[
    'ELIGIBLE_ADDRESS_NEEDED','ELIGIBLE_READY','FULFILLED','FULFILLMENT_REQUESTED',
    'NOT_ELIGIBLE','NOT_OFFERED','OUT_OF_STOCK','REPLACEMENT_REVIEW'
  ].sort());
});

test('source contract preserves annual uniqueness, history, one-unit cap and digital/physical independence',()=>{
  const schema=fs.readFileSync('schema/008_member_recognition.sql','utf8');
  const src=fs.readFileSync('lib/member-recognition.js','utf8');
  assert.match(schema,/unique\(profile_id,recognition_year\)/);
  assert.match(schema,/quantity_fulfilled integer[^\n]*check\(quantity_fulfilled between 0 and 1\)/);
  assert.ok(src.includes("recognition_state='HISTORICAL'"));
  assert.ok(src.includes("FRANKLIN_DECAL_PROGRAM_ACTIVE"));
  assert.ok(src.includes("activePaidMember:Boolean(ensured?.active)"));
  assert.ok(src.includes("DECAL_PROGRAM_NOT_OFFERED"));
  assert.ok(src.includes("MAILING_ADDRESS_CONFIRMATION_REQUIRED"));
  assert.ok(src.includes("REPLACEMENT_REVIEW"));
});

test('runtime wiring advances release and exposes recognition without changing free claim rights',()=>{
  const server=fs.readFileSync('server.js','utf8');
  const member=fs.readFileSync('lib/member-fulfillment.js','utf8');
  assert.ok(server.includes("FR-NAV1.30.61-HF3.13.43"));
  assert.ok(server.includes('memberRecognitionVersion:MEMBER_RECOGNITION_VERSION'));
  assert.ok(server.includes('memberRecognition.syncMembership'));
  assert.ok(server.includes('memberRecognition.route'));
  assert.ok(member.includes('/api/member/representation/request'));
  assert.ok(member.includes('/api/member/representation/release'));
});
