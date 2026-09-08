#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, io, json, pathlib, shutil, subprocess, tempfile, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
RELEASE = 'FR-NAV1.18.0-HF2.9-CANDIDATE'
FILENAME = 'FRANKLIN_NAVIGATOR__HF2_9__FULL_DESIGN_SIMPLIFIED__2026-09-09.zip'
ARCHIVE_SUFFIXES = ('.zip', '.tar', '.gz', '.tgz', '.7z')
SKIP_PARTS = {'.git', 'node_modules', '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache'}
NORMAL_DATE = (1980, 1, 1, 0, 0, 0)


def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha_file(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def git(*args: str) -> str:
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()


def tracked_files():
    raw = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT)
    names = [x.decode('utf-8') for x in raw.split(b'\0') if x]
    include, exclude = [], []
    for name in sorted(names):
        p = pathlib.PurePosixPath(name)
        reason = None
        if any(part in SKIP_PARTS for part in p.parts):
            reason = 'CACHE_OR_VCS'
        elif name.lower().endswith(ARCHIVE_SUFFIXES):
            reason = 'NESTED_ARCHIVE_PROHIBITED'
        elif name.startswith('release-output/'):
            reason = 'GENERATED_RELEASE_OUTPUT'
        if reason:
            exclude.append({'path': name, 'reason': reason})
            continue
        fs = ROOT / name
        if not fs.is_file():
            raise SystemExit(f'Tracked file missing: {name}')
        if fs.is_symlink():
            raise SystemExit(f'Symlink prohibited in release: {name}')
        include.append(name)
    return include, exclude


def zipinfo(name: str) -> zipfile.ZipInfo:
    z = zipfile.ZipInfo(name, NORMAL_DATE)
    z.compress_type = zipfile.ZIP_DEFLATED
    z.create_system = 3
    z.external_attr = (0o100644 << 16)
    z.flag_bits |= 0x800
    return z


def build_bytes(source_commit: str) -> tuple[bytes, dict, bytes, bytes]:
    names, excluded = tracked_files()
    exclusions = json.dumps({
        'schemaVersion': 'franklin.hf29.release-exclusions.v1',
        'release': RELEASE,
        'sourceCommit': source_commit,
        'excludedTrackedFiles': excluded,
        'rule': 'Nested archives, caches, VCS metadata and generated release output are not packaged.'
    }, sort_keys=True, separators=(',', ':')).encode('utf-8') + b'\n'

    rows = []
    contents: dict[str, bytes] = {}
    for name in names:
        data = (ROOT / name).read_bytes()
        contents[name] = data
        rows.append({'path': name, 'bytes': len(data), 'sha256': sha_bytes(data)})
    contents['HF29_RELEASE_EXCLUSIONS.json'] = exclusions
    rows.append({'path': 'HF29_RELEASE_EXCLUSIONS.json', 'bytes': len(exclusions), 'sha256': sha_bytes(exclusions)})
    rows.sort(key=lambda x: x['path'])

    manifest = {
        'schemaVersion': 'franklin.hf29.release-manifest.v1',
        'release': RELEASE,
        'sourceCommit': source_commit,
        'activeEdition': 'FRANKLIN_TN',
        'writableProductLane': 'LOCAL_COMMUNITY_EDITION:FRANKLIN_TN',
        'manifestSelfHashRule': 'MANIFEST_FILE_EXCLUDED_FROM_ITS_OWN_MEMBER_HASH_TABLE',
        'normalizedArchiveTimestamp': '1980-01-01T00:00:00Z',
        'normalizedMode': '0644',
        'files': rows
    }
    manifest_bytes = json.dumps(manifest, sort_keys=True, separators=(',', ':')).encode('utf-8') + b'\n'
    contents['HF29_RELEASE_MANIFEST.json'] = manifest_bytes

    out = io.BytesIO()
    with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9, strict_timestamps=True) as zf:
        for name in sorted(contents):
            zf.writestr(zipinfo(name), contents[name], compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    return out.getvalue(), manifest, manifest_bytes, exclusions


def validate_archive(path: pathlib.Path, manifest: dict):
    with zipfile.ZipFile(path) as zf:
        names = zf.namelist()
        if len(names) != len(set(names)):
            raise SystemExit('Duplicate ZIP member')
        if zf.testzip() is not None:
            raise SystemExit('ZIP CRC failure')
        if any(name.startswith('/') or '..' in pathlib.PurePosixPath(name).parts or '\\' in name for name in names):
            raise SystemExit('Unsafe ZIP member path')
        if any(name.lower().endswith(ARCHIVE_SUFFIXES) for name in names):
            raise SystemExit('Nested archive found')
        expected = {r['path'] for r in manifest['files']} | {'HF29_RELEASE_MANIFEST.json'}
        if set(names) != expected:
            raise SystemExit('ZIP member set does not match manifest')

    with tempfile.TemporaryDirectory(prefix='hf29-extract-') as td:
        dest = pathlib.Path(td)
        with zipfile.ZipFile(path) as zf:
            zf.extractall(dest)
        subprocess.run(['python3', 'scripts/validate-hf29-release.py', '.'], cwd=dest, check=True)
        for js in [
            'dist/assets/hf27-navigation.js',
            'dist/assets/hf29-design.js',
            'dist/assets/r37-i18n.js',
            'dist/assets/hf28-directory.js',
            'dist/assets/local-discovery.js'
        ]:
            subprocess.run(['node', '--check', js], cwd=dest, check=True)
        subprocess.run(['node', 'scripts/verify-hf29-design.mjs'], cwd=dest, check=True)
        subprocess.run(['node', 'scripts/verify-hf28-find-local.mjs'], cwd=dest, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='release-output')
    args = ap.parse_args()
    outdir = ROOT / args.out
    if outdir.exists():
        shutil.rmtree(outdir)
    outdir.mkdir(parents=True)

    release_meta = json.loads((ROOT / 'PRODUCTION_RELEASE.json').read_text('utf-8'))
    if release_meta.get('release') != RELEASE:
        raise SystemExit('PRODUCTION_RELEASE release mismatch')
    if release_meta.get('releaseState') not in {'LIVE_VERIFIED_QUALIFIED_PENDING_SEAL','QUALIFIED_SUCCESSOR_SEALED'}:
        raise SystemExit('HF2.9 is not live-verified/qualified for sealing')

    source_commit = git('rev-parse', 'HEAD')
    a, manifest_a, manifest_bytes_a, exclusions_a = build_bytes(source_commit)
    b, manifest_b, manifest_bytes_b, exclusions_b = build_bytes(source_commit)
    if a != b or manifest_bytes_a != manifest_bytes_b or exclusions_a != exclusions_b:
        raise SystemExit('Deterministic double-build mismatch')
    if manifest_a != manifest_b:
        raise SystemExit('Deterministic manifest mismatch')

    target = outdir / FILENAME
    target.write_bytes(a)
    validate_archive(target, manifest_a)
    manifest_sha = sha_bytes(manifest_bytes_a)
    attestation = {
        'schemaVersion': 'franklin.hf29.external-release-attestation.v1',
        'release': RELEASE,
        'sourceCommit': source_commit,
        'artifact': FILENAME,
        'bytes': target.stat().st_size,
        'sha256': sha_file(target),
        'manifestSha256': manifest_sha,
        'manifestCoveredFiles': len(manifest_a['files']),
        'zipMembers': len(manifest_a['files']) + 1,
        'deterministicDoubleBuild': 'PASS_BYTE_IDENTICAL',
        'freshExtractionReleaseValidator': 'PASS',
        'freshExtractionNodeSyntax': 'PASS',
        'freshExtractionDesignQualification': 'PASS',
        'freshExtractionFindLocalRegression': 'PASS',
        'nestedArchives': 0,
        'activeEdition': 'FRANKLIN_TN',
        'profileFactsChanged': False,
        'runtimeChanged': False,
        'pricesChanged': False,
        'authorityTransfer': False
    }
    attestation_path = outdir / 'HF29_EXTERNAL_RELEASE_ATTESTATION.json'
    attestation_path.write_text(json.dumps(attestation, indent=2, sort_keys=True) + '\n', 'utf-8')
    print(json.dumps(attestation, sort_keys=True))

if __name__ == '__main__':
    main()
