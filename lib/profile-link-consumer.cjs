'use strict';
// Pure, edition-bound consumer validation. This is not a canonical fact store or publication gate.
// Callers still require the separate exact-snapshot acceptance before using any candidate publicly.
const {safeWebsite,validDate}=require('../dist/assets/local-discovery-core.js');
const groups=['website_links','action_links','social_links','source_links'];
const short=(v,n=300)=>typeof v==='string'&&!/[\u0000-\u001f<>]/.test(v)&&v.length<=n?v.trim():'';
function qualify(profile,{asOf}={}){
  if(!validDate(asOf))throw Error('Explicit observation date required');
  if(!profile||!['FR-PF','FRANKLIN_TN'].includes(profile.community_lane)||typeof profile.profile_id!=='string'||!profile.profile_id.startsWith('FR-')||profile.eligible_for_public_projection!==true)throw Error('Wrong or held profile scope');
  if(/HELD|EXPIRED|SUPPRESSED|RECHECK_REQUIRED|REQUIRES_RECHECK|CONFLICT|WITHDRAWN/i.test(profile.currentness_state||''))throw Error('Profile currentness hold');
  const bundle=profile.profile_link_routes;if(!bundle||bundle.evidence_authority!=='PROFILE_FACTORY')throw Error('Wrong link authority');
  const out={profileId:profile.profile_id,community:'FRANKLIN_TN',asOf,qualified:[],held:[],publicationAuthorized:false,outreachAuthorized:false};
  const seen=new Set();
  for(const group of groups){
    if(bundle[group]!=null&&!Array.isArray(bundle[group]))throw Error('Malformed route group');
    for(const route of bundle[group]||[]){
      let reason='';const url=safeWebsite(route?.url),scope=short(route?.route_scope),label=short(route?.display_label),org=short(route?.organization_binding);
      if(!route||route.safe_to_render!==true)reason='NOT_SAFE_TO_RENDER';
      else if(route.profile_id&&route.profile_id!==profile.profile_id)reason='PROFILE_BINDING_MISMATCH';
      else if(!url||!scope||!label)reason='MISSING_SAFE_URL_SCOPE_OR_LABEL';
      else if(/HELD|EXPIRED|SUPPRESSED|RECHECK_REQUIRED|REQUIRES_RECHECK|CONFLICT|WITHDRAWN/i.test(route.currentness_state||''))reason='CURRENTNESS_HOLD';
      else if(route.review_by&&(!validDate(route.review_by)||route.review_by<asOf))reason='EXPIRED_OR_INVALID_REVIEW_DATE';
      else if(/ORGANIZATION_SHARED|PARENT_ORGANIZATION_SHARED|BRAND_SHARED|AUTHORITY_SHARED/.test(scope)&&!org)reason='SHARED_ORGANIZATION_REQUIRED';
      else if(group==='source_links'&&(!short(route.lookup_identifier)||!validDate(route.record_as_of)||route.not_profile_website!==true||route.requires_user_search!==true))reason='LOOKUP_DISCLOSURE_REQUIRED';
      else if(String(route.platform||'').toLowerCase()==='spotify')reason='OPTIONAL_SPOTIFY_REQUIRES_SEPARATE_CATEGORY_AND_OFFICIAL_BINDING';
      if(reason){out.held.push({group,reason});continue}
      const key=group+'\0'+url+'\0'+scope+'\0'+org;if(seen.has(key))continue;seen.add(key);
      out.qualified.push({group,url,label,scope,organization:org,shared:/SHARED/.test(scope),lookup:group==='source_links'?{identifier:short(route.lookup_identifier),recordAsOf:route.record_as_of,requiresUserSearch:true,notCredentialVerification:true}:null});
    }
  }
  return out;
}
module.exports={qualify};
