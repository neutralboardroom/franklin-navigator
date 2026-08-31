'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const crypto = require('node:crypto');
const {
  VERTICALS,
  TIERS,
  INTERVALS,
  LOOKUP_KEYS,
  parseLookupKey,
  publicCatalog,
} = require('../lib/catalog_v2');
const {
  hashPassword,
  verifyPassword,
  verifyTimestampedSignature,
  verifyStripeSignature,
  signAssertion,
  verifyAssertion,
} = require('../lib/security_v2');
const { STATES, transition, entitlementFor } = require('../lib/lifecycle_v2');

const event = (eventType, object, eventCreated = 100) => ({ eventType, object, eventCreated, graceDays: 7 });

test('catalog exposes exactly 14 products and 84 authorized self-service prices', () => {
  assert.equal(VERTICALS.length, 14);
  assert.equal(TIERS.length, 3);
  assert.equal(INTERVALS.length, 2);
  assert.equal(LOOKUP_KEYS.length, 84);
  assert.equal(new Set(LOOKUP_KEYS).size, 84);
  assert.equal(publicCatalog().enterprise, 'quote_only');
  assert.equal(publicCatalog().foundingOffer.percentOff, 30);
  assert.equal(publicCatalog().foundingOffer.duration, 'FIRST_12_MONTHS');
});

test('lookup-key parser accepts all authorized keys and rejects enterprise or malformed keys', () => {
  for (const key of LOOKUP_KEYS) assert.ok(parseLookupKey(key), key);
  assert.equal(parseLookupKey('franklin_legal_enterprise_monthly_v2'), null);
  assert.equal(parseLookupKey('franklin_legal_individual_weekly_v2'), null);
  assert.equal(parseLookupKey('new_braunfels_legal_individual_monthly_v2'), null);
});

test('settled checkout alone activates the exact entitlement', () => {
  const next = transition({ tier: 'individual', vertical: 'legal', billingInterval: 'monthly' }, event('checkout.session.completed', {
    id: 'cs_live_1', customer: 'cus_1', subscription: 'sub_1', payment_status: 'paid',
  }));
  assert.equal(next.state, STATES.ACTIVE);
  assert.equal(next.accessActive, true);
  assert.equal(next.stripeSubscriptionId, 'sub_1');
  assert.equal(entitlementFor(next).active, true);
});

test('unsettled redirect remains pending and cannot grant access', () => {
  const next = transition({}, event('checkout.session.completed', { id: 'cs_live_1', payment_status: 'unpaid' }));
  assert.equal(next.state, STATES.PENDING);
  assert.equal(next.accessActive, false);
});

test('payment failure enters bounded grace then grace expiry suspends access', () => {
  const failed = transition({ state: STATES.ACTIVE, accessActive: true, lastEventCreated: 100 }, event('invoice.payment_failed', { id: 'in_1', subscription: 'sub_1' }, 101));
  assert.equal(failed.state, STATES.GRACE);
  assert.equal(failed.accessActive, true);
  const expired = transition({ ...failed, graceEndsAt: new Date(Date.now() - 1000).toISOString() }, event('local.grace_expired', { id: 'sub_1' }, 102));
  assert.equal(expired.state, STATES.SUSPENDED);
  assert.equal(expired.accessActive, false);
});

test('recovery, renewal, cancellation and termination synchronize correctly', () => {
  const recovered = transition({ state: STATES.GRACE, graceEndsAt: new Date(Date.now() + 1000).toISOString(), lastEventCreated: 100 }, event('invoice.paid', { id: 'in_2', subscription: 'sub_1', billing_reason: 'subscription_cycle' }, 101));
  assert.equal(recovered.state, STATES.ACTIVE);
  assert.ok(recovered.renewedAt);
  const canceling = transition(recovered, event('customer.subscription.updated', { id: 'sub_1', customer: 'cus_1', status: 'active', cancel_at_period_end: true, current_period_end: 2000000000 }, 102));
  assert.equal(canceling.state, STATES.CANCELING);
  assert.equal(canceling.accessActive, true);
  const terminated = transition(canceling, event('customer.subscription.deleted', { id: 'sub_1', customer: 'cus_1' }, 103));
  assert.equal(terminated.state, STATES.TERMINATED);
  assert.equal(terminated.accessActive, false);
});

test('full refund revokes access while partial refund requires review', () => {
  const full = transition({ state: STATES.ACTIVE, accessActive: true }, event('charge.refunded', { amount: 10000, amount_refunded: 10000 }));
  assert.equal(full.state, STATES.REFUNDED);
  assert.equal(full.accessActive, false);
  const partial = transition({ state: STATES.ACTIVE, accessActive: true }, event('charge.refunded', { amount: 10000, amount_refunded: 2000 }));
  assert.equal(partial.state, STATES.ACTIVE);
  assert.equal(partial.requiresReview, true);
});

test('out-of-order event is ignored without mutating controlling state', () => {
  const current = { state: STATES.ACTIVE, accessActive: true, lastEventCreated: 200 };
  const stale = transition(current, event('customer.subscription.deleted', { id: 'sub_1' }, 199));
  assert.equal(stale.ignored, true);
  assert.equal(stale.state, STATES.ACTIVE);
});

test('password hashing uses scrypt and verifies without storing clear text', async () => {
  const password = 'Franklin-Strong-2026';
  const encoded = await hashPassword(password);
  assert.match(encoded, /^scrypt\$/);
  assert.equal(encoded.includes(password), false);
  assert.equal(await verifyPassword(password, encoded), true);
  assert.equal(await verifyPassword('wrong-password-2026', encoded), false);
});

test('SRE-to-Local timestamped signatures reject tampering', () => {
  const secret = 'a'.repeat(40);
  const rawBody = Buffer.from('{"event":{"id":"evt_1"}}');
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex');
  assert.equal(verifyTimestampedSignature({ secret, rawBody, timestamp, signature }), true);
  assert.equal(verifyTimestampedSignature({ secret, rawBody: Buffer.from('tampered'), timestamp, signature }), false);
});

test('Stripe webhook signature verification accepts exact payload and rejects tampering', () => {
  const secret = 'whsec_' + 'b'.repeat(40);
  const raw = Buffer.from('{"id":"evt_1"}');
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.`).update(raw).digest('hex');
  assert.equal(verifyStripeSignature(raw, `t=${timestamp},v1=${signature}`, secret), timestamp);
  assert.throws(() => verifyStripeSignature(Buffer.from('bad'), `t=${timestamp},v1=${signature}`, secret));
});

test('entitlement assertions are short-lived and signed', () => {
  const secret = 'c'.repeat(40);
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: 'LOCAL_COMMUNITY_PLATFORM', community: 'FRANKLIN_TN', active_paid_member: true, exp: now + 600 };
  const token = signAssertion(payload, secret);
  assert.deepEqual(verifyAssertion(token, secret), payload);
  assert.throws(() => verifyAssertion(token + 'x', secret));
});

test('schema contains isolated persistence, event ledger, retry, dead-letter and first-value tables', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema', '002_live_membership.sql'), 'utf8') + fs.readFileSync(path.join(__dirname, '..', 'schema', '003_auth_retry.sql'), 'utf8');
  for (const table of ['member_accounts', 'member_sessions', 'member_organizations', 'profile_links', 'checkout_intents', 'member_subscriptions', 'member_entitlements', 'commerce_event_ledger', 'commerce_dead_letters', 'member_onboarding', 'admin_exceptions', 'audit_events', 'account_action_tokens', 'checkout_price_bindings', 'reconciliation_runs']) {
    assert.match(sql, new RegExp(`create table if not exists ${table}\\b`));
  }
  assert.match(sql, /check \(community = 'FRANKLIN_TN'\)/);
});

test('runtime defaults every sensitive production switch to false', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server_v2.js'), 'utf8');
  for (const name of ['LIVE_COMMERCE_ENABLED', 'CHECKOUT_GENERAL_AVAILABILITY', 'STRIPE_EVENT_PROCESSING_ENABLED', 'SRE_EVENT_PROCESSING_ENABLED']) {
    assert.match(source, new RegExp(`const ${name} = flag\\('${name}', false\\)`));
  }
  assert.doesNotMatch(source, /card_number|cvc|cvv/i);
});
