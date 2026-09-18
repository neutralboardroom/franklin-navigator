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
need(meta.get('base')=='FR-NAV1.30.12-HF3.12.4','accepted canonical base mismatch')
need(meta.get('counts',{}).get('profiles')==19104,'public profile scope count mismatch')
need(meta.get('counts',{}).get('assistantRoutes')==254,'assistant route count mismatch')

current=None
for key,value in meta.items():
    if isinstance(value,dict) and value.get('version')==release and isinstance(value.get('runtime'),dict):
        current=value
        break
need(current is not None,'current release metadata block missing')
color_asset=((current or {}).get('colorSystem') or {}).get('asset','')
need(color_asset.startswith('/assets/') and color_asset.endswith('.css'),'current release color asset metadata missing')
color_rel='dist/'+color_asset.lstrip('/') if color_asset else ''

a=meta.get('assistant',{})
need(a.get('architecture')=='CLEAN_ROOM_V2','Assistant architecture mismatch')
need(a.get('verifiedFactPrecedence') is True,'Assistant verified-fact precedence missing')
need(a.get('arbitraryPublicWebSearch') is False,'Assistant arbitrary web search must remain closed')
need(a.get('paidRanking') is False,'Assistant paid ranking must remain false')

required=[
 'dist/index.html','dist/directory/index.html','dist/review-guidelines/index.html',
 'dist/assets/r1330-profile.js','dist/assets/r1332-profile.js','dist/assets/r1332-member-offers.js',
 'dist/assets/r1333-paid-sponsored.js','dist/assets/r1333-profile.css','dist/assets/r1333-sponsored.css',
 'dist/assets/franklin-site-monitor-r1308.js',
 'runtime/franklin-membership/server.js','runtime/franklin-membership/lib/reviews.js',
 'runtime/franklin-membership/schema/007_reviews.sql','runtime/franklin-membership/package.json'
]
if color_rel: required.append(color_rel)
for p in required: need((root/p).is_file(),'missing required member: '+p)
for p in (current or {}).get('receipts',[]):
    need((root/p).is_file(),'missing current release receipt: '+str(p))

# Every full page must use the shared loader; every local static resource must resolve.
refs=set(); full_pages=covered=0
class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.has_main=False; self.has_hf36=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='main': self.has_main=True
        if tag=='script' and a.get('src'):
            refs.add(a['src'])
            if '/assets/hf36.js' in str(a['src']): self.has_hf36=True
        elif tag=='img' and a.get('src'): refs.add(a['src'])
        elif tag=='source' and a.get('src'): refs.add(a['src'])
        elif tag=='link' and a.get('href') and str(a.get('rel','')).lower() in {'stylesheet','icon','apple-touch-icon','manifest'}:
            refs.add(a['href'])
for p in (root/'dist').rglob('*.html'):
    parser=P()
    try: parser.feed(p.read_text(errors='replace'))
    except Exception as e:
        fail.append(f'html parse failed {p}: {e}'); continue
    if parser.has_main:
        full_pages+=1
        if parser.has_hf36: covered+=1
        else: fail.append('shared loader missing: '+str(p.relative_to(root)))

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
color=(root/color_rel).read_text(errors='replace') if color_rel and (root/color_rel).is_file() else ''
need(bool(color_asset) and color_asset in hf,'current release color system not loaded')
need(f"const CURRENT_RELEASE='{release}'" in hf,'shared loader current release mismatch')
need('meta.content=CURRENT_RELEASE' in hf,'shared loader release canonicalizer missing')
need('dataset.franklinRelease=CURRENT_RELEASE' in hf,'shared loader release dataset missing')
active_scripts=set()
for p in (root/'dist').rglob('*.html'):
    t=p.read_text(errors='replace')
    for m in re.finditer(r'<script[^>]+src=["\\\'](/assets/[^"\\\']+\\.js)(?:\\?[^"\\\']*)?["\\\']',t,re.I):
        active_scripts.add(Path(urlsplit(m.group(1)).path).name)
for m in re.finditer(r"['\\\"](/assets/[^'\\\"]+\\.js)(?:\\?[^'\\\"]*)?['\\\"]",hf):
    active_scripts.add(Path(urlsplit(m.group(1)).path).name)
writer_re=re.compile(
    r"franklin-release.{0,260}(?:\.content\s*=|setAttribute\(\s*['\"]content['\"])",
    re.I|re.S
)
release_owners=[]
for name in sorted(active_scripts):
    p=root/'dist/assets'/name
    if name=='hf36.js' or not p.is_file(): continue
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
need(release in server,'runtime release identity mismatch')
pkg=json.loads((root/'runtime/franklin-membership/package.json').read_text())
need('npm test' in pkg.get('scripts',{}).get('start',''),'runtime test startup gate missing')
need('lib/reviews.js' in pkg.get('scripts',{}).get('check',''),'review syntax gate missing')

if fail:
    print(json.dumps({'result':'FAIL','release':release,'failures':fail,'fullPages':full_pages,'covered':covered,'localAssetRefsChecked':checked},indent=2))
    sys.exit(1)
print(json.dumps({'result':'PASS','release':release,'fullPages':full_pages,'covered':covered,'localAssetRefsChecked':checked,'failures':0},indent=2))
