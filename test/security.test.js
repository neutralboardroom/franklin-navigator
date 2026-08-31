'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');
const {hashPassword,verifyPassword,signHmac,verifySignedRequest,verifyStripeSignature,signAssertion}=require('../lib/security');
test('password hashing roundtrip',async()=>{const hash=await hashPassword('a strong test password');assert.equal(await verifyPassword('a strong test password',hash),true);assert.equal(await verifyPassword('wrong password',hash),false);});
test('signed internal request detects mutation',()=>{const secret='x'.repeat(32),timestamp=Math.floor(Date.now()/1000),body='{"ok":true}',signature=signHmac(secret,timestamp,body);assert.equal(verifySignedRequest({secret,timestamp,signature,body}),true);assert.equal(verifySignedRequest({secret,timestamp,signature,body:'{}'}),false);});
test('Stripe signature verification',()=>{const secret='whsec_'+('y'.repeat(32)),ts=Math.floor(Date.now()/1000),raw=Buffer.from('{"id":"evt_1"}'),sig=crypto.createHmac('sha256',secret).update(`${ts}.`).update(raw).digest('hex');assert.equal(verifyStripeSignature({secret,header:`t=${ts},v1=${sig}`,rawBody:raw}),true);});
test('assertion is signed',()=>{const token=signAssertion('z'.repeat(32),{sub:'member'});assert.equal(token.split('.').length,2);});
