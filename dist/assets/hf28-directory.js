'use strict';
(()=>{
  const root=document.querySelector('[data-franklin-discovery]');
  if(!root)return;
  const q=(selector,scope=root)=>scope.querySelector(selector);
  const qa=(selector,scope=root)=>[...scope.querySelectorAll(selector)];
  const isEs=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('es');
  const tx=(en,es)=>isEs()?es:en;
  let filterDetails=null,filterSummary=null;

  function activeAdvancedCount(){
    let count=0;
    if(q('[data-dir-type]')?.value)count++;
    if(q('[data-dir-area]')?.value)count++;
    const sort=q('[data-dir-sort]')?.value||'name';
    if(sort&&sort!=='name')count++;
    count+=qa('[data-dir-fact]:checked').length;
    return count;
  }

  function updateFilterSummary(){
    if(!filterSummary)return;
    const n=activeAdvancedCount();
    filterSummary.textContent=n?tx(`More filters · ${n} active`,`Más filtros · ${n} activos`):tx('More filters','Más filtros');
    filterSummary.setAttribute('aria-label',n?tx(`${n} additional filters active`,`Hay ${n} filtros adicionales activos`):tx('More filters','Más filtros'));
    filterDetails?.classList.toggle('has-active-filters',n>0);
  }

  function simplifyFilters(){
    if(root.dataset.hf28FiltersReady==='1')return;
    const toolbar=q('.r22-directory-toolbar');
    const factFilters=q('.r22-fact-filters');
    if(!toolbar||!factFilters)return;
    const advanced=qa(':scope > label',toolbar).filter(label=>label.querySelector('[data-dir-type],[data-dir-area],[data-dir-sort]'));
    if(!advanced.length)return;

    toolbar.classList.add('hf28-primary-toolbar');
    filterDetails=document.createElement('details');
    filterDetails.className='hf28-more-filters';
    filterDetails.dataset.hf28MoreFilters='1';
    filterSummary=document.createElement('summary');
    filterSummary.className='hf28-more-filters-summary';
    const panel=document.createElement('div');
    panel.className='hf28-more-filters-panel';
    const secondary=document.createElement('div');
    secondary.className='hf28-secondary-filter-grid';
    advanced.forEach(label=>secondary.append(label));
    panel.append(secondary,factFilters);
    filterDetails.append(filterSummary,panel);
    toolbar.insertAdjacentElement('afterend',filterDetails);
    root.dataset.hf28FiltersReady='1';
    updateFilterSummary();

    filterDetails.addEventListener('toggle',()=>{
      if(filterDetails.open)filterDetails.dataset.userOpened='1';
    });
    root.addEventListener('change',event=>{
      if(event.target?.matches?.('[data-dir-type],[data-dir-area],[data-dir-sort],[data-dir-fact]'))queueMicrotask(updateFilterSummary);
    });
    q('[data-dir-clear]')?.addEventListener('click',()=>setTimeout(()=>{
      updateFilterSummary();
      filterDetails.open=false;
    },0));
  }

  function resultName(group){
    return group.closest('.r22-profile-result')?.querySelector('h3')?.textContent?.trim()||tx('this profile','este perfil');
  }

  function simplifyResultActions(scope=root){
    qa('.result-actions:not([data-hf28-ready])',scope).forEach(group=>{
      const primary=q(':scope > a.primary',group);
      const compare=q(':scope > button[data-compare-id]',group);
      if(!primary||!compare){group.dataset.hf28Ready='1';return}
      const extras=[...group.children].filter(node=>node!==primary&&node!==compare);
      group.replaceChildren(primary,compare);
      if(extras.length){
        const details=document.createElement('details');
        details.className='hf28-result-more';
        const summary=document.createElement('summary');
        summary.textContent=tx('More','Más');
        summary.setAttribute('aria-label',tx(`More actions for ${resultName(group)}`,`Más acciones para ${resultName(group)}`));
        const menu=document.createElement('div');
        menu.className='hf28-result-more-menu';
        extras.forEach(item=>menu.append(item));
        details.append(summary,menu);
        details.addEventListener('click',event=>{if(event.target.closest('a,button'))details.open=false});
        group.append(details);
      }
      group.dataset.hf28Ready='1';
    });
  }

  function refresh(){
    simplifyFilters();
    simplifyResultActions();
    updateFilterSummary();
  }

  const results=q('[data-dir-results]');
  if(results){
    const observer=new MutationObserver(()=>{
      simplifyResultActions(results);
      updateFilterSummary();
    });
    observer.observe(results,{childList:true,subtree:true});
  }

  window.addEventListener('popstate',()=>setTimeout(updateFilterSummary,0));
  window.addEventListener('franklinlanguagechange',()=>setTimeout(()=>{
    updateFilterSummary();
    simplifyResultActions();
  },0));
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const open=document.querySelector('.hf28-result-more[open]');
    if(!open)return;
    open.open=false;
    open.querySelector(':scope > summary')?.focus();
  });

  refresh();
  setTimeout(refresh,0);
})();
