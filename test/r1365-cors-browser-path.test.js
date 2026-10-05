'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
process.env.PUBLIC_ORIGIN='https://franklinnavigator.com';
require('../r1365-cors-hook');
const http=require('node:http');

function onceRequest({origin,method='OPTIONS'}){
  return new Promise((resolve,reject)=>{
    const server=http.createServer((req,res)=>{res.statusCode=200;res.end('core');});
    server.listen(0,'127.0.0.1',()=>{
      const port=server.address().port;
      const req=http.request({hostname:'127.0.0.1',port,path:'/api/member/promotions/list',method,headers:{Origin:origin}},res=>{
        const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{server.close(()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString()}));});
      });
      req.on('error',e=>server.close(()=>reject(e)));req.end();
    });
  });
}

test('R1365 credentialed preflight is allowed only for Franklin Navigator',async()=>{
  const out=await onceRequest({origin:'https://franklinnavigator.com'});
  assert.equal(out.status,204);
  assert.equal(out.headers['access-control-allow-origin'],'https://franklinnavigator.com');
  assert.equal(out.headers['access-control-allow-credentials'],'true');
  assert.match(out.headers['access-control-allow-headers'],/X-Franklin-Rights-Confirmed/);
});

test('R1365 does not grant cross-origin access to an unrelated origin',async()=>{
  const out=await onceRequest({origin:'https://example.com'});
  assert.equal(out.status,200);
  assert.equal(out.headers['access-control-allow-origin'],undefined);
});
