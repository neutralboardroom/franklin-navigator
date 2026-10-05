'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {validatePdf,MAX_PDF_BYTES,MAX_PDF_PAGES}=require('../lib/r1366-pdf-policy');
function pdf(extra='',pages=1){const pageObjs=Array.from({length:pages},(_,i)=>`${i+1} 0 obj\n<< /Type /Page >>\nendobj\n`).join('');const body=`%PDF-1.4\n${pageObjs}${extra}\ntrailer\n<< /Root 99 0 R >>\n`;const pad=' '.repeat(Math.max(0,160-body.length));return Buffer.from(body+pad+'\n%%EOF\n','latin1');}
test('accepts small passive standard PDF',()=>{const out=validatePdf(pdf());assert.equal(out.mimeType,'application/pdf');assert.equal(out.pageCount,1);assert.match(out.sha256,/^[a-f0-9]{64}$/);});
test('rejects active JavaScript PDF',()=>{assert.throws(()=>validatePdf(pdf('/JavaScript /JS')),e=>e.code==='PDF_ACTIVE_CONTENT_NOT_ALLOWED');});
test('rejects encrypted PDF',()=>{assert.throws(()=>validatePdf(pdf('/Encrypt 9 0 R')),e=>e.code==='PDF_ACTIVE_CONTENT_NOT_ALLOWED');});
test('rejects too many pages',()=>{assert.throws(()=>validatePdf(pdf('',MAX_PDF_PAGES+1)),e=>e.code==='PDF_PAGE_LIMIT');});
test('rejects non-PDF bytes',()=>{assert.throws(()=>validatePdf(Buffer.alloc(256,1)),e=>e.code==='PDF_TYPE_INVALID');});
test('rejects oversized PDF before parsing',()=>{const b=Buffer.alloc(MAX_PDF_BYTES+1,32);b.write('%PDF-1.4');assert.throws(()=>validatePdf(b),e=>e.code==='PDF_SIZE_INVALID');});
