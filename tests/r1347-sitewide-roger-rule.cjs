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

// The R1347 baseline counted pre-canonicalization profile records. R1360 accepted
// PF15.38 canonicalization: duplicate records became explicit aliases and one generic
// FirstBank record became an explicit suppression while the source-backed Franklin
// Navigator self profile remains separately published. Do not lower the baseline.
// Instead prove every baseline record is still accounted for as published, aliased,
// or explicitly suppressed under the accepted canonical-profile contract.
const publishedProfiles=Number(release.counts?.profiles||0);
let aliasCount=0,suppressedCount=0,profileAccountingValid=true,accountingDetail='';
if(publishedProfiles<baseline.minimumProfileCount){
  try{
    const aliases=JSON.parse(read('dist/data/profile-aliases-r1360.json'));
    const canonical=JSON.parse(read('dist/data/franklin-profiles-manifest.json'));
    const aliasEntries=Object.entries(aliases.aliases||{});
    const suppressed=Array.isArray(canonical.r1360SuppressedGenericProfileIds)?canonical.r1360SuppressedGenericProfileIds:[];
    aliasCount=aliasEntries.length;
    suppressedCount=suppressed.length;
    profileAccountingValid=
      aliases.community==='FRANKLIN_TN'&&
      aliases.profileFactoryVersion==='FR-PF-PLATFORM-15.38'&&
      canonical.sourceRelease==='FR-PF-PLATFORM-15.38'&&
      canonical.r1360AliasCount===aliasCount&&
      aliasEntries.every(([alias,target])=>alias&&target&&alias!==target)&&
      new Set(aliasEntries.map(([alias])=>alias)).size===aliasCount&&
      suppressedCount===1&&suppressed[0]==='FR-ORG-a0776afee5ec-firstbank'&&
      canonical.recordCount===publishedProfiles-1&&
      exists('dist/profiles/FR-ORG-b00c0ace7943973c/index.html');
    accountingDetail=`published ${publishedProfiles} + aliases ${aliasCount} + explicit suppressions ${suppressedCount} = ${publishedProfiles+aliasCount+suppressedCount}; baseline ${baseline.minimumProfileCount}`;
  }catch(err){
    profileAccountingValid=false;
    accountingDetail=`profile accounting unavailable: ${err.message}`;
  }
}
const accountedProfileScope=publishedProfiles+aliasCount+suppressedCount;
add('Profile baseline remains fully accounted for after accepted canonicalization',profileAccountingValid&&accountedProfileScope>=baseline.minimumProfileCount,accountingDetail||`${publishedProfiles} >= ${baseline.minimumProfileCount}`);
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
console.log(JSON.stringify({result:failed.length?'FAIL':'PASS',release:release.release,baseline:{nonProfileRoutes:baseline.minimumNonProfileHtmlRoutes,minimumProfiles:baseline.minimumProfileCount,minimumAssistantRoutes:baseline.minimumAssistantRouteCount},current:{nonProfileRoutes:currentRoutes.length,publishedProfiles,aliasCount,suppressedCount,accountedProfileScope,assistantRoutes:release.counts?.assistantRoutes},checks,failed},null,2));
if(failed.length)process.exit(1);
