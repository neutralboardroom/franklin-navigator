(()=>{'use strict';
const C=window.FranklinAssistantCore,R=window.FranklinAssistantR1296Core||window.FranklinAssistantR1295Core||window.FranklinAssistantR1294Core,F=window.FranklinAssistantFilesR1293,root=document.querySelector('[data-navigator-bot]');if(!C||!R||!root)return;
const form=root.querySelector('form'),input=root.querySelector('[data-navigator-input]'),legacyOutput=root.querySelector('[data-navigator-output]');if(!form||!input||!legacyOutput)return;let output=legacyOutput;
const VERSION='FR-NAV1.30.1-HF3.11.1',ROUTE_RELEASE='FR-NAV1.29.2-HF3.10.2',COMMUNITY='FRANKLIN_TN',DIR_MANIFEST='/data/discovery/manifest.json',DIR_SHA='d97640231d541f5a4f67ac26782806fc933237a39566e6e59561ea82e894e225',ANSWER_API='https://franklin-navigator-assistant.onrender.com/api/answer';
let routePromise,dirPromise;const pageCache=new Map();root.dataset.franklinAssistantR1296='1';root.dataset.franklinAssistantVersion=VERSION;document.querySelector('meta[name="franklin-release"]')?.setAttribute('content',VERSION);
const lang=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('es')?'es':'en',tx=(en,es)=>lang()==='es'?es:en;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};const trim=(v,n=340)=>{const s=String(v||'').replace(/\s+/g,' ').trim();return s.length<=n?s:s.slice(0,n-1).replace(/\s+\S*$/,'')+'…'};const title=v=>String(v||'').replace(/\s*\|\s*Franklin Navigator\s*$/i,'').trim();
const safeWeb=v=>{try{const u=new URL(String(v||''));return /^https?:$/.test(u.protocol)&&!u.username&&!u.password&&u.hostname.includes('.')?u.href:''}catch{return''}};const phone=v=>{const s=String(v||''),d=s.replace(/\D/g,'');return /^[+\d().\s-]{7,30}$/.test(s)&&d.length>=7?'tel:'+s.replace(/[^+\d]/g,''):''};const email=v=>{const s=String(v||'');return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(s)?'mailto:'+s:''};
const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function verified(url,expected,max){if(!crypto?.subtle)throw Error('Secure source checking unavailable');const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),20000);try{const r=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-cache',signal:ctl.signal});if(!r.ok)throw Error('Source unavailable');const declared=Number(r.headers.get('content-length')||0);if(declared>max)throw Error('Source too large');const b=await r.arrayBuffer();if(b.byteLength>max||await hash(b)!==expected)throw Error('Source changed');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b))}finally{clearTimeout(timer)}}
async function routes(){if(!routePromise)routePromise=Promise.all(C.ROUTE_SHARDS.map(async([path,sha],i)=>{const d=await verified(path,sha,500000);if(d.schemaVersion!=='franklin.assistant-route-shard.v1'||d.community!==COMMUNITY||d.release!==ROUTE_RELEASE||d.shard!==String(i).padStart(2,'0')||!Array.isArray(d.records)||d.records.length!==d.recordCount)throw Error('Wrong route shard');return d.records})).then(x=>x.flat()).then(x=>{if(x.length!==254)throw Error('Route count mismatch');return x}).catch(e=>{routePromise=undefined;throw e});return routePromise}
function decodeIndex(raw){if(!raw||raw.schemaVersion!=='franklin.discovery-index.v1'||raw.community!==COMMUNITY||!Array.isArray(raw.rows)||raw.rows.length!==raw.recordCount)throw Error('Wrong directory source');const d=(k,i)=>Array.isArray(raw[k])&&Number.isInteger(i)&&i>=0&&i<raw[k].length?String(raw[k][i]||''):'';return raw.rows.map(a=>({id:String(a[0]||''),name:String(a[1]||''),location:String(a[2]||''),category:d('categories',a[3]),type:d('types',a[4]),area:d('areas',a[5]),websiteHref:safeWeb(d('websites',a[6])),phoneHref:phone(a[7]),emailHref:email(a[8]),exact:a[10]===true})).filter(x=>x.id&&x.name)}
async function directory(){if(!dirPromise)dirPromise=(async()=>{const m=await verified(DIR_MANIFEST,DIR_SHA,64000);if(m.community!==COMMUNITY||m.schemaVersion!=='franklin.discovery-manifest.v1'||m.recordCount!==19103||!m.index)throw Error('Wrong directory manifest');const rows=decodeIndex(await verified(m.index.file,m.index.sha256,12000000));if(rows.length!==m.recordCount)throw Error('Directory count mismatch');return rows})().catch(e=>{dirPromise=undefined;throw e});return dirPromise}
function link(label,href,primary=false){const a=el('a',label,'button'+(primary?' primary':''));a.href=href;if(/^https?:/i.test(href)){a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer'}return a}function actions(items){const d=el('div',null,'actions');items.filter(x=>x&&x[1]).forEach((x,i)=>d.append(link(x[0],x[1],i===0)));return d}
async function routePage(path){if(pageCache.has(path))return pageCache.get(path);const p=(async()=>{try{const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);try{const r=await fetch(path,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-cache',signal:ctl.signal});if(!r.ok||!/text\/html/i.test(r.headers.get('content-type')||''))return null;const html=await r.text();if(html.length>700000)return null;const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return null;main.querySelectorAll('script,style,nav,footer,form,noscript').forEach(n=>n.remove());return{description:trim(doc.querySelector('meta[name="description"]')?.content||'',280),chunks:[...main.querySelectorAll('h1,h2,h3,p,li')].map(n=>trim(n.textContent,520)).filter(x=>x.length>=20)}}finally{clearTimeout(timer)}}catch{return null}})();pageCache.set(path,p);return p}
function sentenceParts(v){return String(v||'').replace(/\s+/g,' ').trim().split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=28&&x.length<=480)}function sentenceScore(s,q){const n=C.norm(s);let score=0;for(const t of C.meaningful(q))if(n.includes(t))score+=8;if(/\b(official|city of franklin|williamson county|confirm|eligible|require|required|free|\$35)\b/i.test(s))score+=3;if(/privacy|cookie|copyright|terms of use/i.test(s))score-=20;return score}
async function localAnswer(hits,q){const pool=[];for(const hit of hits.slice(0,2)){if((hit.score||0)<18)continue;const d=await routePage(hit.rec.p);if(!d)continue;for(const s of sentenceParts([d.description,...d.chunks].join(' '))){const score=sentenceScore(s,q);if(score>0)pool.push({s,score,path:hit.rec.p,title:title(hit.rec.t)})}}pool.sort((a,b)=>b.score-a.score);const chosen=[],seen=new Set();for(const x of pool){const k=C.norm(x.s).slice(0,110);if(!k||seen.has(k))continue;seen.add(k);chosen.push(x);if(chosen.length===2)break}if(!chosen.length)return null;return{text:chosen.map(x=>x.s).join(' '),sources:[...new Map(chosen.map(x=>[x.path,{path:x.path,title:x.title}])).values()]}}
async function routeHits(records,q){const seen=new Set(),hits=[];for(const p of R.preferredRoutes(q,lang())){const rec=records.find(x=>x.l===lang()&&x.p===p);if(rec&&!seen.has(p)){seen.add(p);hits.push({rec,score:200})}}const ids=C.concepts(q);if(ids.length>1){for(const id of ids.slice(0,4)){const h=C.rankRoutes(records,q,lang(),1,id)[0];if(h&&!seen.has(h.rec.p)){seen.add(h.rec.p);hits.push(h)}}}for(const h of C.rankRoutes(records,q,lang(),10)){if(!seen.has(h.rec.p)){seen.add(h.rec.p);hits.push(h)}}return R.rerank(R.cleanRouteHits(hits),q,5)}
function renderDirect(a){if(!a)return;const c=el('article',null,'navigator-result franklin-assistant-answer-first');if(a.title&&!/^Franklin Assistant answer$/i.test(a.title))c.append(el('h3',a.title));c.append(el('p',a.text));output.append(c)}
function renderLocal(a){if(!a?.text)return;output.append(el('p',a.text,'franklin-chat-local-detail'));if(a.sources?.length)output.append(actions([[tx('Source','Fuente'),a.sources[0].path]]))}
function wantsProfilesNow(raw){const t=C.norm(raw),svc=!!C.serviceFor(raw),explicit=/\b(find|show|list|looking for|recommend|hire|contact|call|phone|email|website|websites|near me|nearby|who can|which ones|buscar|mostrar|lista|contratar|contactar|llamar|telefono|correo|sitio web|cerca)\b/.test(t),needService=/\bneed (a|an|some)\b/.test(t)&&svc,permitOnly=/\b(permit|inspection|zoning|license|licensing)\b/.test(t)&&!explicit;return explicit||(needService&&!permitOnly)}
function renderProfileAnswer(hits,q){
  if(!hits.length)return false;
  const askWebsite=/\b(website|websites|site|sites|online|sitio web|sitios web)\b/i.test(q);
  const askPhone=/\b(phone|call|number|telefono|llamar|numero)\b/i.test(q);
  const askEmail=/\b(email|correo)\b/i.test(q);
  const lines=hits.slice(0,5).map(({row})=>{
    const parts=[row.name];
    if(askWebsite&&row.websiteHref)parts.push(row.websiteHref);
    else if(askPhone&&row.phoneHref)parts.push(row.phoneHref.replace(/^tel:/,''));
    else if(askEmail&&row.emailHref)parts.push(row.emailHref.replace(/^mailto:/,''));
    else if(row.location||row.area)parts.push(row.location||row.area);
    return parts.join(' — ');
  });
  const intro=askWebsite?tx('These matching Franklin-area profiles have websites:','Estos perfiles coincidentes del área de Franklin tienen sitios web:')
    :askPhone?tx('Here are matching Franklin-area contacts:','Estos son contactos coincidentes del área de Franklin:')
    :askEmail?tx('Here are matching Franklin-area email contacts:','Estos son contactos de correo coincidentes del área de Franklin:')
    :tx('Here are matching Franklin-area options:','Estas son opciones coincidentes del área de Franklin:');
  output.append(el('p',intro+' '+lines.join('; ')));
  return true;
}
function renderProfiles(hits,q,one=false){if(!hits.length)return;const sec=el('section',null,'franklin-assistant-v3-profiles'),top=hits[0].row;sec.append(el('h3',one&&hits[0].score>=55?tx(`Contact details for ${top.name}`,`Datos de contacto de ${top.name}`):tx('Local matches you can contact','Coincidencias locales que puede contactar')));if(!one)sec.append(el('p',tx('These are factual public-profile matches, not endorsements. Confirm services, credentials where relevant, price and availability directly.','Estas son coincidencias informativas, no recomendaciones. Confirme servicios, credenciales, precio y disponibilidad directamente.')));const grid=el('div',null,'franklin-assistant-profile-grid');hits.slice(0,one?1:3).forEach(({row})=>{const c=el('article',null,'franklin-assistant-profile-card');c.append(el('h4',row.name),el('p',[row.category||row.type,row.location||row.area].filter(Boolean).join(' · '),'franklin-assistant-profile-meta'));const a=[[tx('Open profile','Abrir perfil'),`/profiles/${encodeURIComponent(row.id)}/`]];if(row.phoneHref)a.push([tx('Call','Llamar'),row.phoneHref]);if(row.websiteHref)a.push([tx('Website','Sitio web'),row.websiteHref]);if(row.emailHref)a.push([tx('Email','Correo'),row.emailHref]);c.append(actions(a));grid.append(c)});sec.append(grid);if(!one)sec.append(link(tx('See all matching profiles','Ver todos los perfiles coincidentes'),'/directory/?q='+encodeURIComponent(C.serviceFor(q)?.q||trim(q,80))));output.append(sec)}
async function renderRoutes(hits,q){if(!hits.length||!/\b(more details|details|guide|checklist|steps|show me more|more information|detalles|guia|lista|pasos|mas informacion)\b/i.test(q))return;const h=hits[0];output.append(actions([[tx('More details','Más detalles'),h.rec.p]]))}
async function answerFromRuntime(q){
  const status=el('p',tx('Thinking…','Pensando…'),'franklin-chat-thinking');status.setAttribute('role','status');output.append(status);
  try{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);let r;
    try{
      r=await fetch(ANSWER_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:trim(q,500),language:lang(),history:chatHistory.slice(-8)}),credentials:'omit',referrerPolicy:'no-referrer',signal:ctl.signal})
    }finally{clearTimeout(timer)}
    if(!r.ok)throw Error();
    const d=await r.json();status.remove();
    if(!d?.answer)throw Error();
    output.append(el('p',String(d.answer).trim(),'franklin-chat-direct-answer'));
    return true
  }catch{
    status.remove();
    return false
  }
}
function renderFile(q){const f=F?.get?.();if(!f)return false;const a=F.answer(f.text,q);const c=el('article',null,'navigator-result franklin-assistant-file-answer');c.append(el('h3',tx(`What I found in ${f.name}`,`Lo que encontré en ${f.name}`)),el('p',a.text));if(a.sensitive)c.append(el('p',tx('This file appears to contain sensitive information. Keep it private and avoid sharing the full document unless you trust the recipient.','Este archivo parece contener información sensible. Manténgalo privado y evite compartir el documento completo salvo con un destinatario de confianza.'),'notice'));c.append(el('p',tx('This is a reading aid, not a legal, medical or financial determination. Verify deadlines, eligibility and changing facts with the responsible source.','Esta es una ayuda de lectura, no una determinación legal, médica o financiera. Verifique plazos, elegibilidad y datos cambiantes con la fuente responsable.'),'fine-print'));output.append(c);return true}
function saveSteps(q){try{const legacy=window.FranklinR38Assistant;if(!legacy?.render||['emergency','crisis'].includes(C.mode(q)))return;const tmp=document.createElement('div');legacy.render(tmp,q);const save=tmp.querySelector('.r38-assistant-save');if(save){save.querySelector('h3')?.replaceChildren(document.createTextNode(tx('Keep these next steps','Guardar estos próximos pasos')));output.append(save)}}catch{}}

const conversation=[],chatHistory=[];let lastEffective='',lastService=null,lastTopics=[],busy=false,returnFocus=null;
const followCue=/^(and |also |what about|how about|which |what |where |when |who |why |can |could |do |does |is |are |find |show |tell |give |help )|\b(those|them|these|ones|they|their|it|that|this|same|above|previous)\b/i;
function contextualize(raw){
  const q=String(raw||'').trim();if(!q)return q;
  const svc=C.serviceFor(q),topics=C.concepts(q);
  if(!lastEffective)return q;
  if(svc||topics.length>0){return q}
  if(followCue.test(q)||q.split(/\s+/).length<=7){
    const carry=[];if(lastService?.q)carry.push(lastService.q);for(const t of lastTopics.slice(0,2))carry.push(t.replace(/-/g,' '));
    return [lastEffective,carry.join(' '),q].filter(Boolean).join(' ');
  }
  return q;
}
function recordTurn(raw,effective,answerText=''){conversation.push({role:'user',text:String(raw||'').trim()},{role:'assistant',context:effective});if(conversation.length>24)conversation.splice(0,conversation.length-24);chatHistory.push({role:'user',content:String(raw||'').trim()},{role:'assistant',content:trim(answerText,1600)});if(chatHistory.length>16)chatHistory.splice(0,chatHistory.length-16);lastEffective=effective;lastService=C.serviceFor(effective)||null;lastTopics=C.concepts(effective)}
function fallbackKnown(q){
  const t=C.norm(q),es=lang()==='es';
  if(/\b(roof|roofing|techo|tejado)\b/.test(t)&&/\b(permit|permits|permiso|permisos)\b/.test(t))return es?'Para un reemplazo de techo o una reparación importante en Franklin, cuente con necesitar un permiso de construcción. Para una reparación menor del mismo material, confirme el alcance con Building & Neighborhood Services al 615-794-7012.':'For a roof replacement or substantial roof repair in Franklin, plan on needing a building permit. For a small in-kind repair, confirm the scope with Building & Neighborhood Services at 615-794-7012.';
  if(/\b(city hall|city offices?|ayuntamiento|oficinas? de la ciudad)\b/.test(t)&&/\b(hours?|open|close|horario|abre|cierra)\b/.test(t))return es?'Franklin no tiene un solo horario universal de City Hall porque las oficinas municipales funcionan en varias ubicaciones. Building & Neighborhood Services abre de lunes a viernes de 7:30 a. m. a 5:00 p. m.':'Franklin does not have one universal City Hall hours schedule because City offices operate from several locations. Building & Neighborhood Services is open Monday–Friday, 7:30 a.m.–5:00 p.m.';
  if(/\b(thank you|thanks|gracias)\b/.test(t)&&t.split(' ').length<8)return es?'Con gusto.':'You’re welcome.';
  if(/^(hi|hello|hey|hola)[!. ]*$/.test(t))return es?'Hola. ¿Qué le gustaría saber sobre Franklin?':'Hi. What would you like to know about Franklin?';
  return '';
}
async function renderAnswer(raw,target,effectiveOverride=''){
  output=target||legacyOutput;output.hidden=false;output.replaceChildren();
  if(F?.isBusy?.()){output.append(el('p',tx('I am still reading your attachment. Please wait a moment.','Todavía estoy leyendo el archivo adjunto. Espere un momento.'),'fine-print'));return}
  const displayQ=String(raw||'').trim(),q=String(effectiveOverride||displayQ||'').trim(),hasFile=!!F?.get?.();
  if(!q&&!hasFile){output.append(el('p',tx('Ask a Franklin question, or attach a document, screenshot or photo with readable text.','Haga una pregunta sobre Franklin o adjunte un documento, captura o foto con texto legible.')));return}
  const m=C.mode(q||F?.get?.()?.text||'');
  if(m==='emergency'||m==='crisis'){renderDirect(R.direct(q||F?.get?.()?.text||'',lang()));output.append(actions([[m==='emergency'?tx('Call 911','Llamar al 911'):tx('Call or text 988','Llamar o enviar mensaje al 988'),m==='emergency'?'tel:911':'tel:988']]));return}
  output.replaceChildren();
  const profileIntent=q&&wantsProfilesNow(displayQ||q)&&R.shouldSearchProfiles(q);
  let answered=false,dh=[];

  if(hasFile){answered=renderFile(displayQ||q)||answered}

  if(!answered&&profileIntent){
    try{dh=C.rankDirectory(await directory(),q,5)}catch{}
    const websiteFollow=/\b(website|websites|site|sites|online|sitio web|sitios web)\b/i.test(displayQ)&&/\b(which|ones|those|them|cuales|cu[aá]les)\b/i.test(displayQ);
    if(websiteFollow&&dh.length)dh=dh.filter(x=>x.row.websiteHref);
    if(dh.length)answered=renderProfileAnswer(dh,displayQ||q)||answered;
  }

  if(!answered&&q)answered=await answerFromRuntime(q);

  if(!answered){
    const known=fallbackKnown(q);
    if(known){output.append(el('p',known,'franklin-chat-direct-answer'));answered=true}
  }

  if(!answered){
    const direct=q?R.direct(q,lang()):null;
    if(direct?.text){output.append(el('p',direct.text,'franklin-chat-direct-answer'));answered=true}
  }

  if(!answered)output.append(el('p',tx('I could not verify a reliable answer yet. Tell me one more detail and I’ll answer directly.','Todavía no pude verificar una respuesta confiable. Dígame un detalle más y responderé directamente.')));
  window.FranklinProductHealth?.record?.(hasFile?'assistant_r1301_file':dh.length?'assistant_r1301_profiles':'assistant_r1301_answer');
}
function makePanel(){
  const old=document.querySelector('[data-franklin-chat-panel]');if(old)return old;
  const d=document.createElement('dialog');d.className='franklin-chat-panel';d.dataset.franklinChatPanel='1';d.setAttribute('aria-labelledby','franklin-chat-title');d.innerHTML=`<div class="franklin-chat-shell"><header class="franklin-chat-head"><div><div class="eyebrow">Franklin Assistant</div><h2 id="franklin-chat-title">${tx('Ask Franklin','Pregunte a Franklin')}</h2></div><div class="franklin-chat-head-actions"><a class="franklin-chat-language" href="${lang()==='es'?'/assistant/':'/es/asistente/'}">${lang()==='es'?'English':'Español'}</a><button class="franklin-chat-icon" type="button" data-chat-new>${tx('New chat','Nuevo chat')}</button><button class="franklin-chat-close" type="button" aria-label="${tx('Close Franklin Assistant','Cerrar Franklin Assistant')}">×</button></div></header><div class="franklin-chat-transcript" data-chat-transcript role="log" aria-live="polite" aria-relevant="additions text"></div><form class="franklin-chat-composer" data-chat-composer><textarea rows="2" maxlength="1200" data-chat-input aria-label="${tx('Ask a follow-up','Haga una pregunta de seguimiento')}" placeholder="${tx('Ask a follow-up…','Haga una pregunta de seguimiento…')}"></textarea><div class="franklin-chat-compose-actions"><button class="button" type="button" data-chat-attach>${tx('Attach','Adjuntar')}</button><button class="button primary" type="submit">${tx('Send','Enviar')}</button></div><div class="fine-print" data-chat-file-status aria-live="polite"></div></form></div>`;
  document.body.append(d);
  const transcript=d.querySelector('[data-chat-transcript]'),composer=d.querySelector('[data-chat-composer]'),chatInput=d.querySelector('[data-chat-input]');
  const sourceFile=()=>form.querySelector('.franklin-assistant-file'),sourceStatus=()=>form.querySelector('.franklin-assistant-file-status');
  d.querySelector('[data-chat-attach]').addEventListener('click',()=>sourceFile()?.click());
  const mirror=()=>{d.querySelector('[data-chat-file-status]').textContent=sourceStatus()?.textContent||''};setInterval(mirror,700);
  d.querySelector('.franklin-chat-close').addEventListener('click',()=>d.close());
  d.addEventListener('click',e=>{if(e.target===d)d.close()});
  d.addEventListener('close',()=>{document.body.classList.remove('franklin-chat-open');returnFocus?.focus?.()});
  d.querySelector('[data-chat-new]').addEventListener('click',()=>{conversation.length=0;chatHistory.length=0;lastEffective='';lastService=null;lastTopics=[];transcript.replaceChildren();chatInput.value='';chatInput.focus();window.FranklinProductHealth?.record?.('assistant_r1296_new_chat')});
  composer.addEventListener('submit',e=>{e.preventDefault();send(chatInput.value,d);chatInput.value=''});
  chatInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();composer.requestSubmit()}});
  return d;
}
function openPanel(panel,{focusComposer=true}={}){returnFocus=document.activeElement instanceof HTMLElement?document.activeElement:input;document.body.classList.add('franklin-chat-open');if(!panel.open){typeof panel.showModal==='function'?panel.showModal():panel.setAttribute('open','')}if(focusComposer)requestAnimationFrame(()=>panel.querySelector('[data-chat-input]')?.focus())}
function userBubble(text,panel){const row=el('div',null,'franklin-chat-row is-user'),b=el('div',null,'franklin-chat-bubble');b.append(el('div',text,'franklin-chat-message'));row.append(b);panel.querySelector('[data-chat-transcript]').append(row);return row}
function assistantBubble(panel){const row=el('div',null,'franklin-chat-row is-assistant'),b=el('div',null,'franklin-chat-bubble'),label=el('div',tx('Franklin Assistant','Franklin Assistant'),'franklin-chat-speaker'),body=el('div',null,'franklin-chat-answer');b.append(label,body);row.append(b);panel.querySelector('[data-chat-transcript]').append(row);return body}
function scrollReplyToReadingStart(panel,row,{smooth=true}={}){
  const transcript=panel.querySelector('[data-chat-transcript]');if(!transcript||!row)return;
  const top=Math.max(0,row.offsetTop-10),reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if(typeof transcript.scrollTo==='function')transcript.scrollTo({top,behavior:smooth&&!reduced?'smooth':'auto'});else transcript.scrollTop=top;
}
function ensureReadingSpace(panel,row){
  const transcript=panel.querySelector('[data-chat-transcript]');if(!transcript||!row)return;
  transcript.querySelector('[data-chat-reading-spacer]')?.remove();
  const spacer=el('div',null,'franklin-chat-reading-spacer');spacer.dataset.chatReadingSpacer='1';spacer.setAttribute('aria-hidden','true');
  const room=Math.max(24,transcript.clientHeight-Math.min(row.offsetHeight,transcript.clientHeight)-26);spacer.style.height=room+'px';transcript.append(spacer);
}
async function send(raw,panel=makePanel()){
  const q=String(raw||'').trim(),hasFile=!!F?.get?.();if((!q&&!hasFile)||busy)return;openPanel(panel,{focusComposer:false});panel.querySelector('[data-chat-input]')?.blur();panel.querySelector('[data-chat-reading-spacer]')?.remove();if(q)userBubble(q,panel);
  const body=assistantBubble(panel),row=body.closest('.franklin-chat-row'),transcript=panel.querySelector('[data-chat-transcript]'),effective=contextualize(q);busy=true;panel.classList.add('is-busy');
  let readerMoved=false;const markReaderMove=()=>{readerMoved=true};
  ['wheel','touchstart','pointerdown'].forEach(type=>transcript?.addEventListener(type,markReaderMove,{passive:true}));
  body.append(el('p',tx('Thinking…','Pensando…'),'franklin-chat-thinking'));requestAnimationFrame(()=>scrollReplyToReadingStart(panel,row,{smooth:false}));
  try{await renderAnswer(q,body,effective);recordTurn(q,effective,body.textContent||'')}catch(err){body.replaceChildren(el('p',tx('I could not finish that answer. Please try the question again.','No pude terminar esa respuesta. Intente la pregunta de nuevo.')))}finally{
    busy=false;panel.classList.remove('is-busy');
    ['wheel','touchstart','pointerdown'].forEach(type=>transcript?.removeEventListener(type,markReaderMove));
    ensureReadingSpace(panel,row);
    if(!readerMoved)requestAnimationFrame(()=>scrollReplyToReadingStart(panel,row));
  }
}
F?.install?.(form,input);legacyOutput.hidden=true;legacyOutput.replaceChildren();root.dataset.answerState='chat';
form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const q=input.value;input.value='';send(q)},true);
root.addEventListener('click',e=>{const b=e.target.closest('[data-navigator-example]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();send(b.dataset.navigatorExample||b.textContent)},true);
const oldVoice=root.querySelector('[data-navigator-voice]');if(oldVoice){const v=oldVoice.cloneNode(true);oldVoice.replaceWith(v);const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(SR){v.hidden=false;let listening=false;const rec=new SR();rec.interimResults=false;rec.continuous=false;rec.maxAlternatives=1;const status=root.querySelector('[data-navigator-voice-status]'),set=x=>{if(status)status.textContent=x};rec.addEventListener('start',()=>{listening=true;v.textContent=tx('Listening…','Escuchando…');set(tx('Listening. Speak a Franklin question.','Escuchando. Diga una pregunta sobre Franklin.'))});rec.addEventListener('result',e=>{const t=String(e.results?.[0]?.[0]?.transcript||'').trim();if(t){input.value='';send(t)}});rec.addEventListener('end',()=>{listening=false;v.textContent=tx('🎙 Speak','🎙 Hablar')});rec.addEventListener('error',()=>set(tx('Voice input did not finish. You can keep typing.','La entrada de voz no terminó. Puede seguir escribiendo.')));v.addEventListener('click',()=>{if(listening){rec.stop();return}rec.lang=lang()==='es'?'es-US':'en-US';try{rec.start()}catch{}})}else v.hidden=true}
window.addEventListener('franklinlanguagechange',()=>F?.install?.(form,input));
const publicApi=Object.freeze({version:VERSION,send,renderInto:renderAnswer,conversation:()=>conversation.map(x=>({...x}))});window.FranklinAssistantR1301=publicApi;window.FranklinAssistantR1300=publicApi;window.FranklinAssistantR1299=publicApi;window.FranklinAssistantR1298=publicApi;window.FranklinAssistantR1296=publicApi;window.FranklinAssistantR1294=publicApi;
})();
