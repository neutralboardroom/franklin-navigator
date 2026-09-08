'use strict';
// Test-only preload, never imported by the application. All outbound provider calls simulated.
const assert=require('node:assert/strict'),fs=require('node:fs');
assert.equal(process.env.FRANKLIN_ISOLATED_TEST,'true');
assert(['127.0.0.1','localhost'].includes(new URL(process.env.DATABASE_URL).hostname));
assert(process.env.STRIPE_SECRET_KEY.endsWith('0'.repeat(32)));
const objects=new Map();
global.fetch=async(url,options={})=>{
 assert.equal(new URL(url).origin,'https://api.stripe.com','Unexpected outbound request forbidden');
 assert.equal(options.method,'POST');const params=new URLSearchParams(options.body);const pathname=new URL(url).pathname;
 let payload;
 if(pathname==='/v1/checkout/sessions'){const key=options.headers['Idempotency-Key'];assert(key);if(!objects.has(key))objects.set(key,{id:'cs_SYNTHETIC_'+key,url:'https://checkout.stripe.com/c/pay/SYNTHETIC_'+key,livemode:true});payload=objects.get(key);}
 else if(pathname==='/v1/billing_portal/sessions'){assert(params.get('customer')?.startsWith('cus_SYNTHETIC_'));payload={id:'bps_SYNTHETIC',url:'https://billing.stripe.com/p/session/SYNTHETIC_ONLY',livemode:true};}
 else throw Error('Unexpected simulated provider path');
 if(process.env.TEST_PROVIDER_LOG)fs.appendFileSync(process.env.TEST_PROVIDER_LOG,JSON.stringify({path:pathname,params:Object.fromEntries(params),key:options.headers?.['Idempotency-Key']})+'\n');
 return new Response(JSON.stringify(payload),{status:200,headers:{'Content-Type':'application/json'}});
};
