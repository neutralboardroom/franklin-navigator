(()=>{'use strict';
const C=window.FranklinAssistantCore,R=window.FranklinAssistantR1296Core||window.FranklinAssistantR1295Core||window.FranklinAssistantR1294Core,F=window.FranklinAssistantFilesR1293,root=document.querySelector('[data-navigator-bot]');if(!C||!R||!root)return;
const form=root.querySelector('form'),input=root.querySelector('[data-navigator-input]'),legacyOutput=root.querySelector('[data-navigator-output]');if(!form||!input||!legacyOutput)return;let output=legacyOutput;
const VERSION='FR-NAV1.30.16-HF3.12.8',ROUTE_RELEASE='FR-NAV1.29.2-HF3.10.2',COMMUNITY='FRANKLIN_TN',DIR_MANIFEST='/data/discovery/manifest.json',DIR_SHA='d97640231d541f5a4f67ac26782806fc933237a39566e6e59561ea82e894e225',ANSWER_API='https://franklin-navigator-assistant.onrender.com/api/answer';
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
function wantsProfilesNow(raw){const t=C.norm(raw),svc=!!C.serviceFor(raw),explicit=/\b(find|show|list|name|names|give me|best|top|recommend|recommended|looking for|hire|contact|call|phone|email|website|websites|near me|nearby|who can|who are|who is|which ones|buscar|mostrar|lista|nombre|nombres|dame|mejor|mejores|recomendar|recomendado|contratar|contactar|llamar|telefono|correo|sitio web|cerca|quien|quienes)\b/.test(t),needService=/\bneed (a|an|some)\b/.test(t)&&svc,permitOnly=/\b(permit|inspection|zoning|license|licensing)\b/.test(t)&&!explicit;return explicit||(needService&&!permitOnly)}
function affirmativeProfileFollow(raw){return /^(ok|okay|yes|yes please|sure|please|show me|go ahead|sounds good|that works|si|sí|claro|por favor|mu[eé]strame|adelante)[!. ]*$/i.test(String(raw||'').trim())}
function contactProfileFollow(raw){return /\b(which|ones|those|them|their|website|websites|phone|number|call|email|contact|address|hours|open|cuales|cu[aá]les|ellos|sus|sitio web|sitios web|telefono|numero|llamar|correo|contacto|direccion|horario)\b/i.test(String(raw||''))}
function requestedProfileCount(raw){const t=C.norm(raw),m=t.match(/\b([1-5])\b/);if(m)return Math.max(1,Math.min(5,Number(m[1])));const words={one:1,two:2,three:3,four:4,five:5,uno:1,dos:2,tres:3,cuatro:4,cinco:5};for(const [w,n] of Object.entries(words))if(new RegExp('\\b'+w+'\\b').test(t))return n;return 3}
function wantsRouteAction(raw){return /\b(more details|details|guide|checklist|steps|show me more|more information|where do i apply|where can i apply|apply|application|form|official page|official website|source|sources|link|page|detalles|guia|lista|pasos|mas informacion|donde solicito|solicitud|formulario|pagina oficial|fuente|fuentes|enlace|pagina)\b/i.test(String(raw||''))}
function wantsSourceLinks(raw){return /\b(source|sources|official page|official website|link|links|where did you get|fuente|fuentes|pagina oficial|sitio oficial|enlace|enlaces)\b/i.test(String(raw||''))}
function guideKeyFor(raw,effective,{profileHits=0,hasFile=false}={}){
  if(hasFile)return'file';
  if(profileHits>0)return'profiles';
  const q=String(effective||raw||'').trim(),topics=C.concepts(q),svc=C.serviceFor(q);
  if(topics.length)return topics[0];
  if(svc)return'provider';
  return'generic';
}
function advanceGuideFor(key,raw,effective){
  switch(key){
    case'permit':return{question:tx('What would you like me to help with next?','¿Con qué quiere que le ayude ahora?'),options:[[tx('Permit steps','Pasos del permiso'),'show me the permit steps'],[tx('Find a local contractor','Buscar contratista local'),'find local contractors for this project'],[tx('Official permit page','Página oficial de permisos'),'show me the official permit page']]};
    case'school':return{question:tx('What should I help you with next for school?','¿Con qué debo ayudarle ahora sobre la escuela?'),options:[[tx('Enrollment steps','Pasos de inscripción'),'show me enrollment steps'],[tx('Transportation','Transporte'),'help me with school transportation'],[tx('School contacts','Contactos escolares'),'show me school contact information']]};
    case'transport':return{question:tx('What should I narrow down next?','¿Qué debo precisar a continuación?'),options:[[tx('Routes / schedules','Rutas / horarios'),'show me routes or schedules'],[tx('Accessibility','Accesibilidad'),'show accessible transportation options'],[tx('Contact information','Información de contacto'),'give me transportation contact information']]};
    case'senior':return{question:tx('What would be most useful next?','¿Qué sería más útil a continuación?'),options:[[tx('Local services','Servicios locales'),'show me local senior services'],[tx('Transportation','Transporte'),'show transportation help'],[tx('Caregiver support','Apoyo al cuidador'),'show caregiver support']]};
    case'health':return{question:tx('What would you like me to narrow down next?','¿Qué quiere que precise a continuación?'),options:[[tx('Local providers','Proveedores locales'),'show me local health providers'],[tx('Coverage / insurance','Cobertura / seguro'),'help me with health coverage or insurance'],[tx('Urgent care','Atención urgente'),'show me urgent care options']]};
    case'legal':return{question:tx('What would help you move forward?','¿Qué le ayudaría a avanzar?'),options:[[tx('Find attorneys','Buscar abogados'),'find local attorneys for this issue'],[tx('Court / forms','Tribunal / formularios'),'show me relevant court or forms information'],[tx('Explain next step','Explicar siguiente paso'),'explain what I should do next']]};
    case'housing':return{question:tx('What should I help you do next?','¿Qué debo ayudarle a hacer ahora?'),options:[[tx('Local housing help','Ayuda local de vivienda'),'show local housing help'],[tx('Rights / notices','Derechos / avisos'),'help me understand my housing rights or notice'],[tx('Next steps','Siguientes pasos'),'tell me the next housing steps']]};
    case'food-benefits':return{question:tx('What should I help you do next?','¿Qué debo ayudarle a hacer ahora?'),options:[[tx('Food resources','Recursos de alimentos'),'show food resources'],[tx('Benefits','Beneficios'),'show benefits help'],[tx('Utility assistance','Ayuda de servicios públicos'),'show utility assistance']]};
    case'business-start':case'business-growth':return{question:tx('What should we work on next for the business?','¿En qué debemos trabajar ahora para el negocio?'),options:[[tx('Local requirements','Requisitos locales'),'show local business requirements'],[tx('Customers / visibility','Clientes / visibilidad'),'help me get more local customers'],[tx('Business profile','Perfil del negocio'),'help me with my Franklin business profile']]};
    case'jobs':return{question:tx('What should I help you with next?','¿Con qué debo ayudarle ahora?'),options:[[tx('Local jobs','Empleos locales'),'show local jobs'],[tx('Resume','Currículum'),'help me with my resume'],[tx('Applications','Solicitudes'),'help me with job applications']]};
    case'events':case'sports':case'arts':case'parks':return{question:tx('Want me to narrow the options further?','¿Quiere que reduzca más las opciones?'),options:[[tx('Today','Hoy'),'show me options for today'],[tx('This weekend','Este fin de semana'),'show me options for this weekend'],[tx('Free / low-cost','Gratis / bajo costo'),'show me free or low-cost options']]};
    case'utilities':case'sanitation':return{question:tx('What should I help you do next?','¿Qué debo ayudarle a hacer ahora?'),options:[[tx('Official contact','Contacto oficial'),'give me the official contact information'],[tx('Hours / schedule','Horario'),'show me the hours or schedule'],[tx('Next action','Siguiente acción'),'tell me what to do next']]};
    case'childcare':return{question:tx('What should I narrow down next?','¿Qué debo precisar a continuación?'),options:[[tx('Local providers','Proveedores locales'),'show me local child-care providers'],[tx('Preschool','Preescolar'),'show preschool options'],[tx('Contact details','Datos de contacto'),'show child-care contact details']]};
    case'civic':return{question:tx('What civic detail should I help with next?','¿Con qué detalle cívico debo ayudarle ahora?'),options:[[tx('Official source','Fuente oficial'),'show me the official source'],[tx('Meeting / agenda','Reunión / agenda'),'show me meeting or agenda information'],[tx('Address-specific help','Ayuda por dirección'),'help me with this for my address']]};
    case'property':return{question:tx('What should I help you check next?','¿Qué debo ayudarle a revisar ahora?'),options:[[tx('Property record','Registro de propiedad'),'show me the property record process'],[tx('Taxes','Impuestos'),'show me property tax information'],[tx('Official source','Fuente oficial'),'show me the official property source']]};
    case'auto':return{question:tx('What would help next?','¿Qué ayudaría ahora?'),options:[[tx('Local repair options','Opciones locales de reparación'),'show local auto repair options'],[tx('Towing','Remolque'),'show towing options'],[tx('Official recall info','Información oficial de retiro'),'show official recall information']]};
    case'pets':return{question:tx('What should I narrow down next?','¿Qué debo precisar a continuación?'),options:[[tx('Veterinarians','Veterinarios'),'show local veterinarians'],[tx('Grooming / boarding','Peluquería / alojamiento'),'show grooming or boarding options'],[tx('Lost-pet help','Ayuda por mascota perdida'),'show lost-pet help']]};
    case'membership':return{question:tx('What would you like to do next with membership?','¿Qué quiere hacer ahora con la membresía?'),options:[[tx('Join','Unirme'),'help me join'],[tx('Manage it','Administrarla'),'help me manage my membership'],[tx('Benefits','Beneficios'),'show me the membership benefits']]};
    case'profile':return{question:tx('What should I help you do next with the profile?','¿Qué debo ayudarle a hacer ahora con el perfil?'),options:[[tx('Claim it','Reclamarlo'),'help me claim the profile'],[tx('Correct it','Corregirlo'),'help me correct the profile'],[tx('Remove it','Eliminarlo'),'help me request removal']]};
    case'profiles':case'provider':return{question:tx('Would you like me to narrow these local options further?','¿Quiere que reduzca más estas opciones locales?'),options:[[tx('Websites','Sitios web'),'which ones have websites?'],[tx('Phone numbers','Teléfonos'),'give me their phone numbers'],[tx('More matches','Más coincidencias'),'show me 5 matches']]};
    case'file':return{question:tx('What should I do with the attachment next?','¿Qué debo hacer con el archivo adjunto ahora?'),options:[[tx('Summarize','Resumir'),'summarize the attachment'],[tx('Explain simply','Explicar fácil'),'explain the attachment simply'],[tx('Find deadlines','Buscar plazos'),'find dates or deadlines in the attachment']]};
    default:return{question:tx('What would be most useful next?','¿Qué sería más útil a continuación?'),options:[[tx('Next step','Siguiente paso'),'what should I do next?'],[tx('Official source','Fuente oficial'),'show me the official source'],[tx('Local options','Opciones locales'),'show me local options']]};
  }
}
function guideFor(raw,effective,{profileHits=0,hasFile=false}={}){
  const q=String(effective||raw||'').trim(),t=C.norm(q),rawt=C.norm(raw),topics=C.concepts(q),svc=C.serviceFor(q);
  if(!q||/^(hi|hello|hey|hola|thank you|thanks|gracias|no thanks|no thank you|that'?s all|done|stop)[!. ]*$/.test(rawt))return null;
  const mode=C.mode(q);if(mode==='emergency'||mode==='crisis')return null;
  if(hasFile)return{question:tx('What would you like me to do with the attachment next?','¿Qué quiere que haga con el archivo adjunto a continuación?'),options:[[tx('Summarize it','Resumirlo'),'summarize the attachment'],[tx('Explain it simply','Explicarlo de forma sencilla'),'explain the attachment in plain language'],[tx('Find dates or deadlines','Buscar fechas o plazos'),'find dates or deadlines in the attachment']]};
  if(profileHits>0)return{question:tx('Would you like me to narrow these local matches further?','¿Quiere que reduzca más estas coincidencias locales?'),options:[[tx('Which have websites?','¿Cuáles tienen sitio web?'),'which ones have websites?'],[tx('Give me phone numbers','Dame los teléfonos'),'give me their phone numbers'],[tx('Show 5 matches','Mostrar 5 coincidencias'),'show me 5 matches']]};
  if(topics.includes('permit')){
    if(/\b(roof|roofing|roofer|techo|tejado)\b/.test(t))return{question:tx('Is this a full roof replacement, a partial repair, or are you not sure yet?','¿Es un reemplazo completo del techo, una reparación parcial o todavía no está seguro?'),options:[[tx('Entire roof','Techo completo'),'I am replacing the entire roof for this permit project'],[tx('Partial repair','Reparación parcial'),'it is a partial roof repair for this permit project'],[tx('Not sure','No estoy seguro'),'for this permit question, I am not sure how much of the roof needs work']]};
    return{question:tx('What kind of project are you planning?','¿Qué tipo de proyecto está planeando?'),options:[[tx('New work','Trabajo nuevo'),'it is new construction or an addition'],[tx('Repair or remodel','Reparación o remodelación'),'it is a repair or remodel'],[tx('Not sure','No estoy seguro'),'I am not sure what permit category applies']]};
  }
  if(topics.includes('school'))return{question:tx('What street address should I use to narrow the school or enrollment answer?','¿Qué dirección debo usar para precisar la escuela o la inscripción?'),options:[]};
  if(topics.includes('transport'))return{question:tx('What kind of transportation help do you need?','¿Qué tipo de ayuda de transporte necesita?'),options:[[tx('Bus or transit','Autobús o transporte público'),'I need bus or transit options'],[tx('A ride','Un viaje'),'I need a ride'],[tx('Accessibility / paratransit','Accesibilidad / paratránsito'),'I need accessible transportation or paratransit']]};
  if(topics.includes('senior'))return{question:tx('What kind of help matters most right now?','¿Qué tipo de ayuda importa más ahora?'),options:[[tx('Care at home','Cuidado en casa'),'I need care at home'],[tx('Transportation','Transporte'),'I need transportation help'],[tx('Benefits or support','Beneficios o apoyo'),'I need benefits or support services']]};
  if(topics.includes('health'))return{question:tx('What kind of care are you looking for?','¿Qué tipo de atención está buscando?'),options:[[tx('Doctor / primary care','Médico / atención primaria'),'I am looking for a doctor or primary care'],[tx('Dentist','Dentista'),'I am looking for a dentist'],[tx('Urgent care','Atención urgente'),'I am looking for urgent care']]};
  if(topics.includes('legal'))return{question:tx('What would help most next?','¿Qué le ayudaría más a continuación?'),options:[[tx('Understand the issue','Entender el problema'),'help me understand the legal issue'],[tx('Find an attorney','Buscar un abogado'),'find local attorneys for this'],[tx('Court or forms','Tribunal o formularios'),'show me the court or forms next step']]};
  if(topics.includes('housing'))return{question:tx('Which housing situation best matches what you need?','¿Qué situación de vivienda coincide mejor con lo que necesita?'),options:[[tx('Renting','Alquiler'),'I am renting'],[tx('Buying','Compra'),'I am buying a home'],[tx('Landlord / eviction issue','Problema con propietario / desalojo'),'I have a landlord or eviction problem']]};
  if(topics.includes('food-benefits'))return{question:tx('What kind of help do you need first?','¿Qué tipo de ayuda necesita primero?'),options:[[tx('Food today','Comida hoy'),'I need food help today'],[tx('SNAP / benefits','SNAP / beneficios'),'I need SNAP or benefits help'],[tx('Utility help','Ayuda con servicios públicos'),'I need utility assistance']]};
  if(topics.includes('business-start'))return{question:tx('What stage are you at with the business?','¿En qué etapa está con el negocio?'),options:[[tx('Just getting started','Apenas comenzando'),'I am just getting started'],[tx('Permits or licenses','Permisos o licencias'),'I need permits or licenses'],[tx('Ready to open','Listo para abrir'),'I am getting ready to open']]};
  if(topics.includes('business-growth'))return{question:tx('What do you want to improve first?','¿Qué quiere mejorar primero?'),options:[[tx('Get more customers','Conseguir más clientes'),'I want more local customers'],[tx('Improve my profile','Mejorar mi perfil'),'I want to improve my Franklin profile'],[tx('Local marketing','Marketing local'),'help me with local marketing']]};
  if(topics.includes('jobs'))return{question:tx('What kind of job help would be most useful?','¿Qué tipo de ayuda laboral sería más útil?'),options:[[tx('Find jobs','Buscar empleos'),'show me local jobs'],[tx('Resume help','Ayuda con currículum'),'help with my resume'],[tx('Internships','Pasantías'),'show me internships']]};
  if(topics.includes('events'))return{question:tx('When are you looking for something to do?','¿Cuándo busca algo que hacer?'),options:[[tx('Today','Hoy'),'what is happening today?'],[tx('This weekend','Este fin de semana'),'what is happening this weekend?'],[tx('Family-friendly','Para familias'),'show me family-friendly events']]};
  if(topics.includes('sports')||topics.includes('arts')||topics.includes('parks'))return{question:tx('What would help me narrow this down for you?','¿Qué me ayudaría a precisar esto para usted?'),options:[[tx('Today','Hoy'),'show me options for today'],[tx('This weekend','Este fin de semana'),'show me options for this weekend'],[tx('For kids / family','Para niños / familia'),'show me kid or family options']]};
  if(topics.includes('utilities'))return{question:tx('What do you need to do with the utility service?','¿Qué necesita hacer con el servicio público?'),options:[[tx('Pay or check a bill','Pagar o revisar una factura'),'I need help with a utility bill'],[tx('Start or stop service','Iniciar o detener servicio'),'I need to start or stop utility service'],[tx('Report a problem','Reportar un problema'),'I need to report a utility problem']]};
  if(topics.includes('sanitation'))return{question:tx('What sanitation service do you need?','¿Qué servicio de saneamiento necesita?'),options:[[tx('Pickup schedule','Horario de recolección'),'I need my pickup schedule'],[tx('Recycling','Reciclaje'),'I need recycling information'],[tx('Bulk or brush pickup','Desechos grandes o ramas'),'I need bulk or brush pickup']]};
  if(topics.includes('childcare'))return{question:tx('What kind of child-care help are you looking for?','¿Qué tipo de cuidado infantil está buscando?'),options:[[tx('Daycare','Guardería'),'I need daycare'],[tx('Preschool','Preescolar'),'I need preschool'],[tx('Other child care','Otro cuidado infantil'),'I need other child care options']]};
  if(topics.includes('civic'))return{question:tx('What civic information should I narrow down next?','¿Qué información cívica debo precisar a continuación?'),options:[[tx('Voting','Votación'),'help me with voting information'],[tx('City meeting','Reunión de la ciudad'),'show me city meeting information'],[tx('Development near me','Desarrollo cerca de mí'),'show me development near my address']]};
  if(topics.includes('property'))return{question:tx('What property question are you trying to solve?','¿Qué pregunta sobre la propiedad intenta resolver?'),options:[[tx('Property record','Registro de propiedad'),'I need a property record'],[tx('Property taxes','Impuestos de propiedad'),'I need property tax information'],[tx('Notice or HOA issue','Aviso o problema de HOA'),'I need help understanding a property notice or HOA issue']]};
  if(topics.includes('auto'))return{question:tx('What kind of vehicle help do you need?','¿Qué tipo de ayuda con el vehículo necesita?'),options:[[tx('Mechanic / repair','Mecánico / reparación'),'find a mechanic or repair shop'],[tx('Towing','Remolque'),'find towing help'],[tx('Accident or recall','Accidente o retiro'),'I need accident or recall information']]};
  if(topics.includes('pets'))return{question:tx('What kind of pet help do you need?','¿Qué tipo de ayuda para mascotas necesita?'),options:[[tx('Veterinarian','Veterinario'),'find a veterinarian'],[tx('Grooming / boarding','Peluquería / alojamiento'),'find grooming or boarding'],[tx('Lost pet','Mascota perdida'),'I need help with a lost pet']]};
  if(topics.includes('membership'))return{question:tx('Are you trying to join, manage an existing membership, or understand the benefits?','¿Quiere unirse, administrar una membresía existente o entender los beneficios?'),options:[[tx('Join','Unirme'),'I want to join'],[tx('Manage membership','Administrar membresía'),'I need to manage my membership'],[tx('Compare benefits','Comparar beneficios'),'show me the membership benefits']]};
  if(topics.includes('profile'))return{question:tx('What do you need to do with the profile?','¿Qué necesita hacer con el perfil?'),options:[[tx('Claim it','Reclamarlo'),'I want to claim the profile'],[tx('Correct it','Corregirlo'),'I need to correct the profile'],[tx('Remove it','Eliminarlo'),'I need to request profile removal']]};
  if(svc)return{question:tx('What matters most for the local options I show you?','¿Qué importa más para las opciones locales que le muestre?'),options:[[tx('Show local matches','Mostrar coincidencias locales'),'show me local matches'],[tx('Websites','Sitios web'),'which ones have websites?'],[tx('Phone numbers','Teléfonos'),'give me phone numbers']]};
  return{question:tx('What would you like me to help you do next?','¿Qué quiere que le ayude a hacer a continuación?'),options:[[tx('Next step','Siguiente paso'),'what should I do next?'],[tx('Official source','Fuente oficial'),'show me the official source'],[tx('Local options','Opciones locales'),'show me local options']]};
}
function renderGuide(raw,effective,meta={}){
  const key=guideKeyFor(raw,effective,meta);
  let g;
  if(guideProgress.key===key){
    if(guideProgress.depth>=2)return false;
    g=advanceGuideFor(key,raw,effective);
    guideProgress.depth+=1;
  }else{
    g=guideFor(raw,effective,meta);
    guideProgress.key=key;
    guideProgress.depth=1;
  }
  if(!g?.question)return false;
  const wrap=el('section',null,'franklin-chat-guide');wrap.setAttribute('aria-label',tx('Helpful follow-up','Seguimiento útil'));
  wrap.append(el('p',g.question,'franklin-chat-guide-question'));
  if(Array.isArray(g.options)&&g.options.length){
    const choices=el('div',null,'franklin-chat-guide-choices');
    g.options.slice(0,3).forEach(([label,value])=>{const b=el('button',label,'franklin-chat-guide-choice');b.type='button';b.dataset.chatGuideReply=String(value||label);choices.append(b)});
    wrap.append(choices);
  }
  output.append(wrap);return true;
}
function renderProfileAnswer(hits,q){
  if(!hits.length)return false;
  const count=Math.min(requestedProfileCount(q),hits.length),selected=hits.slice(0,count),t=C.norm(q),svc=C.serviceFor(q);
  const askWebsite=/\b(website|websites|site|sites|online|sitio web|sitios web)\b/i.test(q);
  const askPhone=/\b(phone|call|number|telefono|llamar|numero)\b/i.test(q);
  const askEmail=/\b(email|correo)\b/i.test(q);
  const asksBest=/\b(best|top|recommended|recommend|mejor|mejores|recomendado|recomendar)\b/.test(t);
  const names=selected.map(({row})=>row.name).join('; ');
  const serviceLabel=svc?.q?(' '+svc.q):'';
  let intro;
  if(asksBest)intro=tx(
    `I can’t objectively verify which${serviceLabel?serviceLabel+' providers':' local providers'} are “best,” but here are ${count} strong relevance matches from Franklin Navigator’s public directory: ${names}. These are directory matches, not endorsements—compare fit, credentials where relevant, price and availability directly.`,
    `No puedo verificar objetivamente cuáles proveedores locales son “los mejores”, pero aquí tiene ${count} coincidencias relevantes del directorio público de Franklin Navigator: ${names}. Son coincidencias del directorio, no recomendaciones; compare encaje, credenciales cuando corresponda, precio y disponibilidad directamente.`
  );
  else if(askWebsite)intro=tx(`Here are ${count} matching Franklin-area profiles with websites: ${names}.`,`Aquí tiene ${count} perfiles coincidentes del área de Franklin con sitios web: ${names}.`);
  else if(askPhone)intro=tx(`Here are ${count} matching Franklin-area contacts: ${names}.`,`Aquí tiene ${count} contactos coincidentes del área de Franklin: ${names}.`);
  else if(askEmail)intro=tx(`Here are ${count} matching Franklin-area email contacts: ${names}.`,`Aquí tiene ${count} contactos de correo coincidentes del área de Franklin: ${names}.`);
  else intro=tx(`Here are ${count} matching Franklin-area options: ${names}.`,`Aquí tiene ${count} opciones coincidentes del área de Franklin: ${names}.`);
  output.append(el('p',intro,'franklin-chat-direct-answer'));
  const grid=el('div',null,'franklin-assistant-profile-grid');
  selected.forEach(({row})=>{
    const card=el('article',null,'franklin-assistant-profile-card');
    card.append(el('h4',row.name),el('p',[row.category||row.type,row.location||row.area].filter(Boolean).join(' · '),'franklin-assistant-profile-meta'));
    const acts=[[tx('Open profile','Abrir perfil'),`/profiles/${encodeURIComponent(row.id)}/`]];
    if(row.phoneHref)acts.push([tx('Call','Llamar'),row.phoneHref]);
    if(row.websiteHref)acts.push([tx('Website','Sitio web'),row.websiteHref]);
    if(row.emailHref)acts.push([tx('Email','Correo'),row.emailHref]);
    card.append(actions(acts));grid.append(card);
  });
  output.append(grid);
  return true;
}
function renderProfiles(hits,q,one=false){if(!hits.length)return;const sec=el('section',null,'franklin-assistant-v3-profiles'),top=hits[0].row;sec.append(el('h3',one&&hits[0].score>=55?tx(`Contact details for ${top.name}`,`Datos de contacto de ${top.name}`):tx('Local matches you can contact','Coincidencias locales que puede contactar')));if(!one)sec.append(el('p',tx('These are factual public-profile matches, not endorsements. Confirm services, credentials where relevant, price and availability directly.','Estas son coincidencias informativas, no recomendaciones. Confirme servicios, credenciales, precio y disponibilidad directamente.')));const grid=el('div',null,'franklin-assistant-profile-grid');hits.slice(0,one?1:3).forEach(({row})=>{const c=el('article',null,'franklin-assistant-profile-card');c.append(el('h4',row.name),el('p',[row.category||row.type,row.location||row.area].filter(Boolean).join(' · '),'franklin-assistant-profile-meta'));const a=[[tx('Open profile','Abrir perfil'),`/profiles/${encodeURIComponent(row.id)}/`]];if(row.phoneHref)a.push([tx('Call','Llamar'),row.phoneHref]);if(row.websiteHref)a.push([tx('Website','Sitio web'),row.websiteHref]);if(row.emailHref)a.push([tx('Email','Correo'),row.emailHref]);c.append(actions(a));grid.append(c)});sec.append(grid);if(!one)sec.append(link(tx('See all matching profiles','Ver todos los perfiles coincidentes'),'/directory/?q='+encodeURIComponent(C.serviceFor(q)?.q||trim(q,80))));output.append(sec)}
async function renderRoutes(hits,q){if(!hits.length||!wantsRouteAction(q))return false;const h=hits[0],label=/\b(source|official page|official website|link|page|fuente|pagina oficial|sitio oficial|enlace|pagina)\b/i.test(q)?tx('Open relevant page','Abrir página relevante'):tx('More details','Más detalles');output.append(actions([[label,h.rec.p]]));return true}
async function answerFromRuntime(raw,effective=raw){
  const status=el('p',tx('Thinking…','Pensando…'),'franklin-chat-thinking');status.setAttribute('role','status');output.append(status);
  try{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),24000);let r;
    try{
      r=await fetch(ANSWER_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:trim(raw,500),contextualQ:trim(effective,700),language:lang(),history:chatHistory.slice(-8)}),credentials:'omit',referrerPolicy:'no-referrer',signal:ctl.signal})
    }finally{clearTimeout(timer)}
    if(!r.ok)throw Error();
    const d=await r.json();status.remove();
    if(!d?.answer)throw Error();
    output.dataset.answerMode=String(d.answerMode||'');
    output.dataset.llmUsed=d.llmUsed===true?'true':'false';
    output.append(el('p',String(d.answer).trim(),'franklin-chat-direct-answer'));
    if(wantsSourceLinks(raw)&&Array.isArray(d.sources)&&d.sources.length){
      const sourceActions=d.sources.slice(0,3).map((x,i)=>[String(x.title||tx('Source','Fuente')+' '+(i+1)),safeWeb(x.url)]).filter(x=>x[1]);
      if(sourceActions.length)output.append(actions(sourceActions));
    }
    return true
  }catch{
    status.remove();
    output.dataset.answerMode='fallback';
    output.dataset.llmUsed='false';
    return false
  }
}
function renderFile(q){const f=F?.get?.();if(!f)return false;const a=F.answer(f.text,q);const c=el('article',null,'navigator-result franklin-assistant-file-answer');c.append(el('h3',tx(`What I found in ${f.name}`,`Lo que encontré en ${f.name}`)),el('p',a.text));if(a.sensitive)c.append(el('p',tx('This file appears to contain sensitive information. Keep it private and avoid sharing the full document unless you trust the recipient.','Este archivo parece contener información sensible. Manténgalo privado y evite compartir el documento completo salvo con un destinatario de confianza.'),'notice'));c.append(el('p',tx('This is a reading aid, not a legal, medical or financial determination. Verify deadlines, eligibility and changing facts with the responsible source.','Esta es una ayuda de lectura, no una determinación legal, médica o financiera. Verifique plazos, elegibilidad y datos cambiantes con la fuente responsable.'),'fine-print'));output.append(c);return true}
function saveSteps(q){try{const legacy=window.FranklinR38Assistant;if(!legacy?.render||['emergency','crisis'].includes(C.mode(q)))return;const tmp=document.createElement('div');legacy.render(tmp,q);const save=tmp.querySelector('.r38-assistant-save');if(save){save.querySelector('h3')?.replaceChildren(document.createTextNode(tx('Keep these next steps','Guardar estos próximos pasos')));output.append(save)}}catch{}}

function inferService(raw){
  const direct=C.serviceFor(raw);if(direct)return direct;
  const t=C.norm(raw);
  const aliases=[
    ['roofing',/\b(roof|shingle|shingles|gutter|gutters|techo|tejado|canaleta)\b/],
    ['plumber',/\b(pipe|pipes|sink|toilet|drain|faucet|water heater|sewer line|tuberia|fregadero|inodoro|desague|grifo|calentador de agua)\b/],
    ['electrician',/\b(outlet|breaker|electrical panel|wiring|power socket|enchufe|interruptor|panel electrico|cableado)\b/],
    ['hvac',/\b(air conditioner|ac unit|furnace|heat pump|thermostat|calefaccion|aire acondicionado|termostato)\b/],
    ['auto repair',/\b(car won t start|car won't start|engine|brakes|transmission|battery|motor|frenos|transmision|bateria)\b/],
    ['towing',/\b(stranded car|stuck car|tow my car|car is stuck|remolcar|auto varado)\b/],
    ['veterinary',/\b(my dog|my cat|pet is sick|dog is sick|cat is sick|mascota enferma|perro enfermo|gato enfermo)\b/],
    ['cleaning',/\b(house needs cleaning|home cleaning|deep clean|limpiar la casa|limpieza profunda)\b/],
    ['landscaping',/\b(yard|lawn|grass|landscape|tree trimming|jardin|cesped|pasto|paisajismo|poda)\b/]
  ];
  const hit=aliases.find(([,re])=>re.test(t));
  return hit?{q:hit[0]}:null;
}
function serviceActionFollow(raw){
  const t=C.norm(raw);
  return /\b(need it repaired|need it fixed|repair it|fix it|need someone|need somebody|who can repair|who can fix|hire someone|have it repaired|have it fixed|necesito que lo reparen|necesito que lo arreglen|repararlo|arreglarlo|necesito alguien|quien puede repararlo|quien puede arreglarlo)\b/.test(t);
}
const conversation=[],chatHistory=[];const guideProgress={key:'',depth:0};let lastEffective='',lastService=null,lastTopics=[],lastProfileQuery='',busy=false,returnFocus=null;
const referenceCue=/\b(those|them|these|ones|they|their|it|its|that|this|same|above|previous|there|that one|this one|lo|eso|esa|ese|ellos|ellas|su|sus|mismo|anterior|ahi)\b/i;
const continuationStart=/^(and |also |which |what |where |when |who |why |how |can |could |do |does |did |is |are |was |were |should |would |find |show |tell |give |help |y |tambien |cual |cuales |que |donde |cuando |quien |por que |como |puede |puedo |debo |es |son |mostrar |dime |ayuda )/i;
function contextualize(raw){
  const q=String(raw||'').trim();if(!q)return q;
  if(!lastEffective)return q;
  const svc=inferService(q),topics=C.concepts(q),words=q.split(/\s+/).length;
  const refersBack=referenceCue.test(q);
  const shortContinuation=words<=9&&continuationStart.test(q);
  if(refersBack){
    const carry=[];if(lastService?.q)carry.push(lastService.q);for(const t of lastTopics.slice(0,2))carry.push(t.replace(/-/g,' '));
    return [lastEffective,carry.join(' '),q].filter(Boolean).join(' ');
  }
  if((svc||topics.length>0)&&!(words<=7&&lastService&&topics.includes('permit'))){return q}
  if(shortContinuation||words<=6){
    const carry=[];if(lastService?.q)carry.push(lastService.q);for(const t of lastTopics.slice(0,2))carry.push(t.replace(/-/g,' '));
    return [lastEffective,carry.join(' '),q].filter(Boolean).join(' ');
  }
  return q;
}
function recordTurn(raw,effective,answerText=''){conversation.push({role:'user',text:String(raw||'').trim()},{role:'assistant',context:effective});if(conversation.length>24)conversation.splice(0,conversation.length-24);chatHistory.push({role:'user',content:String(raw||'').trim()},{role:'assistant',content:trim(answerText,1600)});if(chatHistory.length>16)chatHistory.splice(0,chatHistory.length-16);lastEffective=effective;lastService=inferService(effective)||null;lastTopics=C.concepts(effective)}
function fallbackKnown(q){
  const t=C.norm(q),es=lang()==='es';
  if(/\b(roof|roofing|roofer|techo|tejado)\b/.test(t)&&/\b(leak|leaking|water|drip|repair|repaired|fix|fixed|gotea|filtracion|filtrando|agua|reparar|arreglar)\b/.test(t))return es?'Si el techo está filtrando ahora, mueva objetos, recoja el agua y manténgase alejado de un cielo raso abombado. No suba a un techo mojado. Un techador puede inspeccionar la causa y hacer una reparación o cubierta temporal; una reparación importante en Franklin también puede requerir permiso.':'If the roof is leaking now, move belongings, catch the water, and stay out from under a bulging ceiling. Do not climb onto a wet roof. A roofer can inspect the source and make a repair or temporary weatherproofing; a substantial repair in Franklin may also require a permit.';
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
  const profileFollow=!!lastProfileQuery&&(affirmativeProfileFollow(displayQ)||contactProfileFollow(displayQ));
  const explicitProfile=wantsProfilesNow(displayQ||q);
  const contextualServiceFollow=!!lastService&&serviceActionFollow(displayQ);
  const profileIntent=q&&(explicitProfile||profileFollow||contextualServiceFollow);
  const profileQuery=profileFollow?[lastProfileQuery,displayQ].filter(Boolean).join(' '):contextualServiceFollow?[lastService.q,displayQ].filter(Boolean).join(' '):q;
  const routeAction=!profileIntent&&wantsRouteAction(displayQ||q);
  let answered=false,dh=[],rh=[];

  if(hasFile){answered=renderFile(displayQ||q)||answered}

  if(!answered&&profileIntent){
    try{dh=C.rankDirectory(await directory(),profileQuery,5)}catch{}
    const websiteFollow=/\b(website|websites|site|sites|online|sitio web|sitios web)\b/i.test(displayQ)&&profileFollow;
    const phoneFollow=/\b(phone|call|number|telefono|llamar|numero)\b/i.test(displayQ)&&profileFollow;
    const emailFollow=/\b(email|correo)\b/i.test(displayQ)&&profileFollow;
    if(websiteFollow&&dh.length)dh=dh.filter(x=>x.row.websiteHref);
    if(phoneFollow&&dh.length)dh=dh.filter(x=>x.row.phoneHref);
    if(emailFollow&&dh.length)dh=dh.filter(x=>x.row.emailHref);
    if(dh.length&&dh[0].score>=18){answered=renderProfileAnswer(dh,displayQ||profileQuery)||answered;lastProfileQuery=profileQuery}
  }

  if(!answered&&q)answered=await answerFromRuntime(displayQ||q,q);

  if(routeAction){
    try{rh=await routeHits(await routes(),q)}catch{}
    if(rh.length)await renderRoutes(rh,displayQ||q);
  }

  if(!answered){
    const known=fallbackKnown(q);
    if(known){output.append(el('p',known,'franklin-chat-direct-answer'));answered=true}
  }

  if(!answered){
    const direct=q?R.direct(q,lang()):null;
    if(direct?.text){output.append(el('p',direct.text,'franklin-chat-direct-answer'));answered=true}
  }

  if(!answered)output.append(el('p',tx('I could not verify a reliable answer yet. Tell me one more detail and I’ll answer directly.','Todavía no pude verificar una respuesta confiable. Dígame un detalle más y responderé directamente.')));
  if(answered)renderGuide(displayQ||q,q,{profileHits:dh.length,hasFile});
  window.FranklinProductHealth?.record?.(hasFile?'assistant_r1307_file':dh.length?'assistant_r1307_profiles':'assistant_r1307_answer');
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
  d.querySelector('[data-chat-new]').addEventListener('click',()=>{conversation.length=0;chatHistory.length=0;lastEffective='';lastService=null;lastTopics=[];lastProfileQuery='';guideProgress.key='';guideProgress.depth=0;transcript.replaceChildren();chatInput.value='';chatInput.focus();window.FranklinProductHealth?.record?.('assistant_r1307_new_chat')});
  d.addEventListener('click',e=>{const b=e.target.closest('[data-chat-guide-reply]');if(!b||busy)return;e.preventDefault();const guide=b.closest('.franklin-chat-guide');guide?.querySelectorAll('[data-chat-guide-reply]').forEach(x=>x.disabled=true);send(b.dataset.chatGuideReply||b.textContent,d)});
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
const publicApi=Object.freeze({version:VERSION,send,renderInto:renderAnswer,conversation:()=>conversation.map(x=>({...x}))});window.FranklinAssistantR1316=publicApi;window.FranklinAssistantR1315=publicApi;window.FranklinAssistantR1307=publicApi;window.FranklinAssistantR1306=publicApi;window.FranklinAssistantR1305=publicApi;window.FranklinAssistantR1304=publicApi;window.FranklinAssistantR1303=publicApi;window.FranklinAssistantR1302=publicApi;window.FranklinAssistantR1301=publicApi;window.FranklinAssistantR1300=publicApi;window.FranklinAssistantR1299=publicApi;window.FranklinAssistantR1298=publicApi;window.FranklinAssistantR1296=publicApi;window.FranklinAssistantR1294=publicApi;
})();
