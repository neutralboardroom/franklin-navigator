#!/usr/bin/env python3
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
fail=[]

def need(cond,msg):
    if not cond:
        fail.append(msg)

business=(root/'dist/assets/r1326-business-journey.js').read_text(errors='replace')
path_css=(root/'dist/assets/r1327-refinement.css').read_text(errors='replace')
color=(root/'dist/assets/r1336-color-system.css').read_text(errors='replace')
r33=(root/'dist/assets/r33.css').read_text(errors='replace')
static_business=(root/'dist/business-dashboard/index.html').read_text(errors='replace')
static_es=(root/'dist/es/negocios/index.html').read_text(errors='replace')

approved="Find your Franklin profile. Improve it. Grow your local visibility."
approved_es="Encuentre su perfil de Franklin. Mejórelo. Aumente su visibilidad local."
old="Find your Franklin profile, then improve it."
old_es="Encuentre su perfil de Franklin y luego mejórelo."

need(approved in static_business,'approved static business headline missing')
need(approved_es in static_es,'approved static Spanish business headline missing')
need(approved in business,'dynamic business headline does not preserve owner-approved wording')
need(approved_es in business,'dynamic Spanish business headline does not preserve approved wording')

# The live R1338/R1339 collision came from the legacy .hf310-path strong 26x26 badge
# being reused after R1326 injected a full text heading into <strong>. Both dynamic
# layers must explicitly neutralize fixed badge geometry.
for token in [
    "width:auto!important",
    "height:auto!important",
    "background:transparent!important",
    "overflow-wrap:anywhere",
]:
    need(token in business,'R1326 dynamic path reset missing '+token)
    need(token in path_css,'R1327 dynamic path reset missing '+token)
need("min-width:0!important" in path_css,'R1327 path-card min-width guard missing')
need("color:#1d3136!important" in path_css,'R1327 path-card readable text color missing')

# Dark semantic surfaces must override the site-wide teal eyebrow token.
for cls in ['urgent-section','history-section','growth-trust','growth-boundaries','home-command-bar','learning-boundary']:
    need(cls in color,'dark-surface readability guard missing '+cls)
need("color:#ffe4a6!important" in color,'dark-surface eyebrow contrast color missing')

# Long flex-checkbox labels must wrap rather than escape their cards when text is enlarged.
for token in ['min-width:0!important','overflow-wrap:anywhere','flex:0 0 auto']:
    need(token in r33,'review/appeal long-label wrap guard missing '+token)

# No later public HTML/JS may reintroduce the retired headline wording.
stale=[]
for base in [root/'dist']:
    for p in base.rglob('*'):
        if not p.is_file() or p.suffix.lower() not in {'.html','.js'}:
            continue
        t=p.read_text(errors='ignore')
        if old in t or old_es in t:
            stale.append(str(p.relative_to(root)))
need(not stale,'stale business headline override remains: '+repr(stale[:20]))

if fail:
    print(json.dumps({'result':'FAIL','failures':fail},indent=2))
    raise SystemExit(1)

print(json.dumps({
    'result':'PASS',
    'approvedBusinessHeadline':approved,
    'dynamicHeadlinePreserved':True,
    'pathCardFixedBadgeGeometryNeutralized':True,
    'darkSurfaceContrastGuardCount':6,
    'enlargedTextLongLabelGuard':True,
    'staleHeadlineFiles':0
},indent=2))
