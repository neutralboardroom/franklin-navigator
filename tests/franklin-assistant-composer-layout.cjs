'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');

const controller=fs.readFileSync('dist/assets/franklin-assistant.js','utf8');
assert.match(controller,/FRANKLIN-ASSISTANT2-0\.3\.4/);
assert.match(controller,/function activateConversationLayout/);
assert.match(controller,/function restoreStartingLayout/);
assert.match(controller,/output\.insertAdjacentElement\('afterend',form\)/);
assert.match(controller,/root\.insertBefore\(form,output\)/);
assert.match(controller,/franklin-assistant-followup-composer/);
assert.match(controller,/Ask a follow-up/);
assert.match(controller,/restoreStartingLayout\(\);/);

for(const path of [
  'dist/index.html',
  'dist/es/index.html',
  'dist/assistant/index.html',
  'dist/es/asistente/index.html'
]){
  const html=fs.readFileSync(path,'utf8');
  assert.match(html,/\/assets\/franklin-assistant\.js\?v=assistant-034/);
}

console.log(JSON.stringify({ok:true,layout:'conversation-then-composer',pages:4}));
