#!/usr/bin/env python3
from pathlib import Path
import re

p=Path('lib/member-fulfillment.js')
s=p.read_text(encoding='utf-8')
original=s
s=s.replace("const VERSION='FRANKLIN_MEMBER_FULFILLMENT_HF2';","const VERSION='FRANKLIN_MEMBER_FULFILLMENT_HF3_3';")

old="""function fields(input){
  if(!input||Array.isArray(input)||typeof input!=='object')fail('FIELDS_REQUIRED');
  const limits={summary:1200,services:800,languages:160,website:1200,contactUrl:1200,bookingUrl:1200};
  if(Object.keys(input).some(k=>!Object.hasOwn(limits,k)))fail('FIELD_NOT_EDITABLE');
  const out={};for(const k of Object.keys(limits)){out[k]=['website','contactUrl','bookingUrl'].includes(k)?publicUrl(input[k]??''):text(typeof input[k]==='string'?input[k].replace(/[\\r\\n\\t]+/g,' '):(input[k]??''),limits[k]);}
  if(out.summary.length<20)fail('SUMMARY_TOO_SHORT');return out;
}
"""
new="""function publicUrlList(value,maxItems=12){
  if(value==null||value==='')return '';
  if(typeof value!=='string')fail('PUBLIC_URL_INVALID');
  const items=value.split(/\\r?\\n/).map(v=>v.trim()).filter(Boolean);
  if(items.length>maxItems)fail('FIELD_INVALID');
  return items.map(v=>publicUrl(v,true)).join('\\n');
}
function fields(input){
  if(!input||Array.isArray(input)||typeof input!=='object')fail('FIELDS_REQUIRED');
  const limits={summary:1600,tagline:180,services:2400,hours:600,serviceArea:600,accessibility:800,languages:300,pricing:800,experience:1600,credentials:1600,awards:1200,associations:1200,education:1200,publications:1600,offersEvents:1600,website:1200,contactUrl:1200,bookingUrl:1200,quoteUrl:1200,menuUrl:1200,orderUrl:1200,directionsUrl:1200,profileImageUrl:1200,galleryUrls:4000,socialLinks:4000};
  const urlFields=new Set(['website','contactUrl','bookingUrl','quoteUrl','menuUrl','orderUrl','directionsUrl','profileImageUrl']);
  const urlListFields=new Set(['galleryUrls','socialLinks']);
  if(Object.keys(input).some(k=>!Object.hasOwn(limits,k)))fail('FIELD_NOT_EDITABLE');
  const out={};
  for(const k of Object.keys(limits)){
    if(urlFields.has(k))out[k]=publicUrl(input[k]??'');
    else if(urlListFields.has(k))out[k]=publicUrlList(input[k]??'',k==='galleryUrls'?8:12);
    else out[k]=text(typeof input[k]==='string'?input[k].replace(/[\\r\\n\\t]+/g,' '):(input[k]??''),limits[k]);
  }
  if(out.summary.length<20)fail('SUMMARY_TOO_SHORT');return out;
}
"""
if old not in s:
    raise SystemExit('Expected fields() block not found')
s=s.replace(old,new)

pub_marker=""" async function publication(c,p,accountId=null){const r=(await c.query(`select p.revision,p.fields,p.fields_sha256,p.published_at from franklin_member_publications p join franklin_accounts a using(account_id) join franklin_profile_links l on l.account_id=p.account_id and l.profile_id=p.profile_id join franklin_memberships m on m.account_id=p.account_id and m.profile_id=p.profile_id join franklin_entitlements e using(membership_id) where p.profile_id=$1 and ($2::text is null or p.account_id=$2) and p.removed_at is null and a.state='ACTIVE' and l.authority_state='VERIFIED' and e.access_state='ACTIVE' and e.rich_profile=true and (e.expires_at is null or e.expires_at>now()) and m.status in ('ACTIVE','ACTIVE_CANCELING','GRACE') and (m.current_period_end is null or m.current_period_end>now())`,[p,accountId])).rows[0];return r?{...r,provenance:'MEMBER_SUBMITTED_REVIEWED',profileId:p,profileName:scope.profiles[p].name}:null;}
"""
if pub_marker not in s:
    raise SystemExit('publication() marker not found')
entitlement=""" async function publicEntitlement(c,p){
   const r=(await c.query(`select m.status,m.current_period_end,e.access_state,e.rich_profile,e.expires_at from franklin_memberships m join franklin_entitlements e using(membership_id) join franklin_accounts a using(account_id) join franklin_profile_links l on l.account_id=m.account_id and l.profile_id=m.profile_id where m.profile_id=$1 and a.state='ACTIVE' and l.authority_state='VERIFIED' and e.access_state='ACTIVE' and e.rich_profile=true and (e.expires_at is null or e.expires_at>now()) order by m.updated_at desc limit 1`,[p])).rows[0];
   return Boolean(r&&accessAllowed(r.status,r.current_period_end));
 }
"""
s=s.replace(pub_marker,pub_marker+entitlement)

old_route="if(req.method==='GET'&&url.pathname==='/api/member/public-profile'){const p=profile(url.searchParams.get('profileId'));return send(200,{publication:await publication({query},p)});}"
new_route="if(req.method==='GET'&&url.pathname==='/api/member/public-profile'){const p=profile(url.searchParams.get('profileId'));return send(200,{activePaidMember:await publicEntitlement({query},p),publication:await publication({query},p)});}"
if old_route not in s:
    raise SystemExit('public-profile route marker not found')
s=s.replace(old_route,new_route)

if s==original:
    raise SystemExit('No runtime changes applied')
p.write_text(s,encoding='utf-8')
print('HF3.3 member runtime patch applied')
