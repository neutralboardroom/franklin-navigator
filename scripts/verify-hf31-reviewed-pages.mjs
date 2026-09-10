import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const need=(ok,msg)=>{if(!ok){console.error('HF31_VERIFY_FAIL',msg);process.exit(1)}};
const js=read('dist/assets/hf31-public.js');
const css=read('dist/assets/hf31-public.css');
const saveCss=read('dist/assets/hf31-task-save.css');
const nav=read('dist/assets/hf27-navigation.js');
const dialog=read('dist/assets/hf29-design.js');
const directory=read('dist/assets/hf28-directory.js');
const home=read('dist/index.html');
const today=read('dist/today/index.html');
const tasks=read('dist/get-it-done/index.html');
const profile=read('dist/profiles/FR-ORG-5d72d3ee4e9961c5/index.html');

for(const token of [
  "const HOME_RE=/^(?:\\/|\\/es\\/)$/",
  'compactEmptyAssistantSave',
  'suppressExpiredDatedContent',
  'simplifyTaskCategories',
  'compactTaskCards',
  'refineDirectoryResult',
  'compactProfilePrimaryActions',
  'compactProfileUtilities',
  'refineProfileManagement',
  "'More contact options'",
  "'More tools'",
  "'Manage or correct this profile'",
  "'About this profile'",
  "'At a glance'"
]) need(js.includes(token),`missing JS behavior ${token}`);

need(css.includes('.r37-language-switch.hf31-language-inline'),'language switch is not integrated into header styling');
need(css.includes('.hf31-home .r24-home-events .r24-event-card:not([hidden]){display:block!important}'),'home nonexpired-card override missing');
need(css.includes('.hf31-home .r24-home-events .r24-event-card[hidden]{display:none!important}'),'home expired-card hide missing');
need(css.includes('.hf31-home .hf31-home-activities .grid{grid-template-columns:repeat(3'),'home activity density not reduced');
need(css.includes('.hf31-today [data-today-grid]'),'Today layout rule missing');
need(css.includes('.hf31-tasks [data-task-categories]{display:none!important}'),'task pill wall is not hidden');
need(css.includes('.hf31-directory .hf31-directory-results{grid-template-columns:repeat(4'),'directory laptop grid missing');
need(css.includes('.hf31-profile-page .hf31-profile-currentness'),'profile currentness treatment missing');
need(css.includes('.hf31-profile-page .hf31-profile-management'),'profile management treatment missing');
need(saveCss.includes('display:inline-flex!important'),'quiet task Save is not explicitly visible');

need((tasks.match(/data-category=/g)||[]).length>=13,'Get It Done category controls lost');
need((tasks.match(/class="r22-card task-card"/g)||[]).length===12,'Get It Done task card count drifted');
need(profile.includes("Carson&#39;s Barbershop"),'sample profile name changed/missing');
need(profile.includes('919 Columbia Ave'),'sample profile address changed/missing');
need(profile.includes('http://carsonsbarbershop.net/'),'sample profile website changed/missing');
need(profile.includes('tel:6157908007'),'sample profile phone changed/missing');
need(profile.includes('mailto:angiescarson@comcast.net'),'sample profile email changed/missing');
need(home.includes('data-home-events'),'home currentness surface missing');
need(today.includes('data-today-grid'),'Today currentness surface missing');

need(nav.includes("{kind:'core',href:es?'/es/#ask-navigator':'/#ask-navigator'"),'canonical Ask nav lost');
need(nav.includes("{kind:'core',href:es?'/es/hoy/':'/today/'"),'canonical Today nav lost');
need(nav.includes("{kind:'core',href:es?'/es/hacerlo/':'/get-it-done/'"),'canonical Get It Done nav lost');
need(nav.includes("{kind:'core',href:es?'/es/directorio/':'/directory/'"),'canonical Find Local nav lost');
need(dialog.includes('isSafetyResult(results[0])'),'Assistant safety-result exemption lost');
need(dialog.includes('Other useful options'),'Assistant compact related-options behavior lost');
need(directory.includes("tx('More','Más')"),'Find Local More bilingual behavior lost');

console.log(JSON.stringify({
  status:'PASS',
  release:'FR-NAV1.20.0-HF3.1-CANDIDATE',
  reviewedPages:['HOME','TODAY','GET_IT_DONE','FIND_LOCAL','PROFILE_TEMPLATE'],
  taskCards:12,
  profileSample:'FR-ORG-5d72d3ee4e9961c5',
  popups:'COMPACT_DISCLOSURE_CONTRACT_PRESENT',
  safety:'RETAINED'
}));
