'use strict';
const assert=require('node:assert/strict');
const X=require('../dist/assets/franklin-assistant-context-r1317.js');
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s'&.-]/g,' ').replace(/\s+/g,' ').trim();
const C={
  norm,
  serviceFor(raw){
    const t=norm(raw);
    if(/\b(roofer|roofing)\b/.test(t))return{q:'roofing'};
    if(/\b(plumber|plumbing)\b/.test(t))return{q:'plumber'};
    if(/\b(electrician|electrical)\b/.test(t))return{q:'electrician'};
    if(/\b(vet|veterinarian)\b/.test(t))return{q:'veterinary'};
    return null;
  },
  concepts(raw){
    const t=norm(raw),out=[];
    if(/\b(recycling|recycle|trash|garbage|sanitation|reciclaje|basura|saneamiento)\b/.test(t))out.push('sanitation');
    if(/\b(transportation|transit|bus|transporte|autobus)\b/.test(t))out.push('transport');
    if(/\b(school|escuela)\b/.test(t))out.push('school');
    if(/\b(permit|permiso)\b/.test(t))out.push('permit');
    if(/\b(park|parque)\b/.test(t))out.push('parks');
    return out;
  }
};
const ctx=(raw,state)=>X.contextualize(raw,state,C);
const base=(lastEffective,lastService=null,lastTopics=[])=>({lastEffective,lastService,lastTopics});

let out=ctx('what about brush pickup?',base('How does recycling work in Franklin?',null,['sanitation']));
assert.match(out,/recycling work in Franklin/i);
assert.match(out,/brush pickup/i);

out=ctx('what number should I call?',base('Who handles water service problems in Franklin?',null,['utilities']));
assert.match(out,/water service problems/i);
assert.match(out,/what number should I call/i);

out=ctx('¿y la recolección de ramas?',base('¿Cómo funciona el reciclaje en Franklin?',null,['sanitation']));
assert.match(out,/reciclaje en Franklin/i);
assert.match(out,/recolección de ramas/i);

out=ctx('¿hay servicio accesible?',base('¿Qué transporte público hay en Franklin?',null,['transport']));
assert.match(out,/transporte público/i);
assert.match(out,/servicio accesible/i);

out=ctx('What time is City Hall open?',base('My roof is leaking.',{q:'roofing'},[]));
assert.equal(out,'What time is City Hall open?');

out=ctx('Where are the parks?',base('I need a plumber.',{q:'plumber'},[]));
assert.equal(out,'Where are the parks?');

out=ctx('I need it fixed.',base('My roof is leaking.',{q:'roofing'},[]));
assert.match(out,/My roof is leaking/i);
assert.match(out,/I need it fixed/i);

assert.equal(X.inferService('There is water leaking from a pipe under my sink.',C)?.q,'plumber');
assert.equal(X.inferService('My car will not start and the battery is dead.',C)?.q,'auto repair');
assert.equal(X.inferService('My dog is sick and needs help.',C)?.q,'veterinary');
assert.equal(X.serviceActionFollow('I need it repaired.',C),true);
assert.equal(X.serviceActionFollow('What time is City Hall open?',C),false);

console.log(JSON.stringify({ok:true,version:X.VERSION,cases:12}));
