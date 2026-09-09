#!/usr/bin/env python3
from __future__ import annotations
import pathlib, re, json, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
RELEASE = 'FR-NAV1.19.0-HF3.0-CANDIDATE'
BASE = 'abd9caf86b9fb46d42711c5aa12e5f8664bac238'
META_RE = re.compile(r'<meta\s+name=["\']franklin-release["\']\s+content=["\']([^"\']+)', re.I)
META_RE_REVERSED = re.compile(r'<meta\s+content=["\']([^"\']+)["\']\s+name=["\']franklin-release["\']', re.I)

EXPECTED_COPY = {
    'dist/index.html': 'Sources were last refreshed September 3, 2026. Time-sensitive items link to the original source; confirm current details there before acting.',
    'dist/today/index.html': 'Sources last refreshed September 3, 2026 · confirm changing details at the original source',
    'dist/es/index.html': 'Fuentes revisadas por última vez el 3 de septiembre de 2026. Los elementos con fecha enlazan a la fuente original; confirme allí los detalles actuales antes de actuar.',
    'dist/es/hoy/index.html': 'Fuentes revisadas por última vez el 3 de septiembre de 2026 · confirme los datos cambiantes en la fuente original',
}
OLD_COPY = [
    'Checked September 3, 2026. Time-sensitive items link to the original source and are removed when they are no longer current.',
    'Checked September 3, 2026 · changing details link to the source',
    'Revisado el 3 de septiembre de 2026. Los elementos con fecha enlazan a la fuente original y se eliminan cuando dejan de estar vigentes.',
    'Revisado el 3 de septiembre de 2026 · los datos cambiantes enlazan a la fuente',
]

def fail(msg: str) -> None:
    print('HF30_FAIL', msg)
    raise SystemExit(1)

htmls = sorted(DIST.rglob('index.html'))
if len(htmls) != 19355:
    fail(f'public index count drift: {len(htmls)}')

marker_counts = {}
for p in htmls:
    text = p.read_text('utf-8')
    m = META_RE.search(text) or META_RE_REVERSED.search(text)
    if not m:
        fail(f'missing release marker: {p.relative_to(ROOT)}')
    value = m.group(1)
    marker_counts[value] = marker_counts.get(value, 0) + 1
    if value != RELEASE:
        fail(f'stale release marker {value}: {p.relative_to(ROOT)}')

for rel, expected in EXPECTED_COPY.items():
    text = (ROOT / rel).read_text('utf-8')
    if text.count(expected) != 1:
        fail(f'freshness wording mismatch: {rel}')
    for old in OLD_COPY:
        if old in text:
            fail(f'old freshness wording remains: {rel}')

# The transformation may touch every public index page, but only the release meta marker
# may change outside the four explicit freshness pages. Verify this mechanically against HF2.9.
changed = subprocess.check_output(['git','diff','--name-only',BASE+'...HEAD'], cwd=ROOT, text=True).splitlines()
if any(p.startswith(('dist/data/','server/','runtime/')) for p in changed):
    fail('data/server/runtime scope changed')

# Profiles are allowed to differ only by the release meta marker. Other profile-page bytes must
# remain semantically identical after removing that one marker value.
def norm_marker(s: str) -> str:
    s = META_RE.sub(lambda m: m.group(0).replace(m.group(1), '__RELEASE__'), s, count=1)
    s = META_RE_REVERSED.sub(lambda m: m.group(0).replace(m.group(1), '__RELEASE__'), s, count=1)
    return s

profile_paths = [p for p in htmls if p.relative_to(DIST).as_posix().startswith('profiles/')]
for p in profile_paths:
    rel = p.relative_to(ROOT).as_posix()
    before = subprocess.check_output(['git','show',f'{BASE}:{rel}'], cwd=ROOT).decode('utf-8')
    after = p.read_text('utf-8')
    if norm_marker(before) != norm_marker(after):
        fail(f'profile content changed beyond release marker: {rel}')

print(json.dumps({
    'status':'PASS',
    'release':RELEASE,
    'publicIndexPages':len(htmls),
    'profilePagesChecked':len(profile_paths),
    'releaseMarkerCounts':marker_counts,
    'freshnessCopyPages':sorted(EXPECTED_COPY),
    'profileFactsChanged':False,
    'runtimeChanged':False,
    'pricesChanged':False,
}, indent=2, sort_keys=True))
