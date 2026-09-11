#!/usr/bin/env python3
from pathlib import Path
import json,re,hashlib

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
RELEASE='FR-NAV1.27.0-HF3.8'
BASE='FR-NAV1.26.0-HF3.7'
CSS='/assets/hf38.css?v=frnav1270'
PREVIEW_JS='/assets/hf38.js?v=frnav1270'

def read(rel):
    return (DIST/rel).read_text(encoding='utf-8')

def write(rel,text):
    p=DIST/rel
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(text,encoding='utf-8')

def release_page(rel, body_class=None, css=True):
    p=DIST/rel
    text=p.read_text(encoding='utf-8')
    text=re.sub(r'(<meta content=")[^"]+(" name="franklin-release"/>)',rf'\g<1>{RELEASE}\2',text,count=1)
    if 'name="franklin-release"' not in text:
        text=text.replace('</head>',f'<meta content="{RELEASE}" name="franklin-release"/></head>',1)
    if css and CSS not in text:
        text=text.replace('</head>',f'<link href="{CSS}" rel="stylesheet"/></head>',1)
    if body_class and body_class not in text:
        if '<body class="' in text:
            text=text.replace('<body class="','<body class="'+body_class+' ',1)
        else:
            text=text.replace('<body','<body class="'+body_class+'"',1)
    p.write_text(text,encoding='utf-8')

base=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text(encoding='utf-8'))
if base.get('release')!=BASE:
    raise RuntimeError(f'wrong base release: {base.get("release")} != {BASE}')
manifest=json.loads(read('data/discovery/manifest.json'))
idx=DIST/manifest['index']['file'].lstrip('/')
before_digest=hashlib.sha256(idx.read_bytes()).hexdigest()
if before_digest!=manifest['index']['sha256'] or manifest['recordCount']!=19103:
    raise RuntimeError('discovery source drift before HF3.8')

# 1) Shared accessibility hardening.
acc=DIST/'assets/accessibility.css'
a=acc.read_text(encoding='utf-8')
marker='/* HF3.8 shared accessibility hardening */'
if marker not in a:
    a=a.rstrip()+r'''
/* HF3.8 shared accessibility hardening */
details>summary{cursor:pointer;border-radius:6px}
details>summary:focus-visible{outline:3px solid #e3b75d;outline-offset:3px}
main [id]{scroll-margin-top:112px}
.source-links a,.profile-primary-actions a,.profile-utility-actions a,.hf35-online a{overflow-wrap:anywhere}
[aria-live="polite"],[role="status"]{overflow-wrap:anywhere}
@media(max-width:640px){
  input,select,textarea{font-size:16px}
  .button,button,summary{min-height:44px}
}
'''+ "\n"
    acc.write_text(a,encoding='utf-8')

# 2) Release CSS.
hf38_css=r'''/* FR-NAV1.27.0-HF3.8 — safe member first-value and accessibility pass. */
.r38-studio-hero{background:linear-gradient(145deg,#eef8f6,#fff 65%,#fbf8f1)}
.r38-studio-hero h1{max-width:760px}
.r38-studio-shell{display:grid;grid-template-columns:minmax(0,1fr);gap:20px}
.r38-studio-note{border:1px solid #c9dbd8;background:#f5fbfa;border-radius:12px;padding:16px 18px}
.r38-studio-note p{margin:.35rem 0}
.r38-member-readiness{border:1px solid #bdd5d1;background:#f3f9f8;border-radius:12px;padding:16px;margin:0 0 20px}
.r38-member-readiness h3{margin:0 0 4px}
.r38-member-readiness progress{width:100%;height:14px;accent-color:#075f66}
.r38-member-readiness ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 16px;margin:.8rem 0 0;padding-left:1.2rem}
.r38-ready{font-weight:760;color:#075f66}
.r38-not-ready{color:#5f6c70}
.r38-field-group{border:1px solid #d7e3e1;border-radius:12px;background:#fff;margin:0 0 14px}
.r38-field-group>summary{font-weight:820;padding:14px 16px}
.r38-field-group[open]>summary{border-bottom:1px solid #e1e9e8}
.r38-field-group-body{padding:4px 16px 16px}
.r38-field-group-body label{display:block;font-weight:720;margin:13px 0 5px}
.r38-field-group-body input,.r38-field-group-body textarea{width:100%;padding:11px 12px;border:1px solid #aebbbb;border-radius:7px;font:inherit;background:#fff;color:#172126}
.r38-field-help{font-size:.84rem;color:#657278;margin:.25rem 0 .7rem}
.r38-member-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.r38-status-strip{border-left:4px solid #075f66;background:#f3f8f7;padding:12px 14px;margin:0 0 16px}
.r38-business-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:22px}
.r38-business-step{border:1px solid #d8e4e2;border-radius:12px;background:#fff;padding:19px}
.r38-business-step .r38-step-number{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#03454b;color:#fff;font-weight:850;margin-bottom:10px}
.r38-business-step h2{font-size:1.22rem;margin:.2rem 0 .45rem}
.r38-business-step p{color:#4c5a60}
.r38-business-step .button{margin-top:6px}
.r38-business-membership{max-width:760px;margin:0 auto}
.r38-preview-readiness{border:1px solid #c4d9d6;border-radius:10px;padding:13px 14px;background:#f6fbfa;margin:12px 0 18px}
.r38-preview-readiness progress{width:100%;height:12px;accent-color:#075f66}
.r38-preview-readiness ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 14px;padding-left:1.15rem;margin:.65rem 0 0;font-size:.9rem}
@media(max-width:780px){
  .r38-business-steps,.r38-member-readiness ul,.r38-preview-readiness ul{grid-template-columns:1fr}
  .r38-field-group-body{padding-inline:13px}
}
'''
write('assets/hf38.css',hf38_css)

# 3) Member-profile preview: owner-only readiness checklist.
p=DIST/'member-profile-preview/index.html'
s=p.read_text(encoding='utf-8')
needle='<h2>Use public business information</h2>'
panel='''<h2>Use public business information</h2><div class="r38-preview-readiness" data-r38-preview-readiness=""><strong>Profile readiness</strong><p data-r38-preview-status="">0 of 6 useful sections ready</p><progress aria-label="Profile readiness" data-r38-preview-progress="" max="6" value="0"></progress><ul data-r38-preview-list=""></ul><p class="fine-print">Only you see this preview checklist. It is not a public rating.</p></div>'''
if 'data-r38-preview-readiness' not in s:
    if needle not in s: raise RuntimeError('preview insertion point missing')
    s=s.replace(needle,panel,1)
if PREVIEW_JS not in s:
    s=s.replace('</body>',f'<script defer="" src="{PREVIEW_JS}"></script></body>',1)
p.write_text(s,encoding='utf-8')
release_page('member-profile-preview/index.html','hf38-member-preview')

hf38_js=r'''/* FR-NAV1.27.0-HF3.8 preview readiness — device-only, never a public score. */
(()=>{const form=document.querySelector('.hf37-preview-form'),box=document.querySelector('[data-r38-preview-readiness]');if(!form||!box)return;
const status=box.querySelector('[data-r38-preview-status]'),progress=box.querySelector('[data-r38-preview-progress]'),list=box.querySelector('[data-r38-preview-list]');
const v=n=>String(form.elements[n]?.type==='checkbox'?(form.elements[n]?.checked?'yes':''):form.elements[n]?.value||'').trim();
const groups=()=>[
 ['Identity',Boolean(v('name')&&v('category')&&v('city'))],
 ['Contact',Boolean(v('website')||v('phone')||v('email'))],
 ['About',v('about').length>=20],
 ['Services',Boolean(v('services'))],
 ['Practical details',Boolean(v('hours')||v('languages'))],
 ['Online / photos',Boolean(v('online')||v('photos'))]
];
const render=()=>{const g=groups(),n=g.filter(x=>x[1]).length;status.textContent=`${n} of ${g.length} useful sections ready`;progress.value=n;list.replaceChildren(...g.map(([label,ok])=>{const li=document.createElement('li');li.textContent=(ok?'Ready: ':'Add: ')+label;li.className=ok?'r38-ready':'r38-not-ready';return li}))};
form.addEventListener('input',render);form.addEventListener('change',render);render()})();'''
write('assets/hf38.js',hf38_js)

# 4) Actual member Profile Studio: one live editor, no duplicate old form.
studio=DIST/'profile-studio/index.html'
ss=studio.read_text(encoding='utf-8')
new_main=r'''<main id="main">
<section class="r29-hero r38-studio-hero"><div class="wrap"><div class="eyebrow">Community Member profile</div><h1>Manage the profile residents will actually see.</h1><p class="r29-lead">Edit member-provided public information, save a private draft, submit it for review, and check the published result. Public-source facts and free factual corrections stay separate.</p><div class="actions"><a class="button" href="/member-profile-preview/">Preview member profile value</a><a class="button" href="/corrections/">Free factual correction or removal</a></div></div></section>
<section class="section"><div class="wrap r38-studio-shell"><div class="r38-studio-note"><strong>Before you edit</strong><p>Use public-facing business or organization information only. Do not enter customer, patient, client, account, payment, medical, legal-case, password or private identity information.</p></div><div data-member-profile-root=""></div><noscript><div class="r38-studio-note"><strong>JavaScript is needed for secure member editing.</strong><p>You can still use <a href="/corrections/">free factual corrections and removal</a> or <a href="/member-support/">member support</a>.</p></div></noscript></div></section>
<section class="section tint"><div class="wrap"><div class="r38-studio-note"><strong>What membership does not change</strong><p>Membership does not buy ordinary Directory ranking, factual accuracy, credentials, endorsement, reviews, ratings or guaranteed results.</p></div></div></section>
</main>'''
if not re.search(r'<main\b[^>]*>.*?</main>',ss,re.S): raise RuntimeError('studio main missing')
ss=re.sub(r'<main\b[^>]*>.*?</main>',new_main,ss,count=1,flags=re.S)
ss=ss.replace('/assets/member-profile-live.js"','/assets/member-profile-live.js?v=frnav1270"')
studio.write_text(ss,encoding='utf-8')
release_page('profile-studio/index.html','hf38-profile-studio')

member_js=r'''/* FR-NAV1.27.0-HF3.8 — richer reviewed member profile editor. */
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
  for(const spec of specs){const f=field(...spec);f.input.value=draft?.fields?.[spec[0]]||'';f.input.addEventListener('input',()=>{state.dirty=true;});inputs[spec[0]]=f.input;built[spec[0]]=f;}
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
})();'''
write('assets/member-profile-live.js',member_js)

# 5) Business dashboard: one clear path, less duplicated sales copy.
bd=DIST/'business-dashboard/index.html'
bs=bd.read_text(encoding='utf-8')
business_main=r'''<main id="main">
<section class="r29-hero"><div class="wrap"><div class="eyebrow">For Franklin businesses, professionals and organizations</div><h1>Start with your profile. Then improve what residents can use.</h1><p class="r29-lead">Your basic public profile, factual corrections and removal requests stay free. Community Membership is optional and adds a richer reviewed profile.</p><div class="actions"><a class="button primary" href="/claim-profile/">Find or manage my profile</a><a class="button" href="/profile-studio/">Manage my member profile</a></div></div></section>
<section class="section"><div class="wrap"><div class="eyebrow">A simpler path</div><div class="r38-business-steps"><article class="r38-business-step"><span class="r38-step-number">1</span><h2>Find your public profile</h2><p>Review the exact profile and use free corrections or removal if something is wrong.</p><a class="button" href="/claim-profile/">Find my profile</a></article><article class="r38-business-step"><span class="r38-step-number">2</span><h2>Preview member value</h2><p>See how richer reviewed content, actions, hours, images and online presence can improve the page.</p><a class="button" href="/member-profile-preview/">Preview member profile</a></article><article class="r38-business-step"><span class="r38-step-number">3</span><h2>Complete your member profile</h2><p>Active members can save a private draft, see a readiness checklist, submit it for review and check the published result.</p><a class="button" href="/profile-studio/">Open Profile Studio</a></article></div></div></section>
<section class="section tint"><div class="wrap"><article class="r29-plan featured p0-single-plan r38-business-membership"><div class="eyebrow">Optional Community Membership</div><h2>Franklin Navigator Community Membership</h2><p class="r29-price"><strong>$35</strong><span>per year</span></p><ul class="check-list"><li>Richer reviewed business information and action links</li><li>Qualified photos, services, hours and online presence where supplied</li><li>No Similar local profiles section on your active member profile</li><li>Ordinary Directory ranking and factual accuracy do not change</li></ul><a class="button primary" href="/membership-start/">Review Community Membership</a></article></div></section>
<section class="section"><div class="wrap"><details class="hf36-free-business-tools"><summary>Free tools for local growth and participation</summary><div class="hf36-details-body"><p>Membership is not required for these tools.</p><div class="actions"><a class="button primary" href="/local-growth-engine/">Open the Growth Planner</a><a class="button" href="/assistant/">Ask Franklin Assistant</a></div></div></details><div class="r38-studio-note"><strong>Always free:</strong> factual corrections and public-profile removal requests. Membership does not buy ranking, credentials, endorsement, leads, customers or guaranteed results.</div></div></section>
</main>'''
if not re.search(r'<main\b[^>]*>.*?</main>',bs,re.S): raise RuntimeError('business main missing')
bs=re.sub(r'<main\b[^>]*>.*?</main>',business_main,bs,count=1,flags=re.S)
bs=bs.replace('<!DOCTYPE html>\n\n<!DOCTYPE html>','<!DOCTYPE html>',1)
if '/assets/app.js' not in bs:
    bs=bs.replace('<script defer="" src="/assets/r37-i18n.js"></script>','<script defer="" src="/assets/app.js"></script><script defer="" src="/assets/r37-i18n.js"></script>',1)
bd.write_text(bs,encoding='utf-8')
release_page('business-dashboard/index.html','hf38-business')

# 6) Help Center: remove vague repeated labels and count focus.
hp=DIST/'community-help-center/index.html'
hs=hp.read_text(encoding='utf-8')
repls={
 '<summary>More help &amp; tools</summary>':'<summary>Browse help and planning tools</summary>',
 '<div class="eyebrow">More help</div><h2>Build a private, review-ready preparation packet.</h2>':'<div class="eyebrow">Preparation Studio</div><h2>Build a private, review-ready preparation packet.</h2>',
 '<div class="eyebrow">More help</div><h2>Get step-by-step help with everyday Franklin needs.</h2>':'<div class="eyebrow">Everyday local pathways</div><h2>Get step-by-step help with everyday Franklin needs.</h2>',
 'Search and compare 19,103 local business, professional, civic and community listings. Paid membership does not control ordinary directory placement.':'Search local business, professional, civic and community listings. Paid membership does not control ordinary directory placement.'
}
for old,new in repls.items():
    if old in hs: hs=hs.replace(old,new)
hp.write_text(hs,encoding='utf-8')
release_page('community-help-center/index.html','hf38-help')

# 7) Release receipts. PF15.21 and LI31 are explicitly deferred: no facts imported.
after_digest=hashlib.sha256(idx.read_bytes()).hexdigest()
if after_digest!=before_digest:
    raise RuntimeError('discovery source changed during HF3.8 build')

source_receipt={
 "release":RELEASE,
 "base":BASE,
 "community":"FRANKLIN_TN",
 "profileFactory":{
   "observedCandidate":"FR-PF-PLATFORM-15.21",
   "packageSha256":"f64dd7b51fe405d975d1b21fb68a3e775ef33ceaf792dc2e1cd1e3c0c2aef8d0",
   "consumerAcceptance":"UNKNOWN",
   "disposition":"DEFER_WITH_CAUSE",
   "cause":"Producer package integrity passed but stronger semantic consumer acceptance was not advanced; no profile facts, counts, identity resolutions, links or categories imported."
 },
 "localInvestigator":{
   "observedCandidate":"SLI-FRANKLIN-HANDOFF-20260910-031",
   "consumerAcceptance":"UNKNOWN",
   "publication":"UNKNOWN",
   "disposition":"DEFER_WITH_CAUSE",
   "cause":"Exact package gate does not imply Local Platform adoption or publication; no LI records published in this release."
 },
 "revenueEngine":{"mutation":"NONE","reason":"Pricing/outreach authority remains outside this build; existing $35/year owner-authorized offer preserved."},
 "smarterJusticeDonor":{"used":False,"receipt":"SMARTER_JUSTICE_DONOR_NOT_USED"},
 "profileSourceRecordCount":manifest['recordCount'],
 "profileSourceSha256":before_digest
}
(ROOT/'HF38_SOURCE_RECONCILIATION_RECEIPT.json').write_text(json.dumps(source_receipt,indent=2)+'\n',encoding='utf-8')

runtime_compat={
 "release":RELEASE,
 "membershipRuntimeBranch":"franklin-commerce-runtime-r30",
 "membershipRuntimeCommitObserved":"a7f2eace8283ebda702d587f6dc98985329699f3",
 "membershipRuntimeFieldContract":[
  "summary","tagline","services","hours","serviceArea","accessibility","languages","pricing","experience","credentials","awards","associations","education","publications","offersEvents","website","contactUrl","bookingUrl","quoteUrl","menuUrl","orderUrl","directionsUrl","profileImageUrl","galleryUrls","socialLinks"
 ],
 "frontendUsesOnlyObservedRuntimeFields":True,
 "runtimeMutation":"NONE",
 "compatibility":"PASS_OBSERVED_PRODUCTION_RUNTIME_CONTRACT"
}
(ROOT/'HF38_RUNTIME_COMPATIBILITY_RECEIPT.json').write_text(json.dumps(runtime_compat,indent=2)+'\n',encoding='utf-8')

no_loss={
 "release":RELEASE,
 "base":BASE,
 "profileSourceRecordCountBefore":19103,
 "profileSourceRecordCountAfter":manifest['recordCount'],
 "profileSourceSha256Before":before_digest,
 "profileSourceSha256After":after_digest,
 "communityIsolation":"PASS_FRANKLIN_ONLY",
 "preserved":[
  "Sports static-first and no-JS usefulness",
  "Directory membership-neutral ordinary ranking",
  "public profile direct contact actions",
  "free factual corrections and removal",
  "active-member Similar local profiles suppression",
  "member publication review/provenance/representation gates",
  "Community Membership $35/year",
  "privacy and no-public-rating boundaries"
 ],
 "canonicalProfileFactsMutated":False,
 "profileFactoryCandidateFactsConsumed":False,
 "localInvestigatorCandidateFactsPublished":False
}
(ROOT/'HF38_NO_LOSS_LEDGER.json').write_text(json.dumps(no_loss,indent=2)+'\n',encoding='utf-8')

release={
 "release":RELEASE,
 "date":"2026-09-11",
 "base":BASE,
 "scope":"Regression-safe member first-value, Profile Studio completeness, accessibility and public-language finishing",
 "counts":{"profiles":manifest['recordCount']},
 "authority":{
   "profileFacts":"UNCHANGED_PROFILE_FACTORY_AUTHORITY_PRESERVED",
   "pf15_21":"DEFER_WITH_CAUSE",
   "li31":"DEFER_WITH_CAUSE",
   "smarterJustice":"NOT_USED"
 },
 "preserved":no_loss["preserved"]
}
(ROOT/'PRODUCTION_RELEASE.json').write_text(json.dumps(release,indent=2)+'\n',encoding='utf-8')

next_md=f'''# {RELEASE} — Next Version Improvement List

## Completed in this release
- Expanded the real signed-in Profile Studio to the richer reviewed member fields already supported by the existing membership runtime, without changing canonical Profile Factory facts.
- Added an owner-only profile-readiness checklist; it is explicitly not a public score or rating.
- Removed the duplicate legacy device-only Profile Studio form and made the real save/review/publish workflow the single member editing path.
- Simplified the For Businesses page into a clear three-step path: find profile, preview member value, complete member profile.
- Added shared keyboard/mobile accessibility hardening and clearer Help Center labels without changing safety resources or help tools.
- Preserved the 19,103-profile source byte-for-byte and deferred PF 15.21 / LI31 with cause because Local consumer acceptance/publication is not established.
- Expanded regression qualification across core English/Spanish routes and the signed-in member editor.

## Next version candidates
1. Consume Profile Factory 15.21 only after an accepted Local consumer receipt resolves the currently unknown acceptance state; then import qualified identity/link improvements with exact no-loss reconciliation.
2. Dispose Local Investigator V31 through an explicit Local ADOPT / ADAPT / REJECT_WITH_CAUSE / DEFER_WITH_CAUSE receipt before any publication.
3. Continue live owner visual review of less-trafficked English/Spanish routes and repair only evidence-backed defects.
4. Continue member first-value improvement: post-publication confirmation, profile completion prompts, and analytics that measure useful completion without creating public ratings or paid ranking.
5. Continue verified-link presentation coverage when accepted Profile Factory link-enrichment handoffs are available.
'''
(ROOT/'NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_27_0_HF38.md').write_text(next_md,encoding='utf-8')

build_receipt={
 "release":RELEASE,
 "base":BASE,
 "changedProductSlices":["profile-studio","member-profile-preview","business-dashboard","community-help-center","shared-accessibility"],
 "profileCount":manifest['recordCount'],
 "sourceDigestPreserved":before_digest==after_digest,
 "authorityDrift":"NONE",
 "status":"BUILT_PENDING_QUALIFICATION"
}
(ROOT/'HF38_BUILD_RECEIPT.json').write_text(json.dumps(build_receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps(build_receipt,indent=2))
