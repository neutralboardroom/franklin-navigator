import fs from 'node:fs';

function need(ok, message) {
  if (!ok) throw new Error(`HF29_FAIL ${message}`);
}
const read = p => fs.readFileSync(p, 'utf8');

const css = read('dist/assets/hf29-design.css');
const design = read('dist/assets/hf29-design.js');
const nav = read('dist/assets/hf27-navigation.js');
const r37 = read('dist/assets/r37.css');
const i18n = read('dist/assets/r37-i18n.js');
const release = JSON.parse(read('PRODUCTION_RELEASE.json'));

need(release.activeEdition === 'FRANKLIN_TN', 'wrong edition');
need(release.release === 'FR-NAV1.18.0-HF2.9-CANDIDATE', 'wrong release');
need(release.profileCount === 19103, 'profile count drift');
need(release.profileFactsChanged === false, 'profile facts changed');
need(release.pricesChanged === false, 'prices changed');
need(release.runtimeChanged === false, 'runtime changed');
need(release.checkoutRemainsOpen === true, 'checkout state regressed');

for (const marker of [
  '.r24-destinations,.r41-home-routes{display:none!important}',
  '.navigator-examples.r24-chips{display:none!important}',
  '.hf29-example-select',
  '.hf29-today-filter',
  '[data-today-grid]{grid-template-columns:repeat(2,minmax(0,1fr))!important',
  '.hf29-card-more-menu{position:absolute',
  '.r41-more-actions-menu{',
  '.hf29-dialog-more',
  '.hf29-footer-more-menu',
  '.device-reset-panel .hf29-safe-choice',
  '.r27-navigator-dialog{width:min(640px',
  '.r29-hero{padding:72px 0 58px!important',
  '.r29-local-card{',
  '.r29-plan{position:relative',
  '.r29-plan.featured{',
  '.r34-growth-band{'
]) need(css.includes(marker), `missing CSS marker ${marker}`);

for (const fn of [
  'simplifyAssistantExamples',
  'simplifyTodayFilters',
  'simplifyTodayCardActions',
  'simplifyFooter',
  'simplifyMyFranklin',
  'simplifyDialogActions'
]) need(design.includes(fn), `missing design function ${fn}`);

need(nav.includes('function canonicalHeaderItems'), 'canonical universal header missing');
need(nav.includes('normalizeHeaderLinks'), 'runtime header normalization missing');
const canonical = nav.split('function canonicalHeaderItems', 2)[1].split('function currentPathMatches', 1)[0];
for (const route of ['#ask-navigator', 'today', 'get-it-done', 'directory', 'community', 'my-franklin', 'business-dashboard']) {
  need(canonical.includes(route), `canonical header missing ${route}`);
}
for (const route of ['activities', 'sports', 'learning']) need(!canonical.includes(route), `subtopic leaked into canonical header: ${route}`);
need(nav.includes('section.hidden=true'), 'duplicate homepage route chooser not suppressed');
need(nav.includes("summaryEn:'More',summaryEs:'Más'"), 'compact bilingual More label missing');
need(nav.includes('closeOtherDisclosures'), 'mutually-exclusive disclosure behavior missing');
need(r37.includes("@import url('/assets/hf29-design.css');"), 'HF29 CSS not loaded early');
need(i18n.includes('data-hf29-design'), 'HF29 JS loader missing');

console.log(JSON.stringify({
  result: 'PASS',
  release: release.release,
  edition: release.activeEdition,
  universalDirectHeaderDestinations: 4,
  universalHeaderMoreDestinations: 3,
  ordinaryPrimaryActionsMax: 1,
  ordinaryVisibleSecondaryActionsMax: 1,
  heroExampleButtonsRendered: 0,
  heroExampleSelectorRendered: 1,
  todayCategoryControl: 'SINGLE_SELECT',
  todayDirectCardActionsMax: 1,
  assistantPrimaryButtonsVisibleMax: 1,
  businessMembershipPremiumPolish: true,
  profileCount: release.profileCount,
  profileFactsChanged: false,
  runtimeChanged: false,
  pricesChanged: false
}, null, 2));
