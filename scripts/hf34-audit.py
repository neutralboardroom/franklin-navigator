#!/usr/bin/env python3
from pathlib import Path
from collections import Counter, defaultdict
import json,re,sys
from bs4 import BeautifulSoup

ROOT=Path('dist')
REPORT_JSON=Path('HF34_FULL_AUDIT_REPORT.json')
REPORT_MD=Path('HF34_FULL_AUDIT_REPORT.md')

JARGON=[
 'consumer acceptance','accepted head','producer-qualified','canonical profile','source route',
 'raw list export','public contactability','controlled audience','evidence window','coverage floor',
 'candidate','handoff','ingestion','canonization','not deployed','deep local pathways','deep legal'
]


def route_for(path:Path):
    rel=path.relative_to(ROOT).as_posix()
    if rel=='index.html': return '/'
    if rel.endswith('/index.html'): return '/'+rel[:-10]
    return '/'+rel

def family(route):
    if route.startswith('/profiles/'): return 'profile'
    if route.startswith('/sports/') or route in ['/sports/','/activities/','/learning/','/outdoors/','/arts-entertainment/','/teams-clubs/','/school-activities/','/youth-family/'] or route.startswith('/es/deportes/'): return 'explorer'
    if route.startswith('/directory') or route.startswith('/es/directorio'): return 'directory'
    if route.startswith('/community-help-center') or route.startswith('/es/centro-de-ayuda') or route.startswith('/help/'): return 'help'
    if route.startswith('/business') or route.startswith('/membership') or route.startswith('/member-') or route.startswith('/claim-profile') or route.startswith('/profile-studio'): return 'business'
    if route.startswith('/my-franklin') or route.startswith('/es/mi-franklin'): return 'workspace'
    if route.startswith('/corrections'): return 'corrections'
    return 'general'

def txt(el):
    return ' '.join(el.get_text(' ',strip=True).split()) if el else ''

def direct_children_main(main):
    return [x for x in main.find_all(recursive=False) if getattr(x,'name',None)] if main else []

pages=[]
family_counts=Counter()
issues=Counter()
examples=defaultdict(list)

for path in ROOT.rglob('*.html'):
    try: raw=path.read_text(encoding='utf-8',errors='replace')
    except Exception: continue
    soup=BeautifulSoup(raw,'html.parser')
    route=route_for(path); fam=family(route); family_counts[fam]+=1
    main=soup.find('main'); header=soup.find('header'); footer=soup.find('footer')
    primary=header.find('nav') if header else None
    nav_direct=[]
    if primary:
        for child in primary.find_all(recursive=False):
            if child.name=='a': nav_direct.append(txt(child))
            elif child.name=='details':
                s=child.find('summary'); nav_direct.append(txt(s) or 'More')
    footer_nav=footer.find('nav') if footer else None
    footer_links=len(footer_nav.find_all('a')) if footer_nav else 0
    main_children=direct_children_main(main)
    sections=[x for x in main_children if x.name=='section']
    forms=len(main.find_all('form')) if main else 0
    actions=len(main.find_all(['button','a'])) if main else 0
    h1=len(main.find_all('h1')) if main else 0
    scripts=[s.get('src','INLINE') for s in soup.find_all('script')]
    blank=[]
    for i,s in enumerate(sections):
        t=txt(s)
        has_media=bool(s.find(['img','video','iframe','form','input','select','textarea','canvas','svg']))
        if len(t)<30 and not has_media:
            blank.append({'index':i,'class':' '.join(s.get('class',[])),'text':t[:120]})
    more_bad=[]
    for el in soup.find_all(['a','button','summary']):
        t=txt(el)
        if re.fullmatch(r'(?:More|Más)\s*(?:\.\.\.|…|\+)',t,re.I): more_bad.append(t)
    lower=txt(main).lower() if main else ''
    jargon=[j for j in JARGON if j in lower]
    correction_links=[]
    if fam=='profile':
        for a in soup.find_all('a',href=True):
            h=a['href']
            if '/corrections/' in h:
                correction_links.append({'href':h,'has_profile':'profile=' in h})
    page_issues=[]
    if len(nav_direct)>5: page_issues.append('primary_nav_too_many')
    if footer_links>8: page_issues.append('footer_too_many')
    if len(sections)>9: page_issues.append('too_many_top_sections')
    if actions>65 and fam not in ('directory','profile'): page_issues.append('too_many_actions')
    if h1!=1: page_issues.append('h1_count')
    if blank: page_issues.append('blank_top_sections')
    if more_bad: page_issues.append('raw_more_labels')
    if jargon: page_issues.append('public_internal_jargon')
    if fam=='profile' and any(not x['has_profile'] for x in correction_links): page_issues.append('profile_correction_link_missing_profile_id')
    if fam=='explorer':
        if 'community-explorer.js' not in ' '.join(scripts): page_issues.append('explorer_missing_runtime')
        if 'hf31-deep-language-runtime.js' in ' '.join(scripts): page_issues.append('explorer_global_mutation_runtime')
    for issue in page_issues:
        issues[issue]+=1
        if len(examples[issue])<12: examples[issue].append(route)
    pages.append({
        'route':route,'family':fam,'size':len(raw),'nav':nav_direct,'footerLinks':footer_links,
        'topSections':len(sections),'actions':actions,'h1Count':h1,'scripts':scripts,
        'blankSections':blank,'moreLabels':more_bad,'jargon':jargon,'issues':page_issues,
        'profileCorrectionLinks':correction_links[:6]
    })

# largest and densest pages
largest=sorted(pages,key=lambda x:x['size'],reverse=True)[:30]
dense=sorted([p for p in pages if p['family']!='profile'],key=lambda x:(x['topSections'],x['actions']),reverse=True)[:30]
summary={
 'pageCount':len(pages),
 'familyCounts':dict(family_counts),
 'issueCounts':dict(issues),
 'issueExamples':dict(examples),
 'largestPages':[{'route':p['route'],'family':p['family'],'bytes':p['size'],'sections':p['topSections'],'actions':p['actions']} for p in largest],
 'densestNonProfilePages':[{'route':p['route'],'family':p['family'],'bytes':p['size'],'sections':p['topSections'],'actions':p['actions']} for p in dense],
 'pages':pages
}
REPORT_JSON.write_text(json.dumps(summary,indent=2),encoding='utf-8')

lines=['# Franklin Navigator HF3.4 Full Audit','',f'- Pages audited: **{len(pages):,}**','', '## Family counts']
for k,v in family_counts.most_common(): lines.append(f'- {k}: {v:,}')
lines+=['','## Issue counts']
for k,v in issues.most_common():
    lines.append(f'- **{k}**: {v:,}')
    if examples[k]: lines.append('  - examples: '+', '.join(examples[k][:8]))
lines+=['','## Densest non-profile pages']
for p in dense[:20]: lines.append(f"- `{p['route']}` — {p['topSections']} top sections, {p['actions']} actions, {p['size']:,} bytes")
lines+=['','## Largest pages']
for p in largest[:20]: lines.append(f"- `{p['route']}` — {p['size']:,} bytes, {p['topSections']} sections")
REPORT_MD.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in summary.items() if k!='pages'},indent=2))
