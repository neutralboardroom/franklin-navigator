'use strict';
(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const isEs=()=>document.documentElement.lang==='es';
  const tx=(en,es)=>isEs()?es:en;

  function simplifyTodayFilters(){
    const group=q('[data-today-filters]');
    if(!group||group.dataset.hf29Ready==='1')return;
    const buttons=qa('button[data-filter]',group);
    if(!buttons.length)return;
    const label=document.createElement('label');
    label.className='hf29-today-filter';
    label.dataset.hf29LabelEn='Show';
    label.dataset.hf29LabelEs='Mostrar';
    const span=document.createElement('span');
    span.textContent=tx('Show','Mostrar');
    const select=document.createElement('select');
    select.setAttribute('aria-label',tx('Filter what matters now','Filtrar lo que importa ahora'));
    buttons.forEach((button,index)=>{
      const option=document.createElement('option');
      option.value=button.dataset.filter||String(index);
      option.textContent=button.textContent.trim();
      if(button.classList.contains('active'))option.selected=true;
      select.append(option);
      button.addEventListener('click',()=>{select.value=button.dataset.filter||String(index)});
    });
    select.addEventListener('change',()=>{
      const target=buttons.find(b=>(b.dataset.filter||'')===select.value);
      target?.click();
    });
    label.append(span,select);
    group.parentNode?.insertBefore(label,group.nextSibling);
    group.dataset.hf29Ready='1';
    group.closest('.r22-section-head')?.classList.add('hf29-today-filter-ready');
  }

  function simplifyFooter(){
    const nav=q('.footer .footer-links');
    if(!nav||nav.dataset.hf29Ready==='1')return;
    const links=[...nav.children].filter(el=>el.matches('a'));
    if(links.length<=8){nav.dataset.hf29Ready='1';nav.classList.add('hf29-footer-ready');return}
    const priorities=[
      /community-help-center|centro-de-ayuda/,
      /updates\//,
      /business-dashboard|\/es\/negocios\//,
      /privacy|privacidad/,
      /terms/,
      /accessibility|accesibilidad/
    ];
    const keep=[];
    priorities.forEach(re=>{const found=links.find(a=>re.test(new URL(a.href,location.href).pathname)&&!keep.includes(a));if(found)keep.push(found)});
    for(const a of links){if(keep.length>=6)break;if(!keep.includes(a))keep.push(a)}
    const extras=links.filter(a=>!keep.includes(a));
    keep.forEach(a=>nav.append(a));
    if(extras.length){
      const details=document.createElement('details');
      details.className='hf29-footer-more';
      details.dataset.hf29SummaryEn='More links';
      details.dataset.hf29SummaryEs='Más enlaces';
      const summary=document.createElement('summary');
      summary.textContent=tx('More links','Más enlaces');
      const menu=document.createElement('div');
      menu.className='hf29-footer-more-menu';
      extras.forEach(a=>menu.append(a));
      details.append(summary,menu);nav.append(details);
      document.addEventListener('click',event=>{if(details.open&&!details.contains(event.target))details.open=false});
    }
    nav.dataset.hf29Ready='1';nav.classList.add('hf29-footer-ready');
  }

  function refineHome(){
    if(location.pathname!=='/'&&location.pathname!=='/es/')return;
    const around=q('.r24-around');
    if(around){
      around.dataset.hf29Ready='1';
      const all=q('.r22-section-head > .button',around);all?.classList.add('primary');
    }
  }

  function closeCompactMenusOnEscape(){
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape')return;
      const open=q('.hf29-footer-more[open]');
      if(open){open.open=false;q(':scope > summary',open)?.focus()}
    });
  }

  function syncLanguage(){
    qa('[data-hf29-summary-en]').forEach(d=>{const s=q(':scope > summary',d);if(s)s.textContent=tx(d.dataset.hf29SummaryEn,d.dataset.hf29SummaryEs)});
    qa('[data-hf29-label-en]').forEach(el=>{const span=q(':scope > span',el);if(span)span.textContent=tx(el.dataset.hf29LabelEn,el.dataset.hf29LabelEs)});
    const select=q('.hf29-today-filter select');if(select)select.setAttribute('aria-label',tx('Filter what matters now','Filtrar lo que importa ahora'));
  }

  function init(){simplifyTodayFilters();simplifyFooter();refineHome();syncLanguage()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('load',init,{once:true});
  window.addEventListener('franklinlanguagechange',()=>{syncLanguage();setTimeout(init,0)});
  closeCompactMenusOnEscape();
})();
