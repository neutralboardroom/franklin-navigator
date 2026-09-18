/* R1333 — rich paid-member profiles + clearly labeled sponsored visibility on unpaid profiles */
(()=>{'use strict';
 const m=location.pathname.match(/^\/profiles\/(FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100})\/$/);if(!m)return;
 const id=decodeURIComponent(m[1]),API='https://franklin-navigator-membership.onrender.com';
 const commercialPage=!/^FR-(?:GOV|CIV|NPO)-/.test(id);
 const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
 const el=(t,txt,cls)=>{const e=document.createElement(t);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e};
 const safe=v=>{try{const u=new URL(String(v||''));return u.protocol==='https:'&&!u.username&&!u.password?u:null}catch{return null}};
 const abs=u=>new URL(u,API).href;
 const get=async path=>{const r=await fetch(API+path,{credentials:'omit',cache:'no-store'});if(!r.ok)throw new Error('request');return r.json()};
 function ensureMemberBadge(){
   const h=q('.r22-profile-hero h1');if(!h||q('.r1333-paid-badge'))return;
   const b=el('span','Community Member','r1333-paid-badge');h.insertAdjacentElement('beforebegin',b);
 }
 function imageDialog(src){
   let d=q('.r1333-media-dialog');if(!d){d=document.createElement('dialog');d.className='r1333-media-dialog';const img=document.createElement('img'),close=el('button','×');close.type='button';close.setAttribute('aria-label','Close photo');close.onclick=()=>d.close();d.onclick=e=>{if(e.target===d)d.close()};d.append(img,close);document.body.append(d)}
   q('img',d).src=src;if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
 }
 function mediaMosaic(items){
   const media=items.filter(x=>['COVER','GALLERY'].includes(x.slot)).sort((a,b)=>{
     if(a.slot!==b.slot)return a.slot==='COVER'?-1:1;return Number(a.position||0)-Number(b.position||0)
   }).slice(0,5);
   if(!media.length)return;
   q('.r1330-cover')?.remove();
   const hero=q('.r22-profile-hero'),grid=q('.r22-profile-hero-grid');if(!hero||!grid||q('.r1333-media-mosaic'))return;
   const box=el('div','', 'r1333-media-mosaic count-'+media.length);
   media.forEach((row,i)=>{const b=el('button','', 'r1333-media-tile tile-'+(i+1));b.type='button';const img=document.createElement('img');img.src=abs(row.url);img.alt='';img.loading=i<2?'eager':'lazy';b.append(img);b.onclick=()=>imageDialog(img.src);box.append(b)});
   const target=q('#r1330-uploaded-photos')||q('#member-gallery');if(target){const all=el('a','See all photos','r1333-see-photos');all.href='#'+target.id;box.append(all)}
   hero.insertBefore(box,grid);hero.classList.add('r1333-has-media');
 }
 function addTagline(fields){
   const tagline=String(fields?.tagline||'').trim(),h=q('.r22-profile-hero h1');if(!tagline||!h||q('.r1333-tagline'))return;
   const p=el('p',tagline,'r1333-tagline');h.insertAdjacentElement('afterend',p);
 }
 function practicalCard(fields){
   const side=q('.r22-profile-side');if(!side||q('.r1333-member-card'))return;
   const vals=[
     ['Hours',fields?.hours],['Service area',fields?.serviceArea],['Languages',fields?.languages],['Pricing',fields?.pricing]
   ].filter(x=>String(x[1]||'').trim());
   const links=[
     ['Book',fields?.bookingUrl],['Get a quote',fields?.quoteUrl],['Contact',fields?.contactUrl],['Menu / services',fields?.menuUrl],['Order',fields?.orderUrl],['Website',fields?.website]
   ].map(([label,url])=>[label,safe(url)]).filter(x=>x[1]);
   if(!vals.length&&!links.length)return;
   const card=el('section','', 'r22-card r1333-member-card');card.append(el('div','Community Member','eyebrow'),el('h2','At a glance'));
   vals.forEach(([label,value])=>{const row=el('div','', 'r1333-glance-row');row.append(el('span',label),el('strong',String(value).trim()));card.append(row)});
   if(links.length){const acts=el('div','', 'r1333-glance-actions');links.slice(0,4).forEach(([label,u],i)=>{const a=el('a',label,i===0?'button primary':'button');a.href=u.href;a.rel='noopener noreferrer ugc';acts.append(a)});card.append(acts)}
   side.prepend(card);
 }
 async function sponsoredCards(){
   if(!commercialPage)return;
   const category=q('.breadcrumbs a[href*="category="]')?.textContent?.trim()||'';let out;try{out=await get('/api/member/sponsored-profiles?excludeProfileId='+encodeURIComponent(id)+'&limit=2'+(category?'&category='+encodeURIComponent(category):''))}catch{return}
   const rows=Array.isArray(out?.profiles)?out.profiles:[];if(!rows.length)return;
   const hero=q('.r22-profile-hero');if(!hero||q('.r1333-sponsored-strip'))return;
   const section=el('section','', 'r1333-sponsored-strip'),wrap=el('div','', 'wrap r1333-sponsored-wrap');
   const head=el('div','', 'r1333-sponsored-head');head.append(el('span','Sponsored','r1333-sponsored-label'),el('strong','Franklin Community Members'));wrap.append(head);
   const grid=el('div','', 'r1333-sponsored-grid');wrap.append(grid);section.append(wrap);
   for(const row of rows){
     const card=el('article','', 'r1333-sponsored-card'),link=el('a','', 'r1333-sponsored-link');link.href='/profiles/'+encodeURIComponent(row.profileId)+'/';
     let media=[];try{const mr=await get('/api/member/media/public?profileId='+encodeURIComponent(row.profileId));media=Array.isArray(mr.media)?mr.media:[]}catch{}
     const pic=media.find(x=>x.slot==='PROFILE')||media.find(x=>x.slot==='COVER')||media.find(x=>x.slot==='GALLERY');
     const visual=el('div','', 'r1333-sponsored-image');
     if(pic){const img=document.createElement('img');img.src=abs(pic.url);img.alt='';img.loading='lazy';visual.append(img)}else{visual.textContent=String(row.profileName||'FM').split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase().slice(0,2)}
     const copy=el('div','', 'r1333-sponsored-copy');copy.append(el('div',row.profileName||'Community Member','r1333-sponsored-name'));
     const f=row.publication?.fields||{},summary=String(f.tagline||f.summary||'').trim();
     if(summary)copy.append(el('p',summary.length>150?summary.slice(0,147)+'…':summary));
     const offer=String(f.specialOfferTitle||'').trim();if(offer)copy.append(el('span','Special offer: '+offer,'r1333-sponsored-offer'));
     copy.append(el('span','View profile →','r1333-sponsored-view'));link.append(visual,copy);card.append(link);grid.append(card);
   }
   hero.insertAdjacentElement('afterend',section);
 }
 async function run(){
   const releaseMeta=q('meta[name="franklin-release"]');if(releaseMeta)releaseMeta.content='FR-NAV1.30.33-HF3.13.15';
   let profile,media=[];try{
     const [p,mr]=await Promise.all([get('/api/member/public-profile?profileId='+encodeURIComponent(id)),get('/api/member/media/public?profileId='+encodeURIComponent(id)).catch(()=>({media:[]}))]);
     profile=p;media=Array.isArray(mr.media)?mr.media:[];
   }catch{return}
   if(profile?.activePaidMember===true){
     document.body.classList.add('r1333-paid-profile');ensureMemberBadge();mediaMosaic(media);
     const fields=profile.publication?.fields||{};addTagline(fields);practicalCard(fields);
   }else{
     document.body.classList.add('r1333-unpaid-profile');await sponsoredCards();
   }
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run,{once:true}):run();
})();