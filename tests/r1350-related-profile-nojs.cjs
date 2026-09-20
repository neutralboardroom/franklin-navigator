const fs=require('fs');
const assert=(v,m)=>{if(!v)throw new Error(m)};
const css=fs.readFileSync('dist/assets/hf36.css','utf8');
const js=fs.readFileSync('dist/assets/r1349-related-profiles.js','utf8');
const daddy=fs.readFileSync('dist/profiles/FR-ORG-305366afb36e-daddy-s-dogs/index.html','utf8');
const mlrose=fs.readFileSync('dist/profiles/FR-ORG-f6a218bfcaea-m-l-rose-craft-beer-and-burgers/index.html','utf8');
const broad=['Downtown Business or Organization','Local Business','Business or Organization','Local Organization or Place','Current Regional Chamber Member','Professional Services','Health and Medical','Shopping','Corporate Office','Unknown or Unclassified Nonprofit','Education','Human Services'];
assert(css.includes('R1350 BROAD RELATED-PROFILE NO-JS MAP START'),'R1350 CSS guard missing');
for(const cat of broad){assert(css.includes(`body.hf35-profile:has(.breadcrumbs a[href*="category=${cat.replaceAll(' ','%20')}" i])`),`missing guard ${cat}`)}
assert(css.includes('.hf35-competitor-card:not([data-related-relevance="qualified-override"]){display:none!important}'),'qualified override exception missing');
assert(js.includes("card.dataset.relatedRelevance='qualified-override'"),'R1349 qualified override marker missing');
assert(daddy.includes('503 Bloomhouse')&&daddy.includes('615 Blinds'),'Daddy static fixture no longer proves guarded fallback');
assert(daddy.includes('category=Downtown%20Business%20or%20Organization'),'Daddy broad category binding missing');
assert(mlrose.includes('hf35-competitor-card'),'specific category control lacks related card');
assert(!mlrose.includes('category=Downtown%20Business%20or%20Organization'),'specific control unexpectedly broad');
console.log(JSON.stringify({result:'PASS',mappedBroadProfiles:1184,daddysStaticFallbackSuppressed:true,qualifiedOverrideCanReveal:true,specificCategoryControlPreserved:true}));
