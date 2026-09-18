'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const member=()=>fs.readFileSync('lib/member-fulfillment.js','utf8');

test('profile access requires explicit authority confirmation before evidence review',()=>{
  const src=member();
  assert.match(src,/authorityConfirmed!==true.*AUTHORITY_CONFIRMATION_REQUIRED/);
  assert.match(src,/evidenceUrl/);
  assert.match(src,/statement/);
  assert.match(src,/PROFILE_VERIFICATION_REQUIRED/);
});

test('profile management release is server-authorized and fails safe around active paid or published state',()=>{
  const src=member();
  assert.ok(src.includes('/api/member/representation/release'));
  assert.ok(src.includes('ACTIVE_MEMBERSHIP_REQUIRES_SUPPORT'));
  assert.ok(src.includes('PUBLISHED_MEMBER_CONTENT_REQUIRES_SUPPORT'));
  assert.ok(src.includes("delete from franklin_profile_links where account_id=$1 and profile_id=$2"));
  assert.ok(src.includes("set state='REVOKED'"));
  assert.match(src,/verified_at=null/);
  assert.ok(src.includes('REPRESENTATION_RELEASED'));
});

test('claim review status exposes current review timestamp without exposing private evidence',()=>{
  const src=member();
  assert.ok(src.includes('r.updated_at as review_updated_at'));
  const profilesQuery=src.match(/select l\.profile_id[\s\S]{0,900}?where l\.account_id=\$1 order by l\.profile_id/);
  assert.ok(profilesQuery);
  assert.ok(!profilesQuery[0].includes('evidence_url'));
  assert.ok(!profilesQuery[0].includes('statement'));
});

test('review revocation clears stale verified timestamp and protected edits remain entitlement gated',()=>{
  const src=member();
  assert.match(src,/verified_at=case when \$3='VERIFIED' then now\(\) else null end/);
  assert.ok(src.includes('const entitlement=await eligible(c,a,p)'));
  assert.ok(src.includes("l.authority_state='VERIFIED'"));
});

test('runtime release and member fulfillment version advance together',()=>{
  const src=member();
  const server=fs.readFileSync('server.js','utf8');
  assert.ok(src.includes("FRANKLIN_MEMBER_FULFILLMENT_HF3_4"));
  assert.ok(server.includes("FR-NAV1.30.38-HF3.13.20"));
});


test('one public profile cannot start a duplicate active Community Membership through another manager account',()=>{
  const server=fs.readFileSync('server.js','utf8');
  assert.ok(server.includes('PROFILE_MEMBERSHIP_ALREADY_ACTIVE'));
  assert.match(server,/m\.profile_id=\$1 and m\.account_id<>\$2/);
  assert.match(server,/l\.authority_state='VERIFIED'/);
  assert.match(server,/e\.rich_profile=true/);
});

test('profile management status includes verified-at timestamp for clear account UX',()=>{
  const src=member();
  assert.ok(src.includes('l.verified_at'));
});
