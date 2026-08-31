'use strict';

const STATES = Object.freeze({
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  GRACE: 'GRACE',
  SUSPENDED: 'SUSPENDED',
  CANCELING: 'CANCELING',
  TERMINATED: 'TERMINATED',
  REFUNDED: 'REFUNDED',
  DISPUTED: 'DISPUTED',
});

const ACTIVE_ACCESS_STATES = new Set([STATES.ACTIVE, STATES.GRACE, STATES.CANCELING]);

function isoFromUnix(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

function normalizeStripeStatus(status) {
  const raw = String(status || '').toLowerCase();
  if (['active', 'trialing'].includes(raw)) return STATES.ACTIVE;
  if (['past_due'].includes(raw)) return STATES.GRACE;
  if (['unpaid', 'paused', 'incomplete_expired'].includes(raw)) return STATES.SUSPENDED;
  if (['canceled'].includes(raw)) return STATES.TERMINATED;
  if (['incomplete'].includes(raw)) return STATES.PENDING;
  return null;
}

function transition(current = {}, input = {}) {
  const eventType = String(input.eventType || '');
  const object = input.object && typeof input.object === 'object' ? input.object : {};
  const eventCreated = Number(input.eventCreated || 0);
  const lastEventCreated = Number(current.lastEventCreated || 0);
  if (eventCreated && lastEventCreated && eventCreated < lastEventCreated) {
    return { ...current, ignored: true, ignoreReason: 'OUT_OF_ORDER_STALE_EVENT' };
  }

  const next = {
    ...current,
    ignored: false,
    ignoreReason: null,
    lastEventCreated: Math.max(lastEventCreated, eventCreated || 0),
    lastEventType: eventType,
    updatedAt: new Date().toISOString(),
  };
  const setState = (state, reason) => {
    next.state = state;
    next.stateReason = reason;
    next.accessActive = ACTIVE_ACCESS_STATES.has(state);
  };

  if (eventType === 'checkout.session.completed') {
    next.checkoutSessionId = object.id || next.checkoutSessionId || null;
    next.stripeCustomerId = object.customer || next.stripeCustomerId || null;
    next.stripeSubscriptionId = object.subscription || next.stripeSubscriptionId || null;
    if (object.payment_status === 'paid' || object.payment_status === 'no_payment_required') {
      setState(STATES.ACTIVE, 'CHECKOUT_SETTLED');
      next.activatedAt ||= new Date().toISOString();
    } else {
      setState(STATES.PENDING, 'CHECKOUT_REQUIRES_SETTLEMENT');
    }
  } else if (eventType === 'checkout.session.async_payment_succeeded') {
    next.checkoutSessionId = object.id || next.checkoutSessionId || null;
    next.stripeCustomerId = object.customer || next.stripeCustomerId || null;
    next.stripeSubscriptionId = object.subscription || next.stripeSubscriptionId || null;
    setState(STATES.ACTIVE, 'ASYNC_PAYMENT_SETTLED');
    next.activatedAt ||= new Date().toISOString();
    next.graceEndsAt = null;
  } else if (eventType === 'checkout.session.async_payment_failed') {
    setState(STATES.SUSPENDED, 'ASYNC_PAYMENT_FAILED');
    next.suspendedAt = new Date().toISOString();
  } else if (['invoice.paid', 'invoice.payment_succeeded'].includes(eventType)) {
    next.stripeCustomerId = object.customer || next.stripeCustomerId || null;
    next.stripeSubscriptionId = object.subscription || object.parent?.subscription_details?.subscription || next.stripeSubscriptionId || null;
    setState(STATES.ACTIVE, object.billing_reason === 'subscription_cycle' ? 'RENEWAL_SETTLED' : 'INVOICE_SETTLED');
    next.activatedAt ||= new Date().toISOString();
    next.graceEndsAt = null;
    next.suspendedAt = null;
    if (object.billing_reason === 'subscription_cycle') next.renewedAt = new Date().toISOString();
  } else if (eventType === 'invoice.payment_failed') {
    next.stripeCustomerId = object.customer || next.stripeCustomerId || null;
    next.stripeSubscriptionId = object.subscription || object.parent?.subscription_details?.subscription || next.stripeSubscriptionId || null;
    const graceDays = Math.min(30, Math.max(0, Number(input.graceDays ?? 7)));
    if (graceDays > 0 && current.state !== STATES.TERMINATED && current.state !== STATES.REFUNDED) {
      setState(STATES.GRACE, 'PAYMENT_FAILED_GRACE');
      next.graceEndsAt = new Date(Date.now() + graceDays * 86400000).toISOString();
    } else {
      setState(STATES.SUSPENDED, 'PAYMENT_FAILED');
      next.suspendedAt = new Date().toISOString();
    }
    next.paymentFailedAt = new Date().toISOString();
  } else if (eventType === 'customer.subscription.updated') {
    next.stripeSubscriptionId = object.id || next.stripeSubscriptionId || null;
    next.stripeCustomerId = object.customer || next.stripeCustomerId || null;
    next.currentPeriodEnd = isoFromUnix(object.current_period_end) || next.currentPeriodEnd || null;
    next.cancelAtPeriodEnd = Boolean(object.cancel_at_period_end);
    const normalized = normalizeStripeStatus(object.status);
    if (next.cancelAtPeriodEnd && normalized === STATES.ACTIVE) {
      setState(STATES.CANCELING, 'CANCEL_AT_PERIOD_END');
      next.cancelEffectiveAt = next.currentPeriodEnd;
    } else if (normalized) {
      setState(normalized, `STRIPE_SUBSCRIPTION_${String(object.status || '').toUpperCase()}`);
      if (normalized === STATES.ACTIVE) next.graceEndsAt = null;
    }
  } else if (eventType === 'customer.subscription.deleted') {
    next.stripeSubscriptionId = object.id || next.stripeSubscriptionId || null;
    next.stripeCustomerId = object.customer || next.stripeCustomerId || null;
    setState(STATES.TERMINATED, 'SUBSCRIPTION_TERMINATED');
    next.terminatedAt = new Date().toISOString();
    next.cancelAtPeriodEnd = false;
  } else if (eventType === 'charge.refunded') {
    const amount = Number(object.amount || 0);
    const refunded = Number(object.amount_refunded || 0);
    next.stripeCustomerId = object.customer || next.stripeCustomerId || null;
    next.refundedAmount = refunded;
    if (amount > 0 && refunded >= amount) {
      setState(STATES.REFUNDED, 'FULL_REFUND');
      next.refundedAt = new Date().toISOString();
    } else {
      next.stateReason = 'PARTIAL_REFUND_REVIEW';
      next.requiresReview = true;
    }
  } else if (eventType === 'charge.dispute.created') {
    setState(STATES.DISPUTED, 'PAYMENT_DISPUTED');
    next.disputedAt = new Date().toISOString();
    next.requiresReview = true;
  } else if (eventType === 'local.grace_expired') {
    if (current.state === STATES.GRACE && current.graceEndsAt && Date.parse(current.graceEndsAt) <= Date.now()) {
      setState(STATES.SUSPENDED, 'GRACE_EXPIRED');
      next.suspendedAt = new Date().toISOString();
    } else {
      return { ...current, ignored: true, ignoreReason: 'GRACE_NOT_EXPIRED' };
    }
  } else {
    return { ...current, ignored: true, ignoreReason: 'UNSUPPORTED_EVENT_TYPE' };
  }

  return next;
}

function entitlementFor(subscription) {
  const state = subscription?.state || STATES.PENDING;
  return {
    state,
    active: ACTIVE_ACCESS_STATES.has(state),
    tier: subscription?.tier || null,
    vertical: subscription?.vertical || null,
    billingInterval: subscription?.billingInterval || null,
    effectiveAt: subscription?.activatedAt || subscription?.updatedAt || new Date().toISOString(),
    expiresAt: state === STATES.CANCELING ? subscription?.cancelEffectiveAt || null : state === STATES.GRACE ? subscription?.graceEndsAt || null : null,
    reason: subscription?.stateReason || null,
  };
}

module.exports = { STATES, ACTIVE_ACCESS_STATES, normalizeStripeStatus, transition, entitlementFor };
