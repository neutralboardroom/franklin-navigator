'use strict';
(()=>{
  const q=(selector,root=document)=>root.querySelector(selector);
  const qa=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const isEs=()=>document.documentElement.lang==='es';
  const text=(en,es)=>isEs()?es:en;
  const safetySelector='.urgent-section,.urgent-card,.urgent-callout,.r30-urgent,[data-urgent],[data-safety],#urgent-help';

  function pathOf(link){return new URL(link.getAttribute('href')||'',location.href).pathname}
  function coreHeaderLink(link){
    const u=new URL(link.getAttribute('href')||'',location.href);
    const p=u.pathname;
    const h=u.hash;
    return ((p==='/'||p==='/es/')&&h==='#ask-navigator') ||
      p==='/today/'||p==='/es/hoy/' ||
      p==='/get-it-done/'||p==='/es/hacerlo/' ||
      p==='/directory/'||p==='/es/directorio/';
  }
  function globalOverflowLink(link){
    const p=pathOf(link);
    return p==='/community/' ||
      p==='/my-franklin/'||p==='/es/mi-franklin/' ||
      p==='/business-dashboard/'||p==='/es/negocios/';
  }

  function canonicalHeaderItems(){
    const es=isEs();
    return [
      {kind:'core',href:es?'/es/#ask-navigator':'/#ask-navigator',label:es?'Preguntar a Franklin Assistant':'Ask Franklin Assistant'},
      {kind:'core',href:es?'/es/hoy/':'/today/',label:es?'Hoy':'Today'},
      {kind:'core',href:es?'/es/hacerlo/':'/get-it-done/',label:es?'Resolver tareas':'Get It Done'},
      {kind:'core',href:es?'/es/directorio/':'/directory/',label:es?'Buscar en Franklin':'Find Local'},
      {kind:'more',href:es?'/es/actividades/':'/activities/',label:es?'Actividades':'Activities'},
      {kind:'more',href:'/community/',label:es?'Comunidad':'Community'},
      {kind:'more',href:es?'/es/mi-franklin/':'/my-franklin/',label:es?'Mi Franklin':'My Franklin'},
      {kind:'more',href:es?'/es/negocios/':'/business-dashboard/',label:es?'Negocios':'For businesses'},
      {kind:'more',href:es?'/es/centro-de-ayuda/':'/community-help-center/',label:es?'Centro de ayuda':'Help Center'}
    ];
  }

  function currentPathMatches(href){
    const target=new URL(href,location.href);
    if(target.hash==='#ask-navigator')return false;
    return location.pathname===target.pathname;
  }

  function normalizeHeaderLinks(nav){
    const existing=[...nav.children].filter(el=>el.matches('a'));
    const byPath=new Map();
    for(const link of existing){
      const u=new URL(link.getAttribute('href')||'',location.href);
      const key=(u.hash==='#ask-navigator'?'ASK:':u.pathname);
      if(!byPath.has(key))byPath.set(key,link);
    }
    const normalized=[];
    for(const item of canonicalHeaderItems()){
      const u=new URL(item.href,location.href);
      const key=(u.hash==='#ask-navigator'?'ASK:':u.pathname);
      let link=byPath.get(key);
      if(!link){link=document.createElement('a')}
      link.href=item.href;
      link.textContent=item.label;
      if(currentPathMatches(item.href))link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
      link.dataset.r41CanonicalKind=item.kind;
      normalized.push(link);
    }
    existing.filter(link=>!normalized.includes(link)).forEach(link=>link.remove());
    normalized.forEach(link=>nav.append(link));
    return normalized;
  }

  function buildDisclosure({summaryEn,summaryEs,items,className}){
    const details=document.createElement('details');
    details.className=className;
    details.dataset.r41SummaryEn=summaryEn;
    details.dataset.r41SummaryEs=summaryEs;
    const summary=document.createElement('summary');
    summary.textContent=text(summaryEn,summaryEs);
    const menu=document.createElement('div');
    menu.className=`${className}-menu`;
    items.forEach(item=>menu.append(item));
    details.append(summary,menu);
    return details;
  }

  function closeOtherDisclosures(current){
    qa('.r41-nav-more[open],.r41-more-actions[open]').forEach(open=>{if(open!==current)open.open=false});
  }

  function simplifyHeader(){
    const nav=q('header .nav');
    if(!nav||nav.dataset.r41Ready==='1')return;
    const links=normalizeHeaderLinks(nav);
    const core=links.filter(link=>link.dataset.r41CanonicalKind==='core');
    const extras=links.filter(link=>link.dataset.r41CanonicalKind==='more');
    core.forEach(link=>nav.append(link));
    if(extras.length){
      const more=buildDisclosure({summaryEn:'More',summaryEs:'Más',items:extras,className:'r41-nav-more'});
      nav.append(more);
      q(':scope > summary',more)?.addEventListener('click',()=>closeOtherDisclosures(more));
      more.addEventListener('click',event=>{if(event.target.closest('a'))more.open=false});
    }
    nav.dataset.r41Ready='1';
  }

  function simplifyActionGroup(group,maxVisible=2){
    if(!group||group.dataset.r41Ready==='1'||group.closest('form')||group.closest(safetySelector))return;
    const items=[...group.children].filter(el=>el.matches('a,button'));
    if(items.length<2){group.dataset.r41Ready='1';return}
    const primary=items.find(el=>el.classList.contains('primary'))||items[0];
    const ordered=[primary,...items.filter(el=>el!==primary)];
    const visible=ordered.slice(0,Math.max(1,maxVisible));
    visible.forEach((item,index)=>{
      if(index>0)item.classList.add('r41-secondary-action');
      group.append(item);
    });
    const overflow=ordered.slice(visible.length);
    if(overflow.length){
      const more=buildDisclosure({summaryEn:'More',summaryEs:'Más',items:overflow,className:'r41-more-actions'});
      group.append(more);
      q(':scope > summary',more)?.addEventListener('click',()=>closeOtherDisclosures(more));
      more.addEventListener('click',event=>{if(event.target.closest('a,button'))more.open=false});
    }
    group.dataset.r41Ready='1';
  }

  function simplifyActions(){
    qa('main .actions').forEach(group=>simplifyActionGroup(group,2));
    qa('main .r30-actions').forEach(group=>simplifyActionGroup(group,1));
  }

  function simplifyHomeRoutes(){
    if(location.pathname!=='/'&&location.pathname!=='/es/')return;
    const section=q('.r24-destinations');
    if(!section||section.dataset.r41Ready==='1')return;
    section.hidden=true;
    section.dataset.r41Ready='1';
  }

  function enhanceHistoryLink(){
    if(location.pathname!=='/'&&location.pathname!=='/es/')return;
    const link=q('.r22-history a[href="/photo-credits/"]');
    if(!link)return;
    link.dataset.r41En='See all Franklin Through Time images';
    link.dataset.r41Es='Ver todas las imágenes de Franklin a través del tiempo';
    link.textContent=text(link.dataset.r41En,link.dataset.r41Es);
  }

  function markPrimarySections(){
    qa('main section .actions').forEach(group=>{
      const primary=q('.primary',group);
      if(primary)primary.setAttribute('data-r41-next-action','primary');
    });
  }

  function syncLabels(){
    qa('[data-r41-summary-en]').forEach(details=>{const summary=q(':scope > summary',details);if(summary)summary.textContent=text(details.dataset.r41SummaryEn,details.dataset.r41SummaryEs)});
    qa('[data-r41-en]').forEach(el=>{el.textContent=text(el.dataset.r41En,el.dataset.r41Es)});
  }

  function bindDismissal(){
    document.addEventListener('click',event=>{
      qa('.r41-nav-more[open],.r41-more-actions[open]').forEach(open=>{if(!open.contains(event.target))open.open=false});
    });
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape')return;
      const open=q('.r41-nav-more[open],.r41-more-actions[open],.r41-home-routes[open]');
      if(!open)return;
      open.open=false;
      q(':scope > summary',open)?.focus();
    });
  }

  function init(){
    simplifyHeader();
    simplifyActions();
    simplifyHomeRoutes();
    enhanceHistoryLink();
    markPrimarySections();
    syncLabels();
    bindDismissal();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('franklinlanguagechange',syncLabels);
})();

/* HF2.8 — load the native Find Local hierarchy only on the Franklin discovery surface. */
(()=>{
  function load(){
    if(!document.querySelector('[data-franklin-discovery]'))return;
    if(!document.querySelector('link[data-hf28-directory]')){
      const css=document.createElement('link');
      css.rel='stylesheet';
      css.href='/assets/hf28-directory.css';
      css.dataset.hf28Directory='1';
      document.head.append(css);
    }
    if(!document.querySelector('script[data-hf28-directory]')){
      const js=document.createElement('script');
      js.src='/assets/hf28-directory.js';
      js.defer=true;
      js.dataset.hf28Directory='1';
      document.head.append(js);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();

/* HF3.2 — universal public navigation, spacing and high-traffic page cleanup. */
(()=>{
  function load(){
    if(document.querySelector('script[data-hf32-site-cleanup]'))return;
    const js=document.createElement('script');
    js.src='/assets/hf32-site-cleanup.js';
    js.defer=true;
    js.dataset.hf32SiteCleanup='1';
    document.head.append(js);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
