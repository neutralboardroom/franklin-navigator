const fs=require('fs');
const ok=(v,m)=>{if(!v)throw new Error(m)};
const profile=fs.readFileSync('dist/assets/r1330-profile.js','utf8');
const claim=fs.readFileSync('dist/assets/hf310.js','utf8');
const access=fs.readFileSync('dist/assets/membership-live.js','utf8');
const assistant=fs.readFileSync('dist/assets/franklin-assistant.js','utf8');
const i18n=fs.readFileSync('dist/assets/r37-i18n.js','utf8');

ok(assistant.includes("FRANKLIN-ASSISTANT2-0.3.6"),'Assistant 0.3.6 identity missing');
ok(assistant.includes("new Set(['public_profile','claim_profile','profile_access'])"),'public workflow stage allowlist missing');
ok(assistant.includes("PROFILE_ID.test(profile)"),'public profile ID validation missing');
ok(assistant.includes("function clearPublicProfileContextFromUrl()"),'clear-context URL sanitizer missing');
ok(assistant.includes("function profileWorkflowAnswer("),'deterministic public profile workflow helper missing');
ok(assistant.includes("profileWorkflowAnswer(question,profileContext,language)||profileCardFollowup"),'profile workflow answer must precede remote fallback');
ok(assistant.includes("body:JSON.stringify({question,language,history:history.slice(-6)})"),'remote API body contract changed unexpectedly');
ok(!assistant.includes("JSON.stringify({question,language,history:history.slice(-6),profileContext"),'public profile context must not be sent to remote API');
ok(assistant.includes("No private account, payment, or evidence state is shared."),'visible privacy boundary missing');
ok(assistant.includes("No se comparte estado privado de cuenta, pago ni evidencia."),'Spanish privacy boundary missing');
ok(assistant.includes("Clear profile context")&&assistant.includes("Quitar contexto del perfil"),'context clear controls missing');
ok(assistant.includes("profileContext=null;clearPublicProfileContextFromUrl();renderProfileContext();input.focus()"),'clear context must not invoke clearAll');
ok(assistant.includes("Franklin does not promise an approval time, and paid membership is not required."),'no-time-promise/free-access workflow answer missing');
ok(assistant.includes("Community Membership is optional and does not change factual truth or profile authority."),'free correction boundary missing');

for(const [src,stage] of [[profile,'public_profile'],[claim,'claim_profile'],[access,'profile_access']]){
  ok(src.includes(stage),stage+' handoff missing');
  ok(src.includes('profileName'),stage+' public profile name handoff missing');
}
ok(profile.includes("new URLSearchParams({profile:id,profileName:String(name||'').slice(0,160),stage})"),'public profile handoff must be generated from allowlisted public keys');
ok(claim.includes('stage=claim_profile'),'claim-profile stage missing');
ok(access.includes("stage:'profile_access'"),'profile-access stage missing');
const handoffSnippets=[
  profile.match(/const assistantProfileHref=.*?;\n/)?.[0]||'',
  claim.match(/r1352-profile-assistant-link[\s\S]{0,900}stage=claim_profile/)?.[0]||'',
  access.match(/selectedActions\.append\(link\(\(document\.documentElement[\s\S]*?stage:'profile_access'[\s\S]*?\)\);/)?.[0]||''
];
ok(handoffSnippets.every(Boolean),'R1352 handoff constructor extraction failed');
for(const forbidden of ['password','resetToken','payment','accountId','memberState','authority_state'])ok(handoffSnippets.every(x=>!x.includes(forbidden)),'private handoff key found in R1352 constructor: '+forbidden);
ok(i18n.includes("'Ask Franklin about this profile':'Preguntar a Franklin sobre este perfil'"),'Assistant handoff Spanish translation missing');

console.log(JSON.stringify({result:'PASS',release:'FR-NAV1.30.52-HF3.13.34',publicContextOnly:true,remoteContextSubmission:false,stages:['public_profile','claim_profile','profile_access'],clearContextPreservesConversationContract:true}));
