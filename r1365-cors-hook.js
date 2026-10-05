'use strict';
const http=require('node:http');
const originalCreateServer=http.createServer;
const allowedOrigin=String(process.env.PUBLIC_ORIGIN||'https://franklinnavigator.com').replace(/\/$/,'');
http.createServer=function(listener){
  if(typeof listener!=='function') return originalCreateServer.apply(this,arguments);
  return originalCreateServer.call(this,(req,res)=>{
    const origin=String(req.headers.origin||'');
    if(origin&&origin===allowedOrigin){
      res.setHeader('Access-Control-Allow-Origin',allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials','true');
      res.setHeader('Vary','Origin');
      res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers','Content-Type, Idempotency-Key, X-Franklin-Rights-Confirmed');
      res.setHeader('Access-Control-Max-Age','600');
    }
    if(req.method==='OPTIONS'&&origin===allowedOrigin){
      res.statusCode=204;
      res.end();
      return;
    }
    return listener(req,res);
  });
};
module.exports={allowedOrigin};
