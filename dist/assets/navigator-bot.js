(() => {
  'use strict';
  const root=document.querySelector('[data-navigator-bot]'); if(!root)return;
  const form=root.querySelector('form'),input=root.querySelector('[data-navigator-input]'),output=root.querySelector('[data-navigator-output]');
  const examples=root.querySelectorAll('[data-navigator-example]');
  const voiceButton=root.querySelector('[data-navigator-voice]'),voiceStatus=root.querySelector('[data-navigator-voice-status]');
  const VERSION='FR-NAV1.29.1-HF3.10.1';
  const MANIFEST='/data/discovery/manifest.json';
  const MANIFEST_SHA='d97640231d541f5a4f67ac26782806fc933237a39566e6e59561ea82e894e225';
  let rowsPromise;
  root.dataset.canonicalAssistantEntry='1';
  root.dataset.franklinAssistantVersion=VERSION;

  const es=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('es');
  const tx=(en,sp)=>es()?sp:en;
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s'&.-]/g,' ').replace(/\s+/g,' ').trim();
  const sha=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
  async function verified(url,expected,max){
    if(!crypto?.subtle)throw Error('Secure source checking unavailable');
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),20000);
    try{
      const r=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-cache',signal:ctl.signal});
      if(!r.ok||!/application\/json/i.test(r.headers.get('content-type')||''))throw Error('Local source unavailable');
      const declared=Number(r.headers.get('content-length')||0);if(declared>max)throw Error('Local source too large');
      const b=await r.arrayBuffer();if(b.byteLength>max||await sha(b)!==expected)throw Error('Local source changed');
      return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));
    }finally{clearTimeout(timer)}
  }
  function decode(raw){
    if(!raw||raw.schemaVersion!=='franklin.discovery-index.v1'||raw.community!=='FRANKLIN_TN'||!Array.isArray(raw.rows)||raw.rows.length!==raw.recordCount)throw Error('Wrong directory source');
    const d=(k,i)=>Array.isArray(raw[k])&&Number.isInteger(i)&&i>=0&&i<raw[k].length?String(raw[k][i]||''):'';
    return raw.rows.map(a=>({id:String(a[0]||''),name:String(a[1]||''),location:String(a[2]||''),category:d('categories',a[3]),type:d('types',a[4]),area:d('areas',a[5]),phone:String(a[7]||''),email:String(a[8]||''),exact:a[10]===true})).filter(x=>x.id&&x.name);
  }
  async function rows(){
    if(!rowsPromise)rowsPromise=(async()=>{
      const m=await verified(MANIFEST,MANIFEST_SHA,64000);
      if(m.community!=='FRANKLIN_TN'||m.schemaVersion!=='franklin.discovery-manifest.v1'||!m.index||!/^\/data\/discovery\/[a-zA-Z0-9._/-]+\.json$/.test(m.index.file)||!/^[a-f0-9]{64}$/.test(m.index.sha256))throw Error('Wrong manifest');
      const out=decode(await verified(m.index.file,m.index.sha256,12000000));if(out.length!==m.recordCount)throw Error('Directory count mismatch');return out;
    })().catch(e=>{rowsPromise=undefined;throw e});
    return rowsPromise;
  }
  const groups=[
    ['dentist','dentists','dentistry','dental','dentista'],['attorney','attorneys','lawyer','lawyers','legal','abogado'],
    ['plumber','plumbers','plumbing','plomero'],['restaurant','restaurants','restaurante'],['veterinarian','veterinary','vet'],
    ['pharmacy','pharmacies'],['electrician','electricians'],['pediatrician','pediatrics'],['library','libraries'],
    ['childcare','daycare','preschool'],['mechanic','mechanics','auto repair'],['accountant','accountants','accounting','bookkeeper'],
    ['realtor','real estate','real estate agent'],['insurance agent','insurance'],['tutor','tutoring'],['hvac','air conditioning','heating'],
    ['roofer','roofing'],['landscaper','landscaping','lawn'],['salon','haircut','barber'],['cleaner','cleaning','house cleaning'],['towing','tow truck']
  ];
  const stop=new Set('i me my we our a an the please need needs want looking look find help with for in near nearby around franklin tn tennessee local good best some information info about tell give show where what who how can could would do does is are phone number address website contact hours open available'.split(' '));
  const svcMap=[['dentist','dentist'],['dental','dentist'],['plumber','plumber'],['plumbing','plumber'],['electrician','electrician'],['hvac','hvac'],['air conditioning','hvac'],['roofer','roofing'],['roofing','roofing'],['landscaper','landscaping'],['lawn','landscaping'],['salon','salon'],['haircut','salon'],['barber','salon'],['restaurant','restaurant'],['accountant','accounting'],['bookkeeper','accounting'],['tax preparer','tax'],['realtor','real estate'],['real estate agent','real estate'],['insurance agent','insurance'],['tutor','tutoring'],['daycare','child care'],['doctor','doctor'],['pediatrician','pediatrician'],['vet','veterinary'],['veterinarian','veterinary'],['mechanic','auto repair'],['tow truck','towing'],['cleaner','cleaning'],['house cleaning','cleaning'],['attorney','attorney'],['lawyer','attorney']];
  const service=q=>{const t=norm(q),hit=svcMap.find(([k])=>t.includes(k));return hit?hit[1]:''};
  const lookup=q=>{
    const s=service(q);if(s)return s;
    return norm(q).split(' ').filter(w=>w&&!stop.has(w)).slice(0,6).join(' ');
  };
  const terms=q=>{
    const t=norm(q),group=groups.find(g=>g.some(x=>t.includes(x)));if(group)return[group];
    return [...new Set(t.split(' ').filter(w=>w&&!stop.has(w)))].slice(0,6).map(w=>groups.find(g=>g.includes(w))||[w]);
  };
  const phone=v=>{const s=String(v||''),digits=s.replace(/\D/g,'');return /^[+\d().\s-]{7,30}$/.test(s)&&digits.length>=7?'tel:'+s.replace(/[^+\d]/g,''):''};
  const email=v=>{const s=String(v||'');return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(s)?'mailto:'+s:''};
  const rank=x=>{const g=norm([x.area,x.location].join(' ')),geo=g.includes('franklin')?0:g.includes('williamson')?1:2,contacts=Number(!!phone(x.phone))+Number(!!email(x.email))+Number(x.exact);return geo*100+(3-contacts)*5};
  async function find(q){
    const ts=terms(q);if(!ts.length)return[];
    return (await rows()).filter(x=>{const text=norm([x.name,x.category,x.type,x.area,x.location].join(' '));return ts.every(g=>g.some(t=>text.includes(norm(t))))}).sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name)).slice(0,5);
  }

  const RULES=[
    ['emergency',/\b(911|immediate danger|not breathing|cannot breathe|can't breathe|chest pain|overdose|gas leak|emergency)\b/i,
      ['Get urgent help now','Obtén ayuda urgente ahora'],['If someone may be in immediate danger, call 911 now. Franklin Navigator does not dispatch responders.','Si alguien puede estar en peligro inmediato, llama al 911 ahora. Franklin Navigator no envía servicios de emergencia.'],[['Call 911','Llamar al 911','tel:911'],['Emergency starting points','Puntos de partida de emergencia','/community-help-center/#urgent-help']]],
    ['member-billing',/\b(cancel (my )?(membership|subscription)|manage (my )?billing|payment method|membership billing|already a member|my subscription)\b/i,
      ['Manage membership or billing','Administrar membresía o facturación'],['Sign in to your existing account first. From membership status you can manage the payment method or cancel renewal. If a payment is still processing, do not pay again.','Primero inicie sesión en su cuenta existente. Desde el estado de membresía puede administrar el método de pago o cancelar la renovación. Si un pago sigue procesándose, no vuelva a pagar.'],[['Open membership status','Abrir estado de membresía','/membership-status/'],['Member support','Ayuda para miembros','/member-support/']]],
    ['member-profile',/\b(claim my|manage my|edit my|update my|correct my).*(profile|business|listing)|\b(profile correction|claim profile)\b/i,
      ['Manage or correct your profile','Administrar o corregir su perfil'],['Find the correct public profile first. Factual corrections and removal requests are free. Member-only additions require sign-in and representation review.','Primero busque el perfil público correcto. Las correcciones y solicitudes de eliminación son gratuitas. Las funciones de miembro requieren inicio de sesión y revisión.'],[['Find or manage my profile','Buscar o administrar mi perfil','/claim-profile/'],['Free correction or removal','Corrección o eliminación gratuita','/profile-correction/']]],
    ['membership',/\b(community membership|become a member|join franklin navigator|membership price|how much.*membership)\b/i,
      ['Franklin Community Membership','Membresía Comunitaria de Franklin'],['Community Membership is the optional $35/year Franklin Navigator membership. Start by finding your profile and creating or signing in to your account.','La Membresía Comunitaria es la membresía opcional de Franklin Navigator de $35 al año. Empiece buscando su perfil e iniciando sesión o creando una cuenta.'],[['See membership and start','Ver membresía y comenzar','/membership-start/'],['Find my profile','Buscar mi perfil','/claim-profile/']]],
    ['move',/\b(just moved|moving to franklin|new to franklin|new resident|move-in|moved here)\b/i,
      ['New to Franklin','Nuevo en Franklin'],['Start with the move-in checklist so utilities, school routing, local government and other setup tasks happen in a sensible order.','Empiece con la lista de mudanza para organizar servicios públicos, escuelas, gobierno local y otras tareas.'],[['Start moving checklist','Abrir lista de mudanza','/new-to-franklin/'],['Moving tasks','Tareas de mudanza','/get-it-done/#move']]],
    ['school',/\b(school|enroll|enrollment|kindergarten|school zone|zoned school|bus route)\b/i,
      ['School and enrollment help','Ayuda con escuelas e inscripción'],['Franklin addresses can involve different school systems. Use the enrollment guide, then confirm the address with the responsible district or zone source.','Las direcciones de Franklin pueden corresponder a distintos sistemas escolares. Use la guía de inscripción y confirme la dirección con la fuente oficial.'],[['School enrollment guide','Guía de inscripción escolar','/school-enrollment/'],['Family starting points','Puntos de partida para familias','/my-franklin/']]],
    ['senior-transport',/\b(senior|elderly|older adult|parent|caregiver).*(ride|transport|drive|mobility)|\b(paratransit|senior transportation)\b/i,
      ['Senior transportation and caregiving','Transporte para mayores y cuidadores'],['Start with Franklin-area transportation and caregiver resources. Confirm eligibility, service area, accessibility and scheduling directly.','Empiece con recursos de transporte y cuidado del área de Franklin. Confirme elegibilidad, área de servicio, accesibilidad y horarios.'],[['Transportation & mobility','Transporte y movilidad','/local-pathways/transportation-mobility/'],['Senior & caregiver guide','Guía para mayores y cuidadores','/senior-caregiver/']]],
    ['permit',/\b(permit|remodel|addition|deck|fence|zoning|building project|home project)\b/i,
      ['Permit or home project','Permiso o proyecto de vivienda'],['Define the project and property first, then use the permit guide to identify the correct City source. Do not rely on a contractor or search result alone for whether a permit is required.','Defina primero el proyecto y la propiedad, y luego use la guía para identificar la fuente correcta de la Ciudad.'],[['Plan my permit or project','Planificar mi permiso o proyecto','/permits-home/'],['Permit tasks','Tareas de permisos','/get-it-done/#permit']]],
    ['start-business',/\b(start|open|launch|set up|starting).*(business|company)|\b(business license|new business|startup)\b/i,
      ['Start or license a Franklin business','Iniciar o licenciar un negocio en Franklin'],['Work in this order: location/zoning, required licenses or registrations, permits if applicable, then your public profile and local growth plan.','Siga este orden: ubicación y zonificación, licencias o registros, permisos si corresponden, luego su perfil y plan de crecimiento.'],[['Start & Run a Business','Iniciar y operar un negocio','/local-pathways/start-run-business/'],['Business license tasks','Tareas de licencia comercial','/get-it-done/#business-license']]],
    ['grow-business',/\b(more customers|grow my business|business growth|marketing|local seo|visibility|promote my business)\b/i,
      ['Grow a Franklin business','Hacer crecer un negocio en Franklin'],['First check how your business appears publicly, then choose one measurable local goal. Use the growth planner and business dashboard for the next actions.','Primero revise cómo aparece públicamente su negocio y luego elija una meta local medible. Use el planificador y el panel de negocio.'],[['Business Growth Planner','Planificador de crecimiento','/local-growth-engine/'],['Business dashboard','Panel de negocio','/business-dashboard/']]],
    ['trash',/\b(trash|garbage|recycling|bulk waste|brush pickup|yard waste|sanitation)\b/i,
      ['Trash, recycling and sanitation','Basura, reciclaje y servicios sanitarios'],['For addresses inside Franklin city limits, use the City sanitation route for collection, recycling, brush and bulk-waste information. Confirm schedule changes at the City source.','Para direcciones dentro de Franklin, use la ruta de saneamiento de la Ciudad y confirme cambios en la fuente oficial.'],[['Franklin sanitation help','Ayuda de saneamiento','/everyday-help/?q=trash'],['City sanitation source','Fuente oficial','https://www.franklintn.gov/government/departments-k-z/sanitation-and-environmental-services']]],
    ['events',/\b(what.*(today|tonight|weekend)|event|events|festival|things to do|what is happening)\b/i,
      ['What is happening around Franklin?','¿Qué está pasando en Franklin?'],['Use Today in Franklin for current dated items, then confirm times, tickets and availability at the original source before you go.','Use Hoy en Franklin para elementos con fecha actual y confirme horarios y disponibilidad en la fuente original.'],[['Today in Franklin','Hoy en Franklin','/today/'],['Browse activities','Explorar actividades','/activities/']]],
    ['legal',/\b(lawyer|attorney|legal help|court|lawsuit|divorce|custody|warrant|ticket)\b/i,
      ['Legal or court starting help','Ayuda inicial legal o de tribunal'],['Organize the issue, check official court information and compare local legal-service profiles. Franklin Navigator does not provide legal advice or calculate deadlines.','Organice el asunto, consulte información oficial y compare perfiles legales. Franklin Navigator no brinda asesoría legal ni calcula plazos.'],[['Legal help & next steps','Ayuda legal y próximos pasos','/legal-help/'],['Find legal profiles','Buscar perfiles legales','/directory/?q=attorney']]],
    ['health',/\b(doctor|medical|health care|healthcare|clinic|medication|hospital)\b/i,
      ['Health and care','Salud y atención'],['Use the health route to prepare questions and choose the right level of care. For a specific provider, Franklin Assistant can also show matching local profiles.','Use la ruta de salud para preparar preguntas y elegir el nivel adecuado de atención. El Asistente también puede mostrar perfiles locales.'],[['Health and care help','Ayuda de salud y atención','/health-help/'],['Find health profiles','Buscar perfiles de salud','/directory/?q=health']]],
    ['housing',/\b(rent|renter|landlord|eviction|housing|affordable housing)\b/i,
      ['Housing help','Ayuda de vivienda'],['Start with housing and affordability resources. If there is a notice, deadline or dispute, use the preparation tools and confirm rights with an appropriate official or legal source.','Empiece con recursos de vivienda. Si hay un aviso, plazo o disputa, use las herramientas de preparación y confirme sus derechos con una fuente apropiada.'],[['Housing and home help','Ayuda de vivienda','/housing/'],['Home rights & notices','Derechos y avisos','/home-rights-center/']]],
    ['civic',/\b(city council|boma|alderman|ward|vote|voting|public hearing|city meeting|development near me)\b/i,
      ['Civic and neighborhood information','Información cívica y del vecindario'],['Use the civic pathway for wards, meetings, development activity and participation. Confirm agendas, dates and public-comment rules at the official City source.','Use la ruta cívica para distritos, reuniones, desarrollo y participación. Confirme agendas y fechas en la fuente oficial.'],[['Civic & Neighborhood pathway','Ruta cívica y de vecindario','/local-pathways/civic-neighborhood/'],['Today: civic items','Hoy: asuntos cívicos','/today/#civic']]]
  ];

  const localish=q=>!!service(q)||/\b(find|looking for|where is|where are|phone|number|address|website|contact|near me|nearby|local)\b/.test(norm(q));
  const link=(label,href,primary=false)=>{const a=document.createElement('a');a.className=`button${primary?' primary':''}`;a.href=href;a.textContent=label;if(/^https?:/i.test(href)){a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer'}return a};
  const actions=ls=>{const d=document.createElement('div');d.className='actions';ls.forEach(([en,sp,h],i)=>d.append(link(es()?sp:en,h,i===0)));return d};
  function ruleCard(r){
    const card=document.createElement('article');card.className='navigator-result franklin-assistant-answer';
    const h=document.createElement('h3');h.textContent=es()?r[2][1]:r[2][0];
    const p=document.createElement('p');p.textContent=es()?r[3][1]:r[3][0];
    card.append(h,p,actions(r[4]));output.append(card);
  }
  const cleanLoc=x=>String(x.location||x.area||'').replace(/^Public IRS filing address geocoded in Williamson County:\s*/i,'').replace(/^Public IRS filing address:\s*/i,'')||tx('Location not supplied','Ubicación no indicada');
  function profiles(found,q){
    const section=document.createElement('section');section.className='franklin-assistant-local-results';
    const h=document.createElement('h3');h.textContent=tx(found.length===1?'A Franklin-area match':'Franklin-area matches',found.length===1?'Una coincidencia del área de Franklin':'Coincidencias del área de Franklin');
    const p=document.createElement('p');p.textContent=tx(`I found ${found.length} public profile${found.length===1?'':'s'} matching “${q}”. These are factual matches, not endorsements; confirm services, price and availability directly.`,`Encontré ${found.length} perfil${found.length===1?'':'es'} público${found.length===1?'':'s'} para “${q}”. Son coincidencias informativas, no recomendaciones; confirme servicios, precio y disponibilidad.`);
    const grid=document.createElement('div');grid.className='franklin-assistant-profile-grid';
    found.slice(0,3).forEach(x=>{const c=document.createElement('article');c.className='franklin-assistant-profile-card';const hh=document.createElement('h4');hh.textContent=x.name;const m=document.createElement('p');m.className='franklin-assistant-profile-meta';m.textContent=[x.category||x.type,cleanLoc(x)].filter(Boolean).join(' · ');const a=document.createElement('div');a.className='actions';a.append(link(tx('Open profile','Abrir perfil'),`/profiles/${encodeURIComponent(x.id)}/`,true));const ph=phone(x.phone),em=email(x.email);if(ph)a.append(link(tx('Call','Llamar'),ph));if(em)a.append(link(tx('Email','Correo'),em));c.append(hh,m,a);grid.append(c)});
    section.append(h,p,grid,link(tx('See all matching profiles','Ver todos los perfiles coincidentes'),'/directory/?q='+encodeURIComponent(q)));output.append(section);
  }
  function fallback(raw){
    if(window.FranklinR38Assistant?.render){try{return window.FranklinR38Assistant.render(output,raw)}catch{}}
    output.replaceChildren();const h=document.createElement('h3');h.textContent=tx('I need one more detail.','Necesito un detalle más.');const p=document.createElement('p');p.textContent=tx('Tell me the thing you need, such as “find a dentist,” “I need a fence permit,” or “phone number for [business name].”','Dígame qué necesita, por ejemplo “buscar dentista”, “necesito permiso para una cerca” o “teléfono de [negocio]”.');output.append(h,p,actions([['Browse practical tasks','Explorar tareas','/get-it-done/'],['Search Find Local','Buscar Find Local','/directory/'],['Open Help Center','Abrir Centro de ayuda','/community-help-center/']]));
  }
  async function render(raw){
    output.hidden=false;output.replaceChildren();const text=norm(raw);if(!text){const p=document.createElement('p');p.textContent=tx('Tell me what you need in a few words. I can give you a Franklin next step or search local profiles.','Dígame lo que necesita. Puedo darle un próximo paso en Franklin o buscar perfiles locales.');output.append(p);return}
    const wait=document.createElement('p');wait.className='fine-print';wait.setAttribute('role','status');wait.textContent=tx('Checking Franklin Navigator…','Consultando Franklin Navigator…');output.append(wait);
    const r=RULES.find(x=>x[1].test(text)),q=lookup(raw);let found=[];
    if(localish(raw)&&q){try{found=await find(q)}catch{found=[]}}
    output.replaceChildren();
    if(found.length)profiles(found,q);
    if(r)ruleCard(r);
    if(!found.length&&!r&&localish(raw)&&q){const h=document.createElement('h3');h.textContent=tx('No strong local profile match yet.','Todavía no hay una coincidencia local clara.');const p=document.createElement('p');p.textContent=tx(`I searched Franklin Navigator’s public profiles for “${q}” but did not find a reliable match. Try a shorter name or service.`,`Busqué “${q}” en los perfiles públicos pero no encontré una coincidencia confiable. Pruebe un nombre o servicio más corto.`);output.append(h,p,actions([['Search Find Local','Buscar Find Local','/directory/?q='+encodeURIComponent(q)],['Browse practical tasks','Explorar tareas','/get-it-done/']]))}else if(!found.length&&!r)fallback(raw);
    output.focus();window.FranklinProductHealth?.record?.(found.length?'assistant_local_results':r?'assistant_routed_answer':'assistant_fallback');
  }

  if(!document.getElementById('franklin-assistant-mobile-hotfix')){const s=document.createElement('style');s.id='franklin-assistant-mobile-hotfix';s.textContent=`
    .franklin-assistant-profile-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.franklin-assistant-profile-card{border:1px solid #c9dcda;border-radius:12px;background:#fff;padding:14px;min-width:0}.franklin-assistant-profile-card h4{margin:0 0 7px;font-size:1rem}.franklin-assistant-profile-meta{margin:0 0 10px;color:#53666a;line-height:1.4}.franklin-assistant-profile-card .actions{gap:6px}.franklin-assistant-profile-card .button{padding:8px 10px;min-height:38px}
    @media(max-width:640px){body.hf39-home header .top{min-height:0;padding-block:7px;gap:8px 12px}body.hf39-home .brand img{width:30px;height:30px}body.hf39-home .brand-name{font-size:1.08rem}body.hf39-home .brand-subname{font-size:.68rem}body.hf39-home .r37-language-switch.hf36-language-in-header button{min-height:32px;padding:5px 7px}body.hf39-home .nav.hf34-nav{gap:12px;padding-bottom:2px;scrollbar-width:none}body.hf39-home .nav.hf34-nav::-webkit-scrollbar{display:none}body.hf39-home .nav.hf34-nav>a,body.hf39-home .nav.hf34-nav summary{white-space:nowrap;font-size:.9rem}body.hf39-home .r24-home-hero{padding-top:22px;padding-bottom:28px}body.hf39-home .r24-hero-grid{gap:18px}body.hf39-home .r24-hero-copy h1{font-size:clamp(2.2rem,10.5vw,2.8rem);line-height:1.02;letter-spacing:-.025em;margin-bottom:12px}body.hf39-home .r24-hero-lead{font-size:1rem;line-height:1.5;margin-bottom:14px}body.hf39-home .r24-trust-line{gap:7px 12px;font-size:.88rem}body.hf39-home .r24-hero-photos{margin-top:16px}body.hf39-home .navigator-bot{padding:16px;border-radius:16px}body.hf39-home .navigator-form textarea{min-height:108px}body.hf39-home .r24-ask-actions{display:grid;grid-template-columns:minmax(90px,.8fr) minmax(0,2fr);gap:8px}body.hf39-home .r24-ask-actions .button{width:100%;justify-content:center;padding-inline:10px}body.hf39-home .r24-chips{gap:7px;margin-top:10px}body.hf39-home .r24-chips button{font-size:.9rem;line-height:1.2;padding:8px 10px}.franklin-assistant-profile-grid{grid-template-columns:1fr}.franklin-assistant-profile-card{padding:12px}.franklin-assistant-profile-card .actions{display:flex;flex-wrap:wrap}.navigator-output .navigator-result,.navigator-output .franklin-assistant-local-results{overflow-wrap:anywhere}}@media(max-width:390px){body.hf39-home .r24-ask-actions{grid-template-columns:1fr}body.hf39-home .r24-hero-copy h1{font-size:2.18rem}}`;document.head.append(s)}

  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(voiceButton&&SR){voiceButton.hidden=false;let listening=false;const rec=new SR();rec.interimResults=false;rec.continuous=false;rec.maxAlternatives=1;const status=m=>{if(voiceStatus)voiceStatus.textContent=m};rec.addEventListener('start',()=>{listening=true;voiceButton.textContent=tx('Listening…','Escuchando…');voiceButton.setAttribute('aria-pressed','true');status(tx('Listening. Speak a short Franklin question or goal.','Escuchando. Diga una pregunta u objetivo breve.'))});rec.addEventListener('result',e=>{const t=String(e.results?.[0]?.[0]?.transcript||'').trim();if(t){input.value=t;render(t)}status(tx('Voice input captured.','Voz recibida.'))});rec.addEventListener('error',()=>status(tx('Voice input did not finish. You can keep typing.','La entrada de voz no terminó. Puede seguir escribiendo.')));rec.addEventListener('end',()=>{listening=false;voiceButton.textContent=tx('Speak','Hablar');voiceButton.setAttribute('aria-pressed','false')});voiceButton.addEventListener('click',()=>{if(listening){rec.stop();return}rec.lang=es()?'es-US':'en-US';try{rec.start()}catch{}})}
  form.addEventListener('submit',e=>{e.preventDefault();render(input.value)});
  examples.forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.navigatorExample||b.textContent;render(input.value)}));
  window.addEventListener('franklinlanguagechange',()=>{if(input.value.trim()&&!output.hidden)render(input.value)});
  window.FranklinAssistantRouter=Object.freeze({version:VERSION,render,lookup,service});
})();