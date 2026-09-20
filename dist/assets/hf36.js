/* FR-NAV1.30.18-HF3.13.0 adaptive maximum-visible one-line navigation + site-wide issue monitoring + progressive Franklin Assistant */
(()=>{'use strict';
const loadCss=(href,key)=>{if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';document.head.append(l)};
loadCss('/assets/hf3102-mobile.css?v=frnav1292','franklin-mobile-3102');
loadCss('/assets/hf3103-mobile.css?v=frnav1293','franklin-mobile-3103');
loadCss('/assets/hf3105-brand.css?v=frnav1295','franklin-brand-3105');
loadCss('/assets/franklin-assistant-chat-r1306.css?v=frnav1306','franklin-assistant-chat-r1306');
loadCss('/assets/franklin-nav-r1310.css?v=frnav1310','franklin-nav-r1310');
loadCss('/assets/franklin-nav-r1311.css?v=frnav1311','franklin-nav-r1311');
loadCss('/assets/r1311-community.css?v=frnav1311','franklin-community-r1311');
loadCss('/assets/r1336-color-system.css?v=frnav1336','franklin-color-system-r1336');
if(!document.querySelector('script[data-franklin-established-positioning]')){const p=document.createElement('script');p.src='/assets/franklin-established-positioning.js?v=frnav1293';p.defer=true;p.dataset.franklinEstablishedPositioning='1';document.head.append(p)}
const loadAssistantR1318=()=>{
  if(!document.querySelector('[data-navigator-bot]')||document.querySelector('script[data-franklin-assistant-r1318]'))return;
  const load=(src,key)=>new Promise((resolve,reject)=>{const old=document.querySelector(`script[data-${key}]`);if(old){if(old.dataset.loaded==='1')return resolve();old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=src;s.defer=true;s.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';s.addEventListener('load',()=>{s.dataset.loaded='1';resolve()},{once:true});s.addEventListener('error',reject,{once:true});document.head.append(s)});
  load('/assets/franklin-assistant-core.js?v=frnav1292','franklin-assistant-core')
    .then(()=>load('/assets/franklin-assistant-r1293-core.js?v=frnav1293','franklin-assistant-r1293-core'))
    .then(()=>load('/assets/franklin-assistant-r1294-core.js?v=frnav1294','franklin-assistant-r1294-core'))
    .then(()=>load('/assets/franklin-assistant-r1295-core.js?v=frnav1295','franklin-assistant-r1295-core'))
    .then(()=>load('/assets/franklin-assistant-r1296-core.js?v=frnav1296','franklin-assistant-r1296-core'))
    .then(()=>load('/assets/franklin-assistant-r1293-files.js?v=frnav1293','franklin-assistant-r1293-files'))
    .then(()=>load('/assets/franklin-assistant-r1293-file-analysis.js?v=frnav1293','franklin-assistant-r1293-file-analysis'))
    .then(()=>load('/assets/franklin-assistant-context-r1317.js?v=frnav1318','franklin-assistant-context-r1317'))
    .then(()=>load('/assets/franklin-assistant-r1318.js?v=frnav1318','franklin-assistant-r1318'))
    .then(()=>{if(!window.FranklinAssistantR1318)throw new Error('Canonical Assistant did not initialize')})
    .catch(err=>installAssistantFailureFallback(err));
};

const installAssistantFailureFallback=(err)=>{
  const root=document.querySelector('[data-navigator-bot]'),form=root?.querySelector('form'),input=root?.querySelector('[data-navigator-input]');
  if(!root||!form||root.dataset.franklinAssistantFallback==='1')return;
  root.dataset.franklinAssistantFallback='1';root.dataset.franklinAssistantR1296='1';
  const show=(question='')=>{
    let d=document.querySelector('dialog[data-franklin-assistant-fallback-dialog]');
    if(!d){d=document.createElement('dialog');d.className='franklin-chat-panel';d.dataset.franklinAssistantFallbackDialog='1';d.innerHTML='<div class="franklin-chat-shell"><header class="franklin-chat-head"><div><div class="eyebrow">Franklin Assistant</div><h2>Franklin Assistant needs a quick retry</h2></div><button class="franklin-chat-close" type="button" aria-label="Close Franklin Assistant">×</button></header><div class="franklin-chat-transcript" data-fallback-body></div><div class="franklin-chat-composer"><div class="franklin-chat-compose-actions"><button class="button primary" type="button" data-assistant-retry>Retry</button></div></div></div>';d.querySelector('[data-assistant-retry]').addEventListener('click',()=>location.reload());document.body.append(d);d.querySelector('.franklin-chat-close').addEventListener('click',()=>d.close())}
    const b=d.querySelector('[data-fallback-body]');b.replaceChildren();
    if(question){const u=document.createElement('div');u.className='franklin-chat-row is-user';u.innerHTML='<div class="franklin-chat-bubble"><div class="franklin-chat-message"></div></div>';u.querySelector('.franklin-chat-message').textContent=question;b.append(u)}
    const a=document.createElement('div');a.className='franklin-chat-row is-assistant';a.innerHTML='<div class="franklin-chat-bubble"><div class="franklin-chat-speaker">Franklin Assistant</div><div class="franklin-chat-answer"><p>I could not load the full Assistant just now. Your question was not lost. Please retry, or use Find Local and the Help Center while the Assistant reconnects.</p></div></div>';b.append(a);
    typeof d.showModal==='function'?d.showModal():d.setAttribute('open','');
  };
  form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const q=input?.value?.trim()||'';if(input)input.value='';show(q)},true);
  root.addEventListener('click',e=>{const b=e.target.closest?.('[data-navigator-example]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();show(b.dataset.navigatorExample||b.textContent||'')},true);
  console.error('Franklin Assistant canonical loader failed',err);
};

const applyFranklinColorSystem=()=>{
  const b=document.body;if(!b)return;
  b.classList.add('franklin-color-system');
  const p=location.pathname.replace(/\/+$/,'/')||'/';
  const add=c=>b.classList.add(c);
  if(p==='/'||p==='/es/')add('franklin-page-home');
  if(p.startsWith('/assistant/')||p.startsWith('/es/asistente/'))add('franklin-page-assistant');
  if(p.startsWith('/directory/')||p.startsWith('/es/directorio/')||p.startsWith('/profiles/'))add('franklin-page-directory');
  if(p.startsWith('/community/')||p.startsWith('/es/comunidad/'))add('franklin-page-community');
  if(p.startsWith('/activities/')||p.startsWith('/today/')||p.startsWith('/es/actividades/')||p.startsWith('/es/hoy/'))add('franklin-page-activities');
  if(p.startsWith('/business-dashboard/')||p.startsWith('/es/negocios/'))add('franklin-page-business');
  if(p.startsWith('/membership-')||p.startsWith('/profile-studio/')||p.startsWith('/profile-access/')||p.startsWith('/profile-request/')||p.startsWith('/corrections/')||p.startsWith('/claim-profile/')||p.startsWith('/es/iniciar-membresia/'))add('franklin-page-membership');
  if(p.startsWith('/community-help-center/')||p.startsWith('/review-guidelines/')||p.startsWith('/es/centro-de-ayuda/'))add('franklin-page-help');
  if(p.startsWith('/get-it-done/')||p.startsWith('/es/hacerlo/'))add('franklin-page-tasks');

  // Navigation is neutral by default. Only the section that owns the current
  // route receives aria-current and the active Franklin treatment.
  const nav=document.querySelector('header nav');
  if(nav){
    nav.querySelectorAll('a[aria-current="page"]').forEach(a=>a.removeAttribute('aria-current'));
    let selector='';
    if(p.startsWith('/assistant/')||p.startsWith('/es/asistente/'))selector='a.franklin-nav-ask,a[href="/assistant/"],a[href="/#ask-navigator"]';
    else if(p.startsWith('/directory/')||p.startsWith('/profiles/')||p.startsWith('/es/directorio/'))selector='a.franklin-nav-find,a[href="/directory/"]';
    else if(p.startsWith('/get-it-done/')||p.startsWith('/es/hacerlo/'))selector='a.franklin-nav-tasks,a[href="/get-it-done/"]';
    else if(p.startsWith('/today/')||p.startsWith('/es/hoy/'))selector='a.franklin-nav-today,a[href="/today/"]';
    else if(p.startsWith('/activities/')||p.startsWith('/es/actividades/'))selector='a.franklin-nav-things,a[href="/activities/"]';
    else if(p.startsWith('/community/')||p.startsWith('/es/comunidad/'))selector='a.franklin-nav-community,a[href="/community/"]';
    else if(p.startsWith('/business-dashboard/')||p.startsWith('/membership-')||p.startsWith('/profile-studio/')||p.startsWith('/profile-access/')||p.startsWith('/profile-request/')||p.startsWith('/corrections/')||p.startsWith('/claim-profile/')||p.startsWith('/es/negocios/')||p.startsWith('/es/iniciar-membresia/'))selector='a.franklin-nav-priority-business,a[href="/business-dashboard/"]';
    else if(p.startsWith('/my-franklin/'))selector='a[href="/my-franklin/"]';
    else if(p.startsWith('/community-help-center/')||p.startsWith('/review-guidelines/')||p.startsWith('/es/centro-de-ayuda/'))selector='a[href="/community-help-center/"]';
    const current=selector?nav.querySelector(selector):null;
    if(current)current.setAttribute('aria-current','page');
  }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyFranklinColorSystem,{once:true});else applyFranklinColorSystem();

const loadScript=(src,key)=>new Promise((resolve,reject)=>{
  const sel=`script[data-${key}]`,old=document.querySelector(sel);
  if(old){if(old.dataset.loaded==='1')return resolve();old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}
  const s=document.createElement('script');s.src=src;s.defer=true;s.dataset[key.replace(/-([a-z])/g,(_,ch)=>ch.toUpperCase())]='1';
  s.addEventListener('load',()=>{s.dataset.loaded='1';resolve()},{once:true});s.addEventListener('error',reject,{once:true});document.head.append(s);
});
const normalizePrimaryNav=()=>{
  const nav=document.querySelector('header nav.hf34-nav');if(!nav)return;
  const es=location.pathname==='/es/'||location.pathname.startsWith('/es/');
  const routes=es?{
    assistant:'/es/asistente/',directory:'/es/directorio/',tasks:'/es/hacerlo/',today:'/es/hoy/',activities:'/es/actividades/',community:'/es/comunidad/',mine:'/es/mi-franklin/',business:'/es/negocios/',help:'/es/centro-de-ayuda/'
  }:{
    assistant:'/assistant/',directory:'/directory/',tasks:'/get-it-done/',today:'/today/',activities:'/activities/',community:'/community/',mine:'/my-franklin/',business:'/business-dashboard/',help:'/community-help-center/'
  };
  const labels=es?{
    ask:'Preguntar a Franklin',find:'Buscar local',tasks:'Resolver',today:'Hoy',things:'Qué hacer',community:'Comunidad',mine:'Mi Franklin',business:'Para negocios',help:'Centro de ayuda',more:'Más'
  }:{
    ask:'Ask Franklin',find:'Find Local',tasks:'Get It Done',today:'Today',things:'Things to Do',community:'Community',mine:'My Franklin',business:'For Business',help:'Help Center',more:'More'
  };
  const defs=[
    {key:'ask',label:labels.ask,path:routes.assistant,cls:'franklin-nav-ask',hide:0},
    {key:'find',label:labels.find,path:routes.directory,cls:'franklin-nav-find',hide:10},
    {key:'tasks',label:labels.tasks,path:routes.tasks,cls:'franklin-nav-tasks',hide:20},
    {key:'today',label:labels.today,path:routes.today,cls:'franklin-nav-today',hide:60},
    {key:'things',label:labels.things,path:routes.activities,cls:'franklin-nav-things',hide:50},
    {key:'community',label:labels.community,path:routes.community,cls:'franklin-nav-community',hide:70},
    {key:'mine',label:labels.mine,path:routes.mine,cls:'franklin-nav-mine',hide:80},
    {key:'business',label:labels.business,path:routes.business,cls:'franklin-nav-priority-business',hide:30},
    {key:'help',label:labels.help,path:routes.help,cls:'franklin-nav-help',hide:90}
  ];
  const top=d=>`<a class="franklin-nav-candidate ${d.cls}" data-nav-key="${d.key}" data-hide-priority="${d.hide}" href="${d.path}">${d.label}</a>`;
  const moreItem=d=>`<a class="franklin-nav-more-item" data-more-key="${d.key}" href="${d.path}" hidden>${d.label}</a>`;
  nav.innerHTML=defs.map(top).join('')+
    `<details class="hf34-nav-more franklin-nav-more" hidden><summary>${labels.more}</summary><div class="hf34-nav-more-menu">${defs.map(moreItem).join('')}</div></details>`;

  const currentPath=location.pathname.replace(/\/+$/,'/')||'/';
  nav.querySelectorAll('a').forEach(a=>{
    const target=new URL(a.href,location.href).pathname.replace(/\/+$/,'/')||'/';
    const active=target!=='/'&&(currentPath===target||currentPath.startsWith(target));
    if(active)a.setAttribute('aria-current','page');
  });

  const more=nav.querySelector('.franklin-nav-more');
  const tops=[...nav.querySelectorAll('.franklin-nav-candidate')];
  const moreItems=new Map([...nav.querySelectorAll('.franklin-nav-more-item')].map(a=>[a.dataset.moreKey,a]));
  const lowPriorityFirst=[...tops].sort((a,b)=>Number(b.dataset.hidePriority)-Number(a.dataset.hidePriority));
  let fitting=false,raf=0;
  const setHidden=(a,hidden)=>{a.hidden=hidden;a.setAttribute('aria-hidden',hidden?'true':'false')};
  const fits=()=>nav.scrollWidth<=nav.clientWidth+1;
  const txMore=n=>es?`Más opciones (${n})`:`More options (${n})`;
  const refit=()=>{
    if(fitting||!nav.isConnected)return;fitting=true;
    more.removeAttribute('open');
    tops.forEach(a=>setHidden(a,false));
    moreItems.forEach(a=>setHidden(a,true));
    more.hidden=true;
    nav.dataset.navOverflow='0';

    if(!fits()){
      more.hidden=false;
      for(const a of lowPriorityFirst){
        setHidden(a,true);
        const duplicate=moreItems.get(a.dataset.navKey);if(duplicate)setHidden(duplicate,false);
        if(fits())break;
      }
      if(!fits()){
        nav.dataset.navOverflow='1';
        setTimeout(()=>window.FranklinIssueMonitorR1308?.report?.('PRIMARY_NAV_OVERFLOW',{workflow:'PUBLIC_SITE',action:'adaptive-nav-fit',clientSignal:'OVERFLOW_AFTER_PRIORITY_COLLAPSE'}),1200);
      }
    }
    const hiddenCount=tops.filter(a=>a.hidden).length;
    if(hiddenCount===0)more.hidden=true;
    const summary=more.querySelector('summary');
    if(summary)summary.setAttribute('aria-label',hiddenCount?txMore(hiddenCount):labels.more);
    fitting=false;
  };
  const scheduleRefit=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(refit)};
  scheduleRefit();
  setTimeout(scheduleRefit,80);
  if(document.fonts?.ready)document.fonts.ready.then(scheduleRefit).catch(()=>{});
  if('ResizeObserver'in window)new ResizeObserver(scheduleRefit).observe(document.querySelector('header .top')||nav);
  else window.addEventListener('resize',scheduleRefit,{passive:true});

  document.addEventListener('click',e=>{if(more?.open&&!more.contains(e.target))more.removeAttribute('open')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&more?.open){more.removeAttribute('open');more.querySelector('summary')?.focus()}});
};
const installCommunityConnectorR1311=()=>{
  const path=location.pathname.replace(/\/+$/,'/')||'/';
  if(path!=='/'&&path!=='/es/')return;
  const es=path==='/es/';
  const hero=document.querySelector('.r24-home-hero');if(!hero||document.querySelector('.r1311-community-actions'))return;
  const eyebrow=hero.querySelector('.r24-hero-copy .eyebrow');
  const lead=hero.querySelector('.r24-hero-lead');
  if(eyebrow)eyebrow.textContent=es?'Franklin, conectado':'Franklin, connected';
  if(lead)lead.textContent=es?'Empiece con Franklin Assistant para obtener una respuesta local directa y luego conéctese con las personas, lugares, organizaciones, actividades y recursos que pueden ayudarle.':'Start with Franklin Assistant for a direct local answer, then move naturally into the people, places, organizations, activities and resources that can help.';
  const s=document.createElement('section');s.className='r1311-community-actions';s.setAttribute('aria-labelledby','r1311-community-heading');
  s.innerHTML=es
    ? '<div class="wrap"><div class="r1311-head"><div><div class="eyebrow">Su red comunitaria de Franklin</div><h2 id="r1311-community-heading">Pregunte primero. Luego conéctese con lo que necesita.</h2><p>Franklin Navigator reúne respuestas locales, información comunitaria actual, negocios, profesionales, organizaciones y próximos pasos prácticos en un solo lugar.</p></div></div><div class="r1311-action-grid"><a class="r1311-action" href="/es/hoy/"><strong>Hoy en Franklin</strong><span>Vea información local actual y novedades útiles.</span></a><a class="r1311-action" href="/es/directorio/"><strong>Buscar en Franklin</strong><span>Encuentre negocios, profesionales y organizaciones.</span></a><a class="r1311-action" href="/es/hacerlo/"><strong>Resolver tareas</strong><span>Avance en tareas locales cotidianas y próximos pasos.</span></a><a class="r1311-action" href="/es/actividades/"><strong>Actividades</strong><span>Explore actividades, deportes, aprendizaje y eventos locales.</span></a><a class="r1311-action" href="/es/comunidad/"><strong>Comunidad</strong><span>Descubra grupos, recursos y organizaciones locales.</span></a><a class="r1311-action" href="/es/mi-franklin/"><strong>Mi Franklin</strong><span>Guarde lugares y próximos pasos útiles para después.</span></a></div><p class="r1311-community-note">Los negocios, profesionales y organizaciones también pueden <a href="/claim-profile/">reclamar o corregir un perfil público gratis</a> y, de forma opcional, convertirse en <a href="/es/iniciar-membresia/">Miembros de la Comunidad de Franklin Navigator</a>.</p></div>'
    : '<div class="wrap"><div class="r1311-head"><div><div class="eyebrow">Your Franklin community network</div><h2 id="r1311-community-heading">Ask first. Then connect with what you need.</h2><p>Franklin Navigator brings local answers, current community information, businesses, professionals, organizations and practical next steps into one place.</p></div></div><div class="r1311-action-grid"><a class="r1311-action" href="/today/"><strong>Today in Franklin</strong><span>See current local items and useful updates.</span></a><a class="r1311-action" href="/directory/"><strong>Find Local</strong><span>Find businesses, professionals and organizations.</span></a><a class="r1311-action" href="/get-it-done/"><strong>Get It Done</strong><span>Work through everyday local tasks and next steps.</span></a><a class="r1311-action" href="/activities/"><strong>Things to Do</strong><span>Explore activities, sports, learning and local events.</span></a><a class="r1311-action" href="/community/"><strong>Community</strong><span>Discover local groups, resources and organizations.</span></a><a class="r1311-action" href="/my-franklin/"><strong>My Franklin</strong><span>Save useful places and next steps for later.</span></a></div><p class="r1311-community-note">Businesses, professionals and organizations can also <a href="/claim-profile/">claim or correct a public profile free</a> and optionally become a <a href="/membership-start/">Franklin Navigator Community Member</a>.</p></div>';
  hero.insertAdjacentElement('afterend',s);
  const business=document.querySelector('.r24-business-section');
  const copy=business?.querySelector('.r22-split>div:first-child');
  if(copy){
    const e=copy.querySelector('.eyebrow'),h=copy.querySelector('h2'),p=copy.querySelector('p'),actions=copy.querySelector('.actions');
    if(e)e.textContent=es?'Para negocios, profesionales y organizaciones de Franklin':'For Franklin businesses, professionals & organizations';
    if(h)h.textContent=es?'Participe en la comunidad de Franklin.':'Take part in the Franklin community.';
    if(p)p.textContent=es?'Encuentre o reclame su perfil público gratis, mantenga correctos los datos básicos y, de forma opcional, conviértase en Miembro de la Comunidad de Franklin Navigator para tener una presencia comunitaria más completa y herramientas adicionales.':'Find or claim your public profile free, keep factual information accurate, and optionally become a Franklin Navigator Community Member for a stronger community presence and additional member tools.';
    if(actions){actions.innerHTML=es?'<a class="button primary" href="/claim-profile/">Buscar o reclamar mi perfil</a><a class="button" href="/es/iniciar-membresia/">Membresía Comunitaria</a><a class="button" href="/member-profile-preview/">Vista previa del perfil</a>':'<a class="button primary" href="/claim-profile/">Find or claim my profile</a><a class="button" href="/membership-start/">Community Membership</a><a class="button" href="/member-profile-preview/">Preview member profile</a>'}
    if(!copy.querySelector('.r1311-accuracy-note')){const n=document.createElement('p');n.className='fine-print r1311-accuracy-note';n.textContent=es?'No se requiere pago para corregir información factual ni para mantener la precisión básica del perfil público.':'Payment is not required to correct factual information or maintain basic public profile accuracy.';copy.append(n)}
  }
  const CURRENT_RELEASE='FR-NAV1.30.46-HF3.13.28';
  const meta=document.querySelector('meta[name="franklin-release"]');if(meta)meta.content=CURRENT_RELEASE;
  document.documentElement.dataset.franklinRelease=CURRENT_RELEASE;
};
const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
ready(()=>{
  const body=document.body;
  if(!body)return;
  if(location.pathname.startsWith('/profiles/')){
    loadCss('/assets/r1330-profile.css?v=frnav1330','franklin-profile-r1330');
    loadCss('/assets/r1332-profile.css?v=frnav1332','franklin-profile-r1332');
    loadCss('/assets/r1333-profile.css?v=frnav1333','franklin-profile-r1333');
    loadScript('/assets/r1330-profile.js?v=frnav1330','franklin-profile-r1330')
      .then(()=>loadScript('/assets/r1332-profile.js?v=frnav1332','franklin-profile-r1332'))
      .then(()=>loadScript('/assets/r1332-member-offers.js?v=frnav1332','franklin-member-offers-r1332'))
      .then(()=>loadScript('/assets/r1333-paid-sponsored.js?v=frnav1333','franklin-paid-sponsored-r1333'))
      .catch(()=>{loadScript('/assets/r1332-profile.js?v=frnav1332','franklin-profile-r1332').catch(()=>{});loadScript('/assets/r1332-member-offers.js?v=frnav1332','franklin-member-offers-r1332').catch(()=>{});loadScript('/assets/r1333-paid-sponsored.js?v=frnav1333','franklin-paid-sponsored-r1333').catch(()=>{})});
  }
  if(location.pathname==='/directory/'||location.pathname==='/es/directorio/'){
    loadCss('/assets/r1333-sponsored.css?v=frnav1333','franklin-sponsored-r1333');
  }
  normalizePrimaryNav();
  installCommunityConnectorR1311();
  loadScript('/assets/franklin-site-monitor-r1308.js?v=frnav1308','franklin-site-monitor-r1308').catch(()=>{});
  // Franklin Assistant 2 is loaded directly by the existing Assistant entry pages. Legacy Assistant injection is intentionally retired.
  // R1297 fail-safe Franklin mark + favicon/install icon binding. The header uses the valid vector asset directly; if the request ever fails, the same mark is supplied as an inline data URI so a broken-image glyph is never shown.
  const markFallback="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22112%22%20height%3D%22112%22%20viewBox%3D%220%200%20112%20112%22%20role%3D%22img%22%20aria-label%3D%22Franklin%20Navigator%22%3E%3Crect%20width%3D%22112%22%20height%3D%22112%22%20rx%3D%2227%22%20fill%3D%22%2303454b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%225%22%20width%3D%22102%22%20height%3D%22102%22%20rx%3D%2223%22%20fill%3D%22none%22%20stroke%3D%22%23d8e7e5%22%20stroke-opacity%3D%22.3%22%2F%3E%3Cpath%20d%3D%22M30%2029h54v15H48v15h30v15H48v27H30z%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22m82%2055%2020%2010.5L82%2076l5.9-10.5z%22%20fill%3D%22%23c5943a%22%2F%3E%3C%2Fsvg%3E";
  document.querySelectorAll('header .brand img').forEach(img=>{img.alt='Franklin Navigator';img.width=38;img.height=38;img.onerror=()=>{if(img.dataset.franklinMarkFallback==='1')return;img.dataset.franklinMarkFallback='1';img.src=markFallback};img.src='/assets/franklin-mark.svg?v=frnav1298'});
  const icon=(rel,href,sizes,type)=>{let l=document.querySelector(`link[rel="${rel}"]`);if(!l){l=document.createElement('link');l.rel=rel;document.head.append(l)}l.href=href;if(sizes)l.sizes=sizes;if(type)l.type=type};
  icon('icon','/assets/favicon.svg?v=frnav1298','any','image/svg+xml');icon('shortcut icon','/favicon.ico?v=frnav1298');icon('apple-touch-icon','/assets/franklin-icon-192.png?v=frnav1298','192x192','image/png');
  let mf=document.querySelector('link[rel="manifest"]');if(!mf){mf=document.createElement('link');mf.rel='manifest';document.head.append(mf)}mf.href='/site.webmanifest?v=frnav1298';

  // Homepage: suppress an empty saved-checklist box without touching real saved content.
  if(body.classList.contains('hf36-home')){
    const clean=()=>document.querySelectorAll('.navigator-bot .empty-state,.navigator-bot [class*="empty"]').forEach(n=>{if(/No detailed Assistant checklists saved yet|No Assistant/i.test(n.textContent||''))n.dataset.hf36HomeEmpty='1'});
    clean();new MutationObserver(clean).observe(document.querySelector('.navigator-bot')||body,{childList:true,subtree:true});
  }
  // Get It Done: default to six popular tasks; search/category filtering reveals the full matching set.
  if(body.classList.contains('hf36-get-it-done')){
    const search=document.querySelector('[data-task-search]');
    const show=document.querySelector('[data-hf36-show-tasks]');
    const reveal=()=>body.classList.add('hf36-show-all-tasks');
    show?.addEventListener('click',()=>{reveal();show.hidden=true});
    search?.addEventListener('input',()=>{if(search.value.trim())reveal()});
    document.querySelector('[data-task-categories]')?.addEventListener('click',e=>{if(e.target.closest('button'))reveal()});
  }
  // Activities: show a useful first set; filters reveal matching records without deleting data.
  if(body.classList.contains('hf36-activities')){
    const show=document.querySelector('[data-hf36-show-activities]');
    const current=document.querySelector('[data-hf36-show-current]');
    show?.addEventListener('click',()=>{body.classList.add('hf36-show-all-activities');show.hidden=true});
    current?.addEventListener('click',()=>{body.classList.add('hf36-show-current');current.hidden=true});
    const controls=document.querySelector('.explorer-controls');
    controls?.addEventListener('input',()=>body.classList.add('hf36-show-all-activities'));
    controls?.addEventListener('change',()=>body.classList.add('hf36-show-all-activities'));
  }
  // My Franklin: consolidate empty states and only expand when real saved content exists.
  if(body.classList.contains('hf36-my-franklin')){
    const empty=document.querySelector('[data-hf36-saved-empty]');
    const containers=[document.querySelector('[data-saved-profiles]'),document.querySelector('[data-r34-saved-plans]'),document.querySelector('[data-r38-assistant-plans]')].filter(Boolean);
    const update=()=>{
      let any=false;
      containers.forEach(c=>{const meaningful=[...c.children].some(ch=>!ch.classList.contains('empty-state'));c.closest('.hf36-saved-block')?.classList.toggle('hf36-has-saved',meaningful);if(meaningful)any=true});
      if(empty)empty.hidden=any;
      const start=document.querySelector('[data-my-franklin-output]');
      if(start){const t=(start.textContent||'').trim();start.classList.toggle('hf36-empty-starting',/Choose topics below|Choose what matters|Elija/i.test(t))}
    };
    update();containers.forEach(c=>new MutationObserver(update).observe(c,{childList:true,subtree:true}));
  }
  // Help Center: empty output should not take half a screen.
  if(body.classList.contains('hf36-help')){
    const out=document.querySelector('[data-community-help-output]');const aside=document.querySelector('.hf36-help-plan-output');
    const update=()=>{if(!out||!aside)return;const t=(out.textContent||'').trim();aside.classList.toggle('hf36-empty-plan',/Choose one or more broad topics|Elija uno o más/i.test(t)||!t)};
    update();if(out)new MutationObserver(update).observe(out,{childList:true,subtree:true,characterData:true});
  }
});
})();
