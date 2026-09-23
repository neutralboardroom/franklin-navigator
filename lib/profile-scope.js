'use strict';
const fs=require('node:fs');
const path=require('node:path');
const COMMUNITY='FRANKLIN_TN';
function loadProfileScope(){
  const base=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/member-profile-scope.json'),'utf8'));
  const overlay=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/member-profile-scope-overlay.json'),'utf8'));
  const aliasDoc=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/profile-aliases-r1360.json'),'utf8'));
  if(base.community!==COMMUNITY||overlay.community!==COMMUNITY||aliasDoc.community!==COMMUNITY||aliasDoc.schema!=='franklin.runtime-profile-aliases.v1'||!base.profiles||!overlay.profiles||!aliasDoc.aliases)throw Error('PROFILE_SCOPE_INVALID');
  const profiles={...base.profiles};
  for(const [id,row] of Object.entries(overlay.profiles)){
    if(profiles[id]&&profiles[id].name!==row.name)throw Error('PROFILE_SCOPE_OVERLAY_CONFLICT');
    profiles[id]=row;
  }
  const aliases=Object.freeze({...aliasDoc.aliases});
  const heldProfileIds=Object.freeze([...(aliasDoc.heldProfileIds||[])]);
  for(const [aliasId,canonicalId] of Object.entries(aliases)){
    if(!profiles[canonicalId])throw Error('PROFILE_ALIAS_CANONICAL_MISSING:'+aliasId);
    delete profiles[aliasId];
  }
  for(const id of heldProfileIds)delete profiles[id];
  return {community:COMMUNITY,profileCount:Object.keys(profiles).length,profiles,aliases,heldProfileIds,profileQualityRelease:aliasDoc.sourceRelease,profileQualityArtifactSha256:aliasDoc.sourceArtifactSha256,sourcePublicCommit:overlay.sourcePublicCommit||base.sourcePublicCommit,baseSourcePublicCommit:base.sourcePublicCommit};
}
module.exports={COMMUNITY,loadProfileScope};
