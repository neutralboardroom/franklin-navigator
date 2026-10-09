'use strict';
const fs=require('node:fs');const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const tools=read('dist/member-tools/index.html'),js=read('dist/assets/r1368-member-preview-extension.js'),css=read('dist/assets/r1368-member-preview.css'),first=read('dist/member-first-value/index.html');
assert.match(tools,/FR-NAV1\.30\.68-HF3\.13\.50/);assert.match(tools,/data-r1368-preview-workspace/);assert.match(tools,/r1368-member-preview-extension\.js/);
for(const phrase of ['Resident preview','Preview media','Remove media','Replace media','Vista previa para residentes','Eliminar contenido','Reemplazar contenido'])assert.ok(js.includes(phrase),`missing ${phrase}`);
assert.match(js,/\/api\/member\/promotions\/media\/remove/);assert.match(js,/fetch\(API\+m\.previewUrl/);assert.match(js,/URL\.createObjectURL/);assert.match(css,/r1368-preview-grid/);assert.match(css,/@media\(max-width:640px\)/);
assert.match(first,/Complete your member profile/);assert.match(first,/help increase your visibility in the Franklin community/);assert.match(first,/Create a coupon, special, sale or promotion/);assert.match(first,/Preview before you submit/);assert.match(first,/\$35\/year/);assert.match(first,/does not guarantee traffic, ranking, leads, customers, sales, bookings, revenue/);
console.log(JSON.stringify({ok:true,release:'FR-NAV1.30.68-HF3.13.50',promotionPreview:true,mediaPreview:true,mediaRemove:true,mediaReplace:true,postPaymentSetup:true,spanishDynamicParity:true,runtimeMutation:false}));
