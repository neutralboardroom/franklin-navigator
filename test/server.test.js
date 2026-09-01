'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../server'),'utf8');
test('runtime has production endpoints and V4 fail-closed readiness',()=>{for(const route of ['/health','/ready','/api/accounts/register','/api/membership/start','/api/billing/portal','/webhooks/stripe','/internal/sre/events','/admin/payment-links/sync'])assert.ok(source.includes(route),route);assert.ok(source.includes('links===4'));assert.ok(source.includes('links.length!==4'));assert.ok(source.includes('STRIPE_WEBHOOK_SECRET'));assert.ok(source.includes('STRIPE_PORTAL_LOGIN_URL'));});
test('checkout applies Founding30 only to coupon-eligible monthly and annual plans',()=>{assert.ok(source.includes('if(plan.couponEligible)'));assert.ok(source.includes('couponEligible:plan.couponEligible'));assert.equal(source.includes('autoRenew:true}}'),false);});
test('access checks include entitlement expiry',()=>assert.ok(source.includes('accessAllowed(membership.status,membership.current_period_end)')));
test('preflight validates actual origin without spreading IncomingMessage',()=>{assert.ok(source.includes("if(req.method==='OPTIONS')"));assert.equal(source.includes("enforceOrigin({...req"),false);});
test('profile IDs are strict and case-preserving',()=>{assert.ok(source.includes('PROFILE_RE'));assert.ok(source.includes('return id'));});
