#!/usr/bin/env python3
from pathlib import Path
p=Path(__file__).with_name('hf34-build.py')
s=p.read_text(encoding='utf-8')
old="t[k.replace('_','-')]=v"
new="t['class' if k=='class_' else k.replace('_','-')]=v"
if old in s:
    p.write_text(s.replace(old,new),encoding='utf-8')
print('HF3.4 builder preflight complete')
