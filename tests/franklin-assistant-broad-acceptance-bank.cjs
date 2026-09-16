'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');

const bank=JSON.parse(fs.readFileSync('tests/franklin-assistant-broad-acceptance-bank.json','utf8'));
assert.equal(bank.total,100);
assert.equal(bank.cases.length,100);

const ids=new Set();
const categories=new Map();
for(const row of bank.cases){
  assert.match(row.id,/^[A-Z]+-\d{2}$/);
  assert.ok(row.question&&row.question.length>=6);
  assert.ok(row.expected&&row.expected.length>=6);
  assert.ok(!ids.has(row.id),'duplicate id '+row.id);
  ids.add(row.id);
  categories.set(row.category,(categories.get(row.category)||0)+1);
}

for(const required of [
  'utilities','sanitation','permits','schools','parks','events','transit',
  'health','legal','housing','business','pets','auto','jobs','senior',
  'civic','safety','community','followup','spanish'
]){
  assert.ok(categories.has(required),'missing category '+required);
}

assert.ok(bank.cases.some(x=>x.expected==='fresh_current'));
assert.ok(bank.cases.some(x=>x.expected==='directory_handoff'));
assert.ok(bank.cases.some(x=>x.expected==='needs_specific_detail'));
assert.ok(bank.cases.some(x=>x.expected==='emergency_first'));
assert.ok(bank.cases.some(x=>x.expected==='context_followup'));
assert.ok(bank.cases.some(x=>x.category==='spanish'));

console.log(JSON.stringify({
  ok:true,
  total:bank.total,
  categories:Object.fromEntries([...categories.entries()].sort())
}));
