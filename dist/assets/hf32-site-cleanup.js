'use strict';
(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const path=()=>location.pathname;
  const isEs=()=>document.documentElement.lang==='es'||path().startsWith('/es/');
  const tx=(en,es)=>isEs()?es:en;
  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();

  function nativeText(el,en,es){
    if(!el)return;
    el.dataset.hf32En=en;
    el.dataset.hf32Es=es;
    el.setAttribute('data-franklin-native-locale','');
    el.textContent=tx(en,es);
  }

  function syncNative(){
    qa('[data-hf32-en]').forEach(el=>el.textContent=tx(el.dataset.hf32En||'',el.dataset.hf32Es||''));
    qa('[data-hf32-summary-en]').forEach(d=>{
      const s=q(':scope>summary',d);
      if(s)s.textContent=tx(d.dataset.hf32SummaryEn||'',d.dataset.hf32SummaryEs||'');
    });
  }

  function groupForCurrent(){
    const p=path();
    if(/^\/(?:es\/)?(?:activities|sports|learning|arts-entertainment|outdoors|teams-clubs|school-activities|youth-family)(?:\/|$)/.test(p))return 'activities';
    if(/^\/(?:es\/)?(?:community|comunidad)(?:\/|$)/.test(p))return 'community';
    if(/^\/(?:es\/)?(?:my-franklin|mi-franklin)(?:\/|$)/.test(p))return 'my';
    if(/^\/(?:es\/)?(?:business-dashboard|negocios|membership|member-|claim-profile|corrections|profile-studio|community-member-display|free-membership|founding-member-planner|work-with-franklin-navigator)/.test(p))return 'business';
    if(/^\/(?:es\/)?(?:community-help-center|centro-de-ayuda|help|support)/.test(p))return 'help';
    return '';
  }

  function universalNav(){
    const nav=q('header .nav');
    if(!nav)return;
    const es=isEs();
    const langKey=es?'es':'en';
    if(nav.dataset.hf32Lang===langKey&&nav.classList.contains('hf32-universal-nav')&&q(':scope>.hf32-nav-more',nav))return;
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
    const make=([href,label,key])=>{
      const a=document.createElement('a');
      a.href=href;
      a.textContent=label;
      a.dataset.hf32NavKey=key;
      const matches=(key==='today'&&/\/(?:es\/hoy|today)\/$/.test(p))||
        (key==='tasks'&&/\/(?:es\/hacerlo|get-it-done)\/$/.test(p))||
        (key==='directory'&&(p==='/directory/'||p==='/es/directorio/'||/^\/profiles\//.test(p)))||
        group===key;
      if(matches)a.setAttribute('aria-current','page');
      return a;
    };
    const coreLinks=core.map(make),moreLinks=more.map(make);
    const details=document.createElement('details');
    details.className='hf32-nav-more';
    details.setAttribute('data-franklin-native-locale','');
    const summary=document.createElement('summary');
    summary.textContent=es?'Más':'More';
    const menu=document.createElement('div');
    menu.className='hf32-nav-more-menu';
    moreLinks.forEach(a=>menu.append(a));
    details.append(summary,menu);
    nav.replaceChildren(...coreLinks,details);
    nav.classList.add('hf32-universal-nav');
    nav.dataset.hf32Ready='1';
    nav.dataset.hf32Lang=langKey;

    const close=()=>{
      details.open=false;
      nav.classList.remove('is-open');
      q('.menu-toggle',nav.parentElement)?.setAttribute('aria-expanded','false');
    };
    moreLinks.concat(coreLinks).forEach(a=>a.addEventListener('click',close));
    if(document.documentElement.dataset.hf32NavBound!=='1'){
      document.documentElement.dataset.hf32NavBound='1';
      document.addEventListener('click',e=>{
        qa('.hf32-nav-more[open]').forEach(open=>{if(!open.contains(e.target))open.open=false;});
      });
      document.addEventListener('keydown',e=>{
        if(e.key!=='Escape')return;
        const open=q('.hf32-nav-more[open]');
        if(!open)return;
        open.open=false;
        q(':scope>summary',open)?.focus();
      });
    }
  }

  function simplifyFooter(){
    const nav=q('footer .footer-links');
    if(!nav)return;
    const items=isEs()?[
      ['/es/centro-de-ayuda/','Centro de ayuda'],
      ['/es/negocios/','Para negocios'],
      ['/membership-start/','Membresía'],
      ['/privacy/','Privacidad'],
      ['/terms/','Términos'],
      ['/accessibility/','Accesibilidad']
    ]:[
      ['/community-help-center/','Help Center'],
      ['/business-dashboard/','For businesses'],
      ['/membership-start/','Membership'],
      ['/privacy/','Privacy'],
      ['/terms/','Terms'],
      ['/accessibility/','Accessibility']
    ];
    nav.replaceChildren(...items.map(([href,label])=>{
      const a=document.createElement('a');a.href=href;a.textContent=label;return a;
    }));
  }

  function makeDisclosure(summaryEn,summaryEs,content,className){
    const details=document.createElement('details');
    details.className=className;
    details.dataset.hf32SummaryEn=summaryEn;
    details.dataset.hf32SummaryEs=summaryEs;
    details.setAttribute('data-franklin-native-locale','');
    const summary=document.createElement('summary');
    summary.textContent=tx(summaryEn,summaryEs);
    const body=document.createElement('div');
    body.className=`${className}-body`;
    if(Array.isArray(content))body.append(...content);
    else if(content)body.append(content);
    details.append(summary,body);
    return details;
  }

  function collapseSectionContents(section,summaryEn,summaryEs,className){
    if(!section||section.dataset.hf32Collapsed==='1')return;
    const wrap=q(':scope>.wrap',section)||section;
    const children=[...wrap.children];
    if(!children.length)return;
    const details=makeDisclosure(summaryEn,summaryEs,children,className);
    wrap.append(details);
    section.dataset.hf32Collapsed='1';
  }

  function cleanMoreLabels(scope=document){
    qa('a,button,summary',scope).forEach(el=>{
      const t=normalize(el.textContent);
      if(/^More(?:\s+links)?\s*(?:\.\.\.|…)$/.test(t))el.textContent=tx(t.startsWith('More links')?'More links':'More',t.startsWith('More links')?'Más enlaces':'Más');
      if(/^Más(?:\s+enlaces)?\s*(?:\.\.\.|…)$/.test(t))el.textContent=t.startsWith('Más enlaces')?'Más enlaces':'Más';
    });
  }

  function markOutputState(output){
    if(!output)return;
    const wrap=output.closest('.help-plan-output,.r22-dashboard-card,.explorer-plan,.r32-output,.tool,.card')||output.parentElement;
    const value=normalize(output.textContent);
    const empty=!value||/^(Choose|Select|No |Elija|Seleccione|Ning)/i.test(value);
    wrap?.classList.toggle('hf32-output-empty',empty);
    const actions=wrap&&q('.plan-actions,.actions',wrap);
    if(actions)actions.classList.toggle('hf32-output-actions-empty',empty);
  }

  function compactEmptyOutputs(){
    qa('.output,[data-community-help-output],[data-explorer-output]').forEach(output=>{
      markOutputState(output);
      if(output.dataset.hf32Observed==='1')return;
      output.dataset.hf32Observed='1';
      new MutationObserver(()=>markOutputState(output)).observe(output,{childList:true,subtree:true,characterData:true});
    });
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
      const find=q('a',actions)||document.createElement('a');
      find.href='/claim-profile/';find.className='button primary';nativeText(find,'Find my profile','Buscar mi perfil');
      const missing=document.createElement('a');
      missing.href='/claim-profile/?source=member-profile-preview&missing=1';missing.className='r41-secondary-action button';nativeText(missing,"I don't see my business","No encuentro mi negocio");
      actions.replaceChildren(find,missing);
    }
    const form=q('[data-r28-preview-form]');
    if(form){
      nativeText(q('h2',form),'Preview your profile','Vista previa de su perfil');
      const city=qa('label',form).find(l=>/Actual city or location/i.test(l.textContent||''));
      if(city&&!q('.hf32-field-help',city)){
        const help=document.createElement('span');help.className='hf32-field-help';
        nativeText(help,"Use the business's actual city or service area.",'Use la ciudad real o el área de servicio del negocio.');
        city.append(help);
      }
    }
    const plan=q('.r29-plan-grid')?.closest('.section');
    if(plan){
      plan.classList.add('hf32-membership-section');
      q('.r29-one-action',plan)?.remove();
      const card=q('.r29-plan',plan);
      if(card&&!q('.hf32-join',card)){
        const button=document.createElement('a');
        button.href='/membership-start/';button.className='button primary hf32-join';
        nativeText(button,'Join for $35/year','Unirse por $35/año');
        card.append(button);
      }
    }
    const free=qa('main>.section').find(s=>/Free profile controls remain separate|Controles.*perfil/i.test(s.textContent||''));
    if(free){
      free.classList.add('hf32-free-control');
      const left=q('.r22-split>div:first-child',free);
      if(left){
        nativeText(q('h2',left),'Need to correct or remove a profile?','¿Necesita corregir o retirar un perfil?');
        nativeText(q('p',left),'Factual corrections and removal from public view are free. Membership is not required.','Las correcciones de datos y el retiro de la vista pública son gratuitos. No se requiere membresía.');
        const a=q('.actions',left);
        if(a){
          const one=document.createElement('a');one.href='/corrections/';one.className='button';
          nativeText(one,'Correct or remove a profile','Corregir o retirar un perfil');
          a.replaceChildren(one);
        }
      }
    }
    const contact=qa('main>.section').find(s=>q('.r32-contact-recheck',s));
    if(contact){
      const box=q('.r32-contact-recheck',contact);
      const p=q('p',box);
      const details=makeDisclosure('About profile information','Sobre la información del perfil',p?[p]:[],'hf32-policy-details');
      contact.replaceChildren(document.createElement('div'));
      contact.firstElementChild.className='wrap';
      contact.firstElementChild.append(details);
    }
    qa('main>.section').find(s=>/Turn the preview into a first-value checklist|Convierta.*vista previa/i.test(s.textContent||''))?.remove();
  }

  function refineToday(){
    if(!['/today/','/es/hoy/'].includes(path()))return;
    document.body.classList.add('hf32-today');
    const hero=q('main>.r22-hero');
    if(hero){
      hero.classList.add('hf32-today-hero');
      nativeText(q('.eyebrow',hero),'Franklin today','Franklin hoy');
      nativeText(q('h1',hero),'Today in Franklin','Hoy en Franklin');
      nativeText(q('p',hero),'Current events, notices and local information that may affect your day.','Eventos, avisos e información local actual que pueden afectar su día.');
      q('.actions',hero)?.remove();
    }
    q('[data-today-grid]')?.closest('.section')?.classList.add('hf32-today-current');
    const bridge=qa('main>.section').find(s=>/Keep exploring after today|Seguir explorando después de hoy/i.test(s.textContent||''));
    if(bridge){
      nativeText(q('.eyebrow',bridge),'More around Franklin','Más en Franklin');
      nativeText(q('h2',bridge),'Looking for something that happens regularly?','¿Busca algo que ocurra con regularidad?');
      nativeText(q(':scope>.wrap>p',bridge),'Explore Franklin sports, classes, arts and outdoor activities.','Explore deportes, clases, arte y actividades al aire libre en Franklin.');
      const a=q('.actions',bridge);
      if(a){
        const first=q('a',a);
        if(first){first.href='/activities/';nativeText(first,'Explore activities','Explorar actividades');first.className='button primary';a.replaceChildren(first);}
      }
    }
    const trust=q('.r22-trust-strip');
    if(trust){
      const section=trust.closest('.section');
      collapseSectionContents(section,'How we keep Today current','Cómo mantenemos Hoy actualizado','hf32-today-method');
    }
  }

  function refineTasks(){
    if(!['/get-it-done/','/es/hacerlo/'].includes(path()))return;
    document.body.classList.add('hf32-tasks');
    const hero=q('main>.r22-hero');
    if(hero){
      nativeText(q('.eyebrow',hero),'Get it done','Resolver tareas');
      nativeText(q('p',hero),'Describe what you need or choose a common task. Your checklist can stay private on this device.','Describa lo que necesita o elija una tarea común. Su lista puede permanecer privada en este dispositivo.');
    }
    const grid=q('[data-task-grid]');
    if(grid){
      const cards=qa(':scope>.task-card',grid);
      cards.slice(6).forEach(c=>c.classList.add('hf32-secondary-task'));
      if(cards.length>6&&!q('.hf32-task-see-all',grid.parentElement)){
        const b=document.createElement('button');b.type='button';b.className='button hf32-task-see-all';
        nativeText(b,'See all tasks','Ver todas las tareas');
        b.addEventListener('click',()=>{
          document.body.classList.toggle('hf32-show-all-tasks');
          nativeText(b,document.body.classList.contains('hf32-show-all-tasks')?'Show common tasks':'See all tasks',document.body.classList.contains('hf32-show-all-tasks')?'Mostrar tareas comunes':'Ver todas las tareas');
        });
        grid.after(b);
      }
      const search=q('[data-task-search]');
      search?.addEventListener('input',()=>document.body.classList.toggle('hf32-task-filtering',Boolean(search.value.trim())));
    }
  }

  function refineCommunity(){
    if(!['/community/','/es/comunidad/'].includes(path()))return;
    document.body.classList.add('hf32-community');
    qa('main .grid').forEach(grid=>grid.classList.add('hf32-responsive-grid'));
    const hero=q('main>[class*="hero"]');
    if(hero)hero.classList.add('hf32-community-hero');
  }

  function refineMyFranklin(){
    if(!['/my-franklin/','/es/mi-franklin/'].includes(path()))return;
    document.body.classList.add('hf32-my');
    q('main>.r22-hero')?.classList.add('hf32-workspace-hero');
    const prefs=q('.r22-dashboard-side details.r22-dashboard-card');
    if(prefs){prefs.removeAttribute('open');prefs.classList.add('hf32-my-preferences');}
    const output=q('[data-my-franklin-output]');
    if(output){
      nativeText(q('h2',output),'Your Franklin dashboard','Su panel de Franklin');
      nativeText(q('p',output),'Choose what matters to you and keep useful Franklin shortcuts on this device.','Elija lo que le importa y conserve atajos útiles de Franklin en este dispositivo.');
    }
    const address=q('.r22-dashboard-side .r22-dashboard-card:not(details)');
    if(address)nativeText(q('h2',address),'Address lookups','Consultas por dirección');
    qa('.r22-dashboard-card').forEach(card=>card.classList.add('hf32-compact-dashboard-card'));
    compactEmptyOutputs();
  }

  function refineBusiness(){
    if(!['/business-dashboard/','/es/negocios/'].includes(path()))return;
    document.body.classList.add('hf32-business');
    const hero=q('.r29-hero');
    if(hero){
      hero.classList.add('hf32-business-hero');
      nativeText(q('.r29-lead',hero),'Find or review your public profile, use free Franklin business tools, and see what Community Membership can add.','Busque o revise su perfil público, use herramientas gratuitas para negocios de Franklin y vea lo que puede añadir la Membresía Comunitaria.');
      const actions=q('.actions',hero);
      if(actions){
        const profile=qa('a',actions).find(a=>/claim-profile/.test(a.getAttribute('href')||''));
        const member=qa('a',actions).find(a=>/member-profile-preview/.test(a.getAttribute('href')||''));
        if(profile&&member){
          profile.className='button primary';
          member.className='r41-secondary-action button';
          nativeText(profile,'Find or review my profile','Buscar o revisar mi perfil');
          nativeText(member,'See Community Membership','Ver la Membresía Comunitaria');
          actions.replaceChildren(profile,member);
        }
      }
      q('.r29-local-card',hero)?.classList.add('hf32-business-digital-card');
    }

    const pathSection=qa('main>.section').find(s=>/Your Franklin community path|Su camino.*Franklin/i.test(s.textContent||''));
    collapseSectionContents(pathSection,'How it works','Cómo funciona','hf32-business-how');

    const panels=qa('main>.section .r29-panel');
    if(panels[0]){
      nativeText(q('h3',panels[0]),'A richer local profile','Un perfil local más completo');
      nativeText(q('p',panels[0]),'After representation is confirmed, add business-provided descriptions, services, images, contact links, accessibility and language details.','Después de confirmar la representación, añada descripciones, servicios, imágenes, enlaces de contacto, accesibilidad e información de idioma proporcionados por el negocio.');
    }
    if(panels[1]){
      nativeText(q('h3',panels[1]),'Community participation','Participación comunitaria');
      nativeText(q('p',panels[1]),'Use supported offers, events and community tools to stay visible and useful locally. Membership does not equal endorsement.','Use ofertas, eventos y herramientas comunitarias disponibles para mantener una presencia local útil. La membresía no equivale a una recomendación.');
    }
    if(panels[2]){
      nativeText(q('h3',panels[2]),'Local growth planning','Planificación de crecimiento local');
      nativeText(q('p',panels[2]),'Plan local outreach, promotions and English, Spanish or bilingual communications with practical guidance.','Planifique alcance local, promociones y comunicaciones en inglés, español o ambos con orientación práctica.');
    }

    const plan=q('.r29-plan-grid')?.closest('.section');
    if(plan){
      plan.classList.add('hf32-business-membership-section');
      const card=q('.r29-plan',plan);
      if(card){
        card.classList.add('hf32-business-membership-card');
        if(!q('.hf32-business-member-cta',card)){
          const a=document.createElement('a');a.href='/member-profile-preview/';a.className='button primary hf32-business-member-cta';
          nativeText(a,'See Community Membership','Ver la Membresía Comunitaria');
          card.append(a);
        }
      }
      q('.r29-one-action',plan)?.remove();
    }

    const optional=qa('main>.section').find(s=>/Membership remains optional|La membresía.*opcional/i.test(s.textContent||''));
    optional?.classList.add('hf32-business-free-section');

    const starter=q('.r34-growth-band');
    if(starter){
      nativeText(q('h2',starter),'Try the free tools first','Pruebe primero las herramientas gratuitas');
      nativeText(q('p',starter),'Build a free starter plan, review your public profile, and decide which local actions would help your organization most.','Cree un plan inicial gratuito, revise su perfil público y decida qué acciones locales ayudarían más a su organización.');
      const actions=q('.actions',starter);
      if(actions){
        const first=qa('a',actions)[0],second=qa('a',actions)[1];
        if(first)nativeText(first,'Build a free starter plan','Crear un plan inicial gratuito');
        if(second)nativeText(second,'See Community Membership','Ver la Membresía Comunitaria');
      }
    }
  }

  function helpOutputState(){
    const output=q('[data-community-help-output]');
    if(!output)return;
    const aside=output.closest('.help-plan-output');
    const empty=/Choose one or more broad topics|Elija uno o más temas|Seleccione/i.test(normalize(output.textContent));
    aside?.classList.toggle('hf32-help-plan-empty',empty);
  }

  function refineHelpCenter(){
    if(!['/community-help-center/','/es/centro-de-ayuda/'].includes(path()))return;
    document.body.classList.add('hf32-help');
    const hero=q('.help-hero');
    const urgent=q('#urgent-help');
    const planner=q('#make-a-plan');
    const photo=q('main>.local-hero-photo');

    if(hero){
      hero.classList.add('hf32-help-hero');
      const actions=q('.actions',hero);
      if(actions){
        const urgentLink=qa('a',actions).find(a=>(a.getAttribute('href')||'')==='#urgent-help');
        const planLink=qa('a',actions).find(a=>(a.getAttribute('href')||'')==='#make-a-plan');
        const everyday=qa('a',actions).find(a=>/everyday-help/.test(a.getAttribute('href')||''));
        if(urgentLink&&planLink){
          urgentLink.className='button primary';
          planLink.className='r41-secondary-action button';
          nativeText(urgentLink,'Get urgent help','Obtener ayuda urgente');
          nativeText(planLink,'Make a private help plan','Crear un plan de ayuda privado');
          actions.replaceChildren(urgentLink,planLink);
          if(everyday){
            const more=makeDisclosure('More help','Más ayuda',[everyday],'hf32-inline-more');
            actions.append(more);
          }
        }
      }
    }

    if(hero&&urgent&&urgent.previousElementSibling!==hero)hero.after(urgent);
    if(photo&&planner&&photo.previousElementSibling!==planner){
      planner.after(photo);
      photo.classList.add('hf32-help-photo');
    }

    const form=q('[data-community-help-planner]');
    if(form){
      const fine=qa('.fine-print',form).find(p=>/No account, server submission|sin cuenta|servidor/i.test(p.textContent||''));
      if(fine)nativeText(fine,'Your selections stay in this tab and are not sent to Franklin Navigator.','Sus selecciones permanecen en esta pestaña y no se envían a Franklin Navigator.');
    }

    const output=q('[data-community-help-output]');
    if(output&&output.dataset.hf32HelpObserved!=='1'){
      output.dataset.hf32HelpObserved='1';
      helpOutputState();
      new MutationObserver(helpOutputState).observe(output,{childList:true,subtree:true,characterData:true});
    }

    const tools=qa('main>.section').find(s=>/Free self-help and navigation tools|Herramientas.*autoayuda/i.test(s.textContent||''));
    if(tools){
      tools.classList.add('hf32-help-tools');
      nativeText(q('.eyebrow',tools),'Helpful tools','Herramientas útiles');
      const cards=qa('.help-tool-grid .card',tools);
      cards.forEach(card=>{
        const p=q('p',card);
        if(!p)return;
        const n=normalize(p.textContent);
        if(/Search 24 everyday paths backed by 194/i.test(n))nativeText(p,'Search official Franklin-area and Tennessee resources for common needs.','Busque recursos oficiales del área de Franklin y Tennessee para necesidades comunes.');
        if(/Search and compare 19,103 local/i.test(n))nativeText(p,'Search Franklin-area business, professional, civic and community listings. Membership does not change ordinary directory placement.','Busque listados de negocios, profesionales, entidades cívicas y comunitarias del área de Franklin. La membresía no cambia la ubicación normal en el directorio.');
      });
    }

    const prep=q('.preparation-bridge');
    if(prep){
      prep.classList.add('hf32-help-deeper');
      nativeText(q('.eyebrow',prep),'More focused help','Ayuda más específica');
      nativeText(q('h2',prep),'Prepare your next steps privately.','Prepare sus próximos pasos de forma privada.');
      nativeText(q('p',prep),'Choose a broad area and build a private checklist of steps, questions and useful local sources. Nothing is uploaded or submitted.','Elija un área general y cree una lista privada de pasos, preguntas y fuentes locales útiles. No se carga ni se envía nada.');
    }
    const pathways=q('.local-pathways-bridge');
    if(pathways){
      pathways.classList.add('hf32-help-deeper');
      nativeText(q('.eyebrow',pathways),'Everyday Franklin help','Ayuda cotidiana en Franklin');
    }
    const situation=q('.situation-bridge');
    if(situation){
      situation.classList.add('hf32-help-deeper');
      nativeText(q('.eyebrow',situation),'Help across connected needs','Ayuda para necesidades relacionadas');
    }
    compactEmptyOutputs();
  }

  function explorerScope(){
    return document.body.dataset.explorerScope||'all';
  }

  function tuneExplorerResults(root){
    const grid=q('[data-explorer-grid]',root),summary=q('[data-explorer-summary]',root),controls=q('.explorer-controls',root);
    if(!grid)return;
    const cards=qa('.explorer-card',grid);
    if(!cards.length)return;
    const small=cards.length<=4;
    root.classList.toggle('hf32-explorer-small-results',small);
    if(controls)controls.classList.toggle('hf32-explorer-controls-hidden',small);
    if(small&&summary)summary.textContent=tx(`${cards.length} local option${cards.length===1?'':'s'}`,`${cards.length} opción${cards.length===1?'':'es'} local${cards.length===1?'':'es'}`);
  }

  function refineExplorer(){
    const root=q('[data-community-explorer]');
    if(!root)return;
    document.body.classList.add('hf32-explorer');
    root.classList.add('hf32-explorer-root');
    const hero=q('.explorer-hero',root),finder=q('#finder',root);
    if(hero){
      hero.classList.add('hf32-explorer-hero');
      const aside=q('.explorer-hero-card',hero);
      if(aside)aside.classList.add('hf32-explorer-hero-secondary');
      const langLinks=qa('.actions a',hero).filter(a=>a.hasAttribute('hreflang')||/español|english|inglés/i.test(a.textContent||''));
      langLinks.forEach(a=>a.remove());
    }
    if(hero&&finder&&finder.previousElementSibling!==hero)hero.after(finder);

    let other=q('.hf31-explorer-other,.hf32-explorer-other',root);
    if(other){
      other.classList.add('hf32-explorer-other');
    }else{
      const activity=qa(':scope>section',root).find(s=>/Activity hubs|Centros de actividades/i.test(s.getAttribute('aria-label')||''));
      const sports=q('.explorer-sport-routes',root);
      if(activity||sports){
        const section=document.createElement('section');section.className='section hf31-explorer-other hf32-explorer-other';
        const wrap=document.createElement('div');wrap.className='wrap';
        const details=document.createElement('details');details.className='hf31-explorer-other-details hf32-explorer-other-details';
        details.setAttribute('data-franklin-native-locale','');
        const summary=document.createElement('summary');summary.textContent=tx('Explore other sports and activities','Explorar otros deportes y actividades');
        const content=document.createElement('div');content.className='hf31-explorer-other-content';
        if(activity){
          const inner=q('.wrap',activity);
          if(inner)content.append(...[...inner.children]);
          activity.remove();
        }
        if(sports){
          const inner=q('.wrap',sports);
          if(inner)content.append(...[...inner.children]);
          sports.remove();
        }
        details.append(summary,content);wrap.append(details);section.append(wrap);
        (finder||hero)?.after(section);
      }
    }

    const preparation=qa(':scope>section',root).find(s=>/Check the details before you register|Three things to check|Confirme los detalles antes de inscribirse|Tres cosas/i.test(s.textContent||''));
    if(preparation){
      preparation.classList.add('hf32-explorer-prep');
      q('ul.check-list',preparation)?.remove();
    }

    const current=q('[data-explorer-current-section]',root);
    if(current){
      current.classList.add('hf32-explorer-current');
      const grid=q('[data-explorer-current]',current),empty=q('[data-explorer-current-empty]',current);
      const tune=()=>{
        const has=grid&&qa('.explorer-current-card',grid).length>0;
        const settled=empty&&!empty.hidden;
        if(has)current.hidden=false;
        else if(settled)current.hidden=true;
      };
      if(grid&&grid.dataset.hf32Observed!=='1'){
        grid.dataset.hf32Observed='1';
        new MutationObserver(tune).observe(grid,{childList:true,subtree:true});
      }
      setTimeout(tune,1300);
    }

    if(explorerScope()!=='all'){
      const address=q('.explorer-address',root);
      address?.closest('section')?.remove();
    }

    const shortlist=q('#short-list',root);
    if(shortlist){
      shortlist.classList.add('hf32-explorer-shortlist-section');
      if(shortlist.dataset.hf32Bound!=='1'){
        shortlist.dataset.hf32Bound='1';
        shortlist.hidden=true;
        q('[data-explorer-build]',root)?.addEventListener('click',()=>{shortlist.hidden=false;});
        q('[data-explorer-clear]',root)?.addEventListener('click',()=>{shortlist.hidden=true;});
      }
    }

    const coverage=qa(':scope>section',root).find(s=>/What these results include|Qué incluyen estos resultados/i.test(s.textContent||''));
    if(coverage){
      coverage.classList.add('hf32-explorer-coverage');
      collapseSectionContents(coverage,'How these listings work','Cómo funcionan estos listados','hf32-explorer-method');
    }

    const organizer=qa(':scope>section',root).find(s=>/Run a local team, program, venue or business|Manage your Franklin presence|Administre su presencia/i.test(s.textContent||''));
    organizer?.classList.add('hf32-explorer-organizer');

    const grid=q('[data-explorer-grid]',root);
    if(grid&&grid.dataset.hf32TuneObserved!=='1'){
      grid.dataset.hf32TuneObserved='1';
      new MutationObserver(()=>{tuneExplorerResults(root);cleanMoreLabels(grid);}).observe(grid,{childList:true,subtree:true});
    }
    setTimeout(()=>tuneExplorerResults(root),450);
    setTimeout(()=>tuneExplorerResults(root),1500);
  }

  function refineSports(){
    if(!['/sports/','/es/deportes/'].includes(path()))return;
    document.body.classList.add('hf32-sports');
    const hero=q('.explorer-hero');
    if(hero){
      nativeText(q('.explorer-kicker',hero),'Sports in Franklin','Deportes en Franklin');
      nativeText(q('h1',hero),'Find sports in Franklin','Encuentre deportes en Franklin');
      nativeText(q('p',hero),'Search or choose a sport to see relevant local programs, leagues, lessons and places to play.','Busque o elija un deporte para ver programas, ligas, clases y lugares locales donde jugar.');
      const a=q('.actions a[href="#finder"]',hero);
      if(a)nativeText(a,'Find sports','Buscar deportes');
    }
  }

  function cleanDirectoryCard(card){
    if(!card)return;
    qa('.meta',card).forEach(meta=>{
      const t=normalize(meta.textContent);
      if(/^Source date:/i.test(t))meta.textContent=t.replace(/^Source date:/i,tx('Last checked:','Última revisión:'));
    });
    qa('p',card).forEach(p=>{
      const t=normalize(p.textContent);
      const m=t.match(/^Public IRS filing address geocoded in Williamson County:\s*(.+)$/i);
      if(m)p.textContent=tx(`Public filing address: ${m[1]}`,`Dirección de registro público: ${m[1]}`);
    });
    q('.category-tag',card)?.classList.add('hf32-category-label');
    cleanMoreLabels(card);
  }

  function directoryHasFilters(root){
    return Boolean(q('[data-dir-search]',root)?.value.trim()||
      q('[data-dir-category]',root)?.value||
      q('[data-dir-type]',root)?.value||
      q('[data-dir-area]',root)?.value||
      qa('[data-dir-fact]:checked',root).length);
  }

  function refineDirectory(){
    if(!['/directory/','/es/directorio/'].includes(path()))return;
    document.body.classList.add('hf32-directory');
    const hero=q('main>.r22-hero');
    if(hero){
      hero.classList.add('hf32-directory-hero');
      nativeText(q('h1',hero),'Find local businesses, services and organizations.','Encuentre negocios, servicios y organizaciones locales.');
      nativeText(q('p',hero),'Search Franklin-area businesses, services, professionals and organizations by name, category or place.','Busque negocios, servicios, profesionales y organizaciones del área de Franklin por nombre, categoría o lugar.');
    }
    const root=q('[data-franklin-discovery]');
    if(!root)return;
    root.classList.add('hf32-directory-root');

    if(!q('.hf32-directory-shortcuts',root)){
      const shortcuts=document.createElement('nav');
      shortcuts.className='hf32-directory-shortcuts';
      shortcuts.setAttribute('aria-label',tx('Popular directory searches','Búsquedas populares del directorio'));
      const label=document.createElement('span');label.className='hf32-directory-shortcuts-label';label.textContent=tx('Try','Pruebe');
      const items=isEs()?[
        ['restaurante','Restaurantes'],['hogar','Servicios para el hogar'],['salud','Salud'],['legal','Servicios legales'],['inmobiliaria','Bienes raíces'],['auto','Automotriz'],['organización','Organizaciones']
      ]:[
        ['restaurant','Restaurants'],['home','Home services'],['health','Health'],['legal','Legal services'],['real estate','Real estate'],['auto','Automotive'],['nonprofit','Community organizations']
      ];
      shortcuts.append(label,...items.map(([query,labelText])=>{
        const a=document.createElement('a');
        a.href=`${path()}?q=${encodeURIComponent(query)}`;
        a.textContent=labelText;
        return a;
      }));
      const meta=q('.r22-directory-meta',root);
      (meta||q('[data-dir-results]',root))?.before(shortcuts);
    }

    const count=q('[data-dir-count]',root),grid=q('[data-dir-results]',root);
    const update=()=>{
      const filtered=directoryHasFilters(root);
      document.body.classList.toggle('hf32-directory-has-query',filtered);
      document.body.classList.toggle('hf32-directory-default-browse',!filtered);
      if(!filtered&&count)count.textContent=tx('Browse local profiles','Explorar perfiles locales');
      if(grid)qa('.r22-profile-result',grid).forEach(cleanDirectoryCard);
    };
    if(root.dataset.hf32DirectoryBound!=='1'){
      root.dataset.hf32DirectoryBound='1';
      root.addEventListener('input',()=>setTimeout(update,0));
      root.addEventListener('change',()=>setTimeout(update,0));
      if(grid)new MutationObserver(()=>setTimeout(update,0)).observe(grid,{childList:true,subtree:true});
    }
    setTimeout(update,0);
    setTimeout(update,800);
  }

  function genericCleanup(){
    document.body.classList.add('hf32-site-cleanup');
    cleanMoreLabels(document);
    qa('.empty-state').forEach(el=>el.classList.add('hf32-empty-state'));
    qa('.grid.three,.grid.four').forEach(grid=>grid.classList.add('hf32-shared-grid'));
    compactEmptyOutputs();
  }

  function init(){
    genericCleanup();
    universalNav();
    simplifyFooter();
    memberPreview();
    refineToday();
    refineTasks();
    refineCommunity();
    refineMyFranklin();
    refineBusiness();
    refineHelpCenter();
    refineExplorer();
    refineSports();
    refineDirectory();
    syncNative();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});
  else setTimeout(init,0);
  window.addEventListener('load',()=>{setTimeout(init,120);setTimeout(init,900);},{once:true});
  window.addEventListener('franklinlanguagechange',()=>setTimeout(init,0));
})();
