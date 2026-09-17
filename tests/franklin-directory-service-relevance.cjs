'use strict';
const C=require('../dist/assets/local-discovery-core.js');

const input={
  schemaVersion:'franklin.discovery-index.v1',
  community:'FRANKLIN_TN',
  recordCount:3,
  categories:['landscaping','Lawn Service','Speech-Language Pathologist'],
  types:['business','business','individual_healthcare_provider'],
  areas:['Franklin','Franklin','Franklin'],
  dates:['2026-09-01'],
  websites:['https://example.com','',''],
  rows:[
    ['FR-ORG-LAWN1','Franklin Lawn Care','612 Claridge Ct',0,0,0,0,'615-555-1000','',0,true,1],
    ['FR-ORG-LAWN2','Thrifty Lawn Care','218 Turnbrook Ln',1,1,0,1,'615-555-2000','',0,true,1],
    ['FR-ORG-SPEECH','WHOLE CHILD SPEECH LLC','942 LAWNVIEW LN, FRANKLIN, TN 37064',2,2,0,1,'615-555-3000','',0,true,1]
  ]
};
const rows=C.decodeIndex(input);
const names=q=>C.matchRows(rows,{q,sort:'local'}).map(x=>x.n);
const assert=(cond,msg)=>{if(!cond)throw new Error(msg)};
assert(JSON.stringify(names('lawn care'))===JSON.stringify(['Franklin Lawn Care','Thrifty Lawn Care']),'lawn care false positive');
assert(JSON.stringify(names('lawn'))===JSON.stringify(['Franklin Lawn Care','Thrifty Lawn Care']),'lawn false positive');
assert(JSON.stringify(names('lawnview'))===JSON.stringify(['WHOLE CHILD SPEECH LLC']),'place/address search regression');
console.log(JSON.stringify({ok:true,lawnCare:names('lawn care'),lawnview:names('lawnview')}));
