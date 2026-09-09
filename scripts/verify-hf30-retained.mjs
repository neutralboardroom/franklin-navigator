import fs from 'node:fs';

const need=(ok,msg)=>{if(!ok)throw new Error(`HF30_FAIL ${msg}`)};
const read=p=>fs.readFileSync(p,'utf8');
const release=JSON.parse(read('PRODUCTION_RELEASE.json'));
const nav=read('dist/assets/hf27-navigation.js');
const design=read('dist/assets/hf29-design.js');
const popup=read('dist/assets/hf29-popup.css');
const directory=read('dist/assets/hf28-directory.js');
const i18n=read('dist/assets/r37-i18n.js');

need(release.release==='FR-NAV1.19.0-HF3.0-CANDIDATE','wrong release');
need(release.activeEdition==='FRANKLIN_TN','wrong active edition');
need(release.profileCount===19103,'profile count drift');
need(release.profileFactsChanged===false,'profile facts changed');
need(release.pricesChanged===false,'prices changed');
need(release.runtimeChanged===false,'runtime changed');
need(release.checkoutRemainsOpen===true,'checkout state regressed');
need(release.publicReleaseMarkersExact===19355,'release marker coverage drift');

for(const marker of ['function canonicalHeaderItems','normalizeHeaderLinks','section.hidden=true'])need(nav.includes(marker),`navigation regression ${marker}`);
for(const route of ['#ask-navigator','today','get-it-done','directory','community','my-franklin','business-dashboard'])need(nav.includes(route),`missing canonical route ${route}`);
for(const marker of ['simplifyAssistantExamples','simplifyTodayFilters','simplifyTodayCardActions','simplifyFooter','simplifyMyFranklin','simplifyAssistantDialogStructure','compactDialogActionGroup','isSafetyResult'])need(design.includes(marker),`design behavior regression ${marker}`);
for(const marker of ['hf29-primary-result','hf29-assistant-extra','data-hf29-safety-pinned','hf29-dialog-more-menu'])need(popup.includes(marker),`popup style regression ${marker}`);
for(const marker of ['hf28-more-filters','data-dir-type','data-dir-area','data-dir-sort','data-compare-id','hf28-result-more'])need(directory.includes(marker),`Find Local regression ${marker}`);
need(i18n.includes('franklinlanguagechange'),'language switching regression');

console.log(JSON.stringify({
  result:'PASS',release:release.release,edition:release.activeEdition,
  profileCount:release.profileCount,releaseMarkers:release.publicReleaseMarkersExact,
  universalHeader:'4_DIRECT_PLUS_3_MORE_RETAINED',assistant:'ONE_PRIMARY_RESULT_AND_COMPACT_SECONDARY_RETAINED',
  findLocal:'HF2.8_SIMPLIFICATION_RETAINED',spanish:'SHARED_I18N_RETAINED',
  profileFactsChanged:false,pricesChanged:false,runtimeChanged:false,checkoutRemainsOpen:true
},null,2));
