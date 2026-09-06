'use strict';
(()=>{
  const STORAGE_KEY='franklinLanguage';
  const SKIP=new Set(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA']);
  let translations={},categories={},language='en',ready=false,processing=false;
  const textOriginal=new WeakMap(),textApplied=new WeakMap(),attrOriginal=new WeakMap();
  const normalize=s=>String(s??'').replace(/\s+/g,' ').trim();
  const trimWrap=(raw,value)=>{
    const m=String(raw).match(/^(\s*)([\s\S]*?)(\s*)$/);return (m?.[1]||'')+value+(m?.[3]||'');
  };
  function special(s){
    if(categories[s])return categories[s];
    let m;
    if((m=s.match(/^Signed in as (.+)\.$/)))return `Sesión iniciada como ${m[1]}.`;
    if((m=s.match(/^Selected: (.+)$/)))return `Seleccionado: ${m[1]}`;
    if((m=s.match(/^Continue with (.+)$/)))return `Continuar con ${m[1].replace('/month','/mes').replace('/year','/año')}`;
    if((m=s.match(/^Explore (.+)$/)))return `Explorar ${categories[m[1]]||m[1]}`;
    if((m=s.match(/^Last checked (.+)$/)))return `Última verificación: ${m[1]}`;
    if((m=s.match(/^checked (.+)$/i)))return `verificado ${m[1]}`;
    if((m=s.match(/^Franklin Navigator has public-source identity, category and location information for (.+)\. A richer description has not been added from a current public source or the organization\.$/)))return `Franklin Navigator tiene información de identidad, categoría y ubicación de fuentes públicas para ${m[1]}. No se ha añadido una descripción más detallada desde una fuente pública actual o la organización.`;
    if((m=s.match(/^(.+?) — (.+?) in the Franklin area\. Public-source facts, contact routes and currentness information\.$/)))return `${m[1]} — ${categories[m[2]]||m[2]} en el área de Franklin. Datos de fuentes públicas, vías de contacto e información de vigencia.`;
    if((m=s.match(/^Current named member\/resource serving the Williamson, Inc\. directory community; a street address is not asserted by the cited source\.$/)))return 'Miembro o recurso actual incluido en el directorio de Williamson, Inc.; la fuente citada no afirma una dirección específica.';
    if((m=s.match(/^Current named resource in City of Franklin's official public sitemap\/directory; street address is not asserted by the cited source\.$/)))return 'Recurso actual incluido en el mapa del sitio o directorio público oficial de la Ciudad de Franklin; la fuente citada no afirma una dirección específica.';
    if((m=s.match(/^Current named resource in the assigned community's official public directory; street address is not asserted by the cited source\.$/)))return 'Recurso actual incluido en el directorio público oficial de la comunidad; la fuente citada no afirma una dirección específica.';
    if((m=s.match(/^Current named resource in the assigned community; exact street address not asserted by the cited source\.$/)))return 'Recurso actual de la comunidad; la fuente citada no afirma una dirección exacta.';
    return null;
  }
  function translated(s){
    const n=normalize(s); if(!n)return null;
    return translations[n]??special(n);
  }
  function applyText(node){
    if(!node?.parentElement||SKIP.has(node.parentElement.tagName))return;
    if(!textOriginal.has(node))textOriginal.set(node,node.nodeValue);
    const en=textOriginal.get(node);
    const t=language==='en'?en:(translated(en)??en);
    const desired=language==='en'?en:trimWrap(en,t);
    textApplied.set(node,desired);
    if(node.nodeValue!==desired)node.nodeValue=desired;
  }
  function attrMap(el){let m=attrOriginal.get(el);if(!m){m=new Map();attrOriginal.set(el,m)}return m}
  function applyAttr(el,name){
    const value=el.getAttribute(name);if(value==null)return;const map=attrMap(el);if(!map.has(name))map.set(name,value);const en=map.get(name);
    if(language==='en'){if(el.getAttribute(name)!==en)el.setAttribute(name,en);return}
    const t=translated(en);if(t!=null)el.setAttribute(name,t);
  }
  function applyMeta(el){if(el.tagName==='META'&&el.getAttribute('name')==='description')applyAttr(el,'content')}
  function walk(root=document){
    processing=true;
    try{
      if(root.nodeType===Node.TEXT_NODE){applyText(root);return}
      if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
      if(root.nodeType===Node.ELEMENT_NODE){for(const a of ['title','aria-label','placeholder','alt'])applyAttr(root,a);applyMeta(root)}
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode(n){if(n.nodeType===Node.ELEMENT_NODE&&SKIP.has(n.tagName))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT}});
      let n;while((n=walker.nextNode())){if(n.nodeType===Node.TEXT_NODE)applyText(n);else{for(const a of ['title','aria-label','placeholder','alt'])applyAttr(n,a);applyMeta(n)}}
      if(root===document||root===document.documentElement){document.documentElement.lang=language;document.title=language==='es'?(translated(document.title)||document.title):(attrOriginal.get(document.querySelector('title'))?.get('textContent')||document.title)}
    }finally{processing=false}
  }
  function setPressed(){document.querySelectorAll('[data-r37-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.r37Lang===language)))}
  function counterpart(lang){if(!document.body)return null;return lang==='es'?document.body.dataset.r37EsPath:document.body.dataset.r37EnPath}
  function preserveSuffix(path){return path+location.search+location.hash}
  function setLanguage(lang,{save=true,navigate=true}={}){language=lang==='es'?'es':'en';if(save){try{localStorage.setItem(STORAGE_KEY,language)}catch{}}const target=counterpart(language);if(navigate&&target&&target!==location.pathname){location.assign(preserveSuffix(target));return}document.documentElement.lang=language;setPressed();withObserverPaused(()=>{walk(document.body);applyHead()});window.dispatchEvent(new CustomEvent('franklinlanguagechange',{detail:{language}}))}
  function applyHead(){
    const title=document.querySelector('title');if(title){if(!title.dataset.r37En)title.dataset.r37En=title.textContent;title.textContent=language==='es'?(translated(title.dataset.r37En)||title.dataset.r37En):title.dataset.r37En}
    document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[property="og:title"]').forEach(el=>applyAttr(el,'content'));
  }
  async function load(){
    const [t,c]=await Promise.all([
      fetch('/data/r37-es-public-strings.json',{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error('translation catalog');return r.json()}),
      fetch('/data/r37-es-profile-categories.json',{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error('category catalog');return r.json()}),
    ]);
    translations=t.translations||{};categories=c.categories||{};ready=true;
  }
  function bindControls(){document.querySelectorAll('[data-r37-lang]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.r37Lang)))}
  let observing=false;
  function observeBody(){if(document.body&&!observing){observer.observe(document.body,{childList:true,subtree:true,characterData:true});observing=true}}
  function withObserverPaused(fn){const was=observing;if(was){observer.disconnect();observing=false}try{return fn()}finally{if(was)observeBody()}}
  const observer=new MutationObserver(records=>{if(processing||!ready)return;observer.disconnect();observing=false;try{for(const rec of records){if(rec.type==='characterData'){const node=rec.target;textOriginal.set(node,node.nodeValue);applyText(node)}for(const n of rec.addedNodes)walk(n)}}finally{observeBody()}});
  window.FranklinI18n={get language(){return language},setLanguage,translate:s=>language==='es'?(translated(s)||s):s,category:s=>language==='es'?(categories[s]||s):s};
  document.addEventListener('DOMContentLoaded',async()=>{
    bindControls();
    let saved=null;try{saved=localStorage.getItem(STORAGE_KEY)}catch{}
    const legacyEs=location.pathname==='/es/'||location.pathname.startsWith('/es/');
    language=saved==='en'||saved==='es'?saved:(legacyEs?'es':'en');setPressed();
    const route=counterpart(language);if(route&&route!==location.pathname){location.replace(preserveSuffix(route));return}
    try{await load();setLanguage(language,{save:false,navigate:false});observeBody()}
    catch{document.documentElement.lang=language;setPressed()}
  });
})();
