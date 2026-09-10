'use strict';
(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const p=()=>location.pathname;
  const isEs=()=>document.documentElement.lang==='es'||p().startsWith('/es/');
  const tx=(en,es)=>isEs()?es:en;
  const PROFILE_RE=/^\/profiles\/[^/]+\/$/;
  const HOME_RE=/^(?:\/|\/es\/)$/;
  const TODAY_RE=/^(?:\/today\/|\/es\/hoy\/)$/;
  const TASK_RE=/^(?:\/get-it-done\/|\/es\/hacerlo\/)$/;
  const DIR_RE=/^(?:\/directory\/|\/es\/directorio\/)$/;
  const SPORTS_RE=/^(?:\/sports(?:\/[^/]+)?\/|\/es\/deportes(?:\/[^/]+)?\/)$/;
  const SAFETY_RE=/\b(?:911|988|emergency|urgent|crisis|suicide|danger|violence|emergencia|urgente|crisis|suicidio|peligro|violencia)\b/i;
  const TIME_ZONE='America/Chicago';

  function ensureCss(){
    if(q('link[data-hf32-public]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/hf32-public.css';link.dataset.hf32Public='1';document.head.append(link);
  }
  function markNative(el,en,es){
    if(!el)return;el.dataset.hf32En=en;el.dataset.hf32Es=es;el.setAttribute('data-franklin-native-locale','');el.textContent=tx(en,es);
  }
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
  function canonicalItems(){
    return isEs()?[
      ['/es/#ask-navigator','Preguntar a Franklin Assistant','core'],['/es/hoy/','Hoy','core'],['/es/hacerlo/','Resolver tareas','core'],['/es/directorio/','Buscar en Franklin','core'],['/community/','Comunidad','more'],['/es/mi-franklin/','Mi Franklin','more'],['/es/negocios/','Negocios','more']
    ]:[
      ['/#ask-navigator','Ask Franklin Assistant','core'],['/today/','Today','core'],['/get-it-done/','Get It Done','core'],['/directory/','Find Local','core'],['/community/','Community','more'],['/my-franklin/','My Franklin','more'],['/business-dashboard/','For businesses','more']
    ];
  }
  function canonicalHeader(){
    const nav=q('header .nav');if(!nav)return;
    const frag=document.createDocumentFragment(),moreItems=[];
    canonicalItems().forEach(([href,label,kind])=>{
      const a=el('a','',label);a.href=href;a.setAttribute('data-franklin-native-locale','');
      const u=new URL(href,location.origin);
      if(!u.hash&&location.pathname===u.pathname)a.setAttribute('aria-current','page');
      if(kind==='core')frag.append(a);else moreItems.push(a);
    });
    if(moreItems.length){
      const d=el('details','r41-nav-more hf32-header-more');const s=el('summary','',tx('More','Más'));s.setAttribute('data-franklin-native-locale','');const m=el('div','r41-nav-more-menu');moreItems.forEach(a=>m.append(a));d.append(s,m);frag.append(d);
      d.addEventListener('toggle',()=>{if(d.open)qa('details[open]').filter(x=>x!==d&&x.matches('.hf32-header-more,.r41-nav-more')).forEach(x=>x.open=false)});
    }
    nav.replaceChildren(frag);nav.dataset.r41Ready='1';nav.dataset.hf32Ready='1';
  }
  function integrateLanguage(){
    const bar=q('.r37-language-switch'),top=q('header .top');if(bar&&top&&!top.contains(bar))top.append(bar);
  }
  function syncApprovedLabels(root=document){
    qa('[data-hf32-en]',root).forEach(n=>n.textContent=tx(n.dataset.hf32En||'',n.dataset.hf32Es||''));
    qa('summary',root).forEach(s=>{
      if(s.closest('header .nav'))return;
      const t=s.textContent.trim();
      if(/^More(?:\s+(?:tools|contact options|links))?\s*(?:\.{2,3}|…)?$/i.test(t))markNative(s,/links/i.test(t)?'More links':'More options',/links/i.test(t)?'Más enlaces':'Más opciones');
      if(/^Official Franklin sources\s*\+?$/i.test(t))markNative(s,'Official sources','Fuentes oficiales');
    });
  }
  function closeDisclosures(){
    if(document.documentElement.dataset.hf32Dismiss==='1')return;document.documentElement.dataset.hf32Dismiss='1';
    document.addEventListener('click',e=>qa('details.hf32-popover[open],details.hf32-header-more[open]').forEach(d=>{if(!d.contains(e.target))d.open=false}));
    document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const d=q('details.hf32-popover[open],details.hf32-header-more[open]');if(d){d.open=false;q(':scope>summary',d)?.focus()}});
  }
  function sourceDatePresentation(root=document){
    const protectedDetail=node=>Boolean(node.closest?.('details,#sources,.hf32-source-details'));
    qa('.profile-currentness',root).forEach(n=>{n.hidden=true;n.classList.add('hf32-source-date-hidden')});
    qa('p,span,div,li',root).forEach(n=>{
      if(protectedDetail(n)||n.children.length>4)return;
      let t=n.textContent.trim();if(!t)return;
      if(/^(?:Source date|Fecha de la fuente|Last checked|Última verificación)\s*:?\s*/i.test(t)){n.hidden=true;n.classList.add('hf32-source-date-hidden');return}
      if(/^(?:Information reviewed|Información revisada)\s+[A-ZÁÉÍÓÚa-záéíóú]+\s+\d{1,2},?\s+20\d{2}$/i.test(t)){n.hidden=true;n.classList.add('hf32-source-date-hidden');return}
      const replaced=t
        .replace(/^(?:Checked|Revisado)\s*:?\s*20\d{2}-\d{2}-\d{2}\.\s*/i,'')
        .replace(/^(?:Checked|Revisado)\s*:?\s*[A-ZÁÉÍÓÚa-záéíóú]+\s+\d{1,2},?\s+20\d{2}\.\s*/i,'');
      if(replaced!==t&&replaced.trim())n.textContent=replaced.trim();
    });
  }
  function clearEllipsisLabels(root=document){
    qa('summary,button,a',root).forEach(n=>{
      if(n.closest('script,style,header .nav'))return;const t=n.textContent.trim();
      if(/^More\s*(?:\.{2,3}|…)?$/i.test(t))markNative(n,'More options','Más opciones');
      if(/^More tools\s*(?:\.{2,3}|…)?$/i.test(t))markNative(n,'More options','Más opciones');
      if(/^More links\s*(?:\.{2,3}|…)?$/i.test(t))markNative(n,'More links','Más enlaces');
    });
  }
  function homepage(){
    if(!HOME_RE.test(p()))return;document.body.classList.add('hf32-home');
    const around=q('.r24-around');if(around){const info=q('.r22-section-head p',around);if(info)markNative(info,'Dates, times and availability can change. Check current details before you go.','Las fechas, los horarios y la disponibilidad pueden cambiar. Confirme los detalles antes de ir.')}
    const history=q('.r22-history');if(history){history.classList.add('hf32-history');const h=q('h2',history);if(h)markNative(h,'Then & Now','Antes y ahora');const figs=qa('.r22-history-grid figure',history);if(figs.length>=3){const fig=figs[figs.length-1],img=q('img',fig),cap=q('figcaption',fig);if(img){img.src='/assets/franklin-photos/skyline.webp';img.alt=tx('Franklin skyline in 2023','Vista de Franklin en 2023')}if(cap)markNative(cap,'Franklin skyline · 2023','Vista de Franklin · 2023')}}
    const activities=qa('main section').find(s=>q('a[href="/learning/"]',s)&&q('a[href="/sports/"]',s)&&q('a[href="/outdoors/"]',s));
    if(activities)qa('p',activities).forEach(n=>{if(/all on this device/i.test(n.textContent))n.textContent=n.textContent.replace(/—?all on this device\.?/i,'').trim()});
    const discovery=qa('main section').find(s=>q('a[href="/directory/"]',s)&&/Local discovery/i.test(s.textContent));
    if(discovery){const paras=qa('p',discovery);if(paras[0])markNative(paras[0],'Search Franklin businesses, organizations and services by name, category or place. Open a profile for contact information, websites and useful details.','Busque negocios, organizaciones y servicios de Franklin por nombre, categoría o lugar. Abra un perfil para ver información de contacto, sitios web y detalles útiles.');const a=q('a[href="/directory/"]',discovery);if(a)markNative(a,'Search Franklin','Buscar en Franklin')}
    const biz=q('.r24-business-section')||qa('main section').find(s=>/Franklin businesses and organizations/i.test(s.textContent));
    if(biz){const h=q('h2',biz),para=q('p',biz),actions=q('.actions',biz);if(h)markNative(h,'Grow your visibility in the Franklin community.','Aumente su visibilidad en la comunidad de Franklin.');if(para)markNative(para,'Strengthen your public profile, show useful business details, and use local growth tools designed for Franklin.','Mejore su perfil público, muestre información útil de su negocio y use herramientas locales de crecimiento diseñadas para Franklin.');if(actions){const member=el('a','button primary',tx('See membership options','Ver opciones de membresía'));member.href='/membership-start/';member.setAttribute('data-franklin-native-locale','');const manage=el('a','button',tx('Find or manage my profile','Buscar o administrar mi perfil'));manage.href='/claim-profile/';manage.setAttribute('data-franklin-native-locale','');actions.replaceChildren(member,manage);actions.dataset.r41Ready='1'}}
    prefillAssistantFromTask();
  }
  function prefillAssistantFromTask(){
    let value='';try{value=sessionStorage.getItem('hf32AssistantNeed')||'';sessionStorage.removeItem('hf32AssistantNeed')}catch{}
    if(!value)return;const input=q('[data-navigator-input]'),form=input?.closest('form');if(!input)return;input.value=value;input.focus();setTimeout(()=>{try{form?.requestSubmit()}catch{}},120);
  }
  function dateKey(ms){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(ms));const get=t=>parts.find(x=>x.type===t)?.value||'';return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function formatEventTime(ms){return new Intl.DateTimeFormat(isEs()?'es-US':'en-US',{timeZone:TIME_ZONE,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(ms))}
  function cleanLocation(text){return String(text||'').replace(/\s+—\s+(?:confirm|confirme).*$/i,'').trim()}
  function eventGroup(card,now){
    const start=Date.parse(card.dataset.eventStart||''),end=Date.parse(card.dataset.eventEnd||'');if(Number.isFinite(start)&&Number.isFinite(end)&&start<=now&&end>=now)return 'today';
    if(!Number.isFinite(start))return 'coming';const today=dateKey(now),tomorrow=dateKey(now+86400000),key=dateKey(start);if(key===today)return 'today';if(key===tomorrow)return 'tomorrow';return 'coming';
  }
  function buildTodayGroups(grid){
    if(!grid||grid.dataset.hf32Grouped==='1')return;const cards=qa('.today-card',grid);if(!cards.length)return;grid.dataset.hf32Grouped='1';grid.classList.add('hf32-today-groups');
    const now=Date.now(),defs=[['today','Today','Hoy'],['tomorrow','Tomorrow','Mañana'],['coming','Coming up','Próximamente']],groups={};
    defs.forEach(([key,en,es])=>{const section=el('section','hf32-today-group');section.dataset.hf32Group=key;const h=el('h3','hf32-today-group-title');markNative(h,en,es);const inner=el('div','hf32-today-group-grid');section.append(h,inner);groups[key]={section,inner};grid.append(section)});
    cards.forEach(card=>groups[eventGroup(card,now)].inner.append(card));
    const update=()=>Object.values(groups).forEach(({section,inner})=>{const next=!qa('.today-card',inner).some(c=>!c.hidden);if(section.hidden!==next)section.hidden=next});update();
    new MutationObserver(update).observe(grid,{subtree:true,attributes:true,attributeFilter:['hidden']});
  }
  function today(){
    if(!TODAY_RE.test(p()))return;document.body.classList.add('hf32-today');const hero=q('main>.r22-hero');if(hero){q('.eyebrow',hero)?.remove();q('.actions',hero)?.remove();const para=q('p',hero);if(para)markNative(para,'Events, notices and openings that may matter today and in the days ahead.','Eventos, avisos y aperturas que pueden ser importantes hoy y en los próximos días.')}
    const grid=q('[data-today-grid]');if(grid){qa('.today-card',grid).forEach(card=>{if(card.dataset.hf32Ready==='1')return;card.dataset.hf32Ready='1';const eyebrow=q('.eyebrow',card);if(eyebrow)eyebrow.textContent=eyebrow.textContent.replace(/\s*·\s*(?:Confirm before going|Confirme antes de ir)/i,'').trim();const h=q('h3',card),loc=q(':scope>p:not(.fine-print)',card);const start=Date.parse(card.dataset.eventStart||''),end=Date.parse(card.dataset.eventEnd||'');if(h&&Number.isFinite(start)){const meta=el('div','hf32-event-meta');let when=formatEventTime(start);if(Number.isFinite(end)&&start<Date.now()&&end>Date.now())when=tx(`Through ${formatEventTime(end)}`,`Hasta ${formatEventTime(end)}`);const place=cleanLocation(loc?.textContent||'');markNative(meta,place?`${when} · ${place}`:when,place?`${when} · ${place}`:when);h.before(meta)}if(loc)loc.hidden=true;const fine=q(':scope>p.fine-print',card);if(fine){const first=(fine.textContent.match(/^[^.?!]+[.?!]/)||[])[0];if(first&&first.length>20)fine.textContent=first.trim()}const src=q('.r22-inline-actions a',card);if(src)markNative(src,'Check current details ↗','Confirmar detalles actuales ↗');const remind=q('[data-r22-remind]',card);if(remind)markNative(remind,'☆ Save / remind','☆ Guardar / recordar')});buildTodayGroups(grid)}
    const explore=qa('main>.section').find(s=>/Keep exploring after today|Seguir explorando después de hoy/i.test(s.textContent||''));if(explore){const eye=q('.eyebrow',explore),h=q('h2',explore),para=q('p',explore),actions=q('.actions',explore);if(eye)markNative(eye,'Explore more','Explore más');if(h)markNative(h,'Looking for something that happens regularly?','¿Busca algo que ocurra regularmente?');if(para)markNative(para,'Explore Franklin sports, classes, arts and outdoor activities.','Explore deportes, clases, arte y actividades al aire libre en Franklin.');if(actions){const primary=q('a',actions);if(primary){markNative(primary,'Explore all activities','Explorar todas las actividades');qa('a',actions).slice(1).forEach(a=>a.remove())}}}
    const official=qa('details.r22-disclosure').find(d=>/Official Franklin sources|Fuentes oficiales de Franklin/i.test(q(':scope>summary',d)?.textContent||''));if(official){const s=q(':scope>summary',official);if(s)markNative(s,'Official sources','Fuentes oficiales')}
    const trust=q('.r22-trust-strip');if(trust&&!trust.closest('details.hf32-currentness')){const section=trust.closest('.section'),wrap=trust.parentElement,d=el('details','hf32-currentness'),s=el('summary','');markNative(s,'How we keep Today current','Cómo mantenemos actualizado Hoy');const body=el('div','hf32-currentness-body');const p1=el('p');markNative(p1,'Times, capacity and availability can change. Open the linked organizer or official source for the latest details.','Los horarios, cupos y la disponibilidad pueden cambiar. Abra el enlace del organizador o la fuente oficial para consultar los detalles más recientes.');body.append(p1);d.append(s,body);wrap?.replaceChildren(d);section?.classList.add('hf32-currentness-section')}
  }
  function tasks(){
    if(!TASK_RE.test(p()))return;document.body.classList.add('hf32-tasks');const hero=q('main>.r22-hero');const search=q('[data-task-search]');if(hero){const para=q(':scope .wrap>p',hero);if(para)markNative(para,'Search for what you need to finish, or choose a task below. Your checklist stays private on this device.','Busque lo que necesita resolver o elija una tarea. Su lista permanece privada en este dispositivo.');const actions=q('.r22-task-search .actions',hero);if(actions){const primary=q('a,button',actions);qa('a,button',actions).slice(1).forEach(n=>n.remove());if(primary){markNative(primary,'Find my next step','Encontrar mi próximo paso');primary.addEventListener('click',e=>{e.preventDefault();const value=search?.value.trim()||'';if(!value){search?.focus();return}setTimeout(()=>{const visible=qa('.task-card').find(c=>!c.hidden&&getComputedStyle(c).display!=='none');if(visible){visible.scrollIntoView({behavior:'smooth',block:'center'});q('a.button',visible)?.focus({preventScroll:true})}else{try{sessionStorage.setItem('hf32AssistantNeed',value)}catch{}location.href=(isEs()?'/es/':'/')+'#ask-navigator'}},0)})}}}
    const selectLabel=q('.hf31-task-category-select');if(selectLabel&&!q('.hf32-task-heading')){const head=el('div','hf32-task-heading');const h=el('h2');markNative(h,'Choose what you want to get done','Elija lo que quiere resolver');const p=el('p');markNative(p,'Start with a common task or use the category filter to narrow the list.','Empiece con una tarea común o use la categoría para reducir la lista.');head.append(h,p);selectLabel.before(head)}
    const cards=qa('.task-card'),desc={
      moving:['Utilities, schools, transportation and local services.','Servicios públicos, escuelas, transporte y servicios locales.'],school:['Find your district, enrollment steps and calendar.','Encuentre su distrito, los pasos de inscripción y el calendario.'],permit:['Find the right City process and prepare your project.','Encuentre el proceso municipal adecuado y prepare su proyecto.'],business:['Find City, County and Tennessee requirements.','Encuentre los requisitos de la Ciudad, el Condado y Tennessee.'],transportation:['Compare transit, accessibility and current schedules.','Compare transporte, accesibilidad y horarios actuales.'],housing:['Find housing, affordability and urgent-help routes.','Encuentre opciones de vivienda, asequibilidad y ayuda urgente.'],property:['Find assessor, zoning, permit-history or tax information.','Encuentre información del tasador, zonificación, permisos o impuestos.'],civic:['Find boards, agendas, wards and public-comment routes.','Encuentre juntas, agendas, distritos y opciones de comentario público.'],caregiver:['Find transportation, benefits and caregiver support.','Encuentre transporte, beneficios y apoyo para cuidadores.'],benefits:['Find official and nonprofit food and benefits help.','Encuentre ayuda oficial y de organizaciones sin fines de lucro para alimentos y beneficios.'],jobs:['Plan a local job search, training or application.','Planifique una búsqueda de empleo, capacitación o solicitud.'],preparedness:['Build a household or organization emergency checklist.','Prepare una lista de emergencia para su hogar u organización.']
    },labels={moving:['Start moving','Empezar mi mudanza'],school:['Enroll in school','Inscribirse en la escuela'],permit:['Plan a permit','Planificar un permiso'],business:['Start a business','Iniciar un negocio'],transportation:['Find transportation','Buscar transporte'],housing:['Get housing help','Obtener ayuda de vivienda'],property:['Find property help','Buscar ayuda sobre propiedades'],civic:['Join civic life','Participar en la vida cívica'],caregiver:['Find caregiver support','Buscar apoyo para cuidadores'],benefits:['Find basic-needs help','Buscar ayuda para necesidades básicas'],jobs:['Plan a career move','Planificar un cambio profesional'],preparedness:['Build a preparedness plan','Crear un plan de preparación']};
    cards.forEach((card,i)=>{const id=card.id||'';if(desc[id]){const pp=q(':scope>p',card);if(pp)markNative(pp,...desc[id])}const a=q(':scope>a.button.primary',card);if(a&&labels[id])markNative(a,...labels[id]);if(i>=6)card.classList.add('hf32-task-extra')});
    if(cards.length>6&&!q('[data-hf32-show-tasks]')){const b=el('button','button hf32-show-tasks');b.type='button';b.dataset.hf32ShowTasks='1';markNative(b,'See all tasks','Ver todas las tareas');q('[data-task-grid]')?.after(b);b.addEventListener('click',()=>{document.body.classList.toggle('hf32-all-tasks');markNative(b,document.body.classList.contains('hf32-all-tasks')?'Show fewer tasks':'See all tasks',document.body.classList.contains('hf32-all-tasks')?'Mostrar menos tareas':'Ver todas las tareas')});const update=()=>{const cat=q('.hf31-task-category-select select')?.value||'All',needle=search?.value.trim()||'';document.body.classList.toggle('hf32-task-filtering',Boolean(needle||cat!=='All'))};search?.addEventListener('input',update);q('.hf31-task-category-select select')?.addEventListener('change',update);update()}
    const how=qa('main>.section').find(s=>/How tasks work|Cómo funcionan las tareas/i.test(s.textContent||''));if(how){const h=q('h2',how),para=q('p',how),mini=q('.r22-mini-list',how),actions=q('.actions',how);if(h)markNative(h,'Understand → Prepare → Complete → Next','Entender → Preparar → Completar → Seguir');if(para)markNative(para,'Understand the task, prepare what you need, complete it at the right place, and know what comes next.','Entienda la tarea, prepare lo necesario, complétela en el lugar adecuado y sepa qué hacer después.');if(mini){mini.replaceChildren();const s=el('p','hf32-task-reassurance');markNative(s,'Save a private checklist, open official sources, and keep track of follow-ups.','Guarde una lista privada, abra fuentes oficiales y lleve el seguimiento.');mini.append(s)}if(actions){const a=el('a','button primary',tx('Need help with more than one task? Ask Franklin Assistant','¿Necesita ayuda con más de una tarea? Pregunte a Franklin Assistant'));a.href=isEs()?'/es/#ask-navigator':'/#ask-navigator';a.setAttribute('data-franklin-native-locale','');actions.replaceChildren(a)}}
  }
  function meaningfulDirectoryState(root){
    return Boolean(q('[data-dir-search]',root)?.value.trim()||q('[data-dir-category]',root)?.value||q('[data-dir-type]',root)?.value||q('[data-dir-area]',root)?.value||qa('[data-dir-fact]:checked',root).length);
  }
  function simplifyDirectoryCard(card){
    if(!card||card.dataset.hf32Ready==='1')return;card.dataset.hf32Ready='1';
    qa(':scope>p.fine-print',card).forEach(n=>{if(/(?:source date|fecha de la fuente|last checked|última verificación)/i.test(n.textContent))n.hidden=true});
    const location=qa(':scope>p',card).find(n=>!n.classList.contains('fine-print')&&!n.classList.contains('result-facts'));if(location&&/Public IRS filing address geocoded in Williamson County:/i.test(location.textContent))location.textContent=location.textContent.replace(/^Public IRS filing address geocoded in Williamson County:\s*/i,'');
    const cat=q('.category-tag',card);if(cat)cat.classList.add('hf32-category-quiet');const facts=q('.result-facts',card);if(facts){const names=qa('span',facts).map(s=>s.textContent.trim()).filter(t=>!/exact address|dirección exacta/i.test(t));facts.textContent=names.join(' · ');facts.classList.add('hf32-contact-line')}
    const actions=q('.result-actions',card);if(actions){const compare=q('[data-compare-id]',actions);if(compare){compare.classList.add('hf32-compare');compare.textContent=tx('☐ Compare','☐ Comparar')}const more=q('details summary',actions);if(more)markNative(more,'More options','Más opciones')}
  }
  function updateDirectoryLanding(root){
    const hasState=meaningfulDirectoryState(root),browse=document.body.classList.contains('hf32-directory-browse');const show=hasState||browse;const results=q('[data-dir-results]',root),meta=q('.r22-directory-meta',root),pager=q('.r22-directory-pager',root),fair=q('.fine-print',root);if(results)results.hidden=!show;if(meta)meta.hidden=!show;if(pager)pager.hidden=!show;if(fair)fair.hidden=!show;const landing=q('.hf32-directory-landing',root);if(landing)landing.hidden=show;const share=q('[data-dir-share]',root);if(share)share.hidden=!hasState;
    if(show){qa('.r22-profile-result',root).forEach(simplifyDirectoryCard);updateDirectoryCount(root)}
  }
  function updateDirectoryCount(root){
    const count=q('[data-dir-count]',root),page=q('[data-dir-page]',root),prev=q('[data-dir-prev]',root);if(!count||!page)return;const total=Number((count.textContent.match(/[\d,\.]+/)||['0'])[0].replace(/[^\d]/g,''));const pg=Number((page.textContent.match(/\d+/)||['1'])[0]);if(!total)return;const start=(pg-1)*24+1,end=Math.min(pg*24,total);const pageEn=`Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`,pageEs=`Mostrando ${start.toLocaleString()}–${end.toLocaleString()} de ${total.toLocaleString()}`;if(page.textContent.trim()!==tx(pageEn,pageEs))markNative(page,pageEn,pageEs);if(prev&&prev.hidden!==(pg<=1))prev.hidden=pg<=1;if(!meaningfulDirectoryState(root)&&document.body.classList.contains('hf32-directory-browse')){const countEn=`${total.toLocaleString()} local profiles`,countEs=`${total.toLocaleString()} perfiles locales`;if(count.textContent.trim()!==tx(countEn,countEs))markNative(count,countEn,countEs)}}
  function directory(){
    if(!DIR_RE.test(p()))return;document.body.classList.add('hf32-directory');const hero=q('main>.r22-hero');if(hero){const para=q('p',hero);if(para)markNative(para,'Search 19,103 Franklin-area businesses, services, professionals and organizations by name, category or place.','Busque 19,103 negocios, servicios, profesionales y organizaciones del área de Franklin por nombre, categoría o lugar.')}
    const root=q('[data-franklin-discovery]');if(!root)return;const toolbar=q('.r22-directory-toolbar',root);toolbar?.classList.add('hf32-directory-toolbar');
    const share=q('.discovery-share',root);if(share){const para=q('p',share);if(para&&!para.closest('details')){const d=el('details','hf32-search-privacy'),s=el('summary');markNative(s,'Search privacy','Privacidad de búsqueda');para.before(d);d.append(s,para)}}
    if(!q('.hf32-directory-landing',root)){const land=el('section','hf32-directory-landing');const h=el('h2');markNative(h,'Search or choose a category','Busque o elija una categoría');const pp=el('p');markNative(pp,'Start with a name, category or place. You can also browse the full alphabetical directory.','Empiece con un nombre, categoría o lugar. También puede explorar el directorio alfabético completo.');const b=el('button','button');b.type='button';markNative(b,'Browse all profiles','Ver todos los perfiles');b.addEventListener('click',()=>{document.body.classList.add('hf32-directory-browse');updateDirectoryLanding(root)});land.append(h,pp,b);q('.r22-directory-meta',root)?.before(land)}
    const results=q('[data-dir-results]',root);if(results){qa('.r22-profile-result',results).forEach(simplifyDirectoryCard);new MutationObserver(()=>{qa('.r22-profile-result',results).forEach(simplifyDirectoryCard);updateDirectoryLanding(root)}).observe(results,{childList:true,subtree:true})}
    const count=q('[data-dir-count]',root),page=q('[data-dir-page]',root);if(count)new MutationObserver(()=>updateDirectoryCount(root)).observe(count,{childList:true,characterData:true,subtree:true});if(page)new MutationObserver(()=>updateDirectoryCount(root)).observe(page,{childList:true,characterData:true,subtree:true});
    qa('input,select',root).forEach(n=>n.addEventListener(n.tagName==='INPUT'?'input':'change',()=>updateDirectoryLanding(root)));
    const fair=qa('p.fine-print',root).find(n=>/Membership does not change|Membership does not affect|La membresía/i.test(n.textContent));if(fair){const link=q('a',fair);fair.replaceChildren(document.createTextNode(tx('Membership does not affect where profiles appear in search results. ','La membresía no afecta la posición de los perfiles en los resultados. ')));if(link){markNative(link,'How results work','Cómo funcionan los resultados');fair.append(link)}}
    updateDirectoryLanding(root);
  }
  function profile(){
    if(!PROFILE_RE.test(p()))return;
    document.body.classList.add('hf32-profile');
    const hero=q('.r22-profile-hero');
    if(!hero)return;

    const group=q('.profile-primary-actions',hero);
    if(group&&group.dataset.hf32Ready!=='1'){
      group.dataset.hf32Ready='1';
      const all=qa('a,button',group).filter(n=>!n.closest('summary'));
      const unique=[];
      const keys=new Set();
      all.forEach(n=>{
        const key=(n.getAttribute('href')||n.textContent.trim())+'|'+n.textContent.trim();
        if(!keys.has(key)){keys.add(key);unique.push(n)}
      });
      const primary=unique.find(n=>n.classList.contains('primary'))||unique[0];
      if(primary){
        unique.forEach(n=>n.classList.remove('primary'));
        primary.classList.add('primary');
        group.replaceChildren(primary);
        const others=unique.filter(n=>n!==primary);
        if(others.length){
          const box=el('section','hf32-contact-links');
          const h=el('h2');markNative(h,'Contact & links','Contacto y enlaces');
          const list=el('div','hf32-contact-link-list');
          others.forEach(n=>{
            n.classList.remove('button','primary','hf31-profile-secondary');
            n.classList.add('hf32-contact-link');
            list.append(n);
          });
          box.append(h,list);
          group.after(box);
        }
      }
    }

    const utility=q('.profile-utility-actions',hero);
    if(utility){const sum=q('summary',utility);if(sum)markNative(sum,'More options','Más opciones')}
    qa('.profile-currentness',hero).forEach(n=>n.hidden=true);

    const layout=q('.r22-profile-layout');
    const article=q('article',layout);
    const side=q('aside.r22-profile-side',layout);
    if(!article)return;

    const about=qa(':scope>section',article)[0];
    if(about){
      const h=q('h2',about),para=q('p',about);
      const name=q('h1',hero)?.textContent.trim()||'';
      const cat=q('.eyebrow',hero)?.textContent.trim()||'';
      const loc=q('.profile-location',hero)?.textContent.trim()||'';
      if(h)markNative(h,'About','Acerca de');
      if(para){
        const en=loc
          ?`${name} is listed as ${cat.toLowerCase()} at ${loc} in Franklin. Use the contact links above to confirm current services and hours.`
          :`${name} is listed as ${cat.toLowerCase()} serving the Franklin area. Use the contact links above to confirm current services and hours.`;
        const es=loc
          ?`${name} aparece como ${cat.toLowerCase()} en ${loc}, Franklin. Use los enlaces de contacto anteriores para confirmar los servicios y horarios actuales.`
          :`${name} aparece como ${cat.toLowerCase()} en el área de Franklin. Use los enlaces de contacto anteriores para confirmar los servicios y horarios actuales.`;
        markNative(para,en,es);
      }
    }

    const facts=q('.profile-facts-grid',article);
    if(facts){
      const sec=facts.closest('section');
      const labels=qa(':scope>div>span',facts).map(n=>n.textContent.trim().toLowerCase());
      if(labels.length&&labels.every(t=>/category|type|area|categoría|tipo|área/.test(t)))sec.hidden=true;
    }

    const sources=q('#sources details',article)||q('details.r22-disclosure',article);
    if(sources){
      sources.classList.add('hf32-source-details');
      const sm=q(':scope>summary',sources);
      if(sm)markNative(sm,'Sources & details','Fuentes y detalles');
    }

    const manage=qa(':scope>section',article).find(s=>/Manage or correct|Suggest a correction|Administrar o corregir/i.test(q('h2',s)?.textContent||''));
    if(manage){
      const mh=q('h2',manage),mp=q('p',manage),actions=q('.actions',manage);
      const typeText=facts?(q('div:nth-child(2) strong',facts)?.textContent||''):'';
      if(mh)markNative(mh,/business/i.test(typeText)?'Own or manage this business?':'Own or manage this profile?',/negocio/i.test(typeText)?'¿Es dueño o administra este negocio?':'¿Es dueño o administra este perfil?');
      if(mp)markNative(mp,'See something incorrect? Corrections are free.','¿Ve algo incorrecto? Las correcciones son gratuitas.');
      if(actions){
        const claim=qa('a',actions).find(a=>/claim-profile/.test(a.href));
        const corr=qa('a',actions).find(a=>/corrections/.test(a.href));
        actions.replaceChildren();
        if(claim){claim.className='button primary';markNative(claim,'Manage this profile','Administrar este perfil');actions.append(claim)}
        if(corr){corr.className='';markNative(corr,'Report incorrect information','Reportar información incorrecta');actions.append(corr)}
      }
    }

    if(side){
      const related=q('.hf31-related-card',side)||qa(':scope>section',side).find(s=>/Similar local profiles|Related local profiles|Perfiles locales/i.test(q('h2',s)?.textContent||''));
      if(related){
        related.classList.add('hf32-related-lower');
        article.insertBefore(related,manage||null);
      }
      side.hidden=true;
    }
  }
  function makeDetailsForSection(section,en,es){
    if(!section||section.dataset.hf32Collapsed==='1')return;const wrap=q(':scope>.wrap',section)||section;if(!wrap||SAFETY_RE.test(section.textContent||''))return;section.dataset.hf32Collapsed='1';const d=el('details','hf32-secondary-section'),s=el('summary');markNative(s,en,es);const body=el('div','hf32-secondary-section-body');[...wrap.children].forEach(n=>body.append(n));d.append(s,body);wrap.append(d);section.classList.add('hf32-secondary-shell');
  }
  function explorerCardLimit(root){
    const grid=q('.explorer-grid',root);if(!grid||grid.dataset.hf32Observed==='1')return;grid.dataset.hf32Observed='1';let limit=9;const apply=()=>{const cards=[...grid.children].filter(n=>n.matches('article,.explorer-card'));cards.forEach((c,i)=>c.hidden=i>=limit);let b=q('[data-hf32-explorer-more]',grid.parentElement);if(cards.length>limit){if(!b){b=el('button','button hf32-explorer-more');b.type='button';b.dataset.hf32ExplorerMore='1';b.addEventListener('click',()=>{limit+=9;apply()});grid.after(b)}markNative(b,`Show more options (${Math.min(9,cards.length-limit)} more)`,`Mostrar más opciones (${Math.min(9,cards.length-limit)} más)`);b.hidden=false}else if(b)b.hidden=true;const sum=q('[data-explorer-summary]',root);if(sum&&cards.length)markNative(sum,`Showing ${Math.min(limit,cards.length)} of ${cards.length} local options`,`Mostrando ${Math.min(limit,cards.length)} de ${cards.length} opciones locales`)};new MutationObserver(()=>{limit=9;queueMicrotask(apply)}).observe(grid,{childList:true});setTimeout(apply,0)
  }
  function sports(){
    if(!SPORTS_RE.test(p()))return;document.body.classList.add('hf32-sports');const root=q('[data-community-explorer]')||q('main');if(!root)return;const hero=q('.explorer-hero',root);if(hero){const h=q('h1',hero),para=q('.explorer-hero-grid>div>p',hero),aside=q('.explorer-hero-card',hero),actions=q('.actions',hero);if(p()==='/sports/'||p()==='/es/deportes/'){if(h)markNative(h,'Find sports in Franklin.','Encuentre deportes en Franklin.');if(para)markNative(para,'Search or choose a sport to find local leagues, teams, lessons, facilities and programs.','Busque o elija un deporte para encontrar ligas, equipos, clases, instalaciones y programas locales.')}if(aside)aside.hidden=true;if(actions){const first=q('a',actions);qa('a',actions).slice(1).forEach(a=>a.remove());if(first){first.href='#finder';markNative(first,'Find a sport','Buscar un deporte')}}}
    const finder=q('#finder',root);if(finder&&hero&&hero.nextElementSibling!==finder)hero.after(finder);if(finder){const h=q('h2',finder),para=q(':scope .wrap>p',finder);if(h)markNative(h,'Find local sports options','Buscar opciones deportivas locales');if(para)markNative(para,'Search by sport or name. Use more filters only when you need them.','Busque por deporte o nombre. Use más filtros solo cuando los necesite.');const controls=q('.explorer-controls',finder);if(controls&&!controls.dataset.hf32Ready){controls.dataset.hf32Ready='1';const search=q('[data-explorer-search]',controls)?.closest('label'),sport=q('[data-explorer-sport]',controls)?.closest('label'),aud=q('[data-explorer-audience]',controls)?.closest('label'),geo=q('[data-explorer-geography]',controls)?.closest('label'),reset=q('[data-explorer-reset]',controls);const more=el('details','hf32-explorer-filters'),sum=el('summary');markNative(sum,'More filters','Más filtros');const body=el('div','hf32-explorer-filter-body');[aud,geo,reset].filter(Boolean).forEach(n=>body.append(n));more.append(sum,body);controls.replaceChildren(...[search,sport,more].filter(Boolean))}}
    const activitySection=qa(':scope>section',root).find(s=>s.getAttribute('aria-label')==='Activity hubs');if(activitySection)makeDetailsForSection(activitySection,'Explore other activities','Explorar otras actividades');
    const routes=q('.explorer-sport-routes',root);if(routes&&routes.dataset.hf32Ready!=='1'){routes.dataset.hf32Ready='1';const grid=q('.explorer-sport-link-grid',routes),links=grid?qa('a',grid):[];if(links.length){const h=q('h2',routes);if(h)markNative(h,'Choose a sport','Elija un deporte');const picker=el('div','hf32-sport-picker'),label=el('label','hf32-sport-select-label'),span=el('span');markNative(span,'Sport','Deporte');const sel=el('select','hf32-sport-select');const blank=new Option(tx('Choose a sport…','Elija un deporte…'),'');sel.append(blank);links.forEach(a=>sel.append(new Option(a.textContent.trim(),a.href)));const go=el('button','button primary');go.type='button';markNative(go,'View sport','Ver deporte');go.addEventListener('click',()=>{if(sel.value)location.href=sel.value;else sel.focus()});label.append(span,sel);picker.append(label,go);grid.replaceWith(picker)}}
    const prep=qa(':scope>section',root).find(s=>/Check the details before you register|Revise los detalles antes de inscribirse/i.test(s.textContent||''));if(prep){q('ul.check-list',prep)?.remove();makeDetailsForSection(prep,'Before you register','Antes de inscribirse')}
    const current=q('[data-explorer-current-section]',root);if(current&&finder&&current.previousElementSibling!==finder){finder.after(current)}
    const shortlist=q('#short-list',root);if(shortlist){shortlist.hidden=true;const sticky=q('.explorer-shortlist',root);if(sticky)new MutationObserver(()=>{shortlist.hidden=sticky.hidden}).observe(sticky,{attributes:true,attributeFilter:['hidden']});const actions=q('.actions',shortlist);if(actions){const copy=q('[data-explorer-copy]',actions),others=[q('[data-explorer-download]',actions),q('[data-explorer-print]',actions)].filter(Boolean);if(copy&&others.length){const d=el('details','hf32-popover hf32-shortlist-more'),s=el('summary');markNative(s,'More options','Más opciones');const m=el('div','hf32-popover-menu');others.forEach(n=>m.append(n));d.append(s,m);actions.replaceChildren(copy,d)}}}
    const about=qa(':scope>section',root).find(s=>/What these results include|Qué incluyen estos resultados/i.test(s.textContent||''));if(about)makeDetailsForSection(about,'How these options are chosen','Cómo se eligen estas opciones');
    const organizer=qa(':scope>section',root).find(s=>/Run a local team, program, venue or business|¿Dirige un equipo|For local organizers/i.test(s.textContent||''));if(organizer)makeDetailsForSection(organizer,'For organizers and businesses','Para organizadores y negocios');
    const summary=q('[data-explorer-summary]',root);if(summary)new MutationObserver(()=>{if(/Loading|Cargando/i.test(summary.textContent))summary.hidden=true;else summary.hidden=false}).observe(summary,{childList:true,characterData:true,subtree:true});explorerCardLimit(root);
  }
  function genericGridLimit(){
    if(HOME_RE.test(p())||TODAY_RE.test(p())||TASK_RE.test(p())||DIR_RE.test(p())||PROFILE_RE.test(p())||SPORTS_RE.test(p()))return;
    const main=q('main');if(!main)return;const sections=qa(':scope>section',main),cards=qa('.card,.r22-card,.explorer-card,.task-card',main),links=qa('a,button',main);if(sections.length<8&&cards.length<12&&links.length<60)return;document.body.classList.add('hf32-high-load-page');
    qa('.grid,.r22-grid,.explorer-jump-grid,.explorer-sport-link-grid,.core-source-grid',main).forEach(grid=>{
      if(grid.dataset.hf32Limited==='1'||grid.closest('[data-dir-results],[data-explorer-grid],[data-today-grid]')||SAFETY_RE.test(grid.textContent||''))return;const kids=[...grid.children].filter(n=>n.matches('article,a,.card,.r22-card'));if(kids.length<=9)return;grid.dataset.hf32Limited='1';const safety=kids.filter(n=>SAFETY_RE.test(n.textContent||''));let normal=kids.filter(n=>!safety.includes(n));normal.forEach((n,i)=>{if(i>=6)n.classList.add('hf32-generic-extra')});if(!normal.some((n,i)=>i>=6))return;const b=el('button','button hf32-generic-more');b.type='button';markNative(b,'See more options','Ver más opciones');b.addEventListener('click',()=>{grid.classList.toggle('hf32-generic-expanded');markNative(b,grid.classList.contains('hf32-generic-expanded')?'Show fewer options':'See more options',grid.classList.contains('hf32-generic-expanded')?'Mostrar menos opciones':'Ver más opciones')});grid.after(b)
    });
    sections.forEach(section=>{const text=(q('.eyebrow',section)?.textContent||'')+' '+(q('h2',section)?.textContent||'');if(/About (?:these )?(?:results|sources)|How (?:this|results|information)|Freshness|Source details|For local organizers|Acerca de (?:estos )?resultados|Cómo (?:funciona|se)|Fuentes|Para organizadores/i.test(text)&&!SAFETY_RE.test(section.textContent||''))makeDetailsForSection(section,tx('More information','More information'),tx('Más información','Más información'))});
  }
  function init(){ensureCss();integrateLanguage();canonicalHeader();clearEllipsisLabels();sourceDatePresentation();homepage();today();tasks();directory();profile();sports();genericGridLimit();syncApprovedLabels();closeDisclosures()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
  window.addEventListener('load',()=>{setTimeout(init,100);setTimeout(init,500)},{once:true});
  window.addEventListener('franklinlanguagechange',()=>setTimeout(init,0));
  const observer=new MutationObserver(records=>{
    let relevant=false;for(const r of records){if(r.type==='childList'&&r.addedNodes.length){relevant=true;break}}if(relevant)setTimeout(()=>{clearEllipsisLabels();sourceDatePresentation();if(DIR_RE.test(p()))directory()},30)
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
})();
