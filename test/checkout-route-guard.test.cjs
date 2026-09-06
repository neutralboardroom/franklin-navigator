'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const guard=fs.readFileSync(path.join(__dirname,'../scripts/scc-runtime-route-guard.mjs'));
const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
function check(source){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'franklin-route-guard-'));try{fs.mkdirSync(path.join(dir,'scripts'));fs.writeFileSync(path.join(dir,'scripts/scc-runtime-route-guard.mjs'),guard);fs.writeFileSync(path.join(dir,'server.js'),source);const r=spawnSync(process.execPath,[path.join(dir,'scripts/scc-runtime-route-guard.mjs')],{encoding:'utf8',timeout:5000});return{status:r.status,source:fs.readFileSync(path.join(dir,'server.js'),'utf8')};}finally{fs.rmSync(dir,{recursive:true,force:true});}}
test('HF1 exact frozen-origin route survives actual npm-start guard byte-identically',()=>{const r=check(server);assert.equal(r.status,0);assert.equal(r.source,server);});
test('guard rejects a wrong cancel destination',()=>{const r=check(server.replace("publicOrigin+'/membership-enroll/?checkout=canceled'","publicOrigin+'/wrong-page/?checkout=canceled'"));assert.notEqual(r.status,0);});
test('guard rejects duplicate checkout cancel assignments',()=>{const r=check(server+"\nparams.set('cancel_url',publicOrigin+'/membership-enroll/?checkout=canceled');\n");assert.notEqual(r.status,0);});
test('guard preserves earlier supported route correction',()=>{const r=check("params.set('cancel_url',PUBLIC_ORIGIN+'/membership-enrollment/?checkout=canceled');");assert.equal(r.status,0);assert.equal(r.source,"params.set('cancel_url',PUBLIC_ORIGIN+'/membership-enroll/?checkout=canceled');");});
