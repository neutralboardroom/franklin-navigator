'use strict';
(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const path=()=>location.pathname;
  const isEs=()=>document.documentElement.lang==='es'||path().startsWith('/es/');
  const tx=(en,es)=>isEs()?es:en;

  function nativeText(el,en,es){if(!el)return;el.dataset.hf32En=en;el.dataset.hf32Es=es;el.setAttribute('data-franklin-native-locale','');el.textContent=tx(en,es)}
  function syncNative(){qa('[data-hf32-en]').forEach(el=>el.textContent=tx(el.dataset.hf32En||'',el.dataset.hf32Es||''));qa('[data-hf32-summary-en]').forEach(d=>{const s=q(':scope>summary',d);if(s)s.textContent=tx(d.dataset.hf32SummaryEn||'',d.dataset.hf32SummaryEs||'')})}

  function groupForCurrent(){
    const p=path();
    if(/^\/(?:es\/)?(?:activities|sports|learning|arts-entertainment|outdoors|teams-clubs|school-activities|youth-family)(?:\/|$)/.test(p))return 'activities';
    if(/^\/(?:es\/)?community(?:\/|$)/.test(p))return 'community';
    if(/^\/(?:es\/)?(?:my-franklin|mi-franklin)(?:\/|$)/.test(p))return 'my';
    if(/^\/(?:es\/)?(?:business-dashboard|negocios|membership|member-|claim-profile|corrections|profile-studio|community-member-display|free-membership|founding-member-planner|work-with-franklin-navigator)/.test(p))return 'business';
    if(/^\/(?:es\/)?(?:community-help-center|centro-de-ayuda|help|support)/.test(p))return 'help';
    return '';
  }

  function universalNav(){
    const nav=q('header .nav');if(!nav)return;
    const es=isEs();
    const core=[
      [es?'/es/#ask-navigator':'/#ask-navigator',es?'Preguntar a Franklin Assistant':'Ask Franklin Assistant','ask'],
      [es?'/es/hoy/':'/today/',es?'Hoy':'Today','today'],
      [es?'/es/hacerlo/':'/get-it-done/',es?'Resolver tareas':'Get It Done','tasks'],
      [es?'/es/directorio/':'/directory/',es?'Buscar en Franklin':'Find Local','directory']
    ];
    const more=[
      [es?'/es/actividades/':'/activities/',es?'Actividades':'Activities','activities'],
      [es?'/es/comunidad/':'/community/',es?'Comunidad':'Community','community'],
      [es?'/es/mi-franklin/':'/my-franklin/',es?'Mi Franklin':'My Franklin','my'],
      [es?'/es/negocios/':'/business-dashboard/',es?'Para negocios':'For businesses','business'],
      [es?'/es/centro-de-ayuda/':'/community-help-center/',es?'Centro de ayuda':'Help Center','help']
    ];
    const p=path(),group=groupForCurrent();
    const make=([href,label,key])=>{const a=document.createElement('a');a.href=href;a.textContent=label;a.dataset.hf32NavKey=key;const u=new URL(href,location.href);if((key==='today'&&/\/(?:es\/hoy|today)\/$/.test(p))||(key==='tasks'&&/\/(?:es\/hacerlo|get-it-done)\/$/.test(p))||(key==='directory'&&(p==='/directory/'||p==='/es/directorio/'||/^\/profiles\//.test(p)))||(group===key))a.setAttribute('aria-current','page');return a};
    const coreLinks=core.map(make),moreLinks=more.map(make);
    const details=document.createElement('details');details.className='hf32-nav-more';details.setAttribute('data-franklin-native-locale','');
    const summary=document.createElement('summary');summary.textContent=es?'Más':'More';
    const menu=document.createElement('div');menu.className='hf32-nav-more-menu';moreLinks.forEach(a=>menu.append(a));details.append(summary,menu);
    nav.replaceChildren(...coreLinks,details);nav.classList.add('hf32-universal-nav');nav.dataset.hf32Ready='1';
    const close=()=>{details.open=false;nav.classList.remove('is-open');const toggle=q('.menu-toggle',nav.parentElement);toggle?.setAttribute('aria-expanded','false')};
    moreLinks.concat(coreLinks).forEach(a=>a.addEventListener('click',close));
    document.addEventListener('click',e=>{if(details.open&&!details.contains(e.target))details.open=false},{capture:false});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&details.open){details.open=false;summary.focus()}});
  }

  function simplifyFooter(){
    const nav=q('footer .footer-links');if(!nav)return;
    const es=isEs();
    const items=es?[
      ['/es/centro-de-ayuda/','Centro de ayuda'],['/es/negocios/','Para negocios'],['/membership-start/','Membresía'],['/privacy/','Privacidad'],['/terms/','Términos'],['/accessibility/','Accesibilidad']
    ]:[
      ['/community-help-center/','Help Center'],['/business-dashboard/','For businesses'],['/membership-start/','Membership'],['/privacy/','Privacy'],['/terms/','Terms'],['/accessibility/','Accessibility']
    ];
    nav.replaceChildren(...items.map(([href,label])=>{const a=document.createElement('a');a.href=href;a.textContent=label;return a}));
  }

  function memberPreview(){
    if(path()!=='/member-profile-preview/')return;
    document.body.classList.add('hf32-member-preview');
    const hero=q('.r29-hero'),h1=q('h1',hero),lead=q('.r29-lead',hero),eyebrow=q('.eyebrow',hero),actions=q('.actions',hero);
    nativeText(eyebrow,'Your Franklin profile','Su perfil de Franklin');
    nativeText(h1,'Manage or improve your Franklin profile.','Administre o mejore su perfil de Franklin.');
    nativeText(lead,'Find your existing profile, correct it for free, request removal for free, or see what Community Membership adds.','Encuentre su perfil actual, corríjalo gratis, solicite retirarlo gratis o vea lo que añade la Membresía Comunitaria.');
    q('.r29-local-card',hero)?.remove();
    if(actions){
      const find=q('a',actions)||document.createElement('a');find.href='/claim-profile/';find.className='button primary';nativeText(find,'Find my profile','Buscar mi perfil');
      const missing=document.createElement('a');missing.href='/claim-profile/?source=member-profile-preview&missing=1';missing.className='r41-secondary-action button';nativeText(missing,"I don't see my business","No encuentro mi negocio");
      actions.replaceChildren(find,missing);
    }
    const form=q('[data-r28-preview-form]');if(form){
      nativeText(q('h2',form),'Preview your profile','Vista previa de su perfil');
      const city=qa('label',form).find(l=>/Actual city or location/i.test(l.textContent||''));
      if(city&&!q('.hf32-field-help',city)){const help=document.createElement('span');help.className='hf32-field-help';nativeText(help,"Use the business's actual city or service area.",'Use la ciudad real o el área de servicio del negocio.');city.append(help)}
    }
    const plan=q('.r29-plan-grid')?.closest('.section');if(plan){
      plan.classList.add('hf32-membership-section');q('.r29-one-action',plan)?.remove();
      const card=q('.r29-plan',plan);if(card&&!q('.hf32-join',card)){
        const button=document.createElement('a');button.href='/membership-start/';button.className='button primary hf32-join';nativeText(button,'Join for $35/year','Unirse por $35/año');card.append(button);
      }
    }
    const free=qa('main>.section').find(s=>/Free profile controls remain separate|Controles.*perfil/i.test(s.textContent||''));if(free){
      free.classList.add('hf32-free-control');const left=q('.r22-split>div:first-child',free);if(left){nativeText(q('h2',left),'Need to correct or remove a profile?','¿Necesita corregir o retirar un perfil?');nativeText(q('p',left),'Factual corrections and removal from public view are free. Membership is not required.','Las correcciones de datos y el retiro de la vista pública son gratuitos. No se requiere membresía.');const a=q('.actions',left);if(a){const one=document.createElement('a');one.href='/corrections/';one.className='button';nativeText(one,'Correct or remove a profile','Corregir o retirar un perfil');a.replaceChildren(one)}}}
    const contact=qa('main>.section').find(s=>q('.r32-contact-recheck',s));if(contact){
      const box=q('.r32-contact-recheck',contact);const details=document.createElement('details');details.className='hf32-policy-details';details.dataset.hf32SummaryEn='About profile information';details.dataset.hf32SummaryEs='Sobre la información del perfil';details.setAttribute('data-franklin-native-locale','');const summary=document.createElement('summary');summary.textContent=tx(details.dataset.hf32SummaryEn,details.dataset.hf32SummaryEs);const body=document.createElement('div');const p=q('p',box);if(p)body.append(p);details.append(summary,body);contact.replaceChildren(document.createElement('div'));contact.firstElementChild.className='wrap';contact.firstElementChild.append(details)}
    qa('main>.section').find(s=>/Turn the preview into a first-value checklist|Convierta.*vista previa/i.test(s.textContent||''))?.remove();
  }

  function refineToday(){
    if(!['/today/','/es/hoy/'].includes(path()))return;document.body.classList.add('hf32-today');
    const hero=q('main>.r22-hero');if(hero){hero.classList.add('hf32-today-hero');nativeText(q('.eyebrow',hero),'Franklin today','Franklin hoy');nativeText(q('h1',hero),'Today in Franklin','Hoy en Franklin');nativeText(q('p',hero),'Current events, notices and local information that may affect your day.','Eventos, avisos e información local actual que pueden afectar su día.');q('.actions',hero)?.remove()}
    q('[data-today-grid]')?.closest('.section')?.classList.add('hf32-today-current');
    const bridge=qa('main>.section').find(s=>/Keep exploring after today|Seguir explorando después de hoy/i.test(s.textContent||''));if(bridge){nativeText(q('.eyebrow',bridge),'More around Franklin','Más en Franklin');nativeText(q('h2',bridge),'Looking for something that happens regularly?','¿Busca algo que ocurra con regularidad?');nativeText(q(':scope>.wrap>p',bridge),'Explore Franklin sports, classes, arts and outdoor activities.','Explore deportes, clases, arte y actividades al aire libre en Franklin.');const a=q('.actions',bridge);if(a){const first=q('a',a);if(first){first.href='/activities/';nativeText(first,'Explore activities','Explorar actividades');first.className='button primary';a.replaceChildren(first)}}}
    const trust=q('.r22-trust-strip');if(trust){const section=trust.closest('.section'),details=document.createElement('details');details.className='hf32-today-method';details.dataset.hf32SummaryEn='How we keep Today current';details.dataset.hf32SummaryEs='Cómo mantenemos Hoy actualizado';details.setAttribute('data-franklin-native-locale','');const summary=document.createElement('summary');summary.textContent=tx(details.dataset.hf32SummaryEn,details.dataset.hf32SummaryEs);const body=document.createElement('div');nativeText(body,'Times, capacity and availability can change. The linked organizer or official source has the latest information.','Los horarios, cupos y disponibilidad pueden cambiar. El organizador o la fuente oficial enlazada tiene la información más reciente.');details.append(summary,body);section.replaceChildren(document.createElement('div'));section.firstElementChild.className='wrap';section.firstElementChild.append(details)}
  }

  function refineTasks(){
    if(!['/get-it-done/','/es/hacerlo/'].includes(path()))return;document.body.classList.add('hf32-tasks');
    const hero=q('main>.r22-hero');if(hero){nativeText(q('.eyebrow',hero),'Get it done','Resolver tareas');nativeText(q('p',hero),'Describe what you need or choose a common task. Your checklist can stay private on this device.','Describa lo que necesita o elija una tarea común. Su lista puede permanecer privada en este dispositivo.');const actions=q('.r22-task-search .actions',hero);if(actions){const primary=q('.primary',actions)||q('a',actions);if(primary){primary.href='/#ask-navigator';nativeText(primary,'Find my next step','Encontrar mi siguiente paso');primary.className='button primary';actions.replaceChildren(primary)}}}
    const grid=q('[data-task-grid]');if(grid){const cards=qa(':scope>.task-card',grid);cards.slice(6).forEach(c=>c.classList.add('hf32-secondary-task'));if(cards.length>6&&!q('.hf32-task-see-all',grid.parentElement)){const b=document.createElement('button');b.type='button';b.className='button hf32-task-see-all';nativeText(b,'See all tasks','Ver todas las tareas');b.addEventListener('click',()=>{document.body.classList.toggle('hf32-show-all-tasks');nativeText(b,document.body.classList.contains('hf32-show-all-tasks')?'Show common tasks':'See all tasks',document.body.classList.contains('hf32-show-all-tasks')?'Mostrar tareas comunes':'Ver todas las tareas')});grid.after(b)}
      const search=q('[data-task-search]');search?.addEventListener('input',()=>document.body.classList.toggle('hf32-task-filtering',Boolean(search.value.trim())));const cat=q('.hf31-task-category-select select');cat?.addEventListener('change',()=>document.body.classList.toggle('hf32-task-filtering',cat.value&&cat.value!=='All'))}
    const how=qa('main>.section').find(s=>/How tasks work|Cómo funcionan las tareas/i.test(s.textContent||''));if(how){nativeText(q('p',how),'Understand the task, prepare what you need, complete it at the right place, and know what comes next.','Comprenda la tarea, prepare lo necesario, complétela en el lugar correcto y sepa qué sigue.');const actions=q('.actions',how);if(actions){const a=document.createElement('a');a.href='/#ask-navigator';a.className='button';nativeText(a,'Need help with more than one task? Ask Franklin Assistant.','¿Necesita ayuda con más de una tarea? Pregunte a Franklin Assistant.');actions.replaceChildren(a)}}
  }

  function refineDirectory(){
    if(!['/directory/','/es/directorio/'].includes(path()))return;document.body.classList.add('hf32-directory');
    const hero=q('main>.r22-hero');if(hero){hero.classList.add('hf32-directory-hero');nativeText(q('h1',hero),'Find local businesses, services and organizations.','Encuentre negocios, servicios y organizaciones locales.');nativeText(q('p',hero),'Search Franklin-area businesses, services, professionals and organizations by name, category or place.','Busque negocios, servicios, profesionales y organizaciones del área de Franklin por nombre, categoría o lugar.')}
    q('[data-franklin-discovery]')?.classList.add('hf32-directory-root');
    const root=q('[data-franklin-discovery]');if(root){const update=()=>{const search=q('[data-dir-search]',root),cat=q('[data-dir-category]',root);document.body.classList.toggle('hf32-directory-has-query',Boolean(search?.value.trim()||cat?.value))};root.addEventListener('input',update);root.addEventListener('change',update);update()}
  }

  function refineSports(){
    if(!['/sports/','/es/deportes/'].includes(path()))return;document.body.classList.add('hf32-sports');
    const hero=q('.explorer-hero');if(hero){nativeText(q('.explorer-kicker',hero),'Sports in Franklin','Deportes en Franklin');nativeText(q('h1',hero),'Find sports in Franklin','Encuentre deportes en Franklin');nativeText(q('p',hero),'Search or choose a sport to see relevant local programs, leagues, lessons and places to play.','Busque o elija un deporte para ver programas, ligas, clases y lugares locales donde jugar.');const a=q('.actions a[href="#finder"]',hero);if(a)nativeText(a,'Find sports','Buscar deportes')}
    const coverage=q('.hf31-explorer-coverage');if(coverage){const wrap=q('.wrap',coverage);if(wrap){const details=document.createElement('details');details.className='hf32-sports-method';details.dataset.hf32SummaryEn='How listings are chosen';details.dataset.hf32SummaryEs='Cómo se eligen los listados';details.setAttribute('data-franklin-native-locale','');const summary=document.createElement('summary');summary.textContent=tx(details.dataset.hf32SummaryEn,details.dataset.hf32SummaryEs);const body=document.createElement('div');while(wrap.firstChild)body.append(wrap.firstChild);details.append(summary,body);wrap.append(details)}}
  }

  function genericCleanup(){
    document.body.classList.add('hf32-site-cleanup');
    qa('a,button,summary').forEach(el=>{const t=(el.textContent||'').trim();if(t==='More ...'||t==='More…')el.textContent=tx('More options','Más opciones');if(t==='More links ...'||t==='More links…')el.textContent=tx('More links','Más enlaces')});
  }

  function init(){genericCleanup();universalNav();simplifyFooter();memberPreview();refineToday();refineTasks();refineDirectory();refineSports();syncNative()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
  window.addEventListener('load',()=>setTimeout(init,120),{once:true});
  window.addEventListener('franklinlanguagechange',()=>setTimeout(()=>{universalNav();simplifyFooter();syncNative()},0));
})();
