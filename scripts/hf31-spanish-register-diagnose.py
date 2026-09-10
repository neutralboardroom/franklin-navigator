#!/usr/bin/env python3
from __future__ import annotations
import pathlib,re
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
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
# Unambiguous informal pronouns/verb forms plus common informal imperative forms when they start a visible text unit.
ANY=re.compile(r'\b(?:te|ti|tu|tus|contigo|sabes|quieres|necesitas|puedes|tienes|debes|prefieres|buscas)\b',re.I)
START=re.compile(r'^(?:[¿¡]\s*)?(?:Usa|Consulta|Prueba|Abre|Busca|Confirma|Elige|Mantén|Empieza|Revisa|Compara|Guarda|Descarga|Copia|Mira|Encuentra|Reúne|Organiza|Haz|Ve|Prepara|Selecciona|Añade|Elimina|Ingresa|Escribe|Sigue|Verifica|Contacta|Explora|Aprende)\b',re.I)
issues=[]
for p in sorted((ROOT/'dist/es').rglob('index.html')):
 parser=P();parser.feed(p.read_text('utf-8'))
 for kind,text in parser.items:
  if ANY.search(text) or START.search(text):issues.append((p.relative_to(ROOT).as_posix(),kind,text))
print('SPANISH_REGISTER_CANDIDATES',len(issues))
for row in issues[:300]:print('\t'.join(row))
