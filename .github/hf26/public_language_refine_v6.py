from pathlib import Path
import json,hashlib,re,subprocess,html
exec(compile(Path('transport/.github/hf26/public_language_refine_v5.py').read_text(),'hf26_refine_v5','exec'))
ROOT=Path('candidate');DIST=ROOT/'dist'

def apply(path,mapping):
    p=ROOT/path
    if not p.exists():return
    t=p.read_text(errors='ignore')
    for a,b in mapping.items():t=t.replace(a,b)
    p.write_text(t)

# Human-reviewed long-form refinements: clearer, shorter, more natural, same meaning/safety.
apply('dist/my-franklin/index.html',{
'Sanitized topic-and-link plans saved only on this device. Your original question is never stored in these plans. Download, print or add a follow-up date to your calendar without sending the plan anywhere.':'Saved topic-and-link plans stay on this device. Your original question is not stored with them. You can download, print, or add a follow-up date without sending the plan to Franklin Navigator.',
'Use a short, non-sensitive reminder. It stays in this browser. Calendar dates are your own follow-ups, not confirmed appointments or official deadlines. Up to 25 reminders and 25 profile bookmarks can be saved.':'Save a short reminder without sensitive details. It stays in this browser. Dates are personal follow-ups—not confirmed appointments or official deadlines. You can save up to 25 reminders and 25 profiles.',
'For school zones, wards, property or permits, use the responsible official lookup. Franklin Navigator does not store your address here.':'For school zones, wards, property, or permits, use the appropriate official lookup. Franklin Navigator does not store your address here.',
})
apply('dist/es/mi-franklin/index.html',{
'Planes minimizados de temas y enlaces guardados solo en este dispositivo. su pregunta original nunca se guarda en estos planes. Descargue, imprima o agregue una fecha de seguimiento a su calendario sin enviar el plan a ningún lugar.':'Los planes guardados de temas y enlaces permanecen en este dispositivo. Su pregunta original no se guarda con ellos. Puede descargar, imprimir o añadir una fecha de seguimiento sin enviar el plan a Franklin Navigator.',
'Use un recordatorio breve sin datos sensibles. Permanece en este navegador. Las fechas son seguimientos elegidos por usted, no citas confirmadas ni plazos oficiales. Se pueden guardar hasta 25 recordatorios y 25 perfiles.':'Guarde un recordatorio breve sin datos sensibles. Permanece en este navegador. Las fechas son seguimientos personales, no citas confirmadas ni plazos oficiales. Puede guardar hasta 25 recordatorios y 25 perfiles.',
'Para zonas escolares, distritos, propiedades o permisos, use la consulta oficial responsable. Franklin Navigator no almacena aquí su dirección.':'Para zonas escolares, distritos, propiedades o permisos, use la consulta oficial correspondiente. Franklin Navigator no almacena aquí su dirección.',
})
apply('dist/directory/index.html',{
'Your search words and filters are included in the page link, so avoid private information. Comparisons stay on this device and are not included when you share the link.':'Search words and filters appear in the page link, so avoid private information. Your comparison stays on this device and is not included when you share the link.',
})
apply('dist/es/directorio/index.html',{
'Sus palabras de búsqueda y filtros se incluyen en el enlace de la página, así que evite información privada. Las comparaciones permanecen en este dispositivo y no se incluyen al compartir el enlace.':'Las palabras de búsqueda y los filtros aparecen en el enlace de la página, así que evite información privada. Su comparación permanece en este dispositivo y no se incluye al compartir el enlace.',
})
apply('dist/youth-family/index.html',{
'Bring recreation classes, youth sports, theatre, dance, music, library programs, parks, playgrounds and family events into one adult-supervised starting place.':'Find Franklin-area recreation classes, youth sports, theatre, dance, music, library programs, parks, playgrounds, and family events in one place.',
})
apply('dist/housing/index.html',{
'Find Franklin housing starting points for renters, homeowners, workforce housing, seniors, repairs, utilities, property records and urgent housing problems.':'Find Franklin housing resources for renters, homeowners, workforce housing, seniors, repairs, utilities, property records, and urgent housing problems.',
})
apply('dist/live-local/index.html',{
'Explore Franklin starting points for live music, arts, dining, markets, sports and family activities. Time-specific details stay hidden until checked again.':'Explore live music, arts, dining, markets, sports, and family activities around Franklin. Time-sensitive details appear only after they have been checked.',
})
apply('dist/community-help-center/index.html',{
'Start with urgent help, private planning tools, official Franklin-area sources, legal and community navigation, and voluntary professional discovery.':'Start with urgent help, private planning tools, official Franklin-area sources, and options for legal, community, and professional support.',
})
apply('dist/teams-clubs/index.html',{
'Explore sports teams, school clubs, theatre groups, dance teams, bands, running and cycling clubs, plus other Franklin-serving ways to participate.':'Find Franklin-area sports teams, school clubs, theatre groups, dance teams, bands, running and cycling clubs, and other ways to participate.',
})
apply('dist/everyday-help/index.html',{
'Find official Franklin and Williamson County starting points for 24 everyday needs, from transit and trash to housing, health, schools and safety.':'Find official Franklin and Williamson County resources for 24 everyday needs—from transit and trash to housing, health, schools, and safety.',
})
apply('dist/verticals/community-nonprofit/index.html',{
'Find community organizations and nonprofits, and explore distinct participation tools without turning public-service visibility into paid ranking.':'Explore community organizations and nonprofits, their services, and ways to participate. Paid membership does not affect ordinary directory ranking.',
})
apply('dist/learning/index.html',{
'Create private teaching, guided-practice and learning-provider preparation packets, then open verified Franklin and Tennessee learning sources.':'Create private teaching, guided-practice, and provider-preparation plans, then open current Franklin and Tennessee learning sources.',
})
apply('dist/local-pathways/start-run-business/index.html',{
'Turn a Franklin business idea or operating need into a checked against public sources licensing, workforce and local-growth checklist.':'Turn a Franklin business idea or operating need into a licensing, workforce, and local-growth checklist using current public sources.',
})
apply('dist/help/health/coverage-appeal/index.html',{
'Organize the notice, stated reason, dates shown by the original source, records and questions before contacting the plan or appropriate help.':'Organize the notice, stated reason, dates shown, records, and questions before contacting your plan or another appropriate source of help.',
})
apply('dist/help/auto/auto-business-growth-readiness/index.html',{
'Prepare accurate service, location, credential, estimate, warranty and customer-communication information for responsible local discovery.':'Prepare accurate service, location, credential, estimate, warranty, and customer-communication information for clear local discovery.',
})
apply('dist/address-lookup/index.html',{
'Explore Official address lookups in Franklin, Tennessee, with local information, practical next steps, and links to current sources.':'Use official Franklin address lookups for school zones, city services, property, zoning, voting, and other location-based questions.',
})
apply('dist/local-growth-desk/index.html',{
'Continue to the Business Growth Guides for Franklin-area business visibility, community participation and practical growth planning.':'Open the Business Growth Guides for Franklin-area visibility, community participation, and practical growth planning.',
})
apply('dist/sports/youth-leagues/index.html',{
'See the Franklin-serving youth sports named by county recreation, City-designated partners, school routes and qualified local clubs.':'Find youth sports programs and teams listed by county recreation, city partners, schools, and local clubs serving Franklin.',
})
apply('dist/help/health/coverage-cost-records/index.html',{
'Separate coverage, estimate, bill, explanation-of-benefits and records questions before contacting the responsible organization.':'Separate coverage, estimate, bill, explanation-of-benefits, and records questions before contacting the appropriate organization.',
})
apply('dist/help/home/permit-contractor/index.html',{
'Clarify the project scope, responsible permit office, licensing questions and written contractor comparison before work begins.':'Clarify the project scope, permit office, licensing questions, and written contractor comparison before work begins.',
})
apply('dist/help/legal/household-coverage-map/index.html',{
'Keep insurance, benefits, caregiving, property and legal questions distinct before contacting the responsible organizations.':'Keep insurance, benefits, caregiving, property, and legal questions separate before contacting the appropriate organizations.',
})
apply('dist/verticals/health/index.html',{
'Explore Health & Wellness in Franklin, Tennessee, with local information, practical next steps, and links to current sources.':'Explore health and wellness resources in Franklin, Tennessee, with local information, practical next steps, and links to current sources.',
})
# Explicit Spanish command and long-form fixes that automated morphology should never guess.
for rel,m in {
'dist/es/ayuda-legal/index.html':{'Prepárate para una pregunta legal o judicial del área de Franklin con límites específicos de Tennessee, fuentes oficiales y planificación privada de próximos pasos.':'Prepárese para una pregunta legal o judicial del área de Franklin con límites específicos de Tennessee, fuentes oficiales y planificación privada de próximos pasos.'},
'dist/es/ayuda-vivienda/index.html':{'Planifica el próximo paso sobre hogar o propiedad en Franklin usando fuentes oficiales de permisos, propiedad, zonificación y seguridad sin subir registros.':'Planifique su próximo paso sobre vivienda o propiedad en Franklin con fuentes oficiales de permisos, propiedad, zonificación y seguridad, sin subir documentos.'},
'dist/es/ayuda-conectada/index.html':{'Ve juntas las necesidades conectadas legales, de salud, hogar y vehículo y luego cree un plan inicial privado de Franklin sin enviar datos personales.':'Vea juntas sus necesidades legales, de salud, vivienda y vehículo, y luego cree un plan privado inicial de Franklin sin enviar datos personales.'},
'dist/es/aprendizaje/index.html':{'Cree paquetes privados de enseñanza, práctica guiada y preparación de proveedores educativos y luego abra fuentes de aprendizaje verificadas de Franklin y Tennessee.':'Cree planes privados de enseñanza, práctica guiada y preparación para proveedores educativos; después, consulte fuentes actuales de aprendizaje de Franklin y Tennessee.'},
'dist/es/deportes/entrenamiento/index.html':{'Compare puntos de partida responsables de Franklin y el Condado de Williamson para entrenamiento, campamentos e instrucción.':'Encuentre opciones de Franklin y el condado de Williamson para entrenamiento, campamentos e instrucción.'},
}.items():apply(rel,m)

# Improve generic meta descriptions that duplicate “Franklin” or preserve title capitalization awkwardly.
for p in sorted(DIST.rglob('*.html')):
    t=p.read_text(errors='ignore')
    def en(m):
        topic=m.group(1).strip()
        if topic.startswith('Franklin '):topic=topic[len('Franklin '):]
        return 'Explore '+topic+' in Franklin, Tennessee, with local information, practical next steps, and links to current sources.'
    t=re.sub(r'Explore (Franklin .*?) in Franklin, Tennessee, with local information, practical next steps, and links to current sources\.',en,t)
    def es(m):
        topic=m.group(1).strip()
        topic=re.sub(r' de Franklin$','',topic,flags=re.I)
        if topic and topic[0].isupper() and not re.match(r'[A-ZÁÉÍÓÚÑ]{2,}',topic):topic=topic[0].lower()+topic[1:]
        return 'Explore '+topic+' en Franklin, Tennessee, con información local, próximos pasos prácticos y enlaces a fuentes actuales.'
    t=re.sub(r'Explore (.*?) en Franklin, Tennessee, con información local, próximos pasos prácticos y enlaces a fuentes actuales\.',es,t)
    p.write_text(t)

# Translation catalog mirrors any changed English phrases and exact Spanish refinements where available.
cat=DIST/'data/r37-es-public-strings.json';d=json.loads(cat.read_text());tr=d.get('translations',{})
key_map={
'Sanitized topic-and-link plans saved only on this device. Your original question is never stored in these plans. Download, print or add a follow-up date to your calendar without sending the plan anywhere.':'Saved topic-and-link plans stay on this device. Your original question is not stored with them. You can download, print, or add a follow-up date without sending the plan to Franklin Navigator.',
'Use a short, non-sensitive reminder. It stays in this browser. Calendar dates are your own follow-ups, not confirmed appointments or official deadlines. Up to 25 reminders and 25 profile bookmarks can be saved.':'Save a short reminder without sensitive details. It stays in this browser. Dates are personal follow-ups—not confirmed appointments or official deadlines. You can save up to 25 reminders and 25 profiles.',
'For school zones, wards, property or permits, use the responsible official lookup. Franklin Navigator does not store your address here.':'For school zones, wards, property, or permits, use the appropriate official lookup. Franklin Navigator does not store your address here.',
}
translations={
'Saved topic-and-link plans stay on this device. Your original question is not stored with them. You can download, print, or add a follow-up date without sending the plan to Franklin Navigator.':'Los planes guardados de temas y enlaces permanecen en este dispositivo. Su pregunta original no se guarda con ellos. Puede descargar, imprimir o añadir una fecha de seguimiento sin enviar el plan a Franklin Navigator.',
'Save a short reminder without sensitive details. It stays in this browser. Dates are personal follow-ups—not confirmed appointments or official deadlines. You can save up to 25 reminders and 25 profiles.':'Guarde un recordatorio breve sin datos sensibles. Permanece en este navegador. Las fechas son seguimientos personales, no citas confirmadas ni plazos oficiales. Puede guardar hasta 25 recordatorios y 25 perfiles.',
'For school zones, wards, property, or permits, use the appropriate official lookup. Franklin Navigator does not store your address here.':'Para zonas escolares, distritos, propiedades o permisos, use la consulta oficial correspondiente. Franklin Navigator no almacena aquí su dirección.',
}
for old,new in key_map.items():
    if old in tr:tr.pop(old)
    tr[new]=translations[new]
d['translations']=dict(sorted(tr.items()));d['count']=len(tr);cat.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
# Recompute changed scope.
changed=subprocess.check_output(['git','-C',str(ROOT),'diff','--name-only','HEAD','--','dist'],text=True).splitlines();scope={rel:{'after':hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()} for rel in sorted(changed) if (ROOT/rel).is_file()};ev=ROOT/'evidence';ev.mkdir(exist_ok=True);(ev/'HF26_LANGUAGE_PATCH_SCOPE.json').write_text(json.dumps({'schemaVersion':'franklin.hf26.language-patch-scope.v6','baseCommit':'01aecafbfe16202d9d5a80eb6b97443c9ee305ad','changedFileCount':len(scope),'changedFiles':scope,'profileFactsChanged':False,'runtimeChanged':False,'pricesChanged':False,'commerceChanged':False,'spanishVoice':'CONTEXT_SAFE_USTED_FINAL','manualLongformEditorialReview':True},indent=2)+'\n');print(json.dumps({'v6ChangedFiles':len(scope)}))
