#!/usr/bin/env python3
from __future__ import annotations
import json, pathlib, re
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence/hf31/SPANISH_LANGUAGE_FINAL_REPORT.json'
EXACT={
 'Buscar en Find Local':'Buscar en Franklin',
 'Explorar Find Local':'Explorar perfiles locales',
 'Mantenga a mano las partes de Franklin Navigator que te importan. No se requiere cuenta, correo ni dirección.':'Mantenga a mano las partes de Franklin Navigator que le importan. No se requiere cuenta, correo ni dirección.',
 '¿Qué te importa?':'¿Qué le importa?',
 'Revise el perfil público, use herramientas gratuitas de planificación local y conozca la experiencia ampliada para miembros antes de decidir si la Membresía Comunitaria o Charter te conviene.':'Revise el perfil público, utilice herramientas gratuitas de planificación local y conozca la experiencia ampliada para miembros antes de decidir si la Membresía Comunitaria o Charter le conviene.',
 'Previsualiza un mayor valor para miembros y decide si un plazo de membresía te conviene.':'Vea las opciones ampliadas para miembros y decida si un plazo de membresía le conviene.',
 'Franklin Navigator no decide si un plazo es válido, si una cobertura aplica, ni qué resultado legal o de beneficios debe recibir. Te ayuda a separar el documento, las fechas, las preguntas y la fuente correcta.':'Franklin Navigator no decide si un plazo es válido, si una cobertura aplica ni qué resultado legal o de beneficios debe recibir. Le ayuda a organizar el documento, las fechas, las preguntas y la fuente correspondiente.',
 'Este paquete le ayuda a preparar preguntas y reunir información. No elige un profesional por ti, no crea una relación profesional y no cambia los resultados orgánicos del directorio.':'Este paquete le ayuda a preparar preguntas y reunir información. No elige un profesional por usted, no crea una relación profesional y no cambia los resultados normales del directorio.'
}
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
 pages=sorted((ROOT/'dist/es').rglob('index.html'));changed=[]
 for p in pages:
  raw=p.read_text('utf-8');new=raw
  for old,repl in EXACT.items():new=new.replace(old,repl)
  if new!=raw:p.write_text(new,'utf-8');changed.append(p.relative_to(ROOT).as_posix())
 issues=[]
 for p in pages:
  parser=P();parser.feed(p.read_text('utf-8'))
  for kind,text in parser.items:
   if UNAMBIG.search(text):issues.append({'path':p.relative_to(ROOT).as_posix(),'location':kind,'flag':'INFORMAL_REGISTER','text':text})
   if ENGLISH.search(text) and text.strip()!='English':issues.append({'path':p.relative_to(ROOT).as_posix(),'location':kind,'flag':'POSSIBLE_ENGLISH_UI','text':text})
   if MOJI.search(text):issues.append({'path':p.relative_to(ROOT).as_posix(),'location':kind,'flag':'MOJIBAKE','text':text})
 report={'schemaVersion':'franklin.hf31.spanish-language-final.v2','spanishIndexPages':len(pages),'changedFiles':len(changed),'remainingIssues':len(issues),'remainingIssueCounts':{k:sum(1 for x in issues if x['flag']==k) for k in ['INFORMAL_REGISTER','POSSIBLE_ENGLISH_UI','MOJIBAKE']},'remainingIssueSamples':issues[:200],'result':'PASS' if not issues else 'REVIEW_REQUIRED','note':'High-confidence all-page formal-register, untranslated-UI and encoding audit; proper nouns and intentional product names preserved.'}
 OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
 print(json.dumps({'changedFiles':len(changed),'remainingIssues':len(issues),'result':report['result']}))
 if issues:raise SystemExit('Spanish final audit still has high-confidence issues')
if __name__=='__main__':main()
