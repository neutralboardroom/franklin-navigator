'use strict';

const TERMINAL = new Set(['TERMINATED', 'REFUNDED']);
function initialState() {
  return {status:'PENDING_PAYMENT', failureCount:0, cancelAtPeriodEnd:false, currentPeriodEnd:null, lastEventCreated:0, subscriptionId:null};
}
function eventRank(type) {
  return ({REFUNDED:100, TERMINATED:90, CANCELED:80, PAYMENT_FAILED:60, PAYMENT_SUCCEEDED:50, RENEWED:50, CHECKOUT_PENDING:10}[type] || 1);
}
function addMonthsIso(start, months) {
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + Number(months || 0));
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth()+1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day,last));
  return date.toISOString();
}
function expirationReminders(expiresAt) {
  const end = new Date(expiresAt);
  if (Number.isNaN(end.getTime())) return [];
  return [60,30,7].map(days=>({daysBefore:days,sendAt:new Date(end.getTime()-days*86400000).toISOString()}));
}
function applyEvent(input, event) {
  const state = {...initialState(), ...(input || {})};
  const created = Number(event.created || 0);
  if (created && state.lastEventCreated && created < state.lastEventCreated && eventRank(event.type) < 90) return {...state, ignored:'OUT_OF_ORDER'};
  const incomingSub = event.subscriptionId || state.subscriptionId || null;
  const newSubscription = Boolean(event.subscriptionId && state.subscriptionId && event.subscriptionId !== state.subscriptionId);
  if (TERMINAL.has(state.status) && !newSubscription && !['REFUNDED','TERMINATED'].includes(event.type)) return {...state, ignored:'TERMINAL_STATE'};
  const next = {...state, subscriptionId: incomingSub, lastEventCreated: Math.max(state.lastEventCreated || 0, created || 0)};
  if (newSubscription) Object.assign(next, initialState(), {subscriptionId:event.subscriptionId, lastEventCreated:created || 0});
  switch (event.type) {
    case 'CHECKOUT_PENDING': next.status='PENDING_PAYMENT'; break;
    case 'PAYMENT_SUCCEEDED':
    case 'RENEWED':
      next.status='ACTIVE'; next.failureCount=0; next.cancelAtPeriodEnd=false;
      next.currentPeriodEnd=event.currentPeriodEnd || next.currentPeriodEnd; break;
    case 'PAYMENT_FAILED':
      next.failureCount=(next.failureCount || 0)+1;
      next.status=next.failureCount === 1 ? 'GRACE' : 'SUSPENDED'; break;
    case 'CANCEL_AT_PERIOD_END':
      next.cancelAtPeriodEnd=true; next.status='ACTIVE_CANCELING'; next.currentPeriodEnd=event.currentPeriodEnd || next.currentPeriodEnd; break;
    case 'CANCEL_REVERSED': next.cancelAtPeriodEnd=false; next.status='ACTIVE'; break;
    case 'TERMINATED': next.status='TERMINATED'; next.cancelAtPeriodEnd=false; break;
    case 'REFUNDED': next.status='REFUNDED'; next.cancelAtPeriodEnd=false; break;
    default: next.ignored='UNSUPPORTED_EVENT';
  }
  return next;
}
function accessAllowed(status, expiresAt=null, now=Date.now()) {
  if (!['ACTIVE','ACTIVE_CANCELING','GRACE'].includes(String(status))) return false;
  if (!expiresAt) return true;
  const expiry = new Date(expiresAt).getTime();
  return Number.isFinite(expiry) && expiry > Number(now);
}
function mapStripeEvent(event) {
  const type = String(event?.type || '');
  const object = event?.data?.object || {};
  const created = Number(event?.created || object.created || 0);
  const subscriptionId = object.subscription || (object.object === 'subscription' ? object.id : object.parent?.subscription_details?.subscription) || null;
  let currentPeriodEnd = object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null;
  const termMonths = Number(object.metadata?.term_months || object.subscription_details?.metadata?.term_months || 0);
  const autoRenew = String(object.metadata?.auto_renew || object.subscription_details?.metadata?.auto_renew || '').toLowerCase();
  if (!currentPeriodEnd && type === 'checkout.session.completed' && object.mode === 'payment' && termMonths === 36 && autoRenew === 'false') {
    currentPeriodEnd = addMonthsIso(new Date(created*1000 || Date.now()), 36);
  }
  if (type === 'checkout.session.completed') return {type: object.payment_status === 'paid' ? 'PAYMENT_SUCCEEDED' : 'CHECKOUT_PENDING', created, subscriptionId:object.subscription || null, currentPeriodEnd, oneTimeTerm:object.mode==='payment'};
  if (type === 'checkout.session.async_payment_succeeded') return {type:'PAYMENT_SUCCEEDED', created, subscriptionId, currentPeriodEnd};
  if (type === 'checkout.session.async_payment_failed' || type === 'invoice.payment_failed') return {type:'PAYMENT_FAILED', created, subscriptionId, currentPeriodEnd};
  if (type === 'invoice.paid' || type === 'invoice.payment_succeeded') return {type: object.billing_reason === 'subscription_cycle' ? 'RENEWED' : 'PAYMENT_SUCCEEDED', created, subscriptionId, currentPeriodEnd};
  if (type === 'customer.subscription.updated') return {type: object.cancel_at_period_end ? 'CANCEL_AT_PERIOD_END' : 'CANCEL_REVERSED', created, subscriptionId:object.id, currentPeriodEnd};
  if (type === 'customer.subscription.deleted') return {type:'TERMINATED', created, subscriptionId:object.id, currentPeriodEnd};
  if (type === 'charge.refunded') return {type:'REFUNDED', created, subscriptionId, currentPeriodEnd};
  return null;
}
module.exports = {initialState, applyEvent, accessAllowed, mapStripeEvent, addMonthsIso, expirationReminders};
