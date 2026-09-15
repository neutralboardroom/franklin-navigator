'use strict';
const http=require('node:http');
const fs=require('node:fs');
const dns=require('node:dns');
const net=require('node:net');
const {URL}=require('node:url');
const PORT=Number(process.env.PORT||10000);
const RELEASE='FR-NAV1.30.17-HF3.12.9';
const ORIGINS=new Set(['https://franklinnavigator.com','https://www.franklinnavigator.com','https://franklin-navigator.onrender.com']);
const BODY_LIMIT=32*1024,rate=new Map(),VERIFIED_AT='2026-09-14';
const OPENAI_API_KEY=String(process.env.OPENAI_API_KEY||'').trim();
const OPENAI_MODEL=String(process.env.OPENAI_MODEL||'gpt-5.6-luna').trim();
const llmState={configured:Boolean(OPENAI_API_KEY),verified:false,lastCheckAt:null,error:null};
const startupState={qualified:false,researchOk:false,generalConversationOk:false,spanishConversationOk:false,roofLeakOk:false,liveApiOk:false,lastQualifiedAt:null};
const now=()=>new Date().toISOString();
const text=v=>String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
const norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s'&.-]/g,' ').replace(/\s+/g,' ').trim();
const unescapeHtml=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)||32)).replace(/\s+/g,' ').trim();
const clientKey=req=>String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim();
function allow(req,res){const o=String(req.headers.origin||'');if(o&&ORIGINS.has(o)){res.setHeader('Access-Control-Allow-Origin',o);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS,GET');res.setHeader('Access-Control-Allow-Headers','Content-Type');}res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');}
function json(req,res,status,payload){allow(req,res);const b=JSON.stringify(payload);res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Content-Length',Buffer.byteLength(b));res.end(b)}
function limited(k,max=30,ms=3600000){const n=Date.now();let r=rate.get(k);if(!r||r.until<n)r={count:0,until:n+ms};r.count++;rate.set(k,r);return r.count<=max}
setInterval(()=>{const n=Date.now();for(const[k,v]of rate)if(v.until<n)rate.delete(k)},60000).unref();
async function body(req){let size=0,s='';for await(const c of req){size+=c.length;if(size>BODY_LIMIT)throw Object.assign(new Error('too_large'),{status:413});s+=c.toString('utf8')}try{return JSON.parse(s||'{}')}catch{throw Object.assign(new Error('bad_json'),{status:400})}}
const STOP=new Set('a an and are as at be by can could did do does for from get give go help how i in is it me my need of on or our please should show tell that the this to us want we what when where which who why with would you your franklin tn tennessee local online current latest information info about una un el la los las y o de en con para por que como cuando donde quien quiero necesito ayuda'.split(' '));
function terms(q){return [...new Set(norm(q).split(' ').filter(x=>x.length>2&&!STOP.has(x)))].slice(0,14)}
function privateIp(ip){if(net.isIP(ip)===4){const a=ip.split('.').map(Number);return a[0]===10||a[0]===127||a[0]===0||a[0]>=224||(a[0]===169&&a[1]===254)||(a[0]===172&&a[1]>=16&&a[1]<=31)||(a[0]===192&&a[1]===168)||(a[0]===100&&a[1]>=64&&a[1]<=127)}if(net.isIP(ip)===6){const x=ip.toLowerCase();return x==='::1'||x==='::'||x.startsWith('fe8')||x.startsWith('fe9')||x.startsWith('fea')||x.startsWith('feb')||x.startsWith('fc')||x.startsWith('fd')||x.startsWith('ff')}return true}
function safeUrl(v){try{const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.'))return'';if(/^(localhost|local|internal)$/i.test(u.hostname)||(net.isIP(u.hostname)&&privateIp(u.hostname)))return'';return u.href}catch{return''}}
async function assertPublicHost(hostname){const rows=await dns.promises.lookup(hostname,{all:true,verbatim:true});if(!rows.length||rows.some(x=>privateIp(x.address)))throw Error('private_destination')}
async function get(input,timeout=7000,max=1000000,depth=0){const href=safeUrl(input);if(!href)throw Error('unsafe_url');if(depth>3)throw Error('too_many_redirects');const u=new URL(href);await assertPublicHost(u.hostname);const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);try{const r=await fetch(href,{headers:{'User-Agent':'Mozilla/5.0 (compatible; FranklinNavigator/1.0; +https://franklinnavigator.com)','Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.7'},redirect:'manual',signal:ctl.signal});if(r.status>=300&&r.status<400&&r.headers.get('location')){const next=safeUrl(new URL(r.headers.get('location'),u).href);if(!next)throw Error('unsafe_redirect');return get(next,timeout,max,depth+1)}if(!r.ok)throw Error('http_'+r.status);const len=Number(r.headers.get('content-length')||0);if(len>max)throw Error('too_large');const a=await r.arrayBuffer();if(a.byteLength>max)throw Error('too_large');return new TextDecoder().decode(a)}finally{clearTimeout(timer)}}
function stripPage(html){return unescapeHtml(String(html||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<noscript[\s\S]*?<\/noscript>/gi,' ').replace(/<!--([\s\S]*?)-->/g,' ').replace(/<(br|p|li|h1|h2|h3|h4|tr|div|section|article|td|th)[^>]*>/gi,'. ').replace(/<[^>]+>/g,' '))}
const OFFICIAL=[
 {re:/\b(city hall|city office|city offices|city government|contact|address|administration|mayor|boma|ayuntamiento|oficina de la ciudad|oficinas de la ciudad|gobierno de la ciudad|contacto|direccion|dirección|administracion|administración|alcalde)\b/i,title:'City of Franklin — Contact Us',url:'https://www.franklintn.gov/services/contact-us',snapshot:'Franklin City Hall functions are operating from interim locations: Administration is at 740 Columbia Avenue; Community Development is at 120 9th Ave South; Billing & Licensing and Technology are at 204 9th Ave South; Fire Administration is at 507 New Highway 96 West. The mailing address remains 109 3rd Ave South, Franklin, TN 37064, and the City main phone is 615-791-3217. The City contact page does not publish one universal all-department City Hall hours schedule.'},
 {re:/\b(city hall|billing|utility billing|water service|payment|pay|hours|open|ayuntamiento|facturacion|facturación|servicio de agua|pago|pagar|horario|abre|abierto)\b/i,title:'City of Franklin — Water FAQ / Utility Billing',url:'https://www.franklintn.gov/government/departments-k-z/water-management-department/water-faq',snapshot:'The City lists Utility Billing hours as 8:00 AM to 5:00 PM Monday through Friday, except holidays, at 615-794-4572. Billing & Licensing is located at 204 9th Ave South.'},
 {re:/\b(permit|permits|building|inspection|inspections|zoning|construction|remodel|renovation|repair|roof|roofing|fence|deck|permiso|permisos|edificio|inspeccion|inspección|inspecciones|zonificacion|zonificación|construccion|construcción|remodelacion|remodelación|renovacion|renovación|reparacion|reparación|techo|tejado|cerca|terraza)\b/i,title:'City of Franklin — Residential & Commercial Construction',url:'https://www.franklintn.gov/government/departments-a-j/building-and-neighborhood-services/department-operations/department-information/residential-and-commercial-construction',snapshot:'The City of Franklin says a building permit is required for all new construction, additions, renovations, decks, pools and most repair work. Building & Neighborhood Services can confirm project-specific requirements at 615-794-7012. Residential permit applications are generally processed in 7 working days or less when complete. Separate electrical, plumbing, mechanical or low-voltage permits may also be required when that work is part of the project.'},
 {re:/\b(trash|garbage|recycling|recycle|brush|bulk|yard waste|sanitation|glass|cardboard|basura|reciclaje|reciclar|ramas|desechos voluminosos|desechos de jardin|desechos de jardín|saneamiento|sanidad|vidrio|carton|cartón)\b/i,title:'City of Franklin — Sanitation and Environmental Services',url:'https://www.franklintn.gov/government/departments-k-z/sanitation-and-environmental-services',snapshot:'Franklin Sanitation and Environmental Services handles municipal solid waste, curbside recycling, yard waste, bulk waste and brush collection within Franklin city limits. The office lists hours Monday through Friday, 7:00 AM to 4:00 PM, at 417 Century Court, phone 615-794-1516. Current glass and cardboard drop-off operating hours are Monday through Thursday 6:00 AM to 4:00 PM and the first Saturday of each month 8:00 AM to noon.'},
 {re:/\b(water|sewer|wastewater|leak|utility|utilities|agua|alcantarillado|aguas residuales|fuga|servicio publico|servicio público|servicios publicos|servicios públicos)\b/i,title:'City of Franklin — Water Management',url:'https://www.franklintn.gov/government/departments-k-z/water-management-department/water-faq',snapshot:'For Franklin water service and repair, the City lists 615-794-4554 from 7:00 AM to 4:00 PM except holidays. Utility Billing for starting or stopping water service is 615-794-4572, 8:00 AM to 5:00 PM Monday through Friday except holidays.'},
 {re:/\b(meeting|meetings|agenda|calendar|event|events|tonight|today|tomorrow|weekend|boma|commission|reunion|reunión|reuniones|agenda|calendario|evento|eventos|esta noche|hoy|mañana|fin de semana|comision|comisión)\b/i,title:'City of Franklin — Calendar',url:'https://www.franklintn.gov/our-city/calendar',snapshot:'The City of Franklin maintains an official calendar for current meetings and public events. Because dates and times change, open the linked official calendar to confirm the current item before going.'},
 {re:/\b(park|parks|recreation|field|fields|athletics|parque|parques|recreacion|recreación|campo|campos|atletismo)\b/i,title:'City of Franklin — Parks Contact',url:'https://www.franklintn.gov/government/departments-k-z/parks/contact-us',snapshot:'Franklin Parks and Recreation can be reached at 615-794-2103. Confirm current facility, field, program and event details with Parks before going.'},
 {re:/\b(transit|bus|transportation|mobility|transito|tránsito|autobus|autobús|transporte|movilidad)\b/i,title:'City of Franklin — Franklin Transit',url:'https://www.franklintn.gov/government/departments-a-j/finance-administration',snapshot:'Franklin Transit is a City-supported transportation service. Routes, fares, operating hours and accessibility details can change, so confirm the current trip at the official source before travel.'},
 {re:/\b(school|schools|student|enrollment|district|zone|zoned|teacher|escuela|escuelas|estudiante|inscripcion|inscripción|distrito|zona|asignada|maestro|maestra)\b/i,title:'Williamson County Schools',url:'https://www.wcs.edu/',snapshot:'Franklin addresses may fall within Williamson County Schools. Enrollment, zoning and calendars should be confirmed using the district’s current official information for the specific address.'},
 {re:/\b(school|schools|student|enrollment|district|zone|zoned|teacher|escuela|escuelas|estudiante|inscripcion|inscripción|distrito|zona|asignada|maestro|maestra)\b/i,title:'Franklin Special School District',url:'https://www.fssd.org/',snapshot:'Some Franklin addresses are served by Franklin Special School District. Enrollment, zoning and calendars should be confirmed with the district’s current official information for the specific address.'},
 {re:/\b(county|property|assessor|county tax|register of deeds|court clerk|condado|propiedad|tasador|impuesto del condado|registro de escrituras|secretario del tribunal)\b/i,title:'Williamson County Government',url:'https://www.williamsoncounty-tn.gov/',snapshot:'Williamson County handles county-level services including property, elections, courts and other county offices. Use the linked official county source for current office-specific hours and requirements.'}
];
function officialSeeds(q){const out=[],seen=new Set();for(const x of OFFICIAL){if(!x.re.test(q))continue;const url=safeUrl(x.url);if(url&&!seen.has(url)){seen.add(url);out.push({...x,url,origin:'official',verifiedAt:VERIFIED_AT})}if(out.length===5)break}return out}
function decodeDdUrl(href){try{let h=unescapeHtml(href);if(h.startsWith('//'))h='https:'+h;const u=new URL(h,'https://html.duckduckgo.com');const raw=u.searchParams.get('uddg');return raw?decodeURIComponent(raw):u.href}catch{return''}}
function parseDuck(html){const out=[];const re=/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]{0,1800}?(?:class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>)?/gi;let m;while((m=re.exec(html))&&out.length<10){const url=safeUrl(decodeDdUrl(m[1]));if(url)out.push({title:unescapeHtml(m[2]),url,snippet:unescapeHtml(m[3]||''),origin:'search'})}return out}
function parseBing(xml){const out=[];const re=/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<\/item>/gi;let m;while((m=re.exec(xml))&&out.length<10){const url=safeUrl(unescapeHtml(m[2]));if(url)out.push({title:unescapeHtml(m[1]),url,snippet:unescapeHtml(m[3]),origin:'search'})}return out}
function localRelevant(r,q){try{const u=new URL(r.url),h=u.hostname.toLowerCase(),s=norm(`${r.title} ${r.snippet} ${u.pathname}`);if(h.includes('franklintn.gov')||h.includes('williamsoncounty-tn.gov')||h.endsWith('.wcs.edu')||h.endsWith('.fssd.org'))return true;if(!s.includes('franklin'))return false;if(!(s.includes('tennessee')||s.includes('williamson')||/\btn\b/.test(s)))return false;const ts=terms(q);return !ts.length||ts.some(t=>s.includes(t))}catch{return false}}
async function searchWeb(q){const query=/\bfranklin\b/i.test(q)?q:`${q} Franklin Tennessee`;let rows=[];try{rows=parseDuck(await get('https://html.duckduckgo.com/html/?q='+encodeURIComponent(query),6500,900000))}catch{}if(rows.length<3)try{const b=parseBing(await get('https://www.bing.com/search?format=rss&q='+encodeURIComponent(query),6500,900000));const seen=new Set(rows.map(x=>x.url));for(const r of b)if(!seen.has(r.url)){seen.add(r.url);rows.push(r)}}catch{}return rows.filter(r=>localRelevant(r,q)).slice(0,6)}
function sourceRank(url){try{const h=new URL(url).hostname.toLowerCase();if(h.includes('franklintn.gov')||h.includes('williamsoncounty-tn.gov'))return 40;if(h.endsWith('.wcs.edu')||h.endsWith('.fssd.org'))return 35;if(h.endsWith('.gov'))return 30;if(h.endsWith('.edu'))return 18;return 0}catch{return 0}}
function sentences(s){return text(s).split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=25&&x.length<=520)}
function scoreSentence(s,q,url){const st=norm(s),ts=terms(q);let n=sourceRank(url);for(const t of ts)if(st.includes(t))n+=7;if(/\b(when|date|today|tonight|tomorrow|weekend|hours|open|schedule)\b/i.test(q)&&/\b(am|pm|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[:/]\d{1,2})\b/i.test(s))n+=18;if(/\b(cost|price|fee|how much)\b/i.test(q)&&/\$\s?\d|fee|cost|price/i.test(s))n+=15;if(/\b(phone|call|number)\b/i.test(q)&&/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/.test(s))n+=18;if(/\b(address|where|location)\b/i.test(q)&&/\b(st|street|rd|road|ave|avenue|dr|drive|blvd|boulevard|ln|lane|pkwy|parkway|franklin|tn)\b/i.test(s))n+=10;return n}
async function enrich(rows,q){const out=[];for(const r of rows.slice(0,7)){let page='',liveRead=false;try{page=stripPage(await get(r.url,6500,1000000));liveRead=Boolean(page)}catch{}const base=[];if(r.snippet)base.push(...sentences(r.snippet));if(page)base.push(...sentences(page).slice(0,180));if(!base.length&&r.snapshot)base.push(...sentences(r.snapshot));const candidates=base.map(s=>({s,score:scoreSentence(s,q,r.url)})).sort((a,b)=>b.score-a.score);const best=candidates[0]?.s||'';if(best)out.push({...r,best,liveRead,verifiedAt:r.verifiedAt||null})}return out}
function synthesize(rows,q){const pool=[];for(const r of rows)if(r.best)pool.push({s:r.best,url:r.url,title:r.title,score:scoreSentence(r.best,q,r.url)+(r.origin==='official'?10:0),liveRead:r.liveRead,verifiedAt:r.verifiedAt});pool.sort((a,b)=>b.score-a.score);const chosen=[],seen=new Set();for(const x of pool){const k=norm(x.s).slice(0,100);if(!k||seen.has(k))continue;seen.add(k);chosen.push(x);if(chosen.length===3)break}if(!chosen.length)return{answer:'',confidence:'low'};return{answer:chosen.map(x=>x.s).join(' '),confidence:chosen.some(x=>sourceRank(x.url)>=35)?'high':chosen.length>=2?'medium':'low'}}
function isGenericClarification(v){return /could not verify|one more detail|no pude verificar|un detalle m[aá]s/i.test(String(v||''))}
function responseEvidence(d){return [String(d?.answer||''),...(Array.isArray(d?.sources)?d.sources.flatMap(x=>[x?.title,x?.snippet,x?.url]):[])].filter(Boolean).join(' ')}
function sourceEvidence(d){return (Array.isArray(d?.sources)?d.sources.flatMap(x=>[x?.title,x?.snippet,x?.url]):[]).filter(Boolean).join(' ')}
function hasOfficialSource(d){return Array.isArray(d?.sources)&&d.sources.some(x=>x?.official===true)}
function groundedSubstantive(d){return d?.ok===true&&String(d?.answer||'').length>=24&&/^llm_grounded_/.test(String(d?.answerMode||''))&&hasOfficialSource(d)&&!isGenericClarification(d?.answer)}
async function research(q){
  const merged=[],seen=new Set();
  for(const row of officialSeeds(q)){
    if(row.url&&!seen.has(row.url)){seen.add(row.url);merged.push(row)}
  }
  try{
    for(const row of await searchWeb(q)){
      if(row.url&&!seen.has(row.url)){seen.add(row.url);merged.push(row)}
      if(merged.length>=9)break
    }
  }catch{}
  if(!merged.length)return{answer:'',sources:[],confidence:'low',usedVerifiedSnapshot:false};
  const enriched=await enrich(merged,q);
  const syn=synthesize(enriched,q);
  return{
    answer:syn.answer,
    sources:enriched.slice(0,5).map(x=>({title:x.title,url:x.url,snippet:text(x.best||x.snippet||x.snapshot).slice(0,420),official:x.origin==='official',liveRead:Boolean(x.liveRead),verifiedAt:x.verifiedAt||null})),
    confidence:syn.confidence,
    usedVerifiedSnapshot:enriched.some(x=>x.origin==='official'&&!x.liveRead&&Boolean(x.verifiedAt))
  };
}
function askedForSource(q){return /\b(source|sources|link|links|website|official page|where did you get|fuente|fuentes|enlace|sitio web|pagina oficial)\b/i.test(q)}
function knownAnswer(q,language='en'){
  const t=norm(q),es=String(language||'').toLowerCase().startsWith('es');
  if(/^(hi|hello|hey|good morning|good afternoon|good evening|hola|buenos dias|buenas tardes|buenas noches)[!. ]*$/.test(t))return es?'Hola. ¿Qué le gustaría saber sobre Franklin?':'Hi. What would you like to know about Franklin?';
  if(/\b(thank you|thanks|gracias)\b/.test(t)&&t.split(' ').length<8)return es?'Con gusto.':'You’re welcome.';
  if(/\b(roof|roofing|roofer|techo|tejado)\b/.test(t)&&/\b(leak|leaking|water|drip|repair|repaired|fix|fixed|gotea|filtracion|filtrando|agua|reparar|arreglar)\b/.test(t)){
    return es
      ?'Si el techo está filtrando ahora, proteja primero el interior: mueva objetos, recoja el agua y manténgase alejado de un cielo raso abombado. No suba a un techo mojado. Un techador puede inspeccionar la fuente y hacer una reparación o cubierta temporal; una reparación importante en Franklin también puede requerir permiso. Si quiere, puedo ayudarle a encontrar techadores locales.'
      :'If the roof is leaking now, protect the inside first: move belongings, catch the water, and stay out from under a bulging ceiling. Do not climb onto a wet roof. A roofer can inspect the source and make a repair or temporary weatherproofing; a substantial repair in Franklin may also require a permit. If you want, I can help you find local roofers.';
  }
  if(/\b(roof|roofing|techo|tejado)\b/.test(t)&&/\b(permit|permits|permiso|permisos)\b/.test(t)){
    return es
      ?'Para un reemplazo de techo o una reparación importante en Franklin, cuente con necesitar un permiso de construcción. La Ciudad indica que la mayoría de los trabajos de reparación requieren permiso. Para una reparación menor del mismo material, confirme el caso específico con Building & Neighborhood Services al 615-794-7012.'
      :'For a roof replacement or substantial roof repair in Franklin, plan on needing a building permit. The City says most repair work requires a building permit. For a small in-kind repair, confirm the specific scope with Building & Neighborhood Services at 615-794-7012.';
  }
  if(/\b(permit|permits|permiso|permisos)\b/.test(t)&&/\b(home|house|residential|remodel|renovation|repair|deck|fence|casa|residencial|remodelacion|renovacion|reparacion|terraza|cerca)\b/.test(t)){
    return es
      ?'En Franklin, se requiere un permiso de construcción para construcción nueva, ampliaciones, renovaciones, terrazas, piscinas y la mayoría de las reparaciones. Building & Neighborhood Services puede confirmar el requisito de su proyecto al 615-794-7012.'
      :'In Franklin, a building permit is required for new construction, additions, renovations, decks, pools and most repair work. Building & Neighborhood Services can confirm your exact project at 615-794-7012.';
  }
  if(/\b(city hall|city offices?|ayuntamiento|oficinas? de la ciudad)\b/.test(t)&&/\b(hours?|open|close|horario|abre|cierra)\b/.test(t)){
    return es
      ?'Franklin no tiene un solo horario universal de “City Hall” porque las oficinas municipales funcionan en varias ubicaciones. Building & Neighborhood Services abre de lunes a viernes de 7:30 a. m. a 5:00 p. m.; las solicitudes de permisos se aceptan hasta las 4:30 p. m. Si necesita otra oficina, dígame cuál.'
      :'Franklin does not have one universal “City Hall” hours schedule because City offices operate from several locations. Building & Neighborhood Services is open Monday–Friday, 7:30 a.m.–5:00 p.m., with permit applications accepted until 4:30 p.m. If you mean another department, tell me which one.';
  }
  if(/\b(utility billing|water bill|water service|factura de agua|servicio de agua)\b/.test(t)&&/\b(hours?|open|horario|abre)\b/.test(t)){
    return es?'Utility Billing de Franklin abre de lunes a viernes de 8:00 a. m. a 5:00 p. m., excepto días festivos. El teléfono es 615-794-4572.':'Franklin Utility Billing is open Monday–Friday, 8:00 a.m.–5:00 p.m., except holidays. The phone number is 615-794-4572.';
  }
  if(/\b(trash|garbage|recycling|sanitation|basura|reciclaje|saneamiento)\b/.test(t)&&/\b(hours?|open|horario|abre)\b/.test(t)){
    return es?'Sanitation and Environmental Services de Franklin abre de lunes a viernes de 7:00 a. m. a 4:00 p. m. El teléfono es 615-794-1516.':'Franklin Sanitation and Environmental Services is open Monday–Friday, 7:00 a.m.–4:00 p.m. The phone number is 615-794-1516.';
  }
  if(/\b(which school|school zone|zoned school|que escuela|zona escolar|escuela asignada)\b/.test(t)){
    return es?'Necesito la dirección exacta de la calle para decirle qué distrito o escuela corresponde, porque la asignación depende de la dirección.':'I need the exact street address to tell you the correct district or zoned school, because the assignment depends on the address.';
  }
  return '';
}
function cleanAnswer(v){
  let x=text(v)
    .replace(/\*\*([^*]+)\*\*/g,'$1')
    .replace(/__([^_]+)__/g,'$1')
    .replace(/\`([^\`]+)\`/g,'$1')
    .replace(/^\s{0,3}#{1,6}\s*/gm,'')
    .replace(/\b(click|open|visit|go to) (the )?(link|page|guide|website)\b[^.?!]*[.?!]?/gi,'')
    .replace(/\s+/g,' ').trim();
  if(x.length>1400)x=x.slice(0,1397).replace(/\s+\S*$/,'')+'…';
  return x;
}
function historyText(rows){
  if(!Array.isArray(rows))return'';
  return rows.slice(-8).map(x=>{const role=x&&x.role==='assistant'?'Assistant':'User',c=text(x?.content||x?.text||'').slice(0,700);return c?role+': '+c:''}).filter(Boolean).join('\n');
}
function extractOpenAIText(d){
  if(typeof d?.output_text==='string'&&d.output_text.trim())return d.output_text.trim();
  const parts=[];
  for(const item of d?.output||[])for(const c of item?.content||[])if(c?.type==='output_text'&&c?.text)parts.push(c.text);
  return parts.join('\n').trim();
}
async function llmAnswer(q,language,history,context,sources){
  if(!OPENAI_API_KEY)return'';
  const sourceLines=(sources||[]).slice(0,5).map((x,i)=>`${i+1}. ${x.title}: ${x.snippet||''} ${x.url}`).join('\n');
  const instructions=`You are Franklin Assistant inside Franklin Navigator for Franklin, Tennessee. Answer ONLY the user's question. Be direct, useful, conversational and concise. Do not tell the user to navigate Franklin Navigator, open a guide, visit another page, or explore other features. Do not add unrelated next steps, marketing, profile cards, or generic offers to help. Ask one short clarifying question only when the answer genuinely depends on missing information. Use the supplied Franklin context and current-source excerpts when relevant. Do not invent facts. If a fact may have changed and the context is insufficient, say you could not verify it. Do not include links unless the user specifically asks for a source, link, website, or official page. For emergencies, tell the user to call 911; for suicide or mental-health crisis, call or text 988. Answer in ${String(language||'en').startsWith('es')?'Spanish':'English'}. Return plain text only. Do not use Markdown, asterisks, headings, bullet syntax, code formatting, or tables. Keep most answers to 1–5 short paragraphs.`;
  const input=`${historyText(history)?'Conversation so far:\n'+historyText(history)+'\n\n':''}User question: ${q}\n\nFranklin context:\n${context||'No additional verified context was available.'}\n\nCurrent/source excerpts:\n${sourceLines||'None'}`;
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:OPENAI_MODEL,instructions,input,max_output_tokens:550}),signal:ctl.signal});
    if(!r.ok)return'';
    return cleanAnswer(extractOpenAIText(await r.json()));
  }catch{return''}finally{clearTimeout(timer)}
}
function sourceRowsFromSeeds(q){
  return officialSeeds(q).map(x=>({title:x.title,url:x.url,snippet:x.snapshot||'',official:true,liveRead:false,verifiedAt:x.verifiedAt||VERIFIED_AT}));
}
async function verifyLlm(){
  llmState.lastCheckAt=now();llmState.verified=false;llmState.error=null;
  if(!OPENAI_API_KEY){llmState.error='NOT_CONFIGURED';return false}
  try{
    const q='Do I need a permit for my roof?',context=knownAnswer(q,'en');
    const out=await llmAnswer(q,'en',[],context,sourceRowsFromSeeds(q));
    if(!out||!/(permit|roof)/i.test(out)){llmState.error='FRANKLIN_SMOKE_FAILED';console.error(JSON.stringify({event:'franklin_llm_verification_failed',release:RELEASE,model:OPENAI_MODEL,status:llmState.error,at:now()}));return false}
    llmState.verified=true;llmState.error=null;console.log(JSON.stringify({event:'franklin_llm_verified',release:RELEASE,model:OPENAI_MODEL,smoke:'ROOF_PERMIT_GROUNDED_DIRECT_ANSWER',at:now()}));return true
  }catch(e){llmState.error=e?.name==='AbortError'?'TIMEOUT':'REQUEST_FAILED';console.error(JSON.stringify({event:'franklin_llm_verification_failed',release:RELEASE,model:OPENAI_MODEL,status:llmState.error,at:now()}));return false}
}
async function verifyResearchContract(){
  try{
    if(typeof research!=='function')throw Error('RESEARCH_MISSING');
    const r=await research('How does recycling work in Franklin?');
    const ok=Boolean(r&&Array.isArray(r.sources)&&r.sources.length&&r.answer&&!isGenericClarification(r.answer)&&/(recycl|sanitation|waste|collection)/i.test(String(r.answer)));
    console[ok?'log':'error'](JSON.stringify({event:ok?'franklin_research_contract_passed':'franklin_research_contract_failed',release:RELEASE,sourceCount:Array.isArray(r?.sources)?r.sources.length:0,confidence:r?.confidence||'low',at:now()}));
    return ok;
  }catch(e){
    console.error(JSON.stringify({event:'franklin_research_contract_failed',release:RELEASE,error:String(e?.message||e).slice(0,100),at:now()}));
    return false;
  }
}
async function verifyLiveEndpoint(){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),24000);
  try{
    const r=await fetch(`http://127.0.0.1:${PORT}/api/answer`,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://franklinnavigator.com'},body:JSON.stringify({q:'Do I need a permit for my roof?',contextualQ:'Do I need a permit for my roof?',language:'en',history:[]}),signal:ctl.signal});
    const d=await r.json().catch(()=>({}));
    const ok=r.ok&&d?.ok===true&&d?.llmUsed===true&&/^llm_grounded_/.test(String(d?.answerMode||''))&&/(permit|roof)/i.test(String(d?.answer||''));
    if(!ok){console.error(JSON.stringify({event:'franklin_live_api_smoke_failed',release:RELEASE,httpStatus:r.status,answerMode:d?.answerMode||null,llmUsed:d?.llmUsed===true,error:d?.error||null,at:now()}));return false}
    console.log(JSON.stringify({event:'franklin_live_api_smoke_passed',release:RELEASE,httpStatus:r.status,answerMode:d.answerMode,llmUsed:true,check:'LIVE_HTTP_API_ROOF_PERMIT',at:now()}));return true
  }catch(e){console.error(JSON.stringify({event:'franklin_live_api_smoke_failed',release:RELEASE,error:e?.name==='AbortError'?'TIMEOUT':'REQUEST_FAILED',at:now()}));return false}finally{clearTimeout(timer)}
}
async function verifyGeneralConversationSet(){
  const singles=[
    {q:'How does recycling work in Franklin?',expect:/recycl|sanitation|waste|collection/i},
    {q:'Where can I find park information in Franklin?',expect:/park|recreation/i},
    {q:'What public transportation is available in Franklin?',expect:/transit|transport|bus/i},
    {q:'How do I figure out which school serves my address?',expect:/school|district|address|zone/i},
    {q:'Who handles water service problems in Franklin?',expect:/water|utility|service|repair/i},
    {q:'Where do I check current city meetings?',expect:/meeting|calendar|city|agenda/i}
  ];
  const results=[];
  for(const c of singles){
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),30000);
    try{
      const r=await fetch(`http://127.0.0.1:${PORT}/api/answer`,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://franklinnavigator.com'},body:JSON.stringify({q:c.q,contextualQ:c.q,language:'en',history:[]}),signal:ctl.signal});
      const d=await r.json().catch(()=>({}));
      const ok=r.ok&&d?.ok===true&&d?.llmUsed===true&&/^llm_grounded_/.test(String(d?.answerMode||''))&&c.expect.test(responseEvidence(d))&&!isGenericClarification(d?.answer);
      results.push(ok);
      console[ok?'log':'error'](JSON.stringify({event:ok?'franklin_general_conversation_case_passed':'franklin_general_conversation_case_failed',release:RELEASE,question:c.q,httpStatus:r.status,answerMode:d?.answerMode||null,llmUsed:d?.llmUsed===true,at:now()}));
    }catch(e){
      results.push(false);
      console.error(JSON.stringify({event:'franklin_general_conversation_case_failed',release:RELEASE,question:c.q,error:e?.name==='AbortError'?'TIMEOUT':'REQUEST_FAILED',at:now()}));
    }finally{clearTimeout(timer)}
  }

  const threads=[
    {
      first:'How does recycling work in Franklin?',
      second:'what about brush pickup?',
      contextual:'How does recycling work in Franklin? what about brush pickup?',
      firstExpect:/recycl|sanitation|waste|collection/i,
      secondExpect:/brush|pickup|sanitation|waste/i
    },
    {
      first:'What public transportation is available in Franklin?',
      second:'is there accessible service?',
      contextual:'What public transportation is available in Franklin? is there accessible service?',
      firstExpect:/transit|transport|bus/i,
      secondExpect:/access|transit|transport|service/i
    },
    {
      first:'Who handles water service problems in Franklin?',
      second:'what number should I call?',
      contextual:'Who handles water service problems in Franklin? what number should I call?',
      firstExpect:/water|utility|service|repair/i,
      secondExpect:/615|phone|call|water/i
    },
    {
      first:'How do I figure out which school serves my address?',
      second:'what do you need from me?',
      contextual:'How do I figure out which school serves my address? what do you need from me?',
      firstExpect:/school|district|address|zone/i,
      secondExpect:/address|street|school|district/i
    }
  ];
  for(const c of threads){
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),45000);
    try{
      const headers={'Content-Type':'application/json','Origin':'https://franklinnavigator.com'};
      const r1=await fetch(`http://127.0.0.1:${PORT}/api/answer`,{method:'POST',headers,body:JSON.stringify({q:c.first,contextualQ:c.first,language:'en',history:[]}),signal:ctl.signal});
      const a=await r1.json().catch(()=>({}));
      const firstOk=r1.ok&&groundedSubstantive(a);
      const history=[{role:'user',content:c.first},{role:'assistant',content:String(a?.answer||'').slice(0,900)}];
      const r2=await fetch(`http://127.0.0.1:${PORT}/api/answer`,{method:'POST',headers,body:JSON.stringify({q:c.second,contextualQ:c.contextual,language:'en',history}),signal:ctl.signal});
      const b=await r2.json().catch(()=>({}));
      const secondOk=r2.ok&&groundedSubstantive(b);
      const ok=firstOk&&secondOk;
      results.push(ok);
      console[ok?'log':'error'](JSON.stringify({event:ok?'franklin_context_thread_passed':'franklin_context_thread_failed',release:RELEASE,first:c.first,second:c.second,firstMode:a?.answerMode||null,secondMode:b?.answerMode||null,at:now()}));
    }catch(e){
      results.push(false);
      console.error(JSON.stringify({event:'franklin_context_thread_failed',release:RELEASE,first:c.first,second:c.second,error:e?.name==='AbortError'?'TIMEOUT':'REQUEST_FAILED',at:now()}));
    }finally{clearTimeout(timer)}
  }
  const total=singles.length+threads.length,passed=results.filter(Boolean).length,ok=results.length===total&&passed===total;
  console[ok?'log':'error'](JSON.stringify({event:ok?'franklin_general_conversation_set_passed':'franklin_general_conversation_set_failed',release:RELEASE,passed,total,singleCases:singles.length,contextThreads:threads.length,at:now()}));
  return ok;
}
async function verifySpanishConversationSet(){
  const singles=[
    {q:'¿Cómo funciona el reciclaje en Franklin?',contextualQ:'¿Cómo funciona el reciclaje en Franklin?',expect:/recicl|saneamiento|desechos|recolecci[oó]n/i,sourceExpect:/sanitation-and-environmental-services|Sanitation and Environmental Services/i},
    {q:'¿Dónde puedo ver información de parques en Franklin?',contextualQ:'¿Dónde puedo ver información de parques en Franklin?',expect:/parque|recreaci[oó]n/i,sourceExpect:/\/parks\/|Parks Contact/i},
    {q:'¿Qué transporte público hay en Franklin?',contextualQ:'¿Qué transporte público hay en Franklin?',expect:/transporte|autob[uú]s|tr[aá]nsito/i,sourceExpect:/Franklin Transit|finance-administration/i}
  ];
  const threads=[
    {
      first:'¿Cómo funciona el reciclaje en Franklin?',
      second:'¿y la recolección de ramas?',
      contextual:'¿Cómo funciona el reciclaje en Franklin? ¿y la recolección de ramas?',
      firstExpect:/recicl|saneamiento|desechos|recolecci[oó]n/i,
      secondExpect:/rama|recolecci[oó]n|saneamiento|desechos/i,
      sourceExpect:/sanitation-and-environmental-services|Sanitation and Environmental Services/i
    },
    {
      first:'¿Qué transporte público hay en Franklin?',
      second:'¿hay servicio accesible?',
      contextual:'¿Qué transporte público hay en Franklin? ¿hay servicio accesible?',
      firstExpect:/transporte|autob[uú]s|tr[aá]nsito/i,
      secondExpect:/acces|transporte|servicio|tr[aá]nsito/i,
      sourceExpect:/Franklin Transit|finance-administration/i
    },
    {
      first:'¿Cómo sé qué escuela corresponde a mi dirección?',
      second:'¿qué necesita de mí?',
      contextual:'¿Cómo sé qué escuela corresponde a mi dirección? ¿qué necesita de mí?',
      firstExpect:/escuela|distrito|direcci[oó]n|zona/i,
      secondExpect:/direcci[oó]n|calle|escuela|distrito/i,
      sourceExpect:/wcs\.edu|fssd\.org|Williamson County Schools|Franklin Special School District/i
    }
  ];
  const results=[];
  for(const c of singles){
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),30000);
    try{
      const r=await fetch(`http://127.0.0.1:${PORT}/api/answer`,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://franklinnavigator.com'},body:JSON.stringify({q:c.q,contextualQ:c.contextualQ,language:'es',history:[]}),signal:ctl.signal});
      const d=await r.json().catch(()=>({}));
      const ok=r.ok&&groundedSubstantive(d);
      results.push(ok);
      console[ok?'log':'error'](JSON.stringify({event:ok?'franklin_spanish_conversation_case_passed':'franklin_spanish_conversation_case_failed',release:RELEASE,question:c.q,httpStatus:r.status,answerMode:d?.answerMode||null,at:now()}));
    }catch(e){
      results.push(false);
      console.error(JSON.stringify({event:'franklin_spanish_conversation_case_failed',release:RELEASE,question:c.q,error:e?.name==='AbortError'?'TIMEOUT':'REQUEST_FAILED',at:now()}));
    }finally{clearTimeout(timer)}
  }
  for(const c of threads){
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),45000);
    try{
      const headers={'Content-Type':'application/json','Origin':'https://franklinnavigator.com'};
      const r1=await fetch(`http://127.0.0.1:${PORT}/api/answer`,{method:'POST',headers,body:JSON.stringify({q:c.first,contextualQ:c.first,language:'es',history:[]}),signal:ctl.signal});
      const a=await r1.json().catch(()=>({}));
      const firstOk=r1.ok&&groundedSubstantive(a);
      const history=[{role:'user',content:c.first},{role:'assistant',content:String(a?.answer||'').slice(0,900)}];
      const r2=await fetch(`http://127.0.0.1:${PORT}/api/answer`,{method:'POST',headers,body:JSON.stringify({q:c.second,contextualQ:c.contextual,language:'es',history}),signal:ctl.signal});
      const b=await r2.json().catch(()=>({}));
      const secondOk=r2.ok&&groundedSubstantive(b);
      const ok=firstOk&&secondOk;
      results.push(ok);
      console[ok?'log':'error'](JSON.stringify({event:ok?'franklin_spanish_context_thread_passed':'franklin_spanish_context_thread_failed',release:RELEASE,first:c.first,second:c.second,firstMode:a?.answerMode||null,secondMode:b?.answerMode||null,at:now()}));
    }catch(e){
      results.push(false);
      console.error(JSON.stringify({event:'franklin_spanish_context_thread_failed',release:RELEASE,first:c.first,second:c.second,error:e?.name==='AbortError'?'TIMEOUT':'REQUEST_FAILED',at:now()}));
    }finally{clearTimeout(timer)}
  }
  const total=singles.length+threads.length,passed=results.filter(Boolean).length,ok=results.length===total&&passed===total;
  console[ok?'log':'error'](JSON.stringify({event:ok?'franklin_spanish_conversation_set_passed':'franklin_spanish_conversation_set_failed',release:RELEASE,passed,total,singleCases:singles.length,contextThreads:threads.length,at:now()}));
  return ok;
}
async function verifyRoofLeakConversation(){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),30000);
  try{
    const headers={'Content-Type':'application/json','Origin':'https://franklinnavigator.com'};
    const first=await fetch(`http://127.0.0.1:${PORT}/api/answer`,{method:'POST',headers,body:JSON.stringify({q:'my roof is leaking.',contextualQ:'my roof is leaking.',language:'en',history:[]}),signal:ctl.signal});
    const a=await first.json().catch(()=>({}));
    const firstOk=first.ok&&a?.ok===true&&a?.answer&&!isGenericClarification(a.answer)&&/(roof|roofer|leak|water|repair)/i.test(String(a.answer));
    const history=[{role:'user',content:'my roof is leaking.'},{role:'assistant',content:String(a?.answer||'').slice(0,900)}];
    const second=await fetch(`http://127.0.0.1:${PORT}/api/answer`,{method:'POST',headers,body:JSON.stringify({q:'i need it repaired.',contextualQ:'my roof is leaking. i need it repaired.',language:'en',history}),signal:ctl.signal});
    const b=await second.json().catch(()=>({}));
    const secondOk=second.ok&&b?.ok===true&&b?.answer&&!isGenericClarification(b.answer)&&/(roof|roofer|repair|contractor)/i.test(String(b.answer));
    const ok=firstOk&&secondOk;
    console[ok?'log':'error'](JSON.stringify({event:ok?'franklin_roof_leak_conversation_smoke_passed':'franklin_roof_leak_conversation_smoke_failed',release:RELEASE,firstStatus:first.status,firstMode:a?.answerMode||null,secondStatus:second.status,secondMode:b?.answerMode||null,check:'ROOF_LEAK_THEN_REPAIR_TWO_TURN',at:now()}));
    return ok;
  }catch(e){console.error(JSON.stringify({event:'franklin_roof_leak_conversation_smoke_failed',release:RELEASE,error:e?.name==='AbortError'?'TIMEOUT':'REQUEST_FAILED',check:'ROOF_LEAK_THEN_REPAIR_TWO_TURN',at:now()}));return false}finally{clearTimeout(timer)}
}
function selfTest(){
  const roof=knownAnswer('Do I need a permit for my roof?','en');
  const leakingRoof=knownAnswer('my roof is leaking.','en');
  const hall=knownAnswer('What time is City Hall open?','en');
  const school=knownAnswer('Which school is this address zoned for?','en');
  if(!/permit/i.test(roof)||!/615-794-7012/.test(roof))throw Error('selftest_roof_permit');
  if(!/(roofer|roof)/i.test(leakingRoof)||!/wet roof/i.test(leakingRoof))throw Error('selftest_roof_leak');
  if(typeof research!=='function')throw Error('selftest_research_missing');
  if(typeof isGenericClarification!=='function'||!isGenericClarification('I could not verify a reliable answer yet. Tell me one more detail.'))throw Error('selftest_clarification_guard');
  if(!/7:30/.test(hall)||!/5:00/.test(hall))throw Error('selftest_city_hours');
  if(!/address/i.test(school))throw Error('selftest_school_zone');
  if(askedForSource('Do I need a permit?'))throw Error('selftest_source_gate');
  if(!askedForSource('What is your source for that?'))throw Error('selftest_source_request');
  const ui='dist/assets/franklin-assistant-r1305.js';if(fs.existsSync(ui))new Function(fs.readFileSync(ui,'utf8'));
  return true;
}
selfTest();
const server=http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost');
  if(req.method==='OPTIONS'){allow(req,res);res.statusCode=204;return res.end()}
  if(req.method==='GET'&&u.pathname==='/health')return json(req,res,200,{ok:true,release:RELEASE,mode:'DIRECT_ANSWER_WITH_GROUNDED_LLM_PRIMARY_AND_OFFICIAL_FIRST_FALLBACK',verifiedSnapshotDate:VERIFIED_AT,llmConfigured:llmState.configured,llmVerified:llmState.verified,llmLastCheckAt:llmState.lastCheckAt,llmVerificationError:llmState.error,startupQualified:startupState.qualified,startupChecks:{researchOk:startupState.researchOk,generalConversationOk:startupState.generalConversationOk,spanishConversationOk:startupState.spanishConversationOk,roofLeakOk:startupState.roofLeakOk,liveApiOk:startupState.liveApiOk},lastQualifiedAt:startupState.lastQualifiedAt,model:OPENAI_API_KEY?OPENAI_MODEL:null,at:now()});
  if(req.method!=='POST'||(u.pathname!=='/api/research'&&u.pathname!=='/api/answer'))return json(req,res,404,{ok:false,error:'NOT_FOUND'});
  const o=String(req.headers.origin||'');if(o&&!ORIGINS.has(o))return json(req,res,403,{ok:false,error:'ORIGIN_NOT_ALLOWED'});
  if(!limited(clientKey(req),60))return json(req,res,429,{ok:false,error:'RATE_LIMITED'});
  const b=await body(req),q=text(b.q).slice(0,500),contextQ=text(b.contextualQ||b.q).slice(0,700),language=text(b.language||'en').slice(0,8);
  if(q.length<1)return json(req,res,400,{ok:false,error:'QUESTION_REQUIRED'});
  const known=knownAnswer(contextQ,language),simple=/^(hi|hello|hey|good morning|good afternoon|good evening|hola|buenos dias|buenas tardes|buenas noches|thank you|thanks|gracias)[!. ]*$/i.test(norm(q));
  let result={answer:'',sources:[],confidence:'low',usedVerifiedSnapshot:false},answer='',answerMode='',llmUsed=false;
  if(simple&&known){answer=known;answerMode='known_simple'}
  else if(OPENAI_API_KEY){
    if(known){
      result={answer:known,sources:sourceRowsFromSeeds(contextQ),confidence:'high',usedVerifiedSnapshot:true};
      const llm=await llmAnswer(q,language,b.history,known,result.sources);
      if(llm){answer=llm;answerMode='llm_grounded_known';llmUsed=true}
      else{answer=known;answerMode='known_fallback'}
    }else{
      result=await research(contextQ);
      const llm=await llmAnswer(q,language,b.history,result.answer,result.sources);
      if(llm){answer=llm;answerMode='llm_grounded_research';llmUsed=true}
      else if(result.answer){answer=result.answer;answerMode='research_fallback'}
    }
  }else{
    if(known){answer=known;answerMode='known_no_llm'}
    else{
      result=await research(contextQ);
      if(result.answer){answer=result.answer;answerMode='research_no_llm'}
    }
  }
  if(answer&&askedForSource(q)&&result.sources?.length){
    const urls=result.sources.slice(0,2).map(x=>x.url).filter(Boolean);
    if(urls.length&&!urls.some(u=>answer.includes(u)))answer=cleanAnswer(answer+' '+urls.join(' '));
  }
  if(!answer){answer=String(language||'').startsWith('es')?'No pude verificar una respuesta confiable con la información disponible. ¿Puede darme un detalle más?':'I could not verify a reliable answer from the information available. Can you give me one more detail?';answerMode='clarify'}
  console.log(JSON.stringify({event:'franklin_assistant_answer_complete',release:RELEASE,answerMode,llmUsed,confidence:known?'high':result.confidence,sourceCount:(result.sources||[]).length,at:now()}));
  return json(req,res,200,{ok:true,question:q,answer,answerMode,llmUsed,confidence:known?'high':result.confidence,sources:result.sources||[],researchedAt:now(),usedVerifiedSnapshot:Boolean(result.usedVerifiedSnapshot)});
}catch(e){console.error(JSON.stringify({event:'assistant_runtime_error',message:String(e.message||e).slice(0,160),at:now()}));return json(req,res,Number(e.status||503),{ok:false,error:'ANSWER_UNAVAILABLE',message:'Franklin Assistant could not complete the answer right now.'})}});
server.requestTimeout=25000;server.headersTimeout=10000;server.listen(PORT,'0.0.0.0',()=>{console.log(JSON.stringify({event:'franklin_assistant_runtime_listening',release:RELEASE,port:PORT,ready:true,llmConfigured:llmState.configured,llmVerified:llmState.verified,model:OPENAI_API_KEY?OPENAI_MODEL:null,at:now()}));(async()=>{
  const llmOk=await verifyLlm();
  const researchOk=await verifyResearchContract();
  const liveOk=llmOk&&researchOk?await verifyLiveEndpoint():false;
  const generalConversationOk=llmOk&&researchOk?await verifyGeneralConversationSet():false;
  const spanishConversationOk=llmOk&&researchOk?await verifySpanishConversationSet():false;
  const roofLeakOk=await verifyRoofLeakConversation();
  startupState.researchOk=researchOk;startupState.liveApiOk=liveOk;startupState.generalConversationOk=generalConversationOk;startupState.spanishConversationOk=spanishConversationOk;startupState.roofLeakOk=roofLeakOk;
  startupState.qualified=Boolean(llmOk&&researchOk&&liveOk&&generalConversationOk&&spanishConversationOk&&roofLeakOk);
  if(startupState.qualified){startupState.lastQualifiedAt=now();console.log(JSON.stringify({event:'franklin_assistant_startup_qualified',release:RELEASE,llmOk,researchOk,liveOk,generalConversationOk,spanishConversationOk,roofLeakOk,at:startupState.lastQualifiedAt}))}
  else console.error(JSON.stringify({event:'franklin_assistant_startup_acceptance_incomplete',release:RELEASE,llmOk,researchOk,liveOk,generalConversationOk,spanishConversationOk,roofLeakOk,at:now()}))
})().catch(e=>console.error(JSON.stringify({event:'franklin_assistant_startup_acceptance_incomplete',release:RELEASE,error:String(e?.message||e).slice(0,120),at:now()}))) });
