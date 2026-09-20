#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
AS_OF='2026-09-20'
class Events(HTMLParser):
    def __init__(self): super().__init__(); self.cards=[]; self.in_grid=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='div' and 'data-home-events' in a: self.in_grid=True
        if self.in_grid and tag=='article' and 'data-event-end' in a: self.cards.append(a)
for rel in ('dist/index.html','dist/es/index.html'):
    p=ROOT/rel; e=Events(); e.feed(p.read_text(errors='replace'))
    if not e.cards: raise SystemExit(f'{rel}: no static home-event cards')
    for c in e.cards:
        end=c.get('data-event-end','')
        if end[:10] < AS_OF: raise SystemExit(f'{rel}: expired static home card {end}')
print('PASS bilingual static home-event currentness at release seal')
