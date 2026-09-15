'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {loadControlProfileRegistry,isControlProfile,isProductionProfile,productionProfileRows}=require('../lib/member-profile-policy');

test('control membership is never production member evidence even if a future scope file accidentally contains it',()=>{
  const registry=loadControlProfileRegistry();
  const profiles={
    'FR-TEST-SCC-OWNER-CONTROL':{name:'Synthetic control'},
    'FR-ORG-real123':{name:'Real public profile'}
  };
  assert.equal(isControlProfile('FR-TEST-SCC-OWNER-CONTROL',registry),true);
  assert.equal(isProductionProfile(profiles,'FR-TEST-SCC-OWNER-CONTROL',registry),false);
  assert.equal(isProductionProfile(profiles,'FR-ORG-real123',registry),true);
  assert.deepEqual(productionProfileRows([
    {profile_id:'FR-TEST-SCC-OWNER-CONTROL'},
    {profile_id:'FR-ORG-real123'}
  ],profiles,registry),[{profile_id:'FR-ORG-real123'}]);
});

test('out-of-scope profiles cannot become production proof',()=>{
  const registry=loadControlProfileRegistry();
  const profiles={'FR-ORG-real123':{name:'Real public profile'}};
  assert.equal(isProductionProfile(profiles,'FR-ORG-missing999',registry),false);
});
