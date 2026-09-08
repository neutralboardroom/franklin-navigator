'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {config,activeMembership,realBenefit}=require('../scripts/owner-first-value-reconcile.cjs');

test('reconciliation is disabled unless explicitly enabled',()=>{assert.equal(config({}),null);assert.equal(config({OWNER_FIRST_VALUE_RECONCILE:'false'}),null);});
test('enabled reconciliation requires exact account, database, live key and Franklin origin',()=>{
 assert.throws(()=>config({OWNER_FIRST_VALUE_RECONCILE:'true'}),/FIRST_VALUE_ACCOUNT_CONFIG_INVALID/);
 assert.throws(()=>config({OWNER_FIRST_VALUE_RECONCILE:'true',OWNER_REVIEW_PREFLIGHT_ACCOUNT:'acct_SYNTHETIC12345'}),/FIRST_VALUE_DATABASE_MISSING/);
 assert.throws(()=>config({OWNER_FIRST_VALUE_RECONCILE:'true',OWNER_REVIEW_PREFLIGHT_ACCOUNT:'acct_SYNTHETIC12345',DATABASE_URL:'postgres://x'}),/FIRST_VALUE_STRIPE_LIVE_KEY_REQUIRED/);
 assert.throws(()=>config({OWNER_FIRST_VALUE_RECONCILE:'true',OWNER_REVIEW_PREFLIGHT_ACCOUNT:'acct_SYNTHETIC12345',DATABASE_URL:'postgres://x',STRIPE_SECRET_KEY:'sk_live_'+'a'.repeat(32),PUBLIC_ORIGIN:'https://wrong.invalid'}),/FIRST_VALUE_PUBLIC_ORIGIN_INVALID/);
 const c=config({OWNER_FIRST_VALUE_RECONCILE:'true',OWNER_REVIEW_PREFLIGHT_ACCOUNT:'acct_SYNTHETIC12345',DATABASE_URL:'postgres://x',STRIPE_SECRET_KEY:'sk_live_'+'a'.repeat(32),PUBLIC_ORIGIN:'https://franklinnavigator.com'});assert.equal(c.accountId,'acct_SYNTHETIC12345');
});
test('active membership requires active account/email/profile/entitlement and unexpired access',()=>{
 const base={account_state:'ACTIVE',email_verified:true,authority_state:'VERIFIED',status:'ACTIVE',access_state:'ACTIVE',current_period_end:new Date(Date.now()+3600000).toISOString(),expires_at:null};
 assert.equal(activeMembership(base),true);
 for(const patch of [{account_state:'SUSPENDED'},{email_verified:false},{authority_state:'PENDING'},{status:'CANCELED'},{access_state:'INACTIVE'},{current_period_end:new Date(Date.now()-1000).toISOString()},{expires_at:new Date(Date.now()-1000).toISOString()}])assert.equal(activeMembership({...base,...patch}),false);
});
test('real benefit requires at least one genuine member entitlement',()=>{assert.equal(realBenefit({rich_profile:true,growth_desk:false,local_visibility_tools:false}),true);assert.equal(realBenefit({rich_profile:false,growth_desk:true,local_visibility_tools:false}),true);assert.equal(realBenefit({rich_profile:false,growth_desk:false,local_visibility_tools:true}),true);assert.equal(realBenefit({rich_profile:false,growth_desk:false,local_visibility_tools:false}),false);});
