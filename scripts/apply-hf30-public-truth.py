#!/usr/bin/env python3
from __future__ import annotations
import pathlib, re, collections, json

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
RELEASE = 'FR-NAV1.19.0-HF3.0-CANDIDATE'
META_RE = re.compile(r'(<meta\s+name=["\']franklin-release["\']\s+content=["\'])([^"\']+)(["\'])', re.I)
META_RE_REVERSED = re.compile(r'(<meta\s+content=["\'])([^"\']+)(["\']\s+name=["\']franklin-release["\'])', re.I)

COPY_REPLACEMENTS = {
    'dist/index.html': (
        'Checked September 3, 2026. Time-sensitive items link to the original source and are removed when they are no longer current.',
        'Sources were last refreshed September 3, 2026. Time-sensitive items link to the original source; confirm current details there before acting.'
    ),
    'dist/today/index.html': (
        'Checked September 3, 2026 · changing details link to the source',
        'Sources last refreshed September 3, 2026 · confirm changing details at the original source'
    ),
    'dist/es/index.html': (
        'Revisado el 3 de septiembre de 2026. Los elementos con fecha enlazan a la fuente original y se eliminan cuando dejan de estar vigentes.',
        'Fuentes revisadas por última vez el 3 de septiembre de 2026. Los elementos con fecha enlazan a la fuente original; confirme allí los detalles actuales antes de actuar.'
    ),
    'dist/es/hoy/index.html': (
        'Revisado el 3 de septiembre de 2026 · los datos cambiantes enlazan a la fuente',
        'Fuentes revisadas por última vez el 3 de septiembre de 2026 · confirme los datos cambiantes en la fuente original'
    ),
}

def replace_marker(text: str) -> tuple[str, str | None]:
    m = META_RE.search(text)
    if m:
        old = m.group(2)
        return META_RE.sub(lambda x: x.group(1) + RELEASE + x.group(3), text, count=1), old
    m = META_RE_REVERSED.search(text)
    if m:
        old = m.group(2)
        return META_RE_REVERSED.sub(lambda x: x.group(1) + RELEASE + x.group(3), text, count=1), old
    return text, None

def main() -> None:
    htmls = sorted(DIST.rglob('index.html'))
    before = collections.Counter()
    changed = 0
    missing = []
    for path in htmls:
        rel = path.relative_to(ROOT).as_posix()
        text = path.read_text('utf-8')
        updated, old = replace_marker(text)
        if old is None:
            missing.append(rel)
            continue
        before[old] += 1
        if rel in COPY_REPLACEMENTS:
            src, dst = COPY_REPLACEMENTS[rel]
            count = updated.count(src)
            if count != 1:
                raise SystemExit(f'{rel}: expected exactly one currentness phrase, got {count}')
            updated = updated.replace(src, dst, 1)
        if updated != text:
            path.write_text(updated, 'utf-8', newline='')
            changed += 1
    if missing:
        raise SystemExit('Missing franklin-release marker: ' + ', '.join(missing[:20]))
    if len(htmls) != 19355:
        raise SystemExit(f'Unexpected public index count: {len(htmls)}')
    if changed != len(htmls):
        raise SystemExit(f'Expected all {len(htmls)} public index pages to change; changed {changed}')
    print(json.dumps({
        'status':'PASS',
        'release':RELEASE,
        'publicIndexPages':len(htmls),
        'changedPages':changed,
        'oldMarkerCounts':dict(before),
        'freshnessCopyPages':sorted(COPY_REPLACEMENTS),
    }, sort_keys=True))

if __name__ == '__main__':
    main()
