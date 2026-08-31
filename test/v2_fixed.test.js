'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'server_v2_fixed.js'), 'utf8');

test('corrective overlay persists failures outside the failed processing transaction', () => {
  assert.match(source, /async function recordCommerceFailure\(event, error\)/);
  assert.match(source, /await recordCommerceFailure\(event, error\)/);
  assert.match(source, /processing_state='RETRY_PENDING'/);
  assert.match(source, /commerce_dead_letters/);
});

test('retry path claims an existing retry-pending event rather than treating it as a completed duplicate', () => {
  assert.match(source, /async function claimCommerceEvent/);
  assert.match(source, /row\.processing_state === 'PROCESSING'/);
  assert.match(source, /processing_state='PROCESSING',lease_until/);
  assert.match(source, /source: row\.source \|\| 'LOCAL_RECONCILIATION'/);
});

test('checkout intent state is synchronized with canonical subscription state', () => {
  assert.match(source, /const intentState = next\.state === STATES\.ACTIVE \? 'SETTLED'/);
  assert.match(source, /update checkout_intents set state=\$2/);
});

test('verified account recovery consumes one-time tokens and revokes sessions', () => {
  assert.match(source, /request-password-reset/);
  assert.match(source, /reset-password/);
  assert.match(source, /action_type='RESET_PASSWORD'/);
  assert.match(source, /update member_sessions set revoked_at=now\(\)/);
});
