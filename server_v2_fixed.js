'use strict';

// This loader applies a deterministic corrective overlay to the reviewed v2 runtime before
// compiling it with the original repository filename. Keeping the source overlay explicit
// makes the correction independently testable without hiding the predecessor implementation.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const filename = path.join(__dirname, 'server_v2.js');
let source = fs.readFileSync(filename, 'utf8');

function replaceBetween(startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`runtime_overlay_marker_not_found:${startMarker}`);
  source = source.slice(0, start) + replacement + '\n\n' + source.slice(end);
}

replaceBetween(
  'async function processCommerceEvent(event, { source, signatureVerified, rawBody }) {',
  'async function retryEvents() {',
  `async function claimCommerceEvent(event, { source, signatureVerified, rawBody }) {
  const payloadSha = sha256(rawBody || JSON.stringify(event));
  return withTransaction(async (client) => {
    const inserted = await client.query(
      \`insert into commerce_event_ledger(event_id,source,event_type,livemode,event_created,payload_sha256,signature_verified,community,processing_state,payload,lease_until)
       values($1,$2,$3,$4,$5,$6,$7,$8,'PROCESSING',$9::jsonb,now()+interval '2 minutes')
       on conflict(event_id) do nothing returning event_id\`,
      [event.id, source, event.type, Boolean(event.livemode), Number(event.created || 0), payloadSha, signatureVerified, COMMUNITY, JSON.stringify(event)],
    );
    if (inserted.rowCount) return { claimed: true, duplicate: false, source };
    const existing = await client.query(
      \`select source,processing_state,lease_until from commerce_event_ledger where event_id=$1 for update\`,
      [event.id],
    );
    const row = existing.rows[0];
    if (!row) throw new Error('event_ledger_conflict_without_row');
    if (['PROCESSED','IGNORED_DUPLICATE','IGNORED_STALE','IGNORED_UNSUPPORTED','DEAD_LETTER'].includes(row.processing_state)) {
      return { claimed: false, duplicate: true, state: row.processing_state, source: row.source };
    }
    if (row.processing_state === 'PROCESSING' && row.lease_until && row.lease_until > new Date()) {
      return { claimed: false, duplicate: true, state: 'PROCESSING', source: row.source };
    }
    await client.query(
      \`update commerce_event_ledger set processing_state='PROCESSING',lease_until=now()+interval '2 minutes',updated_at=now() where event_id=$1\`,
      [event.id],
    );
    return { claimed: true, duplicate: false, retried: true, source: row.source };
  });
}

async function recordCommerceFailure(event, error) {
  return withTransaction(async (client) => {
    const prior = await client.query('select attempt_count from commerce_event_ledger where event_id=$1 for update', [event.id]);
    const attempts = Number(prior.rows[0]?.attempt_count || 0) + 1;
    const dead = attempts >= 5;
    const delaySeconds = Math.min(3600, 15 * (2 ** Math.min(attempts, 8)));
    await client.query(
      \`update commerce_event_ledger set processing_state=$2,attempt_count=$3,next_retry_at=$4,last_error_code=$5,lease_until=null,updated_at=now() where event_id=$1\`,
      [event.id, dead ? 'DEAD_LETTER' : 'RETRY_PENDING', attempts, dead ? null : new Date(Date.now() + delaySeconds * 1000), safeError(error)],
    );
    if (dead) {
      await client.query(
        \`insert into commerce_dead_letters(dead_letter_id,event_id,event_type,error_code,error_summary)
         values($1,$2,$3,$4,$5) on conflict(event_id) do update set last_failed_at=now(),error_code=excluded.error_code,error_summary=excluded.error_summary\`,
        [uuid(), event.id, event.type, safeError(error).slice(0, 100), safeError(error)],
      );
      await createException(client, {
        type: 'COMMERCE_EVENT_DEAD_LETTER', priority: 'CRITICAL', eventId: event.id,
        summary: 'Commerce event reached the retry limit', details: { eventType: event.type, attempts },
      });
    }
    return { attempts, dead, delaySeconds };
  });
}

async function processCommerceEvent(event, { source, signatureVerified, rawBody }) {
  if (!event?.id || !event?.type || !event?.data?.object) throw new HttpError(400, 'event_identity_or_object_missing');
  if (source === 'STRIPE' && event.livemode !== true) throw new HttpError(409, 'non_live_stripe_event_rejected');
  const claim = await claimCommerceEvent(event, { source, signatureVerified, rawBody });
  if (!claim.claimed) return { duplicate: true, processed: false, state: claim.state };
  try {
    return await withTransaction(async (client) => {
      const row = await locateSubscription(client, event);
      if (!row) {
        await createException(client, {
          type: 'UNMAPPED_COMMERCE_EVENT', priority: 'CRITICAL', eventId: event.id,
          summary: 'Commerce event could not be mapped to a Franklin checkout intent', details: { eventType: event.type },
        });
        throw new Error('subscription_mapping_not_found');
      }
      const current = subscriptionFromRow(row);
      const next = transition(current, {
        eventType: event.type, object: event.data.object,
        eventCreated: Number(event.created || 0), graceDays: GRACE_DAYS,
      });
      const result = await persistTransition(client, row, next, event);
      const intentState = next.state === STATES.ACTIVE ? 'SETTLED'
        : [STATES.SUSPENDED, STATES.REFUNDED, STATES.DISPUTED].includes(next.state) ? 'FAILED'
        : next.state === STATES.PENDING ? 'PENDING'
        : null;
      if (row.checkout_intent_id && intentState) {
        await client.query(
          \`update checkout_intents set state=$2,stripe_customer_id=coalesce($3,stripe_customer_id),stripe_subscription_id=coalesce($4,stripe_subscription_id),updated_at=now() where checkout_intent_id=$1\`,
          [row.checkout_intent_id, intentState, next.stripeCustomerId || row.stripe_customer_id, next.stripeSubscriptionId || row.stripe_subscription_id],
        );
      }
      await client.query(
        \`update commerce_event_ledger set account_id=$2,subscription_id=$3,stripe_customer_id=$4,stripe_subscription_id=$5,
          processing_state=$6,attempt_count=attempt_count+1,processed_at=now(),lease_until=null,updated_at=now(),metadata=$7::jsonb where event_id=$1\`,
        [event.id, row.account_id, row.subscription_id, next.stripeCustomerId || row.stripe_customer_id,
          next.stripeSubscriptionId || row.stripe_subscription_id, result.ignored ? 'IGNORED_STALE' : 'PROCESSED',
          JSON.stringify({ state: next.state, reason: next.stateReason, ignored: result.ignored })],
      );
      await audit(client, {
        actorType: claim.source || source, actorRef: event.id, action: 'PROCESS_COMMERCE_EVENT',
        objectType: 'SUBSCRIPTION', objectRef: row.subscription_id,
        outcome: result.ignored ? 'IGNORED' : 'PASS', details: { eventType: event.type, state: next.state },
      });
      return { duplicate: false, processed: !result.ignored, ...result };
    });
  } catch (error) {
    await recordCommerceFailure(event, error);
    throw error;
  }
}`,
);

replaceBetween(
  'async function retryEvents() {',
  'async function expireGrace() {',
  `async function retryEvents() {
  if (!pool) return;
  const rows = await withClient((client) => client.query(
    \`select event_id,payload,source from commerce_event_ledger
     where processing_state='RETRY_PENDING' and next_retry_at<=now()
     order by next_retry_at limit 20\`,
  ));
  for (const row of rows.rows) {
    await processCommerceEvent(row.payload, {
      source: row.source || 'LOCAL_RECONCILIATION', signatureVerified: true,
      rawBody: JSON.stringify(row.payload),
    }).catch((error) => log('error', 'commerce_event_retry_failed', {
      eventIdHash: sha256(row.event_id), error: safeError(error),
    }));
  }
}`,
);

const checkoutMarker = "route('POST', /^\\/api\\/checkout\\/session$/, async (req, res) => {";
const checkoutIndex = source.indexOf(checkoutMarker);
if (checkoutIndex < 0) throw new Error('runtime_overlay_checkout_marker_not_found');
const recoveryRoutes = `route('POST', /^\\/api\\/accounts\\/request-password-reset$/, async (req, res) => {
  rateLimit(req, 'password-reset-request', 8, 3600000);
  const body = await readJson(req);
  let email;
  try { email = normalizeEmail(body.email); } catch { email = null; }
  if (email) {
    const found = await withTransaction(async (client) => {
      const result = await client.query(
        \`select account_id,email_normalized from member_accounts where community=$1 and email_normalized=$2 and status='ACTIVE'\`,
        [COMMUNITY, email],
      );
      const account = result.rows[0];
      if (!account) return null;
      await client.query(
        \`update account_action_tokens set consumed_at=now() where account_id=$1 and action_type='RESET_PASSWORD' and consumed_at is null\`,
        [account.account_id],
      );
      const token = await createActionToken(client, account.account_id, 'RESET_PASSWORD', 1);
      await audit(client, {
        actorType: 'ACCOUNT', actorRef: account.account_id, action: 'REQUEST_PASSWORD_RESET',
        objectType: 'ACCOUNT', objectRef: account.account_id, outcome: 'PASS',
      });
      return { ...account, token };
    });
    if (found) {
      await deliverActionToken({
        accountId: found.account_id, email: found.email_normalized,
        actionType: 'RESET_PASSWORD', token: found.token,
      }).catch((error) => log('error', 'password_reset_delivery_failed', {
        accountIdHash: sha256(found.account_id), error: safeError(error),
      }));
    }
  }
  sendJson(res, 202, {
    ok: true,
    message: 'If the account exists, password-reset instructions will be sent.',
    messageEs: 'Si la cuenta existe, se enviarán instrucciones para restablecer la contraseña.',
  });
});

route('POST', /^\\/api\\/accounts\\/reset-password$/, async (req, res) => {
  rateLimit(req, 'password-reset-complete', 12, 3600000);
  const body = await readJson(req);
  const passwordHash = await hashPassword(body.newPassword);
  const tokenHash = sha256(String(body.token || ''));
  await withTransaction(async (client) => {
    const result = await client.query(
      \`select action_token_id,account_id from account_action_tokens
       where token_hash=$1 and action_type='RESET_PASSWORD' and consumed_at is null and expires_at>now() for update\`,
      [tokenHash],
    );
    const row = result.rows[0];
    if (!row) throw new HttpError(400, 'password_reset_token_invalid_or_expired');
    await client.query('update account_action_tokens set consumed_at=now() where action_token_id=$1', [row.action_token_id]);
    await client.query(
      \`update member_accounts set password_hash=$2,failed_login_count=0,locked_until=null,updated_at=now() where account_id=$1\`,
      [row.account_id, passwordHash],
    );
    await client.query('update member_sessions set revoked_at=now() where account_id=$1 and revoked_at is null', [row.account_id]);
    await audit(client, {
      actorType: 'ACCOUNT', actorRef: row.account_id, action: 'RESET_PASSWORD',
      objectType: 'ACCOUNT', objectRef: row.account_id, outcome: 'PASS',
    });
  });
  sendJson(res, 200, {
    ok: true,
    message: 'Password updated. Sign in again.',
    messageEs: 'Contraseña actualizada. Vuelva a iniciar sesión.',
  });
});

`;
source = source.slice(0, checkoutIndex) + recoveryRoutes + source.slice(checkoutIndex);

const moduleInstance = new Module(filename, module.parent);
moduleInstance.filename = filename;
moduleInstance.paths = Module._nodeModulePaths(__dirname);
moduleInstance._compile(source, filename);
