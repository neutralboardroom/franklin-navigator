'use strict';
// Disposable, loopback-only database fixture. Metadata is private synthetic test data, not a release input.
const {Pool}=require('pg'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {hashPassword}=require('../lib/security');
(async()=>{
 const u=new URL(process.env.TEST_DATABASE_URL||'https://invalid');if(!['localhost','127.0.0.1'].includes(u.hostname)||!u.pathname.includes('test'))throw Error('LOCAL_TEST_DATABASE_REQUIRED');
 const output=process.env.BROWSER_FIXTURE_PATH;if(!output)throw Error('BROWSER_FIXTURE_PATH_REQUIRED');
 const port=18185,origin='http://127.0.0.1:'+port,root=path.resolve(__dirname,'..');const schema='hf21_browser_'+crypto.randomUUID().replaceAll('-','');
 const init=new Pool({connectionString:u.href,ssl:false});await init.query('create schema '+schema);await init.end();u.searchParams.set('options','-c search_path='+schema+',public');const pool=new Pool({connectionString:u.href,ssl:false});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'franklin-review-browser-'));fs.cpSync(root,tmp,{recursive:true,filter:s=>!s.includes('/node_modules')&&!s.includes('/evidence')});fs.symlinkSync(path.join(root,'node_modules'),path.join(tmp,'node_modules'),'dir');
 const profiles={};for(const key of ['ONE','TWO','CONTENT'])profiles['FR-ORG-SYNTHETIC-'+key]={name:'Synthetic '+key+' Fixture'};
 fs.writeFileSync(path.join(tmp,'data/member-profile-scope.json'),JSON.stringify({community:'FRANKLIN_TN',profileCount:3,profiles,sourcePublicCommit:'SYNTHETIC_ONLY'}));
 const owner='acct_SYNTHETICBROWSER12345',member='acct_SYNTHETICMEMBER12345',pw='Synthetic_browser_review_password_12345!';
 const env={...process.env,PORT:String(port),DATABASE_URL:u.href,PGSSL_DISABLE:'true',FRANKLIN_ISOLATED_TEST:'true',REVIEWER_ORIGIN:origin,MEMBER_REVIEWERS:'synthetic-reviewer',REVIEWER_ACCOUNT_BINDINGS:JSON.stringify([{accountId:owner,reviewerId:'synthetic-reviewer',evidenceReceipt:'sha256:'+'a'.repeat(64)}]),SESSION_SECRET:'synthetic-review-session-'.repeat(4),LOCAL_ASSERTION_SECRET:'synthetic-review-assertion-'.repeat(4),SRE_SHARED_SECRET:'synthetic-review-sre-'.repeat(4),ADMIN_TOKEN:'synthetic-review-admin-'.repeat(4),STRIPE_SECRET_KEY:['sk','live','0'.repeat(32)].join('_'),STRIPE_WEBHOOK_SECRET:['whsec','0'.repeat(32)].join('_'),COMMERCE_ENABLED:'false',NODE_OPTIONS:'--require '+path.join(tmp,'acceptance/member-test-provider.cjs')};
 const {proofHash}=require('../lib/owner-review-setup');
 const binding={accountId:owner,reviewerId:'synthetic-reviewer',evidenceReceipt:'sha256:'+'a'.repeat(64)};
 const emailCode='SYNTHETIC_browser_email_123456789';
 const proof={accountId:owner,bindingDigest:crypto.createHash('sha256').update(JSON.stringify([owner,binding.reviewerId,binding.evidenceReceipt])).digest('hex'),nonce:'b'.repeat(64),emailSha256:crypto.createHash('sha256').update('reviewer@example.invalid').digest('hex'),issuedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString()};proof.codeSha256=proofHash(proof,emailCode);
 env.OWNER_REVIEWER_BINDING=JSON.stringify(binding);env.OWNER_REVIEWER_EMAIL_CONFIRMATION=JSON.stringify(proof);env.REVIEWER_ACCOUNT_BINDINGS='[]';env.MEMBER_REVIEWERS='';
 const child=spawn('npm',['start'],{cwd:tmp,env,stdio:'inherit',detached:true});
 const cleanup=async()=>{try{process.kill(-child.pid,'SIGTERM');}catch{}await pool.end().catch(()=>{});process.exit();};process.on('SIGTERM',cleanup);
 for(let i=0;i<140;i++){try{if((await fetch(origin+'/ready')).status===200)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const hash=await hashPassword(pw);for(const [id,email,name]of [[owner,'reviewer@example.invalid','Synthetic Reviewer'],[member,'member@example.invalid','Synthetic Member']])await pool.query("insert into franklin_accounts(account_id,community,email,email_normalized,password_hash,display_name,email_verified_at) values($1,'FRANKLIN_TN',$2,$2,$3,$4,now())",[id,email,hash,name]);
 await pool.query('update franklin_accounts set email_verified_at=null where account_id=$1',[owner]);
 for(const [i,p]of Object.keys(profiles).entries()){
 await pool.query("insert into franklin_profile_links(link_id,account_id,profile_id,authority_state) values($1,$2,$3,$4)",['link_SYNTHETIC'+i,member,p,p.endsWith('CONTENT')?'VERIFIED':'PENDING']);
 if(!p.endsWith('CONTENT'))await pool.query("insert into franklin_representation_reviews(request_id,community,account_id,profile_id,revision,state,evidence_url,statement) values($1,'FRANKLIN_TN',$2,$3,1,'PENDING','https://example.com/team','Synthetic claim for an isolated browser test. Check actual evidence; this is not a real business.')",['req_SYNTHETIC'+i,member,p]);
 }
 const p='FR-ORG-SYNTHETIC-CONTENT',fields={summary:'Synthetic reviewed public profile content with useful information.',services:'Synthetic services',languages:'English and Spanish',website:'https://example.com/',contactUrl:'',bookingUrl:''};const digest=crypto.createHash('sha256').update(JSON.stringify(fields)).digest('hex');
 await pool.query("insert into franklin_memberships(membership_id,account_id,profile_id,lookup_key,status,current_period_end) values('member_SYNTHETICBROWSER',$1,$2,'franklin_community_member_monthly_v5','ACTIVE',now()+interval '30 days')",[member,p]);await pool.query("insert into franklin_entitlements(membership_id,access_state,rich_profile) values('member_SYNTHETICBROWSER','ACTIVE',true)");
 await pool.query("insert into franklin_member_drafts(account_id,profile_id,community,revision,state,fields,fields_sha256,rights_confirmed_at) values($1,$2,'FRANKLIN_TN',2,'SUBMITTED',$3::jsonb,$4,now())",[member,p,JSON.stringify(fields),digest]);
 fs.writeFileSync(output,JSON.stringify({origin,email:'reviewer@example.invalid',emailCode,password:pw,db:u.href,member,owner,childPid:child.pid}),{mode:0o600});
 await pool.end();child.on('exit',()=>process.exit());
})().catch(e=>{console.error(e.message);process.exit(1);});
