#!/usr/bin/env python3
from __future__ import annotations
import json, pathlib, re
from html.parser import HTMLParser

ROOT=pathlib.Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
OUT=ROOT/'evidence/hf31/SPANISH_LANGUAGE_AUDIT_CANDIDATES.json'

INFORMAL_PATTERNS=[
    r'\bte\b',r'\bti\b',r'\btu\b',r'\btus\b',r'\bcontigo\b',
    r'\bno escribas\b',r'\belige\b',r'\busa\b',r'\bguarda\b',r'\babre\b',r'\bbusca\b',
    r'\bcompara\b',r'\bconfirma\b',r'\brevisa\b',r'\bev(?:ita|ite)\b',r'\bprepárate\b',
    r'\breúne\b',r'\bhaz\b',r'\bprueba\b',r'\bmantén\b',r'\bvuelve\b',r'\bvisita\b',
    r'\bcontacta\b',r'\bconsulta\b',r'\bempieza\b',r'\bcomienza\b',r'\bcompleta\b',
]
INFORMAL_RE=re.compile('|'.join(f'(?:{p})' for p in INFORMAL_PATTERNS),re.I)
MOJIBAKE_RE=re.compile(r'[�]|Ã.|Â.')
ENGLISH_UI_RE=re.compile(
    r'\b(?:Search|More filters|More links|More tools|More contact options|Save|Clear all|Copy link|Share|Print|Download|Open profile|Compare now|Previous|Next|Retry loading|Back to filters|Source date|All categories|All types|All areas|Recently checked|Website available|Exact address available|Page \d+ of \d+|No tasks match|Start a task|Get It Done|Find Local|Today)\b',
    re.I
)
INTENTIONAL_EXACT={'English','Franklin Navigator','Franklin Assistant','JSON'}

class VisibleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.skip=0;self.items=[]
    def handle_starttag(self,tag,attrs):
        if tag.lower() in {'script','style','noscript','code','pre'}: self.skip+=1
        if self.skip:return
        d=dict(attrs)
        for key in ('aria-label','placeholder','title'):
            val=(d.get(key) or '').strip()
            if val:self.items.append((f'@{key}',val))
    def handle_endtag(self,tag):
        if tag.lower() in {'script','style','noscript','code','pre'} and self.skip:self.skip-=1
    def handle_data(self,data):
        if self.skip:return
        text=' '.join(data.split())
        if text:self.items.append(('text',text))

def page_items(path:pathlib.Path):
    p=VisibleParser();p.feed(path.read_text('utf-8'));return p.items

def main():
    pages=sorted((DIST/'es').rglob('index.html'))
    issues=[]
    counts={'informalRegister':0,'englishUi':0,'mojibake':0}
    for path in pages:
        rel=path.relative_to(ROOT).as_posix()
        seen=set()
        for kind,text in page_items(path):
            if text in INTENTIONAL_EXACT:continue
            flags=[]
            if INFORMAL_RE.search(text):flags.append('INFORMAL_OR_MIXED_REGISTER')
            if ENGLISH_UI_RE.search(text):
                # Language selector word "English" alone is intentional; mixed user-facing English is not.
                if text.strip()!='English':flags.append('POSSIBLE_UNTRANSLATED_ENGLISH_UI')
            if MOJIBAKE_RE.search(text):flags.append('MOJIBAKE_OR_ENCODING')
            for flag in flags:
                key=(rel,kind,text,flag)
                if key in seen:continue
                seen.add(key);issues.append({'path':rel,'location':kind,'flag':flag,'text':text})
                if flag.startswith('INFORMAL'):counts['informalRegister']+=1
                elif flag.startswith('POSSIBLE'):counts['englishUi']+=1
                else:counts['mojibake']+=1
    report={
        'schemaVersion':'franklin.hf31.spanish-language-audit-candidates.v1',
        'release':'FR-NAV1.20.0-HF3.1-CANDIDATE',
        'scope':'ALL_STATIC_PUBLIC_SPANISH_INDEX_PAGES_UNDER_DIST_ES_PLUS_RUNTIME_LIVE_SAMPLING_REQUIRED_SEPARATELY',
        'spanishIndexPages':len(pages),
        'candidateIssueCounts':counts,
        'note':'Candidates require human qualification; proper nouns and intentional product names are not automatically errors.',
        'candidates':issues,
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
    print(json.dumps({'status':'PASS','spanishIndexPages':len(pages),'candidateIssueCounts':counts,'candidates':len(issues)},ensure_ascii=False))

if __name__=='__main__':main()
