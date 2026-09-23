'use strict';
const fs=require('node:fs');
const path=require('node:path');
const DEFAULT_PATH=path.join(__dirname,'../data/profile-aliases-r1360.json');
function loadProfileAliases(filePath=DEFAULT_PATH){
  const parsed=JSON.parse(fs.readFileSync(filePath,'utf8'));
  if(parsed?.schema!=='franklin.profile-aliases.r1360.v1'||parsed?.community!=='FRANKLIN_TN'||!parsed?.aliases||typeof parsed.aliases!=='object')throw Error('PROFILE_ALIAS_MAP_INVALID');
  const map=new Map(Object.entries(parsed.aliases));
  if(map.size!==100)throw Error('PROFILE_ALIAS_MAP_COUNT_INVALID');
  for(const [a,c] of map){if(a===c||map.has(c))throw Error('PROFILE_ALIAS_MAP_CHAIN_INVALID');}
  return map;
}
function canonicalProfileId(value,map){const id=String(value||'').trim();return map?.get(id)||id;}
module.exports={DEFAULT_PATH,loadProfileAliases,canonicalProfileId};
