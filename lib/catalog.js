'use strict';

const COMMUNITY = 'FRANKLIN_TN';
const PRICE_AUTHORITY = 'LOCAL_MEMBERSHIP_PRICE_AUTHORITY_2026_08_27_V2';
const FOUNDING = Object.freeze({
  promotionCode: 'FOUNDING30',
  couponId: 'FRANKLIN_FOUNDING_30_2026',
  percentOff: 30,
  duration: 'FIRST_12_MONTHS',
  enrollmentDeadlineLocal: '2026-12-31T23:59:59-06:00',
  renewal: 'REGULAR_CURRENT_PRICE_UNLESS_CANCELED'
});

const VALUES = Object.freeze({
  ACCOUNTING_TAX: ['Accounting & Tax', 19, 39, 69, 149],
  AUTO: ['Auto', 15, 35, 59, 129],
  BEAUTY_FITNESS: ['Beauty & Fitness', 10, 25, 45, 99],
  EDUCATION: ['Education', 10, 25, 45, 99],
  HEALTH: ['Health', 19, 49, 79, 169],
  HOME_SERVICES: ['Home Services', 15, 35, 59, 129],
  HOSPITALITY: ['Hospitality', 15, 35, 59, 129],
  LEGAL: ['Legal', 19, 49, 79, 169],
  PET: ['Pet Services', 10, 25, 45, 99],
  PROFESSIONAL_SERVICES: ['Professional Services', 15, 35, 59, 129],
  REAL_ESTATE: ['Real Estate', 19, 39, 69, 149],
  RESTAURANTS: ['Restaurants', 10, 25, 45, 99],
  RETAIL: ['Retail', 10, 25, 45, 99],
  SENIOR_SERVICES: ['Senior Services', 15, 35, 59, 129]
});
const TIERS = ['INDIVIDUAL', 'TEAM', 'OFFICE'];
const INTERVALS = ['MONTHLY', 'ANNUAL'];
const slug = value => value.toLowerCase();

const plans = [];
for (const [vertical, [label, individual, team, office, enterprise]] of Object.entries(VALUES)) {
  const monthly = {INDIVIDUAL: individual, TEAM: team, OFFICE: office};
  for (const tier of TIERS) {
    for (const interval of INTERVALS) {
      const monthlyUsd = monthly[tier];
      const regularUsd = interval === 'ANNUAL' ? monthlyUsd * 10 : monthlyUsd;
      const lookupKey = `franklin_${slug(vertical)}_${slug(tier)}_${interval === 'ANNUAL' ? 'annual' : 'monthly'}_v2`;
      plans.push(Object.freeze({
        vertical, verticalLabel: label, tier, interval, lookupKey,
        regularUsd,
        foundingUsd: Number((regularUsd * 0.7).toFixed(2)),
        autoRenew: true,
        annualTwoMonthsFree: interval === 'ANNUAL'
      }));
    }
  }
  VALUES[vertical].enterprise = enterprise;
}
const planMap = new Map(plans.map(plan => [plan.lookupKey, plan]));

function getPlan(lookupKey) { return planMap.get(String(lookupKey || '').trim()) || null; }
function publicCatalog() {
  return {
    community: COMMUNITY,
    priceAuthority: PRICE_AUTHORITY,
    productCount: Object.keys(VALUES).length,
    selfServiceRecurringPriceCount: plans.length,
    founding: FOUNDING,
    verticals: Object.entries(VALUES).map(([id, values]) => ({
      id,
      label: values[0],
      plans: plans.filter(plan => plan.vertical === id),
      enterprise: {quoteOnly: true, startingMonthlyUsd: values[4], startingAnnualUsd: values[4] * 10}
    }))
  };
}

module.exports = {COMMUNITY, PRICE_AUTHORITY, FOUNDING, TIERS, INTERVALS, plans, getPlan, publicCatalog};
