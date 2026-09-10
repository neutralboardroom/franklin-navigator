'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const catalog=require('../lib/catalog');
const {startSafePurchase}=require('../lib/purchase-reservations');

const FINAL='franklin_community_member_annual_v6';
const RETIRED=[
  'franklin_community_member_monthly_v5',
  'franklin_community_member_annual_v5',
  'franklin_charter_member_36_month_v5',
  'franklin_charter_member_36_month_v6'
];

test('public catalog exposes exactly one $35 annual new-sale plan',()=>{
  const c=catalog.publicCatalog();
  assert.equal(c.publicChoiceCount,1);
  assert.equal(c.choices.length,1);
  assert.deepEqual(c.choices[0],{id:'ANNUAL',label:'Franklin Navigator Community Membership',priceUsd:35,autoRenew:true,termMonths:12,renewal:'ANNUAL_UNTIL_CANCELED'});
  assert.equal(c.retiredPlansSelectableForNewSale,false);
  assert.equal(c.freePresence.factualCorrectionsFree,true);
  assert.equal(c.freePresence.publicProfileRemovalFree,true);
  assert.equal(c.freePresence.membershipRequiredForProfileControl,false);
});

test('approved V6 annual mapping is the only plan eligible for a new sale',()=>{
  const p=catalog.getPlan(FINAL);
  assert.ok(p);
  assert.equal(p.newSaleEligible,true);
  assert.equal(p.regularUsd,35);
  assert.equal(p.stripePriceId,'price_1UE31nRxNra9nizoEPyavVQF');
  assert.equal(p.billingMode,'subscription');
  assert.equal(p.interval,'ANNUAL');
  assert.equal(p.autoRenew,true);
  assert.equal(catalog.newSalePlans.length,1);
  assert.equal(catalog.newSalePlans[0].lookupKey,FINAL);
});

test('retired plans remain recognizable for legitimate historical servicing but cannot start new checkout',async()=>{
  for(const key of RETIRED){
    const plan=catalog.getPlan(key);assert.ok(plan,`historical plan ${key} remains recognized`);assert.equal(plan.newSaleEligible,false);
    let touched=false;
    await assert.rejects(()=>startSafePurchase({
      tx:async()=>{touched=true;throw new Error('should not reach transaction')},
      newId:()=>{throw new Error('should not create ids')},
      createSession:async()=>{throw new Error('should not create Stripe session')},
      verifyAllowed:async()=>{throw new Error('should not verify')},
      publicError:(code,message,status)=>Object.assign(new Error(message),{code,status})
    },{community:'FRANKLIN_TN',accountId:'acct_test',profileId:'FR-ORG-test123',plan,email:'example@example.com',publicOrigin:'https://franklinnavigator.com'}),e=>e&&e.code==='PLAN_RETIRED'&&e.status===409);
    assert.equal(touched,false);
  }
});
