/* FR-NAV1.29.2-HF3.10.2 progressive simplification + sitewide mobile loader */
(()=>{'use strict';
const mobileCss='/assets/hf3102-mobile.css?v=frnav1292';
if(!document.querySelector('link[data-franklin-mobile-3102]')){const l=document.createElement('link');l.rel='stylesheet';l.href=mobileCss;l.dataset.franklinMobile3102='1';document.head.append(l)}
const loadAssistantV2=()=>{
  if(!document.querySelector('[data-navigator-bot]')||document.querySelector('script[data-franklin-assistant-v2]'))return;
  const core=document.createElement('script');core.src='/assets/franklin-assistant-core.js?v=frnav1292';core.defer=true;core.dataset.franklinAssistantCore='1';
  const app=document.createElement('script');app.src='/assets/franklin-assistant-v2.js?v=frnav1292';app.defer=true;app.dataset.franklinAssistantV2='1';
  core.addEventListener('load',()=>document.head.append(app),{once:true});document.head.append(core);
};
const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
ready(()=>{
  const body=document.body;
  if(!body)return;
  loadAssistantV2();
  // Homepage: suppress an empty saved-checklist box without touching real saved content.
  if(body.classList.contains('hf36-home')){
    const clean=()=>document.querySelectorAll('.navigator-bot .empty-state,.navigator-bot [class*="empty"]').forEach(n=>{if(/No detailed Assistant checklists saved yet|No Assistant/i.test(n.textContent||''))n.dataset.hf36HomeEmpty='1'});
    clean();new MutationObserver(clean).observe(document.querySelector('.navigator-bot')||body,{childList:true,subtree:true});
  }
  // Get It Done: default to six popular tasks; search/category filtering reveals the full matching set.
  if(body.classList.contains('hf36-get-it-done')){
    const search=document.querySelector('[data-task-search]');
    const show=document.querySelector('[data-hf36-show-tasks]');
    const reveal=()=>body.classList.add('hf36-show-all-tasks');
    show?.addEventListener('click',()=>{reveal();show.hidden=true});
    search?.addEventListener('input',()=>{if(search.value.trim())reveal()});
    document.querySelector('[data-task-categories]')?.addEventListener('click',e=>{if(e.target.closest('button'))reveal()});
  }
  // Activities: show a useful first set; filters reveal matching records without deleting data.
  if(body.classList.contains('hf36-activities')){
    const show=document.querySelector('[data-hf36-show-activities]');
    const current=document.querySelector('[data-hf36-show-current]');
    show?.addEventListener('click',()=>{body.classList.add('hf36-show-all-activities');show.hidden=true});
    current?.addEventListener('click',()=>{body.classList.add('hf36-show-current');current.hidden=true});
    const controls=document.querySelector('.explorer-controls');
    controls?.addEventListener('input',()=>body.classList.add('hf36-show-all-activities'));
    controls?.addEventListener('change',()=>body.classList.add('hf36-show-all-activities'));
  }
  // My Franklin: consolidate empty states and only expand when real saved content exists.
  if(body.classList.contains('hf36-my-franklin')){
    const empty=document.querySelector('[data-hf36-saved-empty]');
    const containers=[document.querySelector('[data-saved-profiles]'),document.querySelector('[data-r34-saved-plans]'),document.querySelector('[data-r38-assistant-plans]')].filter(Boolean);
    const update=()=>{
      let any=false;
      containers.forEach(c=>{const meaningful=[...c.children].some(ch=>!ch.classList.contains('empty-state'));c.closest('.hf36-saved-block')?.classList.toggle('hf36-has-saved',meaningful);if(meaningful)any=true});
      if(empty)empty.hidden=any;
      const start=document.querySelector('[data-my-franklin-output]');
      if(start){const t=(start.textContent||'').trim();start.classList.toggle('hf36-empty-starting',/Choose topics below|Choose what matters|Elija/i.test(t))}
    };
    update();containers.forEach(c=>new MutationObserver(update).observe(c,{childList:true,subtree:true}));
  }
  // Help Center: empty output should not take half a screen.
  if(body.classList.contains('hf36-help')){
    const out=document.querySelector('[data-community-help-output]');const aside=document.querySelector('.hf36-help-plan-output');
    const update=()=>{if(!out||!aside)return;const t=(out.textContent||'').trim();aside.classList.toggle('hf36-empty-plan',/Choose one or more broad topics|Elija uno o más/i.test(t)||!t)};
    update();if(out)new MutationObserver(update).observe(out,{childList:true,subtree:true,characterData:true});
  }
});
})();