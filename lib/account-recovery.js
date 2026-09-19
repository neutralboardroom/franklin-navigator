'use strict';

const VERSION='FRANKLIN_ACCOUNT_RECOVERY_R1342';
const PURPOSE='PASSWORD_RESET';
const RESET_MINUTES=30;
const GENERIC_MESSAGE="If an account exists for this email, we've sent password-reset instructions.";

function createAccountRecovery(deps={}){
  const {query,tx,readBody,rateLimit,clientKey,normalizeEmail,emailRe,sha256,randomToken,hashPassword,publicError,createSession,audit,sendResetEmail}=deps;
  if(!query||!tx||!readBody||!rateLimit||!clientKey||!normalizeEmail||!emailRe||!sha256||!randomToken||!hashPassword||!publicError||!createSession||!audit||!sendResetEmail)throw new Error('account_recovery_dependencies_missing');
  const tokenHash=token=>sha256(`${PURPOSE}:${String(token||'')}`);
  const targetKey=email=>sha256(`RESET_TARGET:${normalizeEmail(email)}`).slice(0,24);

  async function requestReset(req,res,reqId){
    const body=await readBody(req);
    const email=normalizeEmail(body.email);
    if(!rateLimit(`password-reset-ip:${clientKey(req)}`,6,15*60*1000))throw publicError('RATE_LIMITED','Too many password-reset requests. Please wait before trying again.',429);
    if(emailRe.test(email)&&rateLimit(`password-reset-target:${targetKey(email)}`,3,60*60*1000)){
      const account=(await query(`select account_id,email from franklin_accounts where email_normalized=$1 and state='ACTIVE' limit 1`,[email])).rows[0];
      if(account){
        const raw=randomToken();
        const hashed=tokenHash(raw);
        const profileId=typeof body.profileId==='string'?body.profileId.trim():'';
        await tx(async client=>{
          await client.query(`update franklin_recovery_tokens set consumed_at=coalesce(consumed_at,now()) where account_id=$1 and purpose=$2 and consumed_at is null`,[account.account_id,PURPOSE]);
          await client.query(`insert into franklin_recovery_tokens(token_hash,account_id,purpose,expires_at) values($1,$2,$3,now()+($4::text||' minutes')::interval)`,[hashed,account.account_id,PURPOSE,String(RESET_MINUTES)]);
          await audit(client,'ACCOUNT',account.account_id,'PASSWORD_RESET_REQUESTED','ACCOUNT',account.account_id,reqId,{delivery:'EMAIL'});
        });
        try{await sendResetEmail(account.email,raw,profileId);}catch(error){
          if(typeof deps.recordDeliveryFailure==='function')await deps.recordDeliveryFailure({reqId,accountId:account.account_id,code:error.code||'PASSWORD_RESET_EMAIL_FAILED'}).catch(()=>{});
        }
      }
    }
    return {status:202,payload:{ok:true,message:GENERIC_MESSAGE}};
  }

  async function completeReset(req,res,reqId){
    const body=await readBody(req);
    const raw=String(body.token||'').trim();
    const password=String(body.password||'');
    if(raw.length<24||raw.length>512)throw publicError('RESET_TOKEN_INVALID','This password-reset link is invalid, expired, or has already been used.',400);
    if(password.length<12||password.length>256)throw publicError('PASSWORD_INVALID','Use a password with at least 12 characters.',400);
    const passwordHash=await hashPassword(password);
    const hashed=tokenHash(raw);
    let accountId=null;
    await tx(async client=>{
      const row=(await client.query(`select token_hash,account_id,expires_at,consumed_at from franklin_recovery_tokens where token_hash=$1 and purpose=$2 for update`,[hashed,PURPOSE])).rows[0];
      if(!row||row.consumed_at||new Date(row.expires_at).getTime()<=Date.now())throw publicError('RESET_TOKEN_INVALID','This password-reset link is invalid, expired, or has already been used.',400);
      accountId=row.account_id;
      await client.query(`update franklin_accounts set password_hash=$2,updated_at=now() where account_id=$1 and state='ACTIVE'`,[accountId,passwordHash]);
      await client.query(`update franklin_recovery_tokens set consumed_at=now() where token_hash=$1 and consumed_at is null`,[hashed]);
      await client.query(`delete from franklin_sessions where account_id=$1`,[accountId]);
      await audit(client,'ACCOUNT',accountId,'PASSWORD_RESET_COMPLETED','ACCOUNT',accountId,reqId,{sessionsInvalidated:true});
    });
    if(!accountId)throw publicError('RESET_TOKEN_INVALID','This password-reset link is invalid, expired, or has already been used.',400);
    await createSession(req,res,accountId);
    return {status:200,payload:{ok:true,message:'Password reset complete. You are signed in.'}};
  }

  async function route(req,res,url,reqId){
    if(req.method==='POST'&&url.pathname==='/api/accounts/password-reset/request')return requestReset(req,res,reqId);
    if(req.method==='POST'&&url.pathname==='/api/accounts/password-reset/complete')return completeReset(req,res,reqId);
    return null;
  }
  return {VERSION,GENERIC_MESSAGE,route,requestReset,completeReset,tokenHash};
}

module.exports={createAccountRecovery,VERSION,PURPOSE,RESET_MINUTES,GENERIC_MESSAGE};
