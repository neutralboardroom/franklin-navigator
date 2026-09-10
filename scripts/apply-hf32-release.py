#!/usr/bin/env python3
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
OLD='FR-NAV1.20.0-HF3.1-CANDIDATE'
NEW='FR-NAV1.21.0-HF3.2-CANDIDATE'
DIRECT='<script src="/assets/hf32-public.js" defer data-hf32-direct="1"></script>'
LOADER_MARK='/* HF3.2 — owner-approved simplification layer. */'

pages=sorted(DIST.rglob('index.html'))
if len(pages)!=19355:
    raise SystemExit(f'expected 19355 public index pages, found {len(pages)}')

updated=0
injected=0
for page in pages:
    text=page.read_text(encoding='utf-8')
    original=text
    # Truthful release identity on every public page.
    text,n=re.subn(r'(<meta\s+[^>]*name=["\']franklin-release["\'][^>]*content=["\'])[^"\']+(["\'][^>]*>)',rf'\g<1>{NEW}\g<2>',text,count=1,flags=re.I)
    if n==0:
        text,n=re.subn(r'(<meta\s+[^>]*content=["\'])[^"\']+(["\'][^>]*name=["\']franklin-release["\'][^>]*>)',rf'\g<1>{NEW}\g<2>',text,count=1,flags=re.I)
    if n!=1:
        raise SystemExit(f'missing or ambiguous franklin-release meta: {page.relative_to(ROOT)}')
    # The shared HF3.2 layer must be an independent script tag so an older
    # page-specific JavaScript exception cannot prevent it from loading.
    if 'data-hf32-direct=' not in text:
        if '</body>' not in text.lower():
            raise SystemExit(f'missing body close: {page.relative_to(ROOT)}')
        pos=text.lower().rfind('</body>')
        text=text[:pos]+DIRECT+text[pos:]
        injected+=1
    if text!=original:
        page.write_text(text,encoding='utf-8')
        updated+=1

# Remove the temporary r37 dynamic loader. Direct page loading above is more
# robust and avoids duplicate execution/races.
r37=DIST/'assets'/'r37-i18n.js'
text=r37.read_text(encoding='utf-8')
if LOADER_MARK in text:
    start=text.index(LOADER_MARK)
    # Marker begins immediately before the loader IIFE. Remove through its
    # closing `})();`, preserving everything before and after it.
    end=text.find('})();',start)
    if end<0:
        raise SystemExit('HF3.2 loader marker found without closing IIFE')
    end+=5
    text=(text[:start].rstrip()+text[end:]).rstrip()+'\n'
    r37.write_text(text,encoding='utf-8')

# Load visual rules before paint through the already-universal r37 stylesheet.
r37css=DIST/'assets'/'r37.css'
css=r37css.read_text(encoding='utf-8')
imp="@import url('/assets/hf32-public.css');\n"
if imp not in css:
    r37css.write_text(imp+css,encoding='utf-8')

# Final assertions.
for page in pages:
    text=page.read_text(encoding='utf-8')
    if text.count('data-hf32-direct="1"')!=1:
        raise SystemExit(f'HF3.2 direct loader count != 1: {page.relative_to(ROOT)}')
    m=re.search(r'<meta\s+[^>]*name=["\']franklin-release["\'][^>]*content=["\']([^"\']+)',text,re.I)
    if not m:
        m=re.search(r'<meta\s+[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']franklin-release["\']',text,re.I)
    if not m or m.group(1)!=NEW:
        raise SystemExit(f'release marker mismatch: {page.relative_to(ROOT)}')

print(f'HF3.2 release pass complete pages={len(pages)} updated={updated} injected={injected} release={NEW}')
