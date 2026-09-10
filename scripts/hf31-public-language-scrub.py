#!/usr/bin/env python3
from __future__ import annotations
import argparse, html, json, pathlib, re

ROOT=pathlib.Path(__file__).resolve().parents[1]
REPORT=ROOT/'evidence/hf31/PUBLIC_LANGUAGE_SCRUB_REPORT.json'

REPLACEMENTS={
  'Source-backed options — recheck before you act':'Check details before you go',
  'Franklin-local sports route':'Local sports in Franklin',
  'Stable local routes':'More ways to participate',
  'Responsible-source finder':'Local options',
  'On-device follow-through plan':'Save for later',
  'Honest coverage':'About these results',
  'Broad local coverage, with visible limits':'What these results include',
  'Responsible sources':'Original sources',
  'What to recheck':'Check changing details',
  'Source routes reviewed: September 3, 2026':'Information reviewed September 3, 2026',
  '19,103 canonical profiles; no invented records':'Local profiles are based on public information',
  'Conflicts suppressed until resolved':'Unclear information is left out until confirmed',
  'Date-sensitive opportunities that have not expired':'Current programs and registration windows',
  'These cards automatically disappear after their evidence window. Still confirm status at the original source before traveling or paying.':'Past items are removed automatically. Confirm current details at the original source before traveling or paying.',
  'Turn discovery into a safe decision.':'Check the details before you register.',
  'Use the physical address for travel':'Confirm the location before you go',
  'Every result below is an official or first-party Franklin-serving route. Appearance is not ranking, affiliation or endorsement.':'Open the listed source for current schedules, registration, prices and availability. Results are not rankings or endorsements.',
  'Source route checked':'Checked',
  'Official or original source':'Official source',
  'Add to my short list':'Save to shortlist',
  'Build a recheck short list':'Build a shortlist',
  'Choose one or more starting points above. No name or private story is needed.':'Choose an option above to add it to your shortlist.',
  'Prepared on this device; not submitted.':'Saved in this browser only.',
  'Opciones respaldadas por fuentes — vuelva a comprobar antes de actuar':'Confirme los detalles antes de ir',
  'Ruta deportiva local de Franklin':'Deportes locales en Franklin',
  'Rutas locales estables':'Más formas de participar',
  'Buscador de fuentes responsables':'Opciones locales',
  'Plan de seguimiento en este dispositivo':'Guardar para después',
  'Cobertura transparente':'Sobre estos resultados',
  'Cobertura local amplia, con límites visibles':'Qué incluyen estos resultados',
  'Fuentes responsables':'Fuentes originales',
  'Qué volver a comprobar':'Qué conviene confirmar',
  'Rutas de fuentes revisadas: 3 de septiembre de 2026':'Información revisada el 3 de septiembre de 2026',
  '19,103 perfiles canónicos; sin registros inventados':'Los perfiles locales se basan en información pública',
  'Los conflictos se ocultan hasta resolverse':'Omitimos la información que no podemos confirmar',
  'Oportunidades con fecha que aún no han vencido':'Programas e inscripciones vigentes',
  'Estas tarjetas desaparecen automáticamente al terminar su ventana de evidencia. Aun así, confirme el estado en la fuente original antes de viajar o pagar.':'Los elementos pasados se eliminan automáticamente. Confirme los detalles actuales en la fuente original antes de desplazarse o pagar.',
  'Convierta el descubrimiento en una decisión segura.':'Confirme los detalles antes de inscribirse.',
  'Use la dirección física para desplazarse':'Confirme la ubicación antes de ir',
  'Cada resultado a continuación es una ruta oficial o de primera fuente que sirve a Franklin. La aparición no implica clasificación, afiliación ni respaldo.':'Abra la fuente indicada para confirmar horarios, inscripción, precios y disponibilidad. Los resultados no son una clasificación ni una recomendación.',
  'Ruta de fuente revisada':'Revisado',
  'Fuente oficial / de primera parte':'Fuente oficial',
  'Añadir a mi lista':'Guardar en mi lista',
  'Crear una lista corta para volver a comprobar':'Crear una lista',
  'Elija uno o más puntos de partida. No se necesita ningún nombre ni historia privada.':'Elija una opción para añadirla a su lista.',
  'Preparado en este dispositivo; no enviado.':'Guardado solo en este navegador.',
  'Use su dirección sin dársela a Franklin Navigator.':'Utilice su dirección sin compartirla con Franklin Navigator.',
  'cuando necesites información de servicios municipales basada en una dirección.':'cuando necesite información sobre servicios municipales basada en una dirección.',
  'Consulta directamente al distrito responsable.':'Consulte directamente con el distrito correspondiente.',
  'fuente oficial o de primera fuente':'fuente oficial o de la organización responsable',
  'ruta oficial o de primera fuente':'fuente oficial o de la organización responsable',
  'puntos de partida locales':'opciones locales',
  'puntos de partida de ligas':'opciones de ligas',
  'puntos de partida de ':'opciones de ',
  'ruta escolar responsable':'opción escolar correspondiente',
  'Rutas de fuentes revisadas':'Información revisada',
}

JS_REPLACEMENTS={
  "Showing ${shown} of ${total} local starting points":"Showing ${shown} of ${total} local options",
  "No starting point matches those filters. Clear a filter or search a broader word.":"No option matches those filters. Clear a filter or try a broader search.",
  "Loading Franklin starting points…":"Loading Franklin options…",
  "Source route checked":"Checked",
  "Official or original source":"Official source",
  "Add to my short list":"Save to shortlist",
  "Choose one or more starting points above. No name or private story is needed.":"Choose an option above to add it to your shortlist.",
  "No current items match this section. Use the always-available source finder below.":"No current items are listed here right now. See the local options below.",
  "Mostrando ${shown} de ${total} puntos de partida locales":"Mostrando ${shown} de ${total} opciones locales",
  "Ningún punto coincide con esos filtros. Borre un filtro o use una palabra más general.":"Ninguna opción coincide con esos filtros. Borre un filtro o pruebe una búsqueda más general.",
  "Cargando puntos de partida de Franklin…":"Cargando opciones de Franklin…",
  "Ruta de fuente revisada":"Revisado",
  "Fuente oficial / de primera parte":"Fuente oficial",
  "Añadir a mi lista":"Guardar en mi lista",
  "Elija uno o más puntos de partida. No se necesita ningún nombre ni historia privada.":"Elija una opción para añadirla a su lista.",
  "No hay elementos actuales en esta sección. Use el buscador de fuentes disponibles en todo momento.":"No hay elementos vigentes en esta sección. Consulte las opciones locales que aparecen abajo.",
}

SUSPECT_PATTERNS=[
  r'\bcanonical profiles?\b',r'\bsource routes?\b',r'\bevidence window\b',r'\bresponsible-source\b',r'\bstable local routes?\b',
  r'\bfollow-through plan\b',r'\bconflicts? suppressed\b',r'\bfail-closed\b',r'\bqualified successor\b',r'\bconsumer acceptance\b',
  r'\bcurrent pointer\b',r'\bprofile factory\b',r'\blocal investigator\b',r'\bSCC\b',r'\bSRE\b',r'\bPF74\b',r'\bhandoff\b',
  r'\bpayload\b',r'\bmanifest\b',r'\bruntime pair\b',r'\bquarantin(?:e|ed)\b',r'\bproducer candidate\b',r'\bexact artifact\b',
  r'perfiles? canónicos?',r'rutas? de fuentes?',r'ventana de evidencia',r'fuentes responsables',r'rutas locales estables',
  r'aceptación del consumidor',r'puntero actual',r'perfil(?:es)? factory',r'investigador local',r'cuarenten',r'carga útil'
]

def visible_text(raw:str)->str:
    raw=re.sub(r'<script\b[^>]*>[\s\S]*?</script>',' ',raw,flags=re.I)
    raw=re.sub(r'<style\b[^>]*>[\s\S]*?</style>',' ',raw,flags=re.I)
    raw=re.sub(r'<head\b[^>]*>[\s\S]*?</head>',' ',raw,flags=re.I)
    raw=re.sub(r'<[^>]+>',' ',raw)
    return re.sub(r'\s+',' ',html.unescape(raw)).strip()

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--apply',action='store_true');args=ap.parse_args()
    changed=[];counts={k:0 for k in REPLACEMENTS};js_counts={k:0 for k in JS_REPLACEMENTS}
    html_files=sorted((ROOT/'dist').rglob('*.html'))
    for path in html_files:
        raw=path.read_text('utf-8');new=raw
        for old,new_text in REPLACEMENTS.items():
            c=new.count(old)
            if c:counts[old]+=c;new=new.replace(old,new_text)
        if new!=raw:
            changed.append(path.relative_to(ROOT).as_posix())
            if args.apply:path.write_text(new,'utf-8')
    js_path=ROOT/'dist/assets/community-explorer.js'
    if js_path.exists():
        raw=js_path.read_text('utf-8');new=raw
        for old,new_text in JS_REPLACEMENTS.items():
            c=new.count(old)
            if c:js_counts[old]+=c;new=new.replace(old,new_text)
        if new!=raw:
            changed.append(js_path.relative_to(ROOT).as_posix())
            if args.apply:js_path.write_text(new,'utf-8')
    suspects=[]
    for path in html_files:
        raw=path.read_text('utf-8') if args.apply else path.read_text('utf-8')
        text=visible_text(raw)
        for pat in SUSPECT_PATTERNS:
            m=re.search(pat,text,flags=re.I)
            if m:
                suspects.append({'path':path.relative_to(ROOT).as_posix(),'pattern':pat,'match':m.group(0),'context':text[max(0,m.start()-90):m.end()+120]})
                if len(suspects)>=250:break
        if len(suspects)>=250:break
    report={
      'schemaVersion':'franklin.hf31.public-language-scrub.v1','apply':args.apply,'htmlFilesScanned':len(html_files),
      'changedFiles':len(set(changed)),'changedFileSamples':sorted(set(changed))[:100],
      'replacementCounts':{k:v for k,v in counts.items() if v},'jsReplacementCounts':{k:v for k,v in js_counts.items() if v},
      'remainingSuspectVisibleMatches':len(suspects),'remainingSuspectSamples':suspects,
      'protectedScope':'Exact UI-language substitutions only; no profile facts, ranking, prices, runtime, payment or safety state are authored by this script.'
    }
    REPORT.parent.mkdir(parents=True,exist_ok=True);REPORT.write_text(json.dumps(report,indent=2,ensure_ascii=False,sort_keys=True)+'\n','utf-8')
    print(json.dumps({'changedFiles':report['changedFiles'],'remainingSuspectVisibleMatches':report['remainingSuspectVisibleMatches']},sort_keys=True))

if __name__=='__main__':main()
