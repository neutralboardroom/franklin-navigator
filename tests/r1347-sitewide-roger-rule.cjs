'use strict';
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const baseline=JSON.parse(read('SITEWIDE_PRESERVATION_BASELINE__R1347.json'));
const rule=read('DURABLE_ROGER_RULE__SITEWIDE_NO_REGRESSION_AND_NON_BURIAL.md');
const workflow=read('.github/workflows/hf32-site-cleanup.yml');
const release=JSON.parse(read('PRODUCTION_RELEASE.json'));
const checks=[];const add=(name,ok,detail='')=>checks.push({name,pass:Boolean(ok),detail});
const exists=p=>fs.existsSync(path.join(root,p));

const currentRoutes=[];
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p);
    else if(ent.isFile()&&ent.name==='index.html'){
      const rel=path.relative(root,p).split(path.sep).join('/');
      if(rel.startsWith('dist/')&&!rel.startsWith('dist/profiles/'))currentRoutes.push(rel);
    }
  }
}
walk(path.join(root,'dist'));
const currentSet=new Set(currentRoutes);
const missing=baseline.requiredNonProfileHtmlRoutes.filter(p=>!currentSet.has(p));
add('All protected non-profile public routes remain present',missing.length===0,missing.slice(0,20).join(', '));
add('Non-profile route count has not regressed',currentRoutes.length>=baseline.minimumNonProfileHtmlRoutes,`${currentRoutes.length} >= ${baseline.minimumNonProfileHtmlRoutes}`);
let effectiveProfileCoverage=Number(release.counts?.profiles||0),profileCoverageDetail=`${effectiveProfileCoverage} public profiles`;
if(release.release==='FR-NAV1.30.60-HF3.13.42'){
  const aliasState=JSON.parse(read('dist/data/profile-aliases-r1360.json'));
  const receipt=JSON.parse(read('R1360_QUALIFICATION_RECEIPT.json'));
  const aliasCount=Object.keys(aliasState.aliases||{}).length;
  const suppressedCount=(aliasState.suppressedGenericProfileIds||[]).length;
  effectiveProfileCoverage+=aliasCount+suppressedCount;
  profileCoverageDetail=`${release.counts?.profiles} public + ${aliasCount} canonical aliases + ${suppressedCount} explicit generic suppression = ${effectiveProfileCoverage}`;
  add('R1360 profile-count reduction is explicit canonicalization/suppression, not silent loss',
    receipt.profileFactory?.version==='FR-PF-PLATFORM-15.38'&&
    receipt.profileFactory?.semantics==='FULL_REPLACE_NOT_APPEND'&&aliasCount===100&&suppressedCount===1&&
    (aliasState.reviewHeldProfileIds||[]).length===0,profileCoverageDetail);
}
add('Profile identity coverage has not silently regressed',effectiveProfileCoverage>=baseline.minimumProfileCount,`${profileCoverageDetail}; baseline ${baseline.minimumProfileCount}`);
add('Assistant route scope has not silently regressed',Number(release.counts?.assistantRoutes||0)>=baseline.minimumAssistantRouteCount,`${release.counts?.assistantRoutes} >= ${baseline.minimumAssistantRouteCount}`);

add('Roger rule requires explicit owner direction before removal/burial',rule.includes('only when Roger explicitly directs that specific change')&&rule.includes('no regression, no burial, no silent removal'));
add('Roger rule rejects code-exists-only preservation',rule.includes('some old code still exists')&&rule.includes('see it, understand it, reach it, use it'));
add('Roger rule protects whole-site domains',[
 'account','claim','authority','correction/removal','support','membership','payment-protection','accessibility','bilingual','navigation','Assistant','directory','discovery','resident-help','business'
].every(x=>rule.includes(x)));
add('Roger rule requires desktop/mobile/accessibility preservation',rule.includes('desktop, tablet/intermediate, mobile, keyboard, focus'));
add('Roger rule requires permanent tests to extend rather than reset',rule.includes('extend, never reset'));
add('Roger rule forbids weakening gates merely to pass',rule.includes('must not weaken or delete these gates simply to make a release pass'));

const requiredWorkflow=[
 'python scripts/validate-current-release.py',
 'node tests/r1344-recent-fix-visibility.cjs',
 'node tests/r1345-profile-access-authority-routing.cjs',
 'node tests/r1346-claim-path-outreach-readiness.cjs',
 'node tests/r1347-two-command-permanent-baseline.cjs',
 'node tests/r1347-sitewide-roger-rule.cjs',
 'node scripts/r1346-claim-path-browser-acceptance.mjs',
 'node scripts/r1347-two-command-browser-visibility.mjs'
];
add('Qualification workflow retains full permanent preservation gates',requiredWorkflow.every(x=>workflow.includes(x)),requiredWorkflow.filter(x=>!workflow.includes(x)).join(', '));
add('Baseline manifest itself is protected by workflow trigger',workflow.includes("SITEWIDE_PRESERVATION_BASELINE__R1347.json"));
add('Durable Roger Rule itself is protected by workflow trigger',workflow.includes("DURABLE_ROGER_RULE__SITEWIDE_NO_REGRESSION_AND_NON_BURIAL.md"));

const predecessorTests=[
 'tests/r1342-claim-recovery.cjs',
 'tests/r1344-recent-fix-visibility.cjs',
 'tests/r1345-profile-access-authority-routing.cjs',
 'tests/r1346-claim-path-outreach-readiness.cjs',
 'tests/r1347-two-command-permanent-baseline.cjs'
];
add('All predecessor permanent regression test files remain present',predecessorTests.every(exists),predecessorTests.filter(x=>!exists(x)).join(', '));

const failed=checks.filter(x=>!x.pass);
console.log(JSON.stringify({result:failed.length?'FAIL':'PASS',release:release.release,baseline:{nonProfileRoutes:baseline.minimumNonProfileHtmlRoutes,minimumProfiles:baseline.minimumProfileCount,minimumAssistantRoutes:baseline.minimumAssistantRouteCount},current:{nonProfileRoutes:currentRoutes.length,profiles:release.counts?.profiles,effectiveProfileCoverage,assistantRoutes:release.counts?.assistantRoutes},checks,failed},null,2));
if(failed.length)process.exit(1);
