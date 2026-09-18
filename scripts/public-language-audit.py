#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import re, sys, json

ROOT=Path(__file__).resolve().parents[1]/'dist'
EXCLUDED_PREFIXES=('owner-issues/','owner/','admin/','internal/')

PATTERNS=[
  ('builder-language',re.compile(r'\b(?:build command|builder packet|qualified successor|candidate release)\b',re.I)),
  ('release-language',re.compile(r'\b(?:release version|release candidate|deployment|runtime version|production runtime|exact[- ]source|source tree|rollback lineage|in this release)\b',re.I)),
  ('coordination-language',re.compile(r'\b(?:Profile Factory|Local Investigator|Smarter Justice donor|currentness|canonical pointer|authority transfer|writable product lane|active edition)\b',re.I)),
  ('data-pipeline-language',re.compile(r'\b(?:source[- ]backed|source handoff|provenance|consumer acceptance|ingestion pipeline|evidence packet)\b',re.I)),
  ('assistant-implementation-language',re.compile(r'\b(?:behind the scenes|current browser tab|raw chat history|current Assistant flow|AI provider)\b',re.I)),
  ('internal-label-language',re.compile(r'\b(?:internal only|developer language|implementation detail|technical architecture)\b',re.I)),
]

class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip_depth=0
        self.parts=[]
    def handle_starttag(self,tag,attrs):
        if self.skip_depth:
            self.skip_depth+=1
            return
        a=dict(attrs)
        classes=set(str(a.get('class','')).split())
        if tag in {'script','style','template','noscript','svg'} or a.get('id')=='sources' or 'profile-currentness' in classes:
            self.skip_depth=1
    def handle_startendtag(self,tag,attrs):
        return
    def handle_endtag(self,tag):
        if self.skip_depth:
            self.skip_depth-=1
    def handle_data(self,data):
        if not self.skip_depth:
            s=' '.join(data.split())
            if s:self.parts.append(s)

def rendered_profile_text(text):
    # Mirror the common resident-facing profile cleanup in app.js. Internal
    # sourcing/currentness mechanics remain available to data/quality systems,
    # but they are not part of the rendered resident copy.
    text=re.sub(r'\s*—\s*source-backed service area; street address not asserted\s*',' ',text,flags=re.I)
    text=re.sub(r'\s*—\s*service/location identity source-backed; street address not asserted in this release\s*',' ',text,flags=re.I)
    text=re.sub(r'\s*—\s*source-backed service area\s*',' ',text,flags=re.I)
    text=re.sub(r'No direct contact route is available in the current public sources\.?','Contact information is not currently available on this profile.',text,flags=re.I)
    text=re.sub(r'Use the verified contact and source links on this page to confirm current services, hours, pricing and availability\.',
                'Contact the business or organization directly to confirm current services, hours, pricing and availability.',text,flags=re.I)
    text=re.sub(r'These are source-backed official routes\. No official social accounts are shown because none were verified in the source handoff used for this profile\.?','',text,flags=re.I)
    return ' '.join(text.split())

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
    if rel.startswith('profiles/'):
        text=rendered_profile_text(text)
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
