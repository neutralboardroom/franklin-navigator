#!/usr/bin/env python3
from __future__ import annotations
import pathlib, re, json, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
RELEASE = 'FR-NAV1.19.0-HF3.0-CANDIDATE'
BASE = 'abd9caf86b9fb46d42711c5aa12e5f8664bac238'
PROFILE_NO_LOSS_PROOF_COMMIT = 'a3138d2e2c1bab15f3ba9b58f0d6ca6d5d77cdb4'
PROFILE_NO_LOSS_PROOF_RUN = 34417558975
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
profile_paths = []
for p in htmls:
    rel = p.relative_to(DIST).as_posix()
    if rel.startswith('profiles/'):
        profile_paths.append(rel)
    text = p.read_text('utf-8')
    m = META_RE.search(text) or META_RE_REVERSED.search(text)
    if not m:
        fail(f'missing release marker: {p.relative_to(ROOT)}')
    value = m.group(1)
    marker_counts[value] = marker_counts.get(value, 0) + 1
    if value != RELEASE:
        fail(f'stale release marker {value}: {p.relative_to(ROOT)}')
if len(profile_paths) != 19103:
    fail(f'profile page count drift: {len(profile_paths)}')

for rel, expected in EXPECTED_COPY.items():
    text = (ROOT / rel).read_text('utf-8')
    if text.count(expected) != 1:
        fail(f'freshness wording mismatch: {rel}')
    for old in OLD_COPY:
        if old in text:
            fail(f'old freshness wording remains: {rel}')

changed = subprocess.check_output(['git','diff','--name-only',BASE+'...HEAD'], cwd=ROOT, text=True).splitlines()
if any(p.startswith(('dist/data/','server/','runtime/')) for p in changed):
    fail('data/server/runtime scope changed')

# The one-shot transform commit was exhaustively compared against HF2.9 by run 34417558975:
# all 19,103 profile pages were proven byte-equivalent after normalizing only the release marker.
# Later qualification commits must not touch dist at all, so that exhaustive proof remains valid.
if subprocess.run(['git','diff','--quiet',PROFILE_NO_LOSS_PROOF_COMMIT+'...HEAD','--','dist'], cwd=ROOT).returncode != 0:
    fail('dist changed after immutable exhaustive profile no-loss proof commit')

print(json.dumps({
    'status':'PASS','release':RELEASE,'publicIndexPages':len(htmls),'profilePagesChecked':len(profile_paths),
    'releaseMarkerCounts':marker_counts,'freshnessCopyPages':sorted(EXPECTED_COPY),
    'profileFactsChanged':False,'runtimeChanged':False,'pricesChanged':False,
    'profileNoLossProofCommit':PROFILE_NO_LOSS_PROOF_COMMIT,'profileNoLossProofRunId':PROFILE_NO_LOSS_PROOF_RUN,
    'postProofDistMutation':False
}, indent=2, sort_keys=True))
