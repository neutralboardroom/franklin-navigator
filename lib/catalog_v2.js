'use strict';

const VERTICALS = Object.freeze([
  'restaurants',
  'retail',
  'beauty_fitness',
  'pet',
  'education',
  'home_services',
  'professional_services',
  'hospitality',
  'senior_services',
  'auto',
  'real_estate',
  'accounting_tax',
  'legal',
  'health',
]);
const TIERS = Object.freeze(['individual', 'team', 'office']);
const INTERVALS = Object.freeze(['monthly', 'annual']);
const ENTERPRISE = 'quote_only';
const PRICE_AUTHORITY = 'LOCAL_MEMBERSHIP_PRICE_AUTHORITY_2026_08_27_V2';
const FOUNDING = Object.freeze({
  code: 'FOUNDING30',
  couponId: 'FRANKLIN_FOUNDING_30_2026',
  percentOff: 30,
  duration: 'FIRST_12_MONTHS',
  enrollmentDeadlineLocal: '2026-12-31T23:59:59-06:00',
  postDiscountRenewal: 'REGULAR_V2_PRICE_UNLESS_CANCELED',
});

const lookupKey = (vertical, tier, interval) =>
  `franklin_${vertical}_${tier}_${interval}_v2`;

const LOOKUP_KEYS = Object.freeze(
  VERTICALS.flatMap((vertical) =>
    TIERS.flatMap((tier) => INTERVALS.map((interval) => lookupKey(vertical, tier, interval))),
  ),
);
const LOOKUP_SET = new Set(LOOKUP_KEYS);

function parseLookupKey(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!LOOKUP_SET.has(raw)) return null;
  const match = raw.match(/^franklin_(.+)_(individual|team|office)_(monthly|annual)_v2$/);
  if (!match) return null;
  const [, vertical, tier, interval] = match;
  if (!VERTICALS.includes(vertical)) return null;
  return { lookupKey: raw, vertical, tier, interval };
}

function publicCatalog() {
  return {
    community: 'FRANKLIN_TN',
    priceAuthority: PRICE_AUTHORITY,
    products: VERTICALS.length,
    selfServiceRecurringPrices: LOOKUP_KEYS.length,
    verticals: [...VERTICALS],
    tiers: [...TIERS],
    intervals: [...INTERVALS],
    enterprise: ENTERPRISE,
    annualValue: '12 months for the price of 10 — 2 months free',
    monthlyAutoRenew: true,
    annualAutoRenew: true,
    foundingOffer: { ...FOUNDING },
    noPayToRank: true,
    noGuaranteedResults: true,
    freeProfileCorrectionsIndependent: true,
  };
}

module.exports = {
  VERTICALS,
  TIERS,
  INTERVALS,
  ENTERPRISE,
  PRICE_AUTHORITY,
  FOUNDING,
  LOOKUP_KEYS,
  lookupKey,
  parseLookupKey,
  publicCatalog,
};
