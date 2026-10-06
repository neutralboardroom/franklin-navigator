#!/usr/bin/env python3
"""Bounded R1367 Local-owned currentness and identity-contract updates.

This script intentionally does not alter canonical PF identity truth. It only:
- exposes the already-authoritative intentional generic suppression in the Local
  consumer contract consumed by profile-scope.js;
- updates release markers for public pages materially changed in R1367;
- removes stale Spanish homepage membership copy and repairs Spanish links where
  an existing Spanish route was already available;
- removes stale R1365-era public copy that incorrectly said member PDF uploads
  were unsupported after R1366 introduced the reviewed PDF document path.

The transformation is deliberately idempotent so deterministic qualification can
run repeatedly without manufacturing new bytes or false failures.
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
MEMBER_CURRENTNESS={
    ROOT/'dist/profile-studio/index.html':(
        'Promotional graphics and flyers use reviewed WebP images. PDF flyer/coupon uploads are not supported.',
        'Promotional images use the reviewed image workflow. Community Members may also submit reviewed PDF flyers/documents up to 4 MB and 20 pages; active, encrypted, embedded-file and form-like PDFs are rejected.'
    ),
    ROOT/'dist/membership-status/index.html':(
        'Promotional graphics use the reviewed image workflow. PDF uploads are not supported.',
        'Promotional images use the reviewed image workflow. Reviewed PDF flyers/documents up to 4 MB and 20 pages are supported; active, encrypted, embedded-file and form-like PDFs are rejected.'
    ),
}
OLD_ES='Encuentre su perfil público, use el planificador gratuito de crecimiento y previsualiza la experiencia de perfil ampliado para miembros mientras la inscripción permanece cerrada.'
NEW_ES='Encuentre su perfil público, revise la versión ampliada para miembros y decida si la Membresía Comunitaria opcional de $35/año le conviene. Reclamar el perfil, corregir hechos y solicitar el retiro siguen siendo gratuitos.'
ES_ROUTE_REPAIRS={
    'href="/community/">Explorar Comunidad':'href="/es/comunidad/">Explorar Comunidad',
    'href="/membership-start/">Membresía':'href="/es/iniciar-membresia/">Membresía',
    'href="/privacy/">Privacidad':'href="/es/privacidad/">Privacidad',
}

def set_release_marker(text:str,path:pathlib.Path)->str:
    text,n=re.subn(r'<meta content="FR-NAV[^\"]+" name="franklin-release"/>',f'<meta content="{RELEASE}" name="franklin-release"/>',text,count=1)
    if n!=1:
        raise SystemExit(f'Expected one release marker: {path}')
    return text

def patch_alias_contract(path:pathlib.Path)->None:
    payload=json.loads(path.read_text())
    aliases=payload.get('aliases') or {}
    holds=payload.get('reviewHeldProfileIds')
    if payload.get('community')!='FRANKLIN_TN' or len(aliases)!=100 or holds!=[]:
        raise SystemExit(f'Unexpected alias contract baseline: {path}')
    payload['suppressedGenericProfileIds']=[SUPPRESSED]
    path.write_text(json.dumps(payload,separators=(',',':'))+'\n')

def patch_home(path:pathlib.Path)->None:
    text=set_release_marker(path.read_text(),path)
    if path.parts[-2:] == ('es','index.html'):
        if OLD_ES in text:
            text=text.replace(OLD_ES,NEW_ES,1)
        elif NEW_ES not in text:
            raise SystemExit('Neither the expected stale nor corrected Spanish membership sentence is present')
        if OLD_ES in text:
            raise SystemExit('Stale Spanish membership sentence remains')
        for old,new in ES_ROUTE_REPAIRS.items():
            if old in text:
                text=text.replace(old,new,1)
            elif new not in text:
                raise SystemExit(f'Neither source nor corrected Spanish route is present: {old}')
    path.write_text(text)

def patch_member_currentness(path:pathlib.Path,old:str,new:str)->None:
    text=set_release_marker(path.read_text(),path)
    if old in text:
        text=text.replace(old,new,1)
    elif new not in text:
        raise SystemExit(f'Neither stale nor corrected member-PDF copy is present: {path}')
    if old in text:
        raise SystemExit(f'Stale member-PDF copy remains: {path}')
    path.write_text(text)

def main()->None:
    for path in ALIAS_FILES: patch_alias_contract(path)
    for path in HOME_FILES: patch_home(path)
    for path,(old,new) in MEMBER_CURRENTNESS.items(): patch_member_currentness(path,old,new)
    print(json.dumps({
        'result':'PASS',
        'release':RELEASE,
        'aliasCount':100,
        'reviewHoldCount':0,
        'suppressedGenericProfileIds':[SUPPRESSED],
        'desktopHeroBaseModified':False,
        'spanishHomepageMembershipCurrentness':'UPDATED',
        'spanishHomepageExistingRouteRepairs':sorted(ES_ROUTE_REPAIRS.values()),
        'memberPdfPublicCopyAligned':[str(p.relative_to(ROOT)) for p in MEMBER_CURRENTNESS],
        'idempotent':True
    },sort_keys=True))

if __name__=='__main__': main()
