'use strict';
(()=>{
  const q=(selector,root=document)=>root.querySelector(selector);
  const qa=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const isEs=()=>document.documentElement.lang==='es';
  const text=(en,es)=>isEs()?es:en;
  const safetySelector='.urgent-section,.urgent-card,.urgent-callout,.r30-urgent,[data-urgent],[data-safety],#urgent-help';

  function coreHeaderLink(link){
    const u=new URL(link.getAttribute('href')||'',location.href);
    const p=u.pathname;
    const h=u.hash;
    return ((p==='/'||p==='/es/')&&h==='#ask-navigator') ||
      p==='/today/'||p==='/es/hoy/' ||
      p==='/get-it-done/'||p==='/es/hacerlo/' ||
      p==='/directory/'||p==='/es/directorio/' ||
      p==='/community/' ||
      p==='/my-franklin/'||p==='/es/mi-franklin/';
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

  function simplifyHeader(){
    const nav=q('header .nav');
    if(!nav||nav.dataset.r41Ready==='1')return;
    const links=[...nav.children].filter(el=>el.matches('a'));
    const extras=links.filter(link=>!coreHeaderLink(link));
    if(!extras.length){nav.dataset.r41Ready='1';return}
    const more=buildDisclosure({summaryEn:'More',summaryEs:'Más',items:extras,className:'r41-nav-more'});
    nav.append(more);
    more.addEventListener('click',event=>{if(event.target.closest('a'))more.open=false});
    document.addEventListener('click',event=>{if(more.open&&!more.contains(event.target))more.open=false});
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
      const more=buildDisclosure({summaryEn:'More options',summaryEs:'Más opciones',items:overflow,className:'r41-more-actions'});
      group.append(more);
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
    const grid=q('.r24-destination-grid',section||document);
    if(!section||!grid||section.dataset.r41Ready==='1')return;
    const eyebrow=q('.eyebrow',section),heading=q('h2',section);
    if(eyebrow){eyebrow.dataset.r41En='Optional shortcuts';eyebrow.dataset.r41Es='Atajos opcionales';eyebrow.textContent=text(eyebrow.dataset.r41En,eyebrow.dataset.r41Es)}
    if(heading){heading.dataset.r41En='Prefer to browse instead?';heading.dataset.r41Es='¿Prefiere explorar?';heading.textContent=text(heading.dataset.r41En,heading.dataset.r41Es)}
    const details=document.createElement('details');
    details.className='r41-home-routes';
    details.dataset.r41SummaryEn='Show Today, Get It Done, Find Local and My Franklin';
    details.dataset.r41SummaryEs='Mostrar Hoy, Resolver tareas, Buscar en Franklin y Mi Franklin';
    const summary=document.createElement('summary');
    summary.textContent=text(details.dataset.r41SummaryEn,details.dataset.r41SummaryEs);
    grid.parentNode.insertBefore(details,grid);
    details.append(summary,grid);
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

  function bindEscape(){
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
    bindEscape();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('franklinlanguagechange',syncLabels);
})();
