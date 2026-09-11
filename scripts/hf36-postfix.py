#!/usr/bin/env python3
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'

# 1) Strong, explicit homepage-history contrast.  Do not infer surface color.
css=DIST/'assets/hf36.css'
s=css.read_text(encoding='utf-8')
s += r'''
/* HF3.6 qualification hardening: explicit Then & Now surface and directory mobile containment. */
body.hf36-home .r22-history.hf36-history,
body.hf36-home .r22-history.hf36-history .hf36-history-visible{background:#fff!important;color:#102126!important}
body.hf36-home .r22-history.hf36-history h2,
body.hf36-home .r22-history.hf36-history h3,
body.hf36-home .r22-history.hf36-history p,
body.hf36-home .r22-history.hf36-history figcaption{color:#102126!important}
body.hf36-home .r22-history.hf36-history .eyebrow{color:#00626c!important}
body.hf36-home .r22-history.hf36-history a{color:#005e67!important}
body.hf36-directory main{overflow-x:clip}
body.hf36-directory [data-franklin-discovery],
body.hf36-directory .r22-directory-toolbar,
body.hf36-directory .hf35-directory-advanced,
body.hf36-directory .r22-directory-grid,
body.hf36-directory .r22-profile-result,
body.hf36-directory .r22-directory-meta,
body.hf36-directory .r22-directory-pager{min-width:0!important;max-width:100%!important;width:100%}
body.hf36-directory input,body.hf36-directory select{min-width:0!important;max-width:100%!important;width:100%}
body.hf36-directory .hf36-result-actions{flex-wrap:wrap}
@media(max-width:620px){body.hf36-directory .r22-directory-toolbar{grid-template-columns:1fr!important}body.hf36-directory .hf35-directory-advanced .hf35-disclosure-body{grid-template-columns:1fr!important}body.hf36-directory .r22-directory-pager{gap:10px;flex-wrap:wrap}}
'''
css.write_text(s,encoding='utf-8')

# 2) Conservative address canonicalization used only for display-level duplicate suppression.
core=DIST/'assets/local-discovery-core.js'
s=core.read_text(encoding='utf-8')
anchor="""    const canonicalName = value => norm(value).replace(/\\bone\\b/g, '1').replace(/\\btwo\\b/g, '2').replace(/\\b(?:llc|inc|incorporated|corp|corporation|pc|pllc|ltd)\\b/g, '').replace(/\\s+/g, ' ').trim();\n    const deduped = [], seenIdentity = new Set();"""
replacement="""    const canonicalName = value => norm(value).replace(/\\bone\\b/g, '1').replace(/\\btwo\\b/g, '2').replace(/\\b(?:llc|inc|incorporated|corp|corporation|pc|pllc|ltd)\\b/g, '').replace(/\\s+/g, ' ').trim();\n    const canonicalAddress = value => norm(value)\n      .replace(/\\bnorth\\b/g, 'n').replace(/\\bsouth\\b/g, 's').replace(/\\beast\\b/g, 'e').replace(/\\bwest\\b/g, 'w')\n      .replace(/\\bavenue\\b/g, 'ave').replace(/\\bstreet\\b/g, 'st').replace(/\\broad\\b/g, 'rd').replace(/\\bboulevard\\b/g, 'blvd').replace(/\\bdrive\\b/g, 'dr').replace(/\\blane\\b/g, 'ln').replace(/\\bplace\\b/g, 'pl')\n      .replace(/\\bfranklin (?:tennessee|tn) \\d{5}(?: \\d{4})?\\b/g, '').replace(/\\bfranklin (?:tennessee|tn)\\b/g, '').replace(/\\btn \\d{5}(?: \\d{4})?\\b/g, '')\n      .replace(/\\s+/g, ' ').trim();\n    const deduped = [], seenIdentity = new Set();"""
if anchor not in s:
    raise SystemExit('canonicalName anchor missing')
s=s.replace(anchor,replacement,1)
s=s.replace("const address = norm(r.l);\n      const key = address ? address + '|' + canonicalName(r.n) : '';","const address = canonicalAddress(r.l);\n      const key = address ? address + '|' + canonicalName(r.n) : '';",1)
core.write_text(s,encoding='utf-8')

# 3) Make the global overflow menu label clearer and ensure directory cards have no duplicate More affordance.
for p in DIST.rglob('*.html'):
    text=p.read_text(encoding='utf-8')
    text=text.replace('<details class="hf34-nav-more"><summary>More</summary>','<details class="hf34-nav-more"><summary>Menu</summary>')
    text=text.replace('<details class="hf34-nav-more"><summary>Más</summary>','<details class="hf34-nav-more"><summary>Menú</summary>')
    p.write_text(text,encoding='utf-8')
print('HF3.6 postfix hardening complete')
