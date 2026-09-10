#!/usr/bin/env python3
from pathlib import Path
import json
import re

DIST = Path('dist')
VERSION = 'frnav1211h1'
RELEASE = 'FR-NAV1.21.1-HF3.2-HOTFIX1'

payload_obj = json.loads((DIST / 'data' / 'franklin-activities.json').read_text(encoding='utf-8'))
payload_js = 'window.__FRANKLIN_ACTIVITY_CATALOG__=' + json.dumps(payload_obj, ensure_ascii=True, separators=(',', ':')) + ';\n'
embedded_asset = DIST / 'assets' / 'franklin-activities-embedded.js'
embedded_asset.write_text(payload_js, encoding='utf-8')

css = (
    f'<link rel="stylesheet" href="/assets/hf32-site-cleanup.css?v={VERSION}" data-hf32-direct-css="1">'
    f'<link rel="stylesheet" href="/assets/hf32-sitewide-review.css?v={VERSION}" data-hf32-review-css="1">'
    f'<link rel="stylesheet" href="/assets/hf32-explorer-hotfix.css?v={VERSION}" data-hf32-explorer-hotfix-css="1">'
)

runtime = (
    f'<script src="/assets/franklin-activities-embedded.js?v={VERSION}" defer data-explorer-static-payload="1"></script>'
    f'<script src="/assets/hf32-explorer-hotfix.js?v={VERSION}" defer data-hf32-explorer-hotfix="1"></script>'
)

# English and Spanish pages serialize script attributes in different orders.
community_script_re = re.compile(r'<script\b[^>]*\bsrc="/assets/community-explorer\.js(?:\?[^\"]*)?"[^>]*></script>', re.I)


def add_body_classes(text: str) -> str:
    def repl(match):
        attrs = match.group(1)
        class_match = re.search(r'class="([^"]*)"', attrs)
        wanted = ['hf32-site-cleanup', 'hf31-explorer-page', 'hf32-explorer-hotfix']
        if class_match:
            classes = class_match.group(1).split()
            for name in wanted:
                if name not in classes:
                    classes.append(name)
            attrs2 = attrs[:class_match.start()] + 'class="' + ' '.join(classes) + '"' + attrs[class_match.end():]
            return '<body' + attrs2 + '>'
        return '<body class="' + ' '.join(wanted) + '"' + attrs + '>'
    return re.sub(r'<body([^>]*)>', repl, text, count=1, flags=re.I)

changed = []
for page in sorted(DIST.rglob('*.html')):
    text = page.read_text(encoding='utf-8')
    if 'data-community-explorer' not in text:
        continue

    original = text
    text = re.sub(r'<link[^>]+data-hf32-(?:direct-css|review-css|explorer-hotfix-css)="1"[^>]*>', '', text)
    text = re.sub(r'<script type="application/json" data-explorer-static-payload>[\s\S]*?</script>', '', text)
    text = re.sub(r'<script[^>]+data-explorer-static-payload="1"[^>]*></script>', '', text)
    text = re.sub(r'<script[^>]+data-hf32-explorer-hotfix="1"[^>]*></script>', '', text)
    text = add_body_classes(text)

    # Mark this patched explorer family explicitly without changing authoritative facts.
    text = re.sub(
        r'(<meta\s+name="franklin-release"\s+content=")[^"]+("[^>]*>)',
        rf'\g<1>{RELEASE}\2',
        text,
        count=1,
        flags=re.I,
    )
    text = re.sub(
        r'(<meta\s+content=")[^"]+("\s+name="franklin-release"[^>]*>)',
        rf'\g<1>{RELEASE}\2',
        text,
        count=1,
        flags=re.I,
    )

    if '</head>' not in text:
        raise RuntimeError(f'Missing </head>: {page}')
    text = text.replace('</head>', css + '</head>', 1)

    match = community_script_re.search(text)
    if not match:
        raise RuntimeError(f'Community explorer script tag not found: {page}')
    pinned = f'<script src="/assets/community-explorer.js?v={VERSION}" defer></script>'
    text = text[:match.start()] + runtime + pinned + text[match.end():]

    if original != text:
        page.write_text(text, encoding='utf-8')
        changed.append(str(page))

print(f'Pinned direct explorer hotfix on {len(changed)} pages')
print(f'Materialized accepted catalog asset: {embedded_asset}')
for item in changed:
    print(item)
