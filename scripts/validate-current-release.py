#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json,re,sys

root=Path(__file__).resolve().parents[1]
fail=[]
def need(cond,msg):
    if not cond: fail.append(msg)

meta=json.loads((root/'PRODUCTION_RELEASE.json').read_text())
release=str(meta.get('release',''))
need(bool(re.fullmatch(r'FR-NAV\d+\.\d+\.\d+-HF\d+\.\d+\.\d+',release)),'release identity format mismatch')
canonical_profile_count=meta.get('counts',{}).get('profiles')
need(canonical_profile_count==19003,'canonical public profile count mismatch')
need(meta.get('counts',{}).get('assistantRoutes')==254,'assistant route count mismatch')

# Current-release metadata evolved after R1360: public releases may use either
# version or runtimeRelease as their release key. Bind to exactly one current block.
current=None; current_key=None; prior_color=[]
for key,value in meta.items():
    if not isinstance(value,dict):
        continue
    if isinstance(value.get('colorSystem'),dict):
        prior_color.append((key,value['colorSystem']))
    if value.get('version')==release or value.get('runtimeRelease')==release:
        current=value; current_key=key
        break
need(current is not None,'current release metadata block missing')

predecessor=None
if isinstance((current or {}).get('predecessor'),dict):
    predecessor=(current['predecessor'] or {}).get('version')
elif isinstance((current or {}).get('predecessor'),str):
    predecessor=current.get('predecessor')
predecessor=predecessor or (current or {}).get('predecessorRelease')
need(meta.get('base')==predecessor,'immediate predecessor/base mismatch')

# R1362 intentionally retained public design/dist bytes. Color metadata may therefore
# be inherited from the latest preceding release only when the current release says
# both design and public dist assets were unchanged.
color_meta=(current or {}).get('colorSystem') if isinstance((current or {}).get('colorSystem'),dict) else None
if color_meta is None:
    need((current or {}).get('publicDesignChanged') is False,'missing explicit no-design-change attestation for inherited color system')
    need((current or {}).get('publicDistAssetsChanged') is False,'missing explicit no-public-dist-change attestation for inherited color system')
    color_meta=prior_color[-1][1] if prior_color else None
need(isinstance(color_meta,dict),'current/inherited release color metadata missing')
color_asset=(color_meta or {}).get('asset','')
need(color_asset.startswith('/assets/') and color_asset.endswith('.css'),'current/inherited release color asset metadata missing')
color_rel='dist/'+color_asset.lstrip('/') if color_asset else ''

# R1360 canonicalization changed the public accounting model: 19,003 published
# canonical profiles + 100 accepted aliases + 1 explicit suppression = 19,104
# fully accounted baseline identities, while legacy discovery rows remain 19,103.
alias_path=root/'dist/data/profile-aliases-r1360.json'
profile_manifest_path=root/'dist/data/franklin-profiles-manifest.json'
discovery_manifest_path=root/'dist/data/discovery/manifest.json'
need(alias_path.is_file(),'missing R1360 alias contract')
need(profile_manifest_path.is_file(),'missing canonical profile manifest')
need(discovery_manifest_path.is_file(),'missing discovery manifest')
alias_doc=json.loads(alias_path.read_text()) if alias_path.is_file() else {'aliases':{}}
profile_manifest=json.loads(profile_manifest_path.read_text()) if profile_manifest_path.is_file() else {}
discovery_manifest=json.loads(discovery_manifest_path.read_text()) if discovery_manifest_path.is_file() else {}
alias_ids=set((alias_doc.get('aliases') or {}).keys())
suppressed_ids=set(profile_manifest.get('r1360SuppressedGenericProfileIds') or [])
terminal_profile_ids=alias_ids|suppressed_ids
need(alias_doc.get('profileFactoryVersion')=='FR-PF-PLATFORM-15.38','accepted Profile Factory alias authority mismatch')
need(len(alias_ids)==100,'accepted alias count mismatch')
need(suppressed_ids=={'FR-ORG-a0776afee5ec-firstbank'},'explicit suppression set mismatch')
need(canonical_profile_count+len(alias_ids)+len(suppressed_ids)==19104,'profile baseline accounting mismatch')
need(discovery_manifest.get('recordCount')==19103,'legacy discovery row count mismatch')
need(profile_manifest.get('recordCount')==19002,'canonical manifest published-record count mismatch')

required=[
 'dist/index.html','dist/directory/index.html','dist/review-guidelines/index.html',
 'dist/assets/r1330-profile.js','dist/assets/r1332-profile.js','dist/assets/r1332-member-offers.js',
 'dist/assets/r1333-paid-sponsored.js','dist/assets/r1333-profile.css','dist/assets/r1333-sponsored.css',
 'dist/assets/hf36.js','dist/assets/franklin-site-monitor-r1308.js',
 'runtime/franklin-membership/server.js','runtime/franklin-membership/lib/reviews.js',
 'runtime/franklin-membership/schema/007_reviews.sql','runtime/franklin-membership/package.json',
 'R1362_RELEASE_RECEIPT.json'
]
if color_rel: required.append(color_rel)
for p in required: need((root/p).is_file(),'missing required member: '+p)
for p in (current or {}).get('receipts',[]):
    need((root/p).is_file(),'missing current release receipt: '+str(p))

# Every full product page must use the shared loader. The exact accepted 100 alias
# redirects plus one generic suppression are terminal noindex pages and intentionally
# do not load the full application shell.
refs=set(); full_pages=covered=terminal=0; seen_terminal_ids=set(); active_scripts=set()
class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.has_main=False; self.has_hf36=False; self.robots=''; self.scripts=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='main': self.has_main=True
        if tag=='script' and a.get('src'):
            src=str(a['src']); refs.add(src); self.scripts.append(src)
            if '/assets/hf36.js' in src: self.has_hf36=True
        elif tag=='img' and a.get('src'): refs.add(a['src'])
        elif tag=='source' and a.get('src'): refs.add(a['src'])
        elif tag=='link' and a.get('href') and str(a.get('rel','')).lower() in {'stylesheet','icon','apple-touch-icon','manifest'}:
            refs.add(a['href'])
        if tag=='meta' and str(a.get('name','')).lower()=='robots': self.robots=str(a.get('content','')).lower()

for p in (root/'dist').rglob('*.html'):
    parser=P()
    try: parser.feed(p.read_text(errors='replace'))
    except Exception as e:
        fail.append(f'html parse failed {p}: {e}'); continue
    for src in parser.scripts:
        u=urlsplit(src)
        if not u.scheme and not u.netloc and u.path.startswith('/assets/') and u.path.endswith('.js'):
            active_scripts.add(Path(u.path).name)
    parts=p.relative_to(root/'dist').parts
    terminal_id=parts[1] if len(parts)==3 and parts[0]=='profiles' and parts[2]=='index.html' and parts[1] in terminal_profile_ids else None
    if terminal_id:
        terminal+=1; seen_terminal_ids.add(terminal_id)
        need('noindex' in parser.robots,'terminal profile page must be noindex: '+str(p.relative_to(root)))
        continue
    if parser.has_main:
        full_pages+=1
        if parser.has_hf36: covered+=1
        else: fail.append('shared loader missing: '+str(p.relative_to(root)))

need(seen_terminal_ids==terminal_profile_ids,'terminal profile page set mismatch')
need(terminal==101,'terminal profile page count mismatch')
checked=0
for raw in sorted(refs):
    u=urlsplit(raw)
    if u.scheme or u.netloc or not u.path.startswith('/'): continue
    if not (u.path.startswith('/assets/') or u.path.startswith('/data/') or u.path=='/site.webmanifest'): continue
    checked+=1
    need((root/'dist'/unquote(u.path.lstrip('/'))).is_file(),f'missing local resource: {raw}')
need(full_pages>0 and covered==full_pages,'shared color-system coverage incomplete')
need(checked>0,'no local asset references checked')

hf=(root/'dist/assets/hf36.js').read_text(errors='replace')
monitor=(root/'dist/assets/franklin-site-monitor-r1308.js').read_text(errors='replace')
color=(root/color_rel).read_text(errors='replace') if color_rel and (root/color_rel).is_file() else ''
need(bool(color_asset) and color_asset in hf,'current/inherited release color system not loaded')
need('franklin-site-monitor-r1308.js' in hf,'shared release canonicalizer is not loaded by hf36')
need(f"const CURRENT_RELEASE='{release}'" in monitor,'shared release canonicalizer current release mismatch')
need('releaseMeta.content=CURRENT_RELEASE' in monitor,'shared release canonicalizer meta update missing')
need('dataset.franklinRelease=CURRENT_RELEASE' in monitor,'shared release canonicalizer dataset update missing')
for m in re.finditer(r"['\"](/assets/[^'\"]+\.js)(?:\?[^'\"]*)?['\"]",hf):
    active_scripts.add(Path(urlsplit(m.group(1)).path).name)
writer_re=re.compile(r"franklin-release.{0,260}(?:\.content\s*=|setAttribute\(\s*['\"]content['\"])",re.I|re.S)
release_owners=[]
for name in sorted(active_scripts):
    p=root/'dist/assets'/name
    if name in {'hf36.js','franklin-site-monitor-r1308.js'} or not p.is_file(): continue
    if writer_re.search(p.read_text(errors='replace')):
        release_owners.append(str(p.relative_to(root)))
need(not release_owners,'active feature-specific public release-meta writers: '+repr(release_owners))
for token in ['--fr-teal:','--fr-green:','--fr-blue:','--fr-gold:','--fr-violet:']:
    need(token in color,'missing color token '+token)

profile_js=(root/'dist/assets/r1333-paid-sponsored.js').read_text(errors='replace')
need("'Sponsored'" in profile_js or '"Sponsored"' in profile_js,'Sponsored label missing')
public_bundle='\n'.join((root/p).read_text(errors='replace') for p in [
 'dist/assets/r1333-paid-sponsored.js','dist/assets/r1333-profile.css','dist/assets/r1333-sponsored.css',
 'dist/membership-start/index.html','dist/business-dashboard/index.html'
])
need(not re.search(r'Franklin\s+(?:recommends|endorses)|recommended\s+by\s+Franklin|endorsed\s+by\s+Franklin',public_bundle,re.I),
     'prohibited endorsement/recommendation language found')
need('ordinary unpaid' in (root/'dist/membership-start/index.html').read_text(errors='replace'),
     'ordinary unpaid result separation language missing')

prohibited=re.compile(r'https?://[^\s"\']*smarter[-_]?justice|smarterjustice\.com|api\.smarter[-_]?justice',re.I)
for base in [root/'dist',root/'runtime/franklin-membership']:
    for p in base.rglob('*'):
        if not p.is_file() or p.suffix.lower() not in {'.html','.js','.mjs','.cjs','.json','.css','.sql','.yml','.yaml'}: continue
        need(not prohibited.search(p.read_text(errors='ignore')),f'prohibited Smarter Justice runtime/customer connection: {p.relative_to(root)}')

server=(root/'runtime/franklin-membership/server.js').read_text(errors='replace')
runtime_commit=(current or {}).get('finalRuntimeCommit') or (current or {}).get('runtimeCommit') or (((current or {}).get('runtime') or {}).get('commit') if isinstance((current or {}).get('runtime'),dict) else None)
need(bool(runtime_commit) and bool(re.fullmatch(r'[0-9a-f]{40}',str(runtime_commit))),'runtime source commit binding missing')
need((current or {}).get('runtimeRelease',release)==release,'runtime release metadata mismatch')
need("const EMBEDDED_RELEASE = '"+release+"'" in server,'runtime embedded release identity mismatch')
need('process.env.LOCAL_RELEASE' in server,'runtime environment release binding missing')
need('LOCAL_RELEASE_MISMATCH' in server,'runtime release drift fail-closed guard missing')
need('const RELEASE = EMBEDDED_RELEASE' in server,'runtime must execute embedded release identity')
pkg=json.loads((root/'runtime/franklin-membership/package.json').read_text())
need('npm test' in pkg.get('scripts',{}).get('start',''),'runtime test startup gate missing')
need('lib/reviews.js' in pkg.get('scripts',{}).get('check',''),'review syntax gate missing')

if fail:
    print(json.dumps({'result':'FAIL','release':release,'failures':fail,'fullPages':full_pages,'terminalPages':terminal,'covered':covered,'localAssetRefsChecked':checked},indent=2))
    sys.exit(1)
print(json.dumps({'result':'PASS','release':release,'canonicalProfiles':canonical_profile_count,'accountedProfileBaseline':19104,'fullPages':full_pages,'terminalPages':terminal,'covered':covered,'localAssetRefsChecked':checked,'failures':0},indent=2))
