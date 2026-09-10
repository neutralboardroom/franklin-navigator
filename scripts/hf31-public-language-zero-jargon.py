#!/usr/bin/env python3
from __future__ import annotations
import html, json, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence/hf31/PUBLIC_LANGUAGE_ZERO_JARGON_REPORT.json'

LITERAL={
 'public-source-backed profiles':'profiles built from public information',
 'public source-backed profiles':'profiles built from public information',
 'source-backed profiles':'profiles based on public information',
 'source-backed options':'local options based on public information',
 'official and first-party starting points':'official and organization-provided sources',
 'first-party and official starting points':'official and organization-provided sources',
 'first-party and official discovery routes':'official and organization sources',
 'official and first-party discovery routes':'official and organization sources',
 'First-party and official discovery routes':'Official and organization sources',
 'First-party sources checked and dated':'Sources checked and dated',
 'first-party sources checked and dated':'sources checked and dated',
 'First-party Downtown Franklin Association source':'Downtown Franklin Association source',
 'First-party venue source':'Venue source',
 'Official or first-party link':'Official or organization link',
 'official or first-party link':'official or organization link',
 'Official or first-party source':'Official or organization source',
 'official or first-party source':'official or organization source',
 'first-party source':'organization source',
 'First-party source':'Organization source',
 'first-party links':'organization links',
 'First-party links':'Organization links',
 'first-party link':'organization link',
 'First-party link':'Organization link',
 'first-party':'organization-provided',
 'First-party':'Organization-provided',
 'coverage floor':'local options',
 'Coverage floor':'Local options',
 'Current evidence state':'Current information',
 'current evidence state':'current information',
 'Preparing organization source links':'Finding useful sources',
 'preparing organization source links':'finding useful sources',
 'Needs recheck before publication':'Check current details before using',
 'needs recheck before publication':'check current details before using',
 'Privacy check before generation':'Privacy check',
 'privacy check before generation':'privacy check',
 'evidence window':'date range',
 'Evidence window':'Date range',
 'responsible-source starting point':'official local option',
 'Responsible-source starting point':'Official local option',
 'source route checked':'information checked',
 'Source route checked':'Information checked',
 'source routes reviewed':'information reviewed',
 'Source routes reviewed':'Information reviewed',
 'canonical profiles':'public profiles',
 'Canonical profiles':'Public profiles',
 'canonical profile':'public profile',
 'Canonical profile':'Public profile',
 'conflicts suppressed until resolved':'unclear information is left out until confirmed',
 'Conflicts suppressed until resolved':'Unclear information is left out until confirmed',
 'follow-through plan':'step-by-step plan',
 'Follow-through plan':'Step-by-step plan',
 'fuentes de primera fuente':'fuentes de las organizaciones',
 'fuente de primera fuente':'fuente de la organización',
 'fuentes de primera parte':'fuentes de las organizaciones',
 'fuente de primera parte':'fuente de la organización',
 'de primera fuente':'de la organización',
 'de primera parte':'de la organización',
 'respaldados por fuentes públicas':'basados en información pública',
 'respaldadas por fuentes públicas':'basadas en información pública',
 'respaldado por fuentes públicas':'basado en información pública',
 'respaldada por fuentes públicas':'basada en información pública',
 'respaldados por fuentes':'basados en información pública',
 'respaldadas por fuentes':'basadas en información pública',
 'rutas de fuentes revisadas':'información revisada',
 'Rutas de fuentes revisadas':'Información revisada',
 'fuentes responsables':'fuentes oficiales',
 'Fuentes responsables':'Fuentes oficiales',
 'ventana de evidencia':'periodo indicado',
 'Ventana de evidencia':'Periodo indicado',
 'perfiles canónicos':'perfiles públicos',
 'Perfiles canónicos':'Perfiles públicos',
 'perfil canónico':'perfil público',
 'Perfil canónico':'Perfil público',
}

PHRASE_REPLACEMENTS=[
 (re.compile(r'\bOfficial or organization-provided link\b',re.I),'Official or organization link'),
 (re.compile(r'\borganization-provided and official discovery routes\b',re.I),'official and organization sources'),
 (re.compile(r'\bofficial and organization-provided discovery routes\b',re.I),'official and organization sources'),
 (re.compile(r'\borganization-provided starting points\b',re.I),'organization sources'),
]

SUSPECT=[
 r'\bcanonical profiles?\b',r'\bsource routes?\b',r'\bresponsible-source\b',r'\bstable local routes?\b',r'\bfollow-through plan\b',
 r'\bconflicts? suppressed\b',r'\bfail-closed\b',r'\bqualified successor\b',r'\bconsumer acceptance\b',r'\bcurrent pointer\b',
 r'\bprofile factory\b',r'\blocal investigator\b',r'\bSCC\b',r'\bSRE\b',r'\bPF74\b',r'\bhandoff\b',r'\bpayload\b',r'\bruntime pair\b',
 r'\bquarantin(?:e|ed)\b',r'\bproducer candidate\b',r'\bexact artifact\b',r'\bsource-backed\b',r'\bfirst-party\b',r'\bcoverage floor\b',
 r'\bcurrent evidence state\b',r'\bbefore publication\b',r'\bbefore generation\b',r'\bevidence window\b',
 r'perfiles? canónicos?',r'rutas? de fuentes?',r'ventana de evidencia',r'fuentes responsables',r'rutas locales estables',r'aceptación del consumidor',
 r'puntero actual',r'investigador local',r'cuarenten',r'carga útil',r'respaldad[oa]s? por fuentes',r'de primera fuente',r'de primera parte'
]

def body_visible(raw:str)->str:
 m=re.search(r'<body\b[^>]*>([\s\S]*?)</body>',raw,flags=re.I);raw=m.group(1) if m else raw
 raw=re.sub(r'<script\b[^>]*>[\s\S]*?</script>',' ',raw,flags=re.I)
 raw=re.sub(r'<style\b[^>]*>[\s\S]*?</style>',' ',raw,flags=re.I)
 raw=re.sub(r'<noscript\b[^>]*>[\s\S]*?</noscript>',' ',raw,flags=re.I)
 return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',raw))).strip()

def replace_case_insensitive(text:str,old:str,new:str):
 return re.sub(re.escape(old),lambda m:new,text,flags=re.I)

def main():
 files=sorted((ROOT/'dist').rglob('*.html'));changed=[];counts={}
 for p in files:
  raw=p.read_text('utf-8');new=raw
  # Longest first prevents short-term substitutions from blocking precise phrases.
  for old,repl in sorted(LITERAL.items(),key=lambda kv:len(kv[0]),reverse=True):
   pattern=re.compile(re.escape(old),re.I);hits=len(pattern.findall(new))
   if hits:counts[old]=counts.get(old,0)+hits;new=pattern.sub(repl,new)
  for pattern,repl in PHRASE_REPLACEMENTS:new=pattern.sub(repl,new)
  if new!=raw:p.write_text(new,'utf-8');changed.append(p.relative_to(ROOT).as_posix())
 suspects=[]
 for p in files:
  text=body_visible(p.read_text('utf-8'))
  for pat in SUSPECT:
   m=re.search(pat,text,re.I)
   if m:
    suspects.append({'path':p.relative_to(ROOT).as_posix(),'pattern':pat,'match':m.group(0),'context':text[max(0,m.start()-100):m.end()+140]})
    if len(suspects)>=300:break
  if len(suspects)>=300:break
 report={'schemaVersion':'franklin.hf31.public-language-zero-jargon.v1','htmlFilesScanned':len(files),'changedFiles':len(changed),'changedFileSamples':changed[:150],'replacementCounts':counts,'remainingHighConfidenceJargonMatches':len(suspects),'remainingSamples':suspects,'result':'PASS' if not suspects else 'REVIEW_REQUIRED','protectedScope':'Wording-only replacement in public HTML; no data files, profile facts, ranking, prices, runtime, payments, entitlements, or safety state.'}
 OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2,sort_keys=True)+'\n','utf-8')
 print(json.dumps({'changedFiles':len(changed),'remainingHighConfidenceJargonMatches':len(suspects),'result':report['result']}))
 if suspects:raise SystemExit('High-confidence internal/public jargon remains')
if __name__=='__main__':main()
