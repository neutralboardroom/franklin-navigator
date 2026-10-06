#!/usr/bin/env python3
from pathlib import Path
import base64, io, tarfile

root = Path(__file__).resolve().parents[1]
parts = [root / f'.r1367/bundle.part{i}' for i in range(1, 6)]
bundle = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
raw = base64.b64decode(bundle)

with tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz') as tf:
    for member in tf.getmembers():
        if not member.isfile():
            continue
        target = (root / member.name).resolve()
        if root != target and root not in target.parents:
            raise SystemExit(f'unsafe bundle path: {member.name}')
        target.parent.mkdir(parents=True, exist_ok=True)
        src = tf.extractfile(member)
        if src is None:
            raise SystemExit(f'missing bundled file: {member.name}')
        target.write_bytes(src.read())

r23 = root / 'dist/assets/r23.js'
text = r23.read_text(encoding='utf-8')
loader = """

/* R1367 accepted currentness + public placeholder firewall */
(()=>{if(!document.querySelector('script[data-r1367-currentness]')){const s=document.createElement('script');s.src='/assets/r1367-currentness.js?v=frnav1367';s.dataset.r1367Currentness='true';document.head.append(s);}})();
"""
if 'r1367-currentness.js?v=frnav1367' not in text:
    r23.write_text(text.rstrip() + loader, encoding='utf-8')

print('R1367 bundle applied safely')
