import fs from 'node:fs';
// R29 V6 verifier trigger after workflow simplification.
const mustExist=[
'dist/index.html','dist/assistant/index.html','dist/membership-start/index.html','dist/membership-pricing/index.html','dist/member-profile-preview/index.html','dist/membership-enrollment/index.html','dist/membership-status/index.html','dist/member-support/index.html','dist/member-first-value/index.html','dist/assets/r29-v6.css','dist/assets/r28-community.js','dist/assets/r27-home.js','PRODUCTION_RELEASE.json'];
for(const f of mustExist){if(!fs.existsSync(f))throw new Error('missing '+f)}
const pricing=fs.readFileSync('dist/membership-pricing/index.html','utf8');
for(const s of ['$5','$50','$120','BEST LONG-TERM VALUE','SHOW ME'])if(!pricing.includes(s))throw new Error('pricing missing '+s);
for(const s of ['Most Popular','Recommended','Founding30','$35','$3.50','$135'])if(pricing.toLowerCase().includes(s.toLowerCase()))throw new Error('retired public pricing text present: '+s);
const assistant=fs.readFileSync('dist/assistant/index.html','utf8');if(!assistant.includes('Franklin Assistant'))throw new Error('assistant brand missing');
const release=JSON.parse(fs.readFileSync('PRODUCTION_RELEASE.json','utf8'));
if(release.release!=='FR-NAV1.4.0-CANDIDATE-R29')throw new Error('wrong release');
if(release.publicPayload.profiles!==19103)throw new Error('profile no-loss failed');
if(release.commerce.publicCheckoutOpen!==false||release.commerce.paidCommerceActive!==false||release.commerce.controlledRealTransactionPassed!==false)throw new Error('commerce not fail closed');
if(release.exactDirectPredecessor.commit!=='f35d156d8149698f63a0000c01ad47e5fecec3ef')throw new Error('wrong predecessor');
console.log(JSON.stringify({ok:true,release:release.release,profiles:release.publicPayload.profiles,offer:[5,50,120],checkout:false}));
