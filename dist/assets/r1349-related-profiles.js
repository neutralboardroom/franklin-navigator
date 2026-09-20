/* R1349 — related local profiles relevance guard. Broad umbrella categories alone never create similarity. */
(()=>{'use strict';
const BROAD=new Set([
  'downtown business or organization','local business','business or organization','local organization or place',
  'current regional chamber member','professional services','health and medical','shopping','corporate office',
  'unknown or unclassified nonprofit','education','human services'
]);
const normalize=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
const isBroadCategory=v=>BROAD.has(normalize(v));
const qualifiedOverride={
  'FR-ORG-305366afb36e-daddy-s-dogs':{
    evidence:'OWNER_QUALIFIED_RESTAURANT_FOOD_PROFILE_2026-09-20',
    vertical:'food_hospitality',
    profiles:[
      {id:'FR-ORG-579c8d1fbb71178a',name:'Back Yard Burgers'},
      {id:'FR-ORG-96c6b663222cbac0',name:'Burger Up Franklin'},
      {id:'FR-ORG-cf255b903032-dog-haus',name:'Dog Haus'}
    ]
  }
};
const profileCategory=()=>document.querySelector('.r22-profile-hero .eyebrow')?.textContent?.trim()||document.querySelector('.profile-facts-grid strong')?.textContent?.trim()||'';
const profileId=()=>document.body?.dataset?.profileId||decodeURIComponent((location.pathname.match(/^\/profiles\/([^/]+)\/?$/)||[])[1]||'');
const relatedCard=()=>[...document.querySelectorAll('.hf35-competitor-card,.r22-profile-side .r22-card')].find(x=>/Related local profiles|Similar local profiles/i.test(x.querySelector('h2,h3')?.textContent||''));
function renderOverride(card,override){
  const h=card.querySelector('h2,h3');
  card.replaceChildren();
  card.append(h||Object.assign(document.createElement('h2'),{textContent:'Related local profiles'}));
  for(const p of [...override.profiles].sort((a,b)=>a.name.localeCompare(b.name))){
    const row=document.createElement('p');
    const a=document.createElement('a');a.href=`/profiles/${encodeURIComponent(p.id)}/`;a.textContent=p.name;
    const br=document.createElement('br');
    const note=document.createElement('span');note.className='fine-print';note.textContent='Franklin area · related food/restaurant service';
    row.append(a,br,note);card.append(row);
  }
  const note=document.createElement('p');note.className='fine-print';note.textContent='Similar by service/category; locality is secondary. Not ranked or endorsed.';card.append(note);
  card.dataset.relatedRelevance='qualified-override';card.dataset.relatedVertical=override.vertical;
}
function apply(){
  if(!location.pathname.startsWith('/profiles/'))return;
  const card=relatedCard();if(!card)return;
  const id=profileId(),category=profileCategory(),override=qualifiedOverride[id];
  if(override){renderOverride(card,override);return;}
  if(isBroadCategory(category)){
    card.remove();
    document.body.dataset.relatedProfiles='omitted-insufficient-relevance';
    return;
  }
  card.dataset.relatedRelevance='specific-category';
  const note=[...card.querySelectorAll('.fine-print')].find(x=>/Related by category only|not ranked|recommended/i.test(x.textContent||''));
  if(note)note.textContent='Related by service/category; locality is secondary. Not ranked or endorsed.';
}
const api={isBroadCategory,qualifiedOverride};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();}
})();