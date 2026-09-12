'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
global.window={};require('../dist/assets/franklin-assistant-core.js');require('../dist/assets/franklin-assistant-r1293-core.js');require('../dist/assets/franklin-assistant-r1294-core.js');
const C=window.FranklinAssistantCore,R=window.FranklinAssistantR1294Core;
const rec=[0,1,2,3].flatMap(i=>JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/data/assistant-routes-0'+i+'.json'),'utf8')).records);
function hits(q){const seen=new Set(),h=[];for(const p of R.preferredRoutes(q)){const r=rec.find(x=>x.l==='en'&&x.p===p);if(r&&!seen.has(p)){seen.add(p);h.push({rec:r,score:200})}}for(const x of C.rankRoutes(rec,q,'en',12))if(!seen.has(x.rec.p)){seen.add(x.rec.p);h.push(x)}return R.rerank(R.cleanRouteHits(h),q,6)}
const cases=[
['I need a permit for a fence','/permits-home/'],['Do I need a permit for a deck?','/permits-home/'],['Which school is my address zoned for?','/school-enrollment/'],['I just moved to Franklin and need to set up water and electricity','/new-to-franklin/'],['When is brush pickup?','/everyday-help/'],['Where can I play pickleball?','/sports/pickleball/'],['I need a youth soccer league','/sports/youth-leagues/'],['My mother is 78 and cannot drive to appointments','/senior-caregiver/'],['I lost my job and need help with bills and insurance','/life-change-plans/job-loss-coverage-household/'],['I was in a car accident yesterday','/help/auto/crash-next-steps/'],['How do I check whether my car has a recall?','/help/auto/recall-safety/'],['The dealer sold me a used car with a warranty problem','/life-change-plans/used-vehicle-purchase-problem/'],['My health insurance denied coverage and I need to appeal','/help/health/coverage-appeal/'],['I am leaving the hospital tomorrow and need a plan','/help/health/discharge-transition/'],['I was served court papers','/help/legal/court-notice-roadmap/'],['I have a dispute with my contractor about home repairs','/help/legal/housing-consumer-dispute/'],['I think I was scammed','/life-change-plans/fraud-scam-consumer-recovery/'],['I want to start a business in Franklin','/start-a-business/'],['I need more local customers for my business','/local-growth-engine/'],['I need to correct my business profile','/claim-profile/'],['How do I cancel my membership?','/member-account/'],['What events are happening this weekend?','/today/']];
for(const [q,w] of cases){const got=hits(q);assert(got.length,q);assert(got.slice(0,3).some(x=>x.rec.p===w),q+' -> '+got.slice(0,3).map(x=>x.rec.p).join(','));const d=R.direct(q,'en');assert(d&&d.text&&d.text.length>70,'weak direct '+q)}
assert(R.researchNeeded('What time is City Hall open today?','high'));
assert(R.researchNeeded('What events are happening this weekend?','high'));
assert(!R.researchNeeded('I was served court papers','high'));
assert(R.shouldSearchProfiles('Find a dentist in Franklin'));
assert(R.shouldSearchProfiles('What is the phone number for a plumber?'));
assert(!R.shouldSearchProfiles('I need a fence permit'));
assert(!hits('I need a fence permit').slice(0,3).some(x=>/member|business-growth|growth-desk/.test(x.rec.p)));
console.log(JSON.stringify({ok:true,version:R.VERSION,routeCases:cases.length,totalAssertions:cases.length*2+6}));
