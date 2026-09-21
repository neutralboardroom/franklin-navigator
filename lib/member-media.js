'use strict';
const crypto=require('node:crypto');
const VERSION='FRANKLIN_MEMBER_MEDIA_1';
const COMMUNITY='FRANKLIN_TN';
const MAX_PROFILE=2*1024*1024;
const MAX_RICH=4*1024*1024;
const fail=(code,status=400)=>{throw Object.assign(new Error(code),{code,status});};
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const cleanText=(v,max,min=0)=>{const s=String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();if(s.length<min||s.length>max)fail('FIELD_INVALID');return s;};
function normalizeSlot(v){const s=String(v||'').toUpperCase();if(!['PROFILE','COVER','GALLERY'].includes(s))fail('MEDIA_SLOT_INVALID');return s;}
function normalizePosition(v,slot){const n=Number(v??0);if(!Number.isInteger(n)||n<0||n>7)fail('MEDIA_POSITION_INVALID');if(slot!=='GALLERY'&&n!==0)fail('MEDIA_POSITION_INVALID');return n;}
function validateWebp(buf,maxBytes){
 if(!Buffer.isBuffer(buf)||buf.length<20||buf.length>maxBytes)fail('MEDIA_SIZE_INVALID',413);
 if(buf.toString('ascii',0,4)!=='RIFF'||buf.toString('ascii',8,12)!=='WEBP')fail('MEDIA_TYPE_INVALID',415);
 let width=0,height=0;
 for(let i=12;i+8<=buf.length;){
   const chunk=buf.toString('ascii',i,i+4),len=buf.readUInt32LE(i+4),start=i+8,end=start+len;
   if(end>buf.length)fail('MEDIA_TYPE_INVALID',415);
   if(['EXIF','XMP ','ANIM','ANMF'].includes(chunk))fail(chunk==='EXIF'||chunk==='XMP '?'MEDIA_METADATA_NOT_ALLOWED':'MEDIA_TYPE_INVALID',415);
   if(chunk==='VP8X'&&len>=10){width=1+buf[start+4]+(buf[start+5]<<8)+(buf[start+6]<<16);height=1+buf[start+7]+(buf[start+8]<<8)+(buf[start+9]<<16);}
   else if(chunk==='VP8L'&&len>=5&&buf[start]===0x2f){const b1=buf[start+1],b2=buf[start+2],b3=buf[start+3],b4=buf[start+4];width=1+(b1|((b2&0x3f)<<8));height=1+((b2>>6)|(b3<<2)|((b4&0x0f)<<10));}
   else if(chunk==='VP8 '&&len>=10&&buf[start+3]===0x9d&&buf[start+4]===0x01&&buf[start+5]===0x2a){width=buf.readUInt16LE(start+6)&0x3fff;height=buf.readUInt16LE(start+8)&0x3fff;}
   i=end+(len%2);
 }
 if(!width||!height||width>3000||height>3000||width*height>9000000)fail('MEDIA_DIMENSIONS_INVALID',415);
 return {mimeType:'image/webp',byteSize:buf.length,sha256:sha256(buf),width,height};
}
async function readRaw(req,maxBytes){
 const type=String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase();
 if(type!=='image/webp')fail('MEDIA_WEBP_REQUIRED',415);
 const declared=Number(req.headers['content-length']||0);if(declared&&declared>maxBytes)fail('MEDIA_SIZE_INVALID',413);
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>maxBytes)fail('MEDIA_SIZE_INVALID',413);chunks.push(chunk);}
 return Buffer.concat(chunks);
}
function createMemberMedia(d){
 const {query,tx,requireSession,sendJson,normalizeProfile,newId,audit,rateLimit,accessAllowed,scope}=d;
 const profiles=scope.profiles;
 const profile=id=>{const p=normalizeProfile(id);if(!Object.hasOwn(profiles,p))fail('PROFILE_NOT_AVAILABLE',404);return p;};
 async function authority(c,a,p){const row=(await c.query("select authority_state from franklin_profile_links where account_id=$1 and profile_id=$2",[a,p])).rows[0];if(row?.authority_state!=='VERIFIED')fail('PROFILE_VERIFICATION_REQUIRED',403);return row;}
 async function richAccess(c,a,p){
  const r=(await c.query(`select m.status,m.current_period_end,e.access_state,e.rich_profile,e.expires_at from franklin_memberships m join franklin_entitlements e using(membership_id) join franklin_accounts ac on ac.account_id=m.account_id join franklin_profile_links l on l.account_id=m.account_id and l.profile_id=m.profile_id where m.account_id=$1 and m.profile_id=$2 and ac.state='ACTIVE' and l.authority_state='VERIFIED' order by m.updated_at desc limit 1`,[a,p])).rows[0];
  return Boolean(r&&r.rich_profile&&r.access_state==='ACTIVE'&&accessAllowed(r.status,r.current_period_end)&&(!r.expires_at||new Date(r.expires_at).getTime()>Date.now()));
 }
 async function slotAllowed(c,a,p,slot){await authority(c,a,p);if(slot!=='PROFILE'&&!(await richAccess(c,a,p)))fail('ACTIVE_MEMBERSHIP_REQUIRED',403);}
 async function publicAllowed(c,row){
  const account=(await c.query("select state from franklin_accounts where account_id=$1",[row.account_id])).rows[0];if(account?.state!=='ACTIVE')return false;
  const link=(await c.query("select authority_state from franklin_profile_links where account_id=$1 and profile_id=$2",[row.account_id,row.profile_id])).rows[0];if(link?.authority_state!=='VERIFIED')return false;
  if(row.slot==='PROFILE')return true;
  return richAccess(c,row.account_id,row.profile_id);
 }
 function mediaUrl(id){return '/api/member/media/file?mediaId='+encodeURIComponent(id);}
 async function metadataRows(c,a,p){
  const rows=(await c.query(`select media_id,slot,position,mime_type,byte_size,sha256,state,public_reason,created_at,updated_at,published_at from franklin_member_media where account_id=$1 and profile_id=$2 and state<>'REMOVED' order by case state when 'DRAFT' then 0 when 'CHANGES_REQUESTED' then 1 when 'SUBMITTED' then 2 when 'PUBLISHED' then 3 else 4 end,slot,position,updated_at desc`,[a,p])).rows;
  return rows.map(r=>({...r,previewUrl:mediaUrl(r.media_id)}));
 }
 const publicPaths=new Set(['/api/member/media/public','/api/member/media/file']);
 const memberPaths=new Set(['/api/member/media/list','/api/member/media/upload','/api/member/media/submit','/api/member/media/remove']);
 const adminPaths=new Set(['/admin/member-media/queue','/admin/member-media/file','/admin/member-media/history','/admin/member-media/review']);
 return {version:VERSION,
  async route(req,res,url,reqId,context={}){
   if(!publicPaths.has(url.pathname)&&!memberPaths.has(url.pathname)&&!adminPaths.has(url.pathname))return false;
   const send=(status,obj)=>{sendJson(req,res,status,{ok:true,...obj},reqId);return true;};
   if(req.method==='GET'&&url.pathname==='/api/member/media/public'){
    const p=profile(url.searchParams.get('profileId'));
    const rows=(await query("select * from franklin_member_media where profile_id=$1 and state='PUBLISHED' order by slot,position,published_at desc",[p])).rows;
    const visible=[];for(const row of rows){if(await publicAllowed({query},row))visible.push({mediaId:row.media_id,slot:row.slot,position:row.position,mimeType:row.mime_type,url:mediaUrl(row.media_id)});}
    return send(200,{profileId:p,media:visible});
   }
   if(req.method==='GET'&&url.pathname==='/api/member/media/file'){
    const id=cleanText(url.searchParams.get('mediaId'),100,8);
    const row=(await query("select * from franklin_member_media where media_id=$1",[id])).rows[0];if(!row||row.state==='REMOVED')fail('MEDIA_NOT_FOUND',404);
    let publicOk=row.state==='PUBLISHED'&&await publicAllowed({query},row);
    if(!publicOk){const session=await requireSession(req);if(session.account_id!==row.account_id)fail('MEDIA_NOT_FOUND',404);}
    d.setCors?.(req,res);res.statusCode=200;res.setHeader('Content-Type',row.mime_type);res.setHeader('Content-Length',String(row.content.length));res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Disposition','inline');res.setHeader('Cache-Control',publicOk?'public,max-age=3600':'no-store, private');res.setHeader('Cross-Origin-Resource-Policy','cross-origin');res.end(row.content);return true;
   }
   if(adminPaths.has(url.pathname)){
    const reviewer=context.reviewer;if(!reviewer)fail('ADMIN_AUTH_REQUIRED',401);
    if(req.method==='GET'&&url.pathname==='/admin/member-media/queue'){
      const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0||offset>100000)fail('OFFSET_INVALID');
      const rows=(await query("select media_id,account_id,profile_id,slot,position,mime_type,byte_size,sha256,state,rights_confirmed_at,created_at,updated_at from franklin_member_media where state='SUBMITTED' order by updated_at,media_id limit 51 offset $1",[offset])).rows;
      return send(200,{kind:'media',items:rows.slice(0,50).map(r=>({mediaId:r.media_id,accountId:r.account_id,profileId:r.profile_id,profileName:profiles[r.profile_id]?.name||'Franklin profile',slot:r.slot,position:r.position,mimeType:r.mime_type,byteSize:r.byte_size,sha256:r.sha256,state:r.state,previewUrl:'/api/reviewer/media/file?mediaId='+encodeURIComponent(r.media_id),rightsConfirmed:Boolean(r.rights_confirmed_at),createdAt:r.created_at,updatedAt:r.updated_at})),nextOffset:rows.length>50?offset+50:null});
    }
    if(req.method==='GET'&&url.pathname==='/admin/member-media/file'){
      const id=cleanText(url.searchParams.get('mediaId'),100,8);const row=(await query("select * from franklin_member_media where media_id=$1",[id])).rows[0];if(!row||row.state==='REMOVED')fail('MEDIA_NOT_FOUND',404);
      res.statusCode=200;res.setHeader('Content-Type',row.mime_type);res.setHeader('Content-Length',String(row.content.length));res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store, private');res.end(row.content);return true;
    }
    if(req.method==='GET'&&url.pathname==='/admin/member-media/history'){
      const p=profile(url.searchParams.get('profileId')),a=cleanText(url.searchParams.get('accountId'),100,3);
      const rows=(await query("select media_id,decision,public_reason,evidence_notes,decided_at from franklin_member_media_review_history where account_id=$1 and profile_id=$2 order by decided_at desc limit 20",[a,p])).rows;return send(200,{history:rows});
    }
    if(req.method!=='POST'||url.pathname!=='/admin/member-media/review')fail('METHOD_NOT_ALLOWED',405);
    const b=await d.readBody(req),mediaId=cleanText(b.mediaId,100,8),decision=String(b.decision||'');
    if(!['PUBLISH','CHANGES_REQUESTED'].includes(decision))fail('DECISION_INVALID');
    const notes=cleanText(b.evidenceNotes,4000,30),reason=cleanText(b.publicReason,600,10);if(b.evidenceChecked!==true)fail('REVIEW_EVIDENCE_REQUIRED');
    const result=await tx(async c=>{
      const row=(await c.query("select * from franklin_member_media where media_id=$1 for update",[mediaId])).rows[0];if(!row)fail('MEDIA_NOT_FOUND',404);if(row.state!=='SUBMITTED')fail('REVIEW_NOT_PENDING',409);
      if(context.reviewerAccount&&row.account_id===context.reviewerAccount&&row.profile_id!==context.allowSelfReviewProfileId)fail('REVIEW_SELF_DECISION_FORBIDDEN',403);
      if(decision==='PUBLISH'){await authority(c,row.account_id,row.profile_id);if(row.slot!=='PROFILE'&&!(await richAccess(c,row.account_id,row.profile_id)))fail('ACTIVE_MEMBERSHIP_REQUIRED',409);await c.query("update franklin_member_media set state='REMOVED',removed_at=now(),updated_at=now() where profile_id=$1 and slot=$2 and position=$3 and state='PUBLISHED' and media_id<>$4",[row.profile_id,row.slot,row.position,row.media_id]);}
      const next=decision==='PUBLISH'?'PUBLISHED':'CHANGES_REQUESTED';
      await c.query("update franklin_member_media set state=$2,public_reason=$3,published_at=case when $2='PUBLISHED' then now() else published_at end,updated_at=now() where media_id=$1",[mediaId,next,reason]);
      await c.query("insert into franklin_member_media_review_history(decision_id,community,media_id,account_id,profile_id,decision,evidence_sha256,evidence_notes,reviewer_hash,public_reason) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",[newId('mediareview'),COMMUNITY,mediaId,row.account_id,row.profile_id,decision,sha256(Buffer.from(notes)),notes,sha256(Buffer.from(reviewer)),reason]);
      await audit(c,'REVIEWER',reviewer,'MEMBER_MEDIA_'+decision,'PROFILE',row.profile_id,reqId,{mediaId,slot:row.slot,position:row.position});return {state:next,mediaId};
    });return send(200,result);
   }
   const session=await requireSession(req),a=session.account_id;
   const p=profile(url.searchParams.get('profileId')||(req.method==='POST'?'':null));
   if(req.method==='GET'&&url.pathname==='/api/member/media/list'){
    if(!(await query("select 1 from franklin_profile_links where account_id=$1 and profile_id=$2",[a,p])).rowCount)fail('PROFILE_NOT_LINKED',403);
    return send(200,{profileId:p,media:await metadataRows({query},a,p)});
   }
   if(req.method!=='POST')fail('METHOD_NOT_ALLOWED',405);
   if(!rateLimit('member-media:'+a,20,60000))fail('RATE_LIMITED',429);
   if(url.pathname==='/api/member/media/upload'){
    const slot=normalizeSlot(url.searchParams.get('slot')),position=normalizePosition(url.searchParams.get('position'),slot);const max=slot==='PROFILE'?MAX_PROFILE:MAX_RICH;
    const result=await tx(async c=>{await slotAllowed(c,a,p,slot);const pending=(await c.query("select 1 from franklin_member_media where account_id=$1 and profile_id=$2 and slot=$3 and position=$4 and state='SUBMITTED'",[a,p,slot,position])).rowCount;if(pending)fail('MEDIA_REVIEW_PENDING',409);});
    const buf=await readRaw(req,max),meta=validateWebp(buf,max),mediaId=newId('media');
    await tx(async c=>{await slotAllowed(c,a,p,slot);await c.query("update franklin_member_media set state='REMOVED',removed_at=now(),updated_at=now() where account_id=$1 and profile_id=$2 and slot=$3 and position=$4 and state in ('DRAFT','CHANGES_REQUESTED')",[a,p,slot,position]);await c.query("insert into franklin_member_media(media_id,community,account_id,profile_id,slot,position,mime_type,byte_size,sha256,content,state) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'DRAFT')",[mediaId,COMMUNITY,a,p,slot,position,meta.mimeType,meta.byteSize,meta.sha256,buf]);await audit(c,'ACCOUNT',a,'MEMBER_MEDIA_UPLOADED','PROFILE',p,reqId,{mediaId,slot,position,bytes:meta.byteSize,sha256:meta.sha256});});
    return send(201,{media:{mediaId,slot,position,state:'DRAFT',mimeType:meta.mimeType,byteSize:meta.byteSize,previewUrl:mediaUrl(mediaId)}});
   }
   const b=await d.readBody(req),mediaId=cleanText(b.mediaId,100,8);
   const result=await tx(async c=>{const row=(await c.query("select * from franklin_member_media where media_id=$1 and account_id=$2 and profile_id=$3 for update",[mediaId,a,p])).rows[0];if(!row)fail('MEDIA_NOT_FOUND',404);await slotAllowed(c,a,p,row.slot);
     if(url.pathname==='/api/member/media/submit'){if(!['DRAFT','CHANGES_REQUESTED'].includes(row.state))fail('MEDIA_DRAFT_REQUIRED',409);if(b.rightsConfirmed!==true)fail('PUBLICATION_PERMISSION_REQUIRED');await c.query("update franklin_member_media set state='SUBMITTED',rights_confirmed_at=now(),public_reason='',updated_at=now() where media_id=$1",[mediaId]);await audit(c,'ACCOUNT',a,'MEMBER_MEDIA_SUBMITTED','PROFILE',p,reqId,{mediaId,slot:row.slot,position:row.position});return {mediaId,state:'SUBMITTED'};}
     if(url.pathname==='/api/member/media/remove'){await c.query("update franklin_member_media set state='REMOVED',removed_at=now(),updated_at=now() where media_id=$1",[mediaId]);await audit(c,'ACCOUNT',a,'MEMBER_MEDIA_REMOVED','PROFILE',p,reqId,{mediaId,slot:row.slot,position:row.position});return {mediaId,state:'REMOVED'};}
     fail('NOT_FOUND',404);
   });return send(200,result);
  }
 };
}
module.exports={VERSION,normalizeSlot,normalizePosition,validateWebp,createMemberMedia};
