'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const data=JSON.parse(read('dist/data/r1367-currentness.json'));
assert.equal(data.release,'FR-NAV1.30.67-HF3.13.49');
assert.equal(data.checkedDate,'2026-10-05');
assert.ok(data.items.length>=5);
for(const item of data.items){assert.match(item.sourceUrl,/^https:\/\//);assert.ok(item.title.en&&item.title.es);assert.ok(item.summary.en&&item.summary.es);assert.doesNotMatch(JSON.stringify(item),/FR-OBS|FR-CLM|FR-SRC|LOCAL_INVESTIGATOR|SCC_INTERNAL/i);assert.notEqual(item.title.en.trim().toLowerCase(),'test');assert.notEqual(item.title.es.trim().toLowerCase(),'test');}
const js=read('dist/assets/r1367-currentness.js'),r24=read('dist/assets/r24.js');
assert.match(r24,/r1367-currentness\.js/);
assert.match(js,/placeholderFirewall/);assert.match(js,/title==='test'/);assert.match(js,/test-only body/);assert.match(js,/fetch\(DATA,\{cache:'no-store'\}\)/);
assert.match(js,/Currentness checked October 5, 2026/);assert.match(js,/Actualidad revisada el 5 de octubre de 2026/);
for(const p of ['dist/index.html','dist/today/index.html','dist/es/index.html','dist/es/hoy/index.html']){const html=read(p);assert.doesNotMatch(html,/>\s*TEST\s*</i);assert.doesNotMatch(html,/test-only body/i);}
assert.ok(data.items.some(x=>/early voting/i.test(x.title.en)));assert.ok(data.items.some(x=>/Election Day/i.test(x.title.en)));assert.ok(data.items.some(x=>/Fall Break/i.test(x.title.en)));
console.log('PASS R1367 public currentness and placeholder firewall');
