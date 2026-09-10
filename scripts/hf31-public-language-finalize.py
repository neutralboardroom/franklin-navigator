#!/usr/bin/env python3
from __future__ import annotations
import html, json, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence/hf31/PUBLIC_LANGUAGE_FINAL_REPORT.json'

EXACT={
 'follow-through plan':'step-by-step plan',
 'fuentes responsables del distrito y la escuela':'sitios oficiales del distrito y de la escuela',
 'fuentes responsables de rutas y tráfico':'fuentes oficiales de transporte y tráfico',
 'fuentes responsables duraderas':'fuentes oficiales y recursos permanentes',
 'This is a responsible-source starting point, not eligibility advice, endorsement or a complete roster of every informal team.':'This page helps you find official local options. It is not eligibility advice, an endorsement, or a complete list of every informal team.',
 'Este es un punto de partida de una fuente responsable, no asesoramiento de elegibilidad, respaldo ni una lista completa de todos los equipos informales.':'Esta página le ayuda a encontrar opciones locales oficiales. No ofrece asesoramiento sobre elegibilidad, no recomienda equipos y no pretende ser una lista completa.',
 'No raw contact-list handoff or public-email-equals-consent assumption':'We do not treat a public email address as permission to contact someone',
 'Cada tarjeta abre una fuente oficial o de primera fuente. La aparición no implica clasificación, afiliación ni respaldo.':'Cada opción enlaza a una fuente oficial o de la organización. Su aparición no implica una clasificación, afiliación ni recomendación.',
 'Cada tarjeta abre una fuente oficial o de primera mano. La aparición no implica clasificación, afiliación ni respaldo.':'Cada opción enlaza a una fuente oficial o de la organización. Su aparición no implica una clasificación, afiliación ni recomendación.',
 'Cada tarjeta abre una fuente oficial o de primera fuente.':'Cada opción enlaza a una fuente oficial o de la organización.',
 'Cada tarjeta abre una fuente oficial o de primera mano.':'Cada opción enlaza a una fuente oficial o de la organización.',
 'official or first-party source':'official or organization source',
 'official or first-party':'official or organization-provided',
 'first-party source':'organization source',
 'first-party Franklin-serving route':'local Franklin-serving option',
 'source-backed options':'local options from public sources',
 'Source-backed options':'Local options from public sources',
 'opciones respaldadas por fuentes':'opciones locales basadas en fuentes públicas',
 'Opciones respaldadas por fuentes':'Opciones locales basadas en fuentes públicas',
}

SUSPECT=[
 r'\bcanonical profiles?\b',r'\bsource routes?\b',r'\bresponsible-source\b',r'\bstable local routes?\b',r'\bfollow-through plan\b',
 r'\bconflicts? suppressed\b',r'\bfail-closed\b',r'\bqualified successor\b',r'\bconsumer acceptance\b',r'\bcurrent pointer\b',
 r'\bprofile factory\b',r'\blocal investigator\b',r'\bSCC\b',r'\bSRE\b',r'\bPF74\b',r'\bhandoff\b',r'\bpayload\b',r'\bmanifest\b',
 r'\bruntime pair\b',r'\bquarantin(?:e|ed)\b',r'\bproducer candidate\b',r'\bexact artifact\b',r'\bsource-backed\b',r'\bfirst-party\b',
 r'perfiles? canónicos?',r'rutas? de fuentes?',r'ventana de evidencia',r'fuentes responsables',r'rutas locales estables',r'aceptación del consumidor',
 r'puntero actual',r'perfil(?:es)? factory',r'investigador local',r'cuarenten',r'carga útil',r'respaldad[oa]s? por fuentes',r'de primera fuente'
]

def visible(raw:str)->str:
 raw=re.sub(r'<script\b[^>]*>[\s\S]*?</script>',' ',raw,flags=re.I)
 raw=re.sub(r'<style\b[^>]*>[\s\S]*?</style>',' ',raw,flags=re.I)
 raw=re.sub(r'<head\b[^>]*>[\s\S]*?</head>',' ',raw,flags=re.I)
 return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',raw))).strip()

def main():
 changed=[];counts={k:0 for k in EXACT};htmls=sorted((ROOT/'dist').rglob('*.html'))
 for p in htmls:
  raw=p.read_text('utf-8');new=raw
  for old,repl in EXACT.items():
   c=new.count(old)
   if c:counts[old]+=c;new=new.replace(old,repl)
  if new!=raw:p.write_text(new,'utf-8');changed.append(p.relative_to(ROOT).as_posix())
 suspects=[]
 for p in htmls:
  text=visible(p.read_text('utf-8'))
  for pat in SUSPECT:
   for m in re.finditer(pat,text,flags=re.I):
    suspects.append({'path':p.relative_to(ROOT).as_posix(),'pattern':pat,'match':m.group(0),'context':text[max(0,m.start()-80):m.end()+100]})
    if len(suspects)>=300:break
   if len(suspects)>=300:break
  if len(suspects)>=300:break
 OUT.parent.mkdir(parents=True,exist_ok=True)
 report={'schemaVersion':'franklin.hf31.public-language-final.v1','htmlFilesScanned':len(htmls),'changedFiles':len(changed),'changedFileSamples':changed[:100],'replacementCounts':{k:v for k,v in counts.items() if v},'remainingSuspectVisibleMatches':len(suspects),'remainingSuspectSamples':suspects,'protectedScope':'Presentation-language substitutions only; no profile facts, ranking, prices, runtime, payments, entitlements or safety state changed.'}
 OUT.write_text(json.dumps(report,indent=2,ensure_ascii=False,sort_keys=True)+'\n','utf-8')
 print(json.dumps({'changedFiles':len(changed),'remainingSuspectVisibleMatches':len(suspects)}))

if __name__=='__main__':main()
