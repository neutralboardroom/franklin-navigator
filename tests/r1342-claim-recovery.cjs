'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../dist/assets/local-discovery-core.js');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const SELF='FR-ORG-b00c0ace7943973c';

const manifest=json('dist/data/discovery/manifest.json');
const indexPath='dist/'+manifest.index.file.replace(/^\//,'').replace(/^data\//,'data/');
const raw=json(indexPath);
const overlay=json('dist/data/discovery/r1329-franklin-navigator-profile.json');
const rows=C.decodeIndex(raw).concat(C.decodeIndex({...overlay,schemaVersion:'franklin.discovery-index.v1',rows:overlay.records,recordCount:overlay.records.length}));
const exact=C.matchRows(rows,{q:'franklin navigator',sort:'local'});
assert.ok(exact.length>0,'exact-name query returned no profiles');
assert.equal(exact[0].i,SELF,'Franklin Navigator exact-name profile must rank first');
const elite=exact.findIndex(r=>/elite navigator co/i.test(r.n));
if(elite>=0)assert.ok(elite>0,'Elite Navigator Co. must not outrank exact Franklin Navigator');

const profile=read('dist/assets/r1330-profile.js');
assert.match(profile,/Manage this profile — free/);
assert.match(profile,/Correct factual listing details/);
assert.match(profile,/Official Franklin Navigator profile/);
assert.match(profile,/\/profile-access\/\?profile=/);

const claim=read('dist/assets/hf310.js');
assert.match(claim,/Continue with this profile/);
assert.match(claim,/r1342-selected-focus/);
assert.match(claim,/listing=.*PUBLIC_REMOVAL|PUBLIC_REMOVAL.*listing=/s);

const account=read('dist/assets/membership-live.js');
assert.match(account,/Forgot password\?/);
assert.match(account,/ACCOUNT_ALREADY_EXISTS/);
assert.match(account,/account-recovery/);
assert.match(account,/Email address/);
assert.match(account,/Can’t access your email\? Get account help/);

const recovery=read('dist/assets/account-recovery-r1342.js');
assert.match(recovery,/password-reset\/request/);
assert.match(recovery,/password-reset\/complete/);
assert.match(recovery,/Continue to profile access/);
assert.match(recovery,/Return to reviewer sign in/);
assert.match(recovery,/r1355-password-toggle/);
assert.match(recovery,/history\.replaceState/);
assert.ok(fs.existsSync(path.join(root,'dist/account-recovery/index.html')));

const support=read('dist/member-support/index.html');
assert.match(support,/Community Membership for new memberships/);
assert.doesNotMatch(support,/<strong>Current membership<\/strong>/);
assert.match(support,/Forgotten passwords should use the self-service password reset/);

const business=read('dist/business-dashboard/index.html');
for(const n of ['1','2','3','4','5']) assert.ok(business.includes('<strong>'+n+'</strong>'));
assert.match(business,/Claim profile \/ verify authority/);
assert.match(business,/Preview optional Community Membership/);

const correction=read('dist/assets/hf35-profile-control.js');
assert.match(correction,/FR-ORG-b00c0ace7943973c/);
assert.match(correction,/form\.elements\.url\.value=profilePage/);

const reviews=read('dist/assets/r1332-profile.js');
assert.match(reviews,/SELF_ID='FR-ORG-b00c0ace7943973c'/);
assert.match(reviews,/reviewable=id!==SELF_ID/);
assert.match(reviews,/entityLabel/);

console.log(JSON.stringify({
  result:'PASS',
  release:'FR-NAV1.30.57-HF3.13.39',
  exactFranklinNavigatorRank:firstName(exact[0]),
  exactProfileId:exact[0].i,
  checked:'directory ranking, claim CTA, deep-link continuity, recovery UI, support wording, five-step business path, correction context, first-party review policy'
}));
function firstName(row){return row&&row.n||''}
