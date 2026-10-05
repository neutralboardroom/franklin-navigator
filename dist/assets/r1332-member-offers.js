/* R1365 — public Community Member offers, promotions and events */
(()=>{'use strict';
 const m=location.pathname.match(/^\/profiles\/(FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100})\/$/);if(!m)return;
 const id=decodeURIComponent(m[1]),API='https://franklin-navigator-membership.onrender.com';
 const n=(t,x,c)=>{const e=document.createElement(t);if(x!==undefined)e.textContent=x;if(c)e.className=c;return e};
 const safe=v=>{try{const u=new URL(String(v||''));return u.protocol==='https:'&&!u.username&&!u.password?u:null}catch{return null}};
 const kindLabel=k=>({COUPON:'Coupon',SPECIAL:'Special offer',SALE:'Sale',PROMOTION:'Promotion',EVENT:'Event'}[k]||'Community Member update');
 const when=v=>{try{return v?new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):''}catch{return''}};
 function addCss(){if(document.querySelector('link[data-r1365-member-tools]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='/assets/r1365-member-tools.css?v=frnav1365';l.dataset.r1365MemberTools='1';document.head.append(l)}
 function article(){return document.querySelector('.r22-profile-layout>article')}
 function insert(section){const a=article();if(!a)return false;const anchor=document.querySelector('#member-updates')||document.querySelector('#official-links')||document.querySelector('#manage');anchor?a.insertBefore(section,anchor):a.append(section);return true}
 function addNav(id,label){const nav=document.querySelector('.r1330-section-nav');if(nav&&!nav.querySelector('a[href="#'+id+'"]')){const a=n('a',label);a.href='#'+id;const reviews=nav.querySelector('a[href="#reviews"]');reviews?nav.insertBefore(a,reviews):nav.append(a)}}
 async function legacy(){
  let out;try{const r=await fetch(API+'/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});if(!r.ok)return;out=await r.json()}catch{return}
  if(out.activePaidMember!==true)return;const p=out.publication;if(!p||p.profileId!==id||p.provenance!=='MEMBER_SUBMITTED_REVIEWED')return;
  const f=p.fields||{},title=String(f.specialOfferTitle||'').trim(),details=String(f.specialOfferDetails||'').trim(),expires=String(f.specialOfferExpires||'').trim();if(!title||!details||document.querySelector('#member-special-offer'))return;
  if(expires&&/^\d{4}-\d{2}-\d{2}$/.test(expires)&&new Date(expires+'T23:59:59').getTime()<Date.now())return;
  const section=n('section','', 'hf35-member-module r1332-special-offer');section.id='member-special-offer';section.append(n('div','Community Member offer','eyebrow'),n('h2','Special offer for Franklin Navigator users'),n('h3',title),n('p',details));const meta=n('div','', 'r1332-offer-meta');if(String(f.specialOfferCode||'').trim())meta.append(n('span','Code: '+String(f.specialOfferCode).trim()));if(expires)meta.append(n('span','Through '+expires));if(meta.childNodes.length)section.append(meta);if(String(f.specialOfferTerms||'').trim())section.append(n('p',String(f.specialOfferTerms).trim(),'fine-print'));const u=safe(f.specialOfferUrl);if(u){const a=n('a','View offer','button primary');a.href=u.href;a.rel='noopener noreferrer ugc';section.append(a)}section.append(n('p','Offer provided by this Community Member. Franklin Navigator does not guarantee availability, terms or results.','fine-print'));if(insert(section))addNav('member-special-offer','Offers')
 }
 async function currentPromotions(){
  let out;try{const r=await fetch(API+'/api/member/promotions/public?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});if(!r.ok)return;out=await r.json()}catch{return}
  const items=Array.isArray(out.promotions)?out.promotions:[];if(!items.length||document.querySelector('#member-promotions'))return;addCss();
  const section=n('section',undefined,'hf35-member-module r1365-public-promotions');section.id='member-promotions';section.append(n('div','Community Member updates','eyebrow'),n('h2','Offers, promotions & events'));
  const grid=n('div',undefined,'r1365-public-grid');
  for(const item of items){const card=n('article',undefined,'r1365-public-card');card.append(n('div',kindLabel(item.kind),'eyebrow'),n('h3',String(item.title||'')),n('p',String(item.description||'')));const media=Array.isArray(item.media)?item.media:[];for(const asset of media.slice(0,2)){if(asset.mimeType!=='image/webp'||!asset.url)continue;const img=document.createElement('img');img.src=API+asset.url;img.alt='Promotional image for '+String(item.title||'this Community Member update');img.loading='lazy';img.decoding='async';card.append(img)}const meta=n('div',undefined,'r1365-promo-meta');if(item.promoCode)meta.append(n('span','Code: '+item.promoCode));if(item.discountText)meta.append(n('span',item.discountText));if(item.startAt)meta.append(n('span','Starts '+when(item.startAt)));if(item.endAt)meta.append(n('span',(item.kind==='EVENT'?'Ends ':'Through ')+when(item.endAt)));if(item.eventLocation)meta.append(n('span',item.eventLocation));if(meta.childNodes.length)card.append(meta);const u=safe(item.actionUrl);if(u){const a=n('a',item.kind==='EVENT'?'Event details':'View details','button primary');a.href=u.href;a.rel='noopener noreferrer ugc';card.append(a)}grid.append(card)}
  section.append(grid,n('p','These items were submitted by this Community Member and reviewed for publication. Dates, availability and terms can change; confirm important details directly with the business or organization. Franklin Navigator does not guarantee results.','fine-print'));if(insert(section))addNav('member-promotions','Offers & events')
 }
 async function run(){await Promise.allSettled([legacy(),currentPromotions()])}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run,{once:true}):run();
})();