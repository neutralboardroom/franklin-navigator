#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import re, sys, json

ROOT=Path(__file__).resolve().parents[1]/'dist'
# Owner/operations pages are intentionally not resident-facing.
EXCLUDED_PREFIXES=('owner-issues/','owner/','admin/','internal/')
# Phrases that expose product-development or coordination mechanics rather than resident value.
PATTERNS=[
  ('builder-language',re.compile(r'\b(?:builder|build command|build packet|qualified successor|candidate release)\b',re.I)),
  ('release-language',re.compile(r'\b(?:release version|release candidate|deployment|runtime version|production runtime|exact[- ]source|source tree|rollback lineage)\b',re.I)),
  ('coordination-language',re.compile(r'\b(?:SCC|Profile Factory|Local Investigator|Smarter Justice donor|D1|D2|currentness|canonical pointer|authority transfer|writable product lane|active edition)\b',re.I)),
  ('data-pipeline-language',re.compile(r'\b(?:source[- ]backed|source handoff|provenance|manifest|consumer acceptance|ingestion pipeline|evidence packet)\b',re.I)),
  ('assistant-implementation-language',re.compile(r'\b(?:behind the scenes|current browser tab|raw chat history|current Assistant flow|AI provider)\b',re.I)),
  ('internal-label-language',re.compile(r'\b(?:internal only|developer language|implementation detail|technical architecture)\b',re.I)),
]

class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth=0
        self.parts=[]
    def handle_starttag(self,tag,attrs):
        if tag in {'script','style','template','noscript','svg'}: self.depth+=1
    def handle_endtag(self,tag):
        if tag in {'script','style','template','noscript','svg'} and self.depth: self.depth-=1
    def handle_data(self,data):
        if not self.depth:
            s=' '.join(data.split())
            if s:self.parts.append(s)

findings=[]
checked=0
for p in ROOT.rglob('*.html'):
    rel=str(p.relative_to(ROOT))
    if rel.startswith(EXCLUDED_PREFIXES): continue
    parser=VisibleText()
    try: parser.feed(p.read_text(errors='replace'))
    except Exception as e:
        findings.append({'page':rel,'kind':'parse-error','text':str(e)[:180]});continue
    text=' '.join(parser.parts)
    checked+=1
    for kind,rx in PATTERNS:
        for m in rx.finditer(text):
            findings.append({'page':rel,'kind':kind,'text':text[max(0,m.start()-90):m.end()+130]})
            if len(findings)>=400: break
        if len(findings)>=400: break
    if len(findings)>=400: break

result={'publicPagesChecked':checked,'findingCount':len(findings),'findings':findings}
print(json.dumps(result,indent=2,ensure_ascii=False))
if findings: sys.exit(1)
