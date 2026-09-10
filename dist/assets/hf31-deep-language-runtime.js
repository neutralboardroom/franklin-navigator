'use strict';
(()=>{
  const root=document.querySelector('[data-community-explorer]');
  if(!root)return;
  const isEs=()=>document.documentElement.lang==='es'||location.pathname.startsWith('/es/');
  const replacements=[
    [/First-party Franklin venue route/gi,'Franklin venue information'],
    [/first-party Franklin-serving route/gi,'local Franklin option'],
    [/first-party and official discovery routes/gi,'official and organization sources'],
    [/official and first-party discovery routes/gi,'official and organization sources'],
    [/official or first-party link/gi,'official or organization link'],
    [/official or first-party source/gi,'official or organization source'],
    [/first-party source/gi,'organization source'],
    [/first-party/gi,'organization-provided'],
    [/source-backed/gi,'based on public information'],
    [/responsible-source/gi,'official local'],
    [/source route checked/gi,'checked'],
    [/source routes reviewed/gi,'information reviewed'],
    [/canonical profiles/gi,'public profiles'],
    [/coverage floor/gi,'local options'],
    [/current evidence state/gi,'current information'],
    [/needs recheck before publication/gi,'check current details before using'],
    [/privacy check before generation/gi,'privacy check'],
    [/evidence window/gi,'date range'],
    [/follow-through plan/gi,'step-by-step plan'],
    [/de primera fuente/gi,'de la organización'],
    [/de primera parte/gi,'de la organización'],
    [/respaldad[oa]s? por fuentes públicas/gi,'basados en información pública'],
    [/fuentes responsables/gi,'fuentes oficiales'],
    [/ruta de fuente revisada/gi,'revisado'],
    [/rutas de fuentes revisadas/gi,'información revisada'],
    [/perfiles canónicos/gi,'perfiles públicos'],
    [/ventana de evidencia/gi,'periodo indicado'],
    [/puntos de partida locales/gi,'opciones locales'],
    [/puntos de partida/gi,'opciones']
  ];
  const exact=new Map([
    ['Franklin venue information for league bowling and standings. Confirm current league openings, schedule, format, fees and lane availability.','Franklin Family Entertainment Center provides bowling league information and standings. Check its source for current openings, schedules, formats, fees and lane availability.'],
    ['Información del local de Franklin para ligas de boliche y posiciones. Confirme aperturas actuales de ligas, horarios, formato, costos y disponibilidad de pistas.','Franklin Family Entertainment Center ofrece información sobre ligas de boliche y posiciones. Consulte su fuente para confirmar inscripciones, horarios, formatos, costos y disponibilidad de pistas.']
  ]);
  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
  const transform=value=>{
    const n=normalize(value);if(!n)return value;
    let out=exact.get(n)||n;
    for(const [re,repl] of replacements)out=out.replace(re,repl);
    return out;
  };
  const cleanNode=node=>{
    if(!node||node.nodeType!==Node.TEXT_NODE)return;
    if(node.parentElement?.closest('script,style,noscript,code,textarea'))return;
    const raw=node.nodeValue||'',clean=transform(raw);
    if(normalize(raw)!==clean){
      const lead=(raw.match(/^\s*/)||[''])[0],trail=(raw.match(/\s*$/)||[''])[0];node.nodeValue=lead+clean+trail;
    }
  };
  const clean=base=>{
    if(!base)return;
    if(base.nodeType===Node.TEXT_NODE){cleanNode(base);return}
    const w=document.createTreeWalker(base,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))cleanNode(n);
  };
  clean(root);
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='characterData')cleanNode(record.target);
      for(const node of record.addedNodes)clean(node);
    }
  });
  observer.observe(root,{childList:true,subtree:true,characterData:true});
  window.addEventListener('franklinlanguagechange',()=>setTimeout(()=>clean(root),0));
  window.addEventListener('load',()=>setTimeout(()=>clean(root),300),{once:true});
})();
