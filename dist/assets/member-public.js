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
 try{
  const heading=[...document.querySelectorAll('main h2')].find(h=>/correction|claim/i.test(h.textContent||''));const section=heading?.closest('section');if(section){const p=section.querySelector('p');if(p)p.textContent='Basic factual corrections are free. You can also request removal from public view at no cost. Neither requires Community Membership or payment.';const actions=section.querySelector('.actions')||section;const existing=actions.querySelector('[data-free-removal]');if(!existing){const a=n('a','Request removal from public view');a.className='button';a.dataset.freeRemoval='';const page=location.href;a.href='/corrections/?action=PUBLIC_REMOVAL&profile='+encodeURIComponent(id)+'&url='+encodeURIComponent(page);actions.append(a)}}
  const response=await fetch('https://franklin-navigator-membership.onrender.com/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});if(!response.ok)return;
  const {publication:p}=await response.json();if(!p||p.profileId!==id||p.provenance!=='MEMBER_SUBMITTED_REVIEWED')return;
  const s=n('section','');s.className='section';s.setAttribute('data-member-publication','');const w=n('div','');w.className='wrap';s.append(w);
  w.append(n('h2','From this community member'),n('p','Member-provided content reviewed for publication. This is not an endorsement, credential, ranking, or replacement for public-source facts.'),n('p',p.fields.summary));
  for(const [key,label] of [['services','Services and practical information'],['languages','Languages you can support']])if(p.fields[key])w.append(n('h3',label),n('p',p.fields[key]));
  for(const [key,label] of [['website','Website supplied by member'],['contactUrl','Contact page supplied by member'],['bookingUrl','Appointment or service page supplied by member']])if(p.fields[key]){const u=new URL(p.fields[key]);if(u.protocol!=='https:'||u.username||u.password)continue;const a=n('a',label);a.href=u.href;a.rel='noopener noreferrer ugc';a.className='button';w.append(a)}
  if(main)main.append(s);
 }catch{/* Public-source profile remains usable when member enrichment is unavailable. */}
})();
