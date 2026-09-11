/* FR-NAV1.27.0-HF3.8 — richer reviewed member profile editor. */
'use strict';
(()=>{
 const tr=s=>window.FranklinI18n?.translate(s)||s;
 const API='https://franklin-navigator-membership.onrender.com',root=document.querySelector('[data-member-profile-root]');if(!root)return;
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const link=(text,href)=>{const n=node('a',text,'button');n.href=href;return n;};
 const state={profile:null,profiles:[],draft:null,publication:null,busy:false,dirty:false,inputs:{}};
 const status=node('p','Loading your member profile…','r37-status r38-status-strip');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
 function message(s){status.textContent=s;}
 const messages={AUTH_REQUIRED:'Sign in to manage your profile.',ACTIVE_MEMBERSHIP_REQUIRED:'An active membership is required to save member content. Factual corrections remain free.',PROFILE_VERIFICATION_REQUIRED:'Request access to manage this profile before editing member content.',VERSION_CONFLICT:'This profile changed in another session. Your unsaved text is still here. Reload the saved version before trying again.',PUBLICATION_OWNER_CONFLICT:'Another authorized account manages the published member content. Contact support.',FIELD_NOT_EDITABLE:'Only supported member-profile fields can be changed.',PUBLIC_URL_INVALID:'Use a public HTTPS website address without a password or sign-in token.',SUMMARY_TOO_SHORT:'Write a description of at least 20 characters.',FIELD_INVALID:'Check the field lengths and remove HTML or unsupported characters.',REVIEWER_NOT_CONFIGURED:'Review is not available yet. Your saved request has not been approved.',PUBLICATION_PERMISSION_REQUIRED:'Confirm that you are authorized to publish this public-facing content.',RATE_LIMITED:'Too many requests. Please try again later.'};
 async function request(path,body){let response;try{response=await fetch(API+path,{method:body?'POST':'GET',credentials:'include',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});}catch{throw Error('SERVICE_UNAVAILABLE');}let out;try{out=await response.json();}catch{throw Error('SERVICE_UNAVAILABLE');}if(!response.ok){const e=new Error(messages[out.error?.code]||'We could not complete this request. Your unsaved text is still here. Check saved status before retrying.');e.code=out.error?.code;throw e;}return out;}
 async function work(fn){if(state.busy)return;state.busy=true;root.setAttribute('aria-busy','true');try{await fn();}catch(e){message(e.message==='SERVICE_UNAVAILABLE'?'The service is unavailable. Your unsaved text is still here. Check saved status before retrying.':e.message);}finally{state.busy=false;root.removeAttribute('aria-busy');}}
 function button(label,fn,primary=false){const b=node('button',label,primary?'button primary':'button');b.type='button';b.addEventListener('click',()=>work(fn));return b;}
 function field(label,name,type='text',max=1200,help=''){const wrap=node('label'),title=node('span',label),input=node(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.name=name;input.maxLength=max;input.id='member-'+name;wrap.htmlFor=input.id;wrap.append(title,input);if(help){const h=node('span',help,'r38-field-help');wrap.append(h)}return {wrap,input};}
 function group(title,open=false){const d=node('details',undefined,'r38-field-group');if(open)d.open=true;const s=node('summary',title),b=node('div',undefined,'r38-field-group-body');d.append(s,b);return {details:d,body:b};}
 const controls=node('div',undefined,'r37-member-step tool'),view=node('div',undefined,'r37-member-step tool');root.append(controls,view);
 async function refresh(){const result=await request('/api/member/profiles');state.profiles=result.profiles;controls.replaceChildren();const l=node('label','Choose your linked profile'),select=node('select');select.id='member-profile-selection';l.htmlFor=select.id;for(const p of state.profiles){const o=node('option',p.name);o.value=p.profile_id;select.append(o);}controls.append(l,select);if(!state.profiles.length){message('Find your profile on the membership page, then request access to manage it.');controls.append(link('Find my profile','/membership-status/'));view.replaceChildren();return;}
  const asked=new URLSearchParams(location.search).get('profile');state.profile=state.profiles.find(p=>p.profile_id===state.profile?.profile_id)||state.profiles.find(p=>p.profile_id===asked)||state.profiles[0];select.value=state.profile.profile_id;
  select.addEventListener('change',()=>{if(state.dirty&&!confirm(tr('Discard unsaved edits and change profiles?'))){select.value=state.profile.profile_id;return;}state.profile=state.profiles.find(p=>p.profile_id===select.value);state.dirty=false;work(load);});
  if(!result.reviewCoverageConfigured)controls.append(node('p','Review coverage has not been confirmed. Requests may be saved, but approval and publication are not promised.','fine-print'));
  await load();
 }
 async function load(){const p=state.profile;const result=await request('/api/member/profile?profileId='+encodeURIComponent(p.profile_id));state.draft=result.draft;state.publication=result.publication;view.replaceChildren();view.append(node('h2',p.name));
  if(p.authority_state!=='VERIFIED'){representation(p);return;}
  editor(p);message('Your saved profile status is up to date.');
 }
 function representation(p){view.append(node('h3','Request profile access'),node('p','Explain your role and provide a public source showing your connection. Do not send passwords, identity documents, private customer records, or payment details.'));
  if(p.public_reason)view.append(node('p',p.public_reason));
  const f=node('form'),url=field('Public evidence website','evidenceUrl','url',1200,'Use an official public page that shows your connection.'),why=field('Your public-facing role and connection','statement','textarea',1200);url.input.required=true;why.input.required=true;why.input.minLength=30;const submit=node('button','Save review request','button primary');submit.type='submit';f.append(url.wrap,why.wrap,submit);f.addEventListener('submit',e=>{e.preventDefault();work(async()=>{const result=await request('/api/member/representation/request',{profileId:p.profile_id,expectedRevision:p.review_revision||0,evidenceUrl:url.input.value,statement:why.input.value});p.review_revision=result.revision;message('Your request is saved and waiting for review. No payment has been started.');});});view.append(f,button('Refresh review status',refresh),link('Get support','/member-support/'));message(p.review_state==='PENDING'?'Your request is saved and waiting for review. No payment has been started.':'Request access to manage this profile before editing member content.');
 }
 function readiness(inputs){
   const val=n=>String(inputs[n]?.value||'').trim();
   return [
    ['Public description',val('summary').length>=20],
    ['Services',Boolean(val('services'))],
    ['Contact or action link',Boolean(val('website')||val('contactUrl')||val('bookingUrl')||val('quoteUrl')||val('menuUrl')||val('orderUrl'))],
    ['Hours or service area',Boolean(val('hours')||val('serviceArea'))],
    ['Language or accessibility',Boolean(val('languages')||val('accessibility'))],
    ['Photo, gallery or social link',Boolean(val('profileImageUrl')||val('galleryUrls')||val('socialLinks'))]
   ];
 }
 function readinessBox(inputs){
   const box=node('section',undefined,'r38-member-readiness'),h=node('h3','Profile readiness'),p=node('p'),progress=document.createElement('progress'),ul=node('ul');
   progress.max=6;progress.setAttribute('aria-label','Profile readiness');box.append(h,p,progress,ul,node('p','Only you see this completion checklist while editing. It is not a public rating.','fine-print'));
   const render=()=>{const c=readiness(inputs),n=c.filter(x=>x[1]).length;p.textContent=`${n} of ${c.length} useful sections ready`;progress.value=n;ul.replaceChildren(...c.map(([label,ok])=>node('li',(ok?'Ready: ':'Add: ')+label,ok?'r38-ready':'r38-not-ready')));};
   Object.values(inputs).forEach(i=>i.addEventListener('input',render));render();return box;
 }
 function editor(p){const draft=state.draft,labels={DRAFT:'Saved draft — not submitted',SUBMITTED:'Submitted — awaiting review',CHANGES_REQUESTED:'Changes requested',PUBLISHED:'Published member content',REMOVED:'Member content removed'};
  view.append(node('p',labels[draft?.state]||'No saved member draft yet.'),node('p','These fields are member-provided additions. Public-source identity, credentials, address and factual corrections stay separate.'));
  if(draft?.public_reason)view.append(node('p',draft.public_reason));
  const form=node('form'),inputs={};state.inputs=inputs;
  const specs=[
   ['summary','Public description','textarea',1600,'Describe what you do and how you serve the community.'],
   ['tagline','Short tagline','text',180,'Optional one-line public description.'],
   ['services','Services and practical information','textarea',2400,'List real services or participation areas.'],
   ['hours','Hours','textarea',600,'Use current public-facing hours or an instruction to confirm them.'],
   ['serviceArea','Service area or locations','textarea',600,'Use the real physical location or accurate service area.'],
   ['accessibility','Accessibility','textarea',800,'Public accessibility information you can support.'],
   ['languages','Languages','text',300,'Languages your organization can support.'],
   ['pricing','Pricing and payment information','textarea',800,'Optional public pricing or payment information; avoid guarantees.'],
   ['experience','Experience','textarea',1600,'Optional public-facing experience details.'],
   ['credentials','Credentials and certifications','textarea',1600,'Only credentials you are authorized to state and can support.'],
   ['awards','Awards and honors','textarea',1200,'Only real public awards or honors.'],
   ['associations','Associations','textarea',1200,'Only real public professional or community associations.'],
   ['education','Education and training','textarea',1200,'When relevant to the profile type.'],
   ['publications','Publications, media and speaking','textarea',1600,'Optional public-facing examples.'],
   ['offersEvents','Offers and events','textarea',1600,'Only current, supportable public offers or events.'],
   ['website','Official website','url',1200,'Public HTTPS URL.'],
   ['contactUrl','Contact page','url',1200,'Public HTTPS URL.'],
   ['bookingUrl','Booking or appointment page','url',1200,'Public HTTPS URL.'],
   ['quoteUrl','Quote or estimate page','url',1200,'Public HTTPS URL.'],
   ['menuUrl','Menu or services page','url',1200,'Public HTTPS URL.'],
   ['orderUrl','Order page','url',1200,'Public HTTPS URL.'],
   ['directionsUrl','Directions or location page','url',1200,'Public HTTPS URL.'],
   ['profileImageUrl','Profile image or logo URL','url',1200,'Public HTTPS image URL. No file is uploaded here.'],
   ['galleryUrls','Gallery image URLs','textarea',4000,'One public HTTPS image URL per line, up to 8.'],
   ['socialLinks','Official social links','textarea',4000,'One verified official public HTTPS URL per line, up to 12.']
  ];
  const built={};
  for(const spec of specs){const f=field(spec[1],spec[0],spec[2],spec[3],spec[4]);f.input.value=draft?.fields?.[spec[0]]||'';f.input.addEventListener('input',()=>{state.dirty=true;});inputs[spec[0]]=f.input;built[spec[0]]=f;}
  inputs.summary.required=true;inputs.summary.minLength=20;
  const essentials=group('Essentials',true);['summary','tagline','services'].forEach(k=>essentials.body.append(built[k].wrap));
  const actions=group('Contact and action links',true);['website','contactUrl','bookingUrl','quoteUrl','menuUrl','orderUrl','directionsUrl'].forEach(k=>actions.body.append(built[k].wrap));
  const practical=group('Hours, service area, language and accessibility');['hours','serviceArea','languages','accessibility','pricing'].forEach(k=>practical.body.append(built[k].wrap));
  const credibility=group('Experience and credentials');['experience','credentials','awards','associations','education','publications'].forEach(k=>credibility.body.append(built[k].wrap));
  const participation=group('Offers, events, photos and online presence');['offersEvents','profileImageUrl','galleryUrls','socialLinks'].forEach(k=>participation.body.append(built[k].wrap));
  form.append(readinessBox(inputs),essentials.details,actions.details,practical.details,credibility.details,participation.details);
  const save=node('button','Save private draft','button primary');save.type='submit';const saveActions=node('div',undefined,'r38-member-actions');saveActions.append(save);form.append(saveActions);
  form.addEventListener('submit',e=>{e.preventDefault();work(async()=>{const values=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value]));const saved=await request('/api/member/profile/save',{profileId:p.profile_id,expectedRevision:state.draft?.revision||0,fields:values});state.draft={...saved,fields:values};state.dirty=false;message('Your draft is saved on the server. It is not public.');});});
  view.append(form);const actionRow=node('div',undefined,'r38-member-actions');view.append(actionRow);actionRow.append(button('Submit saved draft for review',async()=>{if(state.dirty){message('Save your edits before submitting for review.');return;}if(!confirm(tr('Confirm that you are authorized to publish this public-facing content.')))return;const result=await request('/api/member/profile/submit',{profileId:p.profile_id,expectedRevision:state.draft?.revision||0,rightsConfirmed:true});state.draft={...state.draft,...result};message('Your saved draft is submitted. It will not replace public content until authorized review approves it.');}),button('Reload saved version',async()=>{if(state.dirty&&!confirm(tr('Discard unsaved edits and reload the saved version?')))return;state.dirty=false;await load();}),link('Free factual correction','/corrections/'),link('Billing and cancellation','/membership-status/'),link('Get support','/member-support/'));
  if(state.publication){const pub=state.publication;view.append(node('h3','Published member content'),node('p',pub.fields.summary),link('View the public profile','/profiles/'+encodeURIComponent(p.profile_id)+'/'),button('Confirm published profile value',async()=>{const current=await request('/api/member/public-profile?profileId='+encodeURIComponent(p.profile_id));if(!current.publication||current.publication.fields_sha256!==pub.fields_sha256||current.publication.revision!==pub.revision){message('The published version changed. Reload the saved version.');return;}await request('/api/member/profile/readback',{profileId:p.profile_id,revision:pub.revision,fieldsSha256:pub.fields_sha256});message('The published member content has been confirmed. Your first profile-value step is recorded.');}));}
 }
 window.addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue='';}});
 work(async()=>{try{await request('/api/accounts/me');await refresh();}catch(e){if(e.code==='AUTH_REQUIRED'){message('Sign in to manage your profile.');controls.append(link('Sign in or create an account','/membership-status/'));}else throw e;}});
})();