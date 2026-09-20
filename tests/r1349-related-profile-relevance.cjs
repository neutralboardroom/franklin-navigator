#!/usr/bin/env node
const fs=require('fs'),assert=require('assert'),vm=require('vm');
const src=fs.readFileSync('dist/assets/r1349-related-profiles.js','utf8');
const sandbox={module:{exports:{}},exports:{},globalThis:{}};vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.module.exports;
for(const c of ['Downtown Business or Organization','Local Business','Business or Organization','Current Regional Chamber Member','Professional Services','Health And Medical'])assert(api.isBroadCategory(c),`${c}: broad category must not create similarity`);
for(const c of ['Restaurant','Burger Restaurant','Insurance Agency','roofing','Clothing Store','Real Estate Agent'])assert(!api.isBroadCategory(c),`${c}: meaningful category was over-broadened`);
const d=api.qualifiedOverride['FR-ORG-305366afb36e-daddy-s-dogs'];assert(d&&d.vertical==='food_hospitality');
const names=d.profiles.map(x=>x.name);assert(names.includes('Dog Haus'));assert(!names.includes('615 Blinds'));assert(!names.includes('503 Bloomhouse'));
assert(/card\.remove\(\)/.test(src),'fewer/zero results path missing');
assert(!/activePaidMember|sponsored|membership|entitlement|price|payment/i.test(src),'related relevance must not depend on paid/commercial state');
assert(!/profile-location|Area/.test(src),'locality must not create similarity by itself');
const daddy=fs.readFileSync('dist/profiles/FR-ORG-305366afb36e-daddy-s-dogs/index.html','utf8');
assert(daddy.includes('Downtown Business or Organization'),'test fixture no longer proves broad-category defect input');
for(const [label,path] of [
 ['insurance','dist/profiles/FR-ORG-33a5bb4c2e8198a0/index.html'],
 ['home-service','dist/profiles/FR-ORG-4761061977c3b77b/index.html'],
 ['retail','dist/profiles/FR-ORG-2b2ac4f07c0d8612/index.html']
]){
 assert(fs.existsSync(path),`${label}: spot-check fixture missing`);
 const h=fs.readFileSync(path,'utf8');
 assert(/Related local profiles|Similar local profiles/.test(h),`${label}: baseline related module unexpectedly absent`);
}
console.log(JSON.stringify({result:'PASS',broadCategoryEqualityInsufficient:true,daddysDogsFoodOverride:names,fewerResultsAllowed:true,paidRankingUsed:false,localityCreatesSimilarity:false}));