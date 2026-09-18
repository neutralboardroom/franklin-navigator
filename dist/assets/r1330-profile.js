/* R1330 — shared public profile presentation and reviewed-media projection */
(()=>{'use strict';
 const match=location.pathname.match(/^\/profiles\/(FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100})\/$/);if(!match)return;
 const id=decodeURIComponent(match[1]),API='https://franklin-navigator-membership.onrender.com';
 const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
 const el=(t,txt,cls)=>{const n=document.createElement(t);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n};
 const abs=u=>{try{return new URL(u,API).href}catch{return''}};
 function simplifySources(){
   const src=document.querySelector('#sources');if(!src)return;
   const summary=src.querySelector('summary');if(summary)summary.textContent='Sources & listing details';
   src.querySelectorAll('.source-list li').forEach(li=>{for(const node of [...li.childNodes])if(node.nodeType===Node.TEXT_NODE)node.textContent=node.textContent.replace(/\s*·\s*checked\s+[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/gi,'')});
 }
 function sectionNav(){
   if(document.querySelector('.r1330-section-nav'))return;
   const article=document.querySelector('.r22-profile-layout>article');if(!article)return;
   const defs=[['about','Overview'],['details','Details'],['official-links','Official links'],['member-services','Services'],['member-details','More details'],['member-gallery','Photos'],['r1330-uploaded-photos','Photos'],['manage','Manage']];
   const seen=new Set(),items=defs.filter(([i])=>document.getElementById(i)&&!seen.has(i)&&seen.add(i));if(items.length<2)return;
   const nav=el('nav','', 'r1330-section-nav');nav.setAttribute('aria-label','Profile sections');
   for(const [i,label] of items){const a=el('a',label);a.href='#'+i;nav.append(a)}
   article.parentElement?.insertBefore(nav,article);
 }
 function stateRow(managed){
   const copy=document.querySelector('.r22-profile-hero-grid>div:nth-child(2)');if(!copy)return;
   let row=copy.querySelector('.r1330-profile-state');if(!row){row=el('div','', 'r1330-profile-state');const loc=copy.querySelector('.profile-location');(loc||copy.querySelector('h1'))?.insertAdjacentElement('afterend',row)}
   row.replaceChildren();const label=el('span',managed?'Managed profile':'Unclaimed profile','r1330-state-label'+(managed?' is-managed':''));
   const a=el('a',managed?'Manage this profile':'Claim or manage this profile','r1330-claim-link');a.href='/profile-access/?profile='+encodeURIComponent(id);row.append(label,a);
   const manage=document.querySelector('#manage');if(manage){const p=manage.querySelector('p');if(p)p.textContent=managed?'This profile has verified management access. Basic profile management, factual corrections and removal stay free; Community Membership is optional.':'Own or manage this business, practice or organization? Claim management access for free. Factual corrections and removal stay free; Community Membership is optional.';const primary=manage.querySelector('.actions .button.primary');if(primary){primary.href=a.href;primary.textContent=managed?'Manage this profile':'Claim or manage this profile'}}
 }
 function media(items){
   const profile=items.find(x=>x.slot==='PROFILE'),cover=items.find(x=>x.slot==='COVER'),gallery=items.filter(x=>x.slot==='GALLERY').sort((a,b)=>a.position-b.position);
   if(profile){const av=document.querySelector('.profile-avatar');if(av){av.replaceChildren();const img=document.createElement('img');img.src=abs(profile.url);img.alt='';img.loading='eager';av.append(img)}}
   if(cover&&!document.querySelector('.r1330-cover')){const hero=document.querySelector('.r22-profile-hero');if(hero){const box=el('div','', 'r1330-cover'),img=document.createElement('img');img.src=abs(cover.url);img.alt='';img.loading='eager';box.append(img);hero.prepend(box);hero.classList.add('r1330-has-cover')}}
   if(gallery.length&&!document.querySelector('#r1330-uploaded-photos')){const article=document.querySelector('.r22-profile-layout>article'),anchor=document.querySelector('#sources')||document.querySelector('#manage');if(article){const s=el('section','', 'r1330-uploaded-media');s.id='r1330-uploaded-photos';s.append(el('h2','Photos'));const g=el('div','', 'r1330-gallery');gallery.forEach(row=>{const img=document.createElement('img');img.src=abs(row.url);img.alt='';img.loading='lazy';g.append(img)});s.append(g);anchor?article.insertBefore(s,anchor):article.append(s)}}
 }
 ready(async()=>{
   document.body.classList.add('r1330-profile');
   const current=document.querySelector('.profile-currentness'),fallbackManaged=current?!/unclaimed/i.test(current.textContent||''):false;
   current?.setAttribute('aria-hidden','true');simplifySources();stateRow(fallbackManaged);
   try{
     const [profileRes,mediaRes]=await Promise.allSettled([
       fetch(API+'/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()),
       fetch(API+'/api/member/media/public?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject())
     ]);
     if(profileRes.status==='fulfilled'&&typeof profileRes.value.managedProfile==='boolean')stateRow(profileRes.value.managedProfile);
     if(mediaRes.status==='fulfilled'&&Array.isArray(mediaRes.value.media))media(mediaRes.value.media);
   }catch{}
   setTimeout(sectionNav,60);setTimeout(sectionNav,450);
 });
})();