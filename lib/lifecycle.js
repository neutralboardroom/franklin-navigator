'use strict';

const TERMINAL = new Set(['TERMINATED', 'REFUNDED']);
function initialState() {
  return {status:'PENDING_PAYMENT', failureCount:0, cancelAtPeriodEnd:false, currentPeriodEnd:null, lastEventCreated:0, subscriptionId:null};
}
function eventRank(type) {
  return ({REFUNDED:100, TERMINATED:90, CANCELED:80, PAYMENT_FAILED:60, PAYMENT_SUCCEEDED:50, RENEWED:50, CHECKOUT_PENDING:10}[type] || 1);
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
function accessAllowed(status) { return ['ACTIVE','ACTIVE_CANCELING','GRACE'].includes(String(status)); }
function mapStripeEvent(event) {
  const type = String(event?.type || '');
  const object = event?.data?.object || {};
  const created = Number(event?.created || 0);
  const subscriptionId = object.subscription || (object.object === 'subscription' ? object.id : object.parent?.subscription_details?.subscription) || null;
  const currentPeriodEnd = object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null;
  if (type === 'checkout.session.completed') return {type: object.payment_status === 'paid' ? 'PAYMENT_SUCCEEDED' : 'CHECKOUT_PENDING', created, subscriptionId:object.subscription || null, currentPeriodEnd};
  if (type === 'checkout.session.async_payment_succeeded') return {type:'PAYMENT_SUCCEEDED', created, subscriptionId, currentPeriodEnd};
  if (type === 'checkout.session.async_payment_failed' || type === 'invoice.payment_failed') return {type:'PAYMENT_FAILED', created, subscriptionId, currentPeriodEnd};
  if (type === 'invoice.paid' || type === 'invoice.payment_succeeded') return {type: object.billing_reason === 'subscription_cycle' ? 'RENEWED' : 'PAYMENT_SUCCEEDED', created, subscriptionId, currentPeriodEnd};
  if (type === 'customer.subscription.updated') return {type: object.cancel_at_period_end ? 'CANCEL_AT_PERIOD_END' : 'CANCEL_REVERSED', created, subscriptionId:object.id, currentPeriodEnd};
  if (type === 'customer.subscription.deleted') return {type:'TERMINATED', created, subscriptionId:object.id, currentPeriodEnd};
  if (type === 'charge.refunded') return {type:'REFUNDED', created, subscriptionId, currentPeriodEnd};
  return null;
}
module.exports = {initialState, applyEvent, accessAllowed, mapStripeEvent};
