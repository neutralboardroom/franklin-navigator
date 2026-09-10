'use strict';
(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const p=()=>location.pathname;
  const es=()=>document.documentElement.lang==='es'||p().startsWith('/es/');
  const tx=(en,sp)=>es()?sp:en;
  const profileRe=/^\/profiles\/[^/]+\/$/;
  const safeText=(el,value)=>{if(el&&typeof value==='string')el.textContent=value};

  function releaseIdentity(){
    let meta=q('meta[name="franklin-release"]');
    if(!meta){meta=document.createElement('meta');meta.name='franklin-release';document.head.append(meta)}
    meta.content='FR-NAV1.22.0-HF3.3';
    document.documentElement.dataset.franklinRelease='FR-NAV1.22.0-HF3.3';
  }

  function markDarkSurfaces(){
    const known=qa('.urgent-section,.history-section,.growth-trust,.growth-boundaries,.home-command-bar,.explorer-hero-card');
    const candidates=qa('main section,main aside').filter(el=>!known.includes(el));
    const dark=el=>{
      const bg=getComputedStyle(el).backgroundColor;
      const m=bg.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);if(!m)return false;
      const [r,g,b]=m.slice(1,4).map(Number);if(r>245&&g>245&&b>245)return false;
      const lum=(0.2126*r+0.7152*g+0.0722*b)/255;return lum<.34;
    };
    known.forEach(el=>el.classList.add('hf33-dark-surface'));
    candidates.forEach(el=>{if(dark(el))el.classList.add('hf33-dark-surface')});
  }

  function normalizeMore(){
    qa('a,button,summary').forEach(el=>{
      const t=(el.textContent||'').trim();
      if(/^(More|Más)\s*(?:\.{3}|…|\+)$/.test(t))safeText(el,tx('More options','Más opciones'));
      if(/Sources & public listing details\s*\+?$/i.test(t))safeText(el,tx('Sources & listing details','Fuentes y detalles del listado'));
    });
  }

  function refineExplorer(){
    const root=q('[data-community-explorer]');if(!root)return;
    document.body.classList.add('hf33-explorer');
    q('.explorer-hero-card',root)?.remove();
    const hero=q('.explorer-hero',root),finder=q('#finder',root);
    if(hero&&finder&&finder.previousElementSibling!==hero)hero.after(finder);
    if(!q('.hf33-explorer-other',root)){
      const activity=qa(':scope>section',root).find(s=>/Activity hubs|Centros de actividades/i.test(s.getAttribute('aria-label')||''));
      const sports=q('.explorer-sport-routes',root);
      if(activity||sports){
        const section=document.createElement('section');section.className='section hf33-explorer-other';
        const wrap=document.createElement('div');wrap.className='wrap';const details=document.createElement('details');
        const summary=document.createElement('summary');summary.textContent=tx('Explore other sports and activities','Explorar otros deportes y actividades');
        const content=document.createElement('div');content.className='hf33-explorer-other-content';
        for(const source of [activity,sports]){if(!source)continue;const sw=q('.wrap',source);if(sw)content.append(...[...sw.children]);source.remove()}
        details.append(summary,content);wrap.append(details);section.append(wrap);finder?.after(section);
      }
    }
    if(/^\/(?:es\/)?sports\/.+/.test(p()))q('.explorer-address',root)?.closest('section')?.remove();
    const current=q('[data-explorer-current-section]',root),grid=q('[data-explorer-current]',root),empty=q('[data-explorer-current-empty]',root);
    const tuneCurrent=()=>{if(!current)return;const cards=Boolean(grid?.querySelector('.explorer-current-card'));const settled=Boolean(empty&&!empty.hidden);current.hidden=!cards&&settled};
    if(current)current.hidden=true;if(grid)new MutationObserver(tuneCurrent).observe(grid,{childList:true,subtree:true});if(empty)new MutationObserver(tuneCurrent).observe(empty,{attributes:true,attributeFilter:['hidden']});
    const shortlist=q('#short-list',root);if(shortlist)shortlist.hidden=true;
    q('[data-explorer-build]',root)?.addEventListener('click',()=>{if(shortlist)shortlist.hidden=false});
    q('[data-explorer-clear]',root)?.addEventListener('click',()=>{if(shortlist)shortlist.hidden=true});
    const results=q('[data-explorer-grid]',root),controls=q('.explorer-controls',root);
    const tune=()=>{if(!results||!controls)return;const n=qa('.explorer-card',results).length;controls.classList.toggle('hf33-small-results',n>0&&n<=4)};
    if(results)new MutationObserver(tune).observe(results,{childList:true,subtree:true});setTimeout(tune,0);
  }

  function refineMyFranklin(){
    if(!['/my-franklin/','/es/mi-franklin/'].includes(p()))return;
    document.body.classList.add('hf33-my-franklin');
    const layout=q('.r22-dashboard-grid'),main=q('.r22-dashboard-main',layout),side=q('.r22-dashboard-side',layout);if(!layout||!main||!side)return;
    q('details.r22-dashboard-card',side)?.removeAttribute('open');
    if(!q('.hf33-my-tools',layout)){
      const tools=document.createElement('div');tools.className='hf33-my-tools';
      [...side.children].forEach(el=>tools.append(el));main.prepend(tools);side.remove();
    }
    qa('.empty-state',main).forEach(el=>el.classList.add('hf33-compact-empty'));
  }

  function memberBenefitBlock(){
    const box=document.createElement('section');box.className='hf33-member-benefit';box.dataset.hf33MemberBenefit='';
    box.innerHTML=`<h2>${tx('Keep the focus on your business','Mantenga la atención en su negocio')}</h2><p>${tx('Active Community Member profiles do not show the Similar local profiles section, so visitors are not shown other local businesses on your profile page.','Los perfiles de Miembros de la Comunidad activos no muestran la sección de perfiles locales similares, por lo que los visitantes no ven otros negocios locales en su página de perfil.')}</p><p class="fine-print">${tx('Membership does not change ordinary Directory ranking or remove other businesses from Franklin Navigator. This benefit applies only to your own public member profile.','La membresía no cambia la clasificación normal del Directorio ni elimina otros negocios de Franklin Navigator. Este beneficio se aplica únicamente a su propio perfil público de miembro.')}</p><div class="hf33-member-compare"><div><strong>${tx('Ordinary public profile','Perfil público ordinario')}</strong><p>${tx('Core public information and verified public contact links. Similar local profiles may appear.','Información pública básica y enlaces de contacto públicos verificados. Pueden aparecer perfiles locales similares.')}</p></div><div><strong>${tx('Community Member profile — $35/year','Perfil de Miembro de la Comunidad — $35/año')}</strong><p>${tx('Richer profile presentation, qualified business details and no Similar local profiles section on your member profile.','Presentación más completa, datos comerciales aprobados y sin sección de perfiles locales similares en su perfil de miembro.')}</p></div></div>`;
    return box;
  }

  function refineBusiness(){
    if(!['/business-dashboard/','/es/negocios/','/membership-start/','/member-profile-preview/'].includes(p()))return;
    document.body.classList.add('hf33-business');
    if(!q('[data-hf33-member-benefit]')){
      const target=qa('main .section,main .r29-hero').find(el=>/Community Membership|Membresía Comunitaria|One simple paid membership|Optional Community Membership/i.test(el.textContent||''));
      if(target)target.insertAdjacentElement('afterend',memberBenefitBlock());else q('main')?.prepend(memberBenefitBlock());
    }
    qa('main p').forEach(el=>{
      let t=el.textContent||'';
      t=t.replace(/Prepare controlled audience plans and appropriate English, Spanish or bilingual communications\. Public contactability is not consent and raw list export is not the product\./g,'Plan useful English, Spanish or bilingual outreach and community participation with clear, practical tools.');
      t=t.replace(/without unrestricted raw contact exports or guaranteed outcomes\.?/g,'with practical English, Spanish or bilingual planning tools.');
      if(t!==el.textContent)el.textContent=t;
    });
    const hero=q('.r29-hero');if(hero){const primary=q('.actions a.primary',hero);if(primary&&/member options/i.test(primary.textContent||'')){primary.href='/claim-profile/';primary.textContent=tx('Find or review my profile','Buscar o revisar mi perfil')}}
  }

  function refineHelp(){
    if(!['/community-help-center/','/es/centro-de-ayuda/'].includes(p()))return;
    document.body.classList.add('hf33-help');const main=q('main');if(!main)return;
    const hero=q('main>[class*="hero"],main>.hero');
    const urgent=q('.urgent-section')||qa('main section').find(s=>/Call 911|Llame al 911|Call or text 988|988/i.test(s.textContent||''));
    if(hero&&urgent&&urgent.previousElementSibling!==hero)hero.after(urgent);
    qa('main img').forEach(img=>{if((img.naturalWidth||0)>900||/Pinkerton/i.test(img.alt||''))img.closest('figure,section,div')?.classList.add('hf33-help-photo')});
    qa('main .eyebrow').forEach(el=>{if(/\b\d+\s+DEEP\b|TRACKS|PATHWAYS/i.test(el.textContent||''))el.textContent=tx('More help','Más ayuda')});
    qa('main p').forEach(el=>{let t=el.textContent||'';if(/No account, server submission, browser storage, analytics, external AI or automatic sharing/i.test(t))el.textContent=tx('Your selections stay in this tab and are not sent to Franklin Navigator.','Sus selecciones permanecen en esta pestaña y no se envían a Franklin Navigator.')});
    const plan=q('.explorer-plan,[data-help-plan-output],.help-plan-output');if(plan&&!plan.textContent.trim())plan.classList.add('hf33-hidden-empty');
  }

  function titleCase(s){return String(s||'').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bAnd\b/g,'and').replace(/\bOf\b/g,'of')}
  function refineDirectoryCard(card){
    if(!card||card.dataset.hf33Ready==='1')return;
    qa('p,span,small',card).forEach(el=>{
      let t=el.textContent||'';
      if(/^Source date:\s*/i.test(t))el.textContent=t.replace(/^Source date:\s*/i,tx('Last checked ','Última verificación '));
      if(/Public IRS filing address geocoded/i.test(t))el.textContent=tx('Public filing address in the Franklin/Williamson County area.','Dirección pública de registro en el área de Franklin/condado de Williamson.');
    });
    const tag=q('.category-tag,.hf31-result-category',card);if(tag&&tag.textContent.length<60)tag.textContent=titleCase(tag.textContent);
    card.dataset.hf33Ready='1';
  }
  function refineDirectory(){
    if(!['/directory/','/es/directorio/'].includes(p()))return;document.body.classList.add('hf33-directory');
    const root=q('[data-franklin-discovery]');if(!root)return;
    const results=q('[data-dir-results]',root),search=q('[data-dir-search]',root),cat=q('[data-dir-category]',root);
    const active=()=>{document.body.classList.toggle('hf33-directory-active',Boolean(search?.value.trim()||cat?.value));qa('.r22-profile-result',results).forEach(refineDirectoryCard)};
    if(results)new MutationObserver(active).observe(results,{childList:true,subtree:true});search?.addEventListener('input',active);cat?.addEventListener('change',active);active();
    if(!q('.hf33-directory-shortcuts',root)){
      const shortcuts=document.createElement('div');shortcuts.className='hf33-directory-shortcuts';
      const items=es()?['Restaurantes','Servicios para el hogar','Salud','Abogados','Bienes raíces']:['Restaurants','Home services','Health','Attorneys','Real estate'];
      items.forEach(label=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{if(search){search.value=label;search.dispatchEvent(new Event('input',{bubbles:true}));search.focus()}});shortcuts.append(b)});
      q('.r22-directory-meta',root)?.before(shortcuts);
    }
  }

  function contactLabel(a){
    const href=(a.getAttribute('href')||'').toLowerCase();const text=(a.textContent||'').trim();
    if(href.startsWith('tel:'))return tx('Call','Llamar');if(href.startsWith('mailto:'))return tx('Email','Correo');
    if(/maps|directions/.test(href))return tx('Directions','Cómo llegar');if(/book|appointment|schedule/.test(href)||/book|appointment|schedule/i.test(text))return tx('Book','Reservar');
    if(/quote|estimate/.test(href)||/quote|estimate/i.test(text))return tx('Get a quote','Solicitar cotización');if(/menu/.test(href)||/menu/i.test(text))return tx('Menu','Menú');
    if(/order/.test(href)||/order/i.test(text))return tx('Order','Pedir');if(/^https?:/.test(href))return tx('Website','Sitio web');return text;
  }

  function extractHiddenContactActions(group){
    qa('details.hf31-profile-contact-more',group).forEach(details=>{const menu=q('.hf31-more-menu',details);if(menu)[...menu.children].forEach(el=>group.append(el));details.remove()});
    qa(':scope>a,:scope>button',group).forEach(a=>{a.classList.remove('hf31-profile-secondary','r41-secondary-action');a.textContent=contactLabel(a)});
  }

  function entitySpecificAbout(article){
    const section=q(':scope>section',article);if(!section)return;const h=q('h2',section),para=q('p',section);if(!h||!para)return;
    const name=q('.r22-profile-hero h1')?.textContent?.trim(),category=q('.r22-profile-hero .eyebrow')?.textContent?.trim(),loc=q('.profile-location')?.textContent?.trim();
    if(/public-source profile|public information about this listing|includes the listing/i.test(para.textContent||'')){
      h.textContent=tx(`About ${name||'this profile'}`,`Acerca de ${name||'este perfil'}`);
      const parts=[];if(name&&category)parts.push(`${name} is listed as ${category}.`);if(loc)parts.push(`Location: ${loc}.`);parts.push('Use the verified contact and source links on this page to confirm current services, hours, pricing and availability.');para.textContent=parts.join(' ');
    }
  }

  function consolidateProfileControls(article){
    const management=qa(':scope>section',article).find(s=>/Manage or correct this profile|Suggest a correction or claim this profile|Administrar o corregir/i.test(q('h2',s)?.textContent||''));
    const free=q('[data-free-profile-control]');
    if(!management&&!free)return;
    const target=management||free;target.classList.add('hf33-profile-controls');
    const h=q('h2',target);if(h)h.textContent=tx('Manage this profile','Administrar este perfil');
    const pEl=q('p',target);if(pEl)pEl.textContent=tx('Claiming, factual corrections and public-profile removal are separate. Corrections and removal requests are free.','Reclamar, corregir datos y retirar un perfil público son procesos separados. Las correcciones y solicitudes de retiro son gratuitas.');
    const actions=q('.actions',target)||(()=>{const d=document.createElement('div');d.className='actions';target.append(d);return d})();
    const seen=new Set(qa('a',actions).map(a=>new URL(a.href,location.href).pathname+new URL(a.href,location.href).searchParams.get('action')));
    if(free&&free!==target){qa('a',free).forEach(a=>{const u=new URL(a.href,location.href);const key=u.pathname+u.searchParams.get('action');if(!seen.has(key)){actions.append(a);seen.add(key)}});free.remove()}
    qa('details',actions).forEach(d=>{const menu=q('.hf31-more-menu',d);if(menu)[...menu.children].forEach(el=>actions.append(el));d.remove()});
  }

  function moveRelated(profileLayout){
    const side=q(':scope>aside.r22-profile-side',profileLayout);if(!side)return;
    const related=qa(':scope>section',side).find(s=>/Similar local profiles|Related local profiles|Perfiles locales similares/i.test(q('h2',s)?.textContent||''));
    if(!related){side.remove();return}
    const section=document.createElement('section');section.className='hf33-related-section';section.dataset.hf33Related='';
    const h=document.createElement('h2');h.textContent=tx('Similar local profiles','Perfiles locales similares');section.append(h);
    const list=document.createElement('div');list.className='hf33-related-list';qa('p',related).filter(x=>q('a',x)).slice(0,4).forEach(x=>list.append(x));section.append(list);
    const browse=qa('a',related).find(a=>/Browse more|More in this category|Ver más/i.test(a.textContent||''));if(browse)section.append(browse);
    const note=document.createElement('p');note.className='fine-print';note.textContent=tx('Shown by category only — not ranked or recommended. Active Community Member profiles do not show this section.','Se muestran solo por categoría; no están clasificados ni recomendados. Los perfiles de Miembros de la Comunidad activos no muestran esta sección.');section.append(note);
    profileLayout.after(section);side.remove();
  }

  function buildProfileNav(){
    q('.hf33-profile-section-nav')?.remove();
    const sections=qa('.r22-profile-layout>article>section,[data-member-publication] .hf33-member-module').filter(s=>q('h2,h3',s)&&!s.hidden);if(sections.length<3)return;
    const nav=document.createElement('nav');nav.className='hf33-profile-section-nav';nav.setAttribute('aria-label',tx('Profile sections','Secciones del perfil'));const wrap=document.createElement('div');wrap.className='wrap';
    sections.forEach((s,i)=>{if(!s.id)s.id='profile-section-'+(i+1);const a=document.createElement('a');a.href='#'+s.id;a.textContent=(q('h2,h3',s)?.textContent||tx('Section','Sección')).replace(/\s+/g,' ').trim();wrap.append(a)});nav.append(wrap);q('.r22-profile-hero')?.after(nav);
  }

  function refineProfile(){
    if(!profileRe.test(p()))return;document.body.classList.add('hf33-profile');
    const hero=q('.r22-profile-hero'),grid=q('.r22-profile-hero-grid',hero);if(grid){const avatar=q('.profile-avatar',grid),current=q('.profile-currentness',grid);const main=[...grid.children].find(el=>el!==avatar&&el!==current);main?.classList.add('hf33-profile-main');extractHiddenContactActions(q('.profile-primary-actions',main)||document.createElement('div'));}
    const layout=q('.r22-profile-layout');if(layout){const article=q(':scope>article',layout);if(article){entitySpecificAbout(article);const facts=q('.profile-facts-grid',article);if(facts){qa(':scope>div',facts).forEach(d=>{if(/Business or organization/i.test(d.textContent||''))d.remove()})}consolidateProfileControls(article)}moveRelated(layout)}
    if(document.body.dataset.franklinActiveMemberProfile==='true')q('[data-hf33-related]')?.remove();
    buildProfileNav();
  }

  function enrichPublishedMember(){
    if(!profileRe.test(p()))return;const pub=q('[data-member-publication]');if(!pub)return;pub.classList.add('hf33-member-publication');
    const hero=q('.r22-profile-hero'),tagline=q('[data-member-tagline]',pub);if(tagline&&hero&&!q('.hf33-member-tagline',hero)){tagline.classList.add('hf33-member-tagline');q('.profile-location',hero)?.before(tagline)}
    const image=q('[data-member-profile-image]',pub),avatar=q('.profile-avatar');if(image&&avatar){avatar.replaceChildren(image);image.classList.add('hf33-profile-image')}
    const actions=q('[data-member-actions]',pub),heroActions=q('.profile-primary-actions');if(actions&&heroActions){qa('a',actions).forEach(a=>{if(!qa('a',heroActions).some(x=>x.href===a.href)){a.className='button';a.textContent=contactLabel(a);heroActions.append(a)}});actions.remove()}
    if(document.body.dataset.franklinActiveMemberProfile==='true')q('[data-hf33-related]')?.remove();
    buildProfileNav();
  }

  function publicLanguageScrub(){
    const replacements=[
      [/Public contactability is not consent and raw list export is not the product\.?/gi,''],
      [/controlled audience plans/gi,tx('local growth plans','planes de crecimiento local')],
      [/\b\d+\s+DEEP\s+/gi,''],
      [/producer-qualified|consumer acceptance|accepted head advance/gi,'']
    ];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(node.parentElement?.closest('script,style,code,pre,textarea'))continue;let t=node.nodeValue||'',n=t;for(const [re,r] of replacements)n=n.replace(re,r);if(n!==t)node.nodeValue=n}
  }

  function init(){releaseIdentity();document.body.classList.add('hf33-next');normalizeMore();markDarkSurfaces();refineExplorer();refineMyFranklin();refineBusiness();refineHelp();refineDirectory();refineProfile();enrichPublishedMember();publicLanguageScrub()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('load',()=>setTimeout(init,80),{once:true});
  window.addEventListener('franklinlanguagechange',()=>setTimeout(init,0));
  window.addEventListener('franklinmemberprofilechange',()=>setTimeout(()=>{refineProfile();enrichPublishedMember()},0));
})();
