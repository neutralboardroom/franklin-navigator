'use strict';
(async()=>{
 const match=location.pathname.match(/^\/profiles\/([^/]+)\/$/);if(!match)return;
 const id=decodeURIComponent(match[1]);if(!/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(id))return;
 const n=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
 const main=document.querySelector('main');
 try{
  const ledger=await fetch('/data/public-profile-suppressions.json',{cache:'no-store'});if(!ledger.ok)throw new Error('SUPPRESSION_LEDGER_UNAVAILABLE');const data=await ledger.json();const suppressed=(data.entries||[]).some(e=>e&&e.profileId===id&&e.status==='SUPPRESSED');
  if(suppressed){let robots=document.querySelector('meta[name="robots"]');if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.append(robots)}robots.content='noindex,nofollow';document.title='Profile unavailable | Franklin Navigator';if(main){main.replaceChildren();const s=n('section','');s.className='section';const w=n('div','');w.className='wrap narrow';w.append(n('h1','This profile is not publicly displayed.'),n('p','This profile has been removed from Franklin Navigator public view. A paid membership is not required to request removal or a factual correction.'));const a=n('a','Contact Franklin Navigator about this profile');a.href='/corrections/?profile='+encodeURIComponent(id);a.className='button';w.append(a);s.append(w);main.append(s)}return}
 }catch{if(main){main.replaceChildren();const s=n('section','');s.className='section';const w=n('div','');w.className='wrap narrow';w.append(n('h1','This profile is temporarily unavailable.'),n('p','Franklin Navigator could not verify the public-display status of this profile. Please try again shortly.'));s.append(w);main.append(s)}return}

 // Free factual correction and public-removal controls are always rendered as their own
 // visible public section. They are independent of claiming/membership and cannot be
 // collapsed into a paid/member overflow menu by later presentation cleanup.
 try{
  if(main&&!document.querySelector('[data-free-profile-control]')){
   const page=location.href;
   const s=n('section','');s.className='section hf32-free-control';s.dataset.freeProfileControl='';
   const w=n('div','');w.className='wrap narrow';
   const h=n('h2','Correct or remove this profile');
   const p=n('p','Basic factual corrections and requests to remove this profile from public view are free. No membership or payment is required.');
   const actions=n('div','');actions.className='actions';actions.setAttribute('data-free-profile-actions','');
   const correction=n('a','Correct profile information');correction.className='button';correction.dataset.freeCorrection='';correction.href='/corrections/?profile='+encodeURIComponent(id)+'&url='+encodeURIComponent(page);
   const removal=n('a','Request removal from public view');removal.className='button';removal.dataset.freeRemoval='';removal.href='/corrections/?action=PUBLIC_REMOVAL&profile='+encodeURIComponent(id)+'&url='+encodeURIComponent(page);
   actions.append(correction,removal);w.append(h,p,actions);s.append(w);
   const layout=document.querySelector('.r22-profile-layout')?.closest('.section');
   if(layout?.nextSibling)main.insertBefore(s,layout.nextSibling);else main.append(s);
  }
 }catch{/* Public profile remains readable; correction/removal remains reachable from the site-wide free profile-control route. */}

 try{
  const response=await fetch('https://franklin-navigator-membership.onrender.com/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});if(!response.ok)return;
  const {publication:p}=await response.json();if(!p||p.profileId!==id||p.provenance!=='MEMBER_SUBMITTED_REVIEWED')return;
  const s=n('section','');s.className='section';s.setAttribute('data-member-publication','');const w=n('div','');w.className='wrap';s.append(w);
  w.append(n('h2','From this community member'),n('p','Member-provided content reviewed for publication. This is not an endorsement, credential, ranking, or replacement for public-source facts.'),n('p',p.fields.summary));
  for(const [key,label] of [['services','Services and practical information'],['languages','Languages you can support']])if(p.fields[key])w.append(n('h3',label),n('p',p.fields[key]));
  for(const [key,label] of [['website','Website supplied by member'],['contactUrl','Contact page supplied by member'],['bookingUrl','Appointment or service page supplied by member']])if(p.fields[key]){const u=new URL(p.fields[key]);if(u.protocol!=='https:'||u.username||u.password)continue;const a=n('a',label);a.href=u.href;a.rel='noopener noreferrer ugc';a.className='button';w.append(a)}
  if(main)main.append(s);
 }catch{/* Public-source profile remains usable when member enrichment is unavailable. */}
})();
