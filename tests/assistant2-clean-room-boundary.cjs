'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');

const pages=[
  'dist/index.html',
  'dist/es/index.html',
  'dist/assistant/index.html',
  'dist/es/asistente/index.html'
];

for(const path of pages){
  const html=fs.readFileSync(path,'utf8');
  assert.match(html,/\/assets\/franklin-assistant-v2\.js\?v=assistant2-010/);
  assert.doesNotMatch(html,/\/assets\/navigator-bot\.js/);
}

const controller=fs.readFileSync('dist/assets/franklin-assistant-v2.js','utf8');
assert.match(controller,/FRANKLIN-ASSISTANT2-0\.1\.0/);
assert.match(controller,/\/api\/v2\/answer/);
assert.match(controller,/franklinAssistantR1296='1'/);
assert.doesNotMatch(controller,/FranklinAssistantCore/);
assert.doesNotMatch(controller,/FranklinAssistantR12/);
assert.doesNotMatch(controller,/renderGuide|guideFor|profileHits|localStorage/);

const loader=fs.readFileSync('dist/assets/hf36.js','utf8');
assert.doesNotMatch(loader,/\n\s*loadAssistantR1318\(\);/);

console.log(JSON.stringify({ok:true,pages:pages.length,assistant2:'FRANKLIN-ASSISTANT2-0.1.0'}));
