/* R1366 — PDF promotion documents without disturbing the qualified R1365 image path */
(()=>{'use strict';
const API='https://franklin-navigator-membership.onrender.com',MAX=4*1024*1024;
function status(text,kind=''){const n=document.querySelector('[data-r1365-status]');if(!n)return;n.textContent=text;n.className='r1365-status'+(kind?' '+kind:'')}
async function json(r){let out={};try{out=await r.json()}catch{}if(!r.ok)throw new Error(out?.error?.message||out?.message||'The PDF could not be uploaded.');return out}
function profileId(){return document.querySelector('[data-r1365-profile-picker] select')?.value||''}
function isPdf(file){return file&&((file.type||'').toLowerCase()==='application/pdf'||/\.pdf$/i.test(file.name||''))}
async function uploadPdf(form,file){
 if(file.size>MAX)throw new Error('PDF flyers and coupons must be 4 MB or smaller.');
 const head=new TextDecoder('latin1').decode(await file.slice(0,16).arrayBuffer());if(!head.startsWith('%PDF-'))throw new Error('Choose a standard PDF document.');
 if(!form.elements.rights?.checked)throw new Error('Confirm you own this document or have permission to publish it.');
 const profile=profileId();if(!profile)throw new Error('Choose the Franklin profile you want to manage.');
 const promotionId=String(form.elements.promotionId?.value||''),mediaKind=String(form.elements.mediaKind?.value||'');
 if(!promotionId||!mediaKind)throw new Error('Choose the offer, promotion or event for this document.');
 status('Uploading PDF for review…');
 const u=await fetch(API+`/api/member/promotions/media/upload?profileId=${encodeURIComponent(profile)}&promotionId=${encodeURIComponent(promotionId)}&mediaKind=${encodeURIComponent(mediaKind)}`,{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/pdf','X-Franklin-Rights-Confirmed':'true'},body:file});
 const uploaded=await json(u);
 const s=await fetch(API+`/api/member/promotions/media/submit?profileId=${encodeURIComponent(profile)}`,{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({promotionId,mediaId:uploaded.mediaId})});
 await json(s);form.reset();status('PDF uploaded and submitted for review.','good');setTimeout(()=>location.reload(),700);
}
document.addEventListener('DOMContentLoaded',()=>{const form=document.querySelector('[data-r1365-media-form]');if(!form)return;form.addEventListener('submit',e=>{const file=form.elements.file?.files?.[0];if(!isPdf(file))return;e.preventDefault();e.stopImmediatePropagation();uploadPdf(form,file).catch(err=>status(err.message,'warn'));},true);});
})();
