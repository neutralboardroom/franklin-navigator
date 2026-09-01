import fs from 'node:fs';
const path='server.js';
let s=fs.readFileSync(path,'utf8');
const replacements=[
  ["const RELEASE = process.env.LOCAL_RELEASE || 'FR-NAV1.3.0-CANDIDATE-R28';","const RELEASE = process.env.LOCAL_RELEASE || 'FR-NAV1.4.0-CANDIDATE-R29';"],
  ["links===4","links===3"],
  ["if(plan.couponEligible)checkoutParams.prefilled_promo_code=FOUNDING.promotionCode;",""] ,
  ["foundingUsd:plan.foundingUsd,autoRenew:plan.autoRenew,termMonths:plan.termMonths,billingMode:plan.billingMode,couponEligible:plan.couponEligible","autoRenew:plan.autoRenew,termMonths:plan.termMonths,billingMode:plan.billingMode,stripePriceId:plan.stripePriceId"],
  ["links.length!==4","links.length!==3"],
  ["Exactly four V4 checkout mappings are required.","Exactly three V5 checkout mappings are required."],
  ["couponEligible:plan.couponEligible","stripePriceId:plan.stripePriceId"]
];
for(const [from,to] of replacements){if(!s.includes(from)){console.error('missing replacement target:',from);process.exit(2)}s=s.replace(from,to)}
fs.writeFileSync(path,s);
console.log('R29 V6 server patch applied');
