'use strict';
// Local-owned member enrichment. This module never edits Profile Factory source facts.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const net=require('node:net');
const {loadProfileScope}=require('./profile-scope');
const {assertClaimableProfile}=require('./profile-identity-safety');
// R1352: preserve existing claim authority while completing the private reviewer handoff and queue context.
const VERSION='FRANKLIN_MEMBER_FULFILLMENT_HF3_9';
const COMMUNITY='FRANKLIN_TN';
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const fail=(code,status=400)=>{throw Object.assign(new Error(code),{code,status});};
function text(value,max,min=0){if(typeof value!=='string'||value.length>max||value.trim().length<min||/[<>\u0000-\u001f\u007f]/.test(value))fail('FIELD_INVALID');return value.trim();}
function publicUrl(value,required=false){
  if(value===''&&!required)return '';
  let u;try{u=new URL(text(value,1200,required?1:0));}catch{fail('PUBLIC_URL_INVALID');}
  if(u.protocol!=='https:'||u.username||u.password||u.port||net.isIP(u.hostname)||!u.hostname.includes('.')||/(^|\.)(localhost|local|internal|test|invalid|example)$/.test(u.hostname)||/^[\[\]]/.test(u.hostname)||/(?:token|secret|password|session|auth|key)/i.test([...u.searchParams.keys()].join(' ')))fail('PUBLIC_URL_INVALID');
  return u.href;
}
function publicUrlList(value,maxItems=12){
  if(value==null||value==='')return '';
  if(typeof value!=='string')fail('PUBLIC_URL_INVALID');
  const items=value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
  if(items.length>maxItems)fail('FIELD_INVALID');
  return items.map(v=>publicUrl(v,true)).join('\n');
}
function fields(input){
  if(!input||Array.isArray(input)||typeof input!=='object')fail('FIELDS_REQUIRED');
  const limits={summary:1600,tagline:180,services:2400,hours:600,serviceArea:600,accessibility:800,languages:300,pricing:800,experience:1600,credentials:1600,awards:1200,associations:1200,education:1200,publications:1600,offersEvents:1600,specialOfferTitle:140,specialOfferDetails:1200,specialOfferCode:80,specialOfferExpires:20,specialOfferTerms:800,specialOfferUrl:1200,website:1200,contactUrl:1200,bookingUrl:1200,quoteUrl:1200,menuUrl:1200,orderUrl:1200,directionsUrl:1200,profileImageUrl:1200,galleryUrls:4000,socialLinks:4000};
  const urlFields=new Set(['website','contactUrl','bookingUrl','quoteUrl','menuUrl','orderUrl','directionsUrl','profileImageUrl','specialOfferUrl']);
  const urlListFields=new Set(['galleryUrls','socialLinks']);
  if(Object.keys(input).some(k=>!Object.hasOwn(limits,k)))fail('FIELD_NOT_EDITABLE');
  const out={};
  for(const k of Object.keys(limits)){
    if(urlFields.has(k))out[k]=publicUrl(input[k]??'');
    else if(urlListFields.has(k))out[k]=publicUrlList(input[k]??'',k==='galleryUrls'?8:12);
    else out[k]=text(typeof input[k]==='string'?input[k].replace(/[\r\n\t]+/g,' '):(input[k]??''),limits[k]);
  }
  if(out.specialOfferExpires&&!/^\d{4}-\d{2}-\d{2}$/.test(out.specialOfferExpires))fail('FIELD_INVALID');
  if(out.specialOfferTitle&&!out.specialOfferDetails)fail('FIELD_INVALID');
  if(out.specialOfferDetails&&!out.specialOfferTitle)fail('FIELD_INVALID');
  if(out.summary.length<20)fail('SUMMARY_TOO_SHORT');return out;
}
const MANAGER_FIELD_LIMITS=Object.freeze({summary:1200,hours:600,serviceArea:600,publicPhone:60,website:1200,contactUrl:1200,bookingUrl:1200,languages:300,accessibility:800});
function managerFields(input){
  if(input==null)input={};
  if(!input||Array.isArray(input)||typeof input!=='object')fail('FIELDS_REQUIRED');
  if(Object.keys(input).some(k=>!Object.hasOwn(MANAGER_FIELD_LIMITS,k)))fail('FIELD_NOT_EDITABLE');
  const out={};
  for(const [k,max] of Object.entries(MANAGER_FIELD_LIMITS)){
    const value=input[k]??'';
    if(['website','contactUrl','bookingUrl'].includes(k))out[k]=publicUrl(value);
    else out[k]=text(typeof value==='string'?value.replace(/[\r\n\t]+/g,' '):value,max);
  }
  if(out.publicPhone&&!/^[+0-9() .\-xext]{7,60}$/i.test(out.publicPhone))fail('FIELD_INVALID');
  return out;
}
function revision(value){if(!Number.isSafeInteger(value)||value<0)fail('REVISION_REQUIRED');return value;}
function checkRevision(row,expected){if((row?.revision||0)!==revision(expected))fail('VERSION_CONFLICT',409);}
function loadScope(){const scope=loadProfileScope();if(scope.community!==COMMUNITY||!scope.sourcePublicCommit||!scope.profiles||Object.keys(scope.profiles).length!==scope.profileCount)throw Error('PROFILE_SCOPE_INVALID');return scope;}
function createMemberWorkflow(d){
 const {query,tx,requireSession,readBody,sendJson,normalizeProfile,newId,audit,accessAllowed,safeEqual,adminToken,rateLimit,notifyRepresentationDecision}=d;
 const scope=d.scope||loadScope();
 const reviewers=new Set(String(d.reviewers??process.env.MEMBER_REVIEWERS??'').split(',').map(s=>s.trim()).filter(Boolean));
 function profile(id){const p=normalizeProfile(id);if(!Object.hasOwn(scope.profiles,p))fail('PROFILE_NOT_AVAILABLE',404);assertClaimableProfile(p,(code,status,message)=>fail(code,status,message));return p;}
 function reviewer(req){const trusted=d.trustedReviewer?.(req);if(trusted){if(!reviewers.has(trusted))fail('REVIEWER_NOT_CONFIGURED',403);return trusted;}const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!adminToken||!safeEqual(token,adminToken))fail('ADMIN_AUTH_REQUIRED',401);const who=String(req.headers['x-franklin-reviewer']||'');if(!reviewers.has(who))fail('REVIEWER_NOT_CONFIGURED',403);return who;}
 async function lock(c,id){await c.query('select pg_advisory_xact_lock(3316402,hashtext($1))',[id]);}
 async function eligible(c,accountId,p){
   const r=(await c.query(`select m.membership_id,m.status,m.current_period_end,e.access_state,e.rich_profile,e.expires_at,l.authority_state,a.state as account_state from franklin_profile_links l join franklin_accounts a using(account_id) join franklin_memberships m on m.account_id=l.account_id and m.profile_id=l.profile_id join franklin_entitlements e using(membership_id) where l.account_id=$1 and l.profile_id=$2 for update of l,m,e,a`,[accountId,p])).rows[0];
   if(!r){const linked=(await c.query('select authority_state from franklin_profile_links where account_id=$1 and profile_id=$2',[accountId,p])).rows[0];fail(linked?.authority_state==='VERIFIED'?'ACTIVE_MEMBERSHIP_REQUIRED':'PROFILE_VERIFICATION_REQUIRED',403);}if(r.account_state!=='ACTIVE'||r.authority_state!=='VERIFIED')fail('PROFILE_VERIFICATION_REQUIRED',403);
   if(!r.rich_profile||r.access_state!=='ACTIVE'||!accessAllowed(r.status,r.current_period_end)||(r.expires_at&&new Date(r.expires_at).getTime()<=Date.now()))fail('ACTIVE_MEMBERSHIP_REQUIRED',403);return r;
 }
 async function publication(c,p,accountId=null){const r=(await c.query(`select p.revision,p.fields,p.fields_sha256,p.published_at from franklin_member_publications p join franklin_accounts a using(account_id) join franklin_profile_links l on l.account_id=p.account_id and l.profile_id=p.profile_id join franklin_memberships m on m.account_id=p.account_id and m.profile_id=p.profile_id join franklin_entitlements e using(membership_id) where p.profile_id=$1 and ($2::text is null or p.account_id=$2) and p.removed_at is null and a.state='ACTIVE' and l.authority_state='VERIFIED' and e.access_state='ACTIVE' and e.rich_profile=true and (e.expires_at is null or e.expires_at>now()) and m.status in ('ACTIVE','ACTIVE_CANCELING','GRACE') and (m.current_period_end is null or m.current_period_end>now())`,[p,accountId])).rows[0];return r?{...r,provenance:'MEMBER_SUBMITTED_REVIEWED',profileId:p,profileName:scope.profiles[p].name}:null;}
 async function managerPublication(c,p,accountId=null){
   const r=(await c.query(`select l.account_id,l.manager_revision as revision,l.manager_fields as fields,l.manager_updated_at as updated_at
     from franklin_profile_links l join franklin_accounts a using(account_id)
     where l.profile_id=$1 and ($2::text is null or l.account_id=$2)
       and l.authority_state='VERIFIED' and a.state='ACTIVE' and l.manager_revision>0
     order by l.manager_updated_at desc nulls last,l.account_id limit 1`,[p,accountId])).rows[0];
   return r?{revision:Number(r.revision||0),fields:managerFields(r.fields||{}),updatedAt:r.updated_at,provenance:'VERIFIED_MANAGER_DIRECT',profileId:p,profileName:scope.profiles[p].name}:null;
 }
 async function managerHistory(c,a,p){
   return (await c.query(`select revision,action,fields,fields_sha256,previous_fields_sha256,created_at
     from franklin_manager_profile_history where account_id=$1 and profile_id=$2 order by revision desc limit 10`,[a,p])).rows;
 }
 async function publicEntitlement(c,p){
   const r=(await c.query(`select m.status,m.current_period_end,e.access_state,e.rich_profile,e.expires_at from franklin_memberships m join franklin_entitlements e using(membership_id) join franklin_accounts a using(account_id) join franklin_profile_links l on l.account_id=m.account_id and l.profile_id=m.profile_id where m.profile_id=$1 and a.state='ACTIVE' and l.authority_state='VERIFIED' and e.access_state='ACTIVE' and e.rich_profile=true and (e.expires_at is null or e.expires_at>now()) order by m.updated_at desc limit 1`,[p])).rows[0];
   return Boolean(r&&accessAllowed(r.status,r.current_period_end));
 }
 async function history(c,who,kind,a,p,rev,body,hash=null){const receipt=text(body.evidenceReceipt,80,71);if(!/^sha256:[a-f0-9]{64}$/.test(receipt))fail('EVIDENCE_RECEIPT_REQUIRED');const reason=text(body.publicReason,600,10);const decisionId=newId('review');await c.query(`insert into franklin_member_review_history(decision_id,community,kind,account_id,profile_id,revision,decision,evidence_receipt,reviewer_hash,public_reason,fields_sha256) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[decisionId,COMMUNITY,kind,a,p,rev,body.decision,receipt,digest(who),reason,hash]);if(d.persistEvidence)await d.persistEvidence(c,decisionId,body);await audit(c,'REVIEWER',who,'MEMBER_'+kind+'_'+body.decision,'PROFILE',p,null,{revision:rev});return {receipt,reason};}
 const owned=new Set(['/api/member/profiles','/api/member/profile','/api/member/profile/save','/api/member/profile/submit','/api/member/profile/readback','/api/member/manager-profile/save','/api/member/manager-profile/revert','/api/member/representation/request','/api/member/representation/release','/api/member/public-profile','/api/member/sponsored-profiles','/admin/member-review/queue','/admin/member-review/representation','/admin/member-review/content']);
 return {version:VERSION,reviewCoverageConfigured:reviewers.size>0,publication,async route(req,res,url,reqId){
   if(!owned.has(url.pathname))return false;
   const send=(status,obj)=>{sendJson(req,res,status,{ok:true,...obj},reqId);return true;};
   if(req.method==='GET'&&url.pathname==='/api/member/public-profile'){const p=profile(url.searchParams.get('profileId'));const managed=Boolean((await query("select 1 from franklin_profile_links l join franklin_accounts a using(account_id) where l.profile_id=$1 and l.authority_state='VERIFIED' and a.state='ACTIVE' limit 1",[p])).rowCount);return send(200,{managedProfile:managed,activePaidMember:await publicEntitlement({query},p),managerPublication:await managerPublication({query},p),publication:await publication({query},p)});}
   if(req.method==='GET'&&url.pathname==='/api/member/sponsored-profiles'){
     const exclude=String(url.searchParams.get('excludeProfileId')||'').trim();
     const limit=Math.max(1,Math.min(30,Number(url.searchParams.get('limit')||2)||2));
     const rows=(await query(`select distinct m.profile_id
       from franklin_memberships m
       join franklin_accounts a using(account_id)
       join franklin_profile_links l on l.account_id=m.account_id and l.profile_id=m.profile_id
       join franklin_entitlements e using(membership_id)
       where a.state='ACTIVE' and l.authority_state='VERIFIED'
         and m.status in ('ACTIVE','ACTIVE_CANCELING','GRACE')
         and (m.current_period_end is null or m.current_period_end>now())
         and e.access_state='ACTIVE' and e.rich_profile=true
         and (e.expires_at is null or e.expires_at>now())`)).rows;
     const day=new Date().toISOString().slice(0,10),category=String(url.searchParams.get('category')||'').trim().toLowerCase().slice(0,120);
     let candidates=rows.map(r=>String(r.profile_id||'')).filter(p=>p&&p!==exclude&&Object.hasOwn(scope.profiles,p));
     if(category){
       const relevant=candidates.filter(p=>Object.values(scope.profiles[p]||{}).filter(v=>typeof v==='string').join(' ').toLowerCase().includes(category));
       if(relevant.length)candidates=relevant;
     }
     candidates.sort((a,b)=>digest(day+'|'+exclude+'|'+category+'|'+a).localeCompare(digest(day+'|'+exclude+'|'+category+'|'+b)));
     const selected=[];
     for(const p of candidates.slice(0,Math.max(limit*3,limit))){
       const pub=await publication({query},p);
       selected.push({profileId:p,profileName:scope.profiles[p].name,publication:pub});
       if(selected.length>=limit)break;
     }
     return send(200,{placement:'SPONSORED_COMMUNITY_MEMBER',paidPlacement:true,rankingClaim:false,profiles:selected});
   }
   if(url.pathname.startsWith('/admin/member-review/')){
     const who=reviewer(req);
     if(req.method==='GET'&&url.pathname.endsWith('/queue')){
       const kind=url.searchParams.get('kind')==='content'?'content':'representation';const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0||offset>100000)fail('OFFSET_INVALID');
       const table=kind==='content'?'franklin_member_drafts':'franklin_representation_reviews';const state=kind==='content'?'SUBMITTED':'PENDING';
       const rows=kind==='representation'
         ?(await query(`select r.*,a.email_normalized as requester_email,l.authority_state,
             (select count(*)::int from franklin_profile_links other join franklin_accounts oa using(account_id) where other.profile_id=r.profile_id and other.authority_state='VERIFIED' and oa.state='ACTIVE' and other.account_id<>r.account_id) as existing_manager_count,
             (select count(*)::int from franklin_representation_submissions s where s.account_id=r.account_id and s.profile_id=r.profile_id) as submission_count
           from franklin_representation_reviews r
           join franklin_accounts a on a.account_id=r.account_id
           left join franklin_profile_links l on l.account_id=r.account_id and l.profile_id=r.profile_id
           where r.state=$1 and a.community='FRANKLIN_TN' and a.state='ACTIVE'
           order by r.updated_at,r.account_id,r.profile_id limit 51 offset $2`,[state,offset])).rows
         :(await query(`select r.*,a.email_normalized as requester_email from ${table} r join franklin_accounts a on a.account_id=r.account_id where r.state=$1 and a.community='FRANKLIN_TN' and a.state='ACTIVE' order by r.updated_at,r.account_id,r.profile_id limit 51 offset $2`,[state,offset])).rows;
       const countRow=(await query(`select count(*)::int as pending_count from ${table} r join franklin_accounts a on a.account_id=r.account_id where r.state=$1 and a.community='FRANKLIN_TN' and a.state='ACTIVE'`,[state])).rows[0]||{};
       return send(200,{kind,items:rows.slice(0,50),nextOffset:rows.length>50?offset+50:null,pendingCount:Number(countRow.pending_count||0)});
     }
     if(req.method!=='POST')fail('METHOD_NOT_ALLOWED',405);
     const raw=await readBody(req);const b=d.prepareReviewBody?d.prepareReviewBody(req,raw):raw;if(b.community&&b.community!==COMMUNITY)fail('COMMUNITY_MISMATCH');const p=profile(b.profileId),a=text(b.accountId,100,3);
     const result=await tx(async c=>{if(d.assertTrustedReviewer)await d.assertTrustedReviewer(c,req);await lock(c,p);
       if(url.pathname.endsWith('/representation')){
         const row=(await c.query('select * from franklin_representation_reviews where account_id=$1 and profile_id=$2 for update',[a,p])).rows[0];if(!row)fail('REVIEW_NOT_FOUND',404);checkRevision(row,b.expectedRevision);
         if(!['VERIFIED','CHANGES_REQUESTED','REJECTED','REVOKED'].includes(b.decision))fail('DECISION_INVALID');
         if(b.decision==='VERIFIED'&&row.state!=='PENDING')fail('REVIEW_NOT_PENDING',409);
         const h=await history(c,who,'REPRESENTATION',a,p,row.revision,b);
         const target=b.decision==='VERIFIED'?'VERIFIED':b.decision==='REVOKED'?'REVOKED':'PENDING';
         await c.query(`update franklin_profile_links set authority_state=$3,verified_at=case when $3='VERIFIED' then now() else null end,updated_at=now() where account_id=$1 and profile_id=$2`,[a,p,target]);
         await c.query(`update franklin_representation_reviews set state=$3,revision=revision+1,public_reason=$4,reviewed_by_hash=$5,evidence_receipt=$6,updated_at=now() where account_id=$1 and profile_id=$2`,[a,p,b.decision,h.reason,digest(who),h.receipt]);
         const requester=(await c.query('select email_normalized from franklin_accounts where account_id=$1',[a])).rows[0];
         return {state:b.decision,revision:row.revision+1,notification:{accountId:a,profileId:p,profileName:scope.profiles[p].name,email:requester?.email_normalized||'',decision:b.decision,publicReason:h.reason,revision:row.revision}};
       }
       if(!url.pathname.endsWith('/content'))fail('NOT_FOUND',404);
       const row=(await c.query('select * from franklin_member_drafts where account_id=$1 and profile_id=$2 for update',[a,p])).rows[0];if(!row)fail('DRAFT_NOT_FOUND',404);checkRevision(row,b.expectedRevision);
       if(!['PUBLISH','CHANGES_REQUESTED','REMOVE'].includes(b.decision))fail('DECISION_INVALID');
       if(b.decision!=='REMOVE'&&row.state!=='SUBMITTED')fail('REVIEW_NOT_PENDING',409);
       if(b.decision==='PUBLISH'){if(!row.rights_confirmed_at)fail('PUBLICATION_PERMISSION_REQUIRED',409);await eligible(c,a,p);}
       const h=await history(c,who,'CONTENT',a,p,row.revision,b,row.fields_sha256);const next=row.revision+1;
       if(b.decision==='PUBLISH'){
         const prior=(await c.query('select account_id from franklin_member_publications where profile_id=$1 for update',[p])).rows[0];if(prior&&prior.account_id!==a)fail('PUBLICATION_OWNER_CONFLICT',409);
         await c.query(`insert into franklin_member_publications(profile_id,account_id,community,revision,fields,fields_sha256,evidence_receipt,reviewed_by_hash) values($1,$2,$3,$4,$5::jsonb,$6,$7,$8) on conflict(profile_id) do update set revision=excluded.revision,fields=excluded.fields,fields_sha256=excluded.fields_sha256,evidence_receipt=excluded.evidence_receipt,reviewed_by_hash=excluded.reviewed_by_hash,published_at=now(),removed_at=null`,[p,a,COMMUNITY,next,JSON.stringify(fields(row.fields)),row.fields_sha256,h.receipt,digest(who)]);
       }else if(b.decision==='REMOVE')await c.query('update franklin_member_publications set removed_at=now() where account_id=$1 and profile_id=$2',[a,p]);
       const state={PUBLISH:'PUBLISHED',CHANGES_REQUESTED:'CHANGES_REQUESTED',REMOVE:'REMOVED'}[b.decision];
       await c.query('update franklin_member_drafts set state=$3,revision=$4,public_reason=$5,updated_at=now() where account_id=$1 and profile_id=$2',[a,p,state,next,h.reason]);return {state,revision:next};
     });
     if(result.notification){
       const notification=result.notification;delete result.notification;
       let delivery={deliveryState:'NOT_CONFIGURED',failureCode:'CLAIM_NOTIFICATION_NOT_AVAILABLE'};
       try{if(typeof notifyRepresentationDecision==='function')delivery=await notifyRepresentationDecision(notification);}catch(error){delivery={deliveryState:'FAILED',failureCode:String(error?.code||'CLAIM_NOTIFICATION_FAILED').slice(0,120)};}
       try{await query(`insert into franklin_claim_notification_log(notification_id,account_id,profile_id,revision,decision,delivery_state,provider_message_id,failure_code) values($1,$2,$3,$4,$5,$6,$7,$8)`,[newId('claim_notice'),notification.accountId,notification.profileId,notification.revision,notification.decision,delivery.deliveryState,delivery.providerMessageId||null,delivery.failureCode||null]);}
       catch(error){delivery={...delivery,ledgerRecorded:false};}
       result.notificationDelivery=delivery.deliveryState;result.notificationLedgerRecorded=delivery.ledgerRecorded!==false;
     }
     return send(200,result);
   }
   const session=await requireSession(req),a=session.account_id;
   if(req.method==='GET'&&url.pathname==='/api/member/profiles'){
     const rows=(await query(`select l.profile_id,l.authority_state,l.verified_at,r.state as review_state,r.revision as review_revision,r.public_reason,r.updated_at as review_updated_at,d.state as draft_state,d.revision as draft_revision from franklin_profile_links l left join franklin_representation_reviews r using(account_id,profile_id) left join franklin_member_drafts d using(account_id,profile_id) where l.account_id=$1 order by l.profile_id`,[a])).rows;
     return send(200,{profiles:rows.filter(r=>Object.hasOwn(scope.profiles,r.profile_id)).map(r=>({...r,name:scope.profiles[r.profile_id].name,protected_admin:Boolean(d.protectedAdminAccessForAccount?.(a,r.profile_id))})),reviewCoverageConfigured:reviewers.size>0});
   }
   if(req.method==='GET'&&url.pathname==='/api/member/profile'){
     const p=profile(url.searchParams.get('profileId'));const linked=(await query('select authority_state from franklin_profile_links where account_id=$1 and profile_id=$2',[a,p])).rows[0];if(!linked)fail('PROFILE_NOT_LINKED',403);
     const draft=(await query('select revision,state,fields,fields_sha256,public_reason,updated_at from franklin_member_drafts where account_id=$1 and profile_id=$2',[a,p])).rows[0]||null;
     const direct=linked.authority_state==='VERIFIED'?await managerPublication({query},p,a):null;
     const directHistory=linked.authority_state==='VERIFIED'?await managerHistory({query},a,p):[];
     return send(200,{draft,managerPublication:direct,managerHistory:directHistory,publication:await publication({query},p,a)});
   }
   if(req.method!=='POST')fail('METHOD_NOT_ALLOWED',405);
   if(!rateLimit('member-profile:'+a,60,60000))fail('RATE_LIMITED',429);
   const b=await readBody(req);if(b.community&&b.community!==COMMUNITY)fail('COMMUNITY_MISMATCH');const p=profile(b.profileId);
   const result=await tx(async c=>{await lock(c,p);
     if(url.pathname==='/api/member/representation/request'){
       if(b.authorityConfirmed!==true)fail('AUTHORITY_CONFIRMATION_REQUIRED',400);const evidence=publicUrl(b.evidenceUrl,true),statement=text(b.statement,1200,30);
       const row=(await c.query('select * from franklin_representation_reviews where account_id=$1 and profile_id=$2 for update',[a,p])).rows[0];checkRevision(row,b.expectedRevision);
       const link=(await c.query('select authority_state from franklin_profile_links where account_id=$1 and profile_id=$2 for update',[a,p])).rows[0];if(link?.authority_state==='VERIFIED')fail('ALREADY_VERIFIED',409);if(link?.authority_state==='DISPUTED')fail('REPRESENTATION_DISPUTED',409);
       await c.query(`insert into franklin_profile_links(link_id,account_id,profile_id) values($1,$2,$3) on conflict(account_id,profile_id) do update set authority_state='PENDING',verified_at=null,updated_at=now()`,[newId('link'),a,p]);
       const rev=(row?.revision||0)+1;
       await c.query(`insert into franklin_representation_submissions(account_id,profile_id,revision,evidence_url,statement) values($1,$2,$3,$4,$5)`,[a,p,rev,evidence,statement]);
       await c.query(`insert into franklin_representation_reviews(request_id,community,account_id,profile_id,revision,state,evidence_url,statement) values($1,$2,$3,$4,$5,'PENDING',$6,$7) on conflict(account_id,profile_id) do update set revision=excluded.revision,state='PENDING',evidence_url=excluded.evidence_url,statement=excluded.statement,public_reason='',reviewed_by_hash=null,evidence_receipt=null,updated_at=now()`,[row?.request_id||newId('representation'),COMMUNITY,a,p,rev,evidence,statement]);
       await audit(c,'ACCOUNT',a,'REPRESENTATION_REQUESTED','PROFILE',p,reqId,{revision:rev});return {state:'PENDING',revision:rev};
     }
     if(url.pathname==='/api/member/representation/release'){
       if(d.protectedAdminAccessForAccount?.(a,p))fail('PROTECTED_ADMIN_ACCESS_REQUIRED',409);
       const link=(await c.query('select authority_state from franklin_profile_links where account_id=$1 and profile_id=$2 for update',[a,p])).rows[0];
       if(!link)fail('PROFILE_NOT_LINKED',404);
       const row=(await c.query('select * from franklin_representation_reviews where account_id=$1 and profile_id=$2 for update',[a,p])).rows[0];
       checkRevision(row,b.expectedRevision);
       if(link.authority_state==='REVOKED')return {state:'REVOKED',revision:row?.revision||0,reused:true};
       const membership=(await c.query('select status,current_period_end from franklin_memberships where account_id=$1 and profile_id=$2 order by updated_at desc limit 1 for update',[a,p])).rows[0];
       if(membership&&accessAllowed(membership.status,membership.current_period_end))fail('ACTIVE_MEMBERSHIP_REQUIRES_SUPPORT',409);
       const published=await c.query('select 1 from franklin_member_publications where account_id=$1 and profile_id=$2 and removed_at is null limit 1',[a,p]);
       if(published.rowCount)fail('PUBLISHED_MEMBER_CONTENT_REQUIRES_SUPPORT',409);
       const rev=(row?.revision||0)+1;
       await c.query('delete from franklin_profile_links where account_id=$1 and profile_id=$2',[a,p]);
       if(row)await c.query("update franklin_representation_reviews set state='REVOKED',revision=$3,public_reason='Profile management access ended by the account holder.',reviewed_by_hash=null,evidence_receipt=null,updated_at=now() where account_id=$1 and profile_id=$2",[a,p,rev]);
       await audit(c,'ACCOUNT',a,'REPRESENTATION_RELEASED','PROFILE',p,reqId,{revision:rev});
       return {state:'REVOKED',revision:rev,reused:false};
     }
     if(url.pathname==='/api/member/manager-profile/save'||url.pathname==='/api/member/manager-profile/revert'){
       const link=(await c.query('select authority_state,manager_fields,manager_revision,manager_updated_at from franklin_profile_links where account_id=$1 and profile_id=$2 for update',[a,p])).rows[0];
       if(!link||link.authority_state!=='VERIFIED')fail('PROFILE_VERIFICATION_REQUIRED',403);
       checkRevision({revision:Number(link.manager_revision||0)},b.expectedRevision);
       const previousFields=managerFields(link.manager_fields||{}),previousHash=Number(link.manager_revision||0)>0?digest(JSON.stringify(previousFields)):null;
       let nextFields,action='PUBLISH',targetRevision=null;
       if(url.pathname==='/api/member/manager-profile/save')nextFields=managerFields(b.fields);
       else{
         targetRevision=Number(b.targetRevision);if(!Number.isSafeInteger(targetRevision)||targetRevision<1)fail('REVISION_REQUIRED');
         const target=(await c.query('select fields from franklin_manager_profile_history where account_id=$1 and profile_id=$2 and revision=$3',[a,p,targetRevision])).rows[0];
         if(!target)fail('MANAGER_HISTORY_NOT_FOUND',404);nextFields=managerFields(target.fields||{});action='REVERT';
       }
       const rev=Number(link.manager_revision||0)+1,hash=digest(JSON.stringify(nextFields));
       await c.query('update franklin_profile_links set manager_fields=$3::jsonb,manager_revision=$4,manager_updated_at=now(),updated_at=now() where account_id=$1 and profile_id=$2',[a,p,JSON.stringify(nextFields),rev]);
       await c.query('insert into franklin_manager_profile_history(history_id,community,account_id,profile_id,revision,action,fields,fields_sha256,previous_fields_sha256) values($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)',[newId('manager_profile'),COMMUNITY,a,p,rev,action,JSON.stringify(nextFields),hash,previousHash]);
       await audit(c,'ACCOUNT',a,action==='REVERT'?'MANAGER_PROFILE_REVERTED':'MANAGER_PROFILE_PUBLISHED','PROFILE',p,reqId,{revision:rev,targetRevision,fieldsSha256:hash});
       return {state:'PUBLISHED',revision:rev,fields:nextFields,fieldsSha256:hash,provenance:'VERIFIED_MANAGER_DIRECT'};
     }
     const entitlement=await eligible(c,a,p);
     if(url.pathname==='/api/member/profile/readback'){
       const pub=await publication(c,p,a);if(!pub||pub.revision!==revision(b.revision)||pub.fields_sha256!==b.fieldsSha256)fail('PUBLICATION_READBACK_MISMATCH',409);
       const fresh=await c.query('insert into franklin_member_value_receipts(membership_id,account_id,profile_id,revision,fields_sha256) values($1,$2,$3,$4,$5) on conflict(membership_id,revision) do nothing returning revision',[entitlement.membership_id,a,p,pub.revision,pub.fields_sha256]);await c.query('update franklin_memberships set first_value_completed_at=coalesce(first_value_completed_at,now()) where membership_id=$1',[entitlement.membership_id]);if(fresh.rowCount)await audit(c,'ACCOUNT',a,'MEMBER_PUBLICATION_READBACK','PROFILE',p,reqId,{revision:pub.revision});return {firstValueCompleted:true,revision:pub.revision,reused:!fresh.rowCount};
     }
     const row=(await c.query('select * from franklin_member_drafts where account_id=$1 and profile_id=$2 for update',[a,p])).rows[0];checkRevision(row,b.expectedRevision);const rev=(row?.revision||0)+1;
     if(url.pathname==='/api/member/profile/save'){
       const f=fields(b.fields),hash=digest(JSON.stringify(f));
       await c.query(`insert into franklin_member_drafts(account_id,profile_id,community,revision,state,fields,fields_sha256) values($1,$2,$3,$4,'DRAFT',$5::jsonb,$6) on conflict(account_id,profile_id) do update set revision=excluded.revision,state='DRAFT',fields=excluded.fields,fields_sha256=excluded.fields_sha256,public_reason='',rights_confirmed_at=null,updated_at=now()`,[a,p,COMMUNITY,rev,JSON.stringify(f),hash]);
       await audit(c,'ACCOUNT',a,'MEMBER_DRAFT_SAVED','PROFILE',p,reqId,{revision:rev});return {state:'DRAFT',revision:rev,fieldsSha256:hash};
     }
     if(url.pathname==='/api/member/profile/submit'){
       if(b.rightsConfirmed!==true)fail('PUBLICATION_PERMISSION_REQUIRED',400);
       if(!row||!['DRAFT','CHANGES_REQUESTED'].includes(row.state))fail('DRAFT_REQUIRED',409);
       await c.query(`update franklin_member_drafts set state='SUBMITTED',revision=$3,rights_confirmed_at=now(),updated_at=now() where account_id=$1 and profile_id=$2`,[a,p,rev]);await audit(c,'ACCOUNT',a,'MEMBER_DRAFT_SUBMITTED','PROFILE',p,reqId,{revision:rev});return {state:'SUBMITTED',revision:rev};
     }fail('NOT_FOUND',404);
   });return send(200,result);
 }};
}
module.exports={VERSION,fields,managerFields,publicUrl,checkRevision,createMemberWorkflow};
