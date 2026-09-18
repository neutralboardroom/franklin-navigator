/* R1330 — unified free profile management + optional Community Member enrichment */
'use strict';
(()=> {
  const API='https://franklin-navigator-membership.onrender.com';
  const root=document.querySelector('[data-member-profile-root]');if(!root)return;
  const tr=s=>window.FranklinI18n?.translate(s)||s;
  const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
  const link=(text,href,cls='button')=>{const a=node('a',text,cls);a.href=href;return a};
  const button=(text,fn,primary=false)=>{const b=node('button',text,primary?'button primary':'button');b.type='button';b.addEventListener('click',()=>work(fn));return b};
  const state={profile:null,profiles:[],draft:null,publication:null,activePaid:false,media:[],busy:false,dirty:false,inputs:{}};
  const status=node('p','Loading your profile…','r37-status r38-status-strip');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
  const controls=node('div',undefined,'r37-member-step tool'),view=node('div',undefined,'r37-member-step tool');root.append(controls,view);
  const messages={
    AUTH_REQUIRED:'Sign in to manage your profile.',
    ACTIVE_MEMBERSHIP_REQUIRED:'Community Membership is required for this richer member feature. Free profile management is still available.',
    PROFILE_VERIFICATION_REQUIRED:'Request and complete profile-access verification before managing this profile.',
    AUTHORITY_CONFIRMATION_REQUIRED:'Confirm that you own, manage, or are authorized to act for this profile before submitting the request.',
    ACTIVE_MEMBERSHIP_REQUIRES_SUPPORT:'This profile has an active membership. Contact support before ending profile management so billing and access stay consistent.',
    PUBLISHED_MEMBER_CONTENT_REQUIRES_SUPPORT:'This profile has published member content. Contact support before ending profile management so public content is handled safely.',
    REPRESENTATION_DISPUTED:'This profile has an access dispute. Contact support for review.',
    VERSION_CONFLICT:'This profile changed in another session. Your unsaved text is still here. Reload the saved version before trying again.',
    PUBLICATION_OWNER_CONFLICT:'Another authorized account manages the published member content. Contact support.',
    FIELD_NOT_EDITABLE:'Only supported member-profile fields can be changed.',
    PUBLIC_URL_INVALID:'Use a public HTTPS website address without a password or sign-in token.',
    SUMMARY_TOO_SHORT:'Write a description of at least 20 characters.',
    FIELD_INVALID:'Check the field lengths and remove HTML or unsupported characters.',
    REVIEWER_NOT_CONFIGURED:'Review is not available yet. Your saved request has not been approved.',
    PUBLICATION_PERMISSION_REQUIRED:'Confirm that you are authorized to publish this public-facing content.',
    MEDIA_SLOT_INVALID:'Choose a supported photo location.',
    MEDIA_POSITION_INVALID:'Choose a supported gallery position.',
    MEDIA_SIZE_INVALID:'That image is too large. Choose a smaller image.',
    MEDIA_TYPE_INVALID:'Choose a valid JPG, PNG or WebP image.',
    MEDIA_WEBP_REQUIRED:'Your browser could not prepare this image safely. Try a different image or current browser.',
    MEDIA_METADATA_NOT_ALLOWED:'The image still contains unsupported metadata. Try exporting it again or choose another image.',
    MEDIA_DIMENSIONS_INVALID:'Choose an image no larger than 3000 × 3000 pixels.',
    MEDIA_REVIEW_PENDING:'That image position already has a submission waiting for review.',
    RATE_LIMITED:'Too many requests. Please try again later.'
  };
  function message(s,kind=''){status.className='r37-status r38-status-strip'+(kind?' '+kind:'');status.textContent=s}
  async function request(path,body){
    let response;
    try{response=await fetch(API+path,{method:body?'POST':'GET',credentials:'include',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'})}
    catch{throw Object.assign(new Error('The service is unavailable. Your unsaved work is still here.'),{code:'SERVICE_UNAVAILABLE'})}
    let out={};try{out=await response.json()}catch{}
    if(!response.ok){const code=out.error?.code||('HTTP_'+response.status);throw Object.assign(new Error(messages[code]||out.error?.message||'We could not complete this request. Check saved status before retrying.'),{code,status:response.status})}
    return out;
  }
  async function uploadRaw(path,blob){
    let response;try{response=await fetch(API+path,{method:'POST',credentials:'include',headers:{'Content-Type':'image/webp'},body:blob,cache:'no-store'})}
    catch{throw Object.assign(new Error('The upload service is unavailable. No public change was made.'),{code:'SERVICE_UNAVAILABLE'})}
    let out={};try{out=await response.json()}catch{}
    if(!response.ok){const code=out.error?.code||('HTTP_'+response.status);throw Object.assign(new Error(messages[code]||out.error?.message||'The image could not be uploaded. No public change was made.'),{code,status:response.status})}
    return out;
  }
  async function work(fn){
    if(state.busy)return;state.busy=true;root.setAttribute('aria-busy','true');
    try{await fn()}catch(e){message(e.message||'We could not complete that request.')}
    finally{state.busy=false;root.removeAttribute('aria-busy')}
  }
  function field(label,name,type='text',max=1200,help=''){
    const wrap=node('label'),title=node('span',label),input=node(type==='textarea'?'textarea':'input');
    if(type!=='textarea')input.type=type;input.name=name;input.maxLength=max;input.id='member-'+name;wrap.htmlFor=input.id;wrap.append(title,input);
    if(help)wrap.append(node('span',help,'r38-field-help'));return{wrap,input};
  }
  function group(title,open=false){
    const d=node('details',undefined,'r38-field-group');if(open)d.open=true;const s=node('summary',title),b=node('div',undefined,'r38-field-group-body');d.append(s,b);return{details:d,body:b};
  }
  function publicProfileUrl(p){return '/profiles/'+encodeURIComponent(p.profile_id)+'/';}
  function correctionUrl(p,removal=false){
    const page=location.origin+publicProfileUrl(p);
    const q=new URLSearchParams({listing:p.name,profile:p.profile_id,url:page});if(removal)q.set('action','PUBLIC_REMOVAL');return '/corrections/?'+q.toString();
  }
  async function refresh(){
    const result=await request('/api/member/profiles');state.profiles=result.profiles||[];controls.replaceChildren();
    if(!state.profiles.length){
      message('No profile is connected to this account yet.');
      controls.append(node('h2','Connect a Franklin profile'),node('p','Find your public profile and request management access. Claiming and basic profile management are free.'),link('Find or claim my profile','/profile-access/','button primary'));
      view.replaceChildren();return;
    }
    const l=node('label','Choose your linked profile'),select=node('select');select.id='member-profile-selection';l.htmlFor=select.id;
    for(const p of state.profiles){const o=node('option',p.name);o.value=p.profile_id;select.append(o)}controls.append(l,select);
    const asked=new URLSearchParams(location.search).get('profile');
    state.profile=state.profiles.find(p=>p.profile_id===state.profile?.profile_id)||state.profiles.find(p=>p.profile_id===asked)||state.profiles[0];select.value=state.profile.profile_id;
    select.addEventListener('change',()=>{if(state.dirty&&!confirm(tr('Discard unsaved member-profile edits and change profiles?'))){select.value=state.profile.profile_id;return}state.profile=state.profiles.find(p=>p.profile_id===select.value);state.dirty=false;work(load)});
    if(!result.reviewCoverageConfigured)controls.append(node('p','Profile review coverage is temporarily unavailable. You can still view saved status and use free factual-correction routes.','fine-print'));
    await load();
  }
  async function load(){
    const p=state.profile;
    const [profileResult,publicResult,mediaResult]=await Promise.all([
      request('/api/member/profile?profileId='+encodeURIComponent(p.profile_id)),
      request('/api/member/public-profile?profileId='+encodeURIComponent(p.profile_id)).catch(()=>({activePaidMember:false,publication:null})),
      request('/api/member/media/list?profileId='+encodeURIComponent(p.profile_id)).catch(()=>({media:[]}))
    ]);
    state.draft=profileResult.draft;state.publication=profileResult.publication||publicResult.publication||null;state.activePaid=publicResult.activePaidMember===true;state.media=Array.isArray(mediaResult.media)?mediaResult.media:[];
    view.replaceChildren();view.append(node('h2',p.name));
    if(p.authority_state!=='VERIFIED'){representation(p);return}
    renderManagedWorkspace(p);
    message(state.activePaid?'Profile access verified. Free management and Community Member tools are available.':'Profile access verified. Free profile management is available; Community Membership is optional.','good');
  }
  const reviewedWhen=value=>{try{return value?new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):''}catch{return''}};
  async function releaseAccess(p,{pending=false}={}){
    const question=pending?'Withdraw this profile-access request from this Franklin account?':'Stop managing this profile from this Franklin account? Public factual corrections remain available.';
    if(!confirm(tr(question)))return;
    try{
      const result=await request('/api/member/representation/release',{profileId:p.profile_id,expectedRevision:p.review_revision||0});
      message(result.reused?'Profile management was already disconnected.':pending?'Your profile-access request was withdrawn.':'This profile is no longer connected to your account.','good');
      state.profile=null;state.dirty=false;await refresh();
    }catch(e){
      if(['ACTIVE_MEMBERSHIP_REQUIRES_SUPPORT','PUBLISHED_MEMBER_CONTENT_REQUIRES_SUPPORT','REPRESENTATION_DISPUTED'].includes(e.code)){
        message(e.message,'warn');
        if(!view.querySelector('[data-r1338-access-support]')){
          const box=node('div',undefined,'r37-member-actions');box.dataset.r1338AccessSupport='1';
          box.append(link('Get profile access support','/member-support/?topic=PROFILE_MANAGEMENT&profile='+encodeURIComponent(p.profile_id),'button primary'));view.prepend(box);
        }
        return;
      }
      throw e;
    }
  }
  function representation(p){
    view.replaceChildren();
    const section=node('section',undefined,'r38-claim-workspace');
    section.append(node('div','Free profile access','eyebrow'),node('h3','Confirm that you are authorized to manage this profile.'),node('p','Claiming and basic profile management are free. Franklin reviews access before management tools are enabled; a claim never changes public facts by itself.'));
    if(p.public_reason)section.append(node('p',p.public_reason,'r37-status'));
    const when=reviewedWhen(p.review_updated_at);
    if(p.authority_state==='DISPUTED'){
      section.append(node('p','This profile has an access dispute. Franklin will not accept another access request until the dispute is reviewed.','r37-status warn'));
      const a=node('div',undefined,'r37-member-actions');a.append(link('Get profile support','/member-support/?profile='+encodeURIComponent(p.profile_id),'button primary'),link('View public profile',publicProfileUrl(p)),link('Submit a factual correction',correctionUrl(p)));section.append(a);view.append(section);return;
    }
    if(p.review_state==='PENDING'){
      section.append(node('p','Your profile-access request is waiting for review.'+(when?' Last updated '+when+'.':''),'r37-status good'));
      const a=node('div',undefined,'r37-member-actions');
      a.append(button('Refresh status',refresh,true),link('View public profile',publicProfileUrl(p)),link('Submit a factual correction',correctionUrl(p)),button('Withdraw access request',()=>releaseAccess(p,{pending:true})));
      section.append(a);view.append(section);return;
    }
    const stateCopy={
      CHANGES_REQUESTED:'Franklin needs more information before this access request can be approved.',
      REJECTED:'The previous access request was not approved. You may submit new evidence if you are authorized.',
      REVOKED:'Previous management access ended. You may request access again if you are currently authorized.'
    };
    if(stateCopy[p.review_state])section.append(node('p',stateCopy[p.review_state]+(when?' Last updated '+when+'.':''),'r37-status warn'));
    const f=document.createElement('form');f.className='form-grid r38-representation-form';
    const url=inputField('Official website or public page showing your connection','evidenceUrl','url','https://');
    const why=textArea('How are you authorized to manage this profile?','statement',4);
    const confirmLabel=node('label',undefined,'p0-check'),confirmBox=document.createElement('input');confirmBox.type='checkbox';confirmBox.required=true;confirmBox.name='authorityConfirmed';confirmLabel.append(confirmBox,document.createTextNode(' I confirm that I own, manage, work for, or am otherwise authorized to act for this profile.'));
    f.append(url.wrap,why.wrap,confirmLabel);
    const submit=node('button',p.review_state==='CHANGES_REQUESTED'?'Submit updated access request':'Submit access request','button primary');submit.type='submit';f.append(submit);
    f.addEventListener('submit',e=>{e.preventDefault();work(async()=>{
      if(!confirmBox.checked){message(messages.AUTHORITY_CONFIRMATION_REQUIRED);return}
      const result=await request('/api/member/representation/request',{profileId:p.profile_id,expectedRevision:p.review_revision||0,evidenceUrl:url.input.value,statement:why.input.value,authorityConfirmed:true});
      p.review_revision=result.revision;p.review_state='PENDING';
      message('Your free profile-access request is saved and waiting for review. No membership or payment was started.','good');
      await refresh();
    })});
    section.append(f);
    const a=node('div',undefined,'r37-member-actions');
    a.append(link('View public profile',publicProfileUrl(p)),link('Submit a factual correction',correctionUrl(p)));
    if(p.review_state||p.authority_state==='REVOKED')a.append(button('Stop managing this profile',()=>releaseAccess(p)));
    a.append(link('Need help?','/member-support/?profile='+encodeURIComponent(p.profile_id)));
    section.append(a);view.append(section);
  }
  function renderManagedWorkspace(p){
    const basic=node('section',undefined,'r1330-studio-basic');
    basic.append(node('div','Free profile management','eyebrow'),node('h3','Manage the essentials without paying.'),node('p','Your verified access lets you manage the profile relationship, request factual corrections or removal, and submit a profile photo or logo for review. Source-backed facts are not silently overwritten.'));
    const actions=node('div',undefined,'r38-member-actions');
    actions.append(link('View public profile',publicProfileUrl(p),'button primary'),link('Request a factual correction',correctionUrl(p)),link('Request removal',correctionUrl(p,true)),link('Account & profile access','/profile-access/?profile='+encodeURIComponent(p.profile_id)),button('Stop managing this profile',()=>releaseAccess(p)),link('Access help','/member-support/?topic=PROFILE_MANAGEMENT&profile='+encodeURIComponent(p.profile_id)));
    if(p.verified_at){const when=reviewedWhen(p.verified_at);if(when)basic.append(node('p','Management access verified '+when+'.','fine-print'))}
    basic.append(actions);view.append(basic);
    view.append(mediaManager(p,false));
    if(state.activePaid){
      const paid=node('section',undefined,'r1330-studio-member');
      paid.append(node('div','Community Member tools','eyebrow'),node('h3','Build the richer member profile.'),node('p','Your active membership adds reviewed About/services content, richer practical details, cover and gallery media, action links and other member profile modules.'));
      view.append(paid,mediaManager(p,true));editor(p);
    }else{
      const upsell=node('section',undefined,'r1330-studio-upgrade');
      upsell.append(node('div','Optional Community Membership','eyebrow'),node('h3','Want a richer profile?'),node('p','Community Membership is $35/year. It adds the richer reviewed profile, cover/gallery media and additional member tools. It is not required for accuracy, claim access, profile removal or your basic profile photo/logo.'));
      const a=node('div',undefined,'r38-member-actions');a.append(link('See Community Membership — $35/year','/membership-start/','button primary'),link('Preview member profile','/member-profile-preview/?profile='+encodeURIComponent(p.profile_id)));upsell.append(a);view.append(upsell);
    }
  }
  function activeMedia(slot){return state.media.filter(m=>m.slot===slot&&m.state!=='REMOVED').sort((a,b)=>(a.position-b.position)||String(b.updated_at||'').localeCompare(String(a.updated_at||'')))}
  function statusLabel(s){return({DRAFT:'Private draft',SUBMITTED:'Waiting for review',CHANGES_REQUESTED:'Changes requested',PUBLISHED:'Published'})[s]||s}
  async function previewBlob(img,row){
    try{const r=await fetch(API+row.previewUrl,{credentials:'include',cache:'no-store'});if(!r.ok)return;const blob=await r.blob(),url=URL.createObjectURL(blob);img.src=url;img.addEventListener('load',()=>URL.revokeObjectURL(url),{once:true})}catch{}
  }
  function mediaListFor(section,slot){
    const rows=activeMedia(slot);if(!rows.length)return;
    const list=node('div',undefined,'r1330-media-list');
    rows.forEach(row=>{
      const card=node('article',undefined,'r1330-media-card'),img=document.createElement('img');img.alt='';img.loading='lazy';previewBlob(img,row);
      const meta=node('div',undefined,'r1330-media-meta');meta.append(node('strong',slot==='PROFILE'?'Profile photo / logo':slot==='COVER'?'Cover photo':'Gallery photo '+(Number(row.position)+1)),node('span',statusLabel(row.state)));
      if(row.public_reason)meta.append(node('p',row.public_reason,'fine-print'));
      const acts=node('div',undefined,'r38-member-actions');
      if(['DRAFT','CHANGES_REQUESTED'].includes(row.state))acts.append(button('Submit for review',async()=>{if(!confirm(tr('Confirm that you have the right to publish this image publicly on this profile.')))return;await request('/api/member/media/submit',{profileId:state.profile.profile_id,mediaId:row.mediaId,rightsConfirmed:true});message('Image submitted for review. It is not public until approved.','good');await load()},true));
      acts.append(button(row.state==='PUBLISHED'?'Remove from profile':'Remove upload',async()=>{if(!confirm(tr('Remove this image from your Franklin profile workspace?')))return;await request('/api/member/media/remove',{profileId:state.profile.profile_id,mediaId:row.mediaId});message('Image removed.','good');await load()}));
      meta.append(acts);card.append(img,meta);list.append(card);
    });section.append(list);
  }
  function uploadControl(p,slot,label,help,position=0){
    const wrap=node('div',undefined,'r1330-media-upload'),title=node('strong',label),desc=node('p',help,'fine-print'),input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.setAttribute('aria-label',label);
    const go=button('Upload private draft',async()=>{
      const file=input.files?.[0];if(!file){message('Choose a JPG, PNG or WebP image first.');return}
      message('Preparing image securely…');
      const blob=await prepareImage(file,slot);
      const result=await uploadRaw('/api/member/media/upload?profileId='+encodeURIComponent(p.profile_id)+'&slot='+encodeURIComponent(slot)+'&position='+encodeURIComponent(position),blob);
      input.value='';message('Private image draft uploaded. Review it below, then submit it for approval when ready.','good');await load();
    },true);
    wrap.append(title,desc,input,go);return wrap;
  }
  function mediaManager(p,paid){
    const section=node('section',undefined,paid?'r1330-media-manager is-member':'r1330-media-manager is-free');
    if(!paid){
      section.append(node('h3','Profile photo or logo'),node('p','Upload a photo or logo of your choice that represents your business, practice or organization. It stays private until you submit it and Franklin approves it. You must have permission to publish it.'));
      section.append(uploadControl(p,'PROFILE','Choose your profile photo or logo','JPG, PNG or WebP. We remove embedded metadata and prepare a web-safe copy before upload.'));
      mediaListFor(section,'PROFILE');
    }else{
      section.append(node('h3','Your public photo gallery'),node('p','Community Members can upload a reviewed cover image plus up to eight gallery photos for residents to see on the public profile. Images stay private until you submit them and Franklin approves them.'));
      section.append(uploadControl(p,'COVER','Choose a cover photo','Use a clear image that represents your business or organization. Avoid text-heavy artwork.'));
      mediaListFor(section,'COVER');
      const gallery=node('div',undefined,'r1330-gallery-uploader'),label=node('label'),span=node('span','Gallery position'),select=node('select');
      for(let i=0;i<8;i++){const o=node('option','Photo '+(i+1));o.value=String(i);select.append(o)}label.append(span,select);
      const holder=node('div',undefined,'r1330-gallery-upload-holder');holder.append(uploadControl(p,'GALLERY','Upload a gallery photo','Choose a photo from your device. Up to eight reviewed gallery positions are available.',0));
      select.addEventListener('change',()=>{holder.replaceChildren(uploadControl(p,'GALLERY','Upload gallery photo '+(Number(select.value)+1),'Choose a photo from your device. This will replace the selected gallery position after review.',Number(select.value)))});
      gallery.append(label,holder);section.append(gallery);mediaListFor(section,'GALLERY');
    }
    return section;
  }
  async function decodeImage(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Object.assign(new Error(messages.MEDIA_TYPE_INVALID),{code:'MEDIA_TYPE_INVALID'});
    if(file.size>12*1024*1024)throw Object.assign(new Error('Choose an image smaller than 12 MB.'),{code:'MEDIA_SIZE_INVALID'});
    if('createImageBitmap'in window)return createImageBitmap(file);
    const url=URL.createObjectURL(file);
    try{return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url})}
    finally{setTimeout(()=>URL.revokeObjectURL(url),0)}
  }
  async function prepareImage(file,slot){
    const source=await decodeImage(file),profile=slot==='PROFILE',cover=slot==='COVER';
    const maxW=profile?1200:cover?2200:1800,maxH=profile?1200:cover?1400:1500,maxBytes=profile?2*1024*1024:4*1024*1024;
    const scale=Math.min(1,maxW/source.width,maxH/source.height),w=Math.max(1,Math.round(source.width*scale)),h=Math.max(1,Math.round(source.height*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Your browser could not prepare this image.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(source,0,0,w,h);if(source.close)source.close();
    const make=q=>new Promise(resolve=>canvas.toBlob(resolve,'image/webp',q));
    for(const q of [.9,.82,.74,.66,.58]){const blob=await make(q);if(blob&&blob.type==='image/webp'&&blob.size<=maxBytes)return blob}
    throw Object.assign(new Error(messages.MEDIA_SIZE_INVALID),{code:'MEDIA_SIZE_INVALID'});
  }
  function readiness(inputs){
    const val=n=>String(inputs[n]?.value||'').trim();
    return[
      ['Public description',val('summary').length>=20],
      ['Services',Boolean(val('services'))],
      ['Contact or action link',Boolean(val('website')||val('contactUrl')||val('bookingUrl')||val('quoteUrl')||val('menuUrl')||val('orderUrl'))],
      ['Hours or service area',Boolean(val('hours')||val('serviceArea'))],
      ['Language or accessibility',Boolean(val('languages')||val('accessibility'))],
      ['Official online presence',Boolean(val('socialLinks'))]
    ];
  }
  function readinessBox(inputs){
    const box=node('section',undefined,'r38-member-readiness'),h=node('h3','Member profile readiness'),p=node('p'),progress=document.createElement('progress'),ul=node('ul');
    progress.max=6;progress.setAttribute('aria-label','Member profile readiness');box.append(h,p,progress,ul,node('p','Only you see this completion checklist while editing. It is not a public rating or ranking factor.','fine-print'));
    const render=()=>{const c=readiness(inputs),n=c.filter(x=>x[1]).length;p.textContent=`${n} of ${c.length} useful sections ready`;progress.value=n;ul.replaceChildren(...c.map(([label,ok])=>node('li',(ok?'Ready: ':'Add: ')+label,ok?'r38-ready':'r38-not-ready')))};
    Object.values(inputs).forEach(i=>i.addEventListener('input',render));render();return box;
  }
  function editor(p){
    const draft=state.draft,labels={DRAFT:'Saved member draft — not submitted',SUBMITTED:'Member draft submitted — awaiting review',CHANGES_REQUESTED:'Member changes requested',PUBLISHED:'Published member content',REMOVED:'Member content removed'};
    const shell=node('section',undefined,'r1330-rich-editor');shell.append(node('h3','Richer Community Member profile'),node('p',labels[draft?.state]||'No saved member draft yet.'),node('p','These are optional member-provided additions. Source-backed identity facts and free factual corrections remain separate.'));
    if(draft?.public_reason)shell.append(node('p',draft.public_reason,'r37-status warn'));
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
      ['offersEvents','Updates and events','textarea',1600,'Optional current, supportable public updates or events.'],
      ['specialOfferTitle','Franklin Navigator offer title','text',140,'Optional member-only promotional headline shown to Franklin Navigator users.'],
      ['specialOfferDetails','Franklin Navigator offer details','textarea',1200,'Explain the offer clearly, including what a user receives and any important limitations.'],
      ['specialOfferCode','Offer code','text',80,'Optional code a Franklin Navigator user can mention or enter.'],
      ['specialOfferExpires','Offer expiration date','date',20,'Optional YYYY-MM-DD expiration date. Expired offers are not shown publicly.'],
      ['specialOfferTerms','Offer terms','textarea',800,'Optional eligibility, exclusions, redemption or other terms.'],
      ['specialOfferUrl','Offer or redemption page','url',1200,'Optional public HTTPS page where users can learn more or redeem the offer.'],
      ['website','Official website','url',1200,'Public HTTPS URL.'],
      ['contactUrl','Contact page','url',1200,'Public HTTPS URL.'],
      ['bookingUrl','Booking or appointment page','url',1200,'Public HTTPS URL.'],
      ['quoteUrl','Quote or estimate page','url',1200,'Public HTTPS URL.'],
      ['menuUrl','Menu or services page','url',1200,'Public HTTPS URL.'],
      ['orderUrl','Order page','url',1200,'Public HTTPS URL.'],
      ['directionsUrl','Directions or location page','url',1200,'Public HTTPS URL.'],
      ['socialLinks','Official social links','textarea',4000,'One verified official public HTTPS URL per line, up to 12.'],
      ['profileImageUrl','External profile image URL','url',1200,'Optional legacy alternative. Direct upload above is preferred.'],
      ['galleryUrls','External gallery image URLs','textarea',4000,'Optional legacy alternatives, one public HTTPS image URL per line, up to 8.']
    ];
    const built={};
    for(const spec of specs){const f=field(spec[1],spec[0],spec[2],spec[3],spec[4]);f.input.value=draft?.fields?.[spec[0]]||'';f.input.addEventListener('input',()=>{state.dirty=true});inputs[spec[0]]=f.input;built[spec[0]]=f}
    inputs.summary.required=true;inputs.summary.minLength=20;
    const essentials=group('About & services',true);['summary','tagline','services'].forEach(k=>essentials.body.append(built[k].wrap));
    const actions=group('Contact & action links',true);['website','contactUrl','bookingUrl','quoteUrl','menuUrl','orderUrl','directionsUrl'].forEach(k=>actions.body.append(built[k].wrap));
    const practical=group('Hours, service area, language & accessibility');['hours','serviceArea','languages','accessibility','pricing'].forEach(k=>practical.body.append(built[k].wrap));
    const credibility=group('Experience & credentials');['experience','credentials','awards','associations','education','publications'].forEach(k=>credibility.body.append(built[k].wrap));
    const offers=group('Special offers for Franklin Navigator users',true);['specialOfferTitle','specialOfferDetails','specialOfferCode','specialOfferExpires','specialOfferTerms','specialOfferUrl'].forEach(k=>offers.body.append(built[k].wrap));
    offers.body.prepend(node('p','Community Members can publish a reviewed Franklin Navigator special offer. Offers must be truthful, current, lawful and cannot be conditioned on leaving a positive review.','fine-print'));
    const online=group('Updates, events & official online presence');['offersEvents','socialLinks'].forEach(k=>online.body.append(built[k].wrap));
    const legacy=group('External image links — optional');['profileImageUrl','galleryUrls'].forEach(k=>legacy.body.append(built[k].wrap));
    form.append(readinessBox(inputs),essentials.details,actions.details,practical.details,credibility.details,offers.details,online.details,legacy.details);
    const save=node('button','Save private member draft','button primary');save.type='submit';form.append(save);
    form.addEventListener('submit',e=>{e.preventDefault();work(async()=>{const values=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value]));const saved=await request('/api/member/profile/save',{profileId:p.profile_id,expectedRevision:state.draft?.revision||0,fields:values});state.draft={...saved,fields:values};state.dirty=false;message('Your member draft is saved privately. It is not public.','good')})});
    shell.append(form);
    const actionRow=node('div',undefined,'r38-member-actions');
    actionRow.append(button('Submit member draft for review',async()=>{if(state.dirty){message('Save your member edits before submitting them for review.');return}if(!state.draft){message('Save a member draft first.');return}if(!confirm(tr('Confirm that you are authorized to publish this public-facing member content.')))return;const result=await request('/api/member/profile/submit',{profileId:p.profile_id,expectedRevision:state.draft.revision||0,rightsConfirmed:true});state.draft={...state.draft,...result};message('Member content submitted for review. It will not replace public content until approved.','good')},true),button('Reload saved member version',async()=>{if(state.dirty&&!confirm(tr('Discard unsaved member edits and reload the saved version?')))return;state.dirty=false;await load()}),link('Billing & cancellation','/membership-status/'),link('Get support','/member-support/'));
    shell.append(actionRow);
    if(state.publication){const pub=state.publication;const published=node('div',undefined,'r1330-published-member');published.append(node('h4','Published member content'),node('p',pub.fields?.summary||'Published member content is active.'),link('View public profile',publicProfileUrl(p)));shell.append(published)}
    view.append(shell);
  }
  window.addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue=''}});
  work(async()=>{try{await request('/api/accounts/me');await refresh()}catch(e){if(e.code==='AUTH_REQUIRED'){message('Sign in or create a free Franklin account to claim and manage a profile.');controls.append(link('Sign in or create account','/profile-access/'+(new URLSearchParams(location.search).get('profile')?'?profile='+encodeURIComponent(new URLSearchParams(location.search).get('profile')):''),'button primary'))}else throw e}});
})();