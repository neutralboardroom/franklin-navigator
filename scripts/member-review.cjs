#!/usr/bin/env node
'use strict';
// Operator-only CLI. Never include admin tokens in a browser, URL, file export, or console output.
const fs=require('node:fs'),crypto=require('node:crypto');
async function main(){
 const [kind,action,...rest]=process.argv.slice(2),allowedKinds=new Set(['representation','content']);
 if(!allowedKinds.has(kind)||!['queue','decide'].includes(action))throw Error('Usage: node scripts/member-review.cjs representation|content queue [offset] OR decide ACCOUNT PROFILE REVISION DECISION EVIDENCE_FILE PUBLIC_REASON');
 const origin=String(process.env.MEMBER_REVIEW_API_ORIGIN||'https://franklin-navigator-membership.onrender.com').replace(/\/$/,'');const url=new URL(origin);
 if(url.protocol!=='https:'||url.hostname!=='franklin-navigator-membership.onrender.com'||url.port||url.username||url.password||url.pathname!=='/')throw Error('Review API must be the exact Franklin HTTPS runtime origin.');
 const token=String(process.env.ADMIN_TOKEN||''),reviewer=String(process.env.MEMBER_REVIEWER_ID||'');if(token.length<32||!reviewer||/\s/.test(reviewer))throw Error('Configure the authorized administrator token and named reviewer in the secure operator environment.');
 const headers={Authorization:'Bearer '+token,'X-Franklin-Reviewer':reviewer,'Content-Type':'application/json'};
 let route='/admin/member-review/queue?kind='+kind,options={headers,signal:AbortSignal.timeout(15000)};
 if(action==='queue'){const offset=rest[0]??'0';if(!/^\d+$/.test(offset))throw Error('Offset must be an integer');route+='&offset='+offset;}
 else{const [accountId,profileId,rev,decision,evidenceFile,publicReason]=rest;
  if(!accountId||!/^FR-/.test(profileId||'')||!/^\d+$/.test(rev||''))throw Error('Copy the exact account, profile and current revision from the queue.');
  if(!(kind==='representation'?['VERIFIED','CHANGES_REQUESTED','REJECTED','REVOKED']:['PUBLISH','CHANGES_REQUESTED','REMOVE']).includes(decision))throw Error('Invalid decision for this queue.');
  if(!evidenceFile||!fs.statSync(evidenceFile).isFile())throw Error('A reviewed, retained local evidence file is required.');
  const evidence=fs.readFileSync(evidenceFile);if(evidence.length<50||evidence.length>2*1024*1024)throw Error('Evidence file must contain the actual review and source basis, between 50 bytes and 2 MB.');
  if(!publicReason||publicReason.length<10||publicReason.length>600||/[<>\x00-\x1f]/.test(publicReason))throw Error('Provide a safe, plain-language public decision reason without private information.');
  route='/admin/member-review/'+kind;options={...options,method:'POST',body:JSON.stringify({accountId,profileId,expectedRevision:Number(rev),decision,evidenceReceipt:'sha256:'+crypto.createHash('sha256').update(evidence).digest('hex'),publicReason})};
 }
 const r=await fetch(origin+route,options),body=await r.json();if(!r.ok)throw Error(body.error?.code||'REVIEW_REQUEST_FAILED');console.log(JSON.stringify(body,null,2));
}
main().catch(e=>{console.error(String(e.message||'Review failed.'));process.exitCode=1;});
