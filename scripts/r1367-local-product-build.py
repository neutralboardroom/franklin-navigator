#!/usr/bin/env python3
"""Bounded R1367 Local-owned currentness and identity-contract updates.

This script intentionally does not alter canonical PF identity truth. It only:
- exposes the already-authoritative intentional generic suppression in the Local
  consumer contract consumed by profile-scope.js;
- updates homepage release markers for the pages materially changed in R1367;
- removes one stale Spanish homepage sentence that contradicted the already-live
  Spanish business/membership experience;
- repairs Spanish homepage links where an existing Spanish route was already
  available but the homepage still sent the user back to the English route.
"""
from __future__ import annotations
import json
import pathlib
import re

ROOT=pathlib.Path(__file__).resolve().parents[1]
RELEASE='FR-NAV1.30.67-HF3.13.49'
SUPPRESSED='FR-ORG-a0776afee5ec-firstbank'
ALIAS_FILES=[
    ROOT/'dist/data/profile-aliases-r1360.json',
    ROOT/'runtime/franklin-membership/data/profile-aliases-r1360.json',
]
HOME_FILES=[ROOT/'dist/index.html',ROOT/'dist/es/index.html']
OLD_ES='Encuentre su perfil público, use el planificador gratuito de crecimiento y previsualiza la experiencia de perfil ampliado para miembros mientras la inscripción permanece cerrada.'
NEW_ES='Encuentre su perfil público, revise la versión ampliada para miembros y decida si la Membresía Comunitaria opcional de $35/año le conviene. Reclamar el perfil, corregir hechos y solicitar el retiro siguen siendo gratuitos.'
ES_ROUTE_REPAIRS={
    'href="/community/">Explorar Comunidad':'href="/es/comunidad/">Explorar Comunidad',
    'href="/membership-start/">Membresía':'href="/es/iniciar-membresia/">Membresía',
    'href="/privacy/">Privacidad':'href="/es/privacidad/">Privacidad',
}

def patch_alias_contract(path:pathlib.Path)->None:
    payload=json.loads(path.read_text())
    aliases=payload.get('aliases') or {}
    holds=payload.get('reviewHeldProfileIds')
    if payload.get('community')!='FRANKLIN_TN' or len(aliases)!=100 or holds!=[]:
        raise SystemExit(f'Unexpected alias contract baseline: {path}')
    payload['suppressedGenericProfileIds']=[SUPPRESSED]
    path.write_text(json.dumps(payload,separators=(',',':'))+'\n')

def patch_home(path:pathlib.Path)->None:
    text=path.read_text()
    text,n=re.subn(r'<meta content="FR-NAV[^\"]+" name="franklin-release"/>',f'<meta content="{RELEASE}" name="franklin-release"/>',text,count=1)
    if n!=1:
        raise SystemExit(f'Expected one release marker: {path}')
    if path.parts[-2:] == ('es','index.html'):
        if OLD_ES not in text:
            raise SystemExit('Expected stale Spanish membership sentence was not found exactly once')
        text=text.replace(OLD_ES,NEW_ES,1)
        if OLD_ES in text:
            raise SystemExit('Stale Spanish membership sentence remains')
        for old,new in ES_ROUTE_REPAIRS.items():
            if old not in text:
                raise SystemExit(f'Expected Spanish route repair source not found: {old}')
            text=text.replace(old,new,1)
    path.write_text(text)

def main()->None:
    for path in ALIAS_FILES: patch_alias_contract(path)
    for path in HOME_FILES: patch_home(path)
    print(json.dumps({
        'result':'PASS',
        'release':RELEASE,
        'aliasCount':100,
        'reviewHoldCount':0,
        'suppressedGenericProfileIds':[SUPPRESSED],
        'desktopHeroBaseModified':False,
        'spanishHomepageMembershipCurrentness':'UPDATED',
        'spanishHomepageExistingRouteRepairs':sorted(ES_ROUTE_REPAIRS.values())
    },sort_keys=True))

if __name__=='__main__': main()
