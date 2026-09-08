#!/usr/bin/env python3
from pathlib import Path

FILES = [Path('dist/directory/index.html'), Path('dist/es/directorio/index.html')]
CSS_ANCHOR = '<link href="/assets/local-followthrough.css" rel="stylesheet"/>'
CSS_TAG = '<link data-hf28-directory="1" href="/assets/hf28-directory.css" rel="stylesheet"/>'
JS_ANCHOR = '<script defer="" src="/assets/local-discovery.js"></script>'
JS_TAG = '<script data-hf28-directory="1" defer="" src="/assets/hf28-directory.js"></script>'

for path in FILES:
    text = path.read_text('utf-8')
    if CSS_TAG not in text:
        if CSS_ANCHOR not in text:
            raise SystemExit(f'CSS anchor missing: {path}')
        text = text.replace(CSS_ANCHOR, CSS_ANCHOR + CSS_TAG, 1)
    if JS_TAG not in text:
        if JS_ANCHOR not in text:
            raise SystemExit(f'JS anchor missing: {path}')
        text = text.replace(JS_ANCHOR, JS_ANCHOR + JS_TAG, 1)
    path.write_text(text, 'utf-8')
    print(f'HF28_TAGS_READY {path}')
