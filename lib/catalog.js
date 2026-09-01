'use strict';

const COMMUNITY = 'FRANKLIN_TN';
const PRICE_AUTHORITY = 'FRANKLIN_COMMUNITY_MEMBERSHIP_PRICE_AUTHORITY_V4_2026_08_31';
const FOUNDING = Object.freeze({
  promotionCode: 'FOUNDING30',
  couponId: 'FRANKLIN_FOUNDING_30_2026',
  percentOff: 30,
  durationMonths: 12,
  enrollmentDeadlineLocal: '2026-12-31T23:59:59-06:00',
  appliesTo: Object.freeze(['monthly','annual']),
  renewal: 'REGULAR_CURRENT_PRICE_UNLESS_CANCELED'
});

const plans = Object.freeze([
  Object.freeze({
    id:'monthly', label:'Monthly Community Membership',
    lookupKey:'franklin_community_member_monthly_v4',
    billingMode:'subscription', interval:'MONTHLY',
    regularUsd:5, foundingUsd:3.5, couponEligible:true,
    autoRenew:true, termMonths:1, publicChoice:'MONTHLY'
  }),
  Object.freeze({
    id:'annual', label:'Annual Community Membership',
    lookupKey:'franklin_community_member_annual_v4',
    billingMode:'subscription', interval:'ANNUAL',
    regularUsd:50, foundingUsd:35, couponEligible:true,
    autoRenew:true, termMonths:12, publicChoice:'ANNUAL', recommended:true
  }),
  Object.freeze({
    id:'threeYearRegular', label:'Three-Year Community Membership',
    lookupKey:'franklin_community_member_3year_regular_v4',
    billingMode:'payment', interval:'ONE_TIME',
    regularUsd:135, foundingUsd:null, couponEligible:false,
    autoRenew:false, termMonths:36, publicChoice:'THREE_YEAR', foundingOnly:false
  }),
  Object.freeze({
    id:'threeYearFounding', label:'Founding Three-Year Community Membership',
    lookupKey:'franklin_community_member_3year_founding_v4',
    billingMode:'payment', interval:'ONE_TIME',
    regularUsd:120, foundingUsd:120, couponEligible:false,
    autoRenew:false, termMonths:36, publicChoice:'THREE_YEAR', foundingOnly:true,
    nonStackable:true
  })
]);
const planMap = new Map(plans.map(plan => [plan.lookupKey, plan]));

function getPlan(lookupKey) {
  return planMap.get(String(lookupKey || '').trim()) || null;
}

function publicCatalog() {
  return {
    community: COMMUNITY,
    publicIdentity: 'Franklin Navigator Community Membership',
    localOnlyMessage: 'Built specifically for Franklin, Tennessee—not a national directory with a Franklin label.',
    priceAuthority: PRICE_AUTHORITY,
    productCount: 1,
    publicChoiceCount: 3,
    providerPriceCount: plans.length,
    selfServiceRecurringPriceCount: plans.filter(plan=>plan.billingMode==='subscription').length,
    selfServiceOneTimePriceCount: plans.filter(plan=>plan.billingMode==='payment').length,
    founding: FOUNDING,
    freePresence: {priceUsd:0,factualCorrectionsFree:true},
    choices: [
      {id:'MONTHLY',label:'Monthly',foundingUsd:3.5,regularUsd:5,autoRenew:true,renewal:'MONTHLY_UNTIL_CANCELED'},
      {id:'ANNUAL',label:'Annual',foundingUsd:35,regularUsd:50,autoRenew:true,recommended:true,renewal:'ANNUAL_UNTIL_CANCELED'},
      {id:'THREE_YEAR',label:'Three years',foundingUsd:120,regularUsd:135,autoRenew:false,termMonths:36,bestValue:true,foundingNonStackable:true}
    ],
    providerPlans: plans,
    enterprise: {quoteOnlyAddOn:true,baseMembership:false},
    legacy84PublicSuppressed: true,
    publicCheckoutOpen: false
  };
}

module.exports = {COMMUNITY, PRICE_AUTHORITY, FOUNDING, plans, getPlan, publicCatalog};
