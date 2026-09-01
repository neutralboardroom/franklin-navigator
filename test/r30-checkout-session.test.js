'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../server'),'utf8');const {plans}=require('../lib/catalog');
test('R30 uses exact three V5/V6 Stripe Price IDs',()=>{assert.equal(plans.length,3);assert.deepEqual(plans.map(p=>p.stripePriceId),['price_1UAfLPRxNra9nizolEiP5Z2z','price_1UAfLXRxNra9nizoW32RIfPG','price_1UAfLfRxNra9nizoqd84x8DR']);});
test('R30 checkout is server-created and idempotent',()=>{assert.match(source,/createStripeCheckoutSession/);assert.ok(source.includes('https://api.stripe.com/v1/checkout/sessions'));assert.match(source,/Idempotency-Key/);assert.match(source,/line_items\[0\]\[price\]/);assert.match(source,/client_reference_id/);assert.match(source,/STRIPE_SECRET_KEY/);});
test('commerce remains fail closed by default',()=>{assert.match(source,/COMMERCE_ENABLED \|\| 'false'/);assert.match(source,/if\(!COMMERCE_ENABLED\)throw publicError\('COMMERCE_DISABLED'/);});
test('legacy payment-link sync is retired from enrollment path',()=>{assert.match(source,/LEGACY_PAYMENT_LINK_SYNC_RETIRED/);assert.doesNotMatch(source,/select url from franklin_payment_links where lookup_key/);});
test('R30 checkout metadata preserves 36 month nonrenewing term',()=>{assert.match(source,/metadata\[term_months\]/);assert.match(source,/metadata\[auto_renew\]/);const charter=plans.find(p=>p.id==='charter');assert.equal(charter.termMonths,36);assert.equal(charter.autoRenew,false);});
