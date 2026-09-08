#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, pathlib, sys

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
MANIFEST = ROOT / 'HF29_RELEASE_MANIFEST.json'
ARCHIVE_SUFFIXES = {'.zip', '.tar', '.gz', '.tgz', '.7z'}


def sha256(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

if not MANIFEST.is_file():
    raise SystemExit('HF29 manifest missing')
manifest = json.loads(MANIFEST.read_text('utf-8'))
if manifest.get('release') != 'FR-NAV1.18.0-HF2.9-CANDIDATE':
    raise SystemExit('HF29 release identity mismatch')
if manifest.get('activeEdition') != 'FRANKLIN_TN':
    raise SystemExit('HF29 active-edition mismatch')
if manifest.get('manifestSelfHashRule') != 'MANIFEST_FILE_EXCLUDED_FROM_ITS_OWN_MEMBER_HASH_TABLE':
    raise SystemExit('HF29 self-hash rule missing')
rows = manifest.get('files') or []
expected = {row['path']: row for row in rows}
if len(expected) != len(rows):
    raise SystemExit('Duplicate manifest path')
actual = {}
for path in ROOT.rglob('*'):
    if not path.is_file():
        continue
    rel = path.relative_to(ROOT).as_posix()
    if rel == 'HF29_RELEASE_MANIFEST.json':
        continue
    actual[rel] = path
if set(actual) != set(expected):
    missing = sorted(set(expected) - set(actual))[:20]
    extra = sorted(set(actual) - set(expected))[:20]
    raise SystemExit(f'File-set mismatch missing={missing} extra={extra}')
for rel, path in actual.items():
    row = expected[rel]
    if path.stat().st_size != row['bytes']:
        raise SystemExit(f'Byte-size mismatch: {rel}')
    if sha256(path) != row['sha256']:
        raise SystemExit(f'SHA-256 mismatch: {rel}')
    lower = rel.lower()
    if any(lower.endswith(s) for s in ARCHIVE_SUFFIXES):
        raise SystemExit(f'Nested archive prohibited: {rel}')
    if path.is_symlink():
        raise SystemExit(f'Symlink prohibited: {rel}')
print(json.dumps({'result':'PASS','release':manifest['release'],'coveredFiles':len(rows),'manifestSha256':sha256(MANIFEST)}, sort_keys=True))
