'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {VERSION,_test}=require('../lib/reviews');

test('review safety policy holds private/contact/serious-allegation content',()=>{
  assert.equal(VERSION,'FRANKLIN_COMMUNITY_REVIEWS_1');
  assert.equal(_test.holdReason('','Great service and friendly staff'),'');
  assert.equal(_test.holdReason('','Email me at person@example.com'),'CONTACT_OR_EXTERNAL_LINK_REVIEW');
  assert.equal(_test.holdReason('','Call me at 615-555-1212'),'PHONE_NUMBER_REVIEW');
  assert.equal(_test.holdReason('','My account number was posted'),'PRIVATE_INFORMATION_REVIEW');
  assert.equal(_test.holdReason('','This company committed fraud'),'SERIOUS_ALLEGATION_REVIEW');
  assert.equal(_test.responseUnsafe('Thanks for the feedback.'),false);
  assert.equal(_test.responseUnsafe('Contact patient@example.com'),true);
});

test('review public name minimizes identity exposure',()=>{
  assert.equal(_test.publicName({display_name:'Jane Q Public'}),'Jane P.');
  assert.equal(_test.publicName({display_name:'Roger'}),'Roger');
});

test('review schema enforces bounded ratings, moderation states and one review per account/profile',()=>{
  const sql=fs.readFileSync('schema/007_reviews.sql','utf8');
  assert.match(sql,/rating smallint not null check\(rating between 1 and 5\)/);
  assert.match(sql,/unique\(account_id,profile_id\)/);
  for(const state of ['PUBLISHED','PENDING','REJECTED','REMOVED','DISPUTED']) assert.ok(sql.includes("'"+state+"'"));
  assert.ok(sql.includes('franklin_review_reports'));
  assert.ok(sql.includes('franklin_review_history'));
});

test('sponsored feed requires active verified paid rich-profile eligibility and stays non-ranking',()=>{
  const src=fs.readFileSync('lib/member-fulfillment.js','utf8');
  assert.ok(src.includes('/api/member/sponsored-profiles'));
  assert.ok(src.includes("l.authority_state='VERIFIED'"));
  assert.ok(src.includes("m.status in ('ACTIVE','ACTIVE_CANCELING','GRACE')"));
  assert.ok(src.includes("e.access_state='ACTIVE' and e.rich_profile=true"));
  assert.ok(src.includes("paidPlacement:true,rankingClaim:false"));
  assert.ok(src.includes("excludeProfileId"));
  assert.ok(src.includes("category"));
});
