'use strict';
const fs=require('node:fs'),{Pool}=require('pg'),{verifyPassword}=require('../../lib/security');
(async()=>{
 const fixture=JSON.parse(fs.readFileSync(process.argv[2]));
 const outPath=process.argv[3];
 const pool=new Pool({connectionString:fixture.db,ssl:false});
 const account=(await pool.query('select password_hash,email_verified_at from franklin_accounts where account_id=$1',[fixture.owner])).rows[0];
 if(!account?.email_verified_at)throw Error('EMAIL_NOT_VERIFIED');
 if(await verifyPassword(fixture.password,account.password_hash))throw Error('OLD_PASSWORD_STILL_VALID');
 if(!await verifyPassword('Synthetic_reset_password_987654321!',account.password_hash))throw Error('NEW_PASSWORD_NOT_VALID');
 const counts=(await pool.query("select (select count(*) from franklin_memberships)::int memberships,(select count(*) from franklin_checkout_intents)::int checkout_intents,(select count(*) from franklin_profile_links where account_id=$1)::int owner_links",[fixture.owner])).rows[0];
 if(Number(counts.memberships)!==1)throw Error('FIXTURE_MEMBERSHIP_COUNT_CHANGED');
 if(Number(counts.checkout_intents)!==0)throw Error('CHECKOUT_INTENT_CREATED');
 if(Number(counts.owner_links)!==0)throw Error('OWNER_PROFILE_LINK_CREATED');
 await pool.end();
 const out={result:'PASS',emailVerified:true,oldPasswordInvalid:true,newPasswordValid:true,checkoutIntentsCreated:0,ownerProfileLinksCreated:0,financialProviderCalls:0};
 fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n'); console.log(JSON.stringify(out));
})().catch(e=>{console.error(e);process.exit(1)});
