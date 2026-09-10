#!/usr/bin/env python3
from __future__ import annotations
import pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
TAG='<script src="/assets/hf31-deep-language-runtime.js" defer data-hf31-deep-language-runtime="1"></script>'
changed=[]
for path in sorted((ROOT/'dist').rglob('*.html')):
    raw=path.read_text('utf-8')
    if 'data-community-explorer' not in raw or 'data-hf31-deep-language-runtime' in raw:continue
    if '</body>' not in raw:raise SystemExit(f'Missing body close: {path}')
    path.write_text(raw.replace('</body>',TAG+'</body>',1),'utf-8')
    changed.append(path.relative_to(ROOT).as_posix())
print(f'HF31_DEEP_RUNTIME_INJECTION_PASS changed={len(changed)}')
if not changed:raise SystemExit('No community-explorer pages were updated')
