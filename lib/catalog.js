'use strict';

const COMMUNITY = 'FRANKLIN_TN';
const PRICE_AUTHORITY = 'FRANKLIN_COMMUNITY_MEMBERSHIP_AND_CHARTER_PRICE_AUTHORITY_V5_2026_08_31';
const FOUNDING = Object.freeze({active:false, public:false, retiredForNewSales:true});

const plans = Object.freeze([
  Object.freeze({
    id:'monthly', label:'Monthly Community Membership',
    lookupKey:'franklin_community_member_monthly_v5',
    stripePriceId:'price_1UAfLPRxNra9nizolEiP5Z2z',
    billingMode:'subscription', interval:'MONTHLY',
    regularUsd:5, autoRenew:true, termMonths:1, publicChoice:'MONTHLY'
  }),
  Object.freeze({
    id:'annual', label:'Annual Community Membership',
    lookupKey:'franklin_community_member_annual_v5',
    stripePriceId:'price_1UAfLXRxNra9nizoW32RIfPG',
    billingMode:'subscription', interval:'ANNUAL',
    regularUsd:50, autoRenew:true, termMonths:12, publicChoice:'ANNUAL', recommended:false
  }),
  Object.freeze({
    id:'charter', label:'Franklin Charter Membership',
    lookupKey:'franklin_charter_member_36_month_v5',
    stripePriceId:'price_1UAfLfRxNra9nizoqd84x8DR',
    billingMode:'payment', interval:'ONE_TIME',
    regularUsd:120, autoRenew:false, termMonths:36, publicChoice:'CHARTER',
    bestLongTermValue:true, expirationReminderDays:Object.freeze([60,30,7])
  })
]);
const planMap = new Map(plans.map(plan => [plan.lookupKey, plan]));
const stripePriceMap = new Map(plans.map(plan => [plan.stripePriceId, plan]));

function getPlan(lookupKey) {
  return planMap.get(String(lookupKey || '').trim()) || null;
}
function getPlanByStripePriceId(stripePriceId) {
  return stripePriceMap.get(String(stripePriceId || '').trim()) || null;
}

function publicCatalog() {
  return {
    community: COMMUNITY,
    publicIdentity: 'Franklin Navigator Community Membership',
    localOnlyMessage: 'Built specifically for Franklin, Tennessee—not a national directory with a Franklin label.',
    priceAuthority: PRICE_AUTHORITY,
    stripeProductId:'prod_VB1O5muUZztY2O',
    productCount: 1,
    publicChoiceCount: 3,
    providerPriceCount: plans.length,
    selfServiceRecurringPriceCount: 2,
    selfServiceOneTimePriceCount: 1,
    founding: FOUNDING,
    freePresence: {priceUsd:0,factualCorrectionsFree:true},
    choices: [
      {id:'MONTHLY',label:'Monthly',priceUsd:5,autoRenew:true,renewal:'MONTHLY_UNTIL_CANCELED'},
      {id:'ANNUAL',label:'Annual',priceUsd:50,autoRenew:true,recommended:false,renewal:'ANNUAL_UNTIL_CANCELED'},
      {id:'CHARTER',label:'Three years',priceUsd:120,autoRenew:false,termMonths:36,bestLongTermValue:true,freshRenewalChoiceRequired:true}
    ],
    providerPlans: plans,
    legacy84PublicSuppressed: true,
    publicFoundingDiscountActive:false,
    publicCheckoutOpen: false,
    preCheckoutCta:'SHOW ME',
    postVerifiedCta:'ACTIVATE MY MEMBERSHIP'
  };
}

module.exports = {COMMUNITY, PRICE_AUTHORITY, FOUNDING, plans, getPlan, getPlanByStripePriceId, publicCatalog};
