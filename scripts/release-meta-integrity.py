#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import json,re,sys

root=Path(__file__).resolve().parents[1]
dist=root/'dist'
meta=json.loads((root/'PRODUCTION_RELEASE.json').read_text())
release=str(meta.get('release',''))
errors=[]

def need(cond,msg):
    if not cond: errors.append(msg)

need(bool(re.fullmatch(r'FR-NAV\d+\.\d+\.\d+-HF\d+\.\d+\.\d+',release)),'invalid PRODUCTION_RELEASE release')

hf=dist/'assets/hf36.js'
need(hf.is_file(),'missing shared hf36 loader')
hf_text=hf.read_text(errors='replace') if hf.is_file() else ''
need(f"const CURRENT_RELEASE='{release}'" in hf_text,'shared loader CURRENT_RELEASE does not match PRODUCTION_RELEASE')
need("meta.content=CURRENT_RELEASE" in hf_text,'shared loader does not canonicalize franklin-release meta')
need("dataset.franklinRelease=CURRENT_RELEASE" in hf_text,'shared loader does not expose canonical runtime release dataset')

# No feature-specific public asset may write or even own the canonical release tag.
offenders=[]
for p in sorted((dist/'assets').glob('*.js')):
    if p.name=='hf36.js':
        continue
    t=p.read_text(errors='replace')
    if 'franklin-release' in t:
        offenders.append(str(p.relative_to(root)))
need(not offenders,'feature-specific release-meta ownership found: '+repr(offenders))

# Historical static page markers are legacy generator provenance. They must be
# well-formed, and every full public page must load the one canonicalizer.
class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.has_main=False; self.has_hf36=False; self.release_values=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='main': self.has_main=True
        if tag=='script' and '/assets/hf36.js' in str(a.get('src','')): self.has_hf36=True
        if tag=='meta' and str(a.get('name','')).lower()=='franklin-release':
            self.release_values.append(str(a.get('content','')))

full=covered=0
legacy=Counter()
missing_meta=[]
bad_meta=[]
for p in dist.rglob('*.html'):
    x=P()
    try: x.feed(p.read_text(errors='replace'))
    except Exception as e:
        errors.append(f'html parse failed {p.relative_to(root)}: {e}')
        continue
    if x.release_values:
        for value in x.release_values:
            legacy[value]+=1
            if not re.fullmatch(r'FR-NAV\d+\.\d+\.\d+-HF\d+\.\d+\.\d+',value):
                bad_meta.append((str(p.relative_to(root)),value))
    elif x.has_main:
        missing_meta.append(str(p.relative_to(root)))
    if x.has_main:
        full+=1
        if x.has_hf36: covered+=1
        else: errors.append('full public page missing canonical release loader: '+str(p.relative_to(root)))

need(full>0,'no full public pages found')
need(covered==full,'canonical release loader coverage incomplete')
need(not bad_meta,'malformed static release markers: '+repr(bad_meta[:20]))

# Representative high-value journeys must all use the common canonicalizer.
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
    'featureSpecificWriters':offenders,
    'staticReleaseMarkerVersions':dict(sorted(legacy.items())),
    'fullPagesMissingStaticMarker':len(missing_meta),
    'runtimeCanonicalization':'SHARED_HF36_ONLY'
}
print(json.dumps(result,indent=2,sort_keys=True))
if errors:
    print(json.dumps({'errors':errors},indent=2))
    sys.exit(1)
