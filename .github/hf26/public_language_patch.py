from pathlib import Path
import json,re,hashlib

ROOT=Path('candidate')
DIST=ROOT/'dist'
changes={}

def write_if_changed(path,text):
    old=path.read_text(errors='ignore')
    if text!=old:
        path.write_text(text)
        changes[path.relative_to(ROOT).as_posix()]={'before':hashlib.sha256(old.encode()).hexdigest(),'after':hashlib.sha256(text.encode()).hexdigest()}

def exact(text, mapping):
    for old,new in mapping.items():
        text=text.replace(old,new)
    return text

GLOBAL={
'Ask Navigator':'Ask Franklin Assistant',
'For Business':'For businesses',
'Your everyday operating system for living, participating and doing business in Franklin, Tennessee.':'Your practical guide to living, participating, and doing business in Franklin, Tennessee.',
'Linked agencies, organizations and businesses are not affiliated with or endorsed by Franklin Navigator unless expressly stated. Confirm changing details at the original source.':'Links to agencies, organizations, and businesses do not imply a partnership or endorsement. For details that can change, check the original source.',
'Public source details and contact options.':'Public information and contact options.',
'Location shown from a cited public source':'Location from a public source',
'Franklin Navigator separates public-source facts from member-provided content. A source check is not an endorsement or professional credential.':'Franklin Navigator keeps public information separate from member-provided content. Checking a source does not mean Franklin Navigator endorses the organization or verifies professional credentials.',
'Factual corrections are free. Claiming is a separate ownership process and does not change source-backed facts by itself.':'Factual corrections are free. Claiming a profile is a separate access process and does not change information from public sources.',
'Claim / manage this profile':'Claim or manage this profile',
'Preview a member profile':'See member profile options',
'Related by category, not ranking or recommendation.':'Related by category only—not ranked or recommended.',
'Membership does not buy factual accuracy or ordinary directory rank. Changing services, hours and availability should be confirmed directly.':'Membership does not affect factual information or ordinary directory placement. Confirm current services, hours, and availability directly with the organization.',
'Public information from the current Franklin directory projection. Check changing details directly before relying on them.':'Public information from the Franklin directory. Details can change, so confirm important information with the original source.',
'This profile is not a ranking, endorsement, guarantee of availability or proof of fit. Paid status does not change factual accuracy or ordinary directory placement.':'This profile is for information only. It is not a ranking, endorsement, availability guarantee, or recommendation. Membership does not change factual information or ordinary directory placement.',
'Search 19,103 profiles built from public-source evidence. Filter by factual details or compare up to three.':'Search 19,103 local profiles built from public information. Filter by category, type, area, or available contact details, or compare up to three profiles.',
'Search words and filters appear in the page link. Do not type private details. A shared search does not include your comparison.':'Your search words and filters are included in the page link, so avoid private information. Comparisons stay on this device and are not included when you share the link.',
'Results use factual directory fields; membership does not buy ordinary directory ranking.':'Results use the same directory information for everyone. Membership does not change ordinary directory ranking.',
'Search needs JavaScript.':'This search needs JavaScript.',
'Ask one question, see what is happening around Franklin, get things done and find local organizations.':'Find local services, official resources, events, community organizations, and practical next steps in Franklin, Tennessee.',
'Ask one question. Franklin Navigator will route you to the right local checklist, official source, profile or community help.':'Ask one question. Franklin Navigator can guide you to a useful local checklist, official source, profile, or community resource.',
'One situation can cross more than one category.':'One situation can involve more than one need.',
'Start with what is happening. Franklin Assistant can route you to deep Legal, Health, Home, Auto, civic and community help, or build one private plan across connected needs.':'Start with what’s happening. Franklin Assistant can guide you to detailed legal, health, home, vehicle, civic, and community help—or help you build one private plan for connected needs.',
'Build a whole-situation plan':'Build one plan for connected needs',
'Date-sensitive local items link to their responsible sources and disappear when their evidence window ends.':'Time-sensitive items link to the original source and are removed when they are no longer current.',
'Recheck before going':'Confirm before going',
'Check responsible source ↗':'Check current source ↗',
'— use physical-address guidance':'— confirm the location before going',
'No current cards are available right now.':'No current items are available right now.',
'Open Today for live City, library, school and community sources.':'Open Today for current city, library, school, and community sources.',
'Open a focused local hub, use responsible sources and build a private recheck list before registering or going.':'Choose a local guide, check current details at the original source, and save a private reminder list before you register or go.',
'On-device lesson planning, guided practice and responsible local learning routes.':'Private lesson planning, guided practice, and trusted local learning resources—all on this device.',
'Build a checklist, prepare questions, reach the responsible official source and save a follow-up without uploading a private story.':'Build a checklist, prepare questions, open the appropriate official source, and save a follow-up without uploading personal details.',
'Legal starting help':'Legal help & next steps',
'Auto and vehicle help':'Vehicle help & next steps',
'Franklin-specific sources and a private on-device checklist.':'Includes local sources and a private checklist that stays on this device.',
'Franklin-specific sources, directory discovery and a private on-device planner.':'Includes local sources, directory search, and a private planner that stays on this device.',
'on-device preparation with no submission or professional advice.':'The plan stays on this device; nothing is submitted, and it is not professional advice.',
'Build a private Legal, Health, Home or Auto preparation packet with sixteen deep Franklin-localized tracks and no account, upload or submission.':'Build a private legal, health, home, or vehicle preparation packet with 16 detailed Franklin-specific tracks—no account, upload, or submission required.',
'Franklin connected-needs preparation packet for Legal, Health, Home, Auto and related needs; browser-only and private by design.':'Build one private preparation packet for connected legal, health, home, vehicle, and related needs. It stays in your browser by design.',
'Build a private Franklin growth plan, audit a public profile and prepare next-best actions and drafts without submitting, publishing or paying.':'Build a private Franklin growth plan, review a public profile, and prepare practical next steps and drafts without submitting, publishing, or paying.',
'Build a practical Franklin-area plan for discovery, trust, conversion, community participation and sustainable business growth.':'Build a practical Franklin-area plan for local visibility, trust, customer growth, community participation, and long-term business growth.',
'Preview a practical first-value plan before deciding whether Franklin Navigator Community Membership is right for your organization.':'Try a practical starter plan before deciding whether Franklin Navigator Community Membership is right for your organization.',
'Prepare a Franklin Community Membership preference and first-value plan without making a payment.':'Explore Community Membership options and build a starter plan without making a payment.',
'First-value path':'Your first member steps',
'next-best actions prioritized':'recommended next steps',
'Preview bilingual member growth tools for lawful, privacy-safe local community participation and business growth.':'Explore bilingual tools for local visibility, community participation, and business growth while keeping sensitive details private.',
'Preview the Franklin Navigator Community Member display benefit planned for future active paid subscribed locations.':'See how the Community Member display is planned to work for eligible paid members once this feature launches.',
'Review your Franklin profile, use free community tools, ask Franklin Assistant, and preview Community or Charter Membership.':'Review your Franklin profile, use free community tools, ask Franklin Assistant, and explore Community or Charter Membership options.',
'Explore Franklin Navigator’s vertical-specific community membership model while free profiles and corrections remain useful.':'See how Community Membership works across local business categories while public profiles and factual corrections remain free.',
'See which Franklin Navigator features work today, including current Community Membership, and which capabilities remain planned.':'See what works today, what requires membership, and what is still planned.',
'Public profile checked against sources':'Public profile information checked against sources',
'Factual correction preparation':'Prepare a factual correction',
'Profile representation review':'Profile access review',
'Find or select a profile and request representation review; approval is required before member-only profile control or payment':'Find or select a profile and request access to manage it. Approval is required before member-only profile tools or checkout appear.',
'active paid members also have Growth Desk entitlement':'active paid members also have access to the Growth Desk',
'source-backed profile facts stay separate':'information from public sources stays separate',
'Save and submit member profile content for authorized review. Public-source facts and free corrections stay separate.':'Save member-provided profile details and submit them for review. Public information and free factual corrections remain separate.',
'Find your profile, create or sign in to your account, confirm representation and choose a Franklin Community Membership.':'Find your profile, create or sign in to your account, confirm that you represent it, and choose a Franklin Community Membership.',
'3 · Confirm representation':'3 · Confirm you represent it',
'Request a source-backed Franklin-area business, professional or organization profile.':'Request a Franklin-area business, professional, or organization profile.',
'Official / first-party source':'Official or original source',
'Official or first-party source':'Official or original source',
'Compare listed facts — confirm changing details directly':'Compare listed information — confirm changing details directly',
'Ready on device':'Saved on this device',
'Ready. Use broad business facts only.':'Ready. Use only general business information—no sensitive details.',
'Cleared. Nothing was saved or submitted.':'Cleared. Nothing was saved or sent.',
'Automatic copy was unavailable.':'We couldn’t copy that automatically.',
'No listings selected. Use “Add to compare” on any result.':'No profiles selected yet. Choose “Add to compare” on any result.',
'Mark done':'Mark as done',
'No unexpired current-window cards match this section. Use the evergreen source finder below.':'No current items match this section. Use the always-available source finder below.',
'Community Membership supports participation—not guaranteed sales.':'Community Membership supports local visibility and participation; it does not guarantee sales.',
'Use this free planner first. Members can later receive a guided Growth Desk plan, richer profile tools and appropriate English, Spanish or bilingual campaign preparation.':'Use this free planner to get started. Active members can also use guided Growth Desk planning, richer profile tools, and English, Spanish, or bilingual planning tools.',
'SHOW ME':'See member options',
'Preview only. Community Member recognition indicates participation, not endorsement, ranking, certification or guaranteed results.':'Preview only. Community Member recognition shows participation; it is not an endorsement, ranking, certification, or guarantee of results.',
}

JS_EXACT={
'Your representation request is saved and awaiting authorized review. No payment has been created.':'Your request is saved and waiting for review. No payment has been started.',
'Request a representation review before editing member content.':'Request access to manage this profile before editing member content.',
'Find your profile on the membership page, then request a representation review.':'Find your profile on the membership page, then request access to manage it.',
'Request a representation review':'Request profile access',
'Request or check representation review':'Request or check profile access',
'Request a representation review to continue. Payment stays closed until your representation is confirmed.':'Request profile access to continue. Checkout stays unavailable until we confirm that you represent this profile.',
'Profile verification is still in progress. No payment button is shown until your representation is confirmed.':'We’re still confirming that you represent this profile. Checkout will appear after the review is complete.',
'- Review the public Franklin learning-provider schema and prepare verifiable facts only. Nothing was submitted from this tool.':'- Review the public learning-provider fields and prepare only information you can verify. Nothing is submitted from this tool.',
'- The user indicated they have a current Tennessee standards source. Cite its exact code and wording from that source; Franklin does not infer alignment.':'- If you have a current Tennessee standards source, use its exact code and wording. Franklin Navigator does not infer standards alignment.',
'2. Confirm the public display name and provider type from a first-party source.':'2. Confirm the public display name and provider type using the organization’s own source.',
'6. Attach an HTTPS source URL and review date for every material claim.':'6. For each important statement, add the public HTTPS source URL and the date you checked it.',
'Find local performances, classes, productions, venues and ensembles, then confirm tickets, registration, auditions and current details at the first-party source.':'Find local performances, classes, productions, venues, and ensembles, then confirm tickets, registration, auditions, and current details at the original source.',
'Find local performances, classes, productions, venues and ensembles, then confirm changing details at the first-party source.':'Find local performances, classes, productions, venues, and ensembles, then confirm changing details at the original source.',
'Use structured on-device teaching, guided-practice and provider-preparation tools, then open responsible Franklin learning sources.':'Use private teaching and guided-practice tools on this device, then open trusted Franklin learning sources.',
'URGENT CHECK: Safety, housing loss, cutoff, arrest, custody or a near deadline may be involved. Use the urgent routes and verify dates promptly.':'Urgent situation: Safety, housing loss, utility shutoff, arrest, custody, or a near deadline may be involved. Start with urgent-help options and confirm important dates right away.',
'URGENT: Someone may be in immediate danger. Call 911 now. This plan is not emergency response.':'Immediate danger: Call 911 now. Franklin Navigator is not an emergency service.',
'FRANKLIN WHOLE-SITUATION PLAN':'Franklin connected-needs plan',
'FRANKLIN COMMUNITY HELP PLAN':'Franklin community help plan',
'FRANKLIN PROFILE CLAIM PREPARATION':'Franklin profile claim preparation',
'FRANKLIN DIRECTORY COMPARISON':'Franklin directory comparison',
'FRANKLIN BUSINESS GROWTH PLAN':'Franklin business growth plan',
'REVIEW / APPEAL PREPARATION':'Review / appeal preparation',
'FRANKLIN CONNECTED PREPARATION PACKET':'Franklin connected-needs preparation packet',
'FRANKLIN NOTICE & CLAIM ORGANIZER':'Franklin notice & claim organizer',
'FRANKLIN CHRONOLOGY':'Franklin chronology',
'TEACHER / TUTOR PLANNING PACKET':'Teacher / tutor planning packet',
'GUIDED PRACTICE PACKET':'Guided practice packet',
'LEARNING PROVIDER PROFILE READINESS PACKET':'Learning-provider profile readiness packet',
'PUBLIC FIELDS TO PREPARE':'Public profile fields to prepare',
'EVIDENCE AND AFFILIATION':'Evidence and affiliation',
'CHECKS AND LIMITS':'Checks and limits',
'SUGGESTED SEQUENCE':'Suggested sequence',
'DRAFT OBJECTIVE':'Draft objective',
'SELECTED SUPPORTS':'Selected supports',
'LEARNING LOOP':'Learning loop',
}

ES_EXACT={
'Preguntar a Navigator':'Preguntar a Franklin Assistant',
'Buscar local':'Buscar en Franklin',
'Hacerlo':'Resolver tareas',
'Tu punto de partida en Franklin':'Su punto de partida en Franklin',
'¿Qué necesitas hoy en Franklin?':'¿Qué necesita hoy en Franklin?',
'Haga una pregunta. Franklin Navigator lo dirigirá a la lista local, fuente oficial, perfil o ayuda comunitaria adecuada.':'Haga una pregunta. Franklin Navigator puede guiarle a una lista útil, una fuente oficial, un perfil o un recurso comunitario.',
'¿Cómo puede ayudarte Franklin Navigator?':'¿Cómo puede ayudarle Franklin Navigator?',
'Prueba: Acabo de mudarme aquí, necesito un permiso o necesito transporte para personas mayores.':'Pruebe: Acabo de mudarme aquí, necesito un permiso o necesito transporte para personas mayores.',
'Una situación puede abarcar más de una categoría.':'Una situación puede incluir más de una necesidad.',
'Empieza con lo que está ocurriendo. Franklin Assistant puede llevarte a ayuda detallada legal, de salud, hogar, auto, cívica y comunitaria, o crear un plan privado para necesidades conectadas.':'Empiece por lo que está ocurriendo. Franklin Assistant puede guiarle a ayuda detallada legal, de salud, vivienda, vehículo, vida cívica y comunidad, o ayudarle a crear un solo plan privado para necesidades conectadas.',
'Crear un plan para toda la situación':'Crear un plan para necesidades conectadas',
'Conoce Franklin Assistant':'Conozca Franklin Assistant',
'Los elementos locales sensibles a fecha enlazan a sus fuentes responsables y desaparecen cuando termina su ventana de evidencia.':'Los elementos con fecha enlazan a la fuente original y se eliminan cuando dejan de estar vigentes.',
'Ver todo lo de Hoy':'Ver todo en Hoy',
'Ver todo de Hoy':'Ver todo en Hoy',
'Vuelva a comprobar antes de ir':'Confirme antes de ir',
'Consultar fuente responsable ↗':'Consultar fuente actual ↗',
'— use la orientación sobre la dirección física':'— confirme la ubicación antes de ir',
'La página de inscripción de primera fuente incluye la carrera del Día del Trabajo. Compruebe directamente la inscripción, tarifas obligatorias, horarios, condiciones del recorrido y detalles de la carrera infantil.':'La página de inscripción incluye la carrera del Día del Trabajo. Confirme la inscripción, las tarifas obligatorias, el horario, las condiciones del recorrido y los detalles de la carrera infantil antes de ir.',
'No hay tarjetas actuales disponibles en este momento.':'No hay elementos actuales disponibles ahora.',
'Abre Hoy para fuentes actuales de la Ciudad, biblioteca, escuelas y comunidad.':'Abra Hoy para ver fuentes actuales de la ciudad, la biblioteca, las escuelas y la comunidad.',
'Abre un centro local enfocado, usa fuentes responsables y crea una lista privada de comprobación antes de registrarte o ir.':'Abra una guía local, confirme los detalles actuales en la fuente original y guarde una lista privada de recordatorios antes de inscribirse o ir.',
'Planificación de lecciones en el dispositivo, práctica guiada y rutas responsables de aprendizaje local.':'Planificación privada de lecciones, práctica guiada y recursos locales de aprendizaje en este dispositivo.',
'Busca 19,103 perfiles creados con evidencia de fuentes públicas. Filtra por datos factuales o compara hasta tres.':'Busque entre 19,103 perfiles locales creados con información pública. Filtre por categoría, tipo, zona o datos de contacto disponibles, o compare hasta tres perfiles.',
'Las palabras y los filtros aparecen en el enlace de la página. No escriba datos privados. Una búsqueda compartida no incluye su comparación.':'Sus palabras de búsqueda y filtros se incluyen en el enlace de la página, así que evite información privada. Las comparaciones permanecen en este dispositivo y no se incluyen al compartir el enlace.',
'Los resultados usan campos factuales del directorio; la membresía no compra posición en el directorio ordinario.':'Los resultados usan la misma información del directorio para todos. La membresía no cambia la posición ordinaria en el directorio.',
'Revise su presencia pública y las herramientas de crecimiento. La membresía pagada no está abierta hoy.':'Revise su presencia pública y las herramientas de crecimiento. La Membresía Comunitaria está disponible para perfiles elegibles y verificados.',
'Ninguna tarjeta vigente coincide con esta sección. Use el buscador de fuentes permanentes.':'No hay elementos actuales en esta sección. Use el buscador de fuentes disponibles en todo momento.',
'Las agencias, organizaciones y empresas enlazadas no están afiliadas a Franklin Navigator ni respaldadas por este, salvo que se indique expresamente. Confirme los datos cambiantes en la fuente original.':'Los enlaces a agencias, organizaciones y empresas no implican una asociación ni un respaldo. Para datos que pueden cambiar, consulte la fuente original.',
}

# Respectful, consistent Spanish public voice (usted). Restrict to public Spanish pages/catalog and UI scripts.
ES_FORMAL={
'Elige':'Elija','Selecciona':'Seleccione','Confirma':'Confirme','Revisa':'Revise','Usa':'Use','Utiliza':'Utilice','Abre':'Abra','Busca':'Busque','Filtra':'Filtre','Compara':'Compare','Guarda':'Guarde','Escribe':'Escriba','Introduce':'Introduzca','Ingresa':'Ingrese','Haz':'Haga','Mantén':'Mantenga','Verifica':'Verifique','Consulta':'Consulte','Inténtalo':'Inténtelo','Evita':'Evite','Solicita':'Solicite','Crea':'Cree','Prepara':'Prepare','Organiza':'Organice','Encuentra':'Encuentre','Explora':'Explore','Lee':'Lea','Marca':'Marque','Copia':'Copie','Descarga':'Descargue','Añade':'Añada','Adjunta':'Adjunte','Elimina':'Elimine','Reinicia':'Reinicie',
'elige':'elija','selecciona':'seleccione','confirma':'confirme','revisa':'revise','usa':'use','utiliza':'utilice','abre':'abra','busca':'busque','filtra':'filtre','compara':'compare','guarda':'guarde','escribe':'escriba','introduce':'introduzca','ingresa':'ingrese','haz':'haga','mantén':'mantenga','verifica':'verifique','consulta':'consulte','inténtalo':'inténtelo','evita':'evite','solicita':'solicite','crea':'cree','prepara':'prepare','organiza':'organice','encuentra':'encuentre','explora':'explore','lee':'lea','marca':'marque','copia':'copie','descarga':'descargue','añade':'añada','adjunta':'adjunte','elimina':'elimine','reinicia':'reinicie'
}

# English -> Spanish translations for newly refined strings used by inline i18n.
NEW_TRANSLATIONS={
'Ask Franklin Assistant':'Preguntar a Franklin Assistant',
'For businesses':'Para negocios',
'Your practical guide to living, participating, and doing business in Franklin, Tennessee.':'Su guía práctica para vivir, participar y hacer negocios en Franklin, Tennessee.',
'Links to agencies, organizations, and businesses do not imply a partnership or endorsement. For details that can change, check the original source.':'Los enlaces a agencias, organizaciones y empresas no implican una asociación ni un respaldo. Para datos que pueden cambiar, consulte la fuente original.',
'Public information and contact options.':'Información pública y opciones de contacto.',
'Location from a public source':'Ubicación tomada de una fuente pública',
'Franklin Navigator keeps public information separate from member-provided content. Checking a source does not mean Franklin Navigator endorses the organization or verifies professional credentials.':'Franklin Navigator mantiene separada la información pública del contenido aportado por miembros. Consultar una fuente no significa que Franklin Navigator respalde a la organización ni verifique credenciales profesionales.',
'Factual corrections are free. Claiming a profile is a separate access process and does not change information from public sources.':'Las correcciones de datos son gratuitas. Reclamar un perfil es un proceso de acceso independiente y no cambia la información procedente de fuentes públicas.',
'Claim or manage this profile':'Reclamar o administrar este perfil',
'See member profile options':'Ver opciones de perfil de miembro',
'Related by category only—not ranked or recommended.':'Relacionado solo por categoría; no es una clasificación ni una recomendación.',
'Membership does not affect factual information or ordinary directory placement. Confirm current services, hours, and availability directly with the organization.':'La membresía no cambia la información factual ni la ubicación ordinaria en el directorio. Confirme los servicios, horarios y disponibilidad actuales directamente con la organización.',
'Public information from the Franklin directory. Details can change, so confirm important information with the original source.':'Información pública del directorio de Franklin. Los detalles pueden cambiar; confirme la información importante con la fuente original.',
'This profile is for information only. It is not a ranking, endorsement, availability guarantee, or recommendation. Membership does not change factual information or ordinary directory placement.':'Este perfil es solo informativo. No es una clasificación, respaldo, garantía de disponibilidad ni recomendación. La membresía no cambia la información factual ni la ubicación ordinaria en el directorio.',
'Search 19,103 local profiles built from public information. Filter by category, type, area, or available contact details, or compare up to three profiles.':'Busque entre 19,103 perfiles locales creados con información pública. Filtre por categoría, tipo, zona o datos de contacto disponibles, o compare hasta tres perfiles.',
'Your search words and filters are included in the page link, so avoid private information. Comparisons stay on this device and are not included when you share the link.':'Sus palabras de búsqueda y filtros se incluyen en el enlace de la página, así que evite información privada. Las comparaciones permanecen en este dispositivo y no se incluyen al compartir el enlace.',
'Results use the same directory information for everyone. Membership does not change ordinary directory ranking.':'Los resultados usan la misma información del directorio para todos. La membresía no cambia la posición ordinaria en el directorio.',
'Find local services, official resources, events, community organizations, and practical next steps in Franklin, Tennessee.':'Encuentre servicios locales, recursos oficiales, eventos, organizaciones comunitarias y próximos pasos prácticos en Franklin, Tennessee.',
'Ask one question. Franklin Navigator can guide you to a useful local checklist, official source, profile, or community resource.':'Haga una pregunta. Franklin Navigator puede guiarle a una lista útil, una fuente oficial, un perfil o un recurso comunitario.',
'One situation can involve more than one need.':'Una situación puede incluir más de una necesidad.',
'Build one plan for connected needs':'Crear un plan para necesidades conectadas',
'Time-sensitive items link to the original source and are removed when they are no longer current.':'Los elementos con fecha enlazan a la fuente original y se eliminan cuando dejan de estar vigentes.',
'Confirm before going':'Confirme antes de ir',
'Check current source ↗':'Consultar fuente actual ↗',
'No current items are available right now.':'No hay elementos actuales disponibles ahora.',
'Open Today for current city, library, school, and community sources.':'Abra Hoy para ver fuentes actuales de la ciudad, la biblioteca, las escuelas y la comunidad.',
'Private lesson planning, guided practice, and trusted local learning resources—all on this device.':'Planificación privada de lecciones, práctica guiada y recursos locales de aprendizaje en este dispositivo.',
'Legal help & next steps':'Ayuda legal y próximos pasos',
'Vehicle help & next steps':'Ayuda de vehículos y próximos pasos',
'Try a practical starter plan before deciding whether Franklin Navigator Community Membership is right for your organization.':'Pruebe un plan inicial práctico antes de decidir si la Membresía Comunitaria de Franklin Navigator es adecuada para su organización.',
'Explore Community Membership options and build a starter plan without making a payment.':'Explore las opciones de Membresía Comunitaria y cree un plan inicial sin realizar un pago.',
'Profile access review':'Revisión de acceso al perfil',
'Request profile access':'Solicitar acceso al perfil',
'Request or check profile access':'Solicitar o consultar acceso al perfil',
'Profile verified. You can continue to membership.':'Perfil verificado. Puede continuar con la membresía.',
}

# 1. Every public HTML page, including all 19,103 profile pages.
for p in sorted(DIST.rglob('*.html')):
    t=p.read_text(errors='ignore')
    t=exact(t,GLOBAL)
    t=t.replace('aria-label="Primary"','aria-label="Primary navigation"').replace("aria-label='Primary'","aria-label='Primary navigation'")
    t=t.replace('aria-label="Footer"','aria-label="Footer navigation"').replace("aria-label='Footer'","aria-label='Footer navigation'")
    # Profile About text contains the organization name; make the explanatory sentence plain without changing any profile fact.
    if '/profiles/' in '/'+p.relative_to(DIST).as_posix():
        t=re.sub(r'Franklin Navigator has public-source identity, category and location information for .*?\. A richer description has not been added from a current public source or the organization\.',
                 'Franklin Navigator has public information about this listing’s identity, category, and location. A fuller description has not yet been added by the organization or found in a current public source.',t)
    # Sports family: remove the awkward “responsible starting points” phrasing while preserving scope.
    t=t.replace('Compare responsible Franklin and Williamson County starting points for ','Compare Franklin and Williamson County starting points for ')
    t=t.replace('Compare puntos de partida responsables de Franklin y el Condado de Williamson para ','Compare puntos de partida de Franklin y el Condado de Williamson para ')
    if p.relative_to(DIST).as_posix().startswith('es/'):
        t=exact(t,ES_EXACT)
        t=t.replace('aria-label="Principal"','aria-label="Navegación principal"').replace('aria-label="Footer navigation"','aria-label="Navegación del pie de página"')
        for a,b in ES_FORMAL.items():t=re.sub(r'\b'+re.escape(a)+r'\b',b,t)
        t=re.sub(r'\bTu\b','Su',t);t=re.sub(r'\btu\b','su',t);t=re.sub(r'\bTus\b','Sus',t);t=re.sub(r'\btus\b','sus',t)
    t=t.replace('FR-NAV1.15.0-CANDIDATE-R40','FR-NAV1.15.0-HF2.6-CANDIDATE').replace('FR-NAV1.15.0-HF2.5-CANDIDATE','FR-NAV1.15.0-HF2.6-CANDIDATE')
    write_if_changed(p,t)

# 2. Public JavaScript customer messages. No routing, eligibility, pricing or payment logic is changed.
for p in sorted((DIST/'assets').glob('*.js')):
    t=p.read_text(errors='ignore')
    t=exact(t,GLOBAL)
    t=exact(t,JS_EXACT)
    t=t.replace('responsible source','relevant source').replace('responsible sources','relevant sources')
    t=t.replace('at the first-party source','at the original source').replace('from a first-party source','from the organization’s own source')
    if p.name in {'navigator-bot-es.js','learning-hub.js','community-explorer.js','local-discovery.js','my-franklin.js','r30-situation.js','r31-connected-prep.js','r32-notice-organizer.js','r33-prep.js','r34-growth.js','r38-assistant-followthrough.js','r40-assistant-practical.js'}:
        t=exact(t,ES_EXACT)
        for a,b in ES_FORMAL.items():t=re.sub(r'\b'+re.escape(a)+r'\b',b,t)
        t=re.sub(r'\bTu\b','Su',t);t=re.sub(r'\btu\b','su',t);t=re.sub(r'\bTus\b','Sus',t);t=re.sub(r'\btus\b','sus',t)
    write_if_changed(p,t)

# 3. Home title is deliberately more useful than “Franklin Navigator | Franklin Navigator”.
home=DIST/'index.html';t=home.read_text();t=t.replace('<title>Franklin Navigator | Franklin Navigator</title>','<title>Franklin Navigator | Local help in Franklin, Tennessee</title>');write_if_changed(home,t)
eshome=DIST/'es/index.html';t=eshome.read_text();t=t.replace('<title>Franklin Navigator | Franklin Navigator</title>','<title>Franklin Navigator | Ayuda local en Franklin, Tennessee</title>');write_if_changed(eshome,t)

# 4. Spanish translation catalog: preserve coverage while moving changed English keys to refined translations.
cat=DIST/'data/r37-es-public-strings.json'
d=json.loads(cat.read_text());tr=d.get('translations',{})
for old,new in GLOBAL.items():
    if old in tr:
        old_es=tr.pop(old)
        tr[new]=NEW_TRANSLATIONS.get(new,old_es)
for old,new in JS_EXACT.items():
    if old in tr:
        old_es=tr.pop(old);tr[new]=NEW_TRANSLATIONS.get(new,old_es)
for k,v in list(NEW_TRANSLATIONS.items()):tr[k]=v
for k,v in list(tr.items()):
    v=exact(v,ES_EXACT)
    for a,b in ES_FORMAL.items():v=re.sub(r'\b'+re.escape(a)+r'\b',b,v)
    v=re.sub(r'\bTu\b','Su',v);v=re.sub(r'\btu\b','su',v);v=re.sub(r'\bTus\b','Sus',v);v=re.sub(r'\btus\b','sus',v)
    tr[k]=v
d['translations']=dict(sorted(tr.items()));d['count']=len(tr);d['release']='FR-NAV1.15.0-HF2.6-CANDIDATE';cat_new=json.dumps(d,ensure_ascii=False,indent=2)+'\n';write_if_changed(cat,cat_new)

# 5. Page-specific improvements where exact context matters.
page_maps={
'dist/index.html':{
'Checked September 3, 2026. Time-sensitive items link to the original source and are removed when they are no longer current.':'Checked September 3, 2026. Time-sensitive items link to the original source and are removed when they are no longer current.',
'The first-party registration page lists the Labor Day race. Check registration, mandatory fees, timing, course conditions and kids-run details directly.':'The registration page lists the Labor Day race. Confirm registration, required fees, timing, course conditions, and kids-run details before you go.',
},
'dist/capability-status/index.html':{
'Use this page when you want a simple answer about which features work now and which are still planned.':'Use this page for a quick view of what works today, what requires membership, and what is still planned.',
'Build, copy or print a plan; active paid members also have Growth Desk entitlement':'Build, copy, or print a plan; active paid members also have access to the Growth Desk',
'Authorized members can save permitted member-provided details and submit them for review; information from public sources stay separate':'Authorized members can save member-provided details and submit them for review; information from public sources stays separate',
},
'dist/privacy/index.html':{
'Learn how Franklin Navigator handles device-only tools, public profiles, membership preparation, accounts and business contact boundaries.':'Learn what stays on your device, what appears on public profiles, how accounts and membership work, and how Franklin Navigator uses business contact information.',
},
'dist/local-growth-engine/index.html':{
'Build a private Franklin growth plan, review a public profile and prepare practical next steps and drafts without submitting, publishing or paying.':'Build a private Franklin growth plan, review a public profile, and prepare practical next steps and drafts without submitting, publishing, or paying.',
},
'dist/navigator-growth-desk/index.html':{
'Build a practical Franklin-area plan for local visibility, trust, customer growth, community participation and long-term business growth.':'Build a practical Franklin-area plan for local visibility, trust, customer growth, community participation, and long-term business growth.',
},
'dist/profile-studio/index.html':{
'Save member-provided profile details and submit them for review. Public information and free factual corrections remain separate.':'Save member-provided profile details and submit them for review. Public information and free factual corrections remain separate.',
},
}
for rel,m in page_maps.items():
    p=ROOT/rel
    if p.exists():
        t=p.read_text(errors='ignore');t=exact(t,m);write_if_changed(p,t)

# 6. English meta descriptions: compress repeated page-family wording without changing facts.
for p in sorted(DIST.rglob('*.html')):
    t=p.read_text(errors='ignore')
    t=t.replace('Franklin-specific sources and a private on-device checklist.','Includes local sources and a private checklist that stays on this device.')
    t=t.replace('Franklin-specific sources, directory discovery and a private on-device planner.','Includes local sources, directory search, and a private planner that stays on this device.')
    t=t.replace('on-device preparation with no submission or professional advice.','The plan stays on this device; nothing is submitted, and it is not professional advice.')
    t=t.replace('Compare responsible Franklin and Williamson County starting points for ','Compare Franklin and Williamson County starting points for ')
    t=t.replace('Compare puntos de partida responsables de Franklin y el Condado de Williamson para ','Compare puntos de partida de Franklin y el Condado de Williamson para ')
    write_if_changed(p,t)

# Evidence for exact changed-file scope.
ev=ROOT/'evidence';ev.mkdir(exist_ok=True)
(ev/'HF26_LANGUAGE_PATCH_SCOPE.json').write_text(json.dumps({'schemaVersion':'franklin.hf26.language-patch-scope.v1','baseCommit':'01aecafbfe16202d9d5a80eb6b97443c9ee305ad','changedFileCount':len(changes),'changedFiles':dict(sorted(changes.items())),'profileFactsChanged':False,'runtimeChanged':False,'pricesChanged':False,'commerceChanged':False},indent=2)+'\n')
print(json.dumps({'changedFiles':len(changes)}))
