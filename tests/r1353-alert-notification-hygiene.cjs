'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const owner=fs.readFileSync('dist/assets/franklin-owner-issues-r1308.js','utf8');
const page=fs.readFileSync('dist/owner-issues/index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/hf32-site-cleanup.yml','utf8');

for(const field of ['fingerprint_sha256','affected_path','http_method','failure_cause','component','release_identity','last_notification_kind','reopened_at','resolved_at']){
  assert.ok(owner.includes(field),'owner console missing '+field);
}
assert.ok(page.includes('data-summary-policy'),'owner console missing notification policy summary');
assert.ok(owner.includes('alertCooldownMinutes'),'owner console missing cooldown policy');
assert.ok(workflow.includes('concurrency:'),'broad qualifier missing concurrency');
assert.ok(workflow.includes('cancel-in-progress: true'),'broad qualifier must cancel superseded runs');
assert.ok(workflow.includes('pull_request:'),'final PR qualification remains enabled');
assert.ok(workflow.includes('push:'),'post-merge main qualification remains enabled');
assert.ok(!workflow.includes('continue-on-error: true'),'final qualification failures must not be hidden');
console.log(JSON.stringify({result:'PASS',release:'FR-NAV1.30.53-HF3.13.35',ownerLifecycleVisible:true,ciCancellation:true,finalFailuresVisible:true}));
