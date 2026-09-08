from html.parser import HTMLParser
from pathlib import Path
from collections import Counter
import json,re,sys
base=Path(sys.argv[1] if len(sys.argv)>1 else 'candidate');root=base/'dist';ev=base/'evidence';ev.mkdir(exist_ok=True);records=[];issues=[]
hidden={'script','style','noscript','template','svg','path','meta','link'};attrs={'title','aria-label','placeholder','alt'}
class P(HTMLParser):
  def __init__(self,path):super().__init__(convert_charrefs=True);self.path=path;self.stack=[];self.skip=0
  def handle_starttag(self,tag,a):
    self.stack.append(tag)
    if tag in hidden:self.skip+=1
    d=dict(a)
    if tag=='meta' and d.get('name')=='description' and d.get('content'):records.append((self.path,'meta',d['content'].strip()))
    if not self.skip:
      for k in attrs:
        v=d.get(k)
        if v and re.search(r'[A-Za-zÁ-ÿ]',v):records.append((self.path,k,re.sub(r'\s+',' ',v).strip()))
  def handle_endtag(self,tag):
    if tag in hidden and self.skip:self.skip-=1
    if self.stack:self.stack.pop()
  def handle_data(self,data):
    if not self.skip:
      t=re.sub(r'\s+',' ',data).strip()
      if t and re.search(r'[A-Za-zÁ-ÿ]',t):records.append((self.path,self.stack[-1] if self.stack else 'text',t))
htmls=sorted(root.rglob('*.html'))
for p in htmls:P(p.relative_to(root).as_posix()).feed(p.read_text(errors='ignore'))
assert len(htmls)==19356,len(htmls);assert sum(1 for p in htmls if p.relative_to(root).as_posix().startswith('profiles/'))==19103
banned=[
'Ask Navigator','Your everyday operating system','public-source evidence','public-source facts','source-backed facts','directory projection','Profile representation review','representation review','Growth Desk entitlement','learning-provider schema','The user indicated','material claim','next-best actions','first-value path','first-value plan','responsible starting points','paid membership is not open today','membership paid is not open today','evidence window','reach the responsible official source','Preview bilingual member growth tools','future active paid subscribed locations','Claim / manage this profile','Profile verified. You can continue when checkout is available.',
'Sanitized topic-and-link plans','responsible official lookup','checked against public sources licensing','responsible permit office','responsible organization','responsible organizations','responsible local discovery','Prepárate para','Planifica el próximo paso','Ve juntas las necesidades','puntos de partida responsables','Planes minimizados'
]
internal=re.compile(r'\b(?:ADMIN_TOKEN|lookup key|lookupKey|entitlement key|canonical profile id|runtime service|schema version|webhook event|reconciliation control|deployment receipt|source state|authority state|Profile Factory|Local Investigator)\b',re.I)
informal_any=re.compile(r'\b(?:tú|tu|tus|puedes|quieres|tienes|necesitas|debes|eres|conéctate|prepárate|planifica)\b',re.I)
informal_imp=re.compile(r'(?:^|[.!?;:]\s+|\b(?:y|luego|después|también|primero|ahora)\s+)(?:elige|selecciona|confirma|revisa|usa|utiliza|abre|busca|filtra|compara|guarda|escribe|introduce|ingresa|haz|mantén|verifica|evita|solicita|crea|prepara|organiza|encuentra|explora|lee|añade|adjunta|reinicia|empieza|conoce|inicia|pregunta|vuelve|dime|anota|precisa|contacta|agrega|imprime|responde|completa|separa|conserva|reúne|descarga|copia)\b',re.I)
allowed={'FAQ','IRS','USDA','FEMA','ADA','TDEC','TDOT','NPI','HIPAA','YMCA','TN','USA','COVID','CPR','GED','ESL','DMV','TBI','DCS','TDHS','SNAP','WIC','VA','WCPR'}
for path,kind,text in records:
  low=text.casefold()
  for b in banned:
    if b.casefold() in low:issues.append({'type':'BANNED','file':path,'phrase':b,'text':text})
  if internal.search(text):issues.append({'type':'INTERNAL','file':path,'text':text})
  if kind=='meta' and len(text)>165:issues.append({'type':'META_TOO_LONG','file':path,'chars':len(text),'text':text})
  if not path.startswith('profiles/'):
    bad=[w for w in re.findall(r'\b[A-Z][A-Z/&-]{3,}\b',text) if w not in allowed]
    if bad and len(text)<160:issues.append({'type':'ALL_CAPS_UI','file':path,'words':bad,'text':text})
  if path.startswith('es/'):
    m=informal_any.search(text) or informal_imp.search(text)
    if m:issues.append({'type':'SPANISH_VOICE','file':path,'match':m.group(0),'text':text})
tr=json.loads((root/'data/r37-es-public-strings.json').read_text())['translations']
for key,val in tr.items():
  m=informal_any.search(val) or informal_imp.search(val)
  if m:issues.append({'type':'SPANISH_CATALOG_VOICE','key':key,'match':m.group(0),'text':val})
  for b in banned:
    if b.casefold() in val.casefold():issues.append({'type':'CATALOG_BANNED','key':key,'phrase':b,'text':val})
lit=re.compile(r"(?<![A-Za-z0-9_$])(['\"])(.{2,1200}?)(?<!\\)\1")
for jp in sorted((root/'assets').glob('*.js')):
  if jp.stat().st_size>900000:continue
  for m in lit.finditer(jp.read_text(errors='ignore')):
    s=re.sub(r'\\[nt]',' ',m.group(2))
    if not re.search(r'[A-Za-zÁ-ÿ]{3}',s):continue
    for b in banned:
      if b.casefold() in s.casefold():issues.append({'type':'JS_BANNED','file':jp.name,'phrase':b,'text':s[:500]})
    letters=''.join(c for c in s if c.isalpha())
    if ' ' in s and '_' not in s and not re.search(r'BEGIN:|END:|CALSCALE:|FR-NAV',s) and len(letters)>=12 and letters.upper()==letters:issues.append({'type':'JS_ALL_CAPS','file':jp.name,'text':s[:500]})
    if re.search(r'[áéíóúñ¿¡]',s,re.I):
      mm=informal_any.search(s) or informal_imp.search(s)
      if mm:issues.append({'type':'JS_SPANISH_VOICE','file':jp.name,'match':mm.group(0),'text':s[:500]})
out={'schemaVersion':'franklin.hf26.language-zero-audit.v1','htmlPages':len(htmls),'profilePages':19103,'visibleRecords':len(records),'issues':len(issues),'issueCounts':dict(Counter(x['type'] for x in issues))}
(ev/'HF26_LANGUAGE_ZERO_AUDIT.json').write_text(json.dumps({'summary':out,'issues':issues},ensure_ascii=False,indent=2)+'\n');print(json.dumps(out));
if issues:
  print(json.dumps(issues[:120],ensure_ascii=False,indent=2));raise SystemExit('public-language defects remain: '+str(len(issues)))
