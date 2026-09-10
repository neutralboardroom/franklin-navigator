'use strict';

const COMMUNITY = 'FRANKLIN_TN';
const PRICE_AUTHORITY = 'FRANKLIN_NAVIGATOR_SINGLE_ANNUAL_NEW_SALE_PRICE_AUTHORITY_FINAL_2026_09_10';
const FOUNDING = Object.freeze({active:false, public:false, retiredForNewSales:true});

// Keep retired plans recognizable for legitimate historical subscriptions, webhook/lifecycle
// reconciliation, billing history, cancellation, and audit. Only the V6 annual plan is
// eligible to create a NEW checkout session.
const plans = Object.freeze([
  Object.freeze({
    id:'monthly_legacy', label:'Existing monthly Community Membership',
    lookupKey:'franklin_community_member_monthly_v5',
    stripePriceId:'price_1UAfLPRxNra9nizolEiP5Z2z',
    billingMode:'subscription', interval:'MONTHLY', regularUsd:5,
    autoRenew:true, termMonths:1, newSaleEligible:false, historical:true
  }),
  Object.freeze({
    id:'annual_legacy', label:'Existing annual Community Membership',
    lookupKey:'franklin_community_member_annual_v5',
    stripePriceId:'price_1UAfLXRxNra9nizoW32RIfPG',
    billingMode:'subscription', interval:'ANNUAL', regularUsd:50,
    autoRenew:true, termMonths:12, newSaleEligible:false, historical:true
  }),
  Object.freeze({
    id:'charter_legacy', label:'Existing fixed-term Community Membership',
    lookupKey:'franklin_charter_member_36_month_v5',
    stripePriceId:'price_1UAfLfRxNra9nizoqd84x8DR',
    billingMode:'payment', interval:'ONE_TIME', regularUsd:120,
    autoRenew:false, termMonths:36, newSaleEligible:false, historical:true,
    expirationReminderDays:Object.freeze([60,30,7])
  }),
  Object.freeze({
    id:'annual', label:'Franklin Navigator Community Membership',
    lookupKey:'franklin_community_member_annual_v6',
    stripePriceId:'price_1UE31nRxNra9nizoEPyavVQF',
    billingMode:'subscription', interval:'ANNUAL', regularUsd:35,
    autoRenew:true, termMonths:12, publicChoice:'ANNUAL', newSaleEligible:true, historical:false
  }),
  Object.freeze({
    id:'charter_v6_retired', label:'Existing fixed-term Community Membership',
    lookupKey:'franklin_charter_member_36_month_v6',
    stripePriceId:'price_1UE31xRxNra9nizo0gBeYslr',
    billingMode:'payment', interval:'ONE_TIME', regularUsd:90,
    autoRenew:false, termMonths:36, newSaleEligible:false, historical:true,
    expirationReminderDays:Object.freeze([60,30,7])
  })
]);
const planMap = new Map(plans.map(plan => [plan.lookupKey, plan]));
const stripePriceMap = new Map(plans.map(plan => [plan.stripePriceId, plan]));
const newSalePlans = Object.freeze(plans.filter(plan => plan.newSaleEligible));

function getPlan(lookupKey) {
  return planMap.get(String(lookupKey || '').trim()) || null;
}
function getPlanByStripePriceId(stripePriceId) {
  return stripePriceMap.get(String(stripePriceId || '').trim()) || null;
}
function publicCheckoutOpen() {
  return /^(1|true|yes|on)$/i.test(String(process.env.COMMERCE_ENABLED || 'false'));
}

function publicCatalog() {
  return {
    community: COMMUNITY,
    publicIdentity: 'Franklin Navigator Community Membership',
    publicOffer: 'Franklin Navigator Community Membership — $35/year. Renews annually until canceled.',
    localOnlyMessage: 'Built specifically for Franklin, Tennessee—not a national directory with a Franklin label.',
    productCount: 1,
    publicChoiceCount: 1,
    selfServiceRecurringPriceCount: 1,
    selfServiceOneTimePriceCount: 0,
    founding: FOUNDING,
    freePresence: {
      priceUsd:0,
      factualCorrectionsFree:true,
      publicProfileRemovalFree:true,
      membershipRequiredForProfileControl:false
    },
    choices: [
      {id:'ANNUAL',label:'Franklin Navigator Community Membership',priceUsd:35,autoRenew:true,termMonths:12,renewal:'ANNUAL_UNTIL_CANCELED'}
    ],
    historicalPlanRecognition: true,
    retiredPlansSelectableForNewSale: false,
    publicFoundingDiscountActive:false,
    publicCheckoutOpen: publicCheckoutOpen(),
    preCheckoutCta:'SEE MEMBERSHIP',
    postVerifiedCta:'CONTINUE TO SECURE CHECKOUT'
  };
}

module.exports = {COMMUNITY, PRICE_AUTHORITY, FOUNDING, plans, newSalePlans, getPlan, getPlanByStripePriceId, publicCheckoutOpen, publicCatalog};
