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
  assert.match(html,/\/assets\/franklin-assistant\.js\?v=assistant-021/);
  assert.doesNotMatch(html,/\/assets\/navigator-bot\.js/);
  assert.doesNotMatch(html,/\/assets\/franklin-assistant-v2\.js/);
}

const controller=fs.readFileSync('dist/assets/franklin-assistant.js','utf8');
assert.match(controller,/FRANKLIN-ASSISTANT2-0\.2\.1/);
assert.match(controller,/\/api\/v2\/answer/);
assert.match(controller,/franklinAssistantR1296='1'/);
assert.doesNotMatch(controller,/FranklinAssistantCore/);
assert.doesNotMatch(controller,/FranklinAssistantR12/);
assert.doesNotMatch(controller,/renderGuide|guideFor|profileHits|localStorage/);
assert.doesNotMatch(controller,/Franklin Assistant 2/);
assert.match(controller,/Clear \/ new question/);
assert.match(controller,/data-navigator-voice/);
assert.match(controller,/Attach a document, screenshot or photo/);
assert.match(controller,/attachment_on_device/);
assert.match(controller,/answerLines/);
assert.match(controller,/franklin-assistant-answer-list/);
assert.doesNotMatch(controller,/window\.FranklinAssistant2/);

const loader=fs.readFileSync('dist/assets/hf36.js','utf8');
assert.doesNotMatch(loader,/\n\s*loadAssistantR1318\(\);/);

console.log(JSON.stringify({ok:true,pages:pages.length,assistantInternal:'FRANKLIN-ASSISTANT2-0.2.1'}));
