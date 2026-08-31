'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const {
  VERTICALS,
  TIERS,
  INTERVALS,
  PRICE_AUTHORITY,
  FOUNDING,
  LOOKUP_KEYS,
  parseLookupKey,
  publicCatalog,
} = require('./lib/catalog_v2');
const {
  sha256,
  randomToken,
  constantEqual,
  normalizeEmail,
  hashPassword,
  verifyPassword,
  parseCookies,
  cookie,
  verifyTimestampedSignature,
  verifyStripeSignature,
  signAssertion,
} = require('./lib/security_v2');
const { STATES, transition, entitlementFor } = require('./lib/lifecycle_v2');

const RELEASE = 'FRANKLIN-COMMERCE-2.0.0';
const COMMUNITY = 'FRANKLIN_TN';
const LOCAL_RELEASE = process.env.FRANKLIN_LOCAL_RELEASE || 'FR-NAV0.10.0-CANDIDATE-R25';
const PORT = Math.max(1, Number(process.env.PORT || 10000));
const PUBLIC_SITE_ORIGIN = String(process.env.PUBLIC_SITE_ORIGIN || 'https://franklinnavigator.com').replace(/\/$/, '');
const SERVICE_ORIGIN = String(process.env.SERVICE_ORIGIN || '').replace(/\/$/, '');
const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();
const COOKIE_DOMAIN = String(process.env.COOKIE_DOMAIN || '').trim() || undefined;
const SESSION_SECRET = String(process.env.SESSION_SECRET || '').trim();
const LOCAL_EVENT_SECRET = String(process.env.LOCAL_EVENT_SECRET || '').trim();
const ENTITLEMENT_ASSERTION_SECRET = String(process.env.ENTITLEMENT_ASSERTION_SECRET || '').trim();
const ADMIN_API_TOKEN = String(process.env.ADMIN_API_TOKEN || '').trim();
const STRIPE_SECRET_KEY = String(process.env.STRIPE_SECRET_KEY || '').trim();
const STRIPE_WEBHOOK_SECRET = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const STRIPE_ACCOUNT_ID = String(process.env.STRIPE_ACCOUNT_ID || 'acct_1TZU2TRxNra9nizo').trim();
const CONTROLLED_PURCHASE_TOKEN = String(process.env.CONTROLLED_PURCHASE_TOKEN || '').trim();
const VERIFICATION_DELIVERY_WEBHOOK_URL = String(process.env.VERIFICATION_DELIVERY_WEBHOOK_URL || '').trim();
const VERIFICATION_DELIVERY_SECRET = String(process.env.VERIFICATION_DELIVERY_SECRET || '').trim();
const LIVE_COMMERCE_ENABLED = flag('LIVE_COMMERCE_ENABLED', false);
const CHECKOUT_GENERAL_AVAILABILITY = flag('CHECKOUT_GENERAL_AVAILABILITY', false);
const STRIPE_EVENT_PROCESSING_ENABLED = flag('STRIPE_EVENT_PROCESSING_ENABLED', false);
const SRE_EVENT_PROCESSING_ENABLED = flag('SRE_EVENT_PROCESSING_ENABLED', false);
const ALLOW_DIRECT_STRIPE_WEBHOOK = flag('ALLOW_DIRECT_STRIPE_WEBHOOK', true);
const GRACE_DAYS = Math.min(30, Math.max(0, Number(process.env.PAYMENT_FAILURE_GRACE_DAYS || 7)));
const SESSION_HOURS = Math.min(24 * 30, Math.max(1, Number(process.env.SESSION_HOURS || 168)));
const BODY_LIMIT = 1024 * 1024;
const JSON_BODY_LIMIT = 128 * 1024;

function flag(name, fallback = false) {
  const value = process.env[name];
  return value === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}
function nowIso() { return new Date().toISOString(); }
function uuid() { return crypto.randomUUID(); }
function safeError(error) { return String(error?.message || error || 'unknown_error').replace(/[\r\n]/g, ' ').slice(0, 240); }
function log(level, event, details = {}) {
  const safe = JSON.parse(JSON.stringify(details, (key, value) => /secret|password|token|authorization|cookie|email/i.test(key) ? '[REDACTED]' : value));
  console.log(JSON.stringify({ at: nowIso(), level, event, release: RELEASE, community: COMMUNITY, ...safe }));
}

const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  max: Math.min(10, Math.max(2, Number(process.env.PG_POOL_MAX || 5))),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: flag('PG_SSL', true) ? { rejectUnauthorized: false } : false,
  application_name: 'franklin_navigator_commerce',
}) : null;

class HttpError extends Error {
  constructor(status, code, message = code, messageEs = null, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.messageEs = messageEs;
    this.details = details;
  }
}

async function withClient(fn) {
  if (!pool) throw new HttpError(503, 'database_not_configured', 'Membership service is not ready.', 'El servicio de membresía aún no está listo.');
  const client = await pool.connect();
  try { return await fn(client); } finally { client.release(); }
}
async function withTransaction(fn) {
  return withClient(async (client) => {
    await client.query('begin');
    try {
      const result = await fn(client);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback').catch(() => {});
      throw error;
    }
  });
}

async function migrate() {
  if (!pool) return { applied: [], configured: false };
  const schemaDir = path.join(__dirname, 'schema');
  const files = fs.readdirSync(schemaDir).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  const applied = [];
  for (const file of files) {
    const sql = fs.readFileSync(path.join(schemaDir, file), 'utf8');
    const digest = sha256(sql);
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query(
        `insert into schema_migrations(version,sha256) values($1,$2)
         on conflict(version) do update set sha256=excluded.sha256,applied_at=now()`,
        [file.replace(/\.sql$/, ''), digest],
      );
    });
    applied.push({ file, sha256: digest });
  }
  return { applied, configured: true };
}

const rates = new Map();
function rateLimit(req, bucket = 'default', maximum = 60, windowMs = 60000) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const key = `${bucket}:${sha256(ip).slice(0, 24)}`;
  const now = Date.now();
  const row = rates.get(key);
  if (!row || row.reset <= now) { rates.set(key, { count: 1, reset: now + windowMs }); return; }
  row.count += 1;
  if (row.count > maximum) throw new HttpError(429, 'rate_limited', 'Please wait and try again.', 'Espere un momento e inténtelo de nuevo.');
}
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rates) if (value.reset <= now) rates.delete(key);
}, 60000).unref();

function securityHeaders(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  res.setHeader('Cache-Control', 'no-store');
  const origin = String(req.headers.origin || '');
  if (origin === PUBLIC_SITE_ORIGIN || (SERVICE_ORIGIN && origin === SERVICE_ORIGIN)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'content-type,x-csrf-token,x-controlled-purchase-token,x-fn-timestamp,x-fn-signature,x-fn-event-id,authorization,stripe-signature,idempotency-key');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
}
function sendJson(res, status, value, extraHeaders = {}) {
  const body = Buffer.from(JSON.stringify(value));
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', body.length);
  for (const [key, value] of Object.entries(extraHeaders)) res.setHeader(key, value);
  res.end(body);
}
async function readBody(req, limit = BODY_LIMIT) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, 'request_too_large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function readJson(req) {
  const raw = await readBody(req, JSON_BODY_LIMIT);
  if (!raw.length) return {};
  try { return JSON.parse(raw.toString('utf8')); } catch { throw new HttpError(400, 'invalid_json'); }
}
function routePath(req) { return new URL(req.url, SERVICE_ORIGIN || 'http://localhost').pathname; }
function requestId(req) { return String(req.headers['x-request-id'] || '').slice(0, 100) || uuid(); }
function preferredLanguage(account, req) {
  if (account?.preferred_language === 'SPANISH') return 'SPANISH';
  return String(req.headers['accept-language'] || '').toLowerCase().startsWith('es') ? 'SPANISH' : 'ENGLISH';
}
function message(language, english, spanish) { return language === 'SPANISH' ? spanish : english; }

function secretReadiness() {
  return {
    sessionSecret: SESSION_SECRET.length >= 32,
    localEventSecret: LOCAL_EVENT_SECRET.length >= 32,
    entitlementAssertionSecret: ENTITLEMENT_ASSERTION_SECRET.length >= 32,
    adminApiToken: ADMIN_API_TOKEN.length >= 32,
    stripeSecretKey: STRIPE_SECRET_KEY.startsWith('sk_'),
    stripeWebhookSecret: STRIPE_WEBHOOK_SECRET.startsWith('whsec_'),
    controlledPurchaseToken: CONTROLLED_PURCHASE_TOKEN.length >= 24,
    verificationDelivery: Boolean(VERIFICATION_DELIVERY_WEBHOOK_URL && VERIFICATION_DELIVERY_SECRET.length >= 32),
  };
}
function assertSecret(value, code) { if (!value || value.length < 24) throw new HttpError(503, code); }
function admin(req) {
  assertSecret(ADMIN_API_TOKEN, 'admin_api_not_configured');
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!constantEqual(token, ADMIN_API_TOKEN)) throw new HttpError(401, 'admin_authentication_required');
}

async function audit(client, { actorType, actorRef, action, objectType, objectRef, outcome, details = {} }) {
  await client.query(
    `insert into audit_events(actor_type,actor_ref_hash,action,object_type,object_ref,outcome,details)
     values($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [actorType, actorRef ? sha256(actorRef) : null, action, objectType || null, objectRef || null, outcome, JSON.stringify(details)],
  );
}
async function createException(client, { type, priority = 'HIGH', accountId = null, subscriptionId = null, eventId = null, summary, details = {} }) {
  const exceptionId = uuid();
  await client.query(
    `insert into admin_exceptions(exception_id,exception_type,priority,account_id,subscription_id,event_id,summary,safe_details)
     values($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
    [exceptionId, type, priority, accountId, subscriptionId, eventId, summary, JSON.stringify(details)],
  );
  return exceptionId;
}

async function createActionToken(client, accountId, actionType, hours = 24) {
  const raw = randomToken(32);
  await client.query(
    `insert into account_action_tokens(action_token_id,account_id,action_type,token_hash,expires_at)
     values($1,$2,$3,$4,now()+($5||' hours')::interval)`,
    [uuid(), accountId, actionType, sha256(raw), String(hours)],
  );
  return raw;
}
async function deliverActionToken({ accountId, email, actionType, token }) {
  if (!VERIFICATION_DELIVERY_WEBHOOK_URL || VERIFICATION_DELIVERY_SECRET.length < 32) return { delivered: false, reason: 'DELIVERY_NOT_CONFIGURED' };
  const payload = JSON.stringify({ community: COMMUNITY, accountId, email, actionType, token, callbackOrigin: PUBLIC_SITE_ORIGIN, expiresInHours: actionType === 'VERIFY_EMAIL' ? 24 : 1 });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac('sha256', VERIFICATION_DELIVERY_SECRET).update(`${timestamp}.${payload}`).digest('hex');
  const response = await fetch(VERIFICATION_DELIVERY_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-fn-timestamp': String(timestamp), 'x-fn-signature': signature },
    body: payload,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`verification_delivery_${response.status}`);
  return { delivered: true };
}

async function createSession(client, req, res, accountId) {
  assertSecret(SESSION_SECRET, 'session_service_not_configured');
  const token = randomToken(32);
  const csrf = randomToken(24);
  const sessionId = uuid();
  const userAgent = String(req.headers['user-agent'] || '');
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  await client.query(
    `insert into member_sessions(session_id,account_id,token_hash,csrf_hash,user_agent_hash,ip_hash,expires_at)
     values($1,$2,$3,$4,$5,$6,now()+($7||' hours')::interval)`,
    [sessionId, accountId, sha256(token), sha256(csrf), sha256(userAgent), sha256(ip), String(SESSION_HOURS)],
  );
  const maxAge = SESSION_HOURS * 3600;
  res.setHeader('Set-Cookie', [
    cookie('fn_session', token, { maxAge, domain: COOKIE_DOMAIN, sameSite: 'Lax' }),
    cookie('fn_csrf', csrf, { maxAge, domain: COOKIE_DOMAIN, sameSite: 'Lax', httpOnly: false }),
  ]);
  return { sessionId, csrfToken: csrf };
}
async function authenticate(req) {
  assertSecret(SESSION_SECRET, 'session_service_not_configured');
  const token = parseCookies(req.headers.cookie).fn_session;
  if (!token) throw new HttpError(401, 'sign_in_required', 'Please sign in.', 'Inicie sesión.');
  const result = await withClient((client) => client.query(
    `select s.session_id,s.account_id,s.csrf_hash,s.expires_at,a.email_normalized,a.email_verified_at,a.preferred_language,a.status
     from member_sessions s join member_accounts a on a.account_id=s.account_id
     where s.token_hash=$1 and s.revoked_at is null and s.expires_at>now() and a.status='ACTIVE'`,
    [sha256(token)],
  ));
  const session = result.rows[0];
  if (!session) throw new HttpError(401, 'session_expired', 'Please sign in again.', 'Vuelva a iniciar sesión.');
  return session;
}
function requireCsrf(req, session) {
  const cookieValue = parseCookies(req.headers.cookie).fn_csrf;
  const headerValue = String(req.headers['x-csrf-token'] || '');
  if (!cookieValue || !headerValue || !constantEqual(cookieValue, headerValue) || !constantEqual(sha256(headerValue), session.csrf_hash)) {
    throw new HttpError(403, 'csrf_verification_failed');
  }
}

async function stripeRequest(method, endpoint, params = null, idempotencyKey = null) {
  if (!STRIPE_SECRET_KEY.startsWith('sk_')) throw new HttpError(503, 'stripe_not_configured');
  const headers = { Authorization: `Bearer ${STRIPE_SECRET_KEY}` };
  let body;
  if (params) {
    body = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) value.forEach((item) => body.append(key, String(item)));
      else body.append(key, String(value));
    }
    headers['content-type'] = 'application/x-www-form-urlencoded';
  }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method,
    headers,
    body: body?.toString(),
    signal: AbortSignal.timeout(20000),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = String(json?.error?.code || json?.error?.type || `stripe_${response.status}`);
    throw new HttpError(502, `stripe_${code}`, 'Payment service could not complete the request.', 'El servicio de pago no pudo completar la solicitud.');
  }
  return json;
}
async function stripePrice(lookupKey) {
  const result = await stripeRequest('GET', `/prices?active=true&limit=10&lookup_keys[]=${encodeURIComponent(lookupKey)}&expand[]=data.product`);
  const price = result.data?.find((row) => row.lookup_key === lookupKey && row.active && row.recurring);
  if (!price) throw new HttpError(409, 'authorized_price_not_found');
  return price;
}
async function foundingPromotionCode() {
  if (Date.now() > Date.parse(FOUNDING.enrollmentDeadlineLocal)) return null;
  const result = await stripeRequest('GET', `/promotion_codes?active=true&limit=10&code=${encodeURIComponent(FOUNDING.code)}`);
  return result.data?.find((row) => row.active)?.id || null;
}
function stripeMetadata(object) {
  const result = { ...(object?.metadata || {}) };
  const parent = object?.parent?.subscription_details?.metadata;
  if (parent && typeof parent === 'object') Object.assign(result, parent);
  for (const line of object?.lines?.data || []) if (line?.metadata) Object.assign(result, line.metadata);
  return result;
}

function subscriptionFromRow(row) {
  if (!row) return {};
  return {
    subscriptionId: row.subscription_id,
    accountId: row.account_id,
    organizationId: row.organization_id,
    profileLinkId: row.profile_link_id,
    lookupKey: row.lookup_key,
    vertical: row.vertical,
    tier: row.tier,
    billingInterval: row.billing_interval,
    promotionCode: row.promotion_code,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    checkoutSessionId: row.stripe_checkout_session_id,
    state: row.state,
    stateReason: row.state_reason,
    accessActive: row.access_active,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    currentPeriodEnd: row.current_period_end?.toISOString?.() || row.current_period_end,
    cancelEffectiveAt: row.cancel_effective_at?.toISOString?.() || row.cancel_effective_at,
    graceEndsAt: row.grace_ends_at?.toISOString?.() || row.grace_ends_at,
    activatedAt: row.activated_at?.toISOString?.() || row.activated_at,
    renewedAt: row.renewed_at?.toISOString?.() || row.renewed_at,
    paymentFailedAt: row.payment_failed_at?.toISOString?.() || row.payment_failed_at,
    suspendedAt: row.suspended_at?.toISOString?.() || row.suspended_at,
    terminatedAt: row.terminated_at?.toISOString?.() || row.terminated_at,
    refundedAt: row.refunded_at?.toISOString?.() || row.refunded_at,
    disputedAt: row.disputed_at?.toISOString?.() || row.disputed_at,
    lastEventCreated: Number(row.last_event_created || 0),
    lastEventType: row.last_event_type,
    requiresReview: row.requires_review,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
  };
}

async function locateSubscription(client, event) {
  const object = event.data?.object || {};
  const metadata = stripeMetadata(object);
  const checkoutIntentId = String(object.client_reference_id || metadata.franklin_checkout_intent_id || '').trim();
  if (checkoutIntentId) {
    const result = await client.query(
      `select ci.*,pl.profile_link_id from checkout_intents ci join profile_links pl on pl.profile_link_id=ci.profile_link_id where ci.checkout_intent_id=$1`,
      [checkoutIntentId],
    );
    const intent = result.rows[0];
    if (intent) {
      const existing = await client.query('select * from member_subscriptions where checkout_intent_id=$1 for update', [intent.checkout_intent_id]);
      if (existing.rows[0]) return existing.rows[0];
      const subscriptionId = uuid();
      await client.query(
        `insert into member_subscriptions(subscription_id,account_id,organization_id,profile_link_id,checkout_intent_id,lookup_key,vertical,tier,billing_interval,promotion_code,stripe_customer_id,stripe_subscription_id,stripe_checkout_session_id)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [subscriptionId, intent.account_id, intent.organization_id, intent.profile_link_id, intent.checkout_intent_id, intent.lookup_key, intent.vertical, intent.tier, intent.billing_interval, intent.promotion_code, object.customer || intent.stripe_customer_id, object.subscription || intent.stripe_subscription_id, object.id || intent.stripe_checkout_session_id],
      );
      return (await client.query('select * from member_subscriptions where subscription_id=$1 for update', [subscriptionId])).rows[0];
    }
  }
  const stripeSubscriptionId = typeof object.subscription === 'string' ? object.subscription : object.id?.startsWith?.('sub_') ? object.id : object.parent?.subscription_details?.subscription;
  const stripeCustomerId = typeof object.customer === 'string' ? object.customer : null;
  const checkoutSessionId = event.type.startsWith('checkout.session.') ? object.id : null;
  const result = await client.query(
    `select * from member_subscriptions
     where ($1::text is not null and stripe_subscription_id=$1)
        or ($2::text is not null and stripe_checkout_session_id=$2)
        or ($3::text is not null and stripe_customer_id=$3)
     order by updated_at desc limit 1 for update`,
    [stripeSubscriptionId || null, checkoutSessionId || null, stripeCustomerId || null],
  );
  return result.rows[0] || null;
}

async function persistTransition(client, row, next, event) {
  if (!row) throw new Error('subscription_mapping_not_found');
  if (next.ignored) return { ignored: true, reason: next.ignoreReason, subscriptionId: row.subscription_id };
  const value = (key, fallback = null) => next[key] === undefined ? fallback : next[key];
  await client.query(
    `update member_subscriptions set
       stripe_customer_id=coalesce($2,stripe_customer_id),stripe_subscription_id=coalesce($3,stripe_subscription_id),stripe_checkout_session_id=coalesce($4,stripe_checkout_session_id),
       state=$5,state_reason=$6,access_active=$7,cancel_at_period_end=$8,current_period_end=$9,cancel_effective_at=$10,grace_ends_at=$11,
       activated_at=$12,renewed_at=$13,payment_failed_at=$14,suspended_at=$15,terminated_at=$16,refunded_at=$17,disputed_at=$18,
       last_event_created=$19,last_event_type=$20,requires_review=$21,latest_invoice_id=coalesce($22,latest_invoice_id),updated_at=now()
     where subscription_id=$1`,
    [
      row.subscription_id, value('stripeCustomerId'), value('stripeSubscriptionId'), value('checkoutSessionId'), next.state, next.stateReason,
      Boolean(next.accessActive), Boolean(next.cancelAtPeriodEnd), value('currentPeriodEnd'), value('cancelEffectiveAt'), value('graceEndsAt'),
      value('activatedAt'), value('renewedAt'), value('paymentFailedAt'), value('suspendedAt'), value('terminatedAt'), value('refundedAt'), value('disputedAt'),
      Number(next.lastEventCreated || 0), next.lastEventType, Boolean(next.requiresReview), event.data?.object?.invoice || (event.type.startsWith('invoice.') ? event.data?.object?.id : null),
    ],
  );
  const entitlement = entitlementFor(next);
  await client.query(
    `insert into member_entitlements(entitlement_id,subscription_id,account_id,profile_link_id,state,active,tier,vertical,billing_interval,effective_at,expires_at,reason)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     on conflict(subscription_id) do update set state=excluded.state,active=excluded.active,tier=excluded.tier,vertical=excluded.vertical,
       billing_interval=excluded.billing_interval,effective_at=excluded.effective_at,expires_at=excluded.expires_at,reason=excluded.reason,
       version=member_entitlements.version+1,updated_at=now()`,
    [uuid(), row.subscription_id, row.account_id, row.profile_link_id, entitlement.state, entitlement.active, entitlement.tier, entitlement.vertical, entitlement.billingInterval, entitlement.effectiveAt, entitlement.expiresAt, entitlement.reason],
  );
  if (entitlement.active) {
    await client.query(
      `insert into member_onboarding(onboarding_id,subscription_id,account_confirmation_at,preferred_language)
       select $1,$2,now(),a.preferred_language from member_accounts a where a.account_id=$3
       on conflict(subscription_id) do nothing`,
      [uuid(), row.subscription_id, row.account_id],
    );
  }
  if (next.requiresReview || [STATES.DISPUTED, STATES.REFUNDED].includes(next.state)) {
    await createException(client, {
      type: next.state === STATES.DISPUTED ? 'PAYMENT_DISPUTE' : next.state === STATES.REFUNDED ? 'REFUND_REVIEW' : 'SUBSCRIPTION_REVIEW',
      priority: next.state === STATES.DISPUTED ? 'CRITICAL' : 'HIGH',
      accountId: row.account_id,
      subscriptionId: row.subscription_id,
      eventId: event.id,
      summary: `Review ${next.state.toLowerCase()} membership state`,
      details: { eventType: event.type, stateReason: next.stateReason },
    });
  }
  return { ignored: false, subscriptionId: row.subscription_id, entitlement };
}

async function processCommerceEvent(event, { source, signatureVerified, rawBody }) {
  if (!event?.id || !event?.type || !event?.data?.object) throw new HttpError(400, 'event_identity_or_object_missing');
  if (source === 'STRIPE' && event.livemode !== true) throw new HttpError(409, 'non_live_stripe_event_rejected');
  const payloadSha = sha256(rawBody || JSON.stringify(event));
  return withTransaction(async (client) => {
    const inserted = await client.query(
      `insert into commerce_event_ledger(event_id,source,event_type,livemode,event_created,payload_sha256,signature_verified,community,processing_state,payload)
       values($1,$2,$3,$4,$5,$6,$7,$8,'PROCESSING',$9::jsonb)
       on conflict(event_id) do nothing returning event_id`,
      [event.id, source, event.type, Boolean(event.livemode), Number(event.created || 0), payloadSha, signatureVerified, COMMUNITY, JSON.stringify(event)],
    );
    if (!inserted.rowCount) return { duplicate: true, processed: false };
    try {
      const row = await locateSubscription(client, event);
      if (!row) {
        await createException(client, { type: 'UNMAPPED_COMMERCE_EVENT', priority: 'CRITICAL', eventId: event.id, summary: 'Commerce event could not be mapped to a Franklin checkout intent', details: { eventType: event.type } });
        throw new Error('subscription_mapping_not_found');
      }
      const current = subscriptionFromRow(row);
      const next = transition(current, { eventType: event.type, object: event.data.object, eventCreated: Number(event.created || 0), graceDays: GRACE_DAYS });
      const result = await persistTransition(client, row, next, event);
      await client.query(
        `update commerce_event_ledger set account_id=$2,subscription_id=$3,stripe_customer_id=$4,stripe_subscription_id=$5,
          processing_state=$6,attempt_count=attempt_count+1,processed_at=now(),updated_at=now(),metadata=$7::jsonb where event_id=$1`,
        [event.id, row.account_id, row.subscription_id, next.stripeCustomerId || row.stripe_customer_id, next.stripeSubscriptionId || row.stripe_subscription_id, result.ignored ? 'IGNORED_STALE' : 'PROCESSED', JSON.stringify({ state: next.state, reason: next.stateReason, ignored: result.ignored })],
      );
      await audit(client, { actorType: source, actorRef: event.id, action: 'PROCESS_COMMERCE_EVENT', objectType: 'SUBSCRIPTION', objectRef: row.subscription_id, outcome: result.ignored ? 'IGNORED' : 'PASS', details: { eventType: event.type, state: next.state } });
      return { duplicate: false, processed: !result.ignored, ...result };
    } catch (error) {
      const prior = await client.query('select attempt_count from commerce_event_ledger where event_id=$1', [event.id]);
      const attempts = Number(prior.rows[0]?.attempt_count || 0) + 1;
      const dead = attempts >= 5;
      const delaySeconds = Math.min(3600, 15 * (2 ** Math.min(attempts, 8)));
      await client.query(
        `update commerce_event_ledger set processing_state=$2,attempt_count=$3,next_retry_at=$4,last_error_code=$5,updated_at=now() where event_id=$1`,
        [event.id, dead ? 'DEAD_LETTER' : 'RETRY_PENDING', attempts, dead ? null : new Date(Date.now() + delaySeconds * 1000), safeError(error)],
      );
      if (dead) {
        await client.query(
          `insert into commerce_dead_letters(dead_letter_id,event_id,event_type,error_code,error_summary)
           values($1,$2,$3,$4,$5) on conflict(event_id) do update set last_failed_at=now(),error_code=excluded.error_code,error_summary=excluded.error_summary`,
          [uuid(), event.id, event.type, safeError(error).slice(0, 100), safeError(error)],
        );
      }
      throw error;
    }
  });
}

async function retryEvents() {
  if (!pool) return;
  const rows = await withTransaction(async (client) => {
    const result = await client.query(
      `select event_id,payload from commerce_event_ledger where processing_state='RETRY_PENDING' and next_retry_at<=now()
       order by next_retry_at limit 20 for update skip locked`,
    );
    for (const row of result.rows) await client.query(`update commerce_event_ledger set processing_state='PROCESSING',lease_until=now()+interval '2 minutes',updated_at=now() where event_id=$1`, [row.event_id]);
    return result.rows;
  });
  for (const row of rows) {
    await withClient((client) => client.query(`update commerce_event_ledger set processing_state='RETRY_PENDING' where event_id=$1`, [row.event_id]));
    await processCommerceEvent(row.payload, { source: 'LOCAL_RECONCILIATION', signatureVerified: true, rawBody: JSON.stringify(row.payload) }).catch((error) => log('error', 'commerce_event_retry_failed', { eventIdHash: sha256(row.event_id), error: safeError(error) }));
  }
}
async function expireGrace() {
  if (!pool) return;
  const rows = await withClient((client) => client.query(`select * from member_subscriptions where state='GRACE' and grace_ends_at<=now() limit 100`));
  for (const row of rows.rows) {
    const event = { id: `local_grace_${row.subscription_id}_${Date.parse(row.grace_ends_at)}`, type: 'local.grace_expired', created: Math.floor(Date.now() / 1000), livemode: true, data: { object: { id: row.stripe_subscription_id, customer: row.stripe_customer_id } } };
    await processCommerceEvent(event, { source: 'LOCAL_RECONCILIATION', signatureVerified: true, rawBody: JSON.stringify(event) }).catch((error) => log('error', 'grace_expiration_failed', { subscriptionId: row.subscription_id, error: safeError(error) }));
  }
}

const routes = [];
function route(method, pattern, handler) { routes.push({ method, pattern, handler }); }
function matchRoute(method, pathname) {
  for (const row of routes) {
    if (row.method !== method) continue;
    const match = pathname.match(row.pattern);
    if (match) return { handler: row.handler, params: match.groups || {}, match };
  }
  return null;
}

route('GET', /^\/health$/, async (_req, res) => {
  let database = false;
  let schemaVersion = null;
  try {
    const result = await withClient((client) => client.query(`select version from schema_migrations order by applied_at desc,version desc limit 1`));
    database = true; schemaVersion = result.rows[0]?.version || null;
  } catch {}
  sendJson(res, database ? 200 : 503, { ok: database, service: 'franklin-navigator-commerce', release: RELEASE, community: COMMUNITY, database, schemaVersion, paidCommerceEnabled: LIVE_COMMERCE_ENABLED, generalCheckoutAvailable: CHECKOUT_GENERAL_AVAILABILITY });
});
route('GET', /^\/ready$/, async (_req, res) => {
  let database = false;
  let priceBindings = 0;
  try {
    const result = await withClient((client) => client.query(`select count(*)::int n from checkout_price_bindings where active=true`));
    database = true; priceBindings = Number(result.rows[0]?.n || 0);
  } catch {}
  const secrets = secretReadiness();
  const requirements = {
    database,
    accountSecurity: secrets.sessionSecret && secrets.adminApiToken,
    eventSecurity: secrets.localEventSecret && secrets.entitlementAssertionSecret,
    stripe: secrets.stripeSecretKey && secrets.stripeWebhookSecret,
    controlledPurchase: secrets.controlledPurchaseToken,
    verifiedContactDelivery: secrets.verificationDelivery,
    priceBindings: priceBindings === 84,
    liveCommerceFlag: LIVE_COMMERCE_ENABLED,
    stripeProcessingFlag: STRIPE_EVENT_PROCESSING_ENABLED || SRE_EVENT_PROCESSING_ENABLED,
  };
  const readyForControlledTransaction = Object.entries(requirements).filter(([key]) => key !== 'verifiedContactDelivery').every(([, value]) => value === true);
  const readyForGeneralAvailability = readyForControlledTransaction && requirements.verifiedContactDelivery && CHECKOUT_GENERAL_AVAILABILITY;
  sendJson(res, readyForControlledTransaction ? 200 : 503, { ok: readyForControlledTransaction, release: RELEASE, localRelease: LOCAL_RELEASE, requirements, priceBindings, readyForControlledTransaction, readyForGeneralAvailability });
});
route('GET', /^\/api\/catalog$/, async (_req, res) => sendJson(res, 200, publicCatalog()));
route('GET', /^\/api\/commerce\/readiness$/, async (_req, res) => {
  let database = false;
  let activeBindings = 0;
  try { const result = await withClient((client) => client.query(`select count(*)::int n from checkout_price_bindings where active=true`)); database = true; activeBindings = Number(result.rows[0]?.n || 0); } catch {}
  sendJson(res, 200, { release: RELEASE, localRelease: LOCAL_RELEASE, database, catalogExpected: 84, activeBindings, paidCommerceEnabled: LIVE_COMMERCE_ENABLED, generalCheckoutAvailable: CHECKOUT_GENERAL_AVAILABILITY, stripeEventProcessing: STRIPE_EVENT_PROCESSING_ENABLED, sreEventProcessing: SRE_EVENT_PROCESSING_ENABLED, noPaymentTakenByReadinessCheck: true });
});

route('POST', /^\/api\/accounts\/register$/, async (req, res) => {
  rateLimit(req, 'register', 8, 3600000);
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const passwordHash = await hashPassword(body.password);
  const organizationName = String(body.organizationName || '').trim().slice(0, 200);
  const profileId = String(body.profileId || '').trim().slice(0, 160);
  const locationId = String(body.locationId || profileId || '').trim().slice(0, 160);
  const language = String(body.preferredLanguage || 'ENGLISH').toUpperCase() === 'SPANISH' ? 'SPANISH' : 'ENGLISH';
  if (organizationName.length < 2 || !/^[A-Za-z0-9._:-]{2,160}$/.test(profileId) || !/^[A-Za-z0-9._:-]{2,160}$/.test(locationId)) throw new HttpError(400, 'organization_profile_and_location_required');
  const result = await withTransaction(async (client) => {
    const accountId = uuid(); const organizationId = uuid(); const profileLinkId = uuid();
    try {
      await client.query(`insert into member_accounts(account_id,email_normalized,password_hash,preferred_language) values($1,$2,$3,$4)`, [accountId, email, passwordHash, language]);
    } catch (error) {
      if (error.code === '23505') throw new HttpError(409, 'account_already_exists');
      throw error;
    }
    await client.query(`insert into member_organizations(organization_id,legal_or_display_name) values($1,$2)`, [organizationId, organizationName]);
    await client.query(`insert into organization_members(organization_id,account_id,role) values($1,$2,'OWNER')`, [organizationId, accountId]);
    await client.query(`insert into profile_links(profile_link_id,organization_id,franklin_profile_id,subscribed_location_id) values($1,$2,$3,$4)`, [profileLinkId, organizationId, profileId, locationId]);
    const verifyToken = await createActionToken(client, accountId, 'VERIFY_EMAIL', 24);
    await audit(client, { actorType: 'ACCOUNT', actorRef: accountId, action: 'REGISTER', objectType: 'ACCOUNT', objectRef: accountId, outcome: 'PASS' });
    const session = await createSession(client, req, res, accountId);
    return { accountId, organizationId, profileLinkId, verifyToken, session };
  });
  const delivery = await deliverActionToken({ accountId: result.accountId, email, actionType: 'VERIFY_EMAIL', token: result.verifyToken }).catch((error) => ({ delivered: false, reason: safeError(error) }));
  sendJson(res, 201, { ok: true, accountId: result.accountId, organizationId: result.organizationId, profileLinkId: result.profileLinkId, csrfToken: result.session.csrfToken, emailVerificationRequired: true, verificationDelivery: delivery.delivered ? 'SENT' : 'SUPPORT_REQUIRED', supportEmail: 'community@franklinnavigator.com' });
});

route('POST', /^\/api\/accounts\/verify-email$/, async (req, res) => {
  rateLimit(req, 'verify', 20, 3600000);
  const body = await readJson(req);
  const tokenHash = sha256(String(body.token || ''));
  const changed = await withTransaction(async (client) => {
    const result = await client.query(
      `select action_token_id,account_id from account_action_tokens where token_hash=$1 and action_type='VERIFY_EMAIL' and consumed_at is null and expires_at>now() for update`,
      [tokenHash],
    );
    const row = result.rows[0];
    if (!row) throw new HttpError(400, 'verification_token_invalid_or_expired');
    await client.query(`update account_action_tokens set consumed_at=now() where action_token_id=$1`, [row.action_token_id]);
    await client.query(`update member_accounts set email_verified_at=coalesce(email_verified_at,now()),updated_at=now() where account_id=$1`, [row.account_id]);
    await audit(client, { actorType: 'ACCOUNT', actorRef: row.account_id, action: 'VERIFY_EMAIL', objectType: 'ACCOUNT', objectRef: row.account_id, outcome: 'PASS' });
    return true;
  });
  sendJson(res, 200, { ok: changed, message: 'Email verified.', messageEs: 'Correo electrónico verificado.' });
});

route('POST', /^\/api\/accounts\/login$/, async (req, res) => {
  rateLimit(req, 'login', 15, 900000);
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const result = await withTransaction(async (client) => {
    const found = await client.query(`select * from member_accounts where community=$1 and email_normalized=$2 for update`, [COMMUNITY, email]);
    const account = found.rows[0];
    const valid = account && account.status === 'ACTIVE' && (!account.locked_until || account.locked_until <= new Date()) && await verifyPassword(body.password, account.password_hash);
    if (!valid) {
      if (account) await client.query(`update member_accounts set failed_login_count=failed_login_count+1,locked_until=case when failed_login_count+1>=8 then now()+interval '30 minutes' else locked_until end,updated_at=now() where account_id=$1`, [account.account_id]);
      throw new HttpError(401, 'invalid_credentials');
    }
    await client.query(`update member_accounts set failed_login_count=0,locked_until=null,updated_at=now() where account_id=$1`, [account.account_id]);
    const session = await createSession(client, req, res, account.account_id);
    await audit(client, { actorType: 'ACCOUNT', actorRef: account.account_id, action: 'LOGIN', objectType: 'ACCOUNT', objectRef: account.account_id, outcome: 'PASS' });
    return { account, session };
  });
  sendJson(res, 200, { ok: true, csrfToken: result.session.csrfToken, account: { accountId: result.account.account_id, emailVerified: Boolean(result.account.email_verified_at), preferredLanguage: result.account.preferred_language } });
});

route('POST', /^\/api\/accounts\/logout$/, async (req, res) => {
  const session = await authenticate(req); requireCsrf(req, session);
  await withClient((client) => client.query(`update member_sessions set revoked_at=now() where session_id=$1`, [session.session_id]));
  res.setHeader('Set-Cookie', [cookie('fn_session', '', { maxAge: 0, domain: COOKIE_DOMAIN }), cookie('fn_csrf', '', { maxAge: 0, domain: COOKIE_DOMAIN, httpOnly: false })]);
  sendJson(res, 200, { ok: true });
});

route('GET', /^\/api\/me$/, async (req, res) => {
  const session = await authenticate(req);
  const result = await withClient((client) => client.query(
    `select o.organization_id,o.legal_or_display_name,pl.profile_link_id,pl.franklin_profile_id,pl.subscribed_location_id,pl.claim_state
     from organization_members om join member_organizations o using(organization_id) join profile_links pl using(organization_id)
     where om.account_id=$1 order by o.created_at`,
    [session.account_id],
  ));
  sendJson(res, 200, { accountId: session.account_id, email: session.email_normalized, emailVerified: Boolean(session.email_verified_at), preferredLanguage: session.preferred_language, organizations: result.rows });
});

route('POST', /^\/api\/checkout\/session$/, async (req, res) => {
  rateLimit(req, 'checkout', 12, 3600000);
  const session = await authenticate(req); requireCsrf(req, session);
  if (!session.email_verified_at) throw new HttpError(403, 'verified_email_required', 'Verify your business email before payment.', 'Verifique su correo comercial antes del pago.');
  if (!LIVE_COMMERCE_ENABLED) throw new HttpError(503, 'paid_checkout_not_yet_active');
  if (!CHECKOUT_GENERAL_AVAILABILITY) {
    assertSecret(CONTROLLED_PURCHASE_TOKEN, 'controlled_purchase_not_configured');
    if (!constantEqual(String(req.headers['x-controlled-purchase-token'] || ''), CONTROLLED_PURCHASE_TOKEN)) throw new HttpError(403, 'controlled_purchase_authorization_required');
  }
  const body = await readJson(req);
  const parsed = parseLookupKey(body.lookupKey);
  if (!parsed) throw new HttpError(400, 'authorized_self_service_lookup_key_required');
  const profileLinkId = String(body.profileLinkId || '');
  const idempotencyKey = String(req.headers['idempotency-key'] || body.idempotencyKey || '').trim();
  if (!/^[A-Za-z0-9._:-]{16,160}$/.test(idempotencyKey)) throw new HttpError(400, 'idempotency_key_required');
  const ownership = await withClient((client) => client.query(
    `select pl.*,o.organization_id from profile_links pl join organization_members om on om.organization_id=pl.organization_id join member_organizations o on o.organization_id=pl.organization_id
     where pl.profile_link_id=$1 and om.account_id=$2 and pl.community=$3`,
    [profileLinkId, session.account_id, COMMUNITY],
  ));
  const profile = ownership.rows[0];
  if (!profile) throw new HttpError(404, 'profile_link_not_found');
  const existing = await withClient((client) => client.query(`select stripe_checkout_session_id,state from checkout_intents where idempotency_key=$1`, [idempotencyKey]));
  if (existing.rows[0]?.stripe_checkout_session_id) {
    const stripeSession = await stripeRequest('GET', `/checkout/sessions/${encodeURIComponent(existing.rows[0].stripe_checkout_session_id)}`);
    return sendJson(res, 200, { checkoutIntentState: existing.rows[0].state, checkoutUrl: stripeSession.url, reused: true });
  }
  const price = await stripePrice(parsed.lookupKey);
  const recurringInterval = price.recurring?.interval === 'year' ? 'annual' : price.recurring?.interval === 'month' ? 'monthly' : null;
  if (recurringInterval !== parsed.interval) throw new HttpError(409, 'stripe_price_interval_mismatch');
  const checkoutIntentId = uuid();
  const promotionCodeId = await foundingPromotionCode();
  await withClient((client) => client.query(
    `insert into checkout_intents(checkout_intent_id,account_id,organization_id,profile_link_id,lookup_key,vertical,tier,billing_interval,promotion_code,idempotency_key,expires_at)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now()+interval '30 minutes')`,
    [checkoutIntentId, session.account_id, profile.organization_id, profile.profile_link_id, parsed.lookupKey, parsed.vertical, parsed.tier, parsed.interval, promotionCodeId ? FOUNDING.code : null, idempotencyKey],
  ));
  const metadata = {
    community: COMMUNITY,
    price_authority: PRICE_AUTHORITY,
    franklin_checkout_intent_id: checkoutIntentId,
    franklin_account_id: session.account_id,
    franklin_organization_id: profile.organization_id,
    franklin_profile_id: profile.franklin_profile_id,
    franklin_location_id: profile.subscribed_location_id,
    membership_tier: parsed.tier,
    membership_vertical: parsed.vertical,
    billing_cadence: parsed.interval,
    local_release: LOCAL_RELEASE,
  };
  const params = {
    mode: 'subscription',
    success_url: `${PUBLIC_SITE_ORIGIN}/membership-success/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${PUBLIC_SITE_ORIGIN}/membership-start/?canceled=1`,
    client_reference_id: checkoutIntentId,
    customer_email: session.email_normalized,
    'line_items[0][price]': price.id,
    'line_items[0][quantity]': 1,
    'subscription_data[metadata][community]': metadata.community,
    'subscription_data[metadata][price_authority]': metadata.price_authority,
    'subscription_data[metadata][franklin_checkout_intent_id]': metadata.franklin_checkout_intent_id,
    'subscription_data[metadata][franklin_account_id]': metadata.franklin_account_id,
    'subscription_data[metadata][franklin_organization_id]': metadata.franklin_organization_id,
    'subscription_data[metadata][franklin_profile_id]': metadata.franklin_profile_id,
    'subscription_data[metadata][franklin_location_id]': metadata.franklin_location_id,
    'subscription_data[metadata][membership_tier]': metadata.membership_tier,
    'subscription_data[metadata][membership_vertical]': metadata.membership_vertical,
    'subscription_data[metadata][billing_cadence]': metadata.billing_cadence,
    'subscription_data[metadata][local_release]': metadata.local_release,
    'metadata[community]': metadata.community,
    'metadata[price_authority]': metadata.price_authority,
    'metadata[franklin_checkout_intent_id]': metadata.franklin_checkout_intent_id,
    'metadata[franklin_profile_id]': metadata.franklin_profile_id,
  };
  if (promotionCodeId) params['discounts[0][promotion_code]'] = promotionCodeId;
  const checkout = await stripeRequest('POST', '/checkout/sessions', params, `franklin_checkout_${idempotencyKey}`);
  await withTransaction(async (client) => {
    await client.query(`update checkout_intents set stripe_checkout_session_id=$2,state='REDIRECT_READY',updated_at=now() where checkout_intent_id=$1`, [checkoutIntentId, checkout.id]);
    await audit(client, { actorType: 'ACCOUNT', actorRef: session.account_id, action: 'CREATE_CHECKOUT_SESSION', objectType: 'CHECKOUT_INTENT', objectRef: checkoutIntentId, outcome: 'PASS', details: { lookupKey: parsed.lookupKey, foundingApplied: Boolean(promotionCodeId), controlled: !CHECKOUT_GENERAL_AVAILABILITY } });
  });
  sendJson(res, 201, { checkoutIntentId, checkoutUrl: checkout.url, lookupKey: parsed.lookupKey, foundingOfferApplied: Boolean(promotionCodeId), controlledPurchase: !CHECKOUT_GENERAL_AVAILABILITY });
});

route('POST', /^\/api\/billing\/portal$/, async (req, res) => {
  const session = await authenticate(req); requireCsrf(req, session);
  const result = await withClient((client) => client.query(
    `select stripe_customer_id from member_subscriptions where account_id=$1 and stripe_customer_id is not null order by updated_at desc limit 1`,
    [session.account_id],
  ));
  const customer = result.rows[0]?.stripe_customer_id;
  if (!customer) throw new HttpError(404, 'stripe_customer_not_found');
  const portal = await stripeRequest('POST', '/billing_portal/sessions', { customer, return_url: `${PUBLIC_SITE_ORIGIN}/member-account/` }, `franklin_portal_${session.account_id}_${Math.floor(Date.now() / 60000)}`);
  sendJson(res, 201, { portalUrl: portal.url });
});

route('GET', /^\/api\/membership\/status$/, async (req, res) => {
  const session = await authenticate(req);
  const result = await withClient((client) => client.query(
    `select s.subscription_id,s.lookup_key,s.vertical,s.tier,s.billing_interval,s.state,s.state_reason,s.access_active,s.cancel_at_period_end,s.current_period_end,s.cancel_effective_at,s.grace_ends_at,e.version,e.updated_at,
            pl.franklin_profile_id,pl.subscribed_location_id
     from member_subscriptions s join profile_links pl on pl.profile_link_id=s.profile_link_id left join member_entitlements e on e.subscription_id=s.subscription_id
     where s.account_id=$1 order by s.updated_at desc`,
    [session.account_id],
  ));
  const language = preferredLanguage(session, req);
  sendJson(res, 200, {
    memberships: result.rows,
    support: { email: 'community@franklinnavigator.com', phone: '(615) 656-7020', portalAvailable: result.rows.some((row) => row.access_active || row.state === 'CANCELING' || row.state === 'GRACE') },
    message: message(language, 'Your Franklin membership status is shown below.', 'El estado de su membresía de Franklin aparece a continuación.'),
  });
});

route('POST', /^\/api\/membership\/first-value$/, async (req, res) => {
  const session = await authenticate(req); requireCsrf(req, session);
  const body = await readJson(req);
  const subscriptionId = String(body.subscriptionId || '');
  const benefits = Array.isArray(body.selectedBenefits) ? body.selectedBenefits.map((value) => String(value).slice(0, 80)).slice(0, 20) : [];
  const result = await withTransaction(async (client) => {
    const owned = await client.query(`select subscription_id from member_subscriptions where subscription_id=$1 and account_id=$2 and access_active=true`, [subscriptionId, session.account_id]);
    if (!owned.rows[0]) throw new HttpError(404, 'active_membership_not_found');
    await client.query(
      `update member_onboarding set profile_link_reviewed_at=coalesce(profile_link_reviewed_at,now()),benefits_selected_at=now(),growth_desk_ready_at=coalesce(growth_desk_ready_at,now()),support_access_reviewed_at=coalesce(support_access_reviewed_at,now()),first_value_at=coalesce(first_value_at,now()),selected_benefits=$2::jsonb,updated_at=now() where subscription_id=$1`,
      [subscriptionId, JSON.stringify(benefits)],
    );
    await audit(client, { actorType: 'ACCOUNT', actorRef: session.account_id, action: 'RECORD_FIRST_VALUE', objectType: 'SUBSCRIPTION', objectRef: subscriptionId, outcome: 'PASS', details: { benefitCount: benefits.length } });
    return true;
  });
  sendJson(res, 200, { ok: result, growthDeskReady: true, supportEmail: 'community@franklinnavigator.com' });
});

route('POST', /^\/api\/membership\/assertion$/, async (req, res) => {
  const session = await authenticate(req); requireCsrf(req, session);
  assertSecret(ENTITLEMENT_ASSERTION_SECRET, 'entitlement_assertion_not_configured');
  const body = await readJson(req);
  const subscriptionId = String(body.subscriptionId || '');
  const result = await withClient((client) => client.query(
    `select s.subscription_id,s.tier,s.account_id,pl.franklin_profile_id,e.active,e.version from member_subscriptions s join profile_links pl on pl.profile_link_id=s.profile_link_id join member_entitlements e on e.subscription_id=s.subscription_id where s.subscription_id=$1 and s.account_id=$2 and e.active=true`,
    [subscriptionId, session.account_id],
  ));
  const row = result.rows[0];
  if (!row) throw new HttpError(403, 'active_paid_membership_required');
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: 'LOCAL_COMMUNITY_PLATFORM', aud: 'SRE_MEMBER_GROWTH_DESK', community: COMMUNITY, local_release: LOCAL_RELEASE, active_paid_member: true, tier: String(row.tier).toUpperCase(), member_key: row.account_id, member_profile_id: row.franklin_profile_id, entitlement_version: Number(row.version), iat: now, exp: now + 600, jti: uuid() };
  sendJson(res, 200, { assertion: signAssertion(payload, ENTITLEMENT_ASSERTION_SECRET), expiresInSeconds: 600 });
});

route('POST', /^\/webhooks\/stripe$/, async (req, res) => {
  if (!ALLOW_DIRECT_STRIPE_WEBHOOK || !STRIPE_EVENT_PROCESSING_ENABLED) throw new HttpError(503, 'stripe_event_processing_disabled');
  assertSecret(STRIPE_WEBHOOK_SECRET, 'stripe_webhook_not_configured');
  const raw = await readBody(req);
  verifyStripeSignature(raw, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET, 300);
  const event = JSON.parse(raw.toString('utf8'));
  const result = await processCommerceEvent(event, { source: 'STRIPE', signatureVerified: true, rawBody: raw });
  sendJson(res, 200, { ok: true, ...result });
});

route('POST', /^\/events\/sre$/, async (req, res) => {
  if (!SRE_EVENT_PROCESSING_ENABLED) throw new HttpError(503, 'sre_event_processing_disabled');
  assertSecret(LOCAL_EVENT_SECRET, 'local_event_secret_not_configured');
  const raw = await readBody(req);
  const timestamp = String(req.headers['x-fn-timestamp'] || '');
  const signature = String(req.headers['x-fn-signature'] || '');
  const eventId = String(req.headers['x-fn-event-id'] || '');
  if (!eventId || !verifyTimestampedSignature({ secret: LOCAL_EVENT_SECRET, rawBody: raw, timestamp, signature })) throw new HttpError(401, 'sre_event_signature_invalid');
  const envelope = JSON.parse(raw.toString('utf8'));
  const event = envelope.event || envelope;
  if (event.id !== eventId) throw new HttpError(409, 'sre_event_id_mismatch');
  const result = await processCommerceEvent(event, { source: 'SRE', signatureVerified: true, rawBody: raw });
  sendJson(res, 200, { ok: true, ...result });
});

route('POST', /^\/internal\/catalog\/sync$/, async (req, res) => {
  admin(req);
  const observed = [];
  const queue = [...LOOKUP_KEYS];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const key = queue.shift();
      const price = await stripePrice(key);
      const parsed = parseLookupKey(key);
      const interval = price.recurring?.interval === 'year' ? 'annual' : price.recurring?.interval === 'month' ? 'monthly' : null;
      if (!parsed || interval !== parsed.interval) throw new Error(`catalog_interval_mismatch_${key}`);
      observed.push({ lookupKey: key, priceId: price.id, productId: typeof price.product === 'string' ? price.product : price.product?.id, currency: price.currency, unitAmount: price.unit_amount, recurringInterval: interval, active: price.active, payloadSha: sha256(JSON.stringify(price)) });
    }
  });
  await Promise.all(workers);
  if (observed.length !== 84 || new Set(observed.map((row) => row.lookupKey)).size !== 84) throw new HttpError(409, 'catalog_84_mapping_incomplete');
  await withTransaction(async (client) => {
    for (const row of observed) await client.query(
      `insert into checkout_price_bindings(lookup_key,stripe_price_id,stripe_product_id,currency,unit_amount,recurring_interval,active,observed_at,provider_payload_sha256)
       values($1,$2,$3,$4,$5,$6,$7,now(),$8)
       on conflict(lookup_key) do update set stripe_price_id=excluded.stripe_price_id,stripe_product_id=excluded.stripe_product_id,currency=excluded.currency,unit_amount=excluded.unit_amount,recurring_interval=excluded.recurring_interval,active=excluded.active,observed_at=now(),provider_payload_sha256=excluded.provider_payload_sha256`,
      [row.lookupKey, row.priceId, row.productId, row.currency, row.unitAmount, row.recurringInterval, row.active, row.payloadSha],
    );
    await audit(client, { actorType: 'ADMIN', actorRef: 'catalog-sync', action: 'SYNC_STRIPE_CATALOG', objectType: 'CATALOG', objectRef: PRICE_AUTHORITY, outcome: 'PASS', details: { count: observed.length } });
  });
  sendJson(res, 200, { ok: true, products: VERTICALS.length, prices: observed.length, enterprise: 'QUOTE_ONLY', priceAuthority: PRICE_AUTHORITY });
});

route('POST', /^\/internal\/accounts\/(?<accountId>[0-9a-f-]{36})\/verify-email$/, async (req, res, params) => {
  admin(req);
  await withTransaction(async (client) => {
    const result = await client.query(`update member_accounts set email_verified_at=coalesce(email_verified_at,now()),updated_at=now() where account_id=$1 returning account_id`, [params.accountId]);
    if (!result.rowCount) throw new HttpError(404, 'account_not_found');
    await audit(client, { actorType: 'ADMIN', actorRef: 'support', action: 'VERIFY_EMAIL_SUPPORT', objectType: 'ACCOUNT', objectRef: params.accountId, outcome: 'PASS' });
  });
  sendJson(res, 200, { ok: true, accountId: params.accountId });
});

route('GET', /^\/internal\/exceptions$/, async (req, res) => {
  admin(req);
  const result = await withClient((client) => client.query(`select exception_id,exception_type,state,priority,account_id,subscription_id,event_id,summary,safe_details,created_at,updated_at from admin_exceptions where state<>'RESOLVED' order by case priority when 'CRITICAL' then 1 when 'HIGH' then 2 when 'MEDIUM' then 3 else 4 end,created_at desc limit 250`));
  sendJson(res, 200, { exceptions: result.rows });
});

route('POST', /^\/internal\/lifecycle\/sweep$/, async (req, res) => {
  admin(req);
  await expireGrace(); await retryEvents();
  const result = await withClient((client) => client.query(`select processing_state,count(*)::int n from commerce_event_ledger group by processing_state order by processing_state`));
  sendJson(res, 200, { ok: true, eventStates: result.rows });
});

route('GET', /^\/internal\/readiness$/, async (req, res) => {
  admin(req);
  const [schema, tables, events, exceptions, bindings] = await withClient(async (client) => Promise.all([
    client.query(`select version,sha256,applied_at from schema_migrations order by version`),
    client.query(`select count(*)::int n from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`),
    client.query(`select processing_state,count(*)::int n from commerce_event_ledger group by processing_state order by processing_state`),
    client.query(`select state,priority,count(*)::int n from admin_exceptions group by state,priority order by state,priority`),
    client.query(`select count(*)::int n from checkout_price_bindings where active=true`),
  ]));
  sendJson(res, 200, { release: RELEASE, localRelease: LOCAL_RELEASE, community: COMMUNITY, schema: schema.rows, publicTableCount: tables.rows[0]?.n, eventStates: events.rows, exceptionStates: exceptions.rows, activePriceBindings: bindings.rows[0]?.n, expectedPriceBindings: 84, secrets: secretReadiness(), flags: { liveCommerce: LIVE_COMMERCE_ENABLED, generalCheckout: CHECKOUT_GENERAL_AVAILABILITY, stripeEvents: STRIPE_EVENT_PROCESSING_ENABLED, sreEvents: SRE_EVENT_PROCESSING_ENABLED }, authorityTransfer: false });
});

const server = http.createServer(async (req, res) => {
  const rid = requestId(req);
  res.setHeader('X-Request-Id', rid);
  securityHeaders(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const pathname = routePath(req);
  const matched = matchRoute(req.method, pathname);
  if (!matched) return sendJson(res, 404, { error: 'not_found', requestId: rid });
  try {
    await matched.handler(req, res, matched.params, matched.match);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const code = error instanceof HttpError ? error.code : 'internal_error';
    if (status >= 500) log('error', 'request_failed', { requestId: rid, method: req.method, pathname, code, error: safeError(error) });
    else log('warn', 'request_rejected', { requestId: rid, method: req.method, pathname, code });
    if (!res.headersSent) sendJson(res, status, { error: code, message: error instanceof HttpError ? error.message : 'The membership service could not complete the request.', messageEs: error instanceof HttpError ? error.messageEs : 'El servicio de membresía no pudo completar la solicitud.', details: error instanceof HttpError ? error.details : undefined, requestId: rid });
    else res.destroy();
  }
});

async function startup() {
  const migration = await migrate();
  log('info', 'startup', { port: PORT, localRelease: LOCAL_RELEASE, databaseConfigured: Boolean(pool), migrationCount: migration.applied.length, secretReadiness: secretReadiness(), flags: { liveCommerce: LIVE_COMMERCE_ENABLED, generalCheckout: CHECKOUT_GENERAL_AVAILABILITY, stripeEvents: STRIPE_EVENT_PROCESSING_ENABLED, sreEvents: SRE_EVENT_PROCESSING_ENABLED } });
  server.listen(PORT, '0.0.0.0');
  setInterval(() => retryEvents().catch((error) => log('error', 'retry_worker_failed', { error: safeError(error) })), 60000).unref();
  setInterval(() => expireGrace().catch((error) => log('error', 'grace_worker_failed', { error: safeError(error) })), 300000).unref();
}
startup().catch((error) => { log('critical', 'startup_failed', { error: safeError(error) }); process.exit(1); });

async function shutdown(signal) {
  log('info', 'shutdown', { signal });
  server.close();
  if (pool) await pool.end().catch(() => {});
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
