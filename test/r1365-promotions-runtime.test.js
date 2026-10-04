'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {OVERLAY_RELEASE,VERSION,validatePromotionInput,promotionIsCurrent,normalizeKind,normalizeMediaKind}=require('../promotions-proxy');

test('R1365 overlay has explicit release/version identity',()=>{
  assert.equal(OVERLAY_RELEASE,'FR-NAV1.30.65-HF3.13.47');
  assert.equal(VERSION,'FRANKLIN_MEMBER_PROMOTIONS_R1365_1');
});

test('promotion kinds are closed-world',()=>{
  for(const kind of ['COUPON','SPECIAL','SALE','PROMOTION','EVENT'])assert.equal(normalizeKind(kind),kind);
  assert.throws(()=>normalizeKind('ad'),/PROMOTION_KIND_INVALID/);
});

test('promotion media kinds exclude unsafe/unimplemented PDFs',()=>{
  for(const kind of ['COUPON_GRAPHIC','SALE_GRAPHIC','PROMOTIONAL_GRAPHIC','PROMOTIONAL_FLYER','EVENT_FLYER'])assert.equal(normalizeMediaKind(kind),kind);
  assert.throws(()=>normalizeMediaKind('PDF'),/PROMOTION_MEDIA_KIND_INVALID/);
});

test('event requires a valid start and end must follow start',()=>{
  assert.throws(()=>validatePromotionInput({kind:'EVENT',title:'Open house',description:'Join us for a community open house.'}),/EVENT_START_REQUIRED/);
  assert.throws(()=>validatePromotionInput({kind:'SALE',title:'Sale',description:'A real limited time sale for local residents.',startAt:'2026-10-10T10:00:00Z',endAt:'2026-10-09T10:00:00Z'}),/PROMOTION_DATE_ORDER_INVALID/);
});

test('public currentness hides future and expired items',()=>{
  const now=Date.parse('2026-10-04T12:00:00Z');
  assert.equal(promotionIsCurrent({state:'PUBLISHED',start_at:'2026-10-04T11:00:00Z',end_at:'2026-10-04T13:00:00Z'},now),true);
  assert.equal(promotionIsCurrent({state:'PUBLISHED',start_at:'2026-10-05T11:00:00Z',end_at:null},now),false);
  assert.equal(promotionIsCurrent({state:'PUBLISHED',start_at:null,end_at:'2026-10-04T11:00:00Z'},now),false);
  assert.equal(promotionIsCurrent({state:'UNPUBLISHED',start_at:null,end_at:null},now),false);
});

test('free-profile boundary is not represented as a paid promotion capability',()=>{
  const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','promotions-proxy.js'),'utf8');
  assert.match(source,/ACTIVE_MEMBERSHIP_REQUIRED/);
  assert.match(source,/PROFILE_VERIFICATION_REQUIRED/);
  assert.doesNotMatch(source,/basic profile.*paid/i);
});
