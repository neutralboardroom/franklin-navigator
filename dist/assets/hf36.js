/* FR-NAV1.30.8-HF3.12.0 site-wide issue monitoring + progressive Franklin Assistant + fail-safe logo/loader hardening */
(()=>{'use strict';
const loadCss=(href,key)=>{if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';document.head.append(l)};
loadCss('/assets/hf3102-mobile.css?v=frnav1292','franklin-mobile-3102');
loadCss('/assets/hf3103-mobile.css?v=frnav1293','franklin-mobile-3103');
loadCss('/assets/hf3105-brand.css?v=frnav1295','franklin-brand-3105');
loadCss('/assets/franklin-assistant-chat-r1306.css?v=frnav1306','franklin-assistant-chat-r1306');
if(!document.querySelector('script[data-franklin-established-positioning]')){const p=document.createElement('script');p.src='/assets/franklin-established-positioning.js?v=frnav1293';p.defer=true;p.dataset.franklinEstablishedPositioning='1';document.head.append(p)}
const loadAssistantR1307=()=>{
  if(!document.querySelector('[data-navigator-bot]')||document.querySelector('script[data-franklin-assistant-r1307]'))return;
  const load=(src,key)=>new Promise((resolve,reject)=>{const old=document.querySelector(`script[data-${key}]`);if(old){if(old.dataset.loaded==='1')return resolve();old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=src;s.defer=true;s.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';s.addEventListener('load',()=>{s.dataset.loaded='1';resolve()},{once:true});s.addEventListener('error',reject,{once:true});document.head.append(s)});
  load('/assets/franklin-assistant-core.js?v=frnav1292','franklin-assistant-core')
    .then(()=>load('/assets/franklin-assistant-r1293-core.js?v=frnav1293','franklin-assistant-r1293-core'))
    .then(()=>load('/assets/franklin-assistant-r1294-core.js?v=frnav1294','franklin-assistant-r1294-core'))
    .then(()=>load('/assets/franklin-assistant-r1295-core.js?v=frnav1295','franklin-assistant-r1295-core'))
    .then(()=>load('/assets/franklin-assistant-r1296-core.js?v=frnav1296','franklin-assistant-r1296-core'))
    .then(()=>load('/assets/franklin-assistant-r1293-files.js?v=frnav1293','franklin-assistant-r1293-files'))
    .then(()=>load('/assets/franklin-assistant-r1293-file-analysis.js?v=frnav1293','franklin-assistant-r1293-file-analysis'))
    .then(()=>load('/assets/franklin-assistant-r1307.js?v=frnav1307','franklin-assistant-r1307'))
    .then(()=>{if(!window.FranklinAssistantR1307)throw new Error('Canonical Assistant did not initialize')})
    .catch(err=>installAssistantFailureFallback(err));
};

const installAssistantFailureFallback=(err)=>{
  const root=document.querySelector('[data-navigator-bot]'),form=root?.querySelector('form'),input=root?.querySelector('[data-navigator-input]');
  if(!root||!form||root.dataset.franklinAssistantFallback==='1')return;
  root.dataset.franklinAssistantFallback='1';root.dataset.franklinAssistantR1296='1';
  const show=(question='')=>{
    let d=document.querySelector('dialog[data-franklin-assistant-fallback-dialog]');
    if(!d){d=document.createElement('dialog');d.className='franklin-chat-panel';d.dataset.franklinAssistantFallbackDialog='1';d.innerHTML='<div class="franklin-chat-shell"><header class="franklin-chat-head"><div><div class="eyebrow">Franklin Assistant</div><h2>Franklin Assistant needs a quick retry</h2></div><button class="franklin-chat-close" type="button" aria-label="Close Franklin Assistant">×</button></header><div class="franklin-chat-transcript" data-fallback-body></div><div class="franklin-chat-composer"><div class="franklin-chat-compose-actions"><button class="button primary" type="button" data-assistant-retry>Retry</button></div></div></div>';d.querySelector('[data-assistant-retry]').addEventListener('click',()=>location.reload());document.body.append(d);d.querySelector('.franklin-chat-close').addEventListener('click',()=>d.close())}
    const b=d.querySelector('[data-fallback-body]');b.replaceChildren();
    if(question){const u=document.createElement('div');u.className='franklin-chat-row is-user';u.innerHTML='<div class="franklin-chat-bubble"><div class="franklin-chat-message"></div></div>';u.querySelector('.franklin-chat-message').textContent=question;b.append(u)}
    const a=document.createElement('div');a.className='franklin-chat-row is-assistant';a.innerHTML='<div class="franklin-chat-bubble"><div class="franklin-chat-speaker">Franklin Assistant</div><div class="franklin-chat-answer"><p>I could not load the full Assistant just now. Your question was not lost. Please retry, or use Find Local and the Help Center while the Assistant reconnects.</p></div></div>';b.append(a);
    typeof d.showModal==='function'?d.showModal():d.setAttribute('open','');
  };
  form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const q=input?.value?.trim()||'';if(input)input.value='';show(q)},true);
  root.addEventListener('click',e=>{const b=e.target.closest?.('[data-navigator-example]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();show(b.dataset.navigatorExample||b.textContent||'')},true);
  console.error('Franklin Assistant canonical loader failed',err);
};

const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
ready(()=>{
  const body=document.body;
  if(!body)return;
  load('/assets/franklin-site-monitor-r1308.js?v=frnav1308','franklin-site-monitor-r1308').catch(()=>{});
  loadAssistantR1307();
  // R1297 fail-safe Franklin mark + favicon/install icon binding. The header uses the valid vector asset directly; if the request ever fails, the same mark is supplied as an inline data URI so a broken-image glyph is never shown.
  const markFallback="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22112%22%20height%3D%22112%22%20viewBox%3D%220%200%20112%20112%22%20role%3D%22img%22%20aria-label%3D%22Franklin%20Navigator%22%3E%3Crect%20width%3D%22112%22%20height%3D%22112%22%20rx%3D%2227%22%20fill%3D%22%2303454b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%225%22%20width%3D%22102%22%20height%3D%22102%22%20rx%3D%2223%22%20fill%3D%22none%22%20stroke%3D%22%23d8e7e5%22%20stroke-opacity%3D%22.3%22%2F%3E%3Cpath%20d%3D%22M30%2029h54v15H48v15h30v15H48v27H30z%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22m82%2055%2020%2010.5L82%2076l5.9-10.5z%22%20fill%3D%22%23c5943a%22%2F%3E%3C%2Fsvg%3E";
  document.querySelectorAll('header .brand img').forEach(img=>{img.alt='Franklin Navigator';img.width=38;img.height=38;img.onerror=()=>{if(img.dataset.franklinMarkFallback==='1')return;img.dataset.franklinMarkFallback='1';img.src=markFallback};img.src='/assets/franklin-mark.svg?v=frnav1298'});
  const icon=(rel,href,sizes,type)=>{let l=document.querySelector(`link[rel="${rel}"]`);if(!l){l=document.createElement('link');l.rel=rel;document.head.append(l)}l.href=href;if(sizes)l.sizes=sizes;if(type)l.type=type};
  icon('icon','/assets/favicon.svg?v=frnav1298','any','image/svg+xml');icon('shortcut icon','/favicon.ico?v=frnav1298');icon('apple-touch-icon','/assets/franklin-icon-192.png?v=frnav1298','192x192','image/png');
  let mf=document.querySelector('link[rel="manifest"]');if(!mf){mf=document.createElement('link');mf.rel='manifest';document.head.append(mf)}mf.href='/site.webmanifest?v=frnav1298';

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
