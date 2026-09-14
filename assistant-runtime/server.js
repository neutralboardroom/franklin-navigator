'use strict';
const http=require('node:http');
const dns=require('node:dns');
const net=require('node:net');
const {URL}=require('node:url');
const PORT=Number(process.env.PORT||10000);
const RELEASE='FR-NAV1.30.2-HF3.11.2';
const ORIGINS=new Set(['https://franklinnavigator.com','https://www.franklinnavigator.com','https://franklin-navigator.onrender.com']);
const BODY_LIMIT=32*1024,rate=new Map(),VERIFIED_AT='2026-09-14';
const OPENAI_API_KEY=String(process.env.OPENAI_API_KEY||'').trim();
const OPENAI_MODEL=String(process.env.OPENAI_MODEL||'gpt-5.6-luna').trim();
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
 {re:/\b(city hall|city office|city offices|city government|contact|address|administration|mayor|boma)\b/i,title:'City of Franklin — Contact Us',url:'https://www.franklintn.gov/services/contact-us',snapshot:'Franklin City Hall functions are operating from interim locations: Administration is at 740 Columbia Avenue; Community Development is at 120 9th Ave South; Billing & Licensing and Technology are at 204 9th Ave South; Fire Administration is at 507 New Highway 96 West. The mailing address remains 109 3rd Ave South, Franklin, TN 37064, and the City main phone is 615-791-3217. The City contact page does not publish one universal all-department City Hall hours schedule.'},
 {re:/\b(city hall|billing|utility billing|water service|payment|pay|hours|open)\b/i,title:'City of Franklin — Water FAQ / Utility Billing',url:'https://www.franklintn.gov/government/departments-k-z/water-management-department/water-faq',snapshot:'The City lists Utility Billing hours as 8:00 AM to 5:00 PM Monday through Friday, except holidays, at 615-794-4572. Billing & Licensing is located at 204 9th Ave South.'},
 {re:/\b(permit|permits|building|inspection|inspections|zoning|construction|remodel|renovation|repair|roof|roofing|fence|deck)\b/i,title:'City of Franklin — Residential & Commercial Construction',url:'https://www.franklintn.gov/government/departments-a-j/building-and-neighborhood-services/department-operations/department-information/residential-and-commercial-construction',snapshot:'The City of Franklin says a building permit is required for all new construction, additions, renovations, decks, pools and most repair work. Building & Neighborhood Services can confirm project-specific requirements at 615-794-7012. Residential permit applications are generally processed in 7 working days or less when complete. Separate electrical, plumbing, mechanical or low-voltage permits may also be required when that work is part of the project.'},
 {re:/\b(trash|garbage|recycling|recycle|brush|bulk|yard waste|sanitation|glass|cardboard)\b/i,title:'City of Franklin — Sanitation and Environmental Services',url:'https://www.franklintn.gov/government/departments-k-z/sanitation-and-environmental-services',snapshot:'Franklin Sanitation and Environmental Services handles municipal solid waste, curbside recycling, yard waste, bulk waste and brush collection within Franklin city limits. The office lists hours Monday through Friday, 7:00 AM to 4:00 PM, at 417 Century Court, phone 615-794-1516. Current glass and cardboard drop-off operating hours are Monday through Thursday 6:00 AM to 4:00 PM and the first Saturday of each month 8:00 AM to noon.'},
 {re:/\b(water|sewer|wastewater|leak|utility|utilities)\b/i,title:'City of Franklin — Water Management',url:'https://www.franklintn.gov/government/departments-k-z/water-management-department/water-faq',snapshot:'For Franklin water service and repair, the City lists 615-794-4554 from 7:00 AM to 4:00 PM except holidays. Utility Billing for starting or stopping water service is 615-794-4572, 8:00 AM to 5:00 PM Monday through Friday except holidays.'},
 {re:/\b(meeting|meetings|agenda|calendar|event|events|tonight|today|tomorrow|weekend|boma|commission)\b/i,title:'City of Franklin — Calendar',url:'https://www.franklintn.gov/our-city/calendar',snapshot:'The City of Franklin maintains an official calendar for current meetings and public events. Because dates and times change, open the linked official calendar to confirm the current item before going.'},
 {re:/\b(park|parks|recreation|field|fields|athletics)\b/i,title:'City of Franklin — Parks Contact',url:'https://www.franklintn.gov/government/departments-k-z/parks/contact-us',snapshot:'Franklin Parks and Recreation can be reached at 615-794-2103. Confirm current facility, field, program and event details with Parks before going.'},
 {re:/\b(transit|bus|transportation|mobility)\b/i,title:'City of Franklin — Franklin Transit',url:'https://www.franklintn.gov/government/departments-a-j/finance-administration',snapshot:'Franklin Transit is a City-supported transportation service. Routes, fares, operating hours and accessibility details can change, so confirm the current trip at the official source before travel.'},
 {re:/\b(school|schools|student|enrollment|district|zone|zoned|teacher)\b/i,title:'Williamson County Schools',url:'https://www.wcs.edu/',snapshot:'Franklin addresses may fall within Williamson County Schools. Enrollment, zoning and calendars should be confirmed using the district’s current official information for the specific address.'},
 {re:/\b(school|schools|student|enrollment|district|zone|zoned|teacher)\b/i,title:'Franklin Special School District',url:'https://www.fssd.org/',snapshot:'Some Franklin addresses are served by Franklin Special School District. Enrollment, zoning and calendars should be confirmed with the district’s current official information for the specific address.'},
 {re:/\b(county|property|assessor|county tax|register of deeds|court clerk)\b/i,title:'Williamson County Government',url:'https://www.williamsoncounty-tn.gov/',snapshot:'Williamson County handles county-level services including property, elections, courts and other county offices. Use the linked official county source for current office-specific hours and requirements.'}
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
function askedForSource(q){return /\b(source|sources|link|links|website|official page|where did you get|fuente|fuentes|enlace|sitio web|pagina oficial)\b/i.test(q)}
function knownAnswer(q,language='en'){
  const t=norm(q),es=String(language||'').toLowerCase().startsWith('es');
  if(/^(hi|hello|hey|good morning|good afternoon|good evening|hola|buenos dias|buenas tardes|buenas noches)[!. ]*$/.test(t))return es?'Hola. ¿Qué le gustaría saber sobre Franklin?':'Hi. What would you like to know about Franklin?';
  if(/\b(thank you|thanks|gracias)\b/.test(t)&&t.split(' ').length<8)return es?'Con gusto.':'You’re welcome.';
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
  let x=text(v).replace(/\b(click|open|visit|go to) (the )?(link|page|guide|website)\b[^.?!]*[.?!]?/gi,'').replace(/\s+/g,' ').trim();
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
  const instructions=`You are Franklin Assistant inside Franklin Navigator for Franklin, Tennessee. Answer ONLY the user's question. Be direct, useful, conversational and concise. Do not tell the user to navigate Franklin Navigator, open a guide, visit another page, or explore other features. Do not add unrelated next steps, marketing, profile cards, or generic offers to help. Ask one short clarifying question only when the answer genuinely depends on missing information. Use the supplied Franklin context and current-source excerpts when relevant. Do not invent facts. If a fact may have changed and the context is insufficient, say you could not verify it. Do not include links unless the user specifically asks for a source, link, website, or official page. For emergencies, tell the user to call 911; for suicide or mental-health crisis, call or text 988. Answer in ${String(language||'en').startsWith('es')?'Spanish':'English'}. Keep most answers to 1–5 short paragraphs.`;
  const input=`${historyText(history)?'Conversation so far:\n'+historyText(history)+'\n\n':''}User question: ${q}\n\nFranklin context:\n${context||'No additional verified context was available.'}\n\nCurrent/source excerpts:\n${sourceLines||'None'}`;
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:OPENAI_MODEL,instructions,input,max_output_tokens:550}),signal:ctl.signal});
    if(!r.ok)return'';
    return cleanAnswer(extractOpenAIText(await r.json()));
  }catch{return''}finally{clearTimeout(timer)}
}
async function research(q){const official=officialSeeds(q),combined=[],seen=new Set();const add=list=>{for(const r of list||[])if(r.url&&!seen.has(r.url)){seen.add(r.url);combined.push(r)}};add(official);add(await searchWeb(q));if(!combined.length)return{answer:'',sources:[],confidence:'low'};const enriched=await enrich(combined,q),syn=synthesize(enriched,q);return{answer:cleanAnswer(syn.answer),sources:enriched.slice(0,5).map(x=>({title:x.title,url:x.url,snippet:text(x.best).slice(0,360),official:sourceRank(x.url)>=35,liveRead:Boolean(x.liveRead),verifiedAt:x.verifiedAt||null})),confidence:syn.confidence,usedVerifiedSnapshot:enriched.some(x=>x.origin==='official'&&!x.liveRead&&x.snapshot)}}
function selfTest(){
  const roof=knownAnswer('Do I need a permit for my roof?','en');
  const hall=knownAnswer('What time is City Hall open?','en');
  const school=knownAnswer('Which school is this address zoned for?','en');
  if(!/permit/i.test(roof)||!/615-794-7012/.test(roof))throw Error('selftest_roof_permit');
  if(!/7:30/.test(hall)||!/5:00/.test(hall))throw Error('selftest_city_hours');
  if(!/address/i.test(school))throw Error('selftest_school_zone');
  if(askedForSource('Do I need a permit?'))throw Error('selftest_source_gate');
  if(!askedForSource('What is your source for that?'))throw Error('selftest_source_request');
  return true;
}
selfTest();
const server=http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost');
  if(req.method==='OPTIONS'){allow(req,res);res.statusCode=204;return res.end()}
  if(req.method==='GET'&&u.pathname==='/health')return json(req,res,200,{ok:true,release:RELEASE,mode:'DIRECT_ANSWER_ONLY_WITH_OPTIONAL_LLM_AND_OFFICIAL_FIRST_RESEARCH',verifiedSnapshotDate:VERIFIED_AT,llmConfigured:Boolean(OPENAI_API_KEY),model:OPENAI_API_KEY?OPENAI_MODEL:null,at:now()});
  if(req.method!=='POST'||(u.pathname!=='/api/research'&&u.pathname!=='/api/answer'))return json(req,res,404,{ok:false,error:'NOT_FOUND'});
  const o=String(req.headers.origin||'');if(o&&!ORIGINS.has(o))return json(req,res,403,{ok:false,error:'ORIGIN_NOT_ALLOWED'});
  if(!limited(clientKey(req),60))return json(req,res,429,{ok:false,error:'RATE_LIMITED'});
  const b=await body(req),q=text(b.q).slice(0,500),language=text(b.language||'en').slice(0,8);
  if(q.length<1)return json(req,res,400,{ok:false,error:'QUESTION_REQUIRED'});
  const known=knownAnswer(q,language);
  let result={answer:'',sources:[],confidence:'low',usedVerifiedSnapshot:false},answer=known,answerMode=known?'known':'';
  if(!answer){
    result=await research(q);
    const llm=await llmAnswer(q,language,b.history,result.answer,result.sources);
    if(llm){answer=llm;answerMode='llm'}
    else if(result.answer){answer=result.answer;answerMode='research'}
  }
  if(answer&&askedForSource(q)&&result.sources?.length){
    const urls=result.sources.slice(0,2).map(x=>x.url).filter(Boolean);
    if(urls.length)answer=cleanAnswer(answer+' '+urls.join(' '));
  }
  if(!answer){answer=String(language||'').startsWith('es')?'No pude verificar una respuesta confiable con la información disponible. ¿Puede darme un detalle más?':'I could not verify a reliable answer from the information available. Can you give me one more detail?';answerMode='clarify'}
  return json(req,res,200,{ok:true,question:q,answer,answerMode,confidence:known?'high':result.confidence,sources:result.sources||[],researchedAt:now(),usedVerifiedSnapshot:Boolean(result.usedVerifiedSnapshot)});
}catch(e){console.error(JSON.stringify({event:'assistant_runtime_error',message:String(e.message||e).slice(0,160),at:now()}));return json(req,res,Number(e.status||503),{ok:false,error:'ANSWER_UNAVAILABLE',message:'Franklin Assistant could not complete the answer right now.'})}});
server.requestTimeout=20000;server.headersTimeout=10000;server.listen(PORT,'0.0.0.0',()=>console.log(JSON.stringify({event:'franklin_assistant_runtime_listening',release:RELEASE,port:PORT,ready:true,llmConfigured:Boolean(OPENAI_API_KEY),model:OPENAI_API_KEY?OPENAI_MODEL:null,at:now()})));
