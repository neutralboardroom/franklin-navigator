import fs from 'node:fs';

const file = new URL('../server.js', import.meta.url);
const source = fs.readFileSync(file, 'utf8');
const from = "params.set('cancel_url',PUBLIC_ORIGIN+'/membership-enrollment/?checkout=canceled');";
const to = "params.set('cancel_url',PUBLIC_ORIGIN+'/membership-enroll/?checkout=canceled');";
const snapshotTo = "params.set('cancel_url',publicOrigin+'/membership-enroll/?checkout=canceled');";
const count = value => source.split(value).length - 1;
const matches = count(from);
const snapshotSafe = count(snapshotTo) === 1 && count(to) === 0 && matches === 0 &&
  source.includes("CHECKOUT_SAFETY_VERSION='FRANKLIN_CHECKOUT_SAFETY_1'") &&
  source.includes('publicOrigin=PUBLIC_ORIGIN}') && source.includes('await startSafePurchase(');
if (matches === 1 && count(to) === 0 && count(snapshotTo) === 0) {
  fs.writeFileSync(file, source.replace(from, to));
  console.log(JSON.stringify({event:'SCC_RUNTIME_ROUTE_GUARD_APPLIED',route:'/membership-enroll/'}));
} else if ((count(to) === 1 && matches === 0 && count(snapshotTo) === 0) || snapshotSafe) {
  console.log(JSON.stringify({event:'SCC_RUNTIME_ROUTE_GUARD_ALREADY_APPLIED',route:'/membership-enroll/',immutablePurchaseSnapshot:snapshotSafe}));
} else {
  throw new Error(`scc_runtime_route_guard_unexpected_match_count:${matches}`);
}
