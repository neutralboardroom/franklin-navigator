'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const member=fs.readFileSync('lib/member-fulfillment.js','utf8');
const reviewer=fs.readFileSync('lib/reviewer-console.js','utf8');
const server=fs.readFileSync('server.js','utf8');
const app=fs.readFileSync('review/app.js','utf8');
const html=fs.readFileSync('review/index.html','utf8');

test('private reviewer queue exposes bounded operational context',()=>{
  assert.ok(member.includes('pending_count'));
  assert.ok(member.includes('requester_email'));
  assert.ok(reviewer.includes('pendingCount:Number(payload.pendingCount||0)'));
  assert.ok(reviewer.includes('requesterEmail:r.requester_email'));
  assert.ok(app.includes("queueCount:'Profile access requests: {count} pending.'"));
  assert.ok(app.includes("publicProfile:'Open public profile'"));
  assert.ok(app.includes("if(selected.requesterEmail)paragraph(root,'requester',selected.requesterEmail)"));
  assert.ok(app.includes("paragraph(root,'requestState'"));
  assert.ok(app.includes("paragraph(root,'submitted'"));
  assert.ok(html.includes('id="queue-count"'));
});

test('reviewer discoverability remains authorization-bound and private',()=>{
  assert.ok(reviewer.includes('reviewerAccessForAccount:accountId=>Boolean(configured&&bindings.has'));
  assert.ok(server.includes('reviewerAccessAvailable:reviewerConsole.reviewerAccessForAccount(session.account_id)'));
  assert.ok(!server.includes("reviewerAccessAvailable:true"));
});

test('existing decision security and audit semantics remain intact',()=>{
  assert.ok(app.includes("['VERIFIED','CHANGES_REQUESTED','REJECTED']"));
  assert.ok(app.includes('window.confirm(confirmText)'));
  assert.ok(member.includes("['VERIFIED','CHANGES_REQUESTED','REJECTED','REVOKED']"));
  assert.ok(member.includes('checkRevision(row,b.expectedRevision)'));
  assert.ok(member.includes('franklin_member_review_history'));
  assert.ok(reviewer.includes('REVIEW_EVIDENCE_REQUIRED'));
  assert.ok(reviewer.includes("const TTL_MS = 10 * 60 * 1000"));
});
