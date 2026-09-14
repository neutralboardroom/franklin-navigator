'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
global.window={};require('../dist/assets/franklin-assistant-core.js');require('../dist/assets/franklin-assistant-r1293-core.js');require('../dist/assets/franklin-assistant-r1294-core.js');require('../dist/assets/franklin-assistant-r1295-core.js');
const C=window.FranklinAssistantCore,R=window.FranklinAssistantR1295Core;
const rec=[0,1,2,3].flatMap(i=>JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/data/assistant-routes-0'+i+'.json'),'utf8')).records);
function hits(q,lang='en'){const seen=new Set(),h=[];for(const p of R.preferredRoutes(q,lang)){const r=rec.find(x=>x.l===lang&&x.p===p);if(r&&!seen.has(p)){seen.add(p);h.push({rec:r,score:220})}}for(const x of C.rankRoutes(rec,q,lang,14))if(!seen.has(x.rec.p)){seen.add(x.rec.p);h.push(x)}return R.rerank(R.cleanRouteHits(h),q,6)}
const cases=[
['I am behind on rent and need housing help','/housing/'],['I need child care after school','/local-pathways/children-family/'],['What parks and trails are good for walking?','/outdoors/'],['I need the zoning record for my property','/help/home/property-records-zoning/'],['I am looking for a job in Franklin','/jobs-internships/'],['I need a lawyer for a housing problem','/legal-help/'],['Find a dentist in Franklin',null],['I need a plumber near me',null],['I need a vet for my dog','/local-pathways/pets-animals/'],['Find a local restaurant open now','/local-pathways/restaurants-local-experience/'],['I need a tax preparer','/local-pathways/money-tax-professional/'],['When is the next city meeting?','/civic-involvement/']];
for(const [q,w] of cases){const d=R.direct(q,'en');assert(d&&d.text.length>80,'weak answer '+q);if(w){const got=hits(q);assert(got.slice(0,3).some(x=>x.rec.p===w),q+' -> '+got.slice(0,3).map(x=>x.rec.p).join(','))}assert(R.clarification(q,'en').length>25,'missing clarifier '+q)}
const es=[
['Necesito ayuda para pagar la renta','/es/ayuda-vivienda/'],['Necesito cuidado infantil despues de clases','/es/jovenes-familias/'],['Busco parques y senderos','/es/aire-libre/'],['Necesito ayuda legal y un abogado','/es/ayuda-legal/'],['Busco un veterinario para mi perro','/es/directorio/'],['Quiero encontrar un restaurante local','/es/directorio/'],['Cuando es la proxima reunion de la ciudad','/es/comunidad/']];
for(const [q,w] of es){const d=R.direct(q,'es');assert(d&&d.text.length>70,'weak es answer '+q);const got=hits(q,'es');assert(got.slice(0,3).some(x=>x.rec.p===w),q+' -> '+got.slice(0,3).map(x=>x.rec.p).join(','));assert(R.clarification(q,'es').length>20,'missing es clarifier '+q)}
assert(R.shouldSearchProfiles('Find a dentist in Franklin'));
assert(R.shouldSearchProfiles('I need a plumber near me'));
assert(R.shouldSearchProfiles('I need a lawyer for a housing problem'));
assert(!R.shouldSearchProfiles('I need the zoning record for my property'));
assert(R.researchNeeded('Find a local restaurant open now','high'));
assert(R.researchNeeded('When is the next city meeting?','high'));
assert(!R.researchNeeded('I need a lawyer for a housing problem','high'));
assert(!hits('I am behind on rent').slice(0,3).some(x=>/member|growth-desk/.test(x.rec.p)));
console.log(JSON.stringify({ok:true,version:R.VERSION,newEnglishCases:cases.length,newSpanishCases:es.length,assertions:cases.length*2+es.length*3+8}));
