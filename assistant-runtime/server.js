'use strict';

const http=require('node:http');

const PORT=Number(process.env.PORT||10000);
const RELEASE='FRANKLIN-ASSISTANT2-0.2.0';
const OPENAI_API_KEY=String(process.env.OPENAI_API_KEY||'').trim();
const OPENAI_MODEL=String(process.env.OPENAI_MODEL||'gpt-5.6-luna').trim();
const ORIGINS=new Set([
  'https://franklinnavigator.com',
  'https://www.franklinnavigator.com',
  'https://franklin-navigator.onrender.com'
]);
const BODY_LIMIT=24*1024;
const rate=new Map();
const startup={qualified:false,testsPassed:0,testsTotal:0,lastQualifiedAt:null};

const now=()=>new Date().toISOString();
const clean=v=>String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s'&?.-]/g,' ').replace(/\s+/g,' ').trim();

function allow(req,res){
  const origin=String(req.headers.origin||'');
  if(origin&&ORIGINS.has(origin)){
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
  }
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
}

function reply(req,res,status,payload){
  allow(req,res);
  const body=JSON.stringify(payload);
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Content-Length',Buffer.byteLength(body));
  res.end(body);
}

async function readJson(req){
  let size=0,body='';
  for await(const chunk of req){
    size+=chunk.length;
    if(size>BODY_LIMIT)throw Object.assign(new Error('PAYLOAD_TOO_LARGE'),{status:413});
    body+=chunk.toString('utf8');
  }
  try{return JSON.parse(body||'{}')}catch{throw Object.assign(new Error('INVALID_JSON'),{status:400})}
}

function limited(key,max=80,windowMs=3600000){
  const t=Date.now();
  let row=rate.get(key);
  if(!row||row.until<t)row={count:0,until:t+windowMs};
  row.count++;
  rate.set(key,row);
  return row.count<=max;
}

setInterval(()=>{
  const t=Date.now();
  for(const [key,row] of rate)if(row.until<t)rate.delete(key);
},60000).unref();

const SOURCES=[
  {
    id:'building',
    tags:['permit','permits','building','inspection','construction','repair','roof','deck','fence','remodel','renovation','permiso','permisos','construccion','reparacion','techo','terraza','cerca'],
    title:'City of Franklin — Residential & Commercial Construction',
    url:'https://www.franklintn.gov/government/departments-a-j/building-and-neighborhood-services/department-operations/department-information/residential-and-commercial-construction',
    snapshot:'The City of Franklin says a building permit is required for all new construction, additions, renovations, decks, pools and most repair work. Building & Neighborhood Services can confirm project-specific requirements at 615-794-7012. Separate electrical, plumbing, mechanical or low-voltage permits may also be required when that work is part of a project.'
  },
  {
    id:'city-contact',
    tags:['city hall','city office','city offices','city government','contact','address','administration','ayuntamiento','oficina de la ciudad','contacto','direccion'],
    title:'City of Franklin — Contact Us',
    url:'https://www.franklintn.gov/services/contact-us',
    snapshot:'Franklin City offices operate from several locations. The City main phone is 615-791-3217. The City contact page does not publish one universal all-department City Hall hours schedule.'
  },
  {
    id:'utility-billing',
    tags:['utility billing','water bill','water service','billing','payment','hours','open','factura de agua','servicio de agua','facturacion','horario'],
    title:'City of Franklin — Water FAQ / Utility Billing',
    url:'https://www.franklintn.gov/government/departments-k-z/water-management-department/water-faq',
    snapshot:'Franklin Utility Billing hours are 8:00 AM to 5:00 PM Monday through Friday except holidays. Utility Billing can be reached at 615-794-4572.'
  },
  {
    id:'water',
    tags:['water','sewer','wastewater','leak','utility','agua','alcantarillado','fuga'],
    title:'City of Franklin — Water Management',
    url:'https://www.franklintn.gov/government/departments-k-z/water-management-department/water-faq',
    snapshot:'For Franklin water service and repair, the City lists 615-794-4554 from 7:00 AM to 4:00 PM except holidays. Utility Billing for starting or stopping water service is 615-794-4572, 8:00 AM to 5:00 PM Monday through Friday except holidays.'
  },
  {
    id:'sanitation',
    tags:['trash','garbage','recycling','recycle','brush','bulk','yard waste','sanitation','glass','cardboard','basura','reciclaje','ramas','saneamiento','vidrio','carton'],
    title:'City of Franklin — Sanitation and Environmental Services',
    url:'https://www.franklintn.gov/government/departments-k-z/sanitation-and-environmental-services',
    snapshot:'Franklin Sanitation and Environmental Services handles municipal solid waste, curbside recycling, yard waste, bulk waste and brush collection within Franklin city limits. The office lists hours Monday through Friday, 7:00 AM to 4:00 PM, at 417 Century Court, phone 615-794-1516.'
  },
  {
    id:'calendar',
    tags:['meeting','meetings','agenda','calendar','event','events','today','tonight','tomorrow','weekend','reunion','reuniones','calendario','evento','eventos','hoy','manana'],
    title:'City of Franklin — Calendar',
    url:'https://www.franklintn.gov/our-city/calendar',
    snapshot:'The City of Franklin maintains an official calendar for current meetings and public events. Dates and times can change, so current details should be confirmed on the official calendar.'
  },
  {
    id:'parks',
    tags:['park','parks','recreation','field','athletics','parque','parques','recreacion'],
    title:'City of Franklin — Parks',
    url:'https://www.franklintn.gov/government/departments-k-z/parks/contact-us',
    snapshot:'Franklin Parks and Recreation can be reached at 615-794-2103. Current facility, field, program and event details should be confirmed with Parks.'
  },
  {
    id:'transit',
    tags:['transit','bus','transportation','mobility','accessible','accessibility','transporte','autobus','movilidad','accesible'],
    title:'City of Franklin — Franklin Transit',
    url:'https://www.franklintn.gov/government/departments-a-j/finance-administration',
    snapshot:'Franklin Transit is a City-supported transportation service. Routes, fares, operating hours and accessibility details can change and should be confirmed at the official source.'
  },
  {
    id:'wcs',
    tags:['school','schools','student','enrollment','district','zone','zoned','escuela','escuelas','estudiante','inscripcion','distrito','zona'],
    title:'Williamson County Schools',
    url:'https://www.wcs.edu/',
    snapshot:'Franklin addresses may fall within Williamson County Schools. Enrollment, zoning and calendars should be confirmed using the district’s current official information for the exact address.'
  },
  {
    id:'fssd',
    tags:['school','schools','student','enrollment','district','zone','zoned','escuela','escuelas','estudiante','inscripcion','distrito','zona'],
    title:'Franklin Special School District',
    url:'https://www.fssd.org/',
    snapshot:'Some Franklin addresses are served by Franklin Special School District. Enrollment, zoning and calendars should be confirmed using the district’s current official information for the exact address.'
  }
];

function sourceRows(ids){
  return ids.map(id=>SOURCES.find(x=>x.id===id)).filter(Boolean).map(x=>({
    id:x.id,title:x.title,url:x.url,official:true
  }));
}

const FACTS=[
  {
    id:'deck-permit',
    match:q=>/\b(deck|decks|terraza|terrazas)\b/.test(q)&&/\b(permit|permits|repair|repairs|fix|permiso|permisos|reparar|reparacion)\b/.test(q),
    sources:['building'],
    answer:{
      en:'Yes. For deck repair in Franklin, plan on needing a building permit. The City says building permits are required for decks and for most repair work. If this is a very minor in-kind repair, confirm the exact scope with Building & Neighborhood Services at 615-794-7012 before starting.',
      es:'Sí. Para reparar una terraza en Franklin, cuente con necesitar un permiso de construcción. La Ciudad indica que se requieren permisos para terrazas y para la mayoría de los trabajos de reparación. Si es una reparación menor exactamente igual a lo existente, confirme el alcance con Building & Neighborhood Services al 615-794-7012 antes de comenzar.'
    }
  },
  {
    id:'roof-permit',
    match:q=>/\b(roof|roofing|techo|tejado)\b/.test(q)&&/\b(permit|permits|permiso|permisos)\b/.test(q),
    sources:['building'],
    answer:{
      en:'Yes, for a roof replacement or substantial roof repair in Franklin, plan on needing a building permit. The City says most repair work requires a building permit. For a small in-kind repair, confirm the exact scope with Building & Neighborhood Services at 615-794-7012.',
      es:'Sí. Para un reemplazo de techo o una reparación importante en Franklin, cuente con necesitar un permiso de construcción. La Ciudad indica que la mayoría de los trabajos de reparación requieren permiso. Para una reparación menor del mismo material, confirme el alcance con Building & Neighborhood Services al 615-794-7012.'
    }
  },
  {
    id:'city-hours',
    match:q=>/\b(city hall|city offices?|ayuntamiento|oficinas? de la ciudad)\b/.test(q)&&/\b(hours?|open|close|time|horario|abre|cierra|hora)\b/.test(q),
    sources:['city-contact'],
    answer:{
      en:'Franklin does not publish one universal hours schedule for all City offices because departments operate from several locations. If you tell me which department you need, I can give you the specific office information. The City main phone is 615-791-3217.',
      es:'Franklin no publica un solo horario para todas las oficinas municipales porque los departamentos funcionan en varias ubicaciones. Si me dice qué departamento necesita, puedo darle la información específica de esa oficina. El teléfono principal de la Ciudad es 615-791-3217.'
    }
  },
  {
    id:'school-zone',
    match:q=>/\b(which school|school zone|zoned school|school serves|what school|que escuela|qué escuela|zona escolar|escuela asignada|escuela corresponde)\b/.test(q),
    sources:['wcs','fssd'],
    answer:{
      en:'I need the exact street address to determine the correct school or district, because Franklin addresses can be served by different school systems and zoning depends on the address. You can send just the street address; do not include any student name or other private information.',
      es:'Necesito la dirección exacta de la calle para determinar la escuela o el distrito correcto, porque distintas direcciones de Franklin pueden pertenecer a sistemas escolares diferentes y la zona depende de la dirección. Puede enviar solo la dirección; no incluya el nombre del estudiante ni otra información privada.'
    }
  },
  {
    id:'water-phone',
    match:q=>/\b(water|agua)\b/.test(q)&&/\b(problem|repair|leak|call|phone|number|problema|reparacion|fuga|llamar|telefono|numero)\b/.test(q),
    sources:['water'],
    answer:{
      en:'For Franklin water service or repair problems, call Water Management at 615-794-4554. The City lists service hours of 7:00 AM to 4:00 PM except holidays. For starting or stopping water service or billing, call Utility Billing at 615-794-4572.',
      es:'Para problemas de servicio o reparación de agua en Franklin, llame a Water Management al 615-794-4554. La Ciudad indica horario de 7:00 a. m. a 4:00 p. m., excepto días festivos. Para iniciar o detener el servicio o para facturación, llame a Utility Billing al 615-794-4572.'
    }
  },
  {
    id:'sanitation-hours',
    match:q=>/\b(trash|garbage|recycling|sanitation|basura|reciclaje|saneamiento)\b/.test(q)&&/\b(hours?|open|phone|call|horario|abre|telefono|llamar)\b/.test(q),
    sources:['sanitation'],
    answer:{
      en:'Franklin Sanitation and Environmental Services lists office hours Monday through Friday, 7:00 AM to 4:00 PM. The phone number is 615-794-1516.',
      es:'Sanitation and Environmental Services de Franklin indica horario de lunes a viernes, de 7:00 a. m. a 4:00 p. m. El teléfono es 615-794-1516.'
    }
  }
];

function languageOf(value){
  return String(value||'').toLowerCase().startsWith('es')?'es':'en';
}

function findFact(question){
  const q=norm(question);
  return FACTS.find(row=>row.match(q))||null;
}
function directoryRequest(question,language){
  const q=norm(question);
  const cue=/\b(find|show|looking for|search for|buscar|busco|encontrar|muestre)\b/.test(q);
  if(!cue)return null;
  const cleaned=q
    .replace(/\b(find|show|looking for|search for|buscar|busco|encontrar|muestre|me|local|locals|near me|in franklin|franklin|tennessee|tn|por favor|please)\b/g,' ')
    .replace(/\s+/g,' ')
    .trim();
  if(!cleaned||cleaned.length>80)return null;
  const lang=languageOf(language);
  const label=cleaned;
  return {
    answer:lang==='es'
      ? 'Sí. Puede usar Buscar Local de Franklin Navigator para ver perfiles públicos que coincidan con “'+label+'”. Los resultados son informativos y no implican recomendación ni disponibilidad.'
      : 'Yes. You can use Franklin Navigator’s Find Local directory to browse public profiles matching “'+label+'”. Results are informational and do not imply endorsement or availability.',
    mode:'directory_handoff',
    sources:[],
    links:[{
      label:lang==='es'?'Buscar '+label:'Find '+label,
      url:(lang==='es'?'/es/directorio/?q=':'/directory/?q=')+encodeURIComponent(label)
    }],
    needsDetail:false
  };
}

function scoreSource(source,question){
  const q=norm(question);
  let score=0;
  for(const tag of source.tags){
    const t=norm(tag);
    if(t&&q.includes(t))score+=t.includes(' ')?5:3;
  }
  return score;
}

function chooseSources(question,max=3){
  return SOURCES.map(source=>({source,score:scoreSource(source,question)}))
    .filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,max)
    .map(x=>x.source);
}

function stripHtml(html){
  return clean(String(html||'')
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'"));
}

async function fetchOfficial(source){
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),5500);
  try{
    const response=await fetch(source.url,{
      signal:ctl.signal,
      redirect:'follow',
      headers:{
        'User-Agent':'FranklinNavigator-Assistant2/0.1 (+https://franklinnavigator.com)',
        'Accept':'text/html,application/xhtml+xml'
      }
    });
    if(!response.ok)throw new Error('HTTP_'+response.status);
    const type=String(response.headers.get('content-type')||'');
    if(!/text\/html|application\/xhtml\+xml/i.test(type))throw new Error('UNSUPPORTED_CONTENT');
    const html=(await response.text()).slice(0,700000);
    const text=stripHtml(html);
    return text.length>=120?text.slice(0,12000):source.snapshot;
  }catch{
    return source.snapshot;
  }finally{
    clearTimeout(timer);
  }
}

function franklinNowLabel(){
  try{
    return new Intl.DateTimeFormat('en-US',{
      timeZone:'America/Chicago',
      weekday:'long',
      year:'numeric',
      month:'long',
      day:'numeric',
      hour:'numeric',
      minute:'2-digit',
      timeZoneName:'short'
    }).format(new Date());
  }catch{return new Date().toISOString()}
}

function needsFreshSearch(question){
  return /\b(today|tonight|tomorrow|this weekend|weekend|this week|happening|events?|meetings?|agenda|current|latest|right now|open now|schedule today|schedule tomorrow|hoy|esta noche|mañana|este fin de semana|fin de semana|esta semana|eventos?|reuniones?|agenda|actual|ahora mismo)\b/i.test(String(question||''));
}

function webSources(data){
  const out=[],seen=new Set();
  for(const item of Array.isArray(data?.output)?data.output:[]){
    if(item?.type!=='web_search_call')continue;
    const rows=Array.isArray(item?.action?.sources)?item.action.sources:[];
    for(const row of rows){
      const url=clean(row?.url||row?.link||'');
      if(!/^https:\/\//i.test(url)||seen.has(url))continue;
      seen.add(url);
      let title=clean(row?.title||'');
      if(!title){try{title=new URL(url).hostname}catch{title='Source'}}
      out.push({title,url,official:true});
      if(out.length>=6)return out;
    }
  }
  return out;
}

async function callFreshWebSearch({question,language,history}){
  if(!OPENAI_API_KEY)return null;
  const lang=languageOf(language);
  const localNow=franklinNowLabel();
  const system=lang==='es'
    ? 'Usted es Franklin Assistant para Franklin, Tennessee. Esta consulta depende de información actual. Debe usar búsqueda web y responder con los resultados concretos que correspondan al período solicitado. No se limite a decirle al usuario que consulte un calendario. Incluya nombres, fechas, horas y lugares cuando estén disponibles. Si no encuentra elementos verificables para el período, dígalo claramente. Priorice fuentes oficiales y locales permitidas. No invente eventos ni horarios.'
    : 'You are Franklin Assistant for Franklin, Tennessee. This question depends on current information. You must use web search and answer with the actual matching items for the requested time window. Do not merely tell the user to check a calendar. Include names, dates, times, and locations when available. If you find no verifiable matching items, say that clearly. Prioritize the allowed official and trusted local sources. Do not invent events or schedules.';
  const prompt=[
    'FRANKLIN LOCAL DATE/TIME: '+localNow,
    history?'CURRENT CONVERSATION:\n'+history:'',
    'USER QUESTION:\n'+question,
    'Return a concise direct answer. Mention the requested date window explicitly.'
  ].filter(Boolean).join('\n\n');

  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),22000);
  try{
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      signal:ctl.signal,
      headers:{
        'Authorization':'Bearer '+OPENAI_API_KEY,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        model:OPENAI_MODEL,
        tools:[{
          type:'web_search',
          filters:{
            allowed_domains:[
              'franklintn.gov',
              'visitfranklin.com',
              'wcparksandrec.com',
              'wcpltn.org',
              'franklintheatre.com',
              'wcs.edu',
              'fssd.org',
              'williamsoncounty-tn.gov',
              'franklinnavigator.com'
            ]
          },
          user_location:{
            type:'approximate',
            country:'US',
            city:'Franklin',
            region:'Tennessee'
          }
        }],
        tool_choice:'required',
        include:['web_search_call.action.sources'],
        input:[
          {role:'system',content:[{type:'input_text',text:system}]},
          {role:'user',content:[{type:'input_text',text:prompt}]}
        ],
        max_output_tokens:650
      })
    });
    if(!response.ok)throw new Error('OPENAI_WEB_'+response.status);
    const data=await response.json();
    const answer=clean(extractOutput(data)).slice(0,2400);
    if(!answer)return null;
    return {answer,sources:webSources(data)};
  }finally{
    clearTimeout(timer);
  }
}

function historyText(rows){
  if(!Array.isArray(rows))return'';
  return rows.slice(-6).map(row=>{
    const role=row?.role==='assistant'?'Assistant':'User';
    const content=clean(row?.content||'').slice(0,700);
    return content?role+': '+content:'';
  }).filter(Boolean).join('\n');
}

function extractOutput(data){
  if(typeof data?.output_text==='string'&&data.output_text.trim())return data.output_text.trim();
  const parts=[];
  for(const item of data?.output||[]){
    for(const part of item?.content||[]){
      if(part?.type==='output_text'&&part?.text)parts.push(part.text);
    }
  }
  return parts.join('\n').trim();
}

async function callModel({question,language,history,sources}){
  if(!OPENAI_API_KEY)return'';
  const es=language==='es';
  const sourceBlock=sources.length?sources.map((x,i)=>[
    'SOURCE '+(i+1)+': '+x.title,
    'URL: '+x.url,
    'CONTENT: '+x.content
  ].join('\n')).join('\n\n'):'No Franklin-specific source was selected for this question.';

  const system=es
    ? 'Usted es Franklin Assistant 2 para Franklin, Tennessee. Responda la pregunta concreta del usuario primero. Si es una pregunta de sí/no, empiece con Sí, No o Depende, según corresponda. No sustituya una respuesta por un cuestionario genérico. Use solo los hechos locales de las fuentes proporcionadas; no invente hechos, horarios, requisitos, precios, eventos ni proveedores de Franklin. Si falta un dato realmente necesario, pida solo ese dato específico y explique brevemente por qué. Puede dar orientación general no local si la identifica claramente como general. Sea breve, útil y natural.'
    : 'You are Franklin Assistant 2 for Franklin, Tennessee. Answer the user’s actual question first. For a yes/no question, begin with Yes, No, or It depends, whichever is accurate. Never replace an answer with a generic questionnaire or workflow. Use only the provided sources for Franklin-specific facts; do not invent Franklin facts, hours, requirements, prices, events, or providers. If one genuinely necessary detail is missing, ask only for that specific detail and briefly explain why. You may give clearly labeled general guidance when no local fact is available. Be concise, useful, and conversational.';

  const input=[
    {role:'system',content:[{type:'input_text',text:system}]},
    {role:'user',content:[{type:'input_text',text:[
      history?'CURRENT CONVERSATION:\n'+history:'',
      'QUESTION:\n'+question,
      'FRANKLIN SOURCES:\n'+sourceBlock
    ].filter(Boolean).join('\n\n')}]}
  ];

  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),18000);
  try{
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      signal:ctl.signal,
      headers:{
        'Authorization':'Bearer '+OPENAI_API_KEY,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        model:OPENAI_MODEL,
        input,
        max_output_tokens:500
      })
    });
    if(!response.ok)throw new Error('OPENAI_'+response.status);
    const data=await response.json();
    return clean(extractOutput(data)).slice(0,1800);
  }finally{
    clearTimeout(timer);
  }
}

async function answerQuestion({question,language,history}){
  const lang=languageOf(language);
  const q=clean(question).slice(0,600);
  const fact=findFact(q);
  if(fact){
    return {
      answer:fact.answer[lang],
      mode:'verified_fact',
      sources:sourceRows(fact.sources),
      links:[],
      needsDetail:fact.id==='school-zone'
    };
  }

  const directory=directoryRequest(q,lang);
  if(directory)return directory;

  if(needsFreshSearch(q)){
    try{
      const fresh=await callFreshWebSearch({
        question:q,
        language:lang,
        history:historyText(history)
      });
      if(fresh?.answer){
        return {
          answer:fresh.answer,
          mode:'fresh_web_ai',
          sources:fresh.sources,
          links:[],
          needsDetail:false
        };
      }
    }catch(error){
      console.error(JSON.stringify({
        event:'assistant_fresh_search_failed',
        release:RELEASE,
        error:clean(error?.message||error).slice(0,120),
        at:now()
      }));
    }
  }

  const selected=chooseSources(q,3);
  const enriched=[];
  for(const source of selected){
    enriched.push({
      ...source,
      content:await fetchOfficial(source)
    });
  }

  let answer='';
  try{
    answer=await callModel({
      question:q,
      language:lang,
      history:historyText(history),
      sources:enriched
    });
  }catch{}

  if(answer){
    return {
      answer,
      mode:selected.length?'official_research_ai':'general_ai',
      sources:selected.map(x=>({id:x.id,title:x.title,url:x.url,official:true})),
      links:[],
      needsDetail:false
    };
  }

  if(selected.length){
    const first=selected[0];
    return {
      answer:lang==='es'
        ? first.snapshot+' Consulte la fuente oficial enlazada para confirmar los detalles actuales.'
        : first.snapshot+' Check the linked official source to confirm current details.',
      mode:'official_snapshot',
      sources:[{id:first.id,title:first.title,url:first.url,official:true}],
      links:[],
      needsDetail:false
    };
  }

  return {
    answer:lang==='es'
      ? 'Todavía no tengo una fuente local verificada suficiente para responder eso con confianza. Puedo darle orientación general o puede reformular la pregunta con el servicio, lugar u organización de Franklin que tiene en mente.'
      : 'I do not yet have enough verified local information to answer that confidently. I can still give general guidance, or you can name the Franklin service, place, or organization you mean.',
    mode:'insufficient_local_evidence',
    sources:[],
    links:[],
    needsDetail:true
  };
}

async function selfTest(){
  const tests=[
    {
      id:'deck-en',
      run:async()=>{
        const r=await answerQuestion({question:'do i need a permit to repair my deck',language:'en',history:[]});
        return r.mode==='verified_fact'&&/^Yes\./.test(r.answer)&&/deck/i.test(r.answer)&&/615-794-7012/.test(r.answer);
      }
    },
    {
      id:'deck-es',
      run:async()=>{
        const r=await answerQuestion({question:'¿necesito un permiso para reparar mi terraza?',language:'es',history:[]});
        return r.mode==='verified_fact'&&/^Sí\./.test(r.answer)&&/terraza/i.test(r.answer)&&/615-794-7012/.test(r.answer);
      }
    },
    {
      id:'city-hours',
      run:async()=>{
        const r=await answerQuestion({question:'What time is City Hall open?',language:'en',history:[]});
        return r.mode==='verified_fact'&&/does not publish one universal hours schedule/i.test(r.answer);
      }
    },
    {
      id:'school-specific-detail',
      run:async()=>{
        const r=await answerQuestion({question:'Which school is this address zoned for?',language:'en',history:[]});
        return r.mode==='verified_fact'&&r.needsDetail===true&&/exact street address/i.test(r.answer);
      }
    },
    {
      id:'water-phone',
      run:async()=>{
        const r=await answerQuestion({question:'Who do I call about a water service problem?',language:'en',history:[]});
        return r.mode==='verified_fact'&&/615-794-4554/.test(r.answer);
      }
    },
    {
      id:'directory-roofers',
      run:async()=>{
        const r=await answerQuestion({question:'Find me roofers in Franklin',language:'en',history:[]});
        return r.mode==='directory_handoff'&&Array.isArray(r.links)&&r.links[0]?.url.includes('/directory/?q=roofers');
      }
    },
    {
      id:'fresh-weekend-search',
      run:async()=>{
        const r=await answerQuestion({question:'What is happening in Franklin this weekend?',language:'en',history:[]});
        return r.mode==='fresh_web_ai'&&String(r.answer||'').length>=40&&!/official calendar has the current listings/i.test(String(r.answer||''))&&Array.isArray(r.sources);
      }
    },
    {
      id:'fresh-topic',
      run:async()=>{
        const r=await answerQuestion({
          question:'What time is City Hall open?',
          language:'en',
          history:[
            {role:'user',content:'My roof is leaking.'},
            {role:'assistant',content:'A roofer can inspect it.'}
          ]
        });
        return r.mode==='verified_fact'&&!/roof|roofer/i.test(r.answer);
      }
    }
  ];
  let passed=0;
  for(const test of tests){
    let ok=false;
    try{ok=Boolean(await test.run())}catch{}
    if(ok)passed++;
    console[ok?'log':'error'](JSON.stringify({
      event:ok?'assistant2_self_test_passed':'assistant2_self_test_failed',
      release:RELEASE,
      testId:test.id,
      at:now()
    }));
  }
  startup.testsPassed=passed;
  startup.testsTotal=tests.length;
  startup.qualified=passed===tests.length;
  if(startup.qualified){
    startup.lastQualifiedAt=now();
    console.log(JSON.stringify({event:'assistant2_startup_qualified',release:RELEASE,passed,total:tests.length,at:startup.lastQualifiedAt}));
  }else{
    console.error(JSON.stringify({event:'assistant2_startup_not_qualified',release:RELEASE,passed,total:tests.length,at:now()}));
  }
}

const server=http.createServer(async(req,res)=>{
  try{
    if(req.method==='OPTIONS'){allow(req,res);res.statusCode=204;return res.end()}
    const url=new URL(req.url,'http://localhost');

    if(req.method==='GET'&&url.pathname==='/health'){
      return reply(req,res,200,{
        ok:true,
        release:RELEASE,
        architecture:'CLEAN_ROOM_V2',
        startupQualified:startup.qualified,
        selfTests:{passed:startup.testsPassed,total:startup.testsTotal},
        lastQualifiedAt:startup.lastQualifiedAt,
        modelConfigured:Boolean(OPENAI_API_KEY),
        model:OPENAI_API_KEY?OPENAI_MODEL:null,
        at:now()
      });
    }

    if(req.method!=='POST'||url.pathname!=='/api/v2/answer'){
      return reply(req,res,404,{ok:false,error:'NOT_FOUND'});
    }

    const origin=String(req.headers.origin||'');
    if(origin&&!ORIGINS.has(origin))return reply(req,res,403,{ok:false,error:'ORIGIN_NOT_ALLOWED'});

    const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim();
    if(!limited(ip))return reply(req,res,429,{ok:false,error:'RATE_LIMITED'});

    const body=await readJson(req);
    const question=clean(body.question||body.q).slice(0,600);
    if(!question)return reply(req,res,400,{ok:false,error:'QUESTION_REQUIRED'});

    const result=await answerQuestion({
      question,
      language:body.language,
      history:Array.isArray(body.history)?body.history:[]
    });

    console.log(JSON.stringify({
      event:'assistant2_answer_complete',
      release:RELEASE,
      mode:result.mode,
      sourceCount:result.sources.length,
      at:now()
    }));

    return reply(req,res,200,{
      ok:true,
      release:RELEASE,
      answer:result.answer,
      mode:result.mode,
      sources:result.sources,
      links:Array.isArray(result.links)?result.links:[],
      needsDetail:Boolean(result.needsDetail)
    });
  }catch(error){
    const status=Number(error?.status||500);
    console.error(JSON.stringify({
      event:'assistant2_runtime_error',
      release:RELEASE,
      error:clean(error?.message||error).slice(0,120),
      at:now()
    }));
    return reply(req,res,status,{ok:false,error:status===500?'ANSWER_UNAVAILABLE':clean(error?.message||'REQUEST_FAILED')});
  }
});

server.requestTimeout=25000;
server.headersTimeout=10000;

server.listen(PORT,'0.0.0.0',()=>{
  console.log(JSON.stringify({
    event:'assistant2_runtime_listening',
    release:RELEASE,
    port:PORT,
    architecture:'CLEAN_ROOM_V2',
    at:now()
  }));
  selfTest().catch(()=>{});
});
