'use strict';
const fs=require('node:fs');
const assert=require('node:assert');
const files=['dist/business-dashboard/index.html','dist/membership-start/index.html','dist/member-profile-preview/index.html','dist/claim-profile/index.html'];
const pages=files.map(file=>[file,fs.readFileSync(file,'utf8')]);
for(const [file,html] of pages){
  assert.match(html,/FR-NAV1\.30\.(?:64-HF3\.13\.46|65-HF3\.13\.47|66-HF3\.13\.48)/);
  assert.match(html,/visibility in the Franklin community|visibility in Franklin|Franklin presence/i);
  assert.match(html,/\$35\/year/);
  assert.match(html,/free/i);
}
const combined=pages.map(([,html])=>html).join('\n');
for(const phrase of ['factual corrections','profile media','special offer']) assert.ok(combined.toLowerCase().includes(phrase),`missing ${phrase}`);
assert.ok(/booking|quote|order|menu/i.test(combined));
assert.ok(/Sponsored/i.test(combined));
assert.match(combined,/does not (?:buy|guarantee)|no guaranteed/i,'missing no-guarantee protection');
// Preserve the original fail-closed guarantees while allowing the qualified R1366 document successor.
if(/PDF/i.test(combined)){
  assert.match(combined,/reviewed PDF/i,'PDF capability must remain explicitly reviewed');
  assert.match(combined,/active, encrypted|encrypted or embedded-file PDFs are (?:not accepted|rejected)/i,'PDF capability must state a fail-closed safety boundary');
}
assert.doesNotMatch(combined,/(?:we |membership )guarantees? (?:search|ranking|exposure|traffic|leads|customers|sales|revenue|results)/i);
console.log('R1364/R1365/R1366 membership visibility qualification: PASS');
