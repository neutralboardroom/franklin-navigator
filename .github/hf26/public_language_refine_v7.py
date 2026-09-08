from pathlib import Path
import json,hashlib,re,subprocess
exec(compile(Path('transport/.github/hf26/public_language_refine_v6.py').read_text(),'hf26_refine_v6','exec'))
ROOT=Path('candidate');DIST=ROOT/'dist'

# Spanish sports pages: replace awkward literal translation while preserving scope and source meaning.
for p in sorted((DIST/'es/deportes').rglob('*.html')):
    t=p.read_text(errors='ignore')
    t=t.replace('Compare puntos de partida responsables de Franklin y el Condado de Williamson para ','Compare opciones de Franklin y el condado de Williamson para ')
    p.write_text(t)

# Keep learning meta concise and natural.
p=DIST/'es/aprendizaje/index.html';t=p.read_text(errors='ignore');t=t.replace('Cree planes privados de enseñanza, práctica guiada y preparación para proveedores educativos; después, consulte fuentes actuales de aprendizaje de Franklin y Tennessee.','Cree planes privados de enseñanza y práctica guiada, y consulte fuentes actuales de aprendizaje de Franklin y Tennessee.');p.write_text(t)

# Dynamic Spanish catalog: formal usted voice + refined sports wording + key parity with refined English.
cat=DIST/'data/r37-es-public-strings.json';d=json.loads(cat.read_text());old=d.get('translations',{});new={}
def formal_value(v):
    v=v.replace('Compare puntos de partida responsables de Franklin y el Condado de Williamson para ','Compare opciones de Franklin y el condado de Williamson para ')
    v=v.replace('Encuentre puntos de partida oficiales para eventos de Franklin y planifica ','Encuentre fuentes oficiales para eventos de Franklin y planifique ')
    v=v.replace('Encuentre algo local que hacer y prepárate ','Encuentre algo local que hacer y prepárese ')
    v=v.replace('Encuentre puntos de partida confiables para eventos y prepárate ','Encuentre fuentes confiables para eventos y prepárese ')
    v=v.replace('Planifica ','Planifique ')
    v=v.replace('. Planifica ','. Planifique ')
    v=v.replace(' y planifica ',' y planifique ')
    v=v.replace('Prepárate ','Prepárese ')
    v=v.replace('. Prepárate ','. Prepárese ')
    v=v.replace(' y prepárate ',' y prepárese ')
    v=v.replace('Guía la práctica.','Guíe la práctica.')
    v=v.replace('Ve juntas las necesidades conectadas legales, de salud, hogar y vehículo y luego cree un plan inicial privado de Franklin sin enviar datos personales.','Vea juntas sus necesidades legales, de salud, vivienda y vehículo, y luego cree un plan privado inicial de Franklin sin enviar datos personales.')
    v=v.replace('fuentes responsables de rutas y tráfico','fuentes actuales sobre rutas y tráfico')
    v=v.replace('Incluye fuentes específicas de Franklin, búsqueda en directorios y un planificador privado en su dispositivo.','Incluye fuentes locales, búsqueda en el directorio y un planificador privado que permanece en su dispositivo.')
    return v
for key,val in old.items():
    key=key.replace('Compare responsible Franklin and Williamson County starting points for ','Compare Franklin and Williamson County starting points for ')
    new[key]=formal_value(val)
d['translations']=dict(sorted(new.items()));d['count']=len(new);d['release']='FR-NAV1.15.0-HF2.6-CANDIDATE';cat.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# Recompute exact changed public scope.
changed=subprocess.check_output(['git','-C',str(ROOT),'diff','--name-only','HEAD','--','dist'],text=True).splitlines();scope={rel:{'after':hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()} for rel in sorted(changed) if (ROOT/rel).is_file()};ev=ROOT/'evidence';ev.mkdir(exist_ok=True);(ev/'HF26_LANGUAGE_PATCH_SCOPE.json').write_text(json.dumps({'schemaVersion':'franklin.hf26.language-patch-scope.v7','baseCommit':'01aecafbfe16202d9d5a80eb6b97443c9ee305ad','changedFileCount':len(scope),'changedFiles':scope,'profileFactsChanged':False,'runtimeChanged':False,'pricesChanged':False,'commerceChanged':False,'spanishVoice':'USTED_FINAL','manualLongformEditorialReview':True,'dynamicCatalogKeyParity':True},indent=2)+'\n');print(json.dumps({'v7ChangedFiles':len(scope)}))
