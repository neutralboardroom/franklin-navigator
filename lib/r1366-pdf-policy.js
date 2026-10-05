'use strict';
const crypto=require('node:crypto');
const MAX_PDF_BYTES=4*1024*1024;
const MAX_PDF_PAGES=20;
const FORBIDDEN_TOKENS=[
  '/JavaScript','/JS','/OpenAction','/AA','/Launch','/EmbeddedFile','/Filespec',
  '/RichMedia','/AcroForm','/XFA','/SubmitForm','/ImportData','/GoToR','/Encrypt'
];
const sha256=v=>crypto.createHash('sha256').update(v).digest('hex');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function validatePdf(buf){
  if(!Buffer.isBuffer(buf)||buf.length<128||buf.length>MAX_PDF_BYTES)fail('PDF_SIZE_INVALID','PDF flyers and coupons must be 4 MB or smaller.');
  const head=buf.subarray(0,16).toString('latin1');
  if(!/^%PDF-(?:1\.[0-7]|2\.0)/.test(head))fail('PDF_TYPE_INVALID','Upload a standard PDF document.');
  const tail=buf.subarray(Math.max(0,buf.length-2048)).toString('latin1');
  if(!/%%EOF\s*$/.test(tail))fail('PDF_EOF_INVALID','The PDF appears incomplete or damaged.');
  const text=buf.toString('latin1');
  for(const token of FORBIDDEN_TOKENS){
    const re=new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i');
    if(re.test(text))fail('PDF_ACTIVE_CONTENT_NOT_ALLOWED','PDFs with scripts, forms, embedded files, encryption, launch actions or other active content are not accepted.');
  }
  const pageMatches=text.match(/\/Type\s*\/Page\b/g)||[];
  const counts=[...text.matchAll(/\/Count\s+(\d{1,4})\b/g)].map(m=>Number(m[1])).filter(Number.isFinite);
  const pageCount=Math.max(pageMatches.length,...counts,0);
  if(pageCount<1)fail('PDF_PAGE_COUNT_UNREADABLE','Use a standard, non-encrypted PDF whose pages can be validated.');
  if(pageCount>MAX_PDF_PAGES)fail('PDF_PAGE_LIMIT','PDF flyers and coupons may contain up to 20 pages.');
  return {mimeType:'application/pdf',byteSize:buf.length,sha256:sha256(buf),pageCount};
}
module.exports={MAX_PDF_BYTES,MAX_PDF_PAGES,FORBIDDEN_TOKENS,validatePdf};
