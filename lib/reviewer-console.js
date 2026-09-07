'use strict';
// Native Local review access. Neither a browser header nor an email grants review authority.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {randomToken, sha256, safeEqual, verifyPassword, hashPassword} = require('./security');
const {ownerBinding,confirmEmail}=require('./owner-review-setup');
const VERSION = 'FRANKLIN_REVIEWER_CONSOLE_1';
const COOKIE = '__Host-franklin_review';
const TTL_MS = 10 * 60 * 1000;
const DEFAULT_ORIGIN = 'https://franklin-navigator-membership.onrender.com';
const fail = (code, status=403) => { throw Object.assign(new Error(code), {code, status}); };
function parseBindings(raw, reviewers) {
  const rows = JSON.parse(raw || '[]');
  if (!Array.isArray(rows) || rows.length > 20) throw Error('REVIEW_BINDINGS_INVALID');
  const map = new Map();
  for (const r of rows) {
    if (!r || Object.keys(r).sort().join(',') !== 'accountId,evidenceReceipt,reviewerId' ||
        !/^acct_[A-Za-z0-9]{8,80}$/.test(r.accountId) || !/^[a-zA-Z0-9_-]{3,80}$/.test(r.reviewerId) ||
        !/^sha256:[a-f0-9]{64}$/.test(r.evidenceReceipt) || !reviewers.has(r.reviewerId) || map.has(r.accountId)) {
      throw Error('REVIEW_BINDINGS_INVALID');
    }
    map.set(r.accountId, {reviewerId:r.reviewerId, digest:sha256(JSON.stringify([r.accountId,r.reviewerId,r.evidenceReceipt]))});
  }
  return map;
}
function reviewerOrigin(env) {
  const raw = env.REVIEWER_ORIGIN || DEFAULT_ORIGIN;
  const u = new URL(raw);
  // Loopback transport is limited to an explicitly isolated loopback test database.
  const test = env.FRANKLIN_ISOLATED_TEST === 'true' && env.PGSSL_DISABLE === 'true' &&
    ['127.0.0.1','localhost'].includes(new URL(env.DATABASE_URL || 'https://invalid').hostname);
  if (u.origin !== raw || (raw !== DEFAULT_ORIGIN && !(test && u.protocol==='http:' && ['127.0.0.1','localhost'].includes(u.hostname)))) throw Error('REVIEW_ORIGIN_INVALID');
  return u.origin;
}
function evidenceNotes(value) {
  if (typeof value !== 'string') fail('REVIEW_EVIDENCE_REQUIRED',400);
  const s = value.replace(/\r\n?/g,'\n').trim();
  if(s.length<30 || s.length>4000 || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s)) fail('REVIEW_EVIDENCE_REQUIRED',400);
  return s;
}
function cookieValue(header) {
  const values = String(header || '').split(';').map(s=>s.trim()).filter(s=>s.startsWith(COOKIE+'='));
  if(values.length!==1) return '';
  const value=values[0].slice(COOKIE.length+1);
  return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : '';
}
function createReviewerConsole(d) {
  const env=d.env || process.env;
  let bindings=new Map(), origin=DEFAULT_ORIGIN, configured=false;
  const reviewers=new Set(String(env.MEMBER_REVIEWERS || '').split(',').map(s=>s.trim()).filter(Boolean));
  try { const owner=ownerBinding(env.OWNER_REVIEWER_BINDING);const rows=JSON.parse(env.REVIEWER_ACCOUNT_BINDINGS||'[]');if(!Array.isArray(rows))throw Error('REVIEW_BINDINGS_INVALID');if(owner){reviewers.add(owner.reviewerId);const prior=rows.find(r=>r.accountId===owner.accountId);if(prior&&JSON.stringify([prior.accountId,prior.reviewerId,prior.evidenceReceipt])!==JSON.stringify([owner.accountId,owner.reviewerId,owner.evidenceReceipt]))throw Error('REVIEW_BINDINGS_CONFLICT');if(!prior)rows.push(owner);}bindings=parseBindings(JSON.stringify(rows),reviewers); origin=reviewerOrigin(env); configured=bindings.size>0 && String(env.SESSION_SECRET||'').length>=32; }
  catch { configured=false; } // Invalid review setup must not take the member service offline.
  const contexts=new WeakMap(), preparedBodies=new WeakMap();
  const dummyHash=hashPassword(randomToken());
  const tokenHash = token => crypto.createHmac('sha256',String(env.SESSION_SECRET||'')).update('franklin-review:'+token).digest('hex');
  const clearCookie=res=>res.setHeader('Set-Cookie',`${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
  function headers(res,html=false) {
    res.setHeader('Cache-Control','no-store, private');res.setHeader('Pragma','no-cache');
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');
    res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy','same-origin');
    res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy',html?"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'":"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  }
  function send(res,status,body) { headers(res);const s=JSON.stringify(body);res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(s);return true; }
  function checkOrigin(req) {
    const sourceOk=req.headers.origin===origin || (req.method==='GET' && !req.headers.origin && req.headers['sec-fetch-site']==='same-origin');
    if(!sourceOk || req.headers['x-franklin-review']!=='1' ||
      (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site']!=='same-origin')) fail('REVIEW_ORIGIN_DENIED');
  }
  async function authorize(req,client=d,locking=false) {
    if(!configured)fail('REVIEW_ACCESS_UNAVAILABLE',503);
    const token=cookieValue(req.headers.cookie),csrf=String(req.headers['x-franklin-review-csrf']||'');
    if(!token || !/^[A-Za-z0-9_-]{43}$/.test(csrf))fail('REVIEW_SIGN_IN_REQUIRED',401);
    const r=(await client.query(`select s.account_id,s.reviewer_id,s.binding_sha256,s.csrf_hash,s.expires_at,s.credential_sha256,a.password_hash from franklin_review_sessions s join franklin_accounts a using(account_id) where s.session_hash=$1 and s.community='FRANKLIN_TN' and s.expires_at>now() and a.state='ACTIVE' and a.email_verified_at is not null${locking?' for share of s,a':''}`,[tokenHash(token)])).rows[0];
    const b=r&&bindings.get(r.account_id);
    if(!r || !b || b.reviewerId!==r.reviewer_id || !safeEqual(b.digest,r.binding_sha256) || !safeEqual(sha256(csrf),r.csrf_hash) || !safeEqual(tokenHash(r.password_hash),r.credential_sha256))fail('REVIEW_SIGN_IN_REQUIRED',401);
    return {account_id:r.account_id,reviewer_id:r.reviewer_id,expires_at:r.expires_at,sessionHash:tokenHash(token)};
  }
  const api={version:VERSION,configured,origin,allowedReviewerIds:configured?[...reviewers]:[],
    trustedReviewer:req=>contexts.get(req)?.reviewer_id || null,
    async assertTrustedReviewer(c,req){if(contexts.has(req))await authorize(req,c,true);},
    prepareReviewBody(req,b){
      if(!contexts.has(req))return b;
      const keys=['accountId','profileId','expectedRevision','decision','publicReason','evidenceNotes','evidenceChecked'];
      if(!b||Array.isArray(b)||Object.keys(b).some(k=>!keys.includes(k))||b.evidenceChecked!==true)fail('REVIEW_EVIDENCE_REQUIRED',400);
      const notes=evidenceNotes(b.evidenceNotes);
      const clean={accountId:b.accountId,profileId:b.profileId,expectedRevision:b.expectedRevision,decision:b.decision,publicReason:b.publicReason,evidenceReceipt:'sha256:'+sha256(notes)};
      preparedBodies.set(clean,notes);return clean;
    },
    async persistEvidence(c,decisionId,b){const notes=preparedBodies.get(b);if(notes!==undefined)await c.query('insert into franklin_review_evidence(decision_id,evidence_notes,evidence_sha256) values($1,$2,$3)',[decisionId,notes,sha256(notes)]);},
    sendMemberJson(req,res,status,payload,reqId){
      if(!contexts.has(req))return d.sendJson(req,res,status,payload,reqId);
      if(payload.items)payload={ok:true,kind:payload.kind,nextOffset:payload.nextOffset,items:payload.items.map(r=>({accountId:r.account_id,profileId:r.profile_id,profileName:d.profileNames[r.profile_id]?.name || 'Franklin profile',revision:r.revision,state:r.state,statement:r.statement||'',evidenceUrl:r.evidence_url||'',fields:r.fields||null,updatedAt:r.updated_at,rightsConfirmed:Boolean(r.rights_confirmed_at)}))};
      send(res,status,payload);
    },
    async route(req,res,url,reqId,workflow,readyError){
      const assets={'/review/':['index.html','text/html'],'/review/app.js':['app.js','text/javascript'],'/review/style.css':['style.css','text/css']};
      if(Object.hasOwn(assets,url.pathname)) {
        if(!['GET','HEAD'].includes(req.method))return send(res,405,{ok:false,error:{code:'METHOD_NOT_ALLOWED'}});
        const [file,type]=assets[url.pathname];headers(res,true);res.setHeader('Content-Type',type+'; charset=utf-8');res.statusCode=200;
        res.end(req.method==='HEAD'?undefined:fs.readFileSync(path.join(__dirname,'../review',file)));return true;
      }
      if(!url.pathname.startsWith('/api/reviewer/'))return false;
      try {
        checkOrigin(req); // No privileged CORS, including no automatic OPTIONS approval.
        if(readyError)fail('REVIEW_ACCESS_UNAVAILABLE',503);
        if(!configured)fail('REVIEW_ACCESS_UNAVAILABLE',503);
        if(url.pathname==='/api/reviewer/login' && req.method==='POST') {
          const b=await d.readBody(req),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
          if(!d.rateLimit('review-ip:'+sha256(req.socket.remoteAddress||''),20,900000) || !d.rateLimit('review-account:'+sha256(email),6,900000))fail('REVIEW_RATE_LIMITED',429);
          if(password.length<12 || password.length>256 || email.length>254)fail('REVIEW_SIGN_IN_FAILED',401);
          const a=(await d.query('select account_id,password_hash,email_verified_at,state from franklin_accounts where email_normalized=$1',[email])).rows[0];
          const passwordOk=await verifyPassword(password,a?.password_hash || await dummyHash);
          const binding=a&&bindings.get(a.account_id);
          if(!passwordOk || !binding || a.state!=='ACTIVE')fail('REVIEW_SIGN_IN_FAILED',401);
          if(!a.email_verified_at)await confirmEmail(d,env,a,binding,email,b.emailCode,reqId);
          const token=randomToken(),csrf=randomToken(),expiresAt=new Date(Date.now()+TTL_MS).toISOString();
          await d.tx(async c=>{
            // Recheck the account inside the same transaction as creating privileged access.
            const current=(await c.query("select password_hash from franklin_accounts where account_id=$1 and state='ACTIVE' and email_verified_at is not null for share",[a.account_id])).rows[0];
            if(!current || current.password_hash!==a.password_hash)fail('REVIEW_SIGN_IN_FAILED',401);
            const old=cookieValue(req.headers.cookie);if(old)await c.query('delete from franklin_review_sessions where session_hash=$1',[tokenHash(old)]);
            await c.query('delete from franklin_review_sessions where expires_at<=now()');
            await c.query('insert into franklin_review_sessions(session_hash,account_id,reviewer_id,binding_sha256,csrf_hash,expires_at,credential_sha256) values($1,$2,$3,$4,$5,$6,$7)',[tokenHash(token),a.account_id,binding.reviewerId,binding.digest,sha256(csrf),expiresAt,tokenHash(a.password_hash)]);
            await d.audit(c,'ACCOUNT',a.account_id,'REVIEW_SESSION_CREATED','REVIEWER',binding.reviewerId,reqId,{});
          });
          res.setHeader('Set-Cookie',`${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${TTL_MS/1000}`);
          return send(res,200,{ok:true,csrf,expiresAt});
        }
        const who=await authorize(req);contexts.set(req,who);
        if(url.pathname==='/api/reviewer/logout' && req.method==='POST') {
          await d.tx(async c=>{await c.query('delete from franklin_review_sessions where session_hash=$1',[who.sessionHash]);await d.audit(c,'ACCOUNT',who.account_id,'REVIEW_SESSION_CLOSED','REVIEWER',who.reviewer_id,reqId,{});});clearCookie(res);return send(res,200,{ok:true});
        }
        if(url.pathname==='/api/reviewer/session' && req.method==='GET')return send(res,200,{ok:true,expiresAt:who.expires_at});
        if(url.pathname==='/api/reviewer/history' && req.method==='GET') {
          const p=url.searchParams.get('profileId'),a=url.searchParams.get('accountId');
          if(!Object.hasOwn(d.profileNames,p||'') || !/^acct_[A-Za-z0-9]{8,80}$/.test(a||''))fail('REVIEW_ITEM_INVALID',400);
          const rows=(await d.query(`select h.kind,h.revision,h.decision,h.public_reason,h.decided_at,e.evidence_notes from franklin_member_review_history h left join franklin_review_evidence e using(decision_id) where h.community='FRANKLIN_TN' and h.profile_id=$1 and h.account_id=$2 order by h.decided_at desc, h.decision_id desc limit 20`,[p,a])).rows;
          return send(res,200,{ok:true,history:rows});
        }
        const routes={'/api/reviewer/queue':'/admin/member-review/queue','/api/reviewer/representation':'/admin/member-review/representation','/api/reviewer/content':'/admin/member-review/content'};
        if(!Object.hasOwn(routes,url.pathname))fail('NOT_FOUND',404);
        if(url.pathname.endsWith('/queue') && req.method!=='GET')fail('METHOD_NOT_ALLOWED',405);
        if(!url.pathname.endsWith('/queue') && req.method!=='POST')fail('METHOD_NOT_ALLOWED',405);
        if(!d.rateLimit('review-action:'+who.account_id,90,60000))fail('REVIEW_RATE_LIMITED',429);
        const target=new URL(url.href);target.pathname=routes[url.pathname];
        await workflow.route(req,res,target,reqId);return true;
      } catch(e) {
        // This boundary deliberately never returns credentials, query text or internal exception messages.
        const status=e.status||503;return send(res,status,{ok:false,error:{code:e.code||'REVIEW_ACCESS_UNAVAILABLE'}});
      } finally { contexts.delete(req); }
    }
  };return api;
}
module.exports={VERSION,COOKIE,TTL_MS,parseBindings,reviewerOrigin,evidenceNotes,cookieValue,createReviewerConsole};
