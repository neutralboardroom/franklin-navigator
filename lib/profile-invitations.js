'use strict';
const VERSION='FRANKLIN_PROFILE_INVITATIONS_1';
const SELF_SOURCE='OWNER_OUTREACH';
const TOKEN_PREFIX='FRANKLIN_PROFILE_INVITE_V1:';
const fail=(code,status=400,message=code)=>{throw Object.assign(new Error(message),{code,status});};

function maskEmail(value){
  const email=String(value||'');
  const at=email.indexOf('@');
  if(at<=0)return'';
  const local=email.slice(0,at),domain=email.slice(at+1);
  return (local.length<=2?local[0]+'*':local[0]+'***'+local.at(-1))+'@'+domain;
}

function createProfileInvitations(d={}){
  const {query,tx,readBody,sendJson,requireSession,normalizeProfile,newId,audit,rateLimit,safeEqual,adminToken,sha256,randomToken,normalizeEmail,emailRe,profileNames,publicOrigin}=d;
  if(!query||!tx||!readBody||!sendJson||!requireSession||!normalizeProfile||!newId||!audit||!rateLimit||!safeEqual||!adminToken||!sha256||!randomToken||!normalizeEmail||!emailRe||!profileNames||!publicOrigin)throw new Error('profile_invitation_dependencies_missing');
  const tokenHash=token=>sha256(TOKEN_PREFIX+String(token||'').trim());
  const validToken=token=>/^[A-Za-z0-9_-]{32,512}$/.test(String(token||'').trim());
  const admin=req=>{
    const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
    if(!token||!safeEqual(token,adminToken))fail('ADMIN_AUTH_REQUIRED',401,'Authorized Franklin access is required.');
  };
  const inviteUrl=token=>{
    const u=new URL('/profile-invite/',publicOrigin);
    return u.toString()+'#token='+encodeURIComponent(token);
  };
  async function rowForToken(client,token,locking=false){
    if(!validToken(token))fail('INVITATION_INVALID',400,'This invitation link is invalid, expired, or has already been used.');
    const sql=`select * from franklin_profile_invitations where token_hash=$1 ${locking?'for update':''}`;
    const row=(await client.query(sql,[tokenHash(token)])).rows[0];
    if(!row||row.state!=='PENDING'||row.consumed_at||new Date(row.expires_at).getTime()<=Date.now())fail('INVITATION_INVALID',400,'This invitation link is invalid, expired, or has already been used.');
    if(!Object.hasOwn(profileNames,row.profile_id))fail('INVITATION_PROFILE_UNAVAILABLE',409,'The invited Franklin profile is not currently available.');
    return row;
  }
  return {version:VERSION,
    async route(req,res,url,reqId){
      if(req.method==='POST'&&url.pathname==='/admin/profile-invitations/issue'){
        admin(req);
        const b=await readBody(req),email=normalizeEmail(b.email),profileId=normalizeProfile(b.profileId);
        if(!emailRe.test(email))fail('EMAIL_INVALID',400,'Enter a valid invited email address.');
        if(!Object.hasOwn(profileNames,profileId))fail('PROFILE_NOT_AVAILABLE',404,'Choose a current Franklin profile.');
        const ttlHours=Math.max(1,Math.min(336,Number(b.ttlHours||168)||168));
        const source=String(b.source||SELF_SOURCE).replace(/[^A-Z0-9_-]/gi,'_').slice(0,80)||SELF_SOURCE;
        const token=randomToken(),hash=tokenHash(token),id=newId('invite');
        await tx(async c=>{
          await c.query("update franklin_profile_invitations set state='REVOKED',updated_at=now() where email_normalized=$1 and profile_id=$2 and state='PENDING'",[email,profileId]);
          await c.query("insert into franklin_profile_invitations(invitation_id,profile_id,email_normalized,token_hash,source,expires_at) values($1,$2,$3,$4,$5,now()+($6::text||' hours')::interval)",[id,profileId,email,hash,source,String(ttlHours)]);
          await audit(c,'SYSTEM','PROFILE_INVITE_ISSUER','PROFILE_INVITATION_ISSUED','PROFILE',profileId,reqId,{invitationId:id,source,ttlHours,emailSha256:sha256(email)});
        });
        return sendJson(req,res,201,{ok:true,invitationId:id,profileId,profileName:profileNames[profileId].name,inviteUrl:inviteUrl(token),expiresInHours:ttlHours},reqId);
      }
      if(req.method==='POST'&&url.pathname==='/api/profile-invitations/inspect'){
        if(!rateLimit('profile-invite-inspect:'+sha256(String(req.socket.remoteAddress||'')),30,15*60*1000))fail('RATE_LIMITED',429,'Too many invitation checks. Try again later.');
        const b=await readBody(req),token=String(b.token||'').trim(),row=await rowForToken({query},token,false);
        return sendJson(req,res,200,{ok:true,profileId:row.profile_id,profileName:profileNames[row.profile_id].name,emailHint:maskEmail(row.email_normalized),expiresAt:row.expires_at},reqId);
      }
      if(req.method==='POST'&&url.pathname==='/api/profile-invitations/accept'){
        const session=await requireSession(req);
        if(!rateLimit('profile-invite-accept:'+session.account_id,12,15*60*1000))fail('RATE_LIMITED',429,'Too many invitation attempts. Try again later.');
        const b=await readBody(req),token=String(b.token||'').trim();
        const result=await tx(async c=>{
          const row=await rowForToken(c,token,true);
          const account=(await c.query("select email_normalized,state from franklin_accounts where account_id=$1 for update",[session.account_id])).rows[0];
          if(!account||account.state!=='ACTIVE')fail('AUTH_REQUIRED',401,'Sign in to continue.');
          if(account.email_normalized!==row.email_normalized)fail('INVITATION_EMAIL_MISMATCH',403,'Sign in with the email address that received this invitation.');
          await c.query("update franklin_accounts set email_verified_at=coalesce(email_verified_at,now()),updated_at=now() where account_id=$1",[session.account_id]);
          await c.query("insert into franklin_profile_links(link_id,account_id,profile_id) values($1,$2,$3) on conflict(account_id,profile_id) do update set updated_at=now()",[newId('link'),session.account_id,row.profile_id]);
          await c.query("update franklin_profile_invitations set state='CONSUMED',account_id=$2,consumed_at=now(),updated_at=now() where invitation_id=$1",[row.invitation_id,session.account_id]);
          await audit(c,'ACCOUNT',session.account_id,'PROFILE_INVITATION_ACCEPTED','PROFILE',row.profile_id,reqId,{invitationId:row.invitation_id,inboxControlVerified:true,profileAuthorityGranted:false});
          return {profileId:row.profile_id,profileName:profileNames[row.profile_id].name};
        });
        return sendJson(req,res,200,{ok:true,...result,emailVerified:true,profileAuthorityGranted:false,next:'VERIFY_PROFILE_MANAGEMENT'},reqId);
      }
      return false;
    }
  };
}
module.exports={VERSION,createProfileInvitations,maskEmail};
