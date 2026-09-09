'use strict';
(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const isEs=()=>document.documentElement.lang==='es';
  const tx=(en,es)=>isEs()?es:en;
  const pathOf=a=>new URL(a.href,location.href).pathname;
  const safetyWords=/\b(urgent|emergency|crisis|911|988|urgente|emergencia|crisis|peligro)\b/i;

  function ensureLateCss(){
    if(!document.querySelector('link[data-hf29-design-late]')){
      const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/hf29-design.css';link.dataset.hf29DesignLate='1';document.head.append(link);
    }
    if(!document.querySelector('link[data-hf29-popup-late]')){
      const popup=document.createElement('link');popup.rel='stylesheet';popup.href='/assets/hf29-popup.css';popup.dataset.hf29PopupLate='1';document.head.append(popup);
    }
  }

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
    select.addEventListener('change',()=>{if(select.value==='')return;buttons[Number(select.value)]?.click();select.value=''});
    label.append(span,select);group.after(label);group.dataset.hf29Ready='1';
  }

  function simplifyTodayFilters(){
    const group=q('[data-today-filters]');
    if(!group||group.dataset.hf29Ready==='1')return;
    const buttons=qa('button[data-filter]',group);
    if(!buttons.length)return;
    const label=document.createElement('label');
    label.className='hf29-today-filter';label.dataset.hf29LabelEn='Show';label.dataset.hf29LabelEs='Mostrar';
    const span=document.createElement('span');span.textContent=tx('Show','Mostrar');
    const select=document.createElement('select');select.setAttribute('aria-label',tx('Filter what matters now','Filtrar lo que importa ahora'));
    buttons.forEach((button,index)=>{
      const option=document.createElement('option');option.value=button.dataset.filter||String(index);option.textContent=button.textContent.trim();
      if(button.classList.contains('active'))option.selected=true;select.append(option);
      button.addEventListener('click',()=>{select.value=button.dataset.filter||String(index)});
    });
    select.addEventListener('change',()=>buttons.find(b=>(b.dataset.filter||'')===select.value)?.click());
    label.append(span,select);group.parentNode?.insertBefore(label,group.nextSibling);group.dataset.hf29Ready='1';
    group.closest('.r22-section-head')?.classList.add('hf29-today-filter-ready');
  }

  function simplifyTodayCardActions(){
    if(!/^(?:\/today\/|\/es\/hoy\/)$/.test(location.pathname))return;
    qa('.today-card .r22-inline-actions').forEach(actions=>{
      if(actions.dataset.hf29Ready==='1')return;
      const remember=q('.link-button',actions);
      if(!remember){actions.dataset.hf29Ready='1';return}
      const details=document.createElement('details');details.className='hf29-card-more';
      details.dataset.hf29SummaryEn='More';details.dataset.hf29SummaryEs='Más';
      const summary=document.createElement('summary');summary.textContent=tx('More','Más');
      const menu=document.createElement('div');menu.className='hf29-card-more-menu';menu.append(remember);
      details.append(summary,menu);actions.append(details);actions.dataset.hf29Ready='1';
    });
  }

  function simplifyFooter(){
    const nav=q('.footer .footer-links');
    if(!nav||nav.dataset.hf29Ready==='1')return;
    const links=[...nav.children].filter(el=>el.matches('a'));
    if(links.length<=7){nav.dataset.hf29Ready='1';nav.classList.add('hf29-footer-ready');return}
    const priorities=[/community-help-center|centro-de-ayuda/,/updates\//,/business-dashboard|\/es\/negocios\//,/privacy|privacidad/,/accessibility|accesibilidad/];
    const keep=[];priorities.forEach(re=>{const found=links.find(a=>re.test(pathOf(a))&&!keep.includes(a));if(found)keep.push(found)});
    const redundantPrimary=a=>{const p=pathOf(a),h=new URL(a.href,location.href).hash;return h==='#ask-navigator'||p==='/today/'||p==='/es/hoy/'||p==='/get-it-done/'||p==='/es/hacerlo/'||p==='/directory/'||p==='/es/directorio/'};
    links.filter(a=>redundantPrimary(a)).forEach(a=>a.remove());
    const extras=links.filter(a=>!keep.includes(a)&&!redundantPrimary(a));keep.forEach(a=>nav.append(a));
    if(extras.length){
      const details=document.createElement('details');details.className='hf29-footer-more';details.dataset.hf29SummaryEn='More links';details.dataset.hf29SummaryEs='Más enlaces';
      const summary=document.createElement('summary');summary.textContent=tx('More links','Más enlaces');
      const menu=document.createElement('div');menu.className='hf29-footer-more-menu';extras.forEach(a=>menu.append(a));details.append(summary,menu);nav.append(details);
      document.addEventListener('click',event=>{if(details.open&&!details.contains(event.target))details.open=false});
    }
    nav.dataset.hf29Ready='1';nav.classList.add('hf29-footer-ready');
  }

  function refineHome(){
    if(location.pathname!=='/'&&location.pathname!=='/es/')return;
    const around=q('.r24-around');if(around){around.dataset.hf29Ready='1';q('.r22-section-head > .button',around)?.classList.add('primary')}
  }

  function simplifyMyFranklin(){
    if(!/^(?:\/my-franklin\/|\/es\/mi-franklin\/)$/.test(location.pathname))return;
    const prefs=q('details.r22-dashboard-card[open]');if(prefs&&!prefs.dataset.hf29PrefsTouched){prefs.open=false;prefs.dataset.hf29PrefsTouched='1'}
    const reset=q('[data-device-reset-confirm]');if(reset){q('[data-device-reset-no]',reset)?.classList.add('primary','hf29-safe-choice');q('[data-device-reset-yes]',reset)?.classList.add('hf29-destructive-choice')}
  }

  function isSafetyResult(result){
    if(!result)return false;
    if(q('a[href^="tel:911"],a[href^="tel:988"],a[href*="988"]',result))return true;
    const heading=q('h2,h3,h4,strong',result)?.textContent||'';
    return safetyWords.test(heading);
  }

  function makeMore(items,summaryEn='More',summaryEs='Más'){
    const details=document.createElement('details');details.className='hf29-dialog-more';
    details.dataset.hf29SummaryEn=summaryEn;details.dataset.hf29SummaryEs=summaryEs;
    const summary=document.createElement('summary');summary.textContent=tx(summaryEn,summaryEs);
    const menu=document.createElement('div');menu.className='hf29-dialog-more-menu';items.forEach(item=>menu.append(item));
    details.append(summary,menu);return details;
  }

  function compactDialogActionGroup(group){
    if(!group||group.dataset.hf29DialogReady==='1')return;
    const result=group.closest('.navigator-result');
    if(isSafetyResult(result)||q('a[href^="tel:911"],a[href^="tel:988"],a[href*="988"]',group)){
      group.dataset.hf29DialogReady='1';group.dataset.hf29SafetyPinned='1';return;
    }
    const items=[...group.children].filter(el=>el.matches('a,button'));
    if(items.length<=1){group.dataset.hf29DialogReady='1';return}
    const primary=items.find(el=>el.classList.contains('primary'))||items[0];
    primary.classList.add('primary');
    group.append(primary);
    const rest=items.filter(el=>el!==primary);
    group.append(makeMore(rest));
    group.dataset.hf29DialogReady='1';
  }

  function simplifyDialogLooseChoices(body){
    if(!body||q(':scope > .hf29-loose-actions',body))return;
    const loose=[...body.children].filter(el=>el.matches('a.button,button.button'));
    if(loose.length<=1||loose.some(el=>/^tel:(?:911|988)/i.test(el.getAttribute('href')||'')))return;
    const wrap=document.createElement('div');wrap.className='hf29-loose-actions';
    const primary=loose.find(el=>el.classList.contains('primary'))||loose[0];primary.classList.add('primary');wrap.append(primary);
    wrap.append(makeMore(loose.filter(el=>el!==primary), 'Other options','Otras opciones'));
    body.append(wrap);
  }

  function simplifyAssistantDialogStructure(){
    const body=q('.r27-navigator-body');
    if(!body||q(':scope > .hf29-assistant-extra',body))return;
    const results=qa(':scope > .navigator-result',body);
    if(!results.length){simplifyDialogLooseChoices(body);return}
    if(isSafetyResult(results[0]))return;
    results[0].classList.add('hf29-primary-result');
    const related=results.slice(1);
    const save=q(':scope > .r38-assistant-save',body);
    const connected=q(':scope > .r30-dialog-next',body);
    if(!related.length&&!save&&!connected)return;
    const details=document.createElement('details');details.className='hf29-assistant-extra';
    details.dataset.hf29SummaryEn='Other useful options';details.dataset.hf29SummaryEs='Otras opciones útiles';
    const summary=document.createElement('summary');
    const relatedCount=related.length;
    summary.textContent=relatedCount?tx(`Other useful options (${relatedCount})`,`Otras opciones útiles (${relatedCount})`):tx('Other useful options','Otras opciones útiles');
    const inner=document.createElement('div');inner.className='hf29-assistant-extra-body';
    related.forEach(result=>inner.append(result));if(save)inner.append(save);if(connected)inner.append(connected);
    details.append(summary,inner);body.append(details);
  }

  function simplifyDialogActions(root=document){
    const groups=[];
    if(root.nodeType===1&&root.matches?.('.r27-business-actions,.r27-navigator-body .actions'))groups.push(root);
    groups.push(...qa('.r27-business-actions,.r27-navigator-body .actions',root));
    groups.forEach(compactDialogActionGroup);
    queueMicrotask(simplifyAssistantDialogStructure);
  }

  function closeCompactMenus(){
    document.addEventListener('click',event=>{
      qa('.hf29-footer-more[open],.hf29-dialog-more[open],.hf29-card-more[open]').forEach(open=>{if(!open.contains(event.target))open.open=false});
    });
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape')return;
      const open=q('.hf29-dialog-more[open],.hf29-card-more[open],.hf29-assistant-extra[open],.hf29-footer-more[open]');
      if(open){open.open=false;q(':scope > summary',open)?.focus()}
    });
  }

  function syncLanguage(){
    qa('[data-hf29-summary-en]').forEach(d=>{
      const s=q(':scope > summary',d);if(!s)return;
      if(d.classList.contains('hf29-assistant-extra')){
        const n=qa(':scope > .hf29-assistant-extra-body > .navigator-result',d).length;
        s.textContent=n?tx(`${d.dataset.hf29SummaryEn} (${n})`,`${d.dataset.hf29SummaryEs} (${n})`):tx(d.dataset.hf29SummaryEn,d.dataset.hf29SummaryEs);
      }else s.textContent=tx(d.dataset.hf29SummaryEn,d.dataset.hf29SummaryEs);
    });
    qa('[data-hf29-label-en]').forEach(el=>{const span=q(':scope > span',el);if(span)span.textContent=tx(el.dataset.hf29LabelEn,el.dataset.hf29LabelEs)});
    const today=q('.hf29-today-filter select');if(today)today.setAttribute('aria-label',tx('Filter what matters now','Filtrar lo que importa ahora'));
    const example=q('.hf29-example-select select');if(example)example.setAttribute('aria-label',tx('Choose an example question','Elegir una pregunta de ejemplo'));
  }

  function init(){
    ensureLateCss();simplifyAssistantExamples();simplifyTodayFilters();simplifyTodayCardActions();simplifyFooter();refineHome();simplifyMyFranklin();
    simplifyDialogActions();simplifyAssistantDialogStructure();syncLanguage();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('load',init,{once:true});
  window.addEventListener('franklinlanguagechange',()=>{syncLanguage();setTimeout(init,0)});
  closeCompactMenus();
  const observer=new MutationObserver(records=>{
    let dialogChanged=false;
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType!==1)continue;
        simplifyDialogActions(node);
        if(node.closest?.('.r27-navigator-body')||node.matches?.('.r27-navigator-body'))dialogChanged=true;
      }
    }
    if(dialogChanged)queueMicrotask(()=>{simplifyDialogActions();simplifyAssistantDialogStructure();syncLanguage()});
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});else document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
})();
