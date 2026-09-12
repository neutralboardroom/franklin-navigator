(() => {
  'use strict';
  const root = document.querySelector('[data-navigator-bot]');
  if (!root) return;

  const form = root.querySelector('form');
  const input = root.querySelector('[data-navigator-input]');
  const output = root.querySelector('[data-navigator-output]');
  const examples = root.querySelectorAll('[data-navigator-example]');
  const voiceButton = root.querySelector('[data-navigator-voice]');
  const voiceStatus = root.querySelector('[data-navigator-voice-status]');
  const RELEASE = 'FR-NAV1.29.1-HF3.10.1';
  const MANIFEST_URL = '/data/discovery/manifest.json';
  const MANIFEST_SHA256 = 'd97640231d541f5a4f67ac26782806fc933237a39566e6e59561ea82e894e225';
  const MAX_INDEX_BYTES = 12000000;
  let directoryPromise;

  root.dataset.canonicalAssistantEntry = '1';
  root.dataset.franklinAssistantVersion = RELEASE;

  const isEs = () => String(document.documentElement.lang || '').toLowerCase().startsWith('es');
  const tr = (en, es) => isEs() ? es : en;
  const normalize = value => String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s'&.-]/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const safePhone = value => {
    const raw = String(value || '');
    const digits = raw.replace(/\D/g, '');
    return /^[+\d().\s-]{7,30}$/.test(raw) && digits.length >= 7 ? 'tel:' + raw.replace(/[^+\d]/g, '') : '';
  };
  const safeEmail = value => {
    const raw = String(value || '');
    return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(raw) ? 'mailto:' + raw : '';
  };
  const hashHex = async buffer => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))]
    .map(x => x.toString(16).padStart(2, '0')).join('');

  const fetchVerifiedJson = async (url, expectedHash, maxBytes) => {
    if (!window.crypto?.subtle) throw Error('Secure source checking unavailable');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, {
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-cache',
        signal: controller.signal
      });
      if (!response.ok || !/application\/json/i.test(response.headers.get('content-type') || '')) {
        throw Error('Local source unavailable');
      }
      const declared = Number(response.headers.get('content-length') || 0);
      if (declared > maxBytes) throw Error('Local source too large');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > maxBytes) throw Error('Local source too large');
      if (await hashHex(bytes) !== expectedHash) throw Error('Local source changed');
      return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
    } finally {
      clearTimeout(timer);
    }
  };

  const decodeDirectory = raw => {
    if (!raw || raw.schemaVersion !== 'franklin.discovery-index.v1' || raw.community !== 'FRANKLIN_TN' ||
        !Array.isArray(raw.rows) || raw.rows.length !== raw.recordCount) throw Error('Wrong Franklin directory source');
    const dict = (name, key) => {
      const values = raw[name];
      return Array.isArray(values) && Number.isInteger(key) && key >= 0 && key < values.length ? String(values[key] || '') : '';
    };
    return raw.rows.map(row => ({
      id: String(row[0] || ''),
      name: String(row[1] || ''),
      location: String(row[2] || ''),
      category: dict('categories', row[3]),
      type: dict('types', row[4]),
      area: dict('areas', row[5]),
      phone: String(row[7] || ''),
      email: String(row[8] || ''),
      exactAddress: row[10] === true
    })).filter(row => row.id && row.name);
  };

  const directoryRows = async () => {
    if (!directoryPromise) directoryPromise = (async () => {
      const manifest = await fetchVerifiedJson(MANIFEST_URL, MANIFEST_SHA256, 64000);
      if (manifest.community !== 'FRANKLIN_TN' || manifest.schemaVersion !== 'franklin.discovery-manifest.v1' ||
          !manifest.index || !/^\/data\/discovery\/[a-zA-Z0-9._/-]+\.json$/.test(manifest.index.file) ||
          !/^[a-f0-9]{64}$/.test(manifest.index.sha256)) throw Error('Wrong Franklin manifest');
      const raw = await fetchVerifiedJson(manifest.index.file, manifest.index.sha256, MAX_INDEX_BYTES);
      const rows = decodeDirectory(raw);
      if (rows.length !== manifest.recordCount) throw Error('Franklin directory count mismatch');
      return rows;
    })().catch(error => {
      directoryPromise = undefined;
      throw error;
    });
    return directoryPromise;
  };

  const synonymGroups = [
    ['dentist','dentists','dentistry','dental','dentista','dentistas'],
    ['attorney','attorneys','lawyer','lawyers','legal','abogado','abogados'],
    ['plumber','plumbers','plumbing','plomero','fontanero'],
    ['restaurant','restaurants','restaurante','restaurantes'],
    ['veterinarian','veterinary','vet','veterinario'],
    ['pharmacy','pharmacies','farmacia'],
    ['electrician','electricians','electricista'],
    ['pediatrician','pediatrics','pediatra'],
    ['library','libraries','biblioteca'],
    ['childcare','daycare','preschool','guarderia'],
    ['mechanic','mechanics','auto repair','mecanico'],
    ['accountant','accountants','accounting','bookkeeper','contador'],
    ['realtor','real estate','real estate agent'],
    ['insurance agent','insurance'],
    ['tutor','tutoring'],
    ['hvac','air conditioning','heating'],
    ['roofer','roofing'],
    ['landscaper','landscaping','lawn'],
    ['salon','haircut','barber'],
    ['cleaner','cleaning','house cleaning'],
    ['towing','tow truck']
  ];
  const aliases = new Map();
  synonymGroups.forEach(group => group.forEach(word => aliases.set(word, group)));
  const stopWords = new Set([
    'i','me','my','we','our','a','an','the','please','need','needs','want','looking','look','find','help','with',
    'for','in','near','nearby','around','franklin','tn','tennessee','local','good','best','some','information',
    'info','about','tell','give','show','where','what','who','how','can','could','would','do','does','is','are',
    'phone','number','address','website','contact','hours','open','available','necesito','buscar','busco','ayuda',
    'cerca','de','en','franklin','informacion','telefono','direccion','sitio','web'
  ]);
  const queryTerms = value => {
    const text = normalize(value);
    const direct = synonymGroups.find(group => group.some(term => text.includes(term)));
    if (direct) return [direct];
    const words = text.split(' ').filter(Boolean).filter(word => !stopWords.has(word));
    return [...new Set(words)].slice(0, 6).map(word => aliases.get(word) || [word]);
  };
  const rowText = row => normalize([row.name, row.category, row.type, row.area, row.location].join(' '));
  const localRank = row => {
    const text = normalize([row.area, row.location].join(' '));
    const geo = text.includes('franklin') ? 0 : text.includes('williamson') ? 1 : 2;
    const contacts = Number(!!safePhone(row.phone)) + Number(!!safeEmail(row.email)) + Number(row.exactAddress);
    return geo * 100 + (3 - contacts) * 5;
  };
  const findProfiles = async raw => {
    const terms = queryTerms(raw);
    if (!terms.length) return [];
    const rows = await directoryRows();
    return rows.filter(row => {
      const text = rowText(row);
      return terms.every(group => group.some(term => text.includes(normalize(term))));
    }).sort((a,b) => localRank(a) - localRank(b) || a.name.localeCompare(b.name)).slice(0, 5);
  };

  const RULES = [
    {
      id:'emergency',
      test:/\b(911|immediate danger|not breathing|cannot breathe|can't breathe|chest pain|overdose|gas leak|emergency)\b/i,
      title:['Get urgent help now','Obtén ayuda urgente ahora'],
      answer:['If someone may be in immediate danger, call 911 now. Franklin Navigator does not dispatch responders.','Si alguien puede estar en peligro inmediato, llama al 911 ahora. Franklin Navigator no envía servicios de emergencia.'],
      links:[['Call 911','Llamar al 911','tel:911'],['Emergency starting points','Puntos de partida de emergencia','/community-help-center/#urgent-help']]
    },
    {
      id:'crisis',
      test:/\b(988|suicide|suicidal|mental health crisis|panic crisis|crisis emocional|suicidio)\b/i,
      title:['Crisis support','Apoyo en crisis'],
      answer:['Call or text 988 for crisis support. Use 911 when there is immediate danger.','Llama o envía un mensaje al 988 para apoyo en crisis. Usa el 911 cuando haya peligro inmediato.'],
      links:[['Call or text 988','Llamar o escribir al 988','tel:988'],['Community Help Center','Centro de ayuda comunitaria','/community-help-center/']]
    },
    {
      id:'member-billing',
      test:/\b(cancel (my )?(membership|subscription)|manage (my )?billing|payment method|membership billing|already a member|my subscription)\b/i,
      title:['Manage membership or billing','Administrar membresía o facturación'],
      answer:['Sign in to your existing account first. From membership status you can open Stripe billing to manage the payment method or cancel renewal. If a payment is still processing, do not pay again.','Primero inicie sesión en su cuenta existente. Desde el estado de membresía puede abrir la facturación de Stripe para administrar el método de pago o cancelar la renovación. Si un pago aún se está procesando, no vuelva a pagar.'],
      links:[['Open membership status','Abrir estado de membresía','/membership-status/'],['Member support','Ayuda para miembros','/member-support/']]
    },
    {
      id:'member-profile',
      test:/\b(claim my|manage my|edit my|update my|correct my).*(profile|business|listing)|\b(profile correction|claim profile)\b/i,
      title:['Manage or correct your profile','Administrar o corregir su perfil'],
      answer:['Find the correct public profile first. Factual corrections and removal requests are free. If you need member-only profile additions, sign in and verify your connection to the profile.','Primero busque el perfil público correcto. Las correcciones de datos y solicitudes de eliminación son gratuitas. Para funciones de miembro, inicie sesión y verifique su relación con el perfil.'],
      links:[['Find or manage my profile','Buscar o administrar mi perfil','/claim-profile/'],['Free correction or removal','Corrección o eliminación gratuita','/profile-correction/']]
    },
    {
      id:'membership',
      test:/\b(community membership|become a member|join franklin navigator|membership price|how much.*membership)\b/i,
      title:['Franklin Community Membership','Membresía Comunitaria de Franklin'],
      answer:['Community Membership is the optional $35/year Franklin Navigator membership for eligible local businesses, professionals and organizations. Start by finding your profile and creating or signing in to your account.','La Membresía Comunitaria es la membresía opcional de Franklin Navigator de $35 al año para negocios, profesionales y organizaciones locales elegibles. Empiece buscando su perfil e iniciando sesión o creando una cuenta.'],
      links:[['See membership and start','Ver membresía y comenzar','/membership-start/'],['Find my profile','Buscar mi perfil','/claim-profile/']]
    },
    {
      id:'move',
      test:/\b(just moved|moving to franklin|new to franklin|new resident|move-in|moved here)\b/i,
      title:['New to Franklin','Nuevo en Franklin'],
      answer:['Start with the move-in checklist so utilities, school routing, local government and other setup tasks happen in a sensible order.','Empiece con la lista de mudanza para organizar servicios públicos, escuelas, gobierno local y otras tareas.'],
      links:[['Start the moving checklist','Abrir lista de mudanza','/new-to-franklin/'],['Moving tasks','Tareas de mudanza','/get-it-done/#move']]
    },
    {
      id:'school',
      test:/\b(school|enroll|enrollment|kindergarten|school zone|zoned school|bus route)\b/i,
      title:['School and enrollment help','Ayuda con escuelas e inscripción'],
      answer:['Franklin addresses can involve different school systems. Use the enrollment guide first, then confirm the address with the responsible district or zone source before relying on a school assignment.','Las direcciones de Franklin pueden corresponder a distintos sistemas escolares. Use primero la guía de inscripción y confirme la dirección con la fuente oficial del distrito o zona.'],
      links:[['School enrollment guide','Guía de inscripción escolar','/school-enrollment/'],['Family starting points','Puntos de partida para familias','/my-franklin/']]
    },
    {
      id:'senior-transport',
      test:/\b(senior|elderly|older adult|parent|caregiver).*(ride|transport|drive|mobility)|\b(paratransit|senior transportation)\b/i,
      title:['Senior transportation and caregiving','Transporte para mayores y cuidadores'],
      answer:['Start with Franklin-area transportation and caregiver resources. Compare eligibility, service area, accessibility and scheduling directly before depending on a ride.','Empiece con recursos de transporte y cuidado del área de Franklin. Confirme directamente elegibilidad, área de servicio, accesibilidad y horarios.'],
      links:[['Transportation & mobility','Transporte y movilidad','/local-pathways/transportation-mobility/'],['Senior & caregiver guide','Guía para mayores y cuidadores','/senior-caregiver/']]
    },
    {
      id:'permit',
      test:/\b(permit|remodel|addition|deck|fence|zoning|building project|home project)\b/i,
      title:['Permit or home project','Permiso o proyecto de vivienda'],
      answer:['Define the project and property first, then use the Franklin permit/home-project guide to identify the correct City planning or permit source. Do not rely on a contractor or search result alone for whether a permit is required.','Defina primero el proyecto y la propiedad, y luego use la guía de permisos para identificar la fuente correcta de la Ciudad.'],
      links:[['Plan my permit or project','Planificar mi permiso o proyecto','/permits-home/'],['Permit tasks','Tareas de permisos','/get-it-done/#permit']]
    },
    {
      id:'start-business',
      test:/\b(start|open|launch|set up|starting).*(business|company)|\b(business license|new business|startup)\b/i,
      title:['Start or license a Franklin business','Iniciar o licenciar un negocio en Franklin'],
      answer:['Work through business setup in this order: location/zoning, required licenses or registrations, permits if applicable, then your public profile and local growth plan.','Siga este orden: ubicación y zonificación, licencias o registros, permisos si corresponden, luego su perfil público y plan de crecimiento local.'],
      links:[['Start & Run a Business','Iniciar y operar un negocio','/local-pathways/start-run-business/'],['Business license tasks','Tareas de licencia comercial','/get-it-done/#business-license']]
    },
    {
      id:'grow-business',
      test:/\b(more customers|grow my business|business growth|marketing|local seo|visibility|promote my business)\b/i,
      title:['Grow a Franklin business','Hacer crecer un negocio en Franklin'],
      answer:['First check how your business appears publicly, then choose one measurable local goal. Franklin Navigator has a growth planner, profile tools and practical local visibility steps.','Primero revise cómo aparece públicamente su negocio y luego elija una meta local medible. Franklin Navigator ofrece un planificador de crecimiento y herramientas de perfil.'],
      links:[['Business Growth Planner','Planificador de crecimiento','/local-growth-engine/'],['Business dashboard','Panel de negocio','/business-dashboard/']]
    },
    {
      id:'trash',
      test:/\b(trash|garbage|recycling|bulk waste|brush pickup|yard waste|sanitation)\b/i,
      title:['Trash, recycling and sanitation','Basura, reciclaje y servicios sanitarios'],
      answer:['For addresses inside Franklin city limits, use the City sanitation route for collection, recycling, brush and bulk-waste information. Confirm schedule changes at the City source.','Para direcciones dentro de los límites de Franklin, use la ruta de saneamiento de la Ciudad y confirme cambios de horario en la fuente oficial.'],
      links:[['Franklin sanitation help','Ayuda de saneamiento de Franklin','/everyday-help/?q=trash'],['City sanitation source','Fuente oficial de saneamiento','https://www.franklintn.gov/government/departments-k-z/sanitation-and-environmental-services']]
    },
    {
      id:'events',
      test:/\b(what.*(today|tonight|weekend)|event|events|festival|things to do|what is happening)\b/i,
      title:['What is happening around Franklin?','¿Qué está pasando en Franklin?'],
      answer:['Use Today in Franklin for current dated items, then open the original event or agency source before you leave or register because times and availability can change.','Use Hoy en Franklin para elementos con fecha actual y confirme los detalles en la fuente original antes de ir o registrarse.'],
      links:[['Today in Franklin','Hoy en Franklin','/today/'],['Browse activities','Explorar actividades','/activities/']]
    },
    {
      id:'jobs',
      test:/\b(job|jobs|career|hiring|internship|resume|work in franklin)\b/i,
      title:['Jobs and career','Empleo y carrera'],
      answer:['Use the Franklin-area jobs pathway to separate current openings, training and career planning. Verify every opening at the employer or original source before applying.','Use la ruta de empleo del área de Franklin para separar vacantes, capacitación y planificación profesional. Verifique cada vacante en la fuente original antes de solicitar.'],
      links:[['Jobs & Career pathway','Ruta de empleo y carrera','/local-pathways/jobs-career/'],['Jobs & internships','Empleos y pasantías','/jobs-internships/']]
    },
    {
      id:'childcare',
      test:/\b(childcare|child care|daycare|preschool|babysitter)\b/i,
      title:['Child care and family support','Cuidado infantil y apoyo familiar'],
      answer:['Start with licensed child-care and family-support routes, then confirm current openings, age ranges, licensing, hours and total cost directly.','Empiece con rutas de cuidado infantil con licencia y confirme directamente cupos, edades, licencia, horarios y costo total.'],
      links:[['Children & Family pathway','Ruta para niños y familias','/local-pathways/children-family/'],['Family support tasks','Tareas de apoyo familiar','/get-it-done/#children-family']]
    },
    {
      id:'food-benefits',
      test:/\b(snap|food help|food assistance|groceries|benefits|basic needs|utility help)\b/i,
      title:['Food, benefits and basic needs','Alimentos, beneficios y necesidades básicas'],
      answer:['Use the Franklin local pathway to identify food, benefit and basic-needs starting points. Confirm program eligibility and current availability at the responsible source.','Use la ruta local de Franklin para identificar recursos de alimentos, beneficios y necesidades básicas. Confirme elegibilidad y disponibilidad con la fuente responsable.'],
      links:[['Food & Benefits pathway','Ruta de alimentos y beneficios','/local-pathways/food-benefits/'],['Community Help Center','Centro de ayuda comunitaria','/community-help-center/']]
    },
    {
      id:'utilities',
      test:/\b(electric|electricity|water bill|water service|power bill|sewer|utilities|utility service)\b/i,
      title:['Utilities and household services','Servicios públicos y del hogar'],
      answer:['If you are setting up service, start with the new-resident utilities steps. If you need help paying, use the basic-needs pathway instead of opening a second service account.','Si está activando servicio, empiece con los pasos para nuevos residentes. Si necesita ayuda para pagar, use la ruta de necesidades básicas.'],
      links:[['New resident utilities','Servicios para nuevos residentes','/new-to-franklin/'],['Basic-needs help','Ayuda de necesidades básicas','/local-pathways/food-benefits/']]
    },
    {
      id:'legal',
      test:/\b(lawyer|attorney|legal help|court|lawsuit|divorce|custody|warrant|ticket)\b/i,
      title:['Legal or court starting help','Ayuda inicial legal o de tribunal'],
      answer:['Franklin Navigator can help you organize the issue, locate official court information and find local legal-service profiles. It does not provide legal advice or calculate deadlines.','Franklin Navigator puede ayudarle a organizar el asunto, localizar información oficial y encontrar perfiles de servicios legales. No brinda asesoría legal ni calcula plazos.'],
      links:[['Legal help & next steps','Ayuda legal y próximos pasos','/legal-help/'],['Find legal-service profiles','Buscar perfiles legales','/directory/?q=attorney']]
    },
    {
      id:'health',
      test:/\b(doctor|medical|health care|healthcare|clinic|medication|hospital)\b/i,
      title:['Health and care','Salud y atención'],
      answer:['Use the health route to prepare questions and choose the right level of care. For a specific local provider, I can also search Franklin-area profiles below.','Use la ruta de salud para preparar preguntas y elegir el nivel adecuado de atención. Para un proveedor específico, también puedo buscar perfiles del área de Franklin.'],
      links:[['Health and care help','Ayuda de salud y atención','/health-help/'],['Find health profiles','Buscar perfiles de salud','/directory/?q=health']]
    },
    {
      id:'housing',
      test:/\b(rent|renter|landlord|eviction|housing|affordable housing)\b/i,
      title:['Housing help','Ayuda de vivienda'],
      answer:['Start with housing and affordability resources. If the problem involves a notice, deadline or dispute, use the preparation tools and confirm legal rights with an appropriate official or legal source.','Empiece con recursos de vivienda y asequibilidad. Si hay un aviso, plazo o disputa, use las herramientas de preparación y confirme los derechos con una fuente apropiada.'],
      links:[['Housing and home help','Ayuda de vivienda y hogar','/housing/'],['Home rights & notices','Derechos y avisos del hogar','/home-rights-center/']]
    },
    {
      id:'auto',
      test:/\b(car|vehicle|crash|accident|recall|repair|mechanic|tow)\b/i,
      title:['Vehicle help','Ayuda con vehículos'],
      answer:['Start with safety and the specific vehicle problem, then use Franklin Navigator for repair, insurance/claim preparation or local service profiles as appropriate.','Empiece con seguridad y el problema específico del vehículo, y luego use Franklin Navigator para reparación, seguro/reclamo o perfiles locales según corresponda.'],
      links:[['Vehicle help & next steps','Ayuda de vehículo','/auto-vehicle-help/'],['Find auto profiles','Buscar perfiles de auto','/directory/?q=auto%20repair']]
    },
    {
      id:'sports',
      test:/\b(youth sports|adult league|sports league|soccer|baseball|softball|basketball|tennis|pickleball|golf league|swim team)\b/i,
      title:['Franklin-local sports','Deportes locales de Franklin'],
      answer:['Use the Franklin sports hub to compare local leagues, teams, clinics, facilities and registration sources. Recheck age, dates, fees and availability at the original source.','Use el centro de deportes de Franklin para comparar ligas, equipos, clínicas, instalaciones y fuentes de inscripción. Confirme edades, fechas, costos y disponibilidad.'],
      links:[['Open local sports','Abrir deportes locales','/sports/'],['Youth leagues and teams','Ligas y equipos juveniles','/sports/youth-leagues/']]
    },
    {
      id:'learning',
      test:/\b(lesson plan|teaching|teacher|tutor|tutoring|learning|homework|adult education)\b/i,
      title:['Teaching and learning','Enseñanza y aprendizaje'],
      answer:['Use the Learning Hub for private lesson planning, guided practice and Franklin learning resources. For a tutor or class provider, I can also search local profiles.','Use el Centro de Aprendizaje para planificación de clases, práctica guiada y recursos de Franklin. Para tutoría o clases, también puedo buscar perfiles locales.'],
      links:[['Learning Hub','Centro de aprendizaje','/learning/'],['Assistant Learning mode','Modo de aprendizaje','/assistant/learning/']]
    },
    {
      id:'civic',
      test:/\b(city council|boma|alderman|ward|vote|voting|public hearing|city meeting|development near me)\b/i,
      title:['Civic and neighborhood information','Información cívica y del vecindario'],
      answer:['Use the civic pathway for wards, meetings, development activity and ways to participate. Confirm meeting agendas, dates and public-comment rules at the official City source.','Use la ruta cívica para distritos, reuniones, desarrollo y participación. Confirme agendas, fechas y reglas de comentario público en la fuente oficial.'],
      links:[['Civic & Neighborhood pathway','Ruta cívica y de vecindario','/local-pathways/civic-neighborhood/'],['Today: civic items','Hoy: asuntos cívicos','/today/#civic']]
    }
  ];

  const SERVICE_HINTS = [
    ['dentist','dentist'],['dental','dentist'],['plumber','plumber'],['plumbing','plumber'],
    ['electrician','electrician'],['hvac','hvac'],['air conditioning','hvac'],['roofer','roofing'],
    ['roofing','roofing'],['landscaper','landscaping'],['lawn','landscaping'],['salon','salon'],
    ['haircut','salon'],['barber','salon'],['restaurant','restaurant'],['accountant','accounting'],
    ['bookkeeper','accounting'],['tax preparer','tax'],['realtor','real estate'],['real estate agent','real estate'],
    ['insurance agent','insurance'],['tutor','tutoring'],['daycare','child care'],['doctor','doctor'],
    ['pediatrician','pediatrician'],['vet','veterinary'],['veterinarian','veterinary'],['mechanic','auto repair'],
    ['tow truck','towing'],['cleaner','cleaning'],['house cleaning','cleaning'],['attorney','attorney'],['lawyer','attorney']
  ];

  const serviceQuery = raw => {
    const text = normalize(raw);
    const hit = SERVICE_HINTS.find(([term]) => text.includes(term));
    return hit ? hit[1] : '';
  };
  const looksLikeLocalLookup = raw => {
    const text = normalize(raw);
    return !!serviceQuery(text) ||
      /\b(find|looking for|where is|where are|phone|number|address|website|contact|near me|nearby|local)\b/.test(text);
  };
  const lookupQuery = raw => {
    const service = serviceQuery(raw);
    if (service) return service;
    return normalize(raw).split(' ').filter(word => word && !stopWords.has(word)).slice(0, 6).join(' ');
  };

  const makeLink = (label, href, primary = false) => {
    const a = document.createElement('a');
    a.className = `button${primary ? ' primary' : ''}`;
    a.href = href;
    a.textContent = label;
    if (/^https?:/i.test(href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.referrerPolicy = 'no-referrer';
    }
    return a;
  };
  const makeActions = links => {
    const actions = document.createElement('div');
    actions.className = 'actions';
    links.forEach(([en, es, href], i) => actions.append(makeLink(isEs() ? es : en, href, i === 0)));
    return actions;
  };
  const renderRule = rule => {
    const card = document.createElement('article');
    card.className = 'navigator-result franklin-assistant-answer';
    const h = document.createElement('h3');
    h.textContent = isEs() ? rule.title[1] : rule.title[0];
    const p = document.createElement('p');
    p.textContent = isEs() ? rule.answer[1] : rule.answer[0];
    card.append(h, p, makeActions(rule.links));
    output.append(card);
  };
  const appendLegacySave = raw => {
    if (!window.FranklinR38Assistant?.render) return;
    const holder = document.createElement('div');
    try {
      window.FranklinR38Assistant.render(holder, raw);
      const save = holder.querySelector('.r38-assistant-save');
      if (save) output.append(save);
    } catch (_) {}
  };
  const profileHref = row => `/profile/${encodeURIComponent(row.id)}/`;
  const cleanLocation = row => String(row.location || row.area || '')
    .replace(/^Public IRS filing address geocoded in Williamson County:\s*/i, '')
    .replace(/^Public IRS filing address:\s*/i, '') || tr('Location not supplied','Ubicación no indicada');

  const renderProfiles = (rows, query) => {
    const section = document.createElement('section');
    section.className = 'franklin-assistant-local-results';
    const h = document.createElement('h3');
    h.textContent = tr(
      rows.length === 1 ? 'A Franklin-area match' : 'Franklin-area matches',
      rows.length === 1 ? 'Una coincidencia del área de Franklin' : 'Coincidencias del área de Franklin'
    );
    const intro = document.createElement('p');
    intro.textContent = tr(
      `I found ${rows.length} public profile${rows.length === 1 ? '' : 's'} that match “${query}”. These are factual matches, not endorsements; confirm services, price and availability directly.`,
      `Encontré ${rows.length} perfil${rows.length === 1 ? '' : 'es'} público${rows.length === 1 ? '' : 's'} que coincide${rows.length === 1 ? '' : 'n'} con “${query}”. Son coincidencias informativas, no recomendaciones; confirme servicios, precio y disponibilidad directamente.`
    );
    section.append(h, intro);
    const grid = document.createElement('div');
    grid.className = 'franklin-assistant-profile-grid';
    rows.slice(0,3).forEach(row => {
      const card = document.createElement('article');
      card.className = 'franklin-assistant-profile-card';
      const title = document.createElement('h4');
      title.textContent = row.name;
      const meta = document.createElement('p');
      meta.className = 'franklin-assistant-profile-meta';
      meta.textContent = [row.category || row.type, cleanLocation(row)].filter(Boolean).join(' · ');
      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.append(makeLink(tr('Open profile','Abrir perfil'), profileHref(row), true));
      const phone = safePhone(row.phone);
      const email = safeEmail(row.email);
      if (phone) actions.append(makeLink(tr('Call','Llamar'), phone));
      if (email) actions.append(makeLink(tr('Email','Correo'), email));
      card.append(title, meta, actions);
      grid.append(card);
    });
    section.append(grid);
    const all = makeLink(
      tr('See all matching profiles','Ver todos los perfiles coincidentes'),
      '/directory/?q=' + encodeURIComponent(query)
    );
    all.className = 'button franklin-assistant-all-results';
    section.append(all);
    output.append(section);
  };

  const renderFallback = raw => {
    const h = document.createElement('h3');
    h.textContent = tr('I need one more detail to route this well.','Necesito un detalle más para orientarle bien.');
    const p = document.createElement('p');
    p.textContent = tr(
      'Tell me the thing you need and, when useful, who or where it is for. For example: “find a dentist,” “I need a fence permit,” “senior transportation,” or “phone number for [business name].”',
      'Dígame qué necesita y, cuando sea útil, para quién o dónde. Por ejemplo: “buscar dentista”, “necesito permiso para una cerca”, “transporte para mayores” o “teléfono de [negocio]”.'
    );
    output.append(h, p, makeActions([
      ['Browse practical tasks','Explorar tareas prácticas','/get-it-done/'],
      ['Search Find Local','Buscar en Find Local','/directory/'],
      ['Open Help Center','Abrir Centro de ayuda','/community-help-center/']
    ]));
  };

  const render = async raw => {
    output.hidden = false;
    output.replaceChildren();
    const text = normalize(raw);
    if (!text) {
      const p = document.createElement('p');
      p.textContent = tr(
        'Tell me what you need in a few words. I can give you a Franklin next step or search the local profile directory.',
        'Dígame lo que necesita en pocas palabras. Puedo darle un próximo paso en Franklin o buscar perfiles locales.'
      );
      output.append(p);
      return;
    }

    const wait = document.createElement('p');
    wait.className = 'fine-print franklin-assistant-thinking';
    wait.setAttribute('role','status');
    wait.textContent = tr('Checking Franklin Navigator…','Consultando Franklin Navigator…');
    output.append(wait);

    const rule = RULES.find(item => item.test.test(text));
    const shouldLookup = looksLikeLocalLookup(raw);
    let profiles = [];
    const query = lookupQuery(raw);
    if (shouldLookup && query) {
      try { profiles = await findProfiles(query); } catch (_) { profiles = []; }
    }

    output.replaceChildren();

    if (profiles.length) renderProfiles(profiles, query);
    if (rule) renderRule(rule);

    if (!profiles.length && !rule && shouldLookup && query) {
      const h = document.createElement('h3');
      h.textContent = tr('No strong local profile match yet.','Todavía no hay una coincidencia local clara.');
      const p = document.createElement('p');
      p.textContent = tr(
        `I searched Franklin Navigator’s public profiles for “${query}” but did not find a reliable match. Try a shorter business name or service, or open Find Local with that search.`,
        `Busqué “${query}” en los perfiles públicos de Franklin Navigator pero no encontré una coincidencia confiable. Pruebe un nombre o servicio más corto.`
      );
      output.append(h, p, makeActions([
        ['Search Find Local','Buscar en Find Local','/directory/?q=' + encodeURIComponent(query)],
        ['Browse practical tasks','Explorar tareas prácticas','/get-it-done/']
      ]));
    } else if (!profiles.length && !rule) {
      renderFallback(raw);
    }

    if (rule && !['emergency','crisis'].includes(rule.id)) appendLegacySave(raw);
    output.focus();
    window.FranklinProductHealth?.record?.(profiles.length ? 'assistant_local_results' : rule ? 'assistant_routed_answer' : 'assistant_clarify');
  };

  const installMobileFixes = () => {
    if (document.getElementById('franklin-assistant-mobile-hotfix')) return;
    const style = document.createElement('style');
    style.id = 'franklin-assistant-mobile-hotfix';
    style.textContent = `
      .franklin-assistant-local-results{margin-top:0}
      .franklin-assistant-profile-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}
      .franklin-assistant-profile-card{border:1px solid #c9dcda;border-radius:12px;background:#fff;padding:14px;min-width:0}
      .franklin-assistant-profile-card h4{margin:0 0 7px;font-size:1rem}
      .franklin-assistant-profile-meta{margin:0 0 10px;color:#53666a;line-height:1.4}
      .franklin-assistant-profile-card .actions{gap:6px}
      .franklin-assistant-profile-card .button{padding:8px 10px;min-height:38px}
      .franklin-assistant-all-results{margin-top:4px}
      @media(max-width:640px){
        body.hf39-home header .top{min-height:0;padding-block:7px;gap:8px 12px}
        body.hf39-home .brand img{width:30px;height:30px}
        body.hf39-home .brand-name{font-size:1.08rem}
        body.hf39-home .brand-subname{font-size:.68rem}
        body.hf39-home .r37-language-switch.hf36-language-in-header button{min-height:32px;padding:5px 7px}
        body.hf39-home .nav.hf34-nav{gap:12px;padding-bottom:2px;scrollbar-width:none}
        body.hf39-home .nav.hf34-nav::-webkit-scrollbar{display:none}
        body.hf39-home .nav.hf34-nav>a,body.hf39-home .nav.hf34-nav summary{white-space:nowrap;font-size:.9rem}
        body.hf39-home .r24-home-hero{padding-top:22px;padding-bottom:28px}
        body.hf39-home .r24-hero-grid{gap:18px}
        body.hf39-home .r24-hero-copy h1{font-size:clamp(2.2rem,10.5vw,2.8rem);line-height:1.02;letter-spacing:-.025em;margin-bottom:12px}
        body.hf39-home .r24-hero-lead{font-size:1rem;line-height:1.5;margin-bottom:14px}
        body.hf39-home .r24-trust-line{gap:7px 12px;font-size:.88rem}
        body.hf39-home .r24-hero-photos{margin-top:16px}
        body.hf39-home .navigator-bot{padding:16px;border-radius:16px}
        body.hf39-home .navigator-form textarea{min-height:108px}
        body.hf39-home .r24-ask-actions{display:grid;grid-template-columns:minmax(90px,.8fr) minmax(0,2fr);gap:8px}
        body.hf39-home .r24-ask-actions .button{width:100%;justify-content:center;padding-inline:10px}
        body.hf39-home .r24-chips{gap:7px;margin-top:10px}
        body.hf39-home .r24-chips button{font-size:.9rem;line-height:1.2;padding:8px 10px}
        .franklin-assistant-profile-grid{grid-template-columns:1fr}
        .franklin-assistant-profile-card{padding:12px}
        .franklin-assistant-profile-card .actions{display:flex;flex-wrap:wrap}
        .navigator-output .navigator-result,.navigator-output .franklin-assistant-local-results{overflow-wrap:anywhere}
      }
      @media(max-width:390px){
        body.hf39-home .r24-ask-actions{grid-template-columns:1fr}
        body.hf39-home .r24-hero-copy h1{font-size:2.18rem}
      }
    `;
    document.head.append(style);
  };

  installMobileFixes();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (voiceButton && SpeechRecognition) {
    voiceButton.hidden = false;
    let listening = false;
    const recognition = new SpeechRecognition();
    recognition.lang = isEs() ? 'es-US' : 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    const setVoiceStatus = message => { if (voiceStatus) voiceStatus.textContent = message; };
    recognition.addEventListener('start', () => {
      listening = true;
      voiceButton.textContent = tr('Listening…','Escuchando…');
      voiceButton.setAttribute('aria-pressed','true');
      setVoiceStatus(tr('Listening. Speak a short Franklin question or goal.','Escuchando. Diga una pregunta u objetivo breve sobre Franklin.'));
    });
    recognition.addEventListener('result', event => {
      const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
      if (transcript) {
        input.value = transcript;
        render(transcript);
      }
      setVoiceStatus(tr('Voice input captured. Review the words before using any outside link.','Voz recibida. Revise las palabras antes de usar un enlace externo.'));
    });
    recognition.addEventListener('error', event => {
      setVoiceStatus(event.error === 'not-allowed'
        ? tr('Voice permission was not granted. You can keep typing instead.','No se concedió permiso para usar la voz. Puede seguir escribiendo.')
        : tr('Voice input did not finish. Try again or keep typing.','La entrada de voz no terminó. Inténtelo de nuevo o siga escribiendo.'));
    });
    recognition.addEventListener('end', () => {
      listening = false;
      voiceButton.textContent = tr('Speak','Hablar');
      voiceButton.setAttribute('aria-pressed','false');
    });
    voiceButton.addEventListener('click', () => {
      if (listening) { recognition.stop(); return; }
      recognition.lang = isEs() ? 'es-US' : 'en-US';
      try { recognition.start(); } catch (_) {
        setVoiceStatus(tr('Voice input is already starting.','La entrada de voz ya está iniciándose.'));
      }
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    render(input.value);
  });
  examples.forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.navigatorExample || button.textContent;
    render(input.value);
  }));
  window.addEventListener('franklinlanguagechange', () => {
    if (input.value.trim() && !output.hidden) render(input.value);
  });

  window.FranklinAssistantRouter = Object.freeze({
    version: RELEASE,
    render,
    lookupQuery,
    serviceQuery
  });
})();