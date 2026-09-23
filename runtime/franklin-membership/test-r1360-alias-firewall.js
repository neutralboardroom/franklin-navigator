'use strict';
const assert=require('node:assert/strict');
const {loadProfileAliases,canonicalProfileId}=require('./lib/profile-aliases');
const {loadProfileScope}=require('./lib/profile-scope');
const map=loadProfileAliases(),scope=loadProfileScope().profiles;
assert.equal(map.size,100);
for(const [a,c] of map){assert.equal(canonicalProfileId(a,map),c);assert.ok(scope[c],`canonical profile missing ${c}`);assert.ok(!scope[a],`retired alias remained in runtime scope ${a}`);}
console.log(JSON.stringify({ok:true,aliasCount:map.size,canonicalScopeCount:Object.keys(scope).length}));
