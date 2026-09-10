#!/usr/bin/env python3
from __future__ import annotations
import collections, datetime as dt, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
RELEASE = 'FR-NAV1.20.0-HF3.1-CANDIDATE'
CUTOFF_UTC = dt.datetime(2026, 9, 10, 0, 30, 0, tzinfo=dt.timezone.utc)
META_RE = re.compile(r'(<meta\s+name=["\']franklin-release["\']\s+content=["\'])([^"\']+)(["\'])', re.I)
META_RE_REVERSED = re.compile(r'(<meta\s+content=["\'])([^"\']+)(["\']\s+name=["\']franklin-release["\'])', re.I)
ARTICLE_RE = re.compile(r'<article\b(?=[^>]*\bdata-event-end=["\']([^"\']+)["\'])[^>]*>.*?</article>', re.I | re.S)
DATED_PAGES = {
    'dist/index.html',
    'dist/today/index.html',
    'dist/es/index.html',
    'dist/es/hoy/index.html',
}

def parse_iso(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(dt.timezone.utc)

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

def suppress_expired(text: str) -> tuple[str, list[str]]:
    removed: list[str] = []
    def repl(match: re.Match[str]) -> str:
        raw = match.group(1)
        try:
            end = parse_iso(raw)
        except Exception as exc:
            raise SystemExit(f'Invalid data-event-end {raw!r}: {exc}')
        if end < CUTOFF_UTC:
            removed.append(raw)
            return ''
        return match.group(0)
    return ARTICLE_RE.sub(repl, text), removed

def main() -> None:
    htmls = sorted(DIST.rglob('index.html'))
    if len(htmls) != 19355:
        raise SystemExit(f'Unexpected public index count: {len(htmls)}')
    before = collections.Counter()
    changed = 0
    missing: list[str] = []
    removed_by_page: dict[str, list[str]] = {}
    for path in htmls:
        rel = path.relative_to(ROOT).as_posix()
        text = path.read_text('utf-8')
        updated, old = replace_marker(text)
        if old is None:
            missing.append(rel)
            continue
        before[old] += 1
        if rel in DATED_PAGES:
            updated, removed = suppress_expired(updated)
            removed_by_page[rel] = removed
        if updated != text:
            path.write_text(updated, 'utf-8', newline='')
            changed += 1
    if missing:
        raise SystemExit('Missing franklin-release marker: ' + ', '.join(missing[:20]))
    if changed != len(htmls):
        raise SystemExit(f'Expected all {len(htmls)} public index pages to change; changed {changed}')
    if not removed_by_page['dist/index.html'] or not removed_by_page['dist/today/index.html']:
        raise SystemExit('Expected expired English homepage/Today cards to be removed')
    for rel in DATED_PAGES:
        text = (ROOT / rel).read_text('utf-8')
        for match in ARTICLE_RE.finditer(text):
            if parse_iso(match.group(1)) < CUTOFF_UTC:
                raise SystemExit(f'{rel}: expired card survived: {match.group(1)}')
    print(json.dumps({
        'status':'PASS',
        'release':RELEASE,
        'publicIndexPages':len(htmls),
        'changedPages':changed,
        'oldMarkerCounts':dict(before),
        'cutoffUtc':CUTOFF_UTC.isoformat().replace('+00:00','Z'),
        'expiredCardsRemovedByPage':removed_by_page,
    }, sort_keys=True))

if __name__ == '__main__':
    main()
