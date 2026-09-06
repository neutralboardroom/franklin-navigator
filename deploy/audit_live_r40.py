#!/usr/bin/env python3
"""Owner-authorized read-only launch audit: GET only; never signs in or creates a payment."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib, json, re

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
OUT = ROOT / 'launch-audit'
ORIGIN = 'https://franklinnavigator.com'
RUNTIME = 'https://franklin-navigator-membership.onrender.com'
RELEASE = 'FR-NAV1.15.0-CANDIDATE-R40'
STATIC_COMMIT = '9d90aadcae37c132b5ea6204cbda81273609089f'
RUNTIME_COMMIT = '6d4f87fc975ae0201351060c69f0d3ab05d8236c'
OUT.mkdir(exist_ok=True)

def sha(b):
    return hashlib.sha256(b).hexdigest()

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = []
        self.text = []
        self.in_h1 = False
        self.in_main = False
        self.hidden_depth = 0
        self.forms = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'main': self.in_main = True
        if tag == 'h1': self.in_h1 = True
        if tag in ('script', 'style'): self.hidden_depth += 1
        if tag == 'form': self.forms.append({k: attrs.get(k, '') for k in ('action', 'method', 'id')})
    def handle_endtag(self, tag):
        if tag == 'main': self.in_main = False
        if tag == 'h1': self.in_h1 = False
        if tag in ('script', 'style'): self.hidden_depth = max(0, self.hidden_depth - 1)
    def handle_data(self, value):
        if self.hidden_depth: return
        value = ' '.join(value.split())
        if value:
            if self.in_h1: self.h1.append(value)
            if self.in_main: self.text.append(value)

def get(url):
    request = Request(url, headers={'User-Agent': 'Franklin-Navigator-Owner-ReadOnly-Launch-Audit/1.0', 'Cache-Control': 'no-cache'}, method='GET')
    try:
        with urlopen(request, timeout=18) as response:
            body = response.read(12000000)
            return response.status, response.geturl(), body, None
    except HTTPError as error:
        return error.code, error.geturl(), error.read(20000), None
    except (URLError, TimeoutError, OSError) as error:
        return None, url, b'', type(error).__name__ + ': ' + str(error)[:240]

def route_for(p):
    rel = p.relative_to(DIST).as_posix()
    if rel == 'index.html': return '/'
    return '/' + (rel[:-10] if rel.endswith('/index.html') else rel)

def check(p):
    route = route_for(p)
    status, final, body, error = get(ORIGIN + route)
    row = {'route': route, 'httpStatus': status, 'finalUrl': final, 'error': error,
           'expectedSha256': sha(p.read_bytes()), 'observedSha256': sha(body)}
    row['exactSavedR40Bytes'] = row['expectedSha256'] == row['observedSha256']
    row['samePublicHost'] = urlsplit(final).hostname in ('franklinnavigator.com', 'www.franklinnavigator.com')
    if p.suffix == '.html' and body:
        parser = Page()
        parser.feed(body.decode('utf-8', errors='replace'))
        text = ' '.join(parser.text)
        row.update({'heading': ' '.join(parser.h1), 'mainWordCount': len(text.split()), 'forms': parser.forms})
        row['featureCautions'] = [label for label, pattern in (
            ('DEVICE_ONLY_PREVIEW', r'private device.only|nothing is uploaded|nothing is uploaded or published'),
            ('EXECUTION_OFF', r'campaign execution: off|execution off'),
            ('PREVIEW_NOT_ACTIVATION', r'preview does not activate'),
            ('PLACEHOLDER_REVIEW', r'coming soon|under construction|lorem ipsum')
        ) if re.search(pattern, text, re.I)]
    row['routePass'] = status == 200 and row['samePublicHost'] and row['exactSavedR40Bytes']
    return row

report = {'observedAtUtc': datetime.now(timezone.utc).isoformat(), 'release': RELEASE,
          'observedPublicCommitToBind': STATIC_COMMIT, 'runtimeCommitToBind': RUNTIME_COMMIT,
          'method': 'READ_ONLY_GET_AND_BYTE_COMPARISON', 'charges': 0, 'refunds': 0, 'cancellations': 0,
          'signIns': 0, 'accountsCreated': 0, 'outreachMessages': 0, 'authorityTransfer': False,
          'independentSreOrSccAcceptance': 'NOT_CLAIMED'}
home = check(DIST / 'index.html')
report['home'] = home
paths = [p for p in sorted(DIST.rglob('*.html')) if 'profiles' not in p.relative_to(DIST).parts and p.name != '404.html']
profile_paths = sorted((DIST / 'profiles').glob('*/index.html'))
samples = sorted({0, len(profile_paths) - 1, *(len(profile_paths) * i // 8 for i in range(1, 8))})
paths.extend(profile_paths[i] for i in samples)
for rel in ['assets/membership-live.js', 'assets/r37-i18n.js', 'assets/r37.css', 'assets/styles.css', 'assets/community-explorer.js', 'data/membership-checkout-catalog.json', 'data/membership-pricing.json', 'data/commerce-readiness.json']:
    if (DIST / rel).is_file(): paths.append(DIST / rel)
if home['routePass']:
    with ThreadPoolExecutor(max_workers=10) as pool:
        rows = list(pool.map(check, paths))
else:
    rows = [home]
report['routes'] = rows
report['routeSummary'] = {'checked': len(rows), 'passed': sum(r['routePass'] for r in rows),
                          'failed': sum(not r['routePass'] for r in rows),
                          'scope': 'All non-profile public HTML routes except the error document, nine deterministic profile samples, eight critical assets/data files; not a live fetch of all profile pages or third-party URLs.'}
report['unfinishedFeatureFindings'] = [{k: r[k] for k in ('route', 'heading', 'featureCautions')}
                                     for r in rows if r.get('featureCautions')]
report['runtimePublicReadiness'] = {}
for route in ['/ready', '/health', '/api/me', '/api/accounts/me']:
    status, final, body, error = get(RUNTIME + route)
    row = {'httpStatus': status, 'error': error}
    try:
        payload = json.loads(body)
        if route in ('/ready', '/health'):
            allowed = ('ok', 'ready', 'release', 'community', 'databaseConfigured', 'schemaReady', 'commerceEnabled', 'liveCheckoutEnabled', 'accountReady', 'membershipReady', 'error', 'code')
            row['publicStatus'] = {k: payload[k] for k in allowed if k in payload and isinstance(payload[k], (str, bool, int, type(None)))}
            row['responseKeys'] = sorted(payload.keys())
        else:
            row['unauthenticatedAccessDenied'] = status in (401, 403)
            row['routeAbsent'] = status == 404
    except (ValueError, TypeError):
        row['jsonResponse'] = False
    report['runtimePublicReadiness'][route] = row
source_url = 'https://raw.githubusercontent.com/neutralboardroom/franklin-navigator/' + RUNTIME_COMMIT + '/server.js'
status, final, body, error = get(source_url)
if status == 200:
    (OUT / 'runtime-source.js').write_bytes(body)
    source = body.decode('utf-8')
    report['runtimeSourceAudit'] = {'commit': RUNTIME_COMMIT, 'sha256': sha(body),
                                  'routeLiterals': sorted(set(re.findall(r'[\"\'](/(?:api/[^\"\'\s]+|ready|health))[\"\']', source)))}
else:
    report['runtimeSourceAudit'] = {'httpStatus': status, 'error': error}
report['finishedAtUtc'] = datetime.now(timezone.utc).isoformat()
(OUT / 'LIVE_R40_READ_ONLY_AUDIT.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k not in ('routes', 'home')}, ensure_ascii=False, indent=2))
