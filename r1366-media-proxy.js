'use strict';
const http=require('node:http');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {Pool}=require('pg');
const {loadProfileScope}=require('./lib/profile-scope');
const {loadProfileAliases,canonicalProfileId}=require('./lib/profile-aliases');
const {accessAllowed}=require('./lib/lifecycle');
const {MAX_PDF_BYTES,MAX_PDF_PAGES,validatePdf}=require('./lib/r1366-pdf-policy');

const RELEASE='FR-NAV1.30.66-HF3.13.48';
const VERSION='FRANKLIN_MEMBER_PROMOTION_DOCUMENTS_R1366_1';
const COMMUNITY='FRANKLIN_TN';
const COOKIE_NAME='__Host-franklin_session';
const PUBLIC_PORT=Number(process.env.PORT||10000);
const INNER_PORT=Number(process.env.FRANKLIN_R1366_INNER_PORT||Math.min(65530,PUBLIC_PORT+10));
const CORE_PORT=Number(process.env.FRANKLIN_R1366_CORE_PORT||Math.min(65531,INNER_PORT+1));
const DATABASE_URL=String(process.env.DATABASE_URL||'').trim();
const SESSION_SECRET=String(process.env.SESSION_SECRET||'').trim();
const PROFILE_RE=/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/;
const MEDIA_KINDS=new Set(['COUPON_GRAPHIC','SALE_GRAPHIC','PROMOTIONAL_GRAPHIC','PROMOTIONAL_FLYER','EVENT_FLYER']);
const pool=DATABASE_URL?new Pool({connectionString:DATABASE_URL,max:8,idleTimeoutMillis:30000,connectionTimeoutMillis:8000,ssl:process.env.PGSSL_DISABLE==='true'?false:{rejectUnauthorized:false}}):null;
const scope=loadProfileScope();
const aliases=loadProfileAliases();
const profileNames=scope.profiles||{};
const rateWindows=new Map();
let child=null;

const sha256=v=>crypto.createHash('sha256').update(v).digest('hex');
const newId=p=>`${p}_${crypto.randomUUID().replaceAll('-','')}`;
const fail=(code,message,status=400)=>{const e=new Error(message||code);e.code=code;e.status=status;throw e;};
const clean=(v,max,min=0)=>{const s=String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();if(s.length<min||s.length>max||/[<>]/.test(s))fail('FIELD_INVALID','One or more fields are invalid.');return s;};
const normalizeMediaKind=v=>{const k=String(v||'').trim().toUpperCase();if(!MEDIA_KINDS.has(k))fail('PROMOTION_MEDIA_KIND_INVALID','Choose a supported promotional media type.');return k;};
const normalizeProfile=v=>{const id=String(v||'').trim();if(!PROFILE_RE.test(id))fail('PROFILE_ID_INVALID','Choose a valid Franklin profile.');const p=canonicalProfileId(id,aliases);if(!PROFILE_RE.test(p)||!Object.hasOwn(profileNames,p))fail('PROFILE_NOT_AVAILABLE','Choose a current Franklin profile.',404);return p;};
function secureHeaders(res){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');res.setHeader('X-Franklin-Overlay-Release',RELEASE);}
function json(res,status,payload){const body=JSON.stringify(payload);secureHeaders(res);res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Length',Buffer.byteLength(body));res.end(body);}
async function query(sql,args=[]){if(!pool)fail('DATABASE_NOT_CONFIGURED','Membership service is not ready.',503);return pool.query(sql,args);}
async function tx(fn){if(!pool)fail('DATABASE_NOT_CONFIGURED','Membership service is not ready.',503);const c=await pool.connect();try{await c.query('begin');const out=await fn(c);await c.query('commit');return out;}catch(e){await c.query('rollback').catch(()=>{});throw e;}finally{c.release();}}
function parseCookies(header){const out={};for(const part of String(header||'').split(';')){const i=part.indexOf('=');if(i>0)try{out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());}catch{return {};}}return out;}
async function sessionFor(req){const token=parseCookies(req.headers.cookie)[COOKIE_NAME];if(!token||!SESSION_SECRET)return null;const r=await query(`select s.account_id,a.email from franklin_sessions s join franklin_accounts a using(account_id) where s.session_hash=$1 and s.expires_at>now() and a.state='ACTIVE'`,[sha256(`${SESSION_SECRET}:${token}`)]);return r.rows[0]||null;}
async function requireSession(req){const s=await sessionFor(req);if(!s)fail('AUTH_REQUIRED','Sign in to continue.',401);return s;}
async function activeAccess(c,accountId,profileId){const r=(await c.query(`select l.authority_state,m.status,m.current_period_end,e.access_state,e.rich_profile,e.expires_at from franklin_profile_links l join franklin_accounts a using(account_id) join franklin_memberships m on m.account_id=l.account_id and m.profile_id=l.profile_id join franklin_entitlements e using(membership_id) where l.account_id=$1 and l.profile_id=$2 and a.state='ACTIVE' order by m.updated_at desc limit 1`,[accountId,profileId])).rows[0];if(!r||r.authority_state!=='VERIFIED')fail('PROFILE_VERIFICATION_REQUIRED','Verify your connection to this Franklin profile first.',403);if(!r.rich_profile||r.access_state!=='ACTIVE'||!accessAllowed(r.status,r.current_period_end)||(r.expires_at&&new Date(r.expires_at).getTime()<=Date.now()))fail('ACTIVE_MEMBERSHIP_REQUIRED','Active Community Membership is required.',403);return true;}
async function profileHasActiveMember(c,profileId){const r=(await c.query(`select m.status,m.current_period_end,e.access_state,e.rich_profile,e.expires_at from franklin_memberships m join franklin_accounts a using(account_id) join franklin_profile_links l on l.account_id=m.account_id and l.profile_id=m.profile_id join franklin_entitlements e using(membership_id) where m.profile_id=$1 and a.state='ACTIVE' and l.authority_state='VERIFIED' and e.access_state='ACTIVE' and e.rich_profile=true order by m.updated_at desc limit 1`,[profileId])).rows[0];return Boolean(r&&accessAllowed(r.status,r.current_period_end)&&(!r.expires_at||new Date(r.expires_at).getTime()>Date.now()));}
async function audit(c,actorType,actorRef,action,targetType,targetRef,context={}){await c.query(`insert into franklin_audit_log(audit_id,actor_type,actor_ref_hash,action_type,target_type,target_ref_hash,safe_context) values($1,$2,$3,$4,$5,$6,$7::jsonb)`,[newId('audit'),actorType,actorRef?sha256(actorRef):null,action,targetType,targetRef?sha256(targetRef):null,JSON.stringify(context)]);}
function promotionIsCurrent(row,now=Date.now()){if(row.promotion_state!=='PUBLISHED')return false;const start=row.start_at?new Date(row.start_at).getTime():null,end=row.end_at?new Date(row.end_at).getTime():null;if(start&&start>now)return false;if(end&&end<=now)return false;return true;}
function rateLimit(key,limit,windowMs){const now=Date.now();let r=rateWindows.get(key);if(!r||r.resetAt<=now){r={count:0,resetAt:now+windowMs};rateWindows.set(key,r);}r.count++;return r.count<=limit;}
async function readPdf(req){if(String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase()!=='application/pdf')fail('PDF_REQUIRED','Upload a PDF document.',415);const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_PDF_BYTES)fail('PDF_SIZE_INVALID','PDF flyers and coupons must be 4 MB or smaller.',413);chunks.push(chunk);}return Buffer.concat(chunks);}
async function initialize(){const sql=fs.readFileSync(path.join(__dirname,'schema','013_member_promotion_documents.sql'),'utf8'),digest=sha256(sql);await tx(async c=>{await c.query('select pg_advisory_xact_lock(3316412,1)');const prior=(await c.query('select digest_sha256 from franklin_schema_migrations where version=$1',[VERSION])).rows[0];if(prior&&prior.digest_sha256!==digest)throw new Error('member_promotion_documents_migration_digest_mismatch');if(!prior){await c.query(sql);await c.query('insert into franklin_schema_migrations(version,digest_sha256) values($1,$2)',[VERSION,digest]);}});}
function proxy(req,res){const headers={...req.headers,host:`127.0.0.1:${INNER_PORT}`};const p=http.request({hostname:'127.0.0.1',port:INNER_PORT,path:req.url,method:req.method,headers},up=>{res.statusCode=up.statusCode||502;for(const [k,v] of Object.entries(up.headers)){if(v!==undefined&&!['connection','transfer-encoding'].includes(k.toLowerCase()))res.setHeader(k,v);}up.pipe(res);});p.on('error',()=>{if(res.headersSent)return res.destroy();json(res,503,{ok:false,error:{code:'MEMBER_RUNTIME_STARTING',message:'Member tools are starting. Please try again shortly.'}});});req.pipe(p);}
async function handlePdfUpload(req,res,url){
 const session=await requireSession(req);if(!rateLimit('pdf:'+session.account_id,12,60000))fail('RATE_LIMITED','Too many document uploads. Try again shortly.',429);
 const profileId=normalizeProfile(url.searchParams.get('profileId')||''),promotionId=clean(url.searchParams.get('promotionId'),100,8),mediaKind=normalizeMediaKind(url.searchParams.get('mediaKind'));
 if(String(req.headers['x-franklin-rights-confirmed']||'').toLowerCase()!=='true')fail('MEDIA_RIGHTS_CONFIRMATION_REQUIRED','Confirm you own this document or have permission to publish it.',400);
 const buf=await readPdf(req),meta=validatePdf(buf);
 const result=await tx(async c=>{await activeAccess(c,session.account_id,profileId);const promo=(await c.query(`select promotion_id,state from franklin_member_promotions where promotion_id=$1 and account_id=$2 and profile_id=$3 for update`,[promotionId,session.account_id,profileId])).rows[0];if(!promo||promo.state==='REMOVED')fail('PROMOTION_NOT_FOUND','Promotion not found.',404);if(!['DRAFT','CHANGES_REQUESTED','UNPUBLISHED','PUBLISHED'].includes(promo.state))fail('PROMOTION_REVIEW_PENDING','Wait for promotion review before changing media.',409);const id=newId('promomedia');await c.query(`update franklin_member_promotion_media set state='REMOVED',removed_at=now(),updated_at=now() where promotion_id=$1 and media_kind=$2 and state in ('DRAFT','CHANGES_REQUESTED')`,[promotionId,mediaKind]);await c.query(`insert into franklin_member_promotion_media(media_id,community,promotion_id,account_id,profile_id,media_kind,mime_type,byte_size,sha256,content,rights_confirmed_at) values($1,$2,$3,$4,$5,$6,'application/pdf',$7,$8,$9,now())`,[id,COMMUNITY,promotionId,session.account_id,profileId,mediaKind,meta.byteSize,meta.sha256,buf]);await audit(c,'ACCOUNT',session.account_id,'MEMBER_PROMOTION_DOCUMENT_UPLOADED','PROFILE',profileId,{promotionId,mediaId:id,mediaKind,bytes:meta.byteSize,pages:meta.pageCount});return{mediaId:id,state:'DRAFT',mediaKind,byteSize:meta.byteSize,mimeType:'application/pdf',pageCount:meta.pageCount};});
 return json(res,201,{ok:true,...result});
}
async function handlePdfFile(req,res,url){
 const mediaId=clean(url.searchParams.get('mediaId'),100,8);const row=(await query(`select m.*,p.state promotion_state,p.start_at,p.end_at from franklin_member_promotion_media m join franklin_member_promotions p using(promotion_id) where m.media_id=$1`,[mediaId])).rows[0];
 if(!row||row.mime_type!=='application/pdf')return false;if(row.state==='REMOVED')fail('MEDIA_NOT_FOUND','Document not found.',404);
 const publicOk=row.state==='PUBLISHED'&&promotionIsCurrent(row)&&await profileHasActiveMember({query},row.profile_id);
 if(!publicOk){const s=await requireSession(req);if(s.account_id!==row.account_id)fail('MEDIA_NOT_FOUND','Document not found.',404);}
 secureHeaders(res);res.statusCode=200;res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Length',String(row.content.length));res.setHeader('Content-Disposition','attachment; filename="franklin-member-promotion.pdf"');res.setHeader('Content-Security-Policy',"sandbox; default-src 'none'");res.setHeader('Cross-Origin-Resource-Policy','same-site');res.setHeader('Cache-Control',publicOk?'public,max-age=1800':'private,no-store');res.end(row.content);return true;
}
async function handler(req,res){
 try{
  const url=new URL(req.url,`http://127.0.0.1:${PUBLIC_PORT}`),pathName=url.pathname,contentType=String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase();
  if(pathName==='/api/member/promotions/capabilities'&&req.method==='GET')return json(res,200,{ok:true,release:RELEASE,version:VERSION,kinds:['COUPON','SPECIAL','SALE','PROMOTION','EVENT'],imageInputTypes:['image/jpeg','image/png','image/webp'],storedImageType:'image/webp',mediaTypes:['image/webp','application/pdf'],maxImageBytes:4*1024*1024,maxPdfBytes:MAX_PDF_BYTES,maxPdfPages:MAX_PDF_PAGES,pdfUpload:true,reviewRequired:true});
  if(pathName==='/api/member/promotions/media/upload'&&req.method==='POST'&&contentType==='application/pdf')return await handlePdfUpload(req,res,url);
  if(pathName==='/api/member/promotions/media/file'&&req.method==='GET'&&await handlePdfFile(req,res,url))return;
  return proxy(req,res);
 }catch(e){return json(res,e.status||500,{ok:false,error:{code:e.code||'INTERNAL_ERROR',message:e.status?e.message:'We could not complete that request.'}});}
}
async function start(){
 await initialize();
 child=spawn(process.execPath,['--require','./r1365-cors-hook.js','promotions-proxy.js'],{cwd:__dirname,env:{...process.env,PORT:String(INNER_PORT),FRANKLIN_CORE_PORT:String(CORE_PORT)},stdio:'inherit'});
 child.on('exit',(code,signal)=>{if(!process.exitCode)process.exitCode=code||1;console.error('r1365 inner runtime exited',code,signal);});
 const server=http.createServer(handler);server.listen(PUBLIC_PORT,'0.0.0.0',()=>console.log(`Franklin R1366 media overlay ${RELEASE} listening on ${PUBLIC_PORT}; R1365 inner runtime on ${INNER_PORT}`));
 const shutdown=()=>{server.close(()=>{});if(child&&!child.killed)child.kill('SIGTERM');pool?.end().catch(()=>{});};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
start().catch(e=>{console.error('R1366 media overlay startup failed',e);process.exit(1);});
