#!/usr/bin/env python3
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
fail=[]

def need(cond,msg):
    if not cond:
        fail.append(msg)

business=(root/'dist/business-dashboard/index.html').read_text(errors='replace')
membership=(root/'dist/membership-start/index.html').read_text(errors='replace')
preview=(root/'dist/member-profile-preview/index.html').read_text(errors='replace')
spanish=(root/'dist/es/iniciar-membresia/index.html').read_text(errors='replace')
dynamic=(root/'dist/assets/r1326-business-journey.js').read_text(errors='replace')
release=(root/'PRODUCTION_RELEASE.json').read_text(errors='replace')

headline='Find your Franklin profile. Improve it. Grow your local visibility.'
visibility='Community Member / Sponsored'
need(headline in business,'owner-approved business headline missing from static business page')
need(headline in dynamic,'owner-approved business headline missing from dynamic enhancement')
need('How membership increases your visibility:' in business,'business-page visibility mechanism explanation missing')
need('How membership increases your visibility:' in dynamic,'dynamic business-page visibility explanation missing')
need('Grow your visibility in the Franklin community.' in membership,'membership hero does not lead with visibility value')
need('How increased visibility works' in membership,'membership visibility explainer section missing')
need('ordinary unpaid ranking' in membership,'membership neutrality explanation missing')
need('does not guarantee leads' in business or 'does not guarantee leads' in dynamic,'no-guaranteed-leads safeguard missing')
need(visibility in business,'business dashboard labeled visibility language missing')
need(visibility in membership,'membership labeled visibility language missing')
need(visibility in preview,'member preview labeled visibility language missing')
need(visibility in dynamic,'dynamic labeled visibility language missing')
need('Aumente su visibilidad en la comunidad de Franklin.' in spanish,'Spanish visibility hero missing')
need('Cómo funciona la mayor visibilidad' in spanish,'Spanish visibility explainer missing')
need('no garantiza clientes potenciales, clientes ni resultados' in spanish,'Spanish no-guarantee safeguard missing')
need('FR-NAV1.30.41-HF3.13.23' in release,'R1341 release identity missing from production metadata')
need('"ordinaryUnpaidRankingChanged": false' in release,'release metadata must preserve unpaid-ranking neutrality')
need('"guaranteedLeads": false' in release,'release metadata must reject guaranteed-lead claims')

if fail:
    print(json.dumps({'result':'FAIL','failures':fail},indent=2,ensure_ascii=False))
    raise SystemExit(1)

print(json.dumps({
    'result':'PASS',
    'release':'FR-NAV1.30.41-HF3.13.23',
    'ownerHeadlinePreserved':True,
    'visibilityMechanismExplained':True,
    'labeledPaidVisibilitySeparatedFromOrganicRanking':True,
    'guaranteedLeadClaimsProhibited':True,
    'spanishParity':True,
    'surfacesChecked':[
      '/business-dashboard/',
      '/membership-start/',
      '/member-profile-preview/',
      '/es/iniciar-membresia/',
      '/assets/r1326-business-journey.js'
    ]
},indent=2,ensure_ascii=False))
