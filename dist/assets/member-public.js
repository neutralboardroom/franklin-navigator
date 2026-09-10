'use strict';
(async()=>{
 const match=location.pathname.match(/^\/profiles\/([^/]+)\/$/);if(!match)return;
 const id=decodeURIComponent(match[1]);if(!/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(id))return;
 const API='https://franklin-navigator-membership.onrender.com';
 const main=document.querySelector('main');
 document.body.dataset.franklinMemberEntitlement='pending';
 const n=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 const safeHttps=value=>{try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password?u:null}catch{return null}};
 const lines=value=>String(value||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
 const removeSimilar=()=>{document.body.dataset.franklinActiveMemberProfile='true';document.body.dataset.franklinMemberEntitlement='active';document.querySelectorAll('.hf31-related-card,[data-hf33-related],.hf33-related-section').forEach(el=>el.remove());};
 const event=()=>window.dispatchEvent(new CustomEvent('franklinmemberprofilechange',{detail:{profileId:id,activePaidMember:document.body.dataset.franklinActiveMemberProfile==='true'}}));
 try{
  const ledger=await fetch('/data/public-profile-suppressions.json',{cache:'no-store'});if(!ledger.ok)throw new Error('SUPPRESSION_LEDGER_UNAVAILABLE');const data=await ledger.json();const suppressed=(data.entries||[]).some(e=>e&&e.profileId===id&&e.status==='SUPPRESSED');
  if(suppressed){let robots=document.querySelector('meta[name="robots"]');if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.append(robots)}robots.content='noindex,nofollow';document.title='Profile unavailable | Franklin Navigator';if(main){main.replaceChildren();const s=n('section','');s.className='section';const w=n('div','');w.className='wrap narrow';w.append(n('h1','This profile is not publicly displayed.'),n('p','This profile has been removed from Franklin Navigator public view. A paid membership is not required to request removal or a factual correction.'));const a=n('a','Contact Franklin Navigator about this profile','button');a.href='/corrections/?profile='+encodeURIComponent(id);w.append(a);s.append(w);main.append(s)}return}
 }catch{document.body.dataset.franklinMemberEntitlement='unknown';if(main){main.replaceChildren();const s=n('section','');s.className='section';const w=n('div','');w.className='wrap narrow';w.append(n('h1','This profile is temporarily unavailable.'),n('p','Franklin Navigator could not verify the public-display status of this profile. Please try again shortly.'));s.append(w);main.append(s)}return}

 // Keep free correction/removal visible, but integrate it into the existing management area when possible.
 try{
  const layout=document.querySelector('.r22-profile-layout');
  const article=layout?.querySelector(':scope > article');
  let target=[...(article?.children||[])].find(s=>/Suggest a correction or claim this profile|Manage or correct this profile/i.test(s.querySelector('h2')?.textContent||''));
  if(!target&&main){target=n('section','');target.className='section hf33-profile-controls';const w=n('div','');w.className='wrap narrow';target.append(w);w.append(n('h2','Manage this profile'),n('p','Claiming, factual corrections and public-profile removal are separate. Corrections and removal requests are free.'));main.append(target);target=w}
  if(target){target.dataset.freeProfileControl='';let actions=target.querySelector('.actions');if(!actions){actions=n('div','', 'actions');target.append(actions)}
   const page=location.href;
   const add=(label,href,attr)=>{if([...actions.querySelectorAll('a')].some(a=>a.href===new URL(href,location.href).href))return;const a=n('a',label,'button');a.href=href;a.dataset[attr]='';actions.append(a)};
   add('Correct profile information','/corrections/?profile='+encodeURIComponent(id)+'&url='+encodeURIComponent(page),'freeCorrection');
   add('Request removal from public view','/corrections/?action=PUBLIC_REMOVAL&profile='+encodeURIComponent(id)+'&url='+encodeURIComponent(page),'freeRemoval');
  }
 }catch{}

 try{
  const response=await fetch(API+'/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});
  if(!response.ok){document.body.dataset.franklinMemberEntitlement='unknown';event();return;}
  const out=await response.json();
  const active=out.activePaidMember===true;
  if(active)removeSimilar();else document.body.dataset.franklinMemberEntitlement='inactive';
  const p=out.publication;
  if(!p||p.profileId!==id||p.provenance!=='MEMBER_SUBMITTED_REVIEWED'){event();return;}
  const f=p.fields||{};
  const s=n('section','', 'section hf33-member-publication');s.dataset.memberPublication='';const w=n('div','', 'wrap');s.append(w);
  const title=n('div','', 'hf33-member-heading');title.append(n('div','Community Member','eyebrow'),n('h2','More about this business'));w.append(title);
  if(f.tagline){const t=n('p',f.tagline,'hf33-member-tagline');t.dataset.memberTagline='';w.append(t)}
  if(f.profileImageUrl){const u=safeHttps(f.profileImageUrl);if(u){const img=document.createElement('img');img.src=u.href;img.alt='';img.referrerPolicy='no-referrer';img.dataset.memberProfileImage='';img.hidden=true;w.append(img)}}
  const actions=n('div','', 'actions hf33-member-actions');actions.dataset.memberActions='';
  const actionFields=[['website','Website'],['contactUrl','Contact'],['bookingUrl','Book'],['quoteUrl','Get a quote'],['menuUrl','Menu'],['orderUrl','Order'],['directionsUrl','Directions']];
  for(const [key,label] of actionFields){const u=safeHttps(f[key]);if(!u)continue;const a=n('a',label,'button');a.href=u.href;a.rel='noopener noreferrer ugc';actions.append(a)}
  if(actions.children.length)w.append(actions);
  const mod=(heading,value)=>{if(!String(value||'').trim())return;const sec=n('section','', 'hf33-member-module');sec.append(n('h3',heading),n('p',String(value).trim()));w.append(sec)};
  mod('About',f.summary);mod('Services & specialties',f.services);
  const details=[['Hours',f.hours],['Service area',f.serviceArea],['Pricing & payment',f.pricing],['Languages',f.languages],['Accessibility',f.accessibility]].filter(x=>String(x[1]||'').trim());
  if(details.length){const sec=n('section','', 'hf33-member-module');sec.append(n('h3','Details'));const grid=n('div','', 'hf33-member-detail-grid');for(const [label,value] of details){const card=n('div','', 'hf33-member-detail');card.append(n('strong',label),n('p',value));grid.append(card)}sec.append(grid);w.append(sec)}
  for(const [label,key] of [['Experience', 'experience'],['Credentials & certifications','credentials'],['Awards & honors','awards'],['Associations','associations'],['Education & training','education'],['Publications, media & speaking','publications'],['Offers & events','offersEvents']])mod(label,f[key]);
  const gallery=lines(f.galleryUrls).map(safeHttps).filter(Boolean).slice(0,8);if(gallery.length){const sec=n('section','', 'hf33-member-module');sec.append(n('h3','Gallery'));const g=n('div','', 'hf33-member-gallery');gallery.forEach((u,i)=>{const img=document.createElement('img');img.src=u.href;img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';g.append(img)});sec.append(g);w.append(sec)}
  const social=lines(f.socialLinks).map(safeHttps).filter(Boolean).slice(0,12);if(social.length){const sec=n('section','', 'hf33-member-module');sec.append(n('h3','Online presence'));const g=n('div','', 'hf33-online-links');social.forEach(u=>{const a=n('a',u.hostname.replace(/^www\./,''),'button');a.href=u.href;a.rel='noopener noreferrer ugc';g.append(a)});sec.append(g);w.append(sec)}
  const layoutSection=document.querySelector('.r22-profile-layout')?.closest('.section');if(layoutSection?.nextSibling)main.insertBefore(s,layoutSection.nextSibling);else main.append(s);
  event();
 }catch{document.body.dataset.franklinMemberEntitlement='unknown';event()}
})();
