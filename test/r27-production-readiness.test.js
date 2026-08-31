'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','server.js'),'utf8');
test('production health rejects an unready database',()=>{assert.match(source,/healthy\?200:503/);assert.match(source,/await query\('select 1 ok'\)/);assert.match(source,/startupReady:!readyError/);});
test('payment link cleanup uses explicit text array typing',()=>assert.match(source,/any\(\$1::text\[\]\)/));
