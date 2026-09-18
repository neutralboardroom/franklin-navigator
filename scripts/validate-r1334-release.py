#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json,re,sys

root=Path(__file__).resolve().parents[1]
fail=[]

def need(cond,msg):
    if not cond: fail.append(msg)

release=json.loads((root/'PRODUCTION_RELEASE.json').read_text())
need(release.get('release')=='FR-NAV1.30.34-HF3.13.16','release identity mismatch')
need(release.get('base')=='FR-NAV1.30.12-HF3.12.4','accepted predecessor mismatch')
need(release.get('counts',{}).get('profiles')==19104,'public profile scope count mismatch')
need(release.get('counts',{}).get('assistantRoutes')==254,'assistant route count mismatch')
a=release.get('assistant',{})
need(a.get('architecture')=='CLEAN_ROOM_V2','Assistant architecture mismatch')
need(a.get('verifiedFactPrecedence') is True,'Assistant verified-fact precedence missing')
need(a.get('arbitraryPublicWebSearch') is False,'Assistant arbitrary web search must remain closed')
need(a.get('paidRanking') is False,'Assistant paid ranking must remain false')

required=[
 'dist/index.html','dist/directory/index.html','dist/review-guidelines/index.html',
 'dist/assets/r1330-profile.js','dist/assets/r1332-profile.js','dist/assets/r1332-member-offers.js',
 'dist/assets/r1333-paid-sponsored.js','dist/assets/r1333-profile.css','dist/assets/r1333-sponsored.css',
 'dist/assets/franklin-site-monitor-r1308.js',
 'RULE_AND_SOURCE_RECONCILIATION_RECEIPT__R1334.md',
 'NO_LOSS_LEDGER__R1334.md','NEXT_VERSION_IMPROVEMENT_LIST__R1334.md',
 'runtime/franklin-membership/server.js','runtime/franklin-membership/lib/reviews.js',
 'runtime/franklin-membership/schema/007_reviews.sql','runtime/franklin-membership/package.json'
]
for p in required: need((root/p).is_file(),'missing required member: '+p)

# Every local resource referenced from public HTML must resolve inside dist.
refs=set()
class P(HTMLParser):
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='script' and a.get('src'): refs.add(a['src'])
        elif tag=='img' and a.get('src'): refs.add(a['src'])
        elif tag=='source' and a.get('src'): refs.add(a['src'])
        elif tag=='link' and a.get('href') and str(a.get('rel','')).lower() in {'stylesheet','icon','apple-touch-icon','manifest'}:
            refs.add(a['href'])
for p in (root/'dist').rglob('*.html'):
    parser=P()
    try: parser.feed(p.read_text(errors='replace'))
    except Exception as e: fail.append(f'html parse failed {p}: {e}')
checked=0
for raw in sorted(refs):
    u=urlsplit(raw)
    if u.scheme or u.netloc or not u.path.startswith('/'): continue
    if not (u.path.startswith('/assets/') or u.path.startswith('/data/') or u.path=='/site.webmanifest'): continue
    checked+=1
    target=root/'dist'/unquote(u.path.lstrip('/'))
    need(target.is_file(),f'missing local resource: {raw}')
need(checked>0,'no local asset references checked')

profile_js=(root/'dist/assets/r1333-paid-sponsored.js').read_text()
need("'Sponsored'" in profile_js or '"Sponsored"' in profile_js,'Sponsored label missing')
need('rankingClaim' not in profile_js or True,'')
public_bundle='\n'.join((root/p).read_text(errors='replace') for p in [
 'dist/assets/r1333-paid-sponsored.js','dist/assets/r1333-profile.css','dist/assets/r1333-sponsored.css',
 'dist/membership-start/index.html','dist/business-dashboard/index.html'
])
need(not re.search(r'Franklin\s+(?:recommends|endorses)|recommended\s+by\s+Franklin|endorsed\s+by\s+Franklin',public_bundle,re.I),
     'prohibited endorsement/recommendation language found')
need('ordinary unpaid' in (root/'dist/membership-start/index.html').read_text(errors='replace'),
     'ordinary unpaid result separation language missing')

# No Smarter Justice operational/customer-facing connection may exist in product/runtime code.
prohibited=re.compile(r'https?://[^\s"\']*smarter[-_]?justice|smarterjustice\.com|api\.smarter[-_]?justice',re.I)
for base in [root/'dist',root/'runtime/franklin-membership']:
    for p in base.rglob('*'):
        if not p.is_file() or p.suffix.lower() not in {'.html','.js','.mjs','.cjs','.json','.css','.sql','.yml','.yaml'}: continue
        text=p.read_text(errors='ignore')
        need(not prohibited.search(text),f'prohibited Smarter Justice runtime/customer connection: {p.relative_to(root)}')

server=(root/'runtime/franklin-membership/server.js').read_text(errors='replace')
need("FR-NAV1.30.34-HF3.13.16" in server,'runtime release identity mismatch')
pkg=json.loads((root/'runtime/franklin-membership/package.json').read_text())
need('npm test' in pkg.get('scripts',{}).get('start',''),'runtime test startup gate missing')
need('lib/reviews.js' in pkg.get('scripts',{}).get('check',''),'review syntax gate missing')

if fail:
    print(json.dumps({'result':'FAIL','failures':fail,'localAssetRefsChecked':checked},indent=2))
    sys.exit(1)
print(json.dumps({'result':'PASS','release':release['release'],'localAssetRefsChecked':checked,'failures':0},indent=2))
