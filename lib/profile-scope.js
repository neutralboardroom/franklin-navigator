'use strict';
const fs=require('node:fs');
const path=require('node:path');
const COMMUNITY='FRANKLIN_TN';
function loadProfileScope(){
  const base=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/member-profile-scope.json'),'utf8'));
  const overlay=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/member-profile-scope-overlay.json'),'utf8'));
  if(base.community!==COMMUNITY||overlay.community!==COMMUNITY||!base.profiles||!overlay.profiles)throw Error('PROFILE_SCOPE_INVALID');
  const profiles={...base.profiles};
  for(const [id,row] of Object.entries(overlay.profiles)){
    if(profiles[id]&&profiles[id].name!==row.name)throw Error('PROFILE_SCOPE_OVERLAY_CONFLICT');
    profiles[id]=row;
  }
  return {community:COMMUNITY,profileCount:Object.keys(profiles).length,profiles,sourcePublicCommit:overlay.sourcePublicCommit||base.sourcePublicCommit,baseSourcePublicCommit:base.sourcePublicCommit};
}
module.exports={COMMUNITY,loadProfileScope};
