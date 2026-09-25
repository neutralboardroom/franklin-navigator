'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {loadProfileIdentitySafety,profileIdentityStatus}=require('../lib/profile-identity-safety');

test('R1360 identity registry has the qualified candidate counts',()=>{
  const s=loadProfileIdentitySafety();
  assert.equal(Object.keys(s.aliases).length,32);
  assert.equal(s.holds.size,80);
  assert.deepEqual(profileIdentityStatus('FR-ORG-adba2e46b06e6112'),{state:'ALIAS',canonicalProfileId:'FR-ORG-0086-the-factory-at-franklin'});
  assert.equal(profileIdentityStatus('FR-ORG-9179bb42735a-kelly-fisk-counseling').state,'HOLD_REVIEW');
  assert.equal(profileIdentityStatus('FR-ORG-0086-the-factory-at-franklin').state,'CLAIMABLE');
});

test('R1360 runtime mutation paths enforce profile identity safety',()=>{
  const server=fs.readFileSync(require('node:path').join(__dirname,'../server.js'),'utf8');
  const member=fs.readFileSync(require('node:path').join(__dirname,'../lib/member-fulfillment.js'),'utf8');
  assert.match(server,/assertClaimableProfile\(profileId/);
  assert.match(server,/\/api\/profile-links/);
  assert.match(server,/\/api\/membership\/start/);
  assert.match(member,/assertClaimableProfile\(p/);
});
