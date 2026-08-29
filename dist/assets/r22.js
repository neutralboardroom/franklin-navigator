(() => {
  const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9@.+\s-]/g,' ').replace(/\s+/g,' ').trim();
  const html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Homepage Ask Navigator helper: routes the typed question into the existing deterministic bot field.
  const homeQ=qs('#r22-home-question');
  qsa('[data-r22-question]').forEach(btn=>btn.addEventListener('click',()=>{if(homeQ){homeQ.value=btn.dataset.r22Question||'';homeQ.focus()}}));
  qs('[data-r22-ask-submit]')?.addEventListener('click',()=>{const q=homeQ?.value.trim();if(!q)return homeQ?.focus();location.href=`/?ask=${encodeURIComponent(q)}#ask-navigator`});
  qs('[data-r22-speak]')?.addEventListener('click',()=>{const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){alert('Voice input is not available in this browser.');return}const r=new Recognition();r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;r.onresult=e=>{if(homeQ)homeQ.value=e.results[0][0].transcript};r.start()});

  // Reminder handoff: My Franklin remains the only browser-storage surface.
  qsa('[data-r22-remind]').forEach(btn=>btn.addEventListener('click',()=>{
    const label=String(btn.dataset.r22Remind||'').slice(0,120),date=String(btn.dataset.r22Date||'');
    const params=new URLSearchParams({newReminder:label});if(/^\d{4}-\d{2}-\d{2}$/.test(date))params.set('date',date);
    location.href=`/my-franklin/?${params.toString()}#follow-ups`;
  }));

  // Today filters and automatic expiry: expired cards leave the current view while provenance stays in the source data package.
  const todayGrid=qs('[data-today-grid]');
  if(todayGrid){
    const cards=qsa('[data-event-category]',todayGrid),empty=qs('[data-today-empty]');
    let active='All';
    const render=()=>{const now=Date.now();let visible=0;for(const c of cards){const end=Date.parse(c.dataset.eventEnd||'');const expired=Number.isFinite(end)&&end<now;const match=active==='All'||c.dataset.eventCategory===active;c.hidden=expired||!match;if(!c.hidden)visible++}if(empty)empty.hidden=visible!==0};
    qsa('[data-today-filters] button').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.filter||'All';qsa('[data-today-filters] button').forEach(x=>x.classList.toggle('active',x===b));render()}));
    render();setInterval(render,60000);
  }

  // Get It Done search/filter.
  const taskGrid=qs('[data-task-grid]');
  if(taskGrid){
    const cards=qsa('.task-card',taskGrid),search=qs('[data-task-search]'),empty=qs('[data-task-empty]');let cat='All';
    const render=()=>{const q=norm(search?.value);let visible=0;for(const c of cards){const okCat=cat==='All'||c.dataset.category===cat,okQ=!q||norm(c.dataset.task).includes(q);c.hidden=!(okCat&&okQ);if(!c.hidden)visible++}if(empty)empty.hidden=visible!==0};
    search?.addEventListener('input',render);qsa('[data-task-categories] button').forEach(b=>b.addEventListener('click',()=>{cat=b.dataset.category||'All';qsa('[data-task-categories] button').forEach(x=>x.classList.toggle('active',x===b));render()}));render();
  }

  // R22 directory: fast factual discovery without ranking/score semantics.
  const dir=qs('[data-r22-directory]');
  if(dir){
    const search=qs('[data-dir-search]',dir),category=qs('[data-dir-category]',dir),type=qs('[data-dir-type]',dir),area=qs('[data-dir-area]',dir),sort=qs('[data-dir-sort]',dir),facts=qsa('[data-dir-fact]',dir),results=qs('[data-dir-results]',dir),count=qs('[data-dir-count]',dir),pageEl=qs('[data-dir-page]',dir),prev=qs('[data-dir-prev]',dir),next=qs('[data-dir-next]',dir),clear=qs('[data-dir-clear]',dir),tray=qs('[data-dir-compare]',dir),trayCount=qs('[data-dir-compare-count]',dir),trayBody=qs('[data-dir-compare-body]',dir),compareOpen=qs('[data-dir-compare-open]',dir),compareClear=qs('[data-dir-compare-clear]',dir);
    const selected=new Map();let rows=[],filtered=[],page=0;const perPage=24;
    const label=v=>String(v||'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().replace(/\b\w/g,c=>c.toUpperCase());
    const load=async()=>{const manifest=await fetch('/data/franklin-profiles-manifest.json').then(r=>r.json());const chunks=await Promise.all(manifest.chunks.map(c=>fetch(c.file).then(r=>r.json())));rows=chunks.flatMap(c=>c.records);populate();apply()};
    const populate=()=>{
      const cats=[...new Set(rows.map(r=>r.c).filter(Boolean))].sort((a,b)=>a.localeCompare(b));category.insertAdjacentHTML('beforeend',cats.map(v=>`<option value="${html(v)}">${html(v)}</option>`).join(''));
      const types=[...new Set(rows.map(r=>r.t).filter(Boolean))].sort();type.insertAdjacentHTML('beforeend',types.map(v=>`<option value="${html(v)}">${html(label(v))}</option>`).join(''));
      const areas=[...new Set(rows.map(r=>r.g).filter(Boolean))].sort();area.insertAdjacentHTML('beforeend',areas.map(v=>`<option value="${html(v)}">${html(v)}</option>`).join(''));
      const params=new URLSearchParams(location.search);if(params.get('q'))search.value=params.get('q');if(params.get('category'))category.value=params.get('category');
    };
    const apply=()=>{const q=norm(search.value),cat=category.value,t=type.value,a=area.value,required=new Set(facts.filter(f=>f.checked).map(f=>f.value));filtered=rows.filter(r=>{
      const hay=norm([r.n,r.c,r.t,r.g,r.l].join(' '));if(q&&!hay.includes(q))return false;if(cat&&r.c!==cat)return false;if(t&&r.t!==t)return false;if(a&&r.g!==a)return false;if(required.has('website')&&!r.w)return false;if(required.has('phone')&&!r.p)return false;if(required.has('email')&&!r.e)return false;if(required.has('address')&&!r.h)return false;return true});
      const s=sort.value;filtered.sort((x,y)=>s==='checked'?String(y.d||'').localeCompare(String(x.d||''))||x.n.localeCompare(y.n):s==='website'?Number(Boolean(y.w))-Number(Boolean(x.w))||x.n.localeCompare(y.n):s==='address'?Number(Boolean(y.h))-Number(Boolean(x.h))||x.n.localeCompare(y.n):x.n.localeCompare(y.n));page=0;render();
    };
    const card=r=>`<article class="r22-profile-result"><a class="result-title" href="/profiles/${encodeURIComponent(r.i)}/"><h3>${html(r.n)}</h3></a><button class="category-tag" type="button" data-category-jump="${html(r.c||'')}">${html(r.c||label(r.t))}</button><p>${html(r.l||r.g||'Franklin area')}</p><p class="fine-print">Last checked ${html(r.d||'—')}</p><div class="result-facts">${r.p?'<span>Phone</span>':''}${r.w?'<span>Website</span>':''}${r.e?'<span>Email</span>':''}${r.h?'<span>Exact address</span>':''}</div><div class="result-actions"><a class="button small primary" href="/profiles/${encodeURIComponent(r.i)}/">Open profile</a><button class="button small" type="button" data-compare-id="${html(r.i)}">Compare</button><a class="button small" href="/my-franklin/?saveProfile=${encodeURIComponent(r.i)}&chunk=${r.x}">☆ Save</a>${r.w?`<a class="button small" href="${html(r.w)}" rel="noopener">Website ↗</a>`:''}</div></article>`;
    const render=()=>{const max=Math.max(1,Math.ceil(filtered.length/perPage));if(page>=max)page=max-1;const start=page*perPage;results.innerHTML=filtered.slice(start,start+perPage).map(card).join('')||'<p class="empty-state">No profiles match these filters.</p>';count.textContent=`${filtered.length.toLocaleString()} result${filtered.length===1?'':'s'}`;pageEl.textContent=`Page ${page+1} of ${max}`;prev.disabled=page<=0;next.disabled=page>=max-1;bindCards()};
    const bindCards=()=>{qsa('[data-category-jump]',results).forEach(b=>b.addEventListener('click',()=>{category.value=b.dataset.categoryJump;apply();scrollTo({top:dir.offsetTop-90,behavior:'smooth'})}));qsa('[data-compare-id]',results).forEach(b=>b.addEventListener('click',()=>toggleCompare(b.dataset.compareId,b)))};
    const toggleCompare=(id,button)=>{if(selected.has(id)){selected.delete(id);button.textContent='Compare'}else if(selected.size<3){const r=rows.find(x=>x.i===id);if(r){selected.set(id,r);button.textContent='Selected'}}renderTray()};
    const renderTray=()=>{tray.hidden=selected.size===0;trayCount.textContent=String(selected.size);if(!tray.hidden)trayBody.innerHTML=`<div class="compare-mini">${[...selected.values()].map(r=>`<span>${html(r.n)}</span>`).join('')}</div>`};
    compareClear?.addEventListener('click',()=>{selected.clear();renderTray();render()});compareOpen?.addEventListener('click',()=>{const s=[...selected.values()];trayBody.innerHTML=s.length?`<div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>Fact</th>${s.map(r=>`<th>${html(r.n)}</th>`).join('')}</tr></thead><tbody>${[['Category',r=>r.c],['Location',r=>r.l],['Website',r=>r.w?'Available':'—'],['Phone',r=>r.p||'—'],['Public email',r=>r.e||'—'],['Last checked',r=>r.d||'—']].map(([label,fn])=>`<tr><th>${label}</th>${s.map(r=>`<td>${html(fn(r))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p>Select up to three profiles.</p>'});
    [search,category,type,area,sort,...facts].forEach(el=>el?.addEventListener(el===search?'input':'change',apply));clear?.addEventListener('click',()=>{search.value='';category.value='';type.value='';area.value='';sort.value='name';facts.forEach(f=>f.checked=false);apply()});prev?.addEventListener('click',()=>{if(page>0){page--;render();scrollTo({top:dir.offsetTop-90,behavior:'smooth'})}});next?.addEventListener('click',()=>{if((page+1)*perPage<filtered.length){page++;render();scrollTo({top:dir.offsetTop-90,behavior:'smooth'})}});load().catch(()=>{results.innerHTML='<p class="empty-state">The local directory could not be loaded. Please try again.</p>'});
  }

  // Member profile preview studio - local only; no upload, no publish.
  const studio=qs('[data-profile-studio]');
  if(studio){
    const form=qs('form',studio),preview=qs('[data-profile-preview]',studio);let logoUrl='',photoUrls=[];
    const revoke=()=>{if(logoUrl)URL.revokeObjectURL(logoUrl);photoUrls.forEach(URL.revokeObjectURL)};
    const render=()=>{const fd=new FormData(form),name=fd.get('name')||'Your Franklin business',category=fd.get('category')||'Local business',website=fd.get('website'),phone=fd.get('phone'),email=fd.get('email'),description=fd.get('description'),services=String(fd.get('services')||'').split(',').map(x=>x.trim()).filter(Boolean),hours=fd.get('hours'),languages=fd.get('languages'),accessibility=fd.get('accessibility');preview.innerHTML=`<article class="member-preview-card"><div class="member-preview-head">${logoUrl?`<img class="member-preview-logo" src="${logoUrl}" alt="Preview logo">`:`<div class="profile-avatar large">${html(String(name).split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())}</div>`}<div><div class="eyebrow">${html(category)}</div><h2>${html(name)}</h2><p>Franklin member profile preview</p></div></div><div class="actions">${website?`<a class="button primary" href="${html(website)}" target="_blank" rel="noopener">Visit website</a>`:''}${phone?`<a class="button" href="tel:${html(String(phone).replace(/[^+\d]/g,''))}">Call</a>`:''}${email?`<a class="button" href="mailto:${html(email)}">Email</a>`:''}</div>${description?`<h3>About</h3><p>${html(description)}</p>`:''}${services.length?`<h3>Services</h3><div class="r22-tags">${services.map(s=>`<span>${html(s)}</span>`).join('')}</div>`:''}<div class="profile-facts-grid">${hours?`<div><span>Hours</span><strong>${html(hours)}</strong></div>`:''}${languages?`<div><span>Languages</span><strong>${html(languages)}</strong></div>`:''}${accessibility?`<div><span>Accessibility</span><strong>${html(accessibility)}</strong></div>`:''}</div>${photoUrls.length?`<div class="member-preview-gallery">${photoUrls.map(u=>`<img src="${u}" alt="Member gallery preview">`).join('')}</div>`:''}<p class="fine-print">Preview only. Nothing here is uploaded, claimed or published.</p></article>`};
    const updateFiles=()=>{revoke();const logo=form.elements.logo.files?.[0];if(logo)logoUrl=URL.createObjectURL(logo);photoUrls=[...(form.elements.photos.files||[])].slice(0,6).map(f=>URL.createObjectURL(f));render()};
    form.addEventListener('input',e=>{if(e.target.type==='file')updateFiles();else render()});render();window.addEventListener('beforeunload',revoke);
  }

  // Pricing preview: hide dollar amounts until a category is deliberately chosen, while remaining display-only.
  const pricing=qs('[data-pricing-preview]');
  if(pricing){const sel=qs('[data-pricing-category]',pricing),plans=qs('[data-pricing-plans]',pricing),placeholder=qs('[data-pricing-placeholder]',pricing);let data=null;fetch('/data/r22-pricing-preview.json').then(r=>r.json()).then(d=>data=d).catch(()=>{});sel?.addEventListener('change',()=>{const v=data?.verticals?.find(x=>x.id===sel.value);if(!v){plans.hidden=true;placeholder.hidden=false;return}placeholder.hidden=true;plans.hidden=false;plans.innerHTML=v.plans.map(t=>`<article class="r22-card"><div class="eyebrow">${html(t==='OFFICE'?'Office / Location':t[0]+t.slice(1).toLowerCase())}</div><h3>${html(t==='INDIVIDUAL'?'One owner / professional':t==='TEAM'?'Small team':t==='OFFICE'?'Office or location':'Larger / multi-location organization')}</h3><p>Exact authorized monthly and annual pricing will appear here when enrollment and checkout open.</p></article>`).join('')})}
})();
