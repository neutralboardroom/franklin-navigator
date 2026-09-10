from pathlib import Path
import json, re

ROOT=Path('.')
TEXT_EXT={'.html','.js','.json','.md','.txt','.css','.sql','.yml','.yaml'}
needles={
 'old_annual_price_id':'price_1UAfMaRxNra9nizoTaVYp2v9',
 'old_36_price_id':'price_1UAfMzRxNra9nizo0cVPrbqU',
 'old_annual_lookup':'franklin_community_member_annual_v5',
 'old_36_lookup':'franklin_charter_member_36_month_v5',
 'new_annual_price_id':'price_1UE31nRxNra9nizoEPyavVQF',
 'new_36_price_id':'price_1UE31xRxNra9nizo0gBeYslr',
 'new_annual_lookup':'franklin_community_member_annual_v6',
 'new_36_lookup':'franklin_charter_member_36_month_v6',
 'annual_50':'$50',
 'term_120':'$120',
 'annual_35':'$35',
 'term_90':'$90',
 'correction_word':'correction',
 'removal_word':'removal',
 'suppress_word':'suppress',
}
rows={k:[] for k in needles}
for p in ROOT.rglob('*'):
    if not p.is_file() or p.suffix.lower() not in TEXT_EXT: continue
    if '.git' in p.parts: continue
    try: txt=p.read_text(encoding='utf-8')
    except Exception: continue
    for k,n in needles.items():
        if n.lower() in txt.lower():
            # record up to 20 exact line occurrences per file/key
            matches=[]
            for i,line in enumerate(txt.splitlines(),1):
                if n.lower() in line.lower():
                    matches.append({'line':i,'text':line.strip()[:500]})
                    if len(matches)>=20: break
            rows[k].append({'path':p.as_posix(),'matches':matches})
report={'schema':'franklin.p0.v6.audit.v1','needles':needles,'results':rows}
Path('evidence/p0-v6').mkdir(parents=True,exist_ok=True)
Path('evidence/p0-v6/PRE_CHANGE_PRICING_REMOVAL_AUDIT.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
for k in needles:
    print(k,len(rows[k]))
