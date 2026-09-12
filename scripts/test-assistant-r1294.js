'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
global.window={};require('../dist/assets/franklin-assistant-core.js');require('../dist/assets/franklin-assistant-r1293-core.js');require('../dist/assets/franklin-assistant-r1294-core.js');
const C=window.FranklinAssistantCore,R=window.FranklinAssistantR1294Core;
const rec=[0,1,2,3].flatMap(i=>JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/data/assistant-routes-0'+i+'.json'),'utf8')).records);
function hits(q,lang='en'){const seen=new Set(),h=[];for(const p of R.preferredRoutes(q,lang)){const r=rec.find(x=>x.l===lang&&x.p===p);if(r&&!seen.has(p)){seen.add(p);h.push({rec:r,score:200})}}for(const x of C.rankRoutes(rec,q,lang,12))if(!seen.has(x.rec.p)){seen.add(x.rec.p);h.push(x)}return R.rerank(R.cleanRouteHits(h),q,6)}
const cases=[
['I need a permit for a fence','/permits-home/'],['Do I need a permit for a deck?','/permits-home/'],['Which school is my address zoned for?','/school-enrollment/'],['I just moved to Franklin and need to set up water and electricity','/new-to-franklin/'],['When is brush pickup?','/everyday-help/'],['Where can I play pickleball?','/sports/pickleball/'],['I need a youth soccer league','/sports/youth-leagues/'],['My mother is 78 and cannot drive to appointments','/senior-caregiver/'],['I lost my job and need help with bills and insurance','/life-change-plans/job-loss-coverage-household/'],['I was in a car accident yesterday','/help/auto/crash-next-steps/'],['How do I check whether my car has a recall?','/help/auto/recall-safety/'],['The dealer sold me a used car with a warranty problem','/life-change-plans/used-vehicle-purchase-problem/'],['My health insurance denied coverage and I need to appeal','/help/health/coverage-appeal/'],['I am leaving the hospital tomorrow and need a plan','/help/health/discharge-transition/'],['I was served court papers','/help/legal/court-notice-roadmap/'],['I have a dispute with my contractor about home repairs','/help/legal/housing-consumer-dispute/'],['I think I was scammed','/life-change-plans/fraud-scam-consumer-recovery/'],['I want to start a business in Franklin','/start-a-business/'],['I need more local customers for my business','/local-growth-engine/'],['I need to correct my business profile','/claim-profile/'],['How do I cancel my membership?','/member-account/'],['What events are happening this weekend?','/today/']];
for(const [q,w] of cases){const got=hits(q);assert(got.length,q);assert(got.slice(0,3).some(x=>x.rec.p===w),q+' -> '+got.slice(0,3).map(x=>x.rec.p).join(','));const d=R.direct(q,'en');assert(d&&d.text&&d.text.length>70,'weak direct '+q)}
const esCases=[
['Necesito un permiso para una cerca','/es/ayuda-vivienda/'],
['Que escuela le corresponde a mi direccion','/es/busquedas-oficiales/'],
['Me mude a Franklin y necesito conectar agua y electricidad','/es/ayuda-cotidiana/'],
['Cuando recogen las ramas y la basura','/es/ayuda-cotidiana/'],
['Donde puedo jugar pickleball','/es/deportes/pickleball/'],
['Necesito una liga de futbol para jovenes','/es/deportes/ligas-juveniles/'],
['Mi madre es mayor y no puede conducir a sus citas','/es/plan-cuidado-apoyo/'],
['Perdi mi trabajo y necesito ayuda con ingresos','/es/plan-trabajo-ingresos/'],
['Tuve un accidente de auto ayer','/es/ayuda-vehiculo/'],
['Mi seguro de salud nego la cobertura y quiero apelar','/es/preparacion-apelacion/'],
['Me notificaron con papeles del tribunal','/es/organizador-avisos-reclamos/'],
['Creo que fui victima de una estafa','/es/cronologia-evidencia/'],
['Quiero abrir un negocio en Franklin','/es/negocios/'],
['Necesito corregir mi perfil de negocio','/es/correcciones/'],
['Que eventos hay este fin de semana','/es/hoy/']
];
for(const [q,w] of esCases){const got=hits(q,'es');assert(got.length,q);assert(got.slice(0,3).some(x=>x.rec.p===w),q+' -> '+got.slice(0,3).map(x=>x.rec.p).join(','));const d=R.direct(q,'es');assert(d&&d.text&&d.text.length>70,'weak Spanish direct '+q);assert(/[áéíóúñ]|Franklin|Ciudad|Membres|seguro|permiso|escuela|transporte|estafa/i.test(d.text),'Spanish answer missing '+q)}

assert(R.researchNeeded('What time is City Hall open today?','high'));
assert(R.researchNeeded('What events are happening this weekend?','high'));
assert(!R.researchNeeded('I was served court papers','high'));
assert(R.shouldSearchProfiles('Find a dentist in Franklin'));
assert(R.shouldSearchProfiles('What is the phone number for a plumber?'));
assert(!R.shouldSearchProfiles('I need a fence permit'));
assert(!hits('I need a fence permit').slice(0,3).some(x=>/member|business-growth|growth-desk/.test(x.rec.p)));
console.log(JSON.stringify({ok:true,version:R.VERSION,routeCases:cases.length,spanishRouteCases:esCases.length,totalAssertions:cases.length*2+esCases.length*4+6}));
