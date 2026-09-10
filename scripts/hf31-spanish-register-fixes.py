#!/usr/bin/env python3
from __future__ import annotations
import json,pathlib,re
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence/hf31/SPANISH_REGISTER_FINAL_REVIEW.json'
FIXES={
 'Elija el resultado que buscas y verifique por separado fechas, reglas de edad, accesibilidad, costos y disponibilidad.':'Elija el resultado que busca y verifique por separado fechas, reglas de edad, accesibilidad, costos y disponibilidad.',
 '¿No sabes qué mapa usar?':'¿No sabe qué mapa usar?',
 'Prueba mudanza, permiso, escuela, transporte…':'Pruebe mudanza, permiso, escuela, transporte…',
 'Ve lo que puede afectar su día, hogar o negocio. Las tarjetas actuales vencen automáticamente.':'Vea lo que puede afectar su día, hogar o negocio. Los elementos actuales se retiran automáticamente cuando dejan de estar vigentes.',
 'Sigue explorando después de hoy':'Siga explorando después de hoy',
 'Aprende, juega y participa localmente':'Aprenda, juegue y participe localmente',
 'Ve primero su ruta de membresía.':'Vea primero sus opciones de membresía.'
}
class P(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.skip=0;self.items=[]
 def handle_starttag(self,tag,attrs):
  if tag.lower() in {'script','style','noscript','code','pre'}:self.skip+=1
  if self.skip:return
  d=dict(attrs)
  for k in ('aria-label','placeholder','title'):
   v=' '.join((d.get(k) or '').split())
   if v:self.items.append((f'@{k}',v))
 def handle_endtag(self,tag):
  if tag.lower() in {'script','style','noscript','code','pre'} and self.skip:self.skip-=1
 def handle_data(self,data):
  if self.skip:return
  t=' '.join(data.split())
  if t:self.items.append(('text',t))
ANY=re.compile(r'\b(?:te|ti|tu|tus|contigo|sabes|quieres|necesitas|puedes|tienes|debes|prefieres|buscas)\b',re.I)
START=re.compile(r'^(?:[¿¡]\s*)?(?:Usa|Prueba|Abre|Busca|Confirma|Elige|Mantén|Empieza|Revisa|Compara|Guarda|Descarga|Copia|Mira|Encuentra|Reúne|Organiza|Haz|Ve|Prepara|Selecciona|Añade|Elimina|Ingresa|Escribe|Verifica|Contacta|Explora|Aprende)\b',re.I)
def informal_start(t:str)->bool:
 if START.search(t):return True
 if re.match(r'^Consulta\b',t,re.I) and not re.match(r'^Consulta\s+(?:de|del)\b',t,re.I):return True
 if re.match(r'^Sigue\b',t,re.I) and not re.match(r'^Sigue\s+siendo\b',t,re.I):return True
 return False
def main():
 pages=sorted((ROOT/'dist/es').rglob('index.html'));changed=[]
 for p in pages:
  raw=p.read_text('utf-8');new=raw
  for a,b in FIXES.items():new=new.replace(a,b)
  if new!=raw:p.write_text(new,'utf-8');changed.append(p.relative_to(ROOT).as_posix())
 issues=[]
 for p in pages:
  parser=P();parser.feed(p.read_text('utf-8'))
  for loc,t in parser.items:
   if ANY.search(t) or informal_start(t):issues.append({'path':p.relative_to(ROOT).as_posix(),'location':loc,'text':t})
 report={'schemaVersion':'franklin.hf31.spanish-register-final-review.v1','spanishPages':len(pages),'changedFiles':len(changed),'remainingHighConfidenceInformalRegister':len(issues),'issues':issues[:100],'result':'PASS' if not issues else 'REVIEW_REQUIRED','explicitFalsePositiveClassesExcluded':['Consulta de / Consulta del noun labels','sigue siendo third-person phrase'],'note':'Formal usted register is the default public voice. Proper nouns remain unchanged.'}
 OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
 print(json.dumps({'changedFiles':len(changed),'remaining':len(issues),'result':report['result']}))
 if issues:raise SystemExit('Spanish register still requires review')
if __name__=='__main__':main()
