#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
from collections import Counter
import json,re,sys

root=Path(__file__).resolve().parents[1]
dist=root/'dist'
assets=dist/'assets'
meta=json.loads((root/'PRODUCTION_RELEASE.json').read_text())
release=str(meta.get('release',''))
errors=[]

def need(cond,msg):
    if not cond: errors.append(msg)

CURRENT_RELEASE_RE=r'FR-NAV\d+\.\d+\.\d+-HF\d+\.\d+\.\d+'
# Historical static pages legitimately used both two- and three-component HF suffixes.
# Runtime identity is canonicalized by hf36 to the strict current three-component release.
STATIC_RELEASE_RE=r'FR-NAV\d+\.\d+\.\d+-HF\d+\.\d+(?:\.\d+)?'
need(bool(re.fullmatch(CURRENT_RELEASE_RE,release)),'invalid PRODUCTION_RELEASE release')

hf=assets/'hf36.js'
need(hf.is_file(),'missing shared hf36 loader')
hf_text=hf.read_text(errors='replace') if hf.is_file() else ''
need(f"const CURRENT_RELEASE='{release}'" in hf_text,'shared loader CURRENT_RELEASE does not match PRODUCTION_RELEASE')
need("meta.content=CURRENT_RELEASE" in hf_text,'shared loader does not canonicalize franklin-release meta')
need("dataset.franklinRelease=CURRENT_RELEASE" in hf_text,'shared loader does not expose canonical runtime release dataset')

class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.has_main=False; self.has_hf36=False; self.release_values=[]; self.scripts=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='main': self.has_main=True
        if tag=='script' and a.get('src'):
            src=str(a['src']); self.scripts.append(src)
            if '/assets/hf36.js' in src: self.has_hf36=True
        if tag=='meta' and str(a.get('name','')).lower()=='franklin-release':
            self.release_values.append(str(a.get('content','')))

full=covered=0
legacy=Counter()
missing_meta=[]
bad_meta=[]
active_scripts=set()
for p in dist.rglob('*.html'):
    x=P()
    try: x.feed(p.read_text(errors='replace'))
    except Exception as e:
        errors.append(f'html parse failed {p.relative_to(root)}: {e}')
        continue
    for src in x.scripts:
        u=urlsplit(src)
        if not u.scheme and not u.netloc and u.path.startswith('/assets/') and u.path.endswith('.js'):
            active_scripts.add(Path(u.path).name)
    if x.release_values:
        for value in x.release_values:
            legacy[value]+=1
            if not re.fullmatch(STATIC_RELEASE_RE,value):
                bad_meta.append((str(p.relative_to(root)),value))
    elif x.has_main:
        missing_meta.append(str(p.relative_to(root)))
    if x.has_main:
        full+=1
        if x.has_hf36: covered+=1
        else: errors.append('full public page missing canonical release loader: '+str(p.relative_to(root)))

# hf36 dynamically loads profile/member layers. Include every literal local JS asset
# in the shared loader so release ownership cannot hide behind dynamic loading.
for m in re.finditer(r"['\"](/assets/[^'\"]+\.js)(?:\?[^'\"]*)?['\"]",hf_text):
    active_scripts.add(Path(urlsplit(m.group(1)).path).name)

writer_re=re.compile(
    r"franklin-release.{0,260}(?:\.content\s*=|setAttribute\(\s*['\"]content['\"])",
    re.I|re.S
)
offenders=[]
for name in sorted(active_scripts):
    p=assets/name
    if not p.is_file():
        continue
    t=p.read_text(errors='replace')
    if name=='hf36.js':
        continue
    if writer_re.search(t):
        offenders.append(str(p.relative_to(root)))

need(not offenders,'active feature-specific release-meta writers found: '+repr(offenders))
need(full>0,'no full public pages found')
need(covered==full,'canonical release loader coverage incomplete')
need(not bad_meta,'malformed static release markers: '+repr(bad_meta[:20]))

for rel in ['index.html','assistant/index.html','directory/index.html','profiles/FR-ORG-b00c0ace7943973c/index.html']:
    p=dist/rel
    need(p.is_file(),'missing representative page: '+rel)
    if p.is_file():
        t=p.read_text(errors='replace')
        need('/assets/hf36.js' in t,'representative page missing canonical release loader: '+rel)

result={
    'result':'PASS' if not errors else 'FAIL',
    'release':release,
    'fullPublicPages':full,
    'canonicalLoaderCovered':covered,
    'activePublicScriptsChecked':len(active_scripts),
    'featureSpecificWriters':offenders,
    'staticReleaseMarkerVersions':dict(sorted(legacy.items())),
    'fullPagesMissingStaticMarker':len(missing_meta),
    'runtimeCanonicalization':'SHARED_HF36_ONLY',
    'archivedUnreferencedAssetsMayRetainHistoricalMarkers':True
}
print(json.dumps(result,indent=2,sort_keys=True))
if errors:
    print(json.dumps({'errors':errors},indent=2))
    sys.exit(1)
