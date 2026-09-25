'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('R1359 Assistant keeps reading position at submitted question',()=>{
  const src=read('dist/assets/franklin-assistant.js');
  assert.match(src,/positionAtQuestion/);
  assert.match(src,/finishTurn\(question,data,userTurn\)/);
  assert.match(src,/scrollMarginTop='96px'/);
  assert.doesNotMatch(src,/turn\.scrollIntoView\(\{block:'nearest',behavior:'smooth'\}\)/);
});

test('R1359 correction flow uses in-product review rather than native confirmation',()=>{
  const src=read('dist/assets/hf35-profile-control.js');
  assert.match(src,/Review your correction/);
  assert.match(src,/Confirm this removal request/);
  assert.match(src,/showReview\(fd,removal\)/);
  assert.doesNotMatch(src,/window\.confirm\(confirmation\)/);
});

test('R1360 keeps reviewer authority out of the ordinary claimant path',()=>{
  const src=read('dist/assets/membership-live.js');
  assert.doesNotMatch(src,/Open secure reviewer workspace/);
  assert.doesNotMatch(src,/reviewerAccessAvailable/);
  assert.match(src,/Start management verification/);
  assert.match(src,/Selecting a profile does not grant management control/);
});

test('R1359 Profile Center exposes verified-manager direct maintenance',()=>{
  const src=read('dist/assets/member-profile-live.js');
  assert.match(src,/Publish verified manager updates/);
  assert.match(src,/\/api\/member\/manager-profile\/save/);
  assert.match(src,/Community Membership is not required for these basic manager updates/);
});

test('R1359 public profile labels manager-provided information separately',()=>{
  const src=read('dist/assets/hf35-member-public.js');
  assert.match(src,/VERIFIED_MANAGER_DIRECT/);
  assert.match(src,/Verified manager update/);
  assert.match(src,/Independently sourced, identity-critical and regulated facts/);
});
