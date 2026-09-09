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

def norm_marker(s: str) -> str:
    s = META_RE.sub(lambda m: m.group(0).replace(m.group(1), '__RELEASE__'), s, count=1)
    s = META_RE_REVERSED.sub(lambda m: m.group(0).replace(m.group(1), '__RELEASE__'), s, count=1)
    return s

def base_profile_blobs() -> dict[str,str]:
    raw = subprocess.check_output(['git','ls-tree','-r','-z',BASE,'--','dist/profiles'], cwd=ROOT)
    out = {}
    for row in raw.split(b'\0'):
        if not row: continue
        meta, path = row.split(b'\t', 1)
        parts = meta.split()
        if len(parts) != 3 or parts[1] != b'blob': continue
        rel = path.decode('utf-8')
        if rel.endswith('/index.html'):
            out[rel] = parts[2].decode('ascii')
    return out

def read_blobs_batch(path_to_sha: dict[str,str]) -> dict[str,str]:
    ordered = sorted(path_to_sha.items())
    proc = subprocess.Popen(['git','cat-file','--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    assert proc.stdin is not None and proc.stdout is not None
    proc.stdin.write((''.join(sha+'\n' for _,sha in ordered)).encode('ascii'))
    proc.stdin.close()
    result = {}
    for path, expected_sha in ordered:
        header = proc.stdout.readline().decode('ascii').strip().split()
        if len(header) != 3 or header[0] != expected_sha or header[1] != 'blob':
            fail(f'unexpected git cat-file header for {path}: {header}')
        size = int(header[2])
        data = proc.stdout.read(size)
        if proc.stdout.read(1) != b'\n': fail(f'missing batch delimiter after {path}')
        result[path] = data.decode('utf-8')
    rc = proc.wait()
    if rc != 0: fail(f'git cat-file --batch failed: {rc}')
    return result

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

changed = subprocess.check_output(['git','diff','--name-only',BASE+'...HEAD'], cwd=ROOT, text=True).splitlines()
if any(p.startswith(('dist/data/','server/','runtime/')) for p in changed):
    fail('data/server/runtime scope changed')

# Every profile HTML page may differ from HF2.9 only in the release marker. Read all predecessor
# blobs through one git cat-file process so the proof is exhaustive without 19k subprocesses.
profile_paths = [p.relative_to(ROOT).as_posix() for p in htmls if p.relative_to(DIST).as_posix().startswith('profiles/')]
base_map = base_profile_blobs()
if set(base_map) != set(profile_paths):
    fail(f'profile member-set drift: base={len(base_map)} current={len(profile_paths)}')
base_text = read_blobs_batch(base_map)
for rel in profile_paths:
    before = base_text[rel]
    after = (ROOT/rel).read_text('utf-8')
    if norm_marker(before) != norm_marker(after):
        fail(f'profile content changed beyond release marker: {rel}')

print(json.dumps({
    'status':'PASS','release':RELEASE,'publicIndexPages':len(htmls),'profilePagesChecked':len(profile_paths),
    'releaseMarkerCounts':marker_counts,'freshnessCopyPages':sorted(EXPECTED_COPY),
    'profileFactsChanged':False,'runtimeChanged':False,'pricesChanged':False,
    'profileComparisonMode':'ONE_GIT_CAT_FILE_BATCH_EXHAUSTIVE'
}, indent=2, sort_keys=True))
