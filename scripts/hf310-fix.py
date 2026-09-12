#!/usr/bin/env python3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
# JS fallback correction.
p=root/'dist/assets/hf310.js'
s=p.read_text(encoding='utf-8')
old="const hit=guideMap.find(([rx])=>rx.test(text))||[[''],['Professional services','/navigator-growth-desk/professional-services/']][1];const label=Array.isArray(hit)?hit[1][0]:hit[0];const href=Array.isArray(hit)?hit[1][1]:'/navigator-growth-desk/professional-services/';"
new="const hit=guideMap.find(([rx])=>rx.test(text));const label=hit?hit[1][0]:'Professional services';const href=hit?hit[1][1]:'/navigator-growth-desk/professional-services/';"
if old in s:s=s.replace(old,new)
p.write_text(s,encoding='utf-8')
# Public editor label should be concise and match the owner-approved wording.
h=root/'dist/member-profile-preview/index.html'
t=h.read_text(encoding='utf-8').replace('Add photos / gallery','Photos / gallery')
h.write_text(t,encoding='utf-8')
print('HF3.10 post-build safety fixes applied')
