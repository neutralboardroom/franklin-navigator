const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[]; const add=(name,ok)=>checks.push([name,Boolean(ok)]);
const index=read('dist/index.html');
const r1332=read('dist/assets/r1332-profile.js');
const i18n=read('dist/assets/r37-i18n.js');
const r1330=read('dist/assets/r1330-profile.js');
const memberLive=read('dist/assets/member-profile-live.js');
const studio=read('dist/profile-studio/index.html');
const corrections=read('dist/corrections/index.html');
const request=read('dist/assets/r1338-profile-request.js');
const business=read('dist/business-dashboard/index.html');
const membership=read('dist/membership-start/index.html');
const access=read('dist/profile-access/index.html');
const live=read('dist/assets/membership-live.js');
const recovery=read('dist/assets/account-recovery-r1342.js');
const support=read('dist/member-support/index.html');
const hf39=read('dist/assets/hf39.js');
const app=read('dist/assets/app.js');
const css=read('dist/assets/styles.css');
const claim=read('dist/assets/hf310.js');
const color=read('dist/assets/r1336-color-system.css');
const home=read('dist/index.html');
const esHome=read('dist/es/index.html');
const assistantPage=read('dist/assistant/index.html');
const help=read('dist/community-help-center/index.html');
const selfProfile=read('dist/profiles/FR-ORG-b00c0ace7943973c/index.html');
const durableRule=read('DURABLE_RULE__OWNER_APPROVED_FIX_VISIBILITY_AND_NON_BURIAL.md');

add('R1335 semantic color system retained',['--fr-teal:','--fr-green:','--fr-blue:','--fr-gold:','--fr-violet:'].every(x=>color.includes(x)));
add('R1335 navigation accent remains current-section only',color.includes('header nav a[aria-current="page"]')&&!/header nav a\.franklin-nav-priority-business\s*\{[^}]*color:/s.test(color));
add('R1336 public Ask Franklin entry remains visible',assistantPage.includes('Ask Franklin. Get a local answer.')&&assistantPage.includes('No account required'));
add('R1336 redundant connected-needs homepage bridge stays removed',!home.includes('hf35-home-bridge')&&!esHome.includes('hf35-home-bridge')&&!home.includes('/situation-planner/')&&!esHome.includes('/situation-planner/')&&!home.includes('Need help with several things at once?')&&!esHome.includes('¿Necesita ayuda con varias cosas a la vez?'));
add('R1336 connected-needs help remains reachable elsewhere',help.includes('/whole-situation-navigator/')&&help.includes('Make a private help plan'));
add('R1336 self-profile remains official and free of internal qualification UI',selfProfile.includes('Official Franklin Navigator profile')&&!/Source packet|Qualification status|Candidate status|Internal source|Claim status/i.test(selfProfile));
add('Durable non-burial rule is present',durableRule.includes('not preserved merely because its code still exists')&&durableRule.includes('regression-test visibility/reachability'));

add('R1337 Franklin Through Time visible',index.includes('Franklin Through Time')&&!index.includes('Then & Now'));
add('R1337 accessible profile media controls retained',/aria-label|setAttribute\(['"]aria-label/.test(r1332));
add('R1337 Helpful links profile wording retained',r1332.includes('Helpful links'));
add('R1337 Spanish dynamic profile accessibility retained',i18n.includes('Fotos')&&i18n.includes('Perfil'));

add('R1338 verified pending disputed management states visible',r1330.includes('Management verified for you')&&r1330.includes('Access request pending')&&r1330.includes('Access review needed'));
add('R1338 pending withdrawal and safe stop-management retained',memberLive.includes('Withdraw access request')&&memberLive.includes('Stop managing'));
add('R1338 free reviewed photo/logo path retained',studio.toLowerCase().includes('photo')&&studio.toLowerCase().includes('logo'));
add('R1338 free factual correction/removal retained',corrections.toLowerCase().includes('free')&&/removal|remove/i.test(corrections));

add('R1339 Profile Center terminology retained',studio.includes('Profile Center')&&r1330.includes('Open Profile Center')&&!hf39.includes('Profile Studio'));
add('R1339 bilingual profile-request feedback retained',request.includes('preferredLanguage'));

add('R1340 approved business headline retained',business.includes('Find your Franklin profile. Improve it. Grow your local visibility.'));
add('R1340 free-first five-step path retained',business.includes('Claim profile / verify authority')&&business.includes('Review or manage free profile'));

add('R1341 membership value visible',business.includes('How membership increases your visibility')&&membership.includes('$35/year')&&membership.includes('special offers'));
add('R1341 payment safeguards visible',business.includes('Corrections and removal are always free')&&business.includes('ordinary unpaid-result order'));

add('R1342 no-payment profile access visible',access.includes('No membership or payment is required'));
add('R1342 account choice visible',live.includes('Create account')&&live.includes('Sign in'));
add('R1342 password recovery visible',live.includes('Forgot password?')&&recovery.includes('Reset your password'));
add('R1342 same-profile recovery continuity retained',recovery.includes('same selected profile'));
add('R1342 email-access support fallback visible',live.includes('Can’t access your email? Get account help')&&support.toLowerCase().includes('account'));
add('R1342 Spanish recovery/claim parity retained',i18n.includes("'Forgot password?':'¿Olvidó su contraseña?'")&&i18n.includes("'Claim this profile':'Reclamar este perfil'"));
add('R1342 unverified users continue through Profile Access',hf39.includes("access='/profile-access/?profile='")&&!hf39.includes("Continue profile access',studio"));

add('R1343 universal claim CTA retained',app.includes('universal profile-control visibility guard')&&css.includes('--claim-accent:#f6c453'));
add('R1343 distinct claim-search action retained',claim.includes("b.textContent='Claim this profile'")&&css.includes('.r1342-claim-result-action')&&css.includes('background:var(--claim-accent)!important'));
add('R1344 correction page exposes claim/manage prominently',corrections.includes('data-r1344-claim-cta')&&corrections.includes('Claim or manage this profile — free'));
add('R1344 correction claim keeps exact-profile continuity',read('dist/assets/hf35-profile-control.js').includes("claimCta.href='/profile-access/?profile='"));
add('R1344 correction claim uses distinct ownership accent',css.includes('.r1344-owner-claim-callout')&&css.includes('.r1343-claim-primary'));


const registry=JSON.parse(read('OWNER_APPROVED_FIX_VISIBILITY_REGISTRY.json'));
for(const entry of registry.entries||[]){
  for(const surface of entry.surfaces||[]){
    let text='';
    try{text=read(surface.file)}catch{add(entry.id+' surface exists: '+surface.file,false);continue}
    add(entry.id+' required public tokens: '+surface.file,(surface.allOf||[]).every(x=>text.includes(x)));
    add(entry.id+' retired tokens absent: '+surface.file,(surface.noneOf||[]).every(x=>!text.includes(x)));
  }
}
function stripPrintMedia(cssText){
  let out='',i=0;
  while(i<cssText.length){
    const match=cssText.slice(i).match(/@media\s+print\b/i);
    if(!match){out+=cssText.slice(i);break}
    const start=i+match.index;out+=cssText.slice(i,start);
    const open=cssText.indexOf('{',start);if(open<0)break;
    let depth=1,j=open+1;
    for(;j<cssText.length&&depth;j++){if(cssText[j]==='{')depth++;else if(cssText[j]==='}')depth--}
    i=j;
  }
  return out;
}
const cssDir=path.join(root,'dist','assets');
const dangerous=/display\s*:\s*none(?:\s*!important)?|visibility\s*:\s*hidden|content-visibility\s*:\s*hidden|opacity\s*:\s*0(?:\D|$)|max-height\s*:\s*0(?:\D|$)/i;
const cssRules=[];
for(const name of fs.readdirSync(cssDir).filter(n=>n.endsWith('.css'))){
  const raw=stripPrintMedia(fs.readFileSync(path.join(cssDir,name),'utf8'));
  const re=/([^{}]+)\{([^{}]*)\}/g;let m;
  while((m=re.exec(raw)))cssRules.push({file:name,selector:m[1].trim(),body:m[2]});
}
for(const entry of registry.entries||[]){
  for(const selector of entry.protectedSelectors||[]){
    const buried=cssRules.filter(rule=>rule.selector.includes(selector)&&dangerous.test(rule.body));
    add(entry.id+' protected selector not buried by non-print CSS: '+selector,buried.length===0);
  }
}
const workflow=read('.github/workflows/hf32-site-cleanup.yml');
add('permanent registry changes trigger qualification',workflow.includes('OWNER_APPROVED_FIX_VISIBILITY_REGISTRY.json'));
add('visibility gate runs in normal and clean-extracted qualification',(workflow.match(/node tests\/r1344-recent-fix-visibility\.cjs/g)||[]).length>=2);

const failed=checks.filter(x=>!x[1]);
const currentRelease=JSON.parse(read('PRODUCTION_RELEASE.json')).release;
console.log(JSON.stringify({result:failed.length?'FAIL':'PASS',release:currentRelease,auditedReleaseWindow:registry.auditedReleaseWindow,checks,failed},null,2));
if(failed.length)process.exit(1);
