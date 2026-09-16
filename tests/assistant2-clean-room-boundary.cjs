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
  assert.match(html,/\/assets\/franklin-assistant\\.js\\?v=assistant-020/);
  assert.doesNotMatch(html,/\/assets\/navigator-bot\.js/);
}

const controller=fs.readFileSync('dist/assets/franklin-assistant.js','utf8');
assert.match(controller,/FRANKLIN-ASSISTANT2-0\.1\.0/);
assert.match(controller,/\/api\/v2\/answer/);
assert.match(controller,/franklinAssistantR1296='1'/);
assert.doesNotMatch(controller,/FranklinAssistantCore/);
assert.doesNotMatch(controller,/FranklinAssistantR12/);
assert.doesNotMatch(controller,/renderGuide|guideFor|profileHits|localStorage/);

const loader=fs.readFileSync('dist/assets/hf36.js','utf8');
assert.doesNotMatch(loader,/\n\s*loadAssistantR1318\(\);/);

assert.doesNotMatch(controller,/Franklin Assistant 2/);\nassert.match(controller,/Clear \/ new question/);\nassert.match(controller,/data-navigator-voice/);\nassert.match(controller,/Attach a document, screenshot or photo/);\nconsole.log(JSON.stringify({ok:true,pages:pages.length,assistantInternal:'FRANKLIN-ASSISTANT2-0.2.0'}));
