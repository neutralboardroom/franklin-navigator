#!/usr/bin/env python3
from pathlib import Path
p=Path(__file__).with_name('hf34-build.py')
s=p.read_text(encoding='utf-8')
s=s.replace("def mk_tag(soup,name,text=None,**attrs):\n    t=soup.new_tag(name)","def mk_tag(soup,tag_name,text=None,**attrs):\n    t=soup.new_tag(tag_name)")
s=s.replace("t[k.replace('_','-')]=v","t['class' if k=='class_' else k.replace('_','-')]=v")
p.write_text(s,encoding='utf-8')
# R37's translation core is still required, but its legacy UI-loader tail injects
# HF2.7/HF2.9/HF3.1 presentation runtimes that rewrite the audited static nav,
# hide profile contacts, and re-run old page-density logic after first paint.
# HF3.4 owns those presentation contracts at build time, so preserve i18n and
# remove only the legacy presentation-loader tail.
i18n=Path(__file__).resolve().parents[1]/'dist/assets/r37-i18n.js'
if i18n.exists():
    txt=i18n.read_text(encoding='utf-8')
    marker='/* HF2.7 shared navigation and next-action hierarchy loader. */'
    if marker in txt:
        i18n.write_text(txt.split(marker,1)[0].rstrip()+"\n",encoding='utf-8')
print('HF3.4 builder preflight complete')
