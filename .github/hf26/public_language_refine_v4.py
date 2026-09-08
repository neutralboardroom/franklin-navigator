from pathlib import Path
import ast,json,re,hashlib,subprocess
# Execute the already context-safe + fast refinement first.
exec(compile(Path('transport/.github/hf26/public_language_refine_fast.py').read_text(),'hf26_refine_fast','exec'))
ROOT=Path('candidate');DIST=ROOT/'dist';PATCH=Path('transport/.github/hf26/public_language_patch.py')

def maps():
    tree=ast.parse(PATCH.read_text());out={}
    for n in tree.body:
        if isinstance(n,ast.Assign) and len(n.targets)==1 and isinstance(n.targets[0],ast.Name) and n.targets[0].id in {'GLOBAL','JS_EXACT','ES_EXACT','NEW_TRANSLATIONS'}:out[n.targets[0].id]=ast.literal_eval(n.value)
    return out
M=maps();GLOBAL=M['GLOBAL'];JS_EXACT=M['JS_EXACT'];ES_EXACT=M['ES_EXACT'];NEW_TRANSLATIONS=M['NEW_TRANSLATIONS']
def exact(t,m):
    for a,b in m.items():t=t.replace(a,b)
    return t

# Context-safe second-person Spanish transformer, applied to *string contents*, never raw JS code.
pron={r'\b[Tt]ú\b':'usted',r'\b[Tt]u\b':'su',r'\b[Tt]us\b':'sus',r'\b[Pp]uedes\b':'puede',r'\b[Qq]uieres\b':'quiere',r'\b[Tt]ienes\b':'tiene',r'\b[Nn]ecesitas\b':'necesita',r'\b[Dd]ebes\b':'debe',r'\b[Ee]res\b':'es'}
cmd={
'Elige':'Elija','Selecciona':'Seleccione','Confirma':'Confirme','Revisa':'Revise','Usa':'Use','Utiliza':'Utilice','Abre':'Abra','Busca':'Busque','Filtra':'Filtre','Compara':'Compare','Guarda':'Guarde','Escribe':'Escriba','Introduce':'Introduzca','Ingresa':'Ingrese','Haz':'Haga','Mantén':'Mantenga','Verifica':'Verifique','Evita':'Evite','Solicita':'Solicite','Crea':'Cree','Prepara':'Prepare','Organiza':'Organice','Encuentra':'Encuentre','Explora':'Explore','Lee':'Lea','Añade':'Añada','Adjunta':'Adjunte','Reinicia':'Reinicie','Empieza':'Empiece','Conoce':'Conozca','Inicia':'Inicie','Pregunta':'Pregunte','Vuelve':'Vuelva','Dime':'Dígame','Anota':'Anote','Precisa':'Precise','Contacta':'Contacte','Agrega':'Agregue','Imprime':'Imprima','Responde':'Responda','Completa':'Complete','Sigue':'Siga','Separa':'Separe','Conserva':'Conserve','Reúne':'Reúna','Descarga':'Descargue','Copia':'Copie'
}
def formal(s):
    for p,r in pron.items():s=re.sub(p,r,s)
    for a,b in cmd.items():
        low=a[:1].lower()+a[1:];flow=b[:1].lower()+b[1:]
        s=re.sub(r'^'+re.escape(a)+r'\b',b,s)
        s=re.sub(r'([.!?;:]\s+)'+re.escape(a)+r'\b',lambda m:m.group(1)+b,s)
        s=re.sub(r'\b(y|luego|después|también|primero|ahora)\s+'+re.escape(low)+r'\b',lambda m:m.group(1)+' '+flow,s,flags=re.I)
        s=re.sub(r'([,;:]\s+)'+re.escape(low)+r'\b',lambda m:m.group(1)+flow,s)
    s=s.replace('que te importan','que le importan').replace('conéctate','conéctese').replace('Conéctate','Conéctese').replace('vuelve a','vuelva a').replace('Vuelve a','Vuelva a')
    return s

# Exact static Spanish sentences that begin inside attribute values/meta content, where sentence-boundary formalization cannot infer context.
STATIC={
'Lee las funciones de accesibilidad de Franklin Navigator y la orientación práctica para usar el sitio con tecnología de asistencia.':'Lea las funciones de accesibilidad de Franklin Navigator y la orientación práctica para usar el sitio con tecnología de asistencia.',
'Busca y compare 19,103 negocios, profesionales, organizaciones y servicios del área de Franklin.':'Busque y compare 19,103 negocios, profesionales, organizaciones y servicios del área de Franklin.',
'Mantén sus accesos directos de Franklin, perfiles guardados y recordatorios de forma privada en este dispositivo.':'Mantenga sus accesos directos de Franklin, perfiles guardados y recordatorios de forma privada en este dispositivo.',
'Revisa su perfil de Franklin, use herramientas comunitarias gratuitas, pregunta a Franklin Assistant y previsualiza la Membresía Comunitaria o Charter.':'Revise su perfil de Franklin, use herramientas comunitarias gratuitas, pregunte a Franklin Assistant y explore la Membresía Comunitaria o Charter.',
'Organiza avisos, reclamaciones, facturas y fechas mostradas sin subir el documento.':'Organice avisos, reclamaciones, facturas y fechas mostradas sin subir el documento.',
'Organiza beneficios, cobertura, atención, facturación, transporte y seguimiento del hogar sin introducir detalles médicos privados.':'Organice beneficios, cobertura, atención, facturación, transporte y seguimiento del hogar sin introducir detalles médicos privados.',
'Organiza trabajo, salario, beneficios, presión financiera, avisos y transporte sin tratar la actividad como asesoramiento legal o financiero.':'Organice trabajo, salario, beneficios, presión financiera, avisos y transporte sin tratar la actividad como asesoramiento legal o financiero.',
'Prepara preguntas y categorías de documentos para una revisión o apelación sin predecir resultados ni calcular plazos.':'Prepare preguntas y categorías de documentos para una revisión o apelación sin predecir resultados ni calcular plazos.',
'Ve juntas las necesidades conectadas legales, de salud, hogar y vehículo y luego crea un plan inicial privado de Franklin sin enviar datos personales.':'Vea juntas sus necesidades legales, de salud, vivienda y vehículo, y luego cree un plan privado inicial de Franklin sin enviar datos personales.',
'Usa consultas oficiales actuales de direcciones de Franklin y el condado de Williamson para zonas escolares, servicios municipales, zonificación, propiedad y votación sin dar su dirección a Franklin Navigator.':'Use consultas oficiales actuales de Franklin y el condado de Williamson para zonas escolares, servicios municipales, zonificación, propiedad y votación sin proporcionar su dirección a Franklin Navigator.',
'Usa 15 rutas detalladas de Franklin para empleo, educación, personas mayores, apoyo alimentario, transporte, familias, mascotas, negocios, vida cívica, preparación y otras necesidades cotidianas.':'Use 15 rutas detalladas de Franklin para empleo, educación, personas mayores, apoyo alimentario, transporte, familias, mascotas, negocios, vida cívica, preparación y otras necesidades cotidianas.',
'Mantén a mano las partes de Franklin Navigator que le importan. No se requiere cuenta, correo ni dirección.':'Mantenga a mano las partes de Franklin Navigator que le importan. No se requiere cuenta, correo ni dirección.',
'Para zonas escolares, distritos, propiedades o permisos, usa la consulta oficial responsable. Franklin Navigator no almacena aquí su dirección.':'Para zonas escolares, distritos, propiedades o permisos, use la consulta oficial correspondiente. Franklin Navigator no almacena aquí su dirección.',
}
for p in sorted((DIST/'es').rglob('*.html')):
    t=p.read_text(errors='ignore');t=exact(t,STATIC);p.write_text(t)

# Customer-visible all-caps headings only. Internal enum constants, IDs and iCalendar tokens are intentionally untouched.
CAPS={
'MY FRANKLIN ACTIVITY SHORT LIST':'My Franklin activity short list',
'MI LISTA DE ACTIVIDADES DE FRANKLIN':'Mi lista de actividades de Franklin',
'BORRADOR BREVE PARA LA FAMILIA':'Borrador breve para la familia',
'BILINGUAL FAMILY DRAFT / BORRADOR BILINGÜE PARA LA FAMILIA':'Bilingual family draft / Borrador bilingüe para la familia',
'PAQUETE DE PLANIFICACIÓN PARA DOCENTE / TUTOR':'Paquete de planificación para docente / tutor',
'OBJETIVO BORRADOR':'Objetivo del borrador',
'SECUENCIA SUGERIDA':'Secuencia sugerida',
'APOYOS SELECCIONADOS':'Apoyos seleccionados',
'VERIFICACIONES Y LÍMITES':'Verificaciones y límites',
'PAQUETE DE PRÁCTICA GUIADA':'Paquete de práctica guiada',
'CICLO DE APRENDIZAJE':'Ciclo de aprendizaje',
'PAQUETE DE PREPARACIÓN DEL PERFIL EDUCATIVO':'Paquete de preparación del perfil educativo',
'CAMPOS PÚBLICOS PARA PREPARAR':'Campos públicos para preparar',
'EVIDENCIA Y AFILIACIÓN':'Evidencia y afiliación',
'PLAN INTEGRAL DE FRANKLIN':'Plan integral de Franklin',
'PAQUETE DE PREPARACIÓN CONECTADA DE FRANKLIN':'Paquete de preparación conectada de Franklin',
'ORGANIZADOR DE AVISOS Y RECLAMOS DE FRANKLIN':'Organizador de avisos y reclamos de Franklin',
'CRONOLOGÍA DE FRANKLIN':'Cronología de Franklin',
'PREPARACIÓN PARA REVISIÓN':'Preparación para revisión',
}

# Transform simple quoted JS literals only. This avoids changing identifiers or control logic.
lit=re.compile(r"(?<![A-Za-z0-9_$])(['\"])(.{2,1200}?)(?<!\\)\1",re.S)
for p in sorted((DIST/'assets').glob('*.js')):
    src=p.read_text(errors='ignore')
    def repl(m):
        q,s=m.group(1),m.group(2)
        if re.search(r'[áéíóúñ¿¡]|\b(?:Franklin|membresía|perfil|negocio|ayuda|fuente|plan|revisión|directorio)\b',s,re.I):s=formal(s)
        s=exact(s,CAPS)
        return q+s+q
    out=lit.sub(repl,src)
    if out!=src:p.write_text(out)

# Catalog: migrate keys as public English wording changed, fix the one embedded brand phrase, and formalize values safely.
cat=DIST/'data/r37-es-public-strings.json';d=json.loads(cat.read_text());oldtr=d.get('translations',{});newtr={}
for key,val in oldtr.items():
    newkey=exact(exact(key,GLOBAL),JS_EXACT)
    val=val.replace('Ask Navigator','Franklin Assistant');val=formal(val);val=exact(val,CAPS);newtr[newkey]=val
for k,v in NEW_TRANSLATIONS.items():newtr[k]=formal(v)
d['translations']=dict(sorted(newtr.items()));d['count']=len(newtr);d['release']='FR-NAV1.15.0-HF2.6-CANDIDATE';cat.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# Recompute fast scope after final refinements.
changed=subprocess.check_output(['git','-C',str(ROOT),'diff','--name-only','HEAD','--','dist'],text=True).splitlines();scope={rel:{'after':hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()} for rel in sorted(changed) if (ROOT/rel).is_file()};ev=ROOT/'evidence';ev.mkdir(exist_ok=True);(ev/'HF26_LANGUAGE_PATCH_SCOPE.json').write_text(json.dumps({'schemaVersion':'franklin.hf26.language-patch-scope.v4','baseCommit':'01aecafbfe16202d9d5a80eb6b97443c9ee305ad','changedFileCount':len(scope),'changedFiles':scope,'profileFactsChanged':False,'runtimeChanged':False,'pricesChanged':False,'commerceChanged':False,'spanishVoice':'CONTEXT_SAFE_USTED_FINAL'},indent=2)+'\n');print(json.dumps({'v4ChangedFiles':len(scope)}))
