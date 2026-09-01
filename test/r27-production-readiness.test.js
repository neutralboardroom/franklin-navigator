'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','server.js'),'utf8');
test('production health rejects an unready database',()=>{assert.match(source,/healthy\?200:503/);assert.match(source,/await query\('select 1 ok'\)/);assert.match(source,/startupReady:!readyError/);});
test('retired payment-link synchronization fails closed',()=>{assert.match(source,/LEGACY_PAYMENT_LINK_SYNC_RETIRED/);assert.match(source,/server-created Stripe Checkout Sessions/);assert.equal(source.includes('any($1::text[])'),false);});
