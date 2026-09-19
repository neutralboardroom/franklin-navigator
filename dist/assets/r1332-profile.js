/* R1332 — finished profile UX + Franklin community ratings and written reviews */
(()=>{'use strict';
 const match=location.pathname.match(/^\/profiles\/(FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100})\/$/);if(!match)return;
 const id=decodeURIComponent(match[1]),API='https://franklin-navigator-membership.onrender.com',SELF_ID='FR-ORG-b00c0ace7943973c',reviewable=id!==SELF_ID&&!/^FR-(?:GOV|CIV|NPO)-/.test(id);
 const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
 const el=(t,txt,cls)=>{const n=document.createElement(t);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n};
 const btn=(txt,cls='button')=>{const b=el('button',txt,cls);b.type='button';return b};
 const api=async(path,opt={})=>{const r=await fetch(API+path,{credentials:'include',cache:'no-store',...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});const p=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(p?.error?.message||'Request failed');e.code=p?.error?.code||'REQUEST_FAILED';e.status=r.status;throw e}return p};
 const fmtDate=v=>{try{return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'}).format(new Date(v))}catch{return''}};
 const stars=n=>{const rounded=Math.round(Number(n)||0);return '★★★★★'.slice(0,rounded)+'☆☆☆☆☆'.slice(rounded)};
 const profileName=()=>q('.r22-profile-hero h1')?.textContent?.trim()||'this profile';
 const entityLabel=()=>{const text=((q('.r22-profile-hero .eyebrow')?.textContent||'')+' '+profileName()).toLowerCase();if(id===SELF_ID)return'community platform';if(/nonprofit|charity|foundation|association|organization|church|community/.test(text))return'organization';if(/attorney|lawyer|doctor|dentist|agent|advisor|consultant|professional|therapist|accountant|architect|engineer/.test(text))return'professional';if(/government|city of|county|department|agency/.test(text))return'government entity';return'business';};
 function status(parent,msg,kind=''){let s=q('.r1332-status',parent);if(!s){s=el('p','', 'r1332-status');parent.append(s)}s.className='r1332-status '+kind;s.textContent=msg}
 function enhanceStatic(){
   document.body.classList.add('r1332-profile');
   q('#sources')?.remove();
   qa('a[href="#sources"]').forEach(a=>a.remove());
   const official=q('#official-links');if(official){const h=q('h2',official);if(h&&/^Official\b/.test(h.textContent||''))h.textContent='Helpful links';}
   const manage=q('#manage');if(manage){const h=q('h2',manage);if(h)h.textContent='Own or manage this profile?'}
   const nav=q('.r1330-section-nav');if(nav){
     qa('a',nav).forEach(a=>{if(a.getAttribute('href')==='#details')a.textContent='Services & details';if(a.getAttribute('href')==='#official-links')a.textContent='Links';if(a.getAttribute('href')==='#manage')a.textContent='Manage'});
   }
   bindGallery();
 }
 function ratingLine(summary){
   let row=q('.r1332-rating-line');if(!row){row=el('div','', 'r1332-rating-line');const loc=q('.profile-location');loc?.insertAdjacentElement('afterend',row)}
   row.replaceChildren();
   if(summary.count){
     const s=el('span',stars(summary.average),'r1332-stars');s.setAttribute('aria-label',summary.average+' out of 5 stars');
     const a=el('a',summary.average.toFixed(1)+' · '+summary.count+(summary.count===1?' review':' reviews'),'r1332-rating-link');a.href='#reviews';
     row.append(s,a);
   }else{
     const a=el('a','No Franklin Navigator reviews yet — be the first','r1332-rating-link');a.href='#reviews';row.append(a);
   }
 }
 function bars(summary){
   const wrap=el('div','', 'r1332-review-bars');
   for(let n=5;n>=1;n--){const count=summary.distribution?.[n]||0,row=el('div','', 'r1332-review-bar'),label=el('span',n+' ★'),p=document.createElement('progress'),c=el('span',String(count));p.max=Math.max(1,summary.count);p.value=count;row.append(label,p,c);wrap.append(row)}
   return wrap;
 }
 function authPanel(onReady){
   const box=el('div','', 'r1332-auth-panel'),h=el('h3','Sign in to participate'),p=el('p','A free Franklin account is required to write, report or manage reviews. Membership is not required.');
   const tabs=el('div','actions'),create=btn('Create account','button primary'),login=btn('Sign in','button');tabs.append(create,login);
   const form=document.createElement('form');box.append(h,p,tabs,form);
   const render=mode=>{
     form.replaceChildren();
     if(mode==='register'){
       const name=field('Your name','text','name'),email=field('Email','email','email'),pw=field('Create password (12+ characters)','password','new-password');
       const submit=el('button','Create free account','button primary');submit.type='submit';form.append(name.wrap,email.wrap,pw.wrap,submit);
       form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;try{await api('/api/accounts/register',{method:'POST',body:JSON.stringify({displayName:name.input.value,email:email.input.value,password:pw.input.value})});status(box,'Account created. You can now submit your review.','good');onReady?.()}catch(err){status(box,err.message,'warn')}finally{submit.disabled=false}};
     }else{
       const email=field('Email','email','email'),pw=field('Password','password','current-password'),submit=el('button','Sign in','button primary');submit.type='submit';form.append(email.wrap,pw.wrap,submit);
       form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;try{await api('/api/accounts/login',{method:'POST',body:JSON.stringify({email:email.input.value,password:pw.input.value})});status(box,'Signed in. You can now continue.','good');onReady?.()}catch(err){status(box,err.message,'warn')}finally{submit.disabled=false}};
     }
   };
   create.onclick=()=>{create.className='button primary';login.className='button';render('register')};
   login.onclick=()=>{login.className='button primary';create.className='button';render('login')};render('register');return box;
 }
 function field(label,type='text',autocomplete=''){
   const wrap=document.createElement('label'),span=el('span',label),input=document.createElement(type==='textarea'?'textarea':'input');
   if(type!=='textarea')input.type=type;if(autocomplete)input.autocomplete=autocomplete;wrap.append(span,input);return{wrap,input};
 }
 function reviewForm(section,reload){
   const form=document.createElement('form');form.className='r1332-review-form';form.hidden=true;
   form.append(el('h3','Write a review of '+profileName()),el('p','Share a firsthand experience to help other Franklin residents. Do not include private client, patient, case, account or payment information.','fine-print'));
   const ratingWrap=document.createElement('fieldset'),legend=el('legend','Your rating'),rating=el('div','', 'r1332-rating-input');ratingWrap.append(legend,rating);
   for(let i=5;i>=1;i--){const input=document.createElement('input');input.type='radio';input.name='rating';input.id='r1332-rating-'+i;input.value=String(i);const label=el('label','★');label.htmlFor=input.id;label.title=i+' star'+(i===1?'':'s');rating.append(input,label)}
   const title=field('Review title (optional)'),body=field('Your written review','textarea'),experience=document.createElement('select'),expWrap=document.createElement('label'),expLabel=el('span','How did you interact with this '+entityLabel()+'?');
   [['','Choose one'],['USED_SERVICE','Used a service'],['CONSULTED','Had a consultation'],['VISITED','Visited'],['PURCHASED','Purchased a product or service'],['OTHER_FIRSTHAND','Other firsthand experience']].forEach(([v,t])=>{const o=el('option',t);o.value=v;experience.append(o)});expWrap.append(expLabel,experience);
   const confirm=document.createElement('label'),check=document.createElement('input');check.type='checkbox';confirm.append(check,document.createTextNode(' I confirm this review reflects my firsthand experience and was not offered in exchange for a review.'));
   const actions=el('div','', 'actions'),submit=el('button','Publish review','button primary');submit.type='submit';const cancel=btn('Cancel','button');actions.append(submit,cancel);
   form.append(ratingWrap,title.wrap,body.wrap,expWrap,confirm,actions);
   cancel.onclick=()=>{form.hidden=true};
   form.onsubmit=async e=>{
     e.preventDefault();const picked=q('input[name="rating"]:checked',form);if(!picked){status(form,'Choose a star rating.','warn');return}
     if(body.input.value.trim().length<40){status(form,'Please write at least 40 characters about your firsthand experience.','warn');return}
     submit.disabled=true;
     try{
       const out=await api('/api/reviews/submit',{method:'POST',body:JSON.stringify({profileId:id,rating:Number(picked.value),title:title.input.value,body:body.input.value,experienceType:experience.value,firsthandConfirmed:check.checked})});
       status(form,out.message||'Review submitted.','good');setTimeout(()=>reload(),400);
     }catch(err){
       if(err.status===401){status(form,'Sign in or create a free account below, then submit again.','warn');if(!q('.r1332-auth-panel',form))form.append(authPanel(()=>{}))}
       else status(form,err.message,'warn');
     }finally{submit.disabled=false}
   };
   section.append(form);return form;
 }
 async function reportReview(card,reviewId){
   if(q('.r1332-report-box',card)){q('.r1332-report-box',card).remove();return}
   const box=el('div','', 'r1332-report-box r1332-review-form'),sel=document.createElement('select');
   [['SPAM','Spam or promotional'],['NOT_FIRSTHAND','Does not appear firsthand'],['HARASSMENT','Harassment or abusive content'],['PRIVATE_INFO','Private information'],['CONFLICT_OF_INTEREST','Conflict of interest'],['OTHER','Other']].forEach(([v,t])=>{const o=el('option',t);o.value=v;sel.append(o)});
   const detail=field('Optional details','textarea'),send=btn('Send report','button'),cancel=btn('Cancel','button');box.append(el('strong','Report this review'),sel,detail.wrap,send,cancel);card.append(box);
   cancel.onclick=()=>box.remove();send.onclick=async()=>{send.disabled=true;try{await api('/api/reviews/report',{method:'POST',body:JSON.stringify({reviewId,reason:sel.value,detail:detail.input.value})});status(box,'Report received. Thank you.','good')}catch(err){if(err.status===401&&!q('.r1332-auth-panel',box))box.append(authPanel(()=>{}));status(box,err.message,'warn')}finally{send.disabled=false}};
 }
 async function respondReview(card,reviewId){
   if(q('.r1332-response-box',card)){q('.r1332-response-box',card).remove();return}
   const box=el('div','', 'r1332-response-box r1332-review-form'),f=field('Public response from profile manager','textarea'),send=btn('Publish response','button primary'),cancel=btn('Cancel','button');box.append(f.wrap,send,cancel);card.append(box);cancel.onclick=()=>box.remove();
   send.onclick=async()=>{send.disabled=true;try{await api('/api/reviews/respond',{method:'POST',body:JSON.stringify({reviewId,response:f.input.value})});status(box,'Response published.','good');setTimeout(()=>location.reload(),350)}catch(err){status(box,err.message,'warn')}finally{send.disabled=false}};
 }
 function reviewCard(r,canRespond){
   const card=el('article','', 'r1332-review-card'),top=el('div','', 'r1332-review-top'),who=el('div'),score=el('span',stars(r.rating),'r1332-stars'),date=el('div',fmtDate(r.createdAt),'r1332-review-meta');
   who.append(el('strong',r.publicName||'Franklin user'),document.createElement('br'),score);top.append(who,date);card.append(top);
   if(r.title)card.append(el('h3',r.title));card.append(el('p',r.body));
   const exp=({USED_SERVICE:'Used a service',CONSULTED:'Consulted',VISITED:'Visited',PURCHASED:'Purchased',OTHER_FIRSTHAND:'Firsthand experience'})[r.experienceType]||'Firsthand experience';
   card.append(el('div',exp,'r1332-review-meta'));
   if(r.ownerResponse){const resp=el('div','', 'r1332-owner-response');resp.append(el('strong','Response from profile manager'),el('p',r.ownerResponse));card.append(resp)}
   const controls=el('div','', 'r1332-review-controls'),report=btn('Report','link-button');report.onclick=()=>reportReview(card,r.reviewId);controls.append(report);
   if(canRespond){const respond=btn(r.ownerResponse?'Update response':'Respond','link-button');respond.onclick=()=>respondReview(card,r.reviewId);controls.append(respond)}
   card.append(controls);return card;
 }
 async function renderReviews(){
   if(!reviewable)return;
   const article=q('.r22-profile-layout>article');if(!article)return;
   let section=q('#reviews');if(!section){section=el('section','');section.id='reviews';const manage=q('#manage');manage?article.insertBefore(section,manage):article.append(section)}
   section.replaceChildren();
   const header=el('div','', 'r1332-reviews-header'),copy=el('div'),h=el('h2','Ratings & reviews'),sub=el('p','Firsthand feedback from Franklin Navigator users. Reviews do not affect ordinary directory ranking or paid-member status.','fine-print'),write=btn('Write a review','button primary');copy.append(h,sub);header.append(copy,write);section.append(header);
   let data,manageStatus={canRespond:false};try{[data,manageStatus]=await Promise.all([api('/api/reviews?profileId='+encodeURIComponent(id)),api('/api/reviews/manage-status?profileId='+encodeURIComponent(id)).catch(()=>({canRespond:false}))])}catch{section.append(el('p','Reviews are temporarily unavailable.','r1332-status warn'));return}
   ratingLine(data.summary);
   const form=reviewForm(section,renderReviews);write.onclick=()=>{form.hidden=!form.hidden;if(!form.hidden)form.scrollIntoView({behavior:'smooth',block:'nearest'})};
   if(data.summary.count){
     const summary=el('div','', 'r1332-review-summary'),score=el('div','', 'r1332-review-score');score.append(el('strong',data.summary.average.toFixed(1)),el('div',stars(data.summary.average),'r1332-stars'),el('div',data.summary.count+(data.summary.count===1?' review':' reviews'),'r1332-review-meta'));summary.append(score,bars(data.summary));section.append(summary);
     const list=el('div','', 'r1332-review-list');data.reviews.forEach(r=>list.append(reviewCard(r,manageStatus.canRespond===true)));section.append(list);
   }else{
     const empty=el('div','', 'r1332-review-empty');empty.append(el('strong','No Franklin Navigator reviews yet.'),el('p','If you have firsthand experience with this '+entityLabel()+', you can help your neighbors by sharing it.'));section.append(empty);
   }
   const policy=el('p','', 'fine-print');policy.append(document.createTextNode('Reviews must reflect genuine firsthand experiences. Incentivized reviews are not allowed. '));const a=el('a','Review guidelines');a.href='/review-guidelines/';policy.append(a);section.append(policy);
   refreshNav();
 }
 function refreshNav(){
   const nav=q('.r1330-section-nav');if(!nav||q('a[href="#reviews"]',nav))return;const manage=q('a[href="#manage"]',nav),a=el('a','Reviews');a.href='#reviews';manage?nav.insertBefore(a,manage):nav.append(a);
 }
 function bindGallery(){
   qa('.hf35-member-gallery img,.r1330-gallery img').forEach(img=>{if(img.dataset.r1332Bound)return;img.dataset.r1332Bound='1';img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label','Open photo');const open=()=>{let d=q('.r1332-gallery-lightbox');if(!d){d=document.createElement('dialog');d.className='r1332-gallery-lightbox';const close=btn('×');close.setAttribute('aria-label','Close photo');const pic=document.createElement('img');d.append(pic,close);close.onclick=()=>d.close();d.onclick=e=>{if(e.target===d)d.close()};document.body.append(d)}q('img',d).src=img.src;typeof d.showModal==='function'?d.showModal():d.setAttribute('open','')};img.addEventListener('click',open);img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})});
 }
 function watchDynamic(){new MutationObserver(()=>{bindGallery();refreshNav()}).observe(q('.r22-profile-layout')||document.body,{childList:true,subtree:true})}
 const run=()=>{enhanceStatic();watchDynamic();if(reviewable)renderReviews()};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run,{once:true}):run();
})();