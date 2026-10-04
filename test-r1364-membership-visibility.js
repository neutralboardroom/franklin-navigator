'use strict';
const fs=require('node:fs');
const assert=require('node:assert');
const files=['dist/business-dashboard/index.html','dist/membership-start/index.html','dist/member-profile-preview/index.html','dist/claim-profile/index.html'];
const pages=files.map(file=>[file,fs.readFileSync(file,'utf8')]);
for(const [file,html] of pages){
  assert.match(html,/FR-NAV1\.30\.64-HF3\.13\.46/);
  assert.match(html,/visibility in the Franklin community|visibility in Franklin|Franklin presence/i);
  assert.match(html,/\$35\/year/);
  assert.match(html,/free/i);
  assert.doesNotMatch(html,/guarantee(?:d)? (?:leads|customers|sales|revenue|results)/i);
}
const combined=pages.map(([,html])=>html).join('\n');
for(const phrase of ['factual corrections','profile media','special offer']) assert.ok(combined.toLowerCase().includes(phrase),`missing ${phrase}`);
assert.ok(/booking|quote|order|menu/i.test(combined));
assert.ok(/Sponsored/i.test(combined));
assert.doesNotMatch(combined,/members can upload (?:promotional )?flyers/i);
assert.doesNotMatch(combined,/members can upload pdf/i);
assert.doesNotMatch(combined,/guaranteed (?:search|ranking|exposure|traffic)/i);
console.log('R1364 membership visibility qualification: PASS');
