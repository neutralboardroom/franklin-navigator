/* R1332 — cache-independent Community Member special-offer projection */
(()=>{'use strict';
 const m=location.pathname.match(/^\/profiles\/(FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100})\/$/);if(!m)return;
 const id=decodeURIComponent(m[1]),API='https://franklin-navigator-membership.onrender.com';
 const n=(t,x,c)=>{const e=document.createElement(t);if(x!==undefined)e.textContent=x;if(c)e.className=c;return e};
 const safe=v=>{try{const u=new URL(String(v||''));return u.protocol==='https:'&&!u.username&&!u.password?u:null}catch{return null}};
 async function run(){
  let out;try{const r=await fetch(API+'/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});if(!r.ok)return;out=await r.json()}catch{return}
  if(out.activePaidMember!==true)return;
  const p=out.publication;if(!p||p.profileId!==id||p.provenance!=='MEMBER_SUBMITTED_REVIEWED')return;
  const f=p.fields||{},title=String(f.specialOfferTitle||'').trim(),details=String(f.specialOfferDetails||'').trim(),expires=String(f.specialOfferExpires||'').trim();
  if(!title||!details||document.querySelector('#member-special-offer'))return;
  if(expires&&/^\d{4}-\d{2}-\d{2}$/.test(expires)&&new Date(expires+'T23:59:59').getTime()<Date.now())return;
  const article=document.querySelector('.r22-profile-layout>article');if(!article)return;
  const section=n('section','', 'hf35-member-module r1332-special-offer');section.id='member-special-offer';
  section.append(n('div','Community Member offer','eyebrow'),n('h2','Special offer for Franklin Navigator users'),n('h3',title),n('p',details));
  const meta=n('div','', 'r1332-offer-meta');
  if(String(f.specialOfferCode||'').trim())meta.append(n('span','Code: '+String(f.specialOfferCode).trim()));
  if(expires)meta.append(n('span','Through '+expires));
  if(meta.childNodes.length)section.append(meta);
  if(String(f.specialOfferTerms||'').trim())section.append(n('p',String(f.specialOfferTerms).trim(),'fine-print'));
  const u=safe(f.specialOfferUrl);if(u){const a=n('a','View offer','button primary');a.href=u.href;a.rel='noopener noreferrer ugc';section.append(a)}
  section.append(n('p','Offer provided by this Community Member. Franklin Navigator does not guarantee availability, terms or results.','fine-print'));
  const anchor=document.querySelector('#member-updates')||document.querySelector('#official-links')||document.querySelector('#manage');
  anchor?article.insertBefore(section,anchor):article.append(section);
  const nav=document.querySelector('.r1330-section-nav');if(nav&&!nav.querySelector('a[href="#member-special-offer"]')){const a=n('a','Offers');a.href='#member-special-offer';const reviews=nav.querySelector('a[href="#reviews"]');reviews?nav.insertBefore(a,reviews):nav.append(a)}
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run,{once:true}):run();
})();