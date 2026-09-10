'use strict';
(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const isEs=()=>document.documentElement.lang==='es'||location.pathname.startsWith('/es/');
  const tx=(en,es)=>isEs()?es:en;
  const root=q('[data-community-explorer]');

  const exact=new Map([
    ['Franklin-local sports route','Local sports in Franklin'],
    ['Source-backed options — recheck before you act','Check details before you go'],
    ['Stable local routes','More ways to participate'],
    ['Responsible-source finder','Local options'],
    ['On-device follow-through plan','Save for later'],
    ['Honest coverage','About these results'],
    ['Broad local coverage, with visible limits','What these results include'],
    ['Responsible sources','Original sources'],
    ['What to recheck','Check changing details'],
    ['Source routes reviewed: September 3, 2026','Information reviewed September 3, 2026'],
    ['19,103 canonical profiles; no invented records','Local profiles are based on public information'],
    ['Conflicts suppressed until resolved','Unclear information is left out until confirmed'],
    ['Date-sensitive opportunities that have not expired','Current programs and registration windows'],
    ['These cards automatically disappear after their evidence window. Still confirm status at the original source before traveling or paying.','Past items are removed automatically. Confirm current details at the original source before traveling or paying.'],
    ['Turn discovery into a safe decision.','Check the details before you register.'],
    ['Use the physical address for travel','Confirm the location before you go'],
    ['Every result below is an official or first-party Franklin-serving route. Appearance is not ranking, affiliation or endorsement.','Open the listed source for current schedules, registration, prices and availability. Results are not rankings or endorsements.'],
    ['Source route checked','Checked'],
    ['Official or original source','Official source'],
    ['Add to my short list','Save to shortlist'],
    ['Build a recheck short list','Build a shortlist'],
    ['Choose one or more starting points above. No name or private story is needed.','Choose an option above to add it to your shortlist.'],
    ['Prepared on this device; not submitted.','Saved in this browser only.'],
    ['Ruta deportiva local de Franklin','Deportes locales en Franklin'],
    ['Opciones respaldadas por fuentes — vuelva a comprobar antes de actuar','Confirme los detalles antes de ir'],
    ['Rutas locales estables','Más formas de participar'],
    ['Buscador de fuentes responsables','Opciones locales'],
    ['Plan de seguimiento en este dispositivo','Guardar para después'],
    ['Cobertura transparente','Sobre estos resultados'],
    ['Cobertura local amplia, con límites visibles','Qué incluyen estos resultados'],
    ['Fuentes responsables','Fuentes originales'],
    ['Qué volver a comprobar','Qué conviene confirmar'],
    ['Rutas de fuentes revisadas: 3 de septiembre de 2026','Información revisada el 3 de septiembre de 2026'],
    ['19,103 perfiles canónicos; sin registros inventados','Los perfiles locales se basan en información pública'],
    ['Los conflictos se ocultan hasta resolverse','Omitimos la información que no podemos confirmar'],
    ['Oportunidades con fecha que aún no han vencido','Programas e inscripciones vigentes'],
    ['Estas tarjetas desaparecen automáticamente al terminar su ventana de evidencia. Aun así, confirme el estado en la fuente original antes de viajar o pagar.','Los elementos pasados se eliminan automáticamente. Confirme los detalles actuales en la fuente original antes de viajar o pagar.'],
    ['Convierta el descubrimiento en una decisión segura.','Confirme los detalles antes de inscribirse.'],
    ['Use la dirección física para desplazarse','Confirme la ubicación antes de ir'],
    ['Cada resultado a continuación es una ruta oficial o de primera fuente que sirve a Franklin. La aparición no implica clasificación, afiliación ni respaldo.','Abra la fuente indicada para confirmar horarios, inscripción, precios y disponibilidad. Los resultados no son una clasificación ni una recomendación.'],
    ['Ruta de fuente revisada','Revisado'],
    ['Fuente oficial / de primera parte','Fuente oficial'],
    ['Añadir a mi lista','Guardar en mi lista'],
    ['Crear una lista corta para volver a comprobar','Crear una lista'],
    ['Elija uno o más puntos de partida. No se necesita ningún nombre ni historia privada.','Elija una opción para añadirla a su lista.'],
    ['Preparado en este dispositivo; no enviado.','Guardado solo en este navegador.'],
    ['Use su dirección sin dársela a Franklin Navigator.','Utilice su dirección sin compartirla con Franklin Navigator.']
  ]);

  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
  const skip=node=>node?.parentElement?.closest('script,style,noscript,code,textarea,[data-no-public-language-cleanup]');
  function cleanTextNode(node){
    if(!node||skip(node))return;
    const raw=node.nodeValue||'',n=normalize(raw);if(!n)return;
    let replacement=exact.get(n);
    if(!replacement&&/^Browse (.+) starting points$/i.test(n))replacement=n.replace(/^Browse (.+) starting points$/i,'$1 serving Franklin');
    if(!replacement&&/^Explorar puntos de partida de (.+)$/i.test(n))replacement=n.replace(/^Explorar puntos de partida de (.+)$/i,'$1 que sirven a Franklin');
    if(!replacement&&/^Showing (\d+) of (\d+) local starting points$/i.test(n))replacement=n.replace('local starting points','local options');
    if(!replacement&&/^Mostrando (\d+) de (\d+) puntos de partida locales$/i.test(n))replacement=n.replace('puntos de partida locales','opciones locales');
    if(replacement){
      const lead=(raw.match(/^\s*/)||[''])[0],trail=(raw.match(/\s*$/)||[''])[0];node.nodeValue=lead+replacement+trail;
    }
  }
  function cleanPublicLanguage(base=document.body){
    if(!base)return;
    if(base.nodeType===Node.TEXT_NODE){cleanTextNode(base);return}
    const walker=document.createTreeWalker(base,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))cleanTextNode(node);
    qa('pre.explorer-plan',base===document.body?document:base).forEach(pre=>{
      const n=normalize(pre.textContent);const replacement=exact.get(n);if(replacement)pre.textContent=replacement;
    });
  }

  function ensureCss(){
    if(q('link[data-hf31-deep-public]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/hf31-deep-public.css';link.dataset.hf31DeepPublic='1';document.head.append(link);
  }

  function setText(el,en,es){if(el)el.textContent=tx(en,es)}

  function simplifyHero(){
    if(!root)return;
    const hero=q('.explorer-hero',root);if(!hero)return;
    hero.classList.add('hf31-explorer-hero');
    setText(q('.explorer-kicker',hero),'Local activities in Franklin','Actividades locales en Franklin');
    const aside=q('.explorer-hero-card',hero);
    if(aside){setText(q('h2',aside),'Check details before you go','Confirme los detalles antes de ir');setText(q('p',aside),'Schedules, prices, eligibility and availability can change. Confirm the latest information at the official source before you register, travel or pay.','Los horarios, precios, requisitos y disponibilidad pueden cambiar. Confirme la información más reciente en la fuente oficial antes de inscribirse, desplazarse o pagar.')}
    const actions=q('.actions',hero);if(actions){
      const primary=q('a[href="#finder"]',actions);setText(primary,'See local options','Ver opciones locales');
      qa('a',actions).filter(a=>a!==primary&&(/español|english|inglés|view in english/i.test(a.textContent)||a.getAttribute('hreflang'))).forEach(a=>a.remove());
    }
  }

  function finderTitle(){
    const h=q('#finder h2',root);if(!h)return;
    let n=normalize(h.textContent);
    if(isEs()){
      n=n.replace(/^Explorar puntos de partida de /i,'').replace(/^Explorar /i,'').trim();
      if(n&&!/Franklin/i.test(n))h.textContent=`${n.charAt(0).toUpperCase()+n.slice(1)} que sirven a Franklin`;
    }else{
      n=n.replace(/^Browse /i,'').replace(/ starting points$/i,'').trim();
      if(n&&!/Franklin/i.test(n))h.textContent=`${n.charAt(0).toUpperCase()+n.slice(1)} serving Franklin`;
    }
  }

  function simplifyFinder(){
    if(!root)return;
    const finder=q('#finder',root),hero=q('.explorer-hero',root);if(!finder)return;
    finder.classList.add('hf31-explorer-finder');
    setText(q('.eyebrow',finder),'Local options','Opciones locales');finderTitle();
    setText(q(':scope > .wrap > p',finder),'Open an option below for current schedules, registration, prices and availability.','Abra una opción para consultar horarios, inscripción, precios y disponibilidad actuales.');
    if(hero&&finder.previousElementSibling!==hero)hero.after(finder);
    const controls=q('.explorer-controls',finder);if(controls&&!q('.hf31-explorer-more-filters',controls)){
      const labels=qa(':scope > label',controls),reset=q('[data-explorer-reset]',controls);
      if(labels.length>1){
        const details=document.createElement('details');details.className='hf31-explorer-more-filters';
        const summary=document.createElement('summary');summary.textContent=tx('More filters','Más filtros');
        const panel=document.createElement('div');panel.className='hf31-explorer-filter-panel';
        labels.slice(1).forEach(el=>panel.append(el));if(reset)panel.append(reset);details.append(summary,panel);controls.append(details);
      }
    }
    const grid=q('[data-explorer-grid]',finder),summary=q('[data-explorer-summary]',finder);
    const tune=()=>{
      const cards=qa('.explorer-card',grid);if(!cards.length)return;
      const controls=q('.explorer-controls',finder);
      if(cards.length<=4){controls?.classList.add('hf31-explorer-controls-minimal');if(summary)summary.textContent=tx(`${cards.length} local option${cards.length===1?'':'s'}`,`${cards.length} opción${cards.length===1?'':'es'} local${cards.length===1?'':'es'}`)}
      else controls?.classList.remove('hf31-explorer-controls-minimal');
    };
    if(grid){new MutationObserver(()=>{cleanPublicLanguage(grid);tune()}).observe(grid,{childList:true,subtree:true,characterData:true});setTimeout(tune,400)}
  }

  function collapseOtherNavigation(){
    if(!root||q('.hf31-explorer-other',root))return;
    const activity=qa(':scope > section',root).find(s=>/Activity hubs|Centros de actividades/i.test(s.getAttribute('aria-label')||''));
    const sports=q('.explorer-sport-routes',root);if(!activity&&!sports)return;
    const section=document.createElement('section');section.className='section hf31-explorer-other';
    const wrap=document.createElement('div');wrap.className='wrap';const details=document.createElement('details');details.className='hf31-explorer-other-details';
    const summary=document.createElement('summary');summary.textContent=tx('Explore other sports and activities','Explorar otros deportes y actividades');
    const content=document.createElement('div');content.className='hf31-explorer-other-content';
    if(activity){const a=q('.wrap',activity);if(a){const h=document.createElement('h3');h.textContent=tx('More activity areas','Más áreas de actividades');content.append(h,...[...a.children])}activity.remove()}
    if(sports){const s=q('.wrap',sports);if(s)content.append(...[...s.children]);sports.remove()}
    details.append(summary,content);wrap.append(details);section.append(wrap);
    const finder=q('#finder',root);(finder||q('.explorer-hero',root))?.after(section);
  }

  function simplifyPreparation(){
    if(!root)return;
    const section=qa(':scope > section',root).find(s=>/Turn discovery into a safe decision|Convierta el descubrimiento en una decisión segura|Check the details before you register|Confirme los detalles antes de inscribirse/i.test(s.textContent||''));
    if(!section)return;section.classList.add('hf31-explorer-prep');
    setText(q('.eyebrow',section),'Before you register','Antes de inscribirse');setText(q('h2',section),'Three things to check','Tres cosas que conviene confirmar');
    q('ul.check-list',section)?.remove();
  }

  function simplifyCurrent(){
    if(!root)return;const section=q('[data-explorer-current-section]',root);if(!section)return;section.classList.add('hf31-explorer-current');
    setText(q('.eyebrow',section),'Current now','Vigente ahora');setText(q('h2',section),'Current programs and registration windows','Programas e inscripciones vigentes');
    const intro=q(':scope > .wrap > p',section);if(intro)setText(intro,'Past items are removed automatically. Confirm current details at the official source before traveling or paying.','Los elementos pasados se eliminan automáticamente. Confirme los detalles actuales en la fuente oficial antes de desplazarse o pagar.');
    const grid=q('[data-explorer-current]',section),empty=q('[data-explorer-current-empty]',section);
    const tune=()=>{const has=qa('.explorer-current-card',grid).length>0;const settled=empty&&!empty.hidden;if(has)section.hidden=false;else if(settled)section.hidden=true};
    if(grid)new MutationObserver(()=>{cleanPublicLanguage(section);tune()}).observe(grid,{childList:true,subtree:true,characterData:true});setTimeout(tune,1200);
  }

  function removeGenericAddress(){
    if(!root)return;const box=q('.explorer-address',root);if(box)box.closest('section')?.remove();
  }

  function simplifyShortlist(){
    if(!root)return;const section=q('#short-list',root);if(!section)return;section.classList.add('hf31-explorer-shortlist-section');section.hidden=true;
    setText(q('.eyebrow',section),'Save for later','Guardar para después');setText(q('h2',section),'Build a shortlist','Crear una lista');
    setText(q(':scope > .wrap > p',section),'Choose the options you want to remember. Your shortlist stays in this browser tab and is not sent anywhere.','Elija las opciones que quiera recordar. Su lista permanece en esta pestaña del navegador y no se envía a ningún sitio.');
    const pre=q('[data-explorer-output]',section);if(pre)setText(pre,'Choose an option above to add it to your shortlist.','Elija una opción para añadirla a su lista.');
    const actions=q('.actions',section);if(actions&&!q('.hf31-shortlist-more',actions)){
      const buttons=qa(':scope > button',actions);if(buttons.length>1){
        const copy=buttons[0];copy.classList.add('primary');const details=document.createElement('details');details.className='hf31-more hf31-shortlist-more';
        const summary=document.createElement('summary');summary.textContent=tx('More tools','Más herramientas');const menu=document.createElement('div');menu.className='hf31-more-menu';buttons.slice(1).forEach(b=>menu.append(b));details.append(summary,menu);actions.replaceChildren(copy,details);
      }
    }
    const build=q('[data-explorer-build]',root);build?.addEventListener('click',()=>{section.hidden=false;setTimeout(()=>section.scrollIntoView({behavior:'smooth',block:'start'}),0)});
    const clear=q('[data-explorer-clear]',root);clear?.addEventListener('click',()=>{section.hidden=true});
  }

  function simplifyCoverage(){
    if(!root)return;const section=qa(':scope > section',root).find(s=>/Broad local coverage, with visible limits|Cobertura local amplia, con límites visibles|What these results include|Qué incluyen estos resultados/i.test(s.textContent||''));if(!section)return;
    section.classList.add('hf31-explorer-coverage');setText(q('.eyebrow',section),'About these results','Sobre estos resultados');setText(q('h2',section),'What these results include','Qué incluyen estos resultados');
    const cards=qa('.explorer-coverage > article',section);
    if(cards[0]){setText(q('h3',cards[0]),'Franklin-focused','Centrado en Franklin');setText(q('p',cards[0]),'Results focus on Franklin and nearby Williamson County programs that serve Franklin residents.','Los resultados se centran en Franklin y en programas cercanos del condado de Williamson que atienden a residentes de Franklin.')}
    if(cards[1]){setText(q('h3',cards[1]),'Original sources','Fuentes originales');setText(q('p',cards[1]),'Each option links to an official or organization source when available. Results are not rankings or endorsements.','Cada opción enlaza a una fuente oficial o de la organización cuando está disponible. Los resultados no son clasificaciones ni recomendaciones.')}
    if(cards[2]){setText(q('h3',cards[2]),'Check changing details','Confirme los datos que pueden cambiar');setText(q('p',cards[2]),'Schedules, prices, locations and eligibility can change. Confirm them before you go or register.','Los horarios, precios, ubicaciones y requisitos pueden cambiar. Confírmelos antes de ir o inscribirse.')}
    const fresh=q('.explorer-freshness',section);if(fresh){const spans=qa(':scope > span',fresh);if(spans[0])setText(spans[0],'Information reviewed September 3, 2026','Información revisada el 3 de septiembre de 2026');spans.slice(1).forEach(s=>s.remove())}
  }

  function simplifyOrganizer(){
    if(!root)return;const section=qa(':scope > section',root).find(s=>/Run a local team, program, venue or business|Dirige|equipo.*programa.*negocio/i.test(s.textContent||''));if(!section)return;section.classList.add('hf31-explorer-organizer');
    setText(q('.eyebrow',section),'For local organizations and businesses','Para organizaciones y negocios locales');setText(q('h2',section),'Manage your Franklin presence','Administre su presencia en Franklin');
    setText(q('p',section),'Find your public profile or suggest a factual correction. Membership does not change ordinary search ranking.','Encuentre su perfil público o sugiera una corrección de datos. La membresía no cambia la posición normal en los resultados.');
    const actions=q('.actions',section);if(actions){const links=qa(':scope > a',actions);if(links[0]){links[0].href=isEs()?'/es/directorio/':'/directory/';setText(links[0],'Find your profile','Buscar su perfil');links[0].classList.add('primary')}
      if(links[1]){setText(links[1],'Suggest a correction','Sugerir una corrección');links[1].classList.remove('button','primary')}
      if(links.length>2&&!q('.hf31-organizer-more',actions)){const extra=links.slice(2);const details=document.createElement('details');details.className='hf31-more hf31-organizer-more';const summary=document.createElement('summary');summary.textContent=tx('More','Más');const menu=document.createElement('div');menu.className='hf31-more-menu';extra.forEach(a=>menu.append(a));details.append(summary,menu);actions.append(details)}
    }
  }

  function ensureDeepFooter(){
    if(!root)return;const nav=q('footer .footer-links');if(!nav||nav.dataset.hf31DeepReady==='1')return;nav.dataset.hf31DeepReady='1';
    const links=isEs()?[
      ['/es/centro-de-ayuda/','Centro de ayuda'],['/updates/?source=WEBSITE','Novedades'],['/es/negocios/','Para negocios'],['/es/privacidad/','Privacidad'],['/es/accesibilidad/','Accesibilidad']
    ]:[['/community-help-center/','Help Center'],['/updates/?source=WEBSITE','Get updates'],['/business-dashboard/','For businesses'],['/privacy/','Privacy'],['/accessibility/','Accessibility']];
    nav.replaceChildren(...links.map(([href,label])=>{const a=document.createElement('a');a.href=href;a.textContent=label;return a}));
  }

  function refineExplorer(){
    if(!root)return;document.body.classList.add('hf31-explorer-page');ensureCss();simplifyHero();simplifyFinder();collapseOtherNavigation();simplifyPreparation();simplifyCurrent();removeGenericAddress();simplifyShortlist();simplifyCoverage();simplifyOrganizer();ensureDeepFooter();cleanPublicLanguage(root);
  }

  function init(){ensureCss();cleanPublicLanguage(document.body);refineExplorer()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('load',()=>{init();setTimeout(init,180)},{once:true});
  window.addEventListener('franklinlanguagechange',()=>setTimeout(init,0));
  const observer=new MutationObserver(records=>{for(const rec of records){for(const node of rec.addedNodes){if(node.nodeType===1||node.nodeType===3)cleanPublicLanguage(node)}}});
  if(document.body)observer.observe(document.body,{childList:true,subtree:true,characterData:false});
})();
