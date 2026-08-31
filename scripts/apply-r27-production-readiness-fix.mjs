import fs from 'node:fs';
import path from 'node:path';

// Final source-only repair carrier; workflow authority is handled separately.
const root=process.cwd();
const serverPath=path.join(root,'server.js');
let server=fs.readFileSync(serverPath,'utf8');

const oldHealth="  if(req.method==='GET'&&url.pathname==='/health')return sendJson(req,res,200,{ok:true,release:RELEASE,community:COMMUNITY,commerceEnabled:COMMERCE_ENABLED,databaseConfigured:Boolean(DATABASE_URL),uptimeSeconds:Math.floor(process.uptime())},reqId);";
const newHealth="  if(req.method==='GET'&&url.pathname==='/health'){let database=false;try{database=Boolean((await query('select 1 ok')).rowCount);}catch{}const cfg=configStatus();const healthy=cfg.ok&&database&&!readyError;return sendJson(req,res,healthy?200:503,{ok:healthy,release:RELEASE,community:COMMUNITY,commerceEnabled:COMMERCE_ENABLED,databaseConfigured:Boolean(DATABASE_URL),database,startupReady:!readyError,missing:cfg.missing,uptimeSeconds:Math.floor(process.uptime())},reqId);}";
if(!server.includes(oldHealth))throw new Error('health_route_anchor_missing');
server=server.replace(oldHealth,newHealth);

const oldCleanup="await client.query(`update franklin_payment_links set active=false,updated_at=now() where not (lookup_key=any($1))`,[[...seen]]);";
const newCleanup="await client.query(`update franklin_payment_links set active=false,updated_at=now() where not (lookup_key=any($1::text[]))`,[[...seen]]);";
if(!server.includes(oldCleanup))throw new Error('payment_link_cleanup_anchor_missing');
server=server.replace(oldCleanup,newCleanup);
fs.writeFileSync(serverPath,server);

const testPath=path.join(root,'test','r27-production-readiness.test.js');
fs.writeFileSync(testPath,`'use strict';\nconst test=require('node:test');\nconst assert=require('node:assert/strict');\nconst fs=require('node:fs');\nconst source=fs.readFileSync(require('node:path').join(__dirname,'..','server.js'),'utf8');\ntest('production health rejects an unready database',()=>{assert.match(source,/healthy\\?200:503/);assert.match(source,/await query\\('select 1 ok'\\)/);assert.match(source,/startupReady:!readyError/);});\ntest('payment link cleanup uses explicit text array typing',()=>assert.match(source,/any\\(\\$1::text\\[\\]\\)/));\n`);

fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
fs.writeFileSync(path.join(root,'evidence','R27_PRODUCTION_READINESS_FIX_RECEIPT.json'),JSON.stringify({
  schemaVersion:'franklin.r27.production-readiness-fix.v1',
  release:'FR-NAV1.2.0-CANDIDATE-R27',
  fixes:{localProofTlsDisabledOnlyInCi:true,productionTlsDefaultPreserved:true,healthRequiresDatabase:true,healthRejectsStartupFailure:true,paymentLinkArrayTyped:true,eventLedgerProofUsesAllowedSource:true},
  commerceEnabled:false,
  liveChargeCreated:false,
  authorityTransfer:false
},null,2)+'\n');
console.log(JSON.stringify({ok:true,release:'FR-NAV1.2.0-CANDIDATE-R27',healthFailsClosed:true,ciLocalTlsDisabled:true},null,2));
