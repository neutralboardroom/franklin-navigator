#!/usr/bin/env python3
from __future__ import annotations
import json, pathlib, re
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence/hf31/SPANISH_LANGUAGE_FINAL_REPORT.json'

EXACT={
 'Contacta directamente a la organización responsable':'Contacte directamente con la organización responsable',
 'Encuentre algo local que hacer y prepárate antes de ir.':'Encuentre algo local que hacer y prepárese antes de ir.',
 'Estos enlaces te ayudan a llegar':'Estos enlaces le ayudan a llegar',
 'Enseña el concepto; no completa trabajos evaluados ni pruebas restringidas.':'Enseñe el concepto; no complete trabajos evaluados ni pruebas restringidas.',
 'Estos enlaces oficiales o de primera mano te ayudan a encontrar recursos':'Estos enlaces oficiales y de organizaciones locales le ayudan a encontrar recursos',
 'El Centro de Aprendizaje inicial usa la ruta gratuita existente de Franklin':'El Centro de Aprendizaje utiliza las herramientas gratuitas existentes de Franklin',
 'Consulta la fuente del recinto o productor antes de comprar, viajar o audicionar.':'Consulte la fuente del recinto o productor antes de comprar, viajar o presentarse a una audición.',
 'Empiece con una situación real, no con una categoría. Franklin Assistant te ayuda':'Empiece con una situación real, no con una categoría. Franklin Assistant le ayuda',
 'Franklin Assistant forma parte de Franklin Navigator y te orienta':'Franklin Assistant forma parte de Franklin Navigator y le orienta',
 'Prepárate para la próxima conversación.':'Prepárese para la próxima conversación.',
 'Ve la situación completa antes de elegir un próximo paso.':'Vea la situación completa antes de elegir el próximo paso.',
 'Busque necesidades cotidianas con sus propias palabras y luego continúa al sitio oficial o de primera mano que corresponda. Franklin Navigator no te pide':'Busque necesidades cotidianas con sus propias palabras y luego continúe al sitio oficial o de la organización que corresponda. Franklin Navigator no le pide',
 'Todavía no hay una coincidencia cercana. Prueba una frase más corta':'Todavía no hay una coincidencia cercana. Pruebe una frase más corta',
 '— Usa información actual del National Weather Service':'— Use información actual del National Weather Service',
 '— Confirma el proveedor correcto':'— Confirme el proveedor correcto',
 '— Elige el tipo correcto':'— Elija el tipo correcto',
 '— Mantén el 988 y el 911 accesibles':'— Mantenga el 988 y el 911 accesibles',
 '— Mantén separados Franklin Special District y Williamson County Schools':'— Mantenga separados Franklin Special District y Williamson County Schools',
 '— Usa páginas actuales de eventos y confirme':'— Use páginas actuales de eventos y confirme',
 '— Empieza con una visión general':'— Empiece con una visión general',
 'Cada planificador usa solo opciones generales, cree un plan que puede copiar en su dispositivo y conecta con fuentes oficiales y listados del área de Franklin revisados con fuentes.':'Cada planificador utiliza opciones generales, crea un plan que puede copiar en su dispositivo y le conecta con fuentes oficiales y perfiles del área de Franklin basados en información pública.',
 'Encuentre la ruta responsable para registros, licencias, quejas o ayuda neutral sin tratar una sola fuente como respuesta completa.':'Encuentre la fuente o el recurso adecuado para registros, licencias, quejas o ayuda neutral sin tratar una sola fuente como respuesta completa.',
 'Las direcciones de Franklin pueden estar atendidas por Williamson County Schools o Franklin Special District. Consulta directamente al distrito responsable.':'Las direcciones de Franklin pueden corresponder a Williamson County Schools o Franklin Special District. Consulte directamente con el distrito correspondiente.',
 'Prueba empleos, alimentos, cuidado infantil, mascotas…':'Pruebe empleos, alimentos, cuidado infantil, mascotas…',
 'No hay una ruta cercana que coincida. Prueba una frase más corta o abre el Centro de Ayuda Comunitaria.':'No hay una opción cercana que coincida. Pruebe una frase más corta o abra el Centro de Ayuda Comunitaria.',
 'Cómo te protege cada ruta.':'Cómo le ayuda cada opción.',
 'Ve la situación completa y elija un próximo paso.':'Vea la situación completa y elija el próximo paso.',
 'Prepárate antes de llamar, visitar o elegir a un profesional.':'Prepárese antes de llamar, visitar o elegir a un profesional.',
 'Empiece con la situación completa cuando un problema afecta más de una parte de la vida, o abre un área de ayuda enfocada y localizada en Franklin.':'Empiece con la situación completa cuando un problema afecte más de una parte de la vida, o abra un área de ayuda específica de Franklin.',
 'Para deportes escolares, consulta la escuela del estudiante; no envíes expedientes estudiantiles a Franklin Navigator.':'Para deportes escolares, consulte la escuela del estudiante; no envíe expedientes estudiantiles a Franklin Navigator.',
 'Find Local | Franklin Navigator':'Buscar en Franklin | Franklin Navigator',
 'Prueba lectura, aprendizaje adulto, estándares…':'Pruebe lectura, aprendizaje para adultos, estándares…',
 'Prueba adulto, biblioteca, estándares…':'Pruebe adultos, biblioteca, estándares…',
 'Prueba: Mi familiar necesita transporte y atención médica, o necesito ayuda para iniciar un negocio.':'Pruebe: Mi familiar necesita transporte y atención médica, o necesito ayuda para iniciar un negocio.',
 'Prueba día de basura, autobús, cuidado infantil, vivienda, empleos…':'Pruebe día de basura, autobús, cuidado infantil, vivienda, empleos…',
 'Los resultados del directorio son informativos; no son clasificaciones, referencias, respaldos ni prueba de idoneidad.':'Los resultados del directorio son informativos; no constituyen clasificaciones, recomendaciones, respaldos ni una evaluación de idoneidad.',
 'Un listado no es respaldo, referencia, disponibilidad actual ni prueba de que un proveedor se adapte a su situación.':'Un listado no implica recomendación, disponibilidad actual ni que un proveedor sea adecuado para su situación.',
 'fuente oficial o de primera mano':'fuente oficial o de la organización',
 'fuentes oficiales o de primera mano':'fuentes oficiales o de las organizaciones',
 'fuente oficial o de primera fuente':'fuente oficial o de la organización',
 'fuentes oficiales o de primera fuente':'fuentes oficiales o de las organizaciones',
 'ruta responsable':'opción adecuada',
 'rutas responsables':'opciones adecuadas',
}

REGEX=[
 (r'(?<![\wáéíóúüñ])Prepárate\b','Prepárese'),(r'(?<![\wáéíóúüñ])prepárate\b','prepárese'),
 (r'(?<![\wáéíóúüñ])Reúne\b','Reúna'),(r'(?<![\wáéíóúüñ])reúne\b','reúna'),
 (r'(?<![\wáéíóúüñ])Mantén\b','Mantenga'),(r'(?<![\wáéíóúüñ])mantén\b','mantenga'),
 (r'(?<![\wáéíóúüñ])No envíes\b','No envíe'),(r'(?<![\wáéíóúüñ])no envíes\b','no envíe'),
 (r'(?<![\wáéíóúüñ])No escribas\b','No escriba'),(r'(?<![\wáéíóúüñ])no escribas\b','no escriba'),
 (r'(?<![\wáéíóúüñ])No pegues\b','No pegue'),(r'(?<![\wáéíóúüñ])no pegues\b','no pegue'),
 (r'\bte ayuda\b','le ayuda'),(r'\bte ayudan\b','le ayudan'),(r'\bte orienta\b','le orienta'),(r'\bte protege\b','le ayuda'),
 (r'\btus\b','sus'),(r'\bTu\b','Su'),(r'\btu\b','su'),(r'\bcontigo\b','con usted'),
]

class P(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.skip=0;self.items=[]
 def handle_starttag(self,tag,attrs):
  if tag.lower() in {'script','style','noscript','code','pre'}:self.skip+=1
  if self.skip:return
  d=dict(attrs)
  for k in ('aria-label','placeholder','title'):
   v=(d.get(k) or '').strip()
   if v:self.items.append((f'@{k}',v))
 def handle_endtag(self,tag):
  if tag.lower() in {'script','style','noscript','code','pre'} and self.skip:self.skip-=1
 def handle_data(self,data):
  if self.skip:return
  t=' '.join(data.split())
  if t:self.items.append(('text',t))

UNAMBIG=re.compile(r'\b(?:te|ti|tu|tus|contigo|prepárate|reúne|mantén|no envíes|no escribas|no pegues)\b',re.I)
ENGLISH=re.compile(r'\b(?:Search|More filters|More links|More tools|More contact options|Save|Clear all|Copy link|Share|Print|Download list|Open profile|Compare now|Previous|Next|Retry loading|Back to filters|Source date|All categories|All types|All areas|Recently checked|Website available|Exact address available|Get It Done|Find Local|Today)\b',re.I)
MOJI=re.compile(r'[�]|Ã.|Â.')

def main():
 pages=sorted((ROOT/'dist/es').rglob('index.html'));changed=[];counts={k:0 for k in EXACT}
 for p in pages:
  raw=p.read_text('utf-8');new=raw
  for old,repl in EXACT.items():
   c=new.count(old)
   if c:counts[old]+=c;new=new.replace(old,repl)
  for pat,repl in REGEX:new=re.sub(pat,repl,new)
  if new!=raw:p.write_text(new,'utf-8');changed.append(p.relative_to(ROOT).as_posix())
 issues=[]
 for p in pages:
  parser=P();parser.feed(p.read_text('utf-8'))
  for kind,text in parser.items:
   flags=[]
   if UNAMBIG.search(text):flags.append('INFORMAL_REGISTER')
   if ENGLISH.search(text) and text.strip()!='English':flags.append('POSSIBLE_ENGLISH_UI')
   if MOJI.search(text):flags.append('MOJIBAKE')
   for flag in flags:issues.append({'path':p.relative_to(ROOT).as_posix(),'location':kind,'flag':flag,'text':text})
 OUT.parent.mkdir(parents=True,exist_ok=True)
 report={'schemaVersion':'franklin.hf31.spanish-language-final.v1','spanishIndexPages':len(pages),'changedFiles':len(changed),'changedFileSamples':changed[:100],'replacementCounts':{k:v for k,v in counts.items() if v},'remainingIssues':len(issues),'remainingIssueCounts':{k:sum(1 for x in issues if x['flag']==k) for k in ['INFORMAL_REGISTER','POSSIBLE_ENGLISH_UI','MOJIBAKE']},'remainingIssueSamples':issues[:200],'note':'High-confidence formal-register and untranslated-UI normalization. Proper nouns and product names are preserved.'}
 OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
 print(json.dumps({'changedFiles':len(changed),'remainingIssues':len(issues),'counts':report['remainingIssueCounts']},ensure_ascii=False))

if __name__=='__main__':main()
