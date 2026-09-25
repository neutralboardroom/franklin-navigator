'use strict';
const fs=require('node:fs'),path=require('node:path');
const FILE=path.join(__dirname,'../data/profile-identity-safety.json');let cached=null;
function load(){if(cached)return cached;const j=JSON.parse(fs.readFileSync(FILE,'utf8'));if(j.schemaVersion!=='franklin.profile-identity-safety.v1'||j.community!=='FRANKLIN_TN')throw Error('PROFILE_IDENTITY_SAFETY_INVALID');cached={aliases:Object.freeze({...j.aliases}),holds:new Set(j.holds||[])};return cached}
function status(id){const p=String(id||''),s=load();if(Object.hasOwn(s.aliases,p))return{state:'ALIAS',canonicalProfileId:s.aliases[p]};if(s.holds.has(p))return{state:'HOLD_REVIEW'};return{state:'CLAIMABLE'}}
function assertClaimableProfile(id,fail){const s=status(id);if(s.state==='ALIAS')fail('PROFILE_CANONICAL_REDIRECT',409,'This listing has been reconciled to a canonical Franklin profile. Open the current profile before requesting access.');if(s.state==='HOLD_REVIEW')fail('PROFILE_IDENTITY_REVIEW',409,'Franklin Navigator is reconciling this listing with another possible profile. Management access is temporarily unavailable until the identity review is complete.');return id}
module.exports={loadProfileIdentitySafety:load,profileIdentityStatus:status,assertClaimableProfile};
