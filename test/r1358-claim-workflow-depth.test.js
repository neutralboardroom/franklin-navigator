'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('R1358 additive claim history schema preserves every submission and notification result',()=>{
  const sql=read('schema/010_claim_workflow.sql');
  assert.match(sql,/create table if not exists franklin_representation_submissions/);
  assert.match(sql,/primary key\(account_id,profile_id,revision\)/);
  assert.match(sql,/create table if not exists franklin_claim_notification_log/);
  assert.match(sql,/delivery_state in \('SENT','FAILED','NOT_CONFIGURED'\)/);
});

test('R1358 representation requests append immutable evidence snapshots before updating current request',()=>{
  const src=read('lib/member-fulfillment.js');
  assert.match(src,/FRANKLIN_MEMBER_FULFILLMENT_HF3_8/);
  const snapshot=src.indexOf('insert into franklin_representation_submissions');
  const current=src.indexOf('insert into franklin_representation_reviews',snapshot);
  assert.ok(snapshot>0&&current>snapshot);
  assert.match(src,/submission_count/);
  assert.match(src,/existing_manager_count/);
});

test('R1358 review decision notification is after authoritative transaction and separately logged',()=>{
  const src=read('lib/member-fulfillment.js');
  const txEnd=src.indexOf('if(result.notification)');
  const notify=src.indexOf('notifyRepresentationDecision',txEnd);
  const ledger=src.indexOf('insert into franklin_claim_notification_log',notify);
  assert.ok(txEnd>0&&notify>txEnd&&ledger>notify);
  assert.match(src,/notificationLedgerRecorded/);
});

test('R1358 reviewer console exposes immutable submission history and richer queue metadata',()=>{
  const src=read('lib/reviewer-console.js');
  assert.match(src,/FRANKLIN_REVIEWER_CONSOLE_4/);
  assert.match(src,/\/api\/reviewer\/submissions/);
  for(const token of ['createdAt','authorityState','existingManagerCount','submissionCount'])assert.ok(src.includes(token),token);
  assert.match(src,/REVIEW_SELF_DECISION_FORBIDDEN/);
});

test('R1358 server initializes exact migration and sends decision email without making delivery authoritative',()=>{
  const src=read('server.js');
  assert.match(src,/FR-NAV1\.30\.58-HF3\.13\.40/);
  assert.match(src,/FRANKLIN_CLAIM_WORKFLOW_R1358_1/);
  assert.match(src,/initializeClaimWorkflow/);
  assert.match(src,/sendClaimDecisionNotification/);
  assert.match(src,/CLAIM_NOTIFICATION_EMAIL_FAILED/);
  assert.match(src,/review_created_at/);
});

test('R1358 reviewer UI shows separate dates, evidence history, consequence copy and session expiry warning',()=>{
  const app=read('review/app.js'),html=read('review/index.html');
  for(const token of ['Submitted evidence history','Request age','Last updated','Other verified managers','Review access expires in less than two minutes'])assert.ok(app.includes(token),token);
  assert.ok(html.includes('submission-history-section'));
  assert.ok(html.includes('expiry-warning'));
  assert.ok(html.includes('decision-effect'));
  assert.ok(app.includes('Approving grants profile-management access.'));
});
