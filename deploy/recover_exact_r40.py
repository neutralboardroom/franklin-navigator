#!/usr/bin/env python3
"""Recover the exact already-qualified R40 public snapshot. No payment operations."""
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit, unquote
import argparse, base64, gzip, hashlib, html, json, re

ROOT = Path(__file__).resolve().parents[1]
TRANSPORT_SHA = 'e81118e688d38d16620aa8f2735bb6a0023b211c98e3be1e928ad6f92ce607ee'
RELEASE_SHA = '8cbadeeb187386e2825098fe28c395035e5ef00fe1e9be6a2181657be14cfefc'
RELEASE = 'FR-NAV1.15.0-CANDIDATE-R40'
EXPECTED_TREE = '7ed9927f8a1ab18ece9b640e5bde3e3348a430fa'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def digest(files):
    return sha(b''.join(name.encode() + b'\0' + str(len(data)).encode() + b'\0' + sha(data).encode() + b'\n' for name, data in sorted(files.items())))

def public_files():
    result = {}
    for p in (ROOT / 'dist').rglob('*'):
        if p.is_symlink():
            raise ValueError('Public symlink rejected')
        if p.is_file():
            result[p.relative_to(ROOT).as_posix()] = p.read_bytes()
    return result

def safe_path(name):
    p = PurePosixPath(name)
    return name.startswith('dist/') and not p.is_absolute() and '..' not in p.parts and '\\' not in name

def load_delta():
    folder = ROOT / 'deploy/r40-recovery-parts'
    encoded = ''.join((folder / f'{i:02d}.b64').read_text().strip() for i in range(4))
    compressed = base64.b64decode(encoded, validate=True)
    if sha(compressed) != TRANSPORT_SHA:
        raise ValueError('Transport checksum mismatch; no files changed')
    d = json.loads(gzip.decompress(compressed))
    if d['sourceReleaseZipSha256'] != RELEASE_SHA or d['targetGitDistTree'] != EXPECTED_TREE:
        raise ValueError('Qualified release binding mismatch')
    if set(d['rootFiles']) != {'PRODUCTION_RELEASE.json', 'README.md'}:
        raise ValueError('Unexpected root write')
    for group in ('patches', 'jsonEdits', 'binary'):
        if any(not safe_path(n) for n in d[group]):
            raise ValueError('Unsafe delta path')
    if any(not safe_path(n) for n in d['remove']):
        raise ValueError('Unsafe removal path')
    return d

def reconstruct(files, d):
    out = dict(files)
    for name, data in files.items():
        if name.endswith('.html'):
            text = data.decode('utf-8')
            for old, new in d['htmlReplacements'].items():
                text = text.replace(old, new)
            out[name] = text.encode('utf-8')
    for name, edits in d['jsonEdits'].items():
        obj = json.loads(out[name])
        for op in edits:
            cur = obj
            for key in op[1][:-1]:
                cur = cur[key]
            if op[0] == 'del':
                cur.pop(op[1][-1])
            elif op[0] == 'set':
                cur[op[1][-1]] = op[2]
            else:
                raise ValueError('Unknown JSON operation')
        out[name] = (json.dumps(obj, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    for name, patch in d['patches'].items():
        text = out.get(name, b'').decode('utf-8')
        parts = re.split(r'(?=<)|(?<=>)', text) if patch['unit'] == 'html' else text.splitlines(keepends=True)
        for first, last, replacement in reversed(patch['ops']):
            if not 0 <= first <= last <= len(parts):
                raise ValueError('Patch range is invalid')
            parts[first:last] = [replacement]
        out[name] = ''.join(parts).encode('utf-8')
    for name, data in d['binary'].items():
        out[name] = base64.b64decode(data, validate=True)
    for name in d['remove']:
        out.pop(name)
    return out

def audit(files):
    count = 0
    html_count = 0
    profiles = 0
    broken = []
    for name, data in files.items():
        if name.endswith('.html'):
            html_count += 1
            profiles += int(name.startswith('dist/profiles/') and name.endswith('/index.html'))
            text = data.decode('utf-8')
            if f'content="{RELEASE}"' not in text:
                raise ValueError('Wrong public release: ' + name)
            for marker in ('data-r37-lang="en"', 'data-r37-lang="es"'):
                if text.count(marker) != 1:
                    raise ValueError('Language control mismatch: ' + name)
            links = re.findall(r'(?:href|src|action)=["\']([^"\']+)["\']', text)
        elif name.endswith('.css'):
            links = re.findall(r'url\((?:["\']?)([^)\'"\s]+)', data.decode('utf-8'))
        else:
            continue
        for raw in links:
            if not raw.startswith('/') or raw.startswith('//'):
                continue
            path = unquote(urlsplit(html.unescape(raw)).path)
            rel = 'dist/' + path.lstrip('/')
            candidates = [rel, rel.rstrip('/') + '/index.html']
            if path == '/':
                candidates = ['dist/index.html']
            count += 1
            if not any(c in files for c in candidates):
                broken.append([name, raw])
    if broken:
        raise ValueError('Broken internal targets: ' + json.dumps(broken[:15]))
    if (html_count, profiles) != (19356, 19103):
        raise ValueError('Public page or profile count changed')
    build = json.loads(files['dist/FRANKLIN_BUILD_MANIFEST.json'])
    if build['release'] != RELEASE or build['commerce']['publicCheckoutOpen'] is not False:
        raise ValueError('Release/closed-checkout invariant failed')
    return {'htmlPages': html_count, 'profiles': profiles, 'localReferences': count, 'brokenInternalTargets': 0}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    d = load_delta()
    before = public_files()
    observed = digest(before)
    if args.verify_only:
        if observed != d['afterDigest']:
            raise ValueError('Not the exact qualified R40 public snapshot')
        after = before
    elif observed == d['afterDigest']:
        after = before
    elif observed == d['beforeDigest']:
        after = reconstruct(before, d)
    else:
        raise ValueError('Base snapshot changed; do not overwrite newer work')
    if len(after) != d['targetFileCount'] or digest(after) != d['afterDigest']:
        raise ValueError('Exact reconstruction failed; no files changed')
    result = audit(after)
    if not args.verify_only:
        for name, data in after.items():
            if before.get(name) != data:
                path = ROOT / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(data)
        for name in set(before) - set(after):
            (ROOT / name).unlink()
        for name, text in d['rootFiles'].items():
            (ROOT / name).write_bytes(text.encode('utf-8'))
    if digest(public_files()) != d['afterDigest']:
        raise ValueError('On-disk readback failed')
    for name, text in d['rootFiles'].items():
        if (ROOT / name).read_bytes() != text.encode('utf-8'):
            raise ValueError('Root manifest/readme mismatch')
    result.update({'result': 'PASS_EXACT_R40_PUBLIC_SNAPSHOT', 'release': RELEASE,
                   'qualifiedReleaseZipSha256': RELEASE_SHA, 'staticSha256': d['afterDigest'],
                   'expectedGitDistTree': EXPECTED_TREE, 'staticFiles': len(after),
                   'publicCheckoutOpen': False, 'deploymentPerformed': False,
                   'independentCommercialAcceptance': 'NOT_CLAIMED', 'authorityTransfer': False})
    print(json.dumps(result, sort_keys=True))
    if not args.verify_only:
        (ROOT / 'deploy/R40_EXACT_RECOVERY_RESULT.json').write_text(json.dumps(result, indent=2) + '\n')

if __name__ == '__main__':
    main()
