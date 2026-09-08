from pathlib import Path
import ast,html,json,re,subprocess,hashlib

ROOT=Path('candidate');DIST=ROOT/'dist';PATCH=Path('transport/.github/hf26/public_language_patch.py')

def dictionaries():
    tree=ast.parse(PATCH.read_text())
    out={}
    for n in tree.body:
        if isinstance(n,ast.Assign) and len(n.targets)==1 and isinstance(n.targets[0],ast.Name) and n.targets[0].id in {'GLOBAL','JS_EXACT','ES_EXACT','NEW_TRANSLATIONS'}:
            out[n.targets[0].id]=ast.literal_eval(n.value)
    return out
D=dictionaries();GLOBAL=D['GLOBAL'];JS_EXACT=D['JS_EXACT'];ES_EXACT=D['ES_EXACT'];NEW_TRANSLATIONS=D['NEW_TRANSLATIONS']

def exact(t,m):
    for a,b in m.items():t=t.replace(a,b)
    return t

def base_bytes(rel):return subprocess.check_output(['git','-C',str(ROOT),'show','HEAD:'+rel])
def restore(rel):
    p=ROOT/rel;p.write_bytes(base_bytes(rel));return p

# Formal Spanish without blanket token substitutions. Possessives and unambiguous conjugations are safe globally;
# imperatives are changed only at sentence/label starts or after coordinating punctuation/conjunctions.
PRONOUNS={r'\b[Tt]ú\b':'usted',r'\b[Tt]u\b':'su',r'\b[Tt]us\b':'sus',r'\b[Pp]uedes\b':'puede',r'\b[Qq]uieres\b':'quiere',r'\b[Tt]ienes\b':'tiene',r'\b[Nn]ecesitas\b':'necesita',r'\b[Dd]ebes\b':'debe'}
IMPERATIVES={
'Elige':'Elija','Selecciona':'Seleccione','Confirma':'Confirme','Revisa':'Revise','Usa':'Use','Utiliza':'Utilice','Abre':'Abra','Busca':'Busque','Filtra':'Filtre','Compara':'Compare','Guarda':'Guarde','Escribe':'Escriba','Introduce':'Introduzca','Ingresa':'Ingrese','Haz':'Haga','Mantén':'Mantenga','Verifica':'Verifique','Evita':'Evite','Solicita':'Solicite','Crea':'Cree','Prepara':'Prepare','Organiza':'Organice','Encuentra':'Encuentre','Explora':'Explore','Lee':'Lea','Añade':'Añada','Adjunta':'Adjunte','Reinicia':'Reinicie','Empieza':'Empiece','Conoce':'Conozca',
}
# Ambiguous nouns such as marca, consulta, copia, descarga and elimina are intentionally not blanket-converted.
def formalize(t):
    for pat,repl in PRONOUNS.items():t=re.sub(pat,repl,t)
    for inf,form in IMPERATIVES.items():
        low=inf[:1].lower()+inf[1:];flow=form[:1].lower()+form[1:]
        t=re.sub(r'(^|[.!?;:]\s+|[>])'+re.escape(inf)+r'\b',lambda m:m.group(1)+form,t)
        t=re.sub(r'\b(y|luego|después|también|primero|ahora)\s+'+re.escape(low)+r'\b',lambda m:m.group(1)+' '+flow,t,flags=re.I)
        t=re.sub(r'([,;:]\s+)'+re.escape(low)+r'\b',lambda m:m.group(1)+flow,t)
    # Exact contextual forms that are ambiguous as nouns in other contexts.
    contexts={
      '¿Qué quieres recordar?':'¿Qué quiere recordar?',
      'Tu área':'Su área','Tu panel de Franklin':'Su panel de Franklin',
      'Copia la URL del navegador':'Copie la URL del navegador',
      'Descarga, imprime o agrega una fecha de seguimiento a su calendario':'Descargue, imprima o agregue una fecha de seguimiento a su calendario',
      'La descarga del calendario no estuvo disponible.':'La descarga del calendario no estuvo disponible.',
      'Esto elimina preferencias, marcadores, recordatorios y planes.':'Esto elimina preferencias, marcadores, recordatorios y planes.',
      'usa la consulta oficial':'use la consulta oficial',
      'Usa consultas oficiales':'Use consultas oficiales',
      'Copia guardada.':'Copia guardada.',
    }
    return exact(t,contexts)

# Restore every Spanish page from exact live base and reapply only safe/public wording changes.
for p in sorted((DIST/'es').rglob('*.html')):
    rel=p.relative_to(ROOT).as_posix();restore(rel);t=p.read_text(errors='ignore');t=exact(t,GLOBAL);t=exact(t,ES_EXACT);t=formalize(t)
    t=t.replace('aria-label="Principal"','aria-label="Navegación principal"').replace('aria-label="Footer"','aria-label="Navegación del pie de página"')
    t=t.replace('FR-NAV1.15.0-CANDIDATE-R40','FR-NAV1.15.0-HF2.6-CANDIDATE').replace('FR-NAV1.15.0-HF2.5-CANDIDATE','FR-NAV1.15.0-HF2.6-CANDIDATE')
    p.write_text(t)

# Restore public JS files that contain Spanish-facing copy, then apply exact editorial changes and context-safe formalization.
spanish_js={'navigator-bot.js','navigator-bot-es.js','r27-home.js','r30-situation.js','r31-connected-prep.js','r32-notice-organizer.js','r33-prep.js','r34-growth.js','r38-assistant-followthrough.js','r40-assistant-practical.js','learning-hub.js','my-franklin.js','community-explorer.js','local-discovery.js'}
for name in spanish_js:
    rel='dist/assets/'+name;p=ROOT/rel
    if not p.exists():continue
    restore(rel);t=p.read_text(errors='ignore');t=exact(t,GLOBAL);t=exact(t,JS_EXACT);t=t.replace('responsible sources','relevant sources').replace('responsible source','relevant source').replace('at the first-party source','at the original source').replace('from a first-party source','from the organization’s own source');t=exact(t,ES_EXACT);t=formalize(t);p.write_text(t)

# Rebuild the dynamic Spanish translation catalog from the exact base catalog.
rel='dist/data/r37-es-public-strings.json';cat=restore(rel);data=json.loads(cat.read_text());tr=data.get('translations',{})
for old,new in GLOBAL.items():
    if old in tr:tr[new]=NEW_TRANSLATIONS.get(new,formalize(exact(tr.pop(old),ES_EXACT)))
for old,new in JS_EXACT.items():
    if old in tr:tr[new]=NEW_TRANSLATIONS.get(new,formalize(exact(tr.pop(old),ES_EXACT)))
for k,v in NEW_TRANSLATIONS.items():tr[k]=v
for k,v in list(tr.items()):tr[k]=formalize(exact(v,ES_EXACT))
data['translations']=dict(sorted(tr.items()));data['count']=len(tr);data['release']='FR-NAV1.15.0-HF2.6-CANDIDATE';cat.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

# Reapply key page-specific Spanish/editorial fixes after restoration.
page_exact={
'dist/es/index.html':{
 '<title>Franklin Navigator | Franklin Navigator</title>':'<title>Franklin Navigator | Ayuda local en Franklin, Tennessee</title>',
 'Haga una pregunta, vea qué ocurre en Franklin, realice tareas y encuentre organizaciones locales.':'Encuentre servicios locales, recursos oficiales, eventos, organizaciones comunitarias y próximos pasos prácticos en Franklin, Tennessee.',
},
'dist/es/negocios/index.html':{
 'Revise su perfil de Franklin, use herramientas comunitarias gratuitas, pregunte a Franklin Assistant y previsualice la Membresía Comunitaria o Charter.':'Revise su perfil de Franklin, use herramientas comunitarias gratuitas, pregunte a Franklin Assistant y explore las opciones de Membresía Comunitaria o Charter.',
},
'dist/es/privacidad/index.html':{
 'Conozca cómo Franklin Navigator gestiona herramientas que funcionan solo en el dispositivo, perfiles públicos, preparación de membresía, cuentas y límites de contacto empresarial.':'Conozca qué información permanece en su dispositivo, qué aparece en los perfiles públicos, cómo funcionan las cuentas y la membresía y cómo usa Franklin Navigator la información de contacto empresarial.',
},
}
for rel,m in page_exact.items():
    p=ROOT/rel
    if p.exists():p.write_text(exact(p.read_text(),m))

# Concise, useful metadata. Profile titles already carry the organization name, so long descriptions can stay readable and factual.
def clean_title(raw):
    s=html.unescape(re.sub(r'<[^>]+>','',raw)).strip();s=re.sub(r'\s*\|\s*Franklin Navigator\s*$','',s).strip();return s

def short_description(rel,title,current,lang):
    if rel.startswith('profiles/'):
        return ('Información pública, datos de contacto disponibles y notas de fuentes para este perfil del área de Franklin.' if lang=='es' else 'Public listing details, available contact information, and source notes for this Franklin-area profile.')
    # Keep a meaningful first sentence when it is already concise.
    first=re.split(r'(?<=[.!?])\s+',html.unescape(current).strip())[0].strip()
    if len(first)<=155 and len(first)>=45:return first
    label=clean_title(title)
    if lang=='es':
        desc=f'Explore {label} en Franklin, Tennessee, con información local, próximos pasos prácticos y enlaces a fuentes actuales.'
        if len(desc)>165:desc='Explore esta guía de Franklin Navigator con información local, próximos pasos prácticos y enlaces a fuentes actuales.'
    else:
        desc=f'Explore {label} in Franklin, Tennessee, with local information, practical next steps, and links to current sources.'
        if len(desc)>165:desc='Explore this Franklin Navigator guide for local information, practical next steps, and links to current sources.'
    return desc

def replace_attr(tag,name,value):
    esc=html.escape(value,quote=True)
    pat=re.compile(r'('+re.escape(name)+r'\s*=\s*["\'])(.*?)(["\'])',re.I|re.S)
    return pat.sub(lambda m:m.group(1)+esc+m.group(3),tag,count=1)

def refine_meta_text(text,rel):
    tm=re.search(r'<title[^>]*>(.*?)</title>',text,re.I|re.S);title=tm.group(1) if tm else 'Franklin Navigator';lang='es' if rel.startswith('es/') else 'en';primary=None
    tags=list(re.finditer(r'<meta\b[^>]*>',text,re.I|re.S));repls=[]
    for m in tags:
        tag=m.group(0)
        if re.search(r'\bname\s*=\s*["\']description["\']',tag,re.I):
            cm=re.search(r'\bcontent\s*=\s*["\'](.*?)["\']',tag,re.I|re.S)
            if cm:
                cur=html.unescape(cm.group(1));primary=short_description(rel,title,cur,lang) if len(cur)>165 else cur
                repls.append((m.start(),m.end(),replace_attr(tag,'content',primary)))
    if primary:
        for m in tags:
            tag=m.group(0)
            if re.search(r'\bproperty\s*=\s*["\']og:description["\']',tag,re.I):repls.append((m.start(),m.end(),replace_attr(tag,'content',primary)))
    for a,b,c in sorted(repls,reverse=True):text=text[:a]+c+text[b:]
    return text
for p in sorted(DIST.rglob('*.html')):
    rel=p.relative_to(DIST).as_posix();p.write_text(refine_meta_text(p.read_text(errors='ignore'),rel))

# Recompute changed-file scope against immutable base after all safe refinements.
changes={}
for p in sorted(DIST.rglob('*')):
    if not p.is_file():continue
    rel=p.relative_to(ROOT).as_posix()
    try:before=base_bytes(rel)
    except subprocess.CalledProcessError:before=b''
    after=p.read_bytes()
    if before!=after:changes[rel]={'before':hashlib.sha256(before).hexdigest(),'after':hashlib.sha256(after).hexdigest()}
ev=ROOT/'evidence';ev.mkdir(exist_ok=True);(ev/'HF26_LANGUAGE_PATCH_SCOPE.json').write_text(json.dumps({'schemaVersion':'franklin.hf26.language-patch-scope.v2','baseCommit':'01aecafbfe16202d9d5a80eb6b97443c9ee305ad','changedFileCount':len(changes),'changedFiles':changes,'profileFactsChanged':False,'runtimeChanged':False,'pricesChanged':False,'commerceChanged':False,'spanishVoice':'CONTEXT_SAFE_USTED'},indent=2)+'\n')
print(json.dumps({'refinedChangedFiles':len(changes)}))
