'use strict';
(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const path=()=>location.pathname;
  const isEs=()=>document.documentElement.lang==='es'||path().startsWith('/es/');
  const tx=(en,es)=>isEs()?es:en;
  const PROFILE_RE=/^\/profiles\/[^/]+\/$/;
  const HOME_RE=/^(?:\/|\/es\/)$/;
  const TODAY_RE=/^(?:\/today\/|\/es\/hoy\/)$/;
  const TASK_RE=/^(?:\/get-it-done\/|\/es\/hacerlo\/)$/;
  const DIR_RE=/^(?:\/directory\/|\/es\/directorio\/)$/;

  function ensureLateCss(){
    if(document.querySelector('link[data-hf31-public]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='/assets/hf31-public.css';link.dataset.hf31Public='1';
    document.head.append(link);
  }

  function nativeText(el,en,es){
    if(!el)return;
    el.dataset.hf31En=en;el.dataset.hf31Es=es;
    el.setAttribute('data-franklin-native-locale','');
    el.textContent=tx(en,es);
  }

  function syncNativeLanguage(){
    qa('[data-hf31-en]').forEach(el=>{el.textContent=tx(el.dataset.hf31En||'',el.dataset.hf31Es||'')});
    qa('[data-hf31-summary-en]').forEach(details=>{
      const summary=q(':scope > summary',details);
      if(summary)summary.textContent=tx(details.dataset.hf31SummaryEn||'More',details.dataset.hf31SummaryEs||'Más');
    });
    const taskSelect=q('.hf31-task-category-select select');
    if(taskSelect){
      const buttons=qa('[data-task-categories] button[data-category]');
      [...taskSelect.options].forEach((o,i)=>{if(buttons[i])o.textContent=buttons[i].textContent.trim()});
      taskSelect.setAttribute('aria-label',tx('Filter tasks by category','Filtrar tareas por categoría'));
    }
  }

  function integrateLanguageSwitch(){
    const bar=q('.r37-language-switch'),top=q('header .top');
    if(!bar||!top||top.contains(bar))return;
    bar.classList.add('hf31-language-inline');
    top.append(bar);
  }

  function makeMore(items,en='More',es='Más',extraClass=''){
    const details=document.createElement('details');
    details.className=`hf31-more ${extraClass}`.trim();
    details.dataset.hf31SummaryEn=en;details.dataset.hf31SummaryEs=es;
    details.setAttribute('data-franklin-native-locale','');
    const summary=document.createElement('summary');summary.textContent=tx(en,es);
    const menu=document.createElement('div');menu.className='hf31-more-menu';items.forEach(item=>menu.append(item));
    details.append(summary,menu);
    details.addEventListener('toggle',()=>{
      if(!details.open)return;
      qa('details.hf31-more[open]').forEach(other=>{if(other!==details)other.open=false});
    });
    return details;
  }

  function compactEmptyAssistantSave(){
    if(!HOME_RE.test(path()))return;
    const saved=q('.navigator-bot .r38-assistant-save');if(!saved)return;
    const update=()=>{
      const empty=q('.empty-state',saved);
      const substantive=qa(':scope > *',saved).some(el=>el!==empty&&!el.hidden&&el.textContent.trim());
      saved.hidden=Boolean(empty&&!substantive);
    };
    update();
    if(saved.dataset.hf31Observed!=='1'){
      saved.dataset.hf31Observed='1';new MutationObserver(update).observe(saved,{childList:true,subtree:true,characterData:true});
    }
  }

  function suppressExpiredDatedContent(){
    const isHome=HOME_RE.test(path()),isToday=TODAY_RE.test(path());
    if(!isHome&&!isToday)return;
    const scope=isHome?(q('[data-home-events]')||document):(q('[data-today-grid]')||document);
    const cards=qa('[data-event-end]',scope);const now=Date.now();let nonExpired=0;
    for(const card of cards){
      const end=Date.parse(card.dataset.eventEnd||'');
      const expired=Number.isFinite(end)&&end<now;
      if(expired){card.hidden=true;card.setAttribute('aria-hidden','true');card.dataset.hf31Expired='1'}
      else {card.removeAttribute('aria-hidden');delete card.dataset.hf31Expired;nonExpired++}
    }
    if(isHome){
      document.body.classList.add('hf31-home');
      const grid=q('[data-home-events]'),empty=q('[data-home-events-empty]');
      if(grid)grid.classList.add('hf31-home-events');
      if(empty){empty.classList.add('hf31-home-events-empty');empty.hidden=nonExpired!==0}
    }else document.body.classList.add('hf31-today');
  }

  function refineHome(){
    if(!HOME_RE.test(path()))return;
    document.body.classList.add('hf31-home');
    q('.r24-home-hero')?.classList.add('hf31-home-hero');
    q('.navigator-bot.r24-ask')?.classList.add('hf31-home-assistant');
    q('.r30-home-bridge')?.classList.add('hf31-home-bridge');
    q('.r24-around')?.classList.add('hf31-home-around');
    const activities=qa('main > section.section').find(s=>q('a[href*="/youth-family/"]',s)&&q('a[href*="/sports/"]',s)&&q('a[href*="/outdoors/"]',s));
    if(activities)activities.classList.add('hf31-home-activities');
    qa('main > section.section .r22-split').forEach(split=>split.closest('.section')?.classList.add('hf31-home-support-section'));
    q('.r22-history')?.classList.add('hf31-home-history');
    compactEmptyAssistantSave();
  }

  function refineToday(){
    if(!TODAY_RE.test(path()))return;
    document.body.classList.add('hf31-today');
    q('main > .r22-hero')?.classList.add('hf31-page-hero');
    const current=q('[data-today-grid]');
    current?.closest('.section')?.classList.add('hf31-today-current');
    const disclosure=qa('details.r22-disclosure').find(d=>/Official Franklin sources|Fuentes oficiales de Franklin/i.test(q(':scope > summary',d)?.textContent||''));
    disclosure?.closest('.section')?.classList.add('hf31-today-sources-section');
    qa('main > .section').forEach(section=>{
      if(/Keep exploring after today|Seguir explorando después de hoy/i.test(section.textContent||''))section.classList.add('hf31-today-explore');
    });
  }

  function simplifyTaskCategories(){
    const group=q('[data-task-categories]');
    if(!group||group.dataset.hf31Ready==='1')return;
    const buttons=qa('button[data-category]',group);if(!buttons.length)return;
    const label=document.createElement('label');label.className='hf31-task-category-select';label.setAttribute('data-franklin-native-locale','');
    const span=document.createElement('span');nativeText(span,'Category','Categoría');
    const select=document.createElement('select');select.setAttribute('aria-label',tx('Filter tasks by category','Filtrar tareas por categoría'));
    buttons.forEach((button,index)=>{
      const option=document.createElement('option');option.value=button.dataset.category||String(index);option.textContent=button.textContent.trim();
      if(button.classList.contains('active'))option.selected=true;select.append(option);
      button.addEventListener('click',()=>{select.value=button.dataset.category||String(index)});
    });
    select.addEventListener('change',()=>buttons.find(b=>(b.dataset.category||'')===select.value)?.click());
    label.append(span,select);group.after(label);group.dataset.hf31Ready='1';
  }

  function compactTaskCards(){
    qa('.task-card').forEach(card=>{
      if(card.dataset.hf31Ready==='1')return;
      const primary=q(':scope > a.button.primary',card);
      const save=q(':scope > [data-r22-remind]',card);
      if(primary)primary.classList.add('hf31-task-primary');
      if(save){card.append(makeMore([save],'Save / more','Guardar / más','hf31-task-more'))}
      card.dataset.hf31Ready='1';
    });
  }

  function refineTasks(){
    if(!TASK_RE.test(path()))return;
    document.body.classList.add('hf31-tasks');
    q('main > .r22-hero')?.classList.add('hf31-page-hero','hf31-task-hero');
    simplifyTaskCategories();compactTaskCards();
    q('[data-task-grid]')?.classList.add('hf31-task-grid');
    const how=qa('main > .section').find(s=>/How tasks work|Cómo funcionan las tareas/i.test(s.textContent||''));
    how?.classList.add('hf31-task-how');
  }

  function refineDirectoryResult(card){
    if(!card||card.dataset.hf31Ready==='1')return;
    q('.category-tag',card)?.classList.add('hf31-result-category');
    q('.result-facts',card)?.classList.add('hf31-result-facts');
    const actions=q('.result-actions',card);
    if(actions){
      const compare=q('[data-compare-id]',actions);if(compare)compare.classList.add('hf31-compare-quiet');
      q('.primary',actions)?.classList.add('hf31-open-profile');
    }
    card.dataset.hf31Ready='1';
  }

  function refineDirectory(){
    if(!DIR_RE.test(path()))return;
    document.body.classList.add('hf31-directory');
    q('main > .r22-hero')?.classList.add('hf31-page-hero','hf31-directory-hero');
    const root=q('[data-franklin-discovery]');if(!root)return;
    root.classList.add('hf31-directory-root');
    q('.r22-directory-toolbar',root)?.classList.add('hf31-directory-toolbar');
    q('.discovery-share',root)?.classList.add('hf31-directory-share');
    q('[data-dir-results]',root)?.classList.add('hf31-directory-results');
    qa('.r22-profile-result',root).forEach(refineDirectoryResult);
    const results=q('[data-dir-results]',root);
    if(results&&results.dataset.hf31Observed!=='1'){
      results.dataset.hf31Observed='1';
      new MutationObserver(()=>qa('.r22-profile-result',results).forEach(refineDirectoryResult)).observe(results,{childList:true,subtree:true});
    }
  }

  function contactPriority(a){
    const href=(a.getAttribute('href')||'').toLowerCase();
    if(/^https?:/.test(href))return 0;if(href.startsWith('tel:'))return 1;if(href.startsWith('mailto:'))return 2;return 3;
  }

  function compactProfilePrimaryActions(){
    const group=q('.profile-primary-actions');if(!group||group.dataset.hf31Ready==='1')return;
    const items=[...group.children].filter(el=>el.matches('a,button'));if(!items.length)return;
    const ordered=[...items].sort((a,b)=>contactPriority(a)-contactPriority(b));
    items.forEach(el=>el.classList.remove('primary'));
    const primary=ordered[0],secondary=ordered[1]||null;
    primary.classList.add('primary','hf31-profile-primary');group.replaceChildren(primary);
    if(secondary){secondary.classList.add('hf31-profile-secondary');group.append(secondary)}
    const rest=ordered.slice(2);if(rest.length)group.append(makeMore(rest,'More contact options','Más opciones de contacto','hf31-profile-contact-more'));
    group.dataset.hf31Ready='1';
  }

  function compactProfileUtilities(){
    const group=q('.profile-utility-actions');if(!group||group.dataset.hf31Ready==='1')return;
    const items=[...group.children].filter(el=>el.matches('a,button'));if(!items.length)return;
    const save=items.find(el=>/saveprofile=/i.test(el.getAttribute('href')||''))||items[0];
    group.replaceChildren(save);save.classList.add('hf31-profile-save');
    const rest=items.filter(el=>el!==save);if(rest.length)group.append(makeMore(rest,'More tools','Más herramientas','hf31-profile-tools-more'));
    group.dataset.hf31Ready='1';
  }

  function refineProfileCurrentness(heroMain,grid){
    const current=q('.profile-currentness',grid),location=q('.profile-location',heroMain);if(!current||current.dataset.hf31Ready==='1')return;
    current.classList.add('hf31-profile-currentness');current.dataset.hf31Ready='1';
    if(location)location.after(current);else heroMain.prepend(current);
  }

  function refineProfileAbout(article){
    const section=q(':scope > section',article);if(!section)return;
    const h=q('h2',section),p=q('p',section);if(!h||!p)return;
    section.classList.add('hf31-profile-about');
    const text=p.textContent.trim();
    if(/public information about this listing|public-source identity|información.*fuentes públicas|fuller description|descripción.*detallada/i.test(text)){
      nativeText(h,'About this profile','Sobre este perfil');
      nativeText(p,
        'This public-source profile includes the listing’s identity, location and category. Use the contact options above to confirm current services, hours, pricing and availability.',
        'Este perfil de fuentes públicas incluye la identidad, la ubicación y la categoría del listado. Use las opciones de contacto de arriba para confirmar servicios, horarios, precios y disponibilidad actuales.'
      );
    }
  }

  function refineProfileFacts(article){
    const grid=q('.profile-facts-grid',article);if(!grid)return;
    const section=grid.closest('section');if(!section)return;
    section.classList.add('hf31-profile-facts');const h=q('h2',section);if(h)nativeText(h,'At a glance','Datos principales');
  }

  function refineProfileSources(article,side){
    const details=q('#sources details.r22-disclosure',article)||q('details.r22-disclosure',article);if(!details)return;
    details.classList.add('hf31-profile-sources');const summary=q(':scope > summary',details);
    if(summary){summary.dataset.hf31En='Sources & public listing details';summary.dataset.hf31Es='Fuentes y detalles públicos del listado';summary.setAttribute('data-franklin-native-locale','');summary.textContent=tx(summary.dataset.hf31En,summary.dataset.hf31Es)}
    if(!side)return;
    const listing=qa(':scope > section',side).find(card=>/About this listing|Acerca de este listado/i.test(q('h2',card)?.textContent||''));
    const p=listing&&q('p',listing);
    if(p){const note=document.createElement('div');note.className='hf31-listing-note';const strong=document.createElement('strong');nativeText(strong,'How this listing works','Cómo funciona este listado');note.append(strong,p);details.append(note);listing.remove()}
  }

  function refineProfileRelated(side){
    if(!side)return;
    const cards=qa(':scope > section',side);
    const explore=cards.find(card=>/^Explore |^Explorar /i.test(q('h2',card)?.textContent||''));
    const related=cards.find(card=>/Related local profiles|Perfiles locales relacionados/i.test(q('h2',card)?.textContent||''));
    const browse=explore&&q('a',explore);
    if(related){
      related.classList.add('hf31-related-card');const h=q('h2',related);if(h)nativeText(h,'Similar local profiles','Perfiles locales similares');
      if(browse){browse.classList.add('hf31-browse-category');browse.textContent=tx('Browse more in this category','Ver más en esta categoría');related.append(browse)}
    }
    explore?.remove();if(!qa(':scope > section',side).length)side.hidden=true;
  }

  function refineProfileManagement(article){
    const section=qa(':scope > section',article).find(s=>/Suggest a correction or claim this profile|correction.*claim|corrección.*reclamar/i.test(q('h2',s)?.textContent||''));
    if(!section||section.dataset.hf31Ready==='1')return;
    section.classList.add('hf31-profile-management');const h=q('h2',section),p=q('p',section),group=q('.actions',section);
    if(h)nativeText(h,'Manage or correct this profile','Administrar o corregir este perfil');
    if(p)nativeText(p,'Factual corrections are always free. Claiming is a separate access process and does not change public-source information.','Las correcciones de datos siempre son gratuitas. Reclamar un perfil es un proceso de acceso separado y no cambia la información de fuentes públicas.');
    if(group){
      const actions=[...group.children].filter(el=>el.matches('a,button'));
      const claim=actions.find(a=>/\/claim-profile\//.test(a.getAttribute('href')||''));
      const correction=actions.find(a=>/\/corrections\//.test(a.getAttribute('href')||''));
      const member=actions.find(a=>/\/profile-studio\//.test(a.getAttribute('href')||''));
      const used=new Set([claim,correction,member].filter(Boolean));const extras=actions.filter(a=>!used.has(a));group.replaceChildren();group.classList.add('hf31-management-actions');
      if(claim){claim.classList.add('primary','hf31-management-primary');group.append(claim)}
      if(correction){correction.classList.remove('button','primary');correction.classList.add('hf31-management-correction');group.append(correction)}
      const more=[member,...extras].filter(Boolean);if(more.length)group.append(makeMore(more,'More','Más','hf31-management-more'));
    }
    section.dataset.hf31Ready='1';
  }

  function enhanceMemberPublication(){
    const publication=q('[data-member-publication]');if(!publication||publication.dataset.hf31Ready==='1')return;
    publication.classList.add('hf31-member-publication');publication.dataset.hf31Ready='1';
  }

  function refineProfile(){
    if(!PROFILE_RE.test(path()))return;
    document.body.classList.add('hf31-profile-page');
    const hero=q('.r22-profile-hero'),grid=q('.r22-profile-hero-grid',hero);if(!hero||!grid)return;
    hero.classList.add('hf31-profile-hero');grid.classList.add('hf31-profile-hero-grid');
    const avatar=q('.profile-avatar',grid),current=q('.profile-currentness',grid);const heroMain=[...grid.children].find(el=>el!==avatar&&el!==current)||grid.children[1];
    avatar?.classList.add('hf31-profile-avatar');heroMain?.classList.add('hf31-profile-main');q('h1',heroMain)?.classList.add('hf31-profile-title');
    refineProfileCurrentness(heroMain,grid);compactProfilePrimaryActions();compactProfileUtilities();q('.breadcrumbs')?.classList.add('hf31-profile-breadcrumbs');
    const layout=q('.r22-profile-layout');if(layout){
      layout.classList.add('hf31-profile-layout');const article=q(':scope > article',layout),side=q(':scope > aside.r22-profile-side',layout);
      article?.classList.add('hf31-profile-article');side?.classList.add('hf31-profile-side');
      if(article){refineProfileAbout(article);refineProfileFacts(article);refineProfileSources(article,side);refineProfileManagement(article)}
      refineProfileRelated(side);
    }
    enhanceMemberPublication();
  }

  function init(){
    ensureLateCss();integrateLanguageSwitch();suppressExpiredDatedContent();refineHome();refineToday();refineTasks();refineDirectory();refineProfile();syncNativeLanguage();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('load',()=>{init();setTimeout(init,120)},{once:true});
  window.addEventListener('franklinlanguagechange',()=>{syncNativeLanguage();setTimeout(()=>{refineTasks();refineProfile();syncNativeLanguage()},0)});
  setInterval(suppressExpiredDatedContent,60000);

  document.addEventListener('click',event=>{
    qa('details.hf31-more[open],details.hf28-result-more[open]').forEach(details=>{if(!details.contains(event.target))details.open=false});
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const open=q('details.hf31-more[open],details.hf28-result-more[open]');if(open){open.open=false;q(':scope > summary',open)?.focus()}
  });

  const observer=new MutationObserver(records=>{
    let rerunDirectory=false,rerunProfile=false;
    for(const record of records){for(const node of record.addedNodes){if(node.nodeType!==1)continue;if(node.matches?.('.r22-profile-result')||node.querySelector?.('.r22-profile-result'))rerunDirectory=true;if(node.matches?.('[data-member-publication]')||node.querySelector?.('[data-member-publication]'))rerunProfile=true}}
    if(rerunDirectory)refineDirectory();if(rerunProfile){enhanceMemberPublication();syncNativeLanguage()}
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
})();
