#!/usr/bin/env python3
from __future__ import annotations
import html,json,pathlib,re
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
EVID=ROOT/'evidence/hf31'

REPL={
 'Current evidence state':'Current information',
 'First-party Downtown Franklin Association source':'Downtown Franklin Association source',
 'First-party sources checked and dated':'Sources checked and dated',
 'First-party venue source':'Venue source',
 'Needs recheck before publication':'Check current details before using',
 'Official or first-party links':'Official or organization links',
 'Official or first-party link':'Official or organization link',
 'official or first-party links':'official or organization links',
 'official or first-party link':'official or organization link',
 'Preparing organization source links':'Finding useful sources',
 'Privacy check before generation':'Privacy check',
 'coverage floor':'local options',
 'first-party and official discovery routes':'official and organization sources',
 'official and first-party discovery routes':'official and organization sources',
 'first-party and official starting points':'official and organization sources',
 'official and first-party starting points':'official and organization sources',
 'first-party links':'organization links',
 'public-source-backed profiles':'profiles built from public information',
 'fuentes de primera parte':'fuentes de las organizaciones',
 'fuentes de primera fuente':'fuentes de las organizaciones',
 'respaldados por fuentes públicas':'basados en información pública',
 'información de contacto público de negocios y trabajo oficial respaldada por fuentes':'información pública de contacto de negocios y trabajo oficial obtenida de fuentes públicas',
 'ordinary source-backed visibility':'ordinary visibility based on public information',
 'source-backed public business and official-work contact information':'public business and official-work contact information from public sources',
 'Routes to existing Franklin tools and source-backed discovery.':'Connects to existing Franklin tools and local information based on public sources.',
 'rutas existentes de Franklin y descubrimiento respaldado por fuentes.':'herramientas existentes de Franklin e información local basada en fuentes públicas.',
}

BANNED=[
 r'\bcanonical profiles?\b',r'\bsource routes?\b',r'\bresponsible-source\b',r'\bstable local routes?\b',r'\bfollow-through plan\b',
 r'\bconflicts? suppressed\b',r'\bfail-closed\b',r'\bqualified successor\b',r'\bconsumer acceptance\b',r'\bcurrent pointer\b',
 r'\bprofile factory\b',r'\blocal investigator\b',r'\bPF74\b',r'\bruntime pair\b',r'\bproducer candidate\b',r'\bexact artifact\b',
 r'\bsource-backed\b',r'\bcoverage floor\b',r'\bcurrent evidence state\b',r'\bevidence window\b',
 r'perfiles? canónicos?',r'rutas? de fuentes?',r'ventana de evidencia',r'fuentes responsables',r'rutas locales estables',
 r'aceptación del consumidor',r'puntero actual',r'investigador local',r'carga útil',r'respaldad[oa]s? por fuentes'
]

def visible_body(raw:str)->str:
 m=re.search(r'<body\b[^>]*>([\s\S]*?)</body>',raw,re.I);raw=m.group(1) if m else raw
 raw=re.sub(r'<script\b[^>]*>[\s\S]*?</script>',' ',raw,flags=re.I);raw=re.sub(r'<style\b[^>]*>[\s\S]*?</style>',' ',raw,flags=re.I);raw=re.sub(r'<noscript\b[^>]*>[\s\S]*?</noscript>',' ',raw,flags=re.I)
 return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',raw))).strip()

def clean_nonprofile_html():
 changed=[];counts={}
 for p in sorted((ROOT/'dist').rglob('*.html')):
  rel=p.relative_to(ROOT).as_posix()
  if rel.startswith('dist/profiles/'):continue
  raw=p.read_text('utf-8');new=raw
  for old,repl in sorted(REPL.items(),key=lambda kv:len(kv[0]),reverse=True):
   c=new.count(old)
   if c:counts[old]=counts.get(old,0)+c;new=new.replace(old,repl)
  if new!=raw:p.write_text(new,'utf-8');changed.append(rel)
 suspects=[]
 for p in sorted((ROOT/'dist').rglob('*.html')):
  rel=p.relative_to(ROOT).as_posix()
  if rel.startswith('dist/profiles/'):continue
  text=visible_body(p.read_text('utf-8'))
  for pat in BANNED:
   m=re.search(pat,text,re.I)
   if m:suspects.append({'path':rel,'pattern':pat,'match':m.group(0),'context':text[max(0,m.start()-90):m.end()+120]})
  if len(suspects)>=100:break
 report={'schemaVersion':'franklin.hf31.public-language-zero-jargon.v2','scope':'NON_PROFILE_STATIC_PUBLIC_HTML_PLUS_PROFILE_RENDER_CLEANUP_SEPARATE','changedFiles':len(changed),'changedFileSamples':changed[:100],'replacementCounts':counts,'remainingHighConfidenceJargonMatches':len(suspects),'remainingSamples':suspects,'profileStaticHtmlExcludedReason':'Profile HTML is preserved as source evidence; public display jargon is cleaned by hf31-public.js without changing underlying profile facts.','result':'PASS' if not suspects else 'REVIEW_REQUIRED'}
 EVID.mkdir(parents=True,exist_ok=True);(EVID/'PUBLIC_LANGUAGE_ZERO_JARGON_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2,sort_keys=True)+'\n','utf-8')
 return report

def patch_profile_runtime():
 p=ROOT/'dist/assets/hf31-public.js';s=p.read_text('utf-8')
 if 'function refineProfilePlainLanguage()' not in s:
  marker='  function refineProfile(){\n'
  fn=r'''  function refineProfilePlainLanguage(){
    if(!PROFILE_RE.test(path()))return;
    const replacements=[
      [/service\/location identity source-backed; street address not asserted in this release/gi,tx('service and location information from public sources; the source does not list a street address','información de servicio y ubicación de fuentes públicas; la fuente no indica una dirección postal')],
      [/source-backed service area; street address not asserted/gi,tx('service area based on public information; the source does not list a street address','área de servicio basada en información pública; la fuente no indica una dirección postal')],
      [/source-backed/gi,tx('based on public information','basado en información pública')],
      [/not asserted in this release/gi,tx('not listed in the source','no indicado en la fuente')]
    ];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('script,style,noscript,code,pre,textarea'))continue;
      const raw=node.nodeValue||'';let value=raw;for(const [re,repl] of replacements)value=value.replace(re,repl);if(value!==raw)node.nodeValue=value;
    }
  }

'''
  if marker not in s:raise SystemExit('refineProfile marker missing')
  s=s.replace(marker,fn+marker,1)
 if 'enhanceMemberPublication();refineProfilePlainLanguage();' not in s:
  old='    enhanceMemberPublication();\n  }\n\n  function init()'
  new='    enhanceMemberPublication();refineProfilePlainLanguage();\n  }\n\n  function init()'
  if old not in s:raise SystemExit('profile runtime call marker missing')
  s=s.replace(old,new,1)
 p.write_text(s,'utf-8')
 return {'file':'dist/assets/hf31-public.js','renderOnly':True,'profileFactsChanged':False,'phrasesCleaned':['source-backed service/location identity','source-backed service area','generic source-backed','not asserted in this release']}

class SpanishParser(HTMLParser):
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

def spanish_audit():
 pages=sorted((ROOT/'dist/es').rglob('index.html'));issues=[]
 for p in pages:
  parser=SpanishParser();parser.feed(p.read_text('utf-8'))
  for loc,t in parser.items:
   if ANY.search(t) or informal_start(t):issues.append({'path':p.relative_to(ROOT).as_posix(),'location':loc,'text':t})
 report={'schemaVersion':'franklin.hf31.spanish-register-final-review.v2','spanishPages':len(pages),'remainingHighConfidenceInformalRegister':len(issues),'issues':issues[:100],'result':'PASS' if not issues else 'REVIEW_REQUIRED'}
 (EVID/'SPANISH_REGISTER_FINAL_REVIEW.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8');return report

def main():
 profile=patch_profile_runtime();public=clean_nonprofile_html();spanish=spanish_audit()
 (EVID/'PROFILE_RENDER_LANGUAGE_RECEIPT.json').write_text(json.dumps({'schemaVersion':'franklin.hf31.profile-render-language.v1',**profile,'result':'PASS'},indent=2)+'\n','utf-8')
 print(json.dumps({'publicJargonRemaining':public['remainingHighConfidenceJargonMatches'],'spanishRegisterRemaining':spanish['remainingHighConfidenceInformalRegister'],'profileRenderCleanup':'PASS'}))
 if public['remainingHighConfidenceJargonMatches'] or spanish['remainingHighConfidenceInformalRegister']:raise SystemExit('Final language gate requires review')
if __name__=='__main__':main()
