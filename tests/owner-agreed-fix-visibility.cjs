'use strict';
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const registry=JSON.parse(read('OWNER_AGREED_FIX_VISIBILITY_REGISTRY.json'));
const failures=[],passes=[];
for(const entry of registry.entries||[]){
  for(const surface of entry.surfaces||[]){
    let text;
    try{text=read(surface.file);}catch(e){failures.push({id:entry.id,file:surface.file,reason:'missing file'});continue;}
    for(const token of surface.allOf||[]){
      if(!text.includes(token))failures.push({id:entry.id,file:surface.file,reason:'missing required visibility/reachability token',token});
    }
    for(const token of surface.noneOf||[]){
      if(text.includes(token))failures.push({id:entry.id,file:surface.file,reason:'prohibited buried/retired token present',token});
    }
    if(!failures.some(f=>f.id===entry.id&&f.file===surface.file))passes.push({id:entry.id,file:surface.file});
  }
}
const workflow=read('.github/workflows/hf32-site-cleanup.yml');
if(!workflow.includes('node tests/owner-agreed-fix-visibility.cjs')){
  failures.push({id:'PERMANENT_GATE',file:'.github/workflows/hf32-site-cleanup.yml',reason:'permanent owner-fix visibility gate is not executed'});
}
if(!workflow.includes("'OWNER_AGREED_FIX_VISIBILITY_REGISTRY.json'")&&!workflow.includes('OWNER_AGREED_FIX_VISIBILITY_REGISTRY.json')){
  failures.push({id:'PERMANENT_GATE',file:'.github/workflows/hf32-site-cleanup.yml',reason:'registry changes do not trigger qualification'});
}
const correction=read('dist/corrections/index.html'),spanish=read('dist/es/correcciones/index.html'),control=read('dist/assets/hf35-profile-control.js'),css=read('dist/assets/styles.css');
if(!/data-r1344-claim-cta/.test(correction)||!/data-r1344-claim-cta/.test(spanish))failures.push({id:'R1344_CORRECTION_PAGE_CLAIM_ACTION',reason:'English/Spanish correction-page claim parity missing'});
if(!control.includes("claimCta.href='/profile-access/?profile='+encodeURIComponent(profile)"))failures.push({id:'R1344_CORRECTION_PAGE_CLAIM_ACTION',reason:'exact-profile claim continuity missing'});
if(!css.includes('.r1343-claim-primary')||!css.includes('--claim-accent:#f6c453'))failures.push({id:'R1343_UNIVERSAL_PROFILE_CLAIM_CTA',reason:'distinct claim styling missing'});
const meta=JSON.parse(read('PRODUCTION_RELEASE.json'));
console.log(JSON.stringify({result:failures.length?'FAIL':'PASS',release:meta.release,rule:registry.durableRuleId,registryEntries:(registry.entries||[]).length,passes:passes.length,failures},null,2));
if(failures.length)process.exit(1);
