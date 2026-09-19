'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {createAccountRecovery,GENERIC_MESSAGE}=require('../lib/account-recovery');

function harness(options={}){
  const tokens=new Map(),mail=[],sessions=[{account_id:'acct_owner'}];
  const accounts=new Map([['owner@example.com',{account_id:'acct_owner',email:'owner@example.com'}]]);
  let body={};
  const deps={
    query:async(sql,vals=[])=>{
      if(sql.includes('select account_id,email from franklin_accounts')){const row=accounts.get(vals[0]);return {rows:row?[row]:[],rowCount:row?1:0};}
      throw new Error('unexpected query '+sql);
    },
    tx:async fn=>fn({query:async(sql,vals=[])=>{
      if(sql.startsWith('update franklin_recovery_tokens set consumed_at=coalesce')){for(const v of tokens.values())if(v.account_id===vals[0]&&!v.consumed_at)v.consumed_at=new Date();return {rows:[],rowCount:1};}
      if(sql.startsWith('insert into franklin_recovery_tokens')){tokens.set(vals[0],{token_hash:vals[0],account_id:vals[1],purpose:vals[2],expires_at:new Date(Date.now()+1800000),consumed_at:null});return {rows:[],rowCount:1};}
      if(sql.startsWith('select token_hash,account_id,expires_at,consumed_at')){const row=tokens.get(vals[0]);return {rows:row?[row]:[],rowCount:row?1:0};}
      if(sql.startsWith('update franklin_accounts set password_hash')){return {rows:[],rowCount:1};}
      if(sql.startsWith('update franklin_recovery_tokens set consumed_at=now()')){const row=tokens.get(vals[0]);if(row)row.consumed_at=new Date();return {rows:[],rowCount:row?1:0};}
      if(sql.startsWith('delete from franklin_sessions')){sessions.length=0;return {rows:[],rowCount:1};}
      if(sql.startsWith('insert into franklin_audit_log'))return {rows:[],rowCount:1};
      throw new Error('unexpected tx query '+sql);
    }}),
    readBody:async()=>body,rateLimit:options.rateLimit||(()=>true),clientKey:()=> 'client',
    normalizeEmail:x=>String(x||'').trim().toLowerCase(),emailRe:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    sha256:x=>crypto.createHash('sha256').update(String(x)).digest('hex'),randomToken:()=> 'A'.repeat(48),
    hashPassword:async p=>'hash:'+p,publicError:(code,message,status=400)=>Object.assign(new Error(message),{code,status}),
    createSession:async()=>sessions.push({account_id:'acct_owner'}),audit:async(client,...args)=>client.query('insert into franklin_audit_log',args),
    sendResetEmail:async(email,token,profile)=>mail.push({email,token,profile})
  };
  return {recovery:createAccountRecovery(deps),setBody:v=>body=v,tokens,mail,sessions};
}

test('unknown email receives the same generic reset response without email disclosure',async()=>{
  const h=harness();h.setBody({email:'missing@example.com'});const out=await h.recovery.requestReset({}, {}, 'r1');
  assert.equal(out.payload.message,GENERIC_MESSAGE);assert.equal(h.mail.length,0);
});

test('valid reset is single use and signs the account in again',async()=>{
  const h=harness();h.setBody({email:'owner@example.com',profileId:'FR-ORG-example'});await h.recovery.requestReset({}, {}, 'r1');
  assert.equal(h.mail.length,1);h.setBody({token:'A'.repeat(48),password:'new secure password 123'});
  const out=await h.recovery.completeReset({}, {}, 'r2');assert.equal(out.status,200);assert.equal(h.sessions.length,1);
  await assert.rejects(()=>h.recovery.completeReset({}, {}, 'r3'),e=>e.code==='RESET_TOKEN_INVALID');
});

test('expired, invalid, and reused reset tokens fail closed',async()=>{
  const invalid=harness();invalid.setBody({token:'B'.repeat(48),password:'new secure password 123'});
  await assert.rejects(()=>invalid.recovery.completeReset({}, {}, 'r4'),e=>e.code==='RESET_TOKEN_INVALID');

  const expired=harness();expired.setBody({email:'owner@example.com'});await expired.recovery.requestReset({}, {}, 'r5');
  const row=[...expired.tokens.values()][0];row.expires_at=new Date(Date.now()-1000);
  expired.setBody({token:'A'.repeat(48),password:'new secure password 123'});
  await assert.rejects(()=>expired.recovery.completeReset({}, {}, 'r6'),e=>e.code==='RESET_TOKEN_INVALID');
});

test('excessive reset requests are rate limited without account disclosure',async()=>{
  let calls=0;
  const h=harness({rateLimit:key=>key.startsWith('password-reset-ip:')?++calls<=1:true});
  h.setBody({email:'owner@example.com'});await h.recovery.requestReset({}, {}, 'r7');
  await assert.rejects(()=>h.recovery.requestReset({}, {}, 'r8'),e=>e.code==='RATE_LIMITED');
});
