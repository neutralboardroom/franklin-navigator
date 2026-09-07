'use strict';
(async()=>{
 const match=location.pathname.match(/^\/profiles\/([^/]+)\/$/);if(!match)return;
 const id=decodeURIComponent(match[1]);if(!/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(id))return;
 const n=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
 try{
  const response=await fetch('https://franklin-navigator-membership.onrender.com/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});if(!response.ok)return;
  const {publication:p}=await response.json();if(!p||p.profileId!==id||p.provenance!=='MEMBER_SUBMITTED_REVIEWED')return;
  const s=n('section','');s.className='section';s.setAttribute('data-member-publication','');const w=n('div','');w.className='wrap';s.append(w);
  w.append(n('h2','From this community member'),n('p','Member-provided content reviewed for publication. This is not an endorsement, credential, ranking, or replacement for public-source facts.'),n('p',p.fields.summary));
  for(const [key,label] of [['services','Services and practical information'],['languages','Languages you can support']])if(p.fields[key])w.append(n('h3',label),n('p',p.fields[key]));
  for(const [key,label] of [['website','Website supplied by member'],['contactUrl','Contact page supplied by member'],['bookingUrl','Appointment or service page supplied by member']])if(p.fields[key]){const u=new URL(p.fields[key]);if(u.protocol!=='https:'||u.username||u.password)continue;const a=n('a',label);a.href=u.href;a.rel='noopener noreferrer ugc';a.className='button';w.append(a);}
  const main=document.querySelector('main');if(main)main.append(s);
 }catch{/* Public-source profile remains usable when the enrichment service is unavailable. */}
})();
