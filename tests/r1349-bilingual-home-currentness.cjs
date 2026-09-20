#!/usr/bin/env node
const fs=require('fs');
const assert=require('assert');
const sealDay='2026-09-20';
function homeCards(path){
  const s=fs.readFileSync(path,'utf8');
  const m=s.match(/data-home-events="">([\s\S]*?)<\/div><div class="r24-event-empty"/);
  assert(m,`${path}: home-event grid missing`);
  return [...m[1].matchAll(/<article\b([\s\S]*?)<\/article>/g)].map(x=>{
    const h=x[0];
    const get=n=>{const z=h.match(new RegExp(`${n}="([^"]+)"`));return z&&z[1]};
    const href=(h.match(/<a href="([^"]+)"/)||[])[1];
    return {start:get('data-event-start'),end:get('data-event-end'),href,html:h};
  });
}
const en=homeCards('dist/index.html');
const es=homeCards('dist/es/index.html');
assert(en.length>0 && es.length>0,'home-event cards must exist');
for(const [lang,cards] of [['en',en],['es',es]]){
  for(const c of cards){
    assert(c.start && c.end && c.href,`${lang}: event card missing currentness/source fields`);
    assert(!Number.isNaN(Date.parse(c.start)) && !Number.isNaN(Date.parse(c.end)),`${lang}: invalid event dates`);
    assert(c.end.slice(0,10)>=sealDay,`${lang}: already-expired static homepage card at release seal: ${c.end}`);
    assert(/^https:\/\//.test(c.href),`${lang}: current item must link to source`);
  }
}
const key=c=>`${c.start}|${c.end}|${c.href}`;
assert.deepStrictEqual(en.map(key).sort(),es.map(key).sort(),'English/Spanish static home-event source/date sets drifted');
const esHtml=fs.readFileSync('dist/es/index.html','utf8');
assert(!esHtml.includes('Extensión de Franklin Splash Park — 8 al 11 de septiembre'),'expired Spanish Splash Park card returned');
assert(esHtml.includes('Inscripción de invierno de tenis juvenil de WCPR'),'current WCPR registration missing from Spanish homepage');
for(const p of ['dist/index.html','dist/es/index.html']){
  const s=fs.readFileSync(p,'utf8');
  assert(s.includes('/assets/r24.js'),`${p}: runtime expiry guard missing`);
}
console.log(JSON.stringify({result:'PASS',sealDay,enCards:en.length,esCards:es.length,parity:true}));