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
add('R1343 distinct claim-search action retained',claim.includes("b.textContent='Claim this profile'"));

const failed=checks.filter(x=>!x[1]);
console.log(JSON.stringify({result:failed.length?'FAIL':'PASS',release:'FR-NAV1.30.44-HF3.13.26',checks,failed},null,2));
if(failed.length)process.exit(1);
