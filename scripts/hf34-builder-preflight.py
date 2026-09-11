#!/usr/bin/env python3
from pathlib import Path
p=Path(__file__).with_name('hf34-build.py')
s=p.read_text(encoding='utf-8')
s=s.replace("def mk_tag(soup,name,text=None,**attrs):\n    t=soup.new_tag(name)","def mk_tag(soup,tag_name,text=None,**attrs):\n    t=soup.new_tag(tag_name)")
s=s.replace("t[k.replace('_','-')]=v","t['class' if k=='class_' else k.replace('_','-')]=v")
p.write_text(s,encoding='utf-8')
print('HF3.4 builder preflight complete')
