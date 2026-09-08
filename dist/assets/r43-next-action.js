'use strict';
(()=>{
  const processed='fnHierarchy';
  const isEs=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('es');
  const text=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const lower=el=>text(el).toLowerCase();
  const urgent=el=>Boolean(el.closest('.urgent-section,#urgent-help,[data-urgent-help],[data-emergency]'))||/\b(911|988|poison control|emergency|urgent help|crisis|emergencia|ayuda urgente|crisis)\b/i.test(text(el.closest('section')||el));
  const isAction=el=>el?.matches?.('a,button');
  const utility=/\b(clear|copy|print|download|share|remove|reset|english|español|spanish|back|borrar|copiar|imprimir|descargar|compartir|quitar|restablecer|volver)\b/i;
  const strong=/\b(start|continue|find|build|open|manage|join|enroll|sign in|get help|ask|view profile|visit website|submit|save changes|next step|comenzar|continuar|buscar|crear|abrir|gestionar|unirse|inscrib|iniciar sesión|obtener ayuda|preguntar|ver perfil|visitar sitio|guardar cambios|próximo paso)\b/i;
  function score(el,container){
    let s=0,l=lower(el),href=String(el.getAttribute?.('href')||'');
    if(el.classList?.contains('primary'))s+=80;
    if(strong.test(l))s+=28;
    if(utility.test(l))s-=35;
    if(container.classList.contains('profile-primary-actions')){
      if(/^https?:/i.test(href))s+=80;
      else if(/^tel:/i.test(href))s+=60;
      else if(/^mailto:/i.test(href))s+=35;
    }
    if(container.classList.contains('profile-actions')){
      if(/view profile|ver perfil/i.test(l))s+=100;
      else if(/visit website|visitar sitio/i.test(l))s+=55;
      else if(/review|claim|revisar|reclamar/i.test(l))s+=15;
    }
    if(/primary|next|continue|start|find|build|open|manage|join|enroll/.test(el.dataset?.actionRole||''))s+=60;
    return s;
  }
  function makeMore(labelClass=''){
    const d=document.createElement('details');d.className=`fn-more-actions ${labelClass}`.trim();
    const s=document.createElement('summary');s.textContent=isEs()?'Más opciones':'More options';s.setAttribute('aria-label',isEs()?'Mostrar más opciones':'Show more options');
    const panel=document.createElement('div');panel.className='fn-more-actions-panel';d.append(s,panel);return {details:d,panel};
  }
  function prioritize(container,actions){
    const ranked=[...actions].map((el,i)=>({el,i,s:score(el,container)})).sort((a,b)=>b.s-a.s||a.i-b.i);
    const primary=ranked[0]?.el||actions[0];
    for(const el of actions)if(el!==primary&&el.classList?.contains('primary'))el.classList.remove('primary');
    if(primary?.classList?.contains('button'))primary.classList.add('primary');
    primary?.setAttribute?.('data-next-best-action','true');
    return [primary,...ranked.filter(x=>x.el!==primary).map(x=>x.el)];
  }
  function simplifyGroup(container){
    if(!container||container.dataset?.[processed]||urgent(container))return;
    const actions=[...container.children].filter(isAction);
    if(actions.length<2)return;
    container.dataset[processed]='1';
    const ordered=prioritize(container,actions);
    let visible=2;
    if(container.matches('.navigator-examples,.r24-chips'))visible=3;
    if(actions.length<=visible)return;
    const keep=ordered.slice(0,visible),extras=ordered.slice(visible);
    // Keep the best action first and one secondary choice visible; preserve every other action in an accessible disclosure.
    const anchor=[...container.children].find(el=>isAction(el));
    if(anchor){container.insertBefore(keep[0],anchor);if(keep[1])keep[0].insertAdjacentElement('afterend',keep[1]);if(keep[2])keep[1].insertAdjacentElement('afterend',keep[2])}
    const {details,panel}=makeMore();for(const el of extras)panel.append(el);container.append(details);
  }
  function simplifyNav(nav){
    if(!nav||nav.dataset.fnNavHierarchy)return;const links=[...nav.children].filter(el=>el.matches('a'));if(links.length<=7)return;nav.dataset.fnNavHierarchy='1';
    const preferred=isEs()?[/preguntar|asistente/i,/^hoy$/i,/hacerlo/i,/buscar local/i,/mi franklin/i,/negocios/i]:[/ask navigator|franklin assistant/i,/^today$/i,/get it done/i,/find local/i,/my franklin/i,/for business/i];
    const keep=[];for(const rx of preferred){const found=links.find(a=>!keep.includes(a)&&rx.test(text(a)));if(found)keep.push(found)}
    for(const a of links)if(keep.length<6&&!keep.includes(a))keep.push(a);
    const extras=links.filter(a=>!keep.includes(a));if(!extras.length)return;
    const {details,panel}=makeMore('fn-nav-more');for(const a of extras)panel.append(a);nav.append(details);
  }
  function simplifyFooter(nav){
    if(!nav||nav.dataset.fnFooterHierarchy)return;const links=[...nav.children].filter(el=>el.matches('a'));if(links.length<=8)return;nav.dataset.fnFooterHierarchy='1';
    const keep=links.slice(0,7),extras=links.slice(7);const {details,panel}=makeMore('fn-footer-more');for(const a of extras)panel.append(a);nav.append(details);
  }
  function scan(root=document){
    const scope=root.nodeType===1?root:document;
    if(scope.matches?.('nav.nav'))simplifyNav(scope);scope.querySelectorAll?.('nav.nav').forEach(simplifyNav);
    if(scope.matches?.('.footer-links'))simplifyFooter(scope);scope.querySelectorAll?.('.footer-links').forEach(simplifyFooter);
    const selectors='.actions,.profile-primary-actions,.profile-utility-actions,.profile-actions,.plan-actions,.r30-actions,.navigator-examples,.r24-chips,.r24-ask-actions';
    if(scope.matches?.(selectors))simplifyGroup(scope);scope.querySelectorAll?.(selectors).forEach(simplifyGroup);
  }
  function mount(){scan(document);let queued=false;const observer=new MutationObserver(records=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)scan(n)})});observer.observe(document.body,{childList:true,subtree:true});}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',mount):mount();
  window.addEventListener('franklinlanguagechange',()=>document.querySelectorAll('.fn-more-actions>summary').forEach(s=>{s.textContent=isEs()?'Más opciones':'More options';s.setAttribute('aria-label',isEs()?'Mostrar más opciones':'Show more options')}));
  window.FranklinNextAction=Object.freeze({scan,version:'FR-NAV1.15.0-HF2.7-CANDIDATE'});
})();
