'use strict';
(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const isEs=()=>document.documentElement.lang==='es';
  const tx=(en,es)=>isEs()?es:en;
  const pathOf=a=>new URL(a.href,location.href).pathname;

  function simplifyAssistantExamples(){
    const group=q('.navigator-examples.r24-chips');
    if(!group||group.dataset.hf29Ready==='1')return;
    const buttons=qa('button[data-navigator-example]',group);
    if(!buttons.length)return;
    const label=document.createElement('label');
    label.className='hf29-example-select';
    label.dataset.hf29LabelEn='Try an example';
    label.dataset.hf29LabelEs='Probar un ejemplo';
    const span=document.createElement('span');span.textContent=tx('Try an example','Probar un ejemplo');
    const select=document.createElement('select');
    select.setAttribute('aria-label',tx('Choose an example question','Elegir una pregunta de ejemplo'));
    select.append(new Option(tx('Choose one…','Elija una…'),''));
    buttons.forEach((button,index)=>select.append(new Option(button.textContent.trim(),String(index))));
    select.addEventListener('change',()=>{
      if(select.value==='')return;
      buttons[Number(select.value)]?.click();
      select.value='';
    });
    label.append(span,select);
    group.after(label);
    group.dataset.hf29Ready='1';
  }

  function simplifyTodayFilters(){
    const group=q('[data-today-filters]');
    if(!group||group.dataset.hf29Ready==='1')return;
    const buttons=qa('button[data-filter]',group);
    if(!buttons.length)return;
    const label=document.createElement('label');
    label.className='hf29-today-filter';
    label.dataset.hf29LabelEn='Show';
    label.dataset.hf29LabelEs='Mostrar';
    const span=document.createElement('span');span.textContent=tx('Show','Mostrar');
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
    if(links.length<=7){nav.dataset.hf29Ready='1';nav.classList.add('hf29-footer-ready');return}
    const priorities=[
      /community-help-center|centro-de-ayuda/,
      /updates\//,
      /business-dashboard|\/es\/negocios\//,
      /privacy|privacidad/,
      /accessibility|accesibilidad/
    ];
    const keep=[];
    priorities.forEach(re=>{const found=links.find(a=>re.test(pathOf(a))&&!keep.includes(a));if(found)keep.push(found)});
    const redundantPrimary=a=>{
      const p=pathOf(a),h=new URL(a.href,location.href).hash;
      return h==='#ask-navigator'||p==='/today/'||p==='/es/hoy/'||p==='/get-it-done/'||p==='/es/hacerlo/'||p==='/directory/'||p==='/es/directorio/';
    };
    links.filter(a=>redundantPrimary(a)).forEach(a=>a.remove());
    const extras=links.filter(a=>!keep.includes(a)&&!redundantPrimary(a));
    keep.forEach(a=>nav.append(a));
    if(extras.length){
      const details=document.createElement('details');
      details.className='hf29-footer-more';
      details.dataset.hf29SummaryEn='More links';
      details.dataset.hf29SummaryEs='Más enlaces';
      const summary=document.createElement('summary');summary.textContent=tx('More links','Más enlaces');
      const menu=document.createElement('div');menu.className='hf29-footer-more-menu';
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

  function simplifyMyFranklin(){
    if(!/^(?:\/my-franklin\/|\/es\/mi-franklin\/)$/.test(location.pathname))return;
    const prefs=q('details.r22-dashboard-card[open]');
    if(prefs&&!prefs.dataset.hf29PrefsTouched){prefs.open=false;prefs.dataset.hf29PrefsTouched='1'}
    const reset=q('[data-device-reset-confirm]');
    if(reset){
      const keep=q('[data-device-reset-no]',reset),remove=q('[data-device-reset-yes]',reset);
      keep?.classList.add('primary','hf29-safe-choice');
      remove?.classList.add('hf29-destructive-choice');
    }
  }

  function simplifyDialogActions(root=document){
    const groups=[];
    if(root.nodeType===1&&root.matches?.('.r27-business-actions,.r27-navigator-body .actions'))groups.push(root);
    groups.push(...qa('.r27-business-actions,.r27-navigator-body .actions',root));
    groups.forEach(group=>{
      if(group.dataset.hf29DialogReady==='1')return;
      const items=[...group.children].filter(el=>el.matches('a,button'));
      if(items.length<=2){group.dataset.hf29DialogReady='1';return}
      const primary=items.find(el=>el.classList.contains('primary'))||items[0];
      group.append(primary);
      const rest=items.filter(el=>el!==primary);
      const details=document.createElement('details');
      details.className='hf29-dialog-more';
      details.dataset.hf29SummaryEn='Other options';
      details.dataset.hf29SummaryEs='Otras opciones';
      const summary=document.createElement('summary');summary.textContent=tx('Other options','Otras opciones');
      const menu=document.createElement('div');menu.className='hf29-dialog-more-menu';
      rest.forEach(item=>menu.append(item));
      details.append(summary,menu);group.append(details);
      group.dataset.hf29DialogReady='1';
    });
  }

  function closeCompactMenusOnEscape(){
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape')return;
      const open=q('.hf29-footer-more[open],.hf29-dialog-more[open]');
      if(open){open.open=false;q(':scope > summary',open)?.focus()}
    });
  }

  function syncLanguage(){
    qa('[data-hf29-summary-en]').forEach(d=>{const s=q(':scope > summary',d);if(s)s.textContent=tx(d.dataset.hf29SummaryEn,d.dataset.hf29SummaryEs)});
    qa('[data-hf29-label-en]').forEach(el=>{const span=q(':scope > span',el);if(span)span.textContent=tx(el.dataset.hf29LabelEn,el.dataset.hf29LabelEs)});
    const today=q('.hf29-today-filter select');if(today)today.setAttribute('aria-label',tx('Filter what matters now','Filtrar lo que importa ahora'));
    const example=q('.hf29-example-select select');if(example)example.setAttribute('aria-label',tx('Choose an example question','Elegir una pregunta de ejemplo'));
  }

  function init(){simplifyAssistantExamples();simplifyTodayFilters();simplifyFooter();refineHome();simplifyMyFranklin();simplifyDialogActions();syncLanguage()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('load',init,{once:true});
  window.addEventListener('franklinlanguagechange',()=>{syncLanguage();setTimeout(init,0)});
  closeCompactMenusOnEscape();
  const observer=new MutationObserver(records=>{for(const record of records){for(const node of record.addedNodes){if(node.nodeType===1)simplifyDialogActions(node)}}});
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});else document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
})();
