/* R1330 — shared public profile presentation and reviewed-media projection */
(()=>{'use strict';
 const match=location.pathname.match(/^\/profiles\/(FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100})\/$/);if(!match)return;
 const id=decodeURIComponent(match[1]),API='https://franklin-navigator-membership.onrender.com',SELF_ID='FR-ORG-b00c0ace7943973c',isNavigatorSelf=id===SELF_ID;
 const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
 const el=(t,txt,cls)=>{const n=document.createElement(t);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n};
 const abs=u=>{try{return new URL(u,API).href}catch{return''}};
 function hidePublicProvenance(){
   document.querySelectorAll('a[href="#sources"]').forEach(a=>a.remove());
   const src=document.querySelector('#sources');if(src)src.remove();
   document.querySelector('.profile-currentness')?.remove();
 }
 function cleanTextValue(value){
   return String(value||'')
     .replace(/\s*[—-]\s*listed in Visit Franklin community guide;\s*street address not asserted in this release/gi,'')
     .replace(/\s*[—-]\s*official school roster;\s*street address not asserted in this release/gi,'')
     .replace(/\s*[—-]\s*locality qualified by the cited current community directory;\s*street address not asserted/gi,'')
     .replace(/\s*[—-]\s*source-backed service area;\s*street address not asserted/gi,'')
     .replace(/\s*[—-]\s*service\/location identity source-backed;\s*street address not asserted in this release/gi,'')
     .replace(/;?\s*street address not asserted in this release/gi,'')
     .replace(/;?\s*street address not asserted/gi,'')
     .replace(/\s{2,}/g,' ')
     .trim();
 }
 function cleanPublicLanguage(){
   hidePublicProvenance();
   document.querySelectorAll('.profile-location,.r22-profile-side .fine-print').forEach(node=>{node.textContent=cleanTextValue(node.textContent)});
   const about=document.querySelector('#about p');
   if(about){
     let t=about.textContent||'';
     t=t.replace(/Use the verified contact and source links on this page to confirm current services, hours, pricing and availability\.?/gi,'Contact them directly for current services, hours, pricing and availability.');
     t=t.replace(/No direct contact route is available in the current public sources\.?/gi,'No direct contact information is available on this profile yet.');
     t=t.replace(/service\/location identity source-backed; street address not asserted in this release/gi,'Franklin, Tennessee');
     t=t.replace(/street address not asserted in this release/gi,'street address not listed');
     about.textContent=cleanTextValue(t);
   }
   document.querySelectorAll('.fine-print').forEach(node=>{
     const t=(node.textContent||'').trim();
     if(/Related by category only—not ranked or recommended\.?/i.test(t))node.textContent='More profiles in the same category.';
   });
   const official=document.querySelector('#official-links h2');if(official&&/^Official\b/i.test(official.textContent||''))official.textContent='Helpful links';
   const manage=document.querySelector('#manage .button:not(.primary)');if(manage&&/member profile options/i.test(manage.textContent||''))manage.textContent='Preview Community Member profile';
 }
 function sectionNav(){
   if(document.querySelector('.r1330-section-nav'))return;
   const article=document.querySelector('.r22-profile-layout>article');if(!article)return;
   const defs=[['about','Overview'],['details','Details'],['official-links','Helpful links'],['member-services','Services'],['member-details','More details'],['member-gallery','Photos'],['r1330-uploaded-photos','Photos'],['manage','Manage']];
   const seen=new Set(),items=defs.filter(([i])=>document.getElementById(i)&&!seen.has(i)&&seen.add(i));if(items.length<2)return;
   const nav=el('nav','', 'r1330-section-nav');nav.setAttribute('aria-label','Profile sections');
   for(const [i,label] of items){const a=el('a',label);a.href='#'+i;nav.append(a)}
   article.parentElement?.insertBefore(nav,article);
 }
 function stateRow(managed){
   const copy=document.querySelector('.r22-profile-hero-grid>div:nth-child(2)');if(!copy)return;
   let row=copy.querySelector('.r1330-profile-state');if(!row){row=el('div','', 'r1330-profile-state');const loc=copy.querySelector('.profile-location');(loc||copy.querySelector('h1'))?.insertAdjacentElement('afterend',row)}
   row.replaceChildren();
   if(isNavigatorSelf){
     row.append(el('span','Official Franklin Navigator profile','r1330-state-label is-managed'));
     copy.querySelector('.r1331-media-hint')?.remove();
     document.querySelector('#manage')?.remove();
     return;
   }
   const label=el('span',managed?'Managed profile':'Unclaimed profile','r1330-state-label'+(managed?' is-managed':''));
   const a=el('a',managed?'Manage this profile':'Claim or manage this profile','r1330-claim-link');a.href='/profile-access/?profile='+encodeURIComponent(id);row.append(label,a);
   let hint=copy.querySelector('.r1331-media-hint');if(!hint){hint=el('p','', 'r1331-media-hint');row.insertAdjacentElement('afterend',hint)}
   hint.replaceChildren();
   if(managed){hint.append(document.createTextNode('Want to change the picture or logo? '));const upload=el('a','Upload your own image');upload.href='/profile-studio/?profile='+encodeURIComponent(id);hint.append(upload)}
   else hint.textContent='Claim this profile free to upload your own photo or logo.';
   const manage=document.querySelector('#manage');if(manage){const p=manage.querySelector('p');if(p)p.textContent=managed?'This profile has verified management access. Basic profile management, factual corrections and removal stay free; Community Membership is optional.':'Own or manage this business, practice or organization? Claim management access for free. Factual corrections and removal stay free; Community Membership is optional.';const primary=manage.querySelector('.actions .button.primary');if(primary){primary.href=a.href;primary.textContent=managed?'Manage this profile':'Claim or manage this profile'}}
 }
 function media(items){
   const profile=items.find(x=>x.slot==='PROFILE'),cover=items.find(x=>x.slot==='COVER'),gallery=items.filter(x=>x.slot==='GALLERY').sort((a,b)=>a.position-b.position);
   if(profile){const av=document.querySelector('.profile-avatar');if(av){av.replaceChildren();const img=document.createElement('img');img.src=abs(profile.url);img.alt='';img.loading='eager';av.append(img)}}
   if(cover&&!document.querySelector('.r1330-cover')){const hero=document.querySelector('.r22-profile-hero');if(hero){const box=el('div','', 'r1330-cover'),img=document.createElement('img');img.src=abs(cover.url);img.alt='';img.loading='eager';box.append(img);hero.prepend(box);hero.classList.add('r1330-has-cover')}}
   if(gallery.length&&!document.querySelector('#r1330-uploaded-photos')){const existing=document.querySelector('#member-gallery .hf35-member-gallery');if(existing){gallery.forEach(row=>{const src=abs(row.url);if([...existing.querySelectorAll('img')].some(i=>i.src===src))return;const img=document.createElement('img');img.src=src;img.alt='';img.loading='lazy';existing.prepend(img)})}else{const article=document.querySelector('.r22-profile-layout>article'),anchor=document.querySelector('#manage');if(article){const section=el('section','', 'r1330-uploaded-media');section.id='r1330-uploaded-photos';section.append(el('h2','Photos'));const g=el('div','', 'r1330-gallery');gallery.forEach(row=>{const img=document.createElement('img');img.src=abs(row.url);img.alt='';img.loading='lazy';g.append(img)});section.append(g);anchor?article.insertBefore(section,anchor):article.append(section)}}}
 }
 ready(async()=>{
   document.body.classList.add('r1330-profile');
   const current=document.querySelector('.profile-currentness'),fallbackManaged=isNavigatorSelf?true:(current?!/unclaimed/i.test(current.textContent||''):false);
   current?.remove();cleanPublicLanguage();stateRow(fallbackManaged);
   try{
     const [profileRes,mediaRes]=await Promise.allSettled([
       fetch(API+'/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()),
       fetch(API+'/api/member/media/public?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject())
     ]);
     if(profileRes.status==='fulfilled'&&typeof profileRes.value.managedProfile==='boolean')stateRow(profileRes.value.managedProfile);
     if(mediaRes.status==='fulfilled'&&Array.isArray(mediaRes.value.media))media(mediaRes.value.media);
   }catch{}
   setTimeout(()=>{cleanPublicLanguage();sectionNav()},60);setTimeout(()=>{cleanPublicLanguage();sectionNav()},450);
 });
})();