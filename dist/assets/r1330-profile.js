/* R1330 — shared public profile presentation and reviewed-media projection */
(()=>{'use strict';
 const match=location.pathname.match(/^\/profiles\/(FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100})\/$/);if(!match)return;
 const id=decodeURIComponent(match[1]),API='https://franklin-navigator-membership.onrender.com',SELF_ID='FR-ORG-b00c0ace7943973c',isNavigatorSelf=id===SELF_ID;
 const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
 const el=(t,txt,cls)=>{const n=document.createElement(t);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n};
 const abs=u=>{try{return new URL(u,API).href}catch{return''}};
 const recognitionStyle=()=>{if(document.querySelector('link[data-r1354-recognition]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='/assets/r1354-recognition.css?v=frnav1354';l.dataset.r1354Recognition='1';document.head.append(l)};
 function renderRecognition(data){
   const r=data?.recognition;if(!r||!Array.isArray(r.participationYears)||!r.participationYears.length)return;
   recognitionStyle();
   document.querySelector('.r1354-recognition-card')?.remove();
   const article=document.querySelector('.r22-profile-layout>article');if(!article)return;
   const current=Boolean(r.currentMembershipActive&&r.currentYearRecognitionActive),year=current?r.currentQualifyingYear:r.participationYears[0];
   const card=el('section','','r1354-recognition-card'+(current?'':' is-historical'));card.setAttribute('aria-label','Community Membership recognition');
   card.append(el('div',(current?String(year)+' Community Member':'Past Community Member — '+String(year)),'r1354-recognition-year'));
   card.append(el('h2',current?'Current Community Membership':'Community Membership participation'));
   card.append(el('p',current?'This business is a current Franklin Navigator Community Member for '+year+'.':'Current Community Membership: inactive. Prior participation remains part of this profile history.'));
   const meta=el('ul','','r1354-recognition-meta');
   const years=el('li','Participation years: '+r.participationYears.join(', '),'r1354-recognition-history');meta.append(years);
   if(r.lastVerifiedAt){try{meta.append(el('li','Status checked '+new Intl.DateTimeFormat(undefined,{dateStyle:'medium'}).format(new Date(r.lastVerifiedAt))))}catch{}}
   card.append(meta);
   const actions=el('div','','r1354-recognition-actions');const verify=el('a','Verify Community Membership','button');verify.href=r.verificationUrl||('/membership-verification/?profile='+encodeURIComponent(id));actions.append(verify);card.append(actions);
   card.append(el('p','Community Membership recognition is not a government license, professional certification, quality guarantee, ranking or endorsement.','r1354-recognition-disclaimer'));
   const anchor=document.querySelector('#about')||article.firstElementChild;anchor?article.insertBefore(card,anchor):article.prepend(card);
 }
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
 function viewerProfileLink(me){return (me?.profileLinks||[]).find(x=>x&&x.profile_id===id)||null;}
 function stateRow(managed,viewerLink=null){
   const copy=document.querySelector('.r22-profile-hero-grid>div:nth-child(2)');if(!copy)return;
   let row=copy.querySelector('.r1330-profile-state');if(!row){row=el('div','', 'r1330-profile-state');const loc=copy.querySelector('.profile-location');(loc||copy.querySelector('h1'))?.insertAdjacentElement('afterend',row)}
   row.replaceChildren();
   if(isNavigatorSelf&&!viewerLink)copy.querySelector('.r1331-media-hint')?.remove();
   const authority=String(viewerLink?.authority_state||'').toUpperCase();
   let labelText='Management not yet verified',actionText='Manage this profile — free',href='/profile-access/?profile='+encodeURIComponent(id),hintText='Claiming and basic profile management are free. Factual corrections and removal requests also stay free.',managedForViewer=false;
   if(isNavigatorSelf&&!viewerLink){
     labelText='Official Franklin Navigator profile';actionText='Correct factual listing details';href='/corrections/?profile='+encodeURIComponent(id)+'&url='+encodeURIComponent(location.origin+'/profiles/'+id+'/');hintText='This official platform profile uses protected administrator access. Free factual corrections and removal requests remain available.';
   }else if(authority==='VERIFIED'){
     labelText='Management verified for you';actionText='Open Profile Center';href='/profile-studio/?profile='+encodeURIComponent(id);hintText='You have verified management access. You can manage your photo or logo and request factual corrections.';managedForViewer=true;
   }else if(authority==='PENDING'){
     labelText='Access request pending';actionText='Check access request';href='/profile-access/?profile='+encodeURIComponent(id);hintText='Your request is under review. Check it through free Profile Access. No membership or payment is required.';
   }else if(authority==='DISPUTED'){
     labelText='Access review needed';actionText='Get profile access help';href='/member-support/?topic=PROFILE_ACCESS&profile='+encodeURIComponent(id);hintText='Franklin needs to review this access issue before management can continue.';
   }else if(managed){
     labelText='Management verified';actionText='Manage this profile — free';href='/profile-access/?profile='+encodeURIComponent(id);hintText='This profile already has verified management access. If you are also authorized, you can request access; existing access is not removed automatically.';
   }
   if(isNavigatorSelf&&!viewerLink){row.classList.add('r1357-official-profile-state');row.style.setProperty('display','flex','important');row.style.setProperty('flex-wrap','wrap');row.style.setProperty('align-items','center');row.style.setProperty('gap','8px')}else{row.classList.remove('r1357-official-profile-state');row.style.removeProperty('display');row.style.removeProperty('flex-wrap');row.style.removeProperty('align-items');row.style.removeProperty('gap')}
   const label=el('span',labelText,'r1330-state-label'+((managed||managedForViewer)?' is-managed':''));
   const isClaimAction=actionText==='Manage this profile — free';
   document.body.classList.toggle('r1346-claimable',isClaimAction);
   const a=el('a',actionText,'r1330-claim-link'+(isClaimAction?' button r1343-claim-primary':''));a.href=href;row.append(label,a);
   let hint=copy.querySelector('.r1331-media-hint');if(!hint){hint=el('p','', 'r1331-media-hint');row.insertAdjacentElement('afterend',hint)}
   hint.textContent=hintText;
   const manage=document.querySelector('#manage');if(manage){
     const p=manage.querySelector('p');
     if(p)p.textContent=managedForViewer?'You have verified management access. Public factual information still uses the free correction process; Community Membership is optional.':isNavigatorSelf?'This is Franklin Navigator’s official first-party profile. Administrator access is protected; factual corrections and removal requests remain free.':managed?'This profile already has verified management access. Authorized additional managers may request access without displacing existing access. Factual corrections and removal requests stay free.':'Own or manage this business, practice or organization? Claim this profile free. Factual corrections and removal requests stay free; Community Membership is optional.';
     const actions=manage.querySelector('.actions'),primary=actions?.querySelector('.button.primary');
     if(primary){primary.href=href;primary.textContent=actionText;primary.classList.toggle('r1343-claim-primary',isClaimAction)}
     if(actions){
       const direct=[...actions.children].filter(x=>x.tagName==='A'),secondary=direct.find(x=>x!==primary);
       if(secondary){secondary.href=(managedForViewer?'/profile-studio/?profile=':'/member-profile-preview/?profile=')+encodeURIComponent(id);secondary.textContent=managedForViewer?'Open Profile Center':'Preview optional member profile'}
       const details=actions.querySelector('details.hf35-admin-more');
       const profileName=document.querySelector('.r22-profile-hero h1')?.textContent?.trim()||'';
       const page=location.origin+'/profiles/'+id+'/';
       const correction='/corrections/?listing='+encodeURIComponent(profileName)+'&profile='+encodeURIComponent(id)+'&url='+encodeURIComponent(page);
       const removal='/corrections/?action=PUBLIC_REMOVAL&listing='+encodeURIComponent(profileName)+'&profile='+encodeURIComponent(id)+'&url='+encodeURIComponent(page);
       if(!actions.querySelector('[data-r1338-correct]')){const x=el('a','Correct factual listing details','button');x.href=correction;x.dataset.r1338Correct='1';actions.append(x)}
       if(!actions.querySelector('[data-r1338-remove]')){const x=el('a','Request removal','button');x.href=removal;x.dataset.r1338Remove='1';actions.append(x)}
       if(details)details.remove();
     }
   }
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
     const [profileRes,mediaRes,accountRes,recognitionRes]=await Promise.allSettled([
       fetch(API+'/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()),
       fetch(API+'/api/member/media/public?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()),
       fetch(API+'/api/accounts/me',{credentials:'include',cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
       fetch(API+'/api/member/public-recognition?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject())
     ]);
     const managed=profileRes.status==='fulfilled'&&typeof profileRes.value.managedProfile==='boolean'?profileRes.value.managedProfile:fallbackManaged;
     const viewerLink=accountRes.status==='fulfilled'?viewerProfileLink(accountRes.value):null;
     stateRow(managed,viewerLink);
     if(mediaRes.status==='fulfilled'&&Array.isArray(mediaRes.value.media))media(mediaRes.value.media);
     if(recognitionRes.status==='fulfilled')renderRecognition(recognitionRes.value);
   }catch{}
   setTimeout(()=>{cleanPublicLanguage();sectionNav()},60);setTimeout(()=>{cleanPublicLanguage();sectionNav()},450);
 });
})();