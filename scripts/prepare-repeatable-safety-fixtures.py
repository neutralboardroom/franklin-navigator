#!/usr/bin/env python3
"""Repair only synthetic fixture identity reuse; never alter production data."""
from pathlib import Path
import hashlib
p=Path(__file__).resolve().parents[1]/'test/purchase-reservations.integration.cjs'
s=p.read_text()
if 'const fixtureIdentity=' in s:
    print('Per-execution synthetic identities already present')
    raise SystemExit(0)
assert hashlib.sha256(p.read_bytes()).hexdigest()=='9d59390ee0169b8f828aab3dd517808c6266980c58ace5c816990e6b36b25cc4', 'Test source changed; review before applying'
anchor="const id=p=>p+'_'+crypto.randomUUID().replaceAll('-','');"
assert s.count(anchor)==1
s=s.replace(anchor,anchor+"\nconst fixtureIdentity={event:id('evt_SYNTHETIC_ACCEPTANCE'),cancel:id('evt_SYNTHETIC_CANCEL'),customer:id('cus_SYNTHETIC'),subscription:id('sub_SYNTHETIC'),profile:id('FR-ORG-SYNTHETIC')};",1)
for old,new in {
    "'evt_SYNTHETIC_ACCEPTANCE_ONLY'":'fixtureIdentity.event',
    "'evt_SYNTHETIC_CANCEL_ONLY'":'fixtureIdentity.cancel',
    "'cus_SYNTHETIC_ACCEPTANCE'":'fixtureIdentity.customer',
    "'sub_SYNTHETIC_ACCEPTANCE'":'fixtureIdentity.subscription',
    "'FR-ORG-SYNTHETIC-NEWCUSTOMER'":'fixtureIdentity.profile',
}.items():
    assert old in s, old
    s=s.replace(old,new)
p.write_text(s)
print('Synthetic identities isolated per execution; replay assertions unchanged')
