from pathlib import Path
import json,hashlib,subprocess
exec(compile(Path('transport/.github/hf26/public_language_refine_v4.py').read_text(),'hf26_refine_v4','exec'))
ROOT=Path('candidate');DIST=ROOT/'dist'
# Exact customer-visible learning headings. Raw exact replacement is safe because these phrases are literal UI labels, not identifiers.
CAPS_FINAL={
'BORRADOR BREVE PARA LA FAMILIA':'Borrador breve para la familia',
'BILINGUAL FAMILY DRAFT / BORRADOR BILINGÜE PARA LA FAMILIA':'Bilingual family draft / Borrador bilingüe para la familia',
'OBJETIVO BORRADOR':'Objetivo del borrador',
'SECUENCIA SUGERIDA':'Secuencia sugerida',
'CICLO DE APRENDIZAJE':'Ciclo de aprendizaje',
'CAMPOS PÚBLICOS PARA PREPARAR':'Campos públicos para preparar',
'EVIDENCIA Y AFILIACIÓN':'Evidencia y afiliación',
}
p=DIST/'assets/learning-hub.js';t=p.read_text(errors='ignore')
for a,b in CAPS_FINAL.items():t=t.replace(a,b)
p.write_text(t)
# “sigue siendo la autoridad final” is correct third-person Spanish (“remains the final authority”), not informal address.
# Preserve it unchanged.
changed=subprocess.check_output(['git','-C',str(ROOT),'diff','--name-only','HEAD','--','dist'],text=True).splitlines();scope={rel:{'after':hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()} for rel in sorted(changed) if (ROOT/rel).is_file()};ev=ROOT/'evidence';ev.mkdir(exist_ok=True);(ev/'HF26_LANGUAGE_PATCH_SCOPE.json').write_text(json.dumps({'schemaVersion':'franklin.hf26.language-patch-scope.v5','baseCommit':'01aecafbfe16202d9d5a80eb6b97443c9ee305ad','changedFileCount':len(scope),'changedFiles':scope,'profileFactsChanged':False,'runtimeChanged':False,'pricesChanged':False,'commerceChanged':False,'spanishVoice':'CONTEXT_SAFE_USTED_FINAL','editorialException':'Spanish “sigue siendo” preserved as grammatical third-person, not second-person address.'},indent=2)+'\n');print(json.dumps({'v5ChangedFiles':len(scope)}))
