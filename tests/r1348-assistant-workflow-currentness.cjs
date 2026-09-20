'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const workflows=[
  '.github/workflows/r1315-assistant-browser.yml',
  '.github/workflows/r1316-assistant-browser.yml',
  '.github/workflows/r1317-assistant-conversation.yml',
  '.github/workflows/assistant2-clean-room.yml'
];
for(const p of workflows){
  const s=read(p);
  assert.doesNotMatch(s,/hf36\.js\?v=frnav131[567]/,p+' must not pin obsolete hf36 loader versions');
  assert.doesNotMatch(s,/franklin-assistant-(?:r1315|r1316|r1317)\.js\?v=frnav131[567]/,p+' must not require obsolete canonical wiring');
}
for(const p of workflows.slice(0,3)){
  assert.match(read(p),/tests\/assistant2-clean-room-boundary\.cjs/,p+' must validate the current canonical Assistant boundary');
}
const clean=read('tests/assistant2-clean-room-boundary.cjs');
assert.doesNotMatch(clean,/assistant-021/);
assert.match(clean,/assistant-\[0-9\]\+\|frnav\[0-9\]\+/);
const pages=['dist/index.html','dist/es/index.html','dist/assistant/index.html','dist/es/asistente/index.html'];
for(const p of pages)assert.match(read(p),/\/assets\/franklin-assistant\.js\?v=(?:assistant-[0-9]+|frnav[0-9]+)/);
console.log(JSON.stringify({result:'PASS',release:'FR-NAV1.30.48-HF3.13.30',workflows:workflows.length,pages:pages.length}));
