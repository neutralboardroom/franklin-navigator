import fs from 'node:fs';

const file = new URL('../server.js', import.meta.url);
const source = fs.readFileSync(file, 'utf8');
const from = "params.set('cancel_url',PUBLIC_ORIGIN+'/membership-enrollment/?checkout=canceled');";
const to = "params.set('cancel_url',PUBLIC_ORIGIN+'/membership-enroll/?checkout=canceled');";

const matches = source.split(from).length - 1;
if (matches === 1) {
  fs.writeFileSync(file, source.replace(from, to));
  console.log(JSON.stringify({event:'SCC_RUNTIME_ROUTE_GUARD_APPLIED',route:'/membership-enroll/'}));
} else if (source.includes(to) && matches === 0) {
  console.log(JSON.stringify({event:'SCC_RUNTIME_ROUTE_GUARD_ALREADY_APPLIED',route:'/membership-enroll/'}));
} else {
  throw new Error(`scc_runtime_route_guard_unexpected_match_count:${matches}`);
}
