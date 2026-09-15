'use strict';
const fs=require('node:fs');
const path=require('node:path');

const DEFAULT_REGISTRY_PATH=path.join(__dirname,'../data/member-control-profiles.json');

function loadControlProfileRegistry(filePath=DEFAULT_REGISTRY_PATH){
  const parsed=JSON.parse(fs.readFileSync(filePath,'utf8'));
  if(parsed?.schema!=='franklin.member-control-profiles.v1'||parsed?.community!=='FRANKLIN_TN'||!Array.isArray(parsed.profiles))throw Error('CONTROL_PROFILE_REGISTRY_INVALID');
  const map=new Map();
  for(const row of parsed.profiles){
    if(!row||!/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(String(row.profileId||''))||row.productionEvidenceEligible!==false||map.has(row.profileId))throw Error('CONTROL_PROFILE_REGISTRY_INVALID');
    map.set(row.profileId,Object.freeze({profileId:row.profileId,purpose:String(row.purpose||'CONTROL_PROFILE').slice(0,120),productionEvidenceEligible:false}));
  }
  return map;
}
function isControlProfile(profileId,registry=loadControlProfileRegistry()){return registry.has(String(profileId||''));}
function isProductionProfile(profileNames,profileId,registry=loadControlProfileRegistry()){
  return Boolean(profileNames&&Object.hasOwn(profileNames,String(profileId||''))&&!isControlProfile(profileId,registry));
}
function productionProfileRows(rows,profileNames,registry=loadControlProfileRegistry()){
  return (Array.isArray(rows)?rows:[]).filter(row=>isProductionProfile(profileNames,row?.profile_id,registry));
}
module.exports={DEFAULT_REGISTRY_PATH,loadControlProfileRegistry,isControlProfile,isProductionProfile,productionProfileRows};
