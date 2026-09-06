import fs from 'node:fs';

const file = new URL('../server.js', import.meta.url);
const source = fs.readFileSync(file, 'utf8');
const from = "params.set('cancel_url',PUBLIC_ORIGIN+'/membership-enrollment/?checkout=canceled');";
const to = "params.set('cancel_url',PUBLIC_ORIGIN+'/membership-enroll/?checkout=canceled');";
const frozen = "params.set('cancel_url',publicOrigin+'/membership-enroll/?checkout=canceled');";
const count = token => source.split(token).length - 1;
const matches = count(from);
const cancelAssignments = (source.match(/params\.set\('cancel_url',/g) || []).length;

if (cancelAssignments !== 1) {
  throw new Error('checkout_cancel_route_assignment_count_invalid');
}
if (matches === 1 && count(to) === 0 && count(frozen) === 0) {
  fs.writeFileSync(file, source.replace(from, to));
  console.log(JSON.stringify({event:'SCC_RUNTIME_ROUTE_GUARD_APPLIED',route:'/membership-enroll/'}));
} else if (count(to) === 1 && matches === 0 && count(frozen) === 0) {
  console.log(JSON.stringify({event:'SCC_RUNTIME_ROUTE_GUARD_ALREADY_APPLIED',route:'/membership-enroll/'}));
} else if (count(frozen) === 1 && matches === 0 && count(to) === 0 &&
  source.includes("const CHECKOUT_SAFETY_VERSION='FRANKLIN_CHECKOUT_SAFETY_1';") &&
  source.includes('async function createStripeCheckoutSession({plan,intentId,email,profileId,stripeCustomerId=null,publicOrigin=PUBLIC_ORIGIN})') &&
  source.includes('await startSafePurchase(')) {
  // HF1 freezes the original approved origin in the durable purchase snapshot.
  // The corrected route is already part of the qualified source: do not rewrite it.
  console.log(JSON.stringify({event:'CHECKOUT_SAFETY_FROZEN_ORIGIN_ROUTE_VERIFIED',route:'/membership-enroll/'}));
} else {
  throw new Error(`scc_runtime_route_guard_unexpected_match_count:${matches}`);
}
