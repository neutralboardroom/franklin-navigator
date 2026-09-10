#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, tempfile

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'

public_ext={'.html','.js','.json','.xml'}
stale=[
    re.compile(r'\$5/month',re.I),
    re.compile(r'\$50/year',re.I),
    re.compile(r'\$90\s*(?:/|for)\s*(?:three|36)',re.I),
    re.compile(r'\$120',re.I),
    re.compile(r'franklin_community_member_monthly_v5'),
    re.compile(r'franklin_community_member_annual_v5'),
    re.compile(r'franklin_charter_member_36_month_v[56]')
]
hits=[]
for p in DIST.rglob('*'):
    if p.is_file() and p.suffix.lower() in public_ext:
        text=p.read_text('utf-8',errors='ignore')
        if any(rx.search(text) for rx in stale): hits.append(str(p.relative_to(ROOT)))
if hits: raise SystemExit('STALE_PUBLIC_NEW_SALE_TRUTH:'+','.join(hits[:80]))

for rel in ['membership-pricing/index.html','member-profile-preview/index.html','membership-start/index.html','business-dashboard/index.html','business-membership/index.html']:
    text=(DIST/rel).read_text('utf-8')
    if '$35' not in text: raise SystemExit('MISSING_35:'+rel)

cat=json.loads((DIST/'data/membership-checkout-catalog.json').read_text('utf-8'))
assert len(cat['choices'])==1
assert cat['choices'][0]['amountUsd']==35 and cat['choices'][0]['autoRenew'] is True
assert cat['checkout']['retiredPlanIdentifiersRejectedServerSide'] is True
assert cat['freePresence']['factualCorrectionsFree'] is True
assert cat['freePresence']['publicProfileRemovalFree'] is True
assert cat['freePresence']['membershipRequiredForProfileControl'] is False

for rel,lang in [('corrections/index.html','en'),('es/correcciones/index.html','es')]:
    text=(DIST/rel).read_text('utf-8')
    assert f'lang="{lang}"' in text and 'data-profile-control-form' in text and 'PUBLIC_REMOVAL' in text and 'role="status"' in text and 'viewport' in text
assert 'PUBLIC_REMOVAL' in (DIST/'assets/member-public.js').read_text('utf-8')
assert 'public-profile-suppressions.json' in (DIST/'assets/local-discovery.js').read_text('utf-8')
assert 'public-profile-suppressions.json' in (DIST/'assets/member-public.js').read_text('utf-8')
assert 'scripts/apply-profile-suppressions.py' in (ROOT/'scripts/build-hf31-release.py').read_text('utf-8')
assert (ROOT/'scripts/review-public-profile-suppression.py').exists()

# Mobile/layout and accessibility essentials on the new free-control flow.
css=(DIST/'assets/p0-closeout.css').read_text('utf-8')
assert '@media(max-width:720px)' in css and 'grid-template-columns:1fr' in css
for rel in ['corrections/index.html','es/correcciones/index.html']:
    t=(DIST/rel).read_text('utf-8')
    assert 'skip-link' in t and 'role="status"' in t and '<label' in t and 'required' in t

# Test the suppression contract on a fresh synthetic reimport: source record returns, then Local suppression wins again.
with tempfile.TemporaryDirectory() as td:
    d=Path(td); (d/'data').mkdir(); (d/'profiles/FR-ORG-TEST-abc').mkdir(parents=True)
    chunk=d/'data/chunk.json'
    chunk.write_text(json.dumps({'records':[{'i':'FR-ORG-TEST-abc','n':'Suppressed Test'},{'i':'FR-ORG-TEST-def','n':'Visible Test'}]}),'utf-8')
    manifest={'chunks':[{'file':'data/chunk.json','records':2,'bytes':chunk.stat().st_size,'sha256':'source-reimport'}],'recordCount':2}
    (d/'data/franklin-profiles-manifest.json').write_text(json.dumps(manifest),'utf-8')
    (d/'profiles/FR-ORG-TEST-abc/index.html').write_text('<html><body>freshly reimported source profile</body></html>','utf-8')
    ledger={'community':'FRANKLIN_TN','entries':[{'profileId':'FR-ORG-TEST-abc','status':'SUPPRESSED'}]}
    lp=d/'data/public-profile-suppressions.json'; lp.write_text(json.dumps(ledger),'utf-8')
    subprocess.run(['python','scripts/apply-profile-suppressions.py','--dist',str(d),'--ledger',str(lp)],cwd=ROOT,check=True)
    out=json.loads(chunk.read_text('utf-8')); ids={r['i'] for r in out['records']}
    assert 'FR-ORG-TEST-abc' not in ids and 'FR-ORG-TEST-def' in ids
    page=(d/'profiles/FR-ORG-TEST-abc/index.html').read_text('utf-8')
    assert 'noindex,nofollow' in page and 'not publicly displayed' in page
    m=json.loads((d/'data/franklin-profiles-manifest.json').read_text('utf-8'))
    assert m['recordCount']==1 and m['heldInPublicProjection']==1 and m['publicSuppressionLedgerApplied'] is True

print(json.dumps({'result':'PASS','publicNewSaleChoices':1,'annualUsd':35,'retiredPublicPriceHits':0,'freeCorrection':True,'freeRemoval':True,'enEsRoutes':True,'mobileAccessibilityStructure':True,'syntheticApprovedSuppressionSurvivesReimport':True}))
