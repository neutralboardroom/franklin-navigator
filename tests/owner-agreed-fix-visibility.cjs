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

function stripPrintBlocks(css){
  let out='',i=0;
  while(i<css.length){
    const m=css.slice(i).match(/@media\s+print\b/i);
    if(!m){out+=css.slice(i);break;}
    const start=i+m.index;
    out+=css.slice(i,start);
    const open=css.indexOf('{',start);
    if(open<0){break;}
    let depth=1,j=open+1;
    for(;j<css.length&&depth;j++){
      if(css[j]==='{')depth++;
      else if(css[j]==='}')depth--;
    }
    i=j;
  }
  return out;
}
const cssDir=path.join(root,'dist','assets');
const cssFiles=fs.readdirSync(cssDir).filter(n=>n.endsWith('.css'));
let cssRules=[];
for(const name of cssFiles){
  const raw=stripPrintBlocks(fs.readFileSync(path.join(cssDir,name),'utf8'));
  const re=/([^{}]+)\{([^{}]*)\}/g; let m;
  while((m=re.exec(raw)))cssRules.push({file:'dist/assets/'+name,selector:m[1].trim(),body:m[2]});
}
const dangerous=/display\s*:\s*none(?:\s*!important)?|visibility\s*:\s*hidden|content-visibility\s*:\s*hidden|opacity\s*:\s*0(?:\D|$)|max-height\s*:\s*0(?:\D|$)/i;
for(const entry of registry.entries||[]){
  for(const selector of entry.protectedSelectors||[]){
    for(const rule of cssRules){
      if(rule.selector.includes(selector)&&dangerous.test(rule.body)){
        failures.push({id:entry.id,file:rule.file,reason:'protected user-facing selector is buried by CSS',selector,rule:rule.selector+'{'+rule.body.trim().slice(0,260)+'}'});
      }
    }
  }
}

const workflow=read('.github/workflows/hf32-site-cleanup.yml');
if(!workflow.includes('node tests/owner-agreed-fix-visibility.cjs')){
  failures.push({id:'PERMANENT_GATE',file:'.github/workflows/hf32-site-cleanup.yml',reason:'permanent owner-fix visibility gate is not executed'});
}
for(const required of ["'tests/owner-agreed-fix-visibility.cjs'","'OWNER_AGREED_FIX_VISIBILITY_REGISTRY.json'","'DURABLE_RULE__OWNER_AGREED_FIX_VISIBILITY_AND_NON_LOSS.md'"]){
  if(!workflow.includes(required))failures.push({id:'PERMANENT_GATE',file:'.github/workflows/hf32-site-cleanup.yml',reason:'permanent visibility input does not trigger qualification',required});
}
const gateRuns=(workflow.match(/node tests\/owner-agreed-fix-visibility\.cjs/g)||[]).length;
if(gateRuns<2)failures.push({id:'PERMANENT_GATE',file:'.github/workflows/hf32-site-cleanup.yml',reason:'visibility gate must run in normal qualification and clean extracted artifact',gateRuns});

const correction=read('dist/corrections/index.html'),spanish=read('dist/es/correcciones/index.html'),control=read('dist/assets/hf35-profile-control.js'),css=read('dist/assets/styles.css');
if(!/data-r1344-claim-cta/.test(correction)||!/data-r1344-claim-cta/.test(spanish))failures.push({id:'R1344_CORRECTION_PAGE_CLAIM_ACTION',reason:'English/Spanish correction-page claim parity missing'});
if(!control.includes("claimCta.href='/profile-access/?profile='+encodeURIComponent(profile)"))failures.push({id:'R1344_CORRECTION_PAGE_CLAIM_ACTION',reason:'exact-profile claim continuity missing'});
if(!css.includes('.r1343-claim-primary')||!css.includes('--claim-accent:#f6c453'))failures.push({id:'R1343_UNIVERSAL_PROFILE_CLAIM_CTA',reason:'distinct claim styling missing'});

const businessDynamic=read('dist/assets/r1326-business-journey.js');
if(businessDynamic.includes("Find your Franklin profile, then improve it."))failures.push({id:'R1340_OWNER_APPROVED_BUSINESS_HEADLINE',reason:'retired dynamic headline override returned'});
const hf39=read('dist/assets/hf39.js');
if(hf39.includes('Profile Studio'))failures.push({id:'R1339_PROFILE_CENTER_TERMINOLOGY',reason:'retired Profile Studio language returned in dynamic business state'});
if(!hf39.includes("access='/profile-access/?profile='"))failures.push({id:'R1344_UNVERIFIED_USER_ROUTE',reason:'unverified linked users no longer continue through Profile Access'});

const meta=JSON.parse(read('PRODUCTION_RELEASE.json'));
console.log(JSON.stringify({
  result:failures.length?'FAIL':'PASS',
  release:meta.release,
  rule:registry.durableRuleId,
  auditSpan:registry.auditSpan,
  registryEntries:(registry.entries||[]).length,
  surfacePasses:passes.length,
  cssRulesScanned:cssRules.length,
  protectedSelectorCount:(registry.entries||[]).reduce((n,e)=>n+(e.protectedSelectors||[]).length,0),
  workflowGateRuns:gateRuns,
  failures
},null,2));
if(failures.length)process.exit(1);
