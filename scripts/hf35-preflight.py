#!/usr/bin/env python3
from pathlib import Path
p=Path(__file__).with_name('hf35-build.py')
s=p.read_text(encoding='utf-8')
s=s.replace("def tag(soup,name,text=None,**attrs):\n    t=soup.new_tag(name)","def tag(soup,tag_name,text=None,**attrs):\n    t=soup.new_tag(tag_name)")
s=s.replace("c=tag(soup,'article',class_='hf35-compare-card');c.append(tag(soup,'h3',title),tag(soup,'p',body));comp.append(c)","c=tag(soup,'article',class_='hf35-compare-card');c.append(tag(soup,'h3',title));c.append(tag(soup,'p',body));comp.append(c)")
s=s.replace("body.hf35 .hf35-my-franklin .r22-dashboard-card","body.hf35.hf35-my-franklin .r22-dashboard-card")
s=s.replace("for node in order: main.append(node.extract())","for node in reversed(order): main.insert(0,node.extract())")
s=s.replace("def correction_page(soup,es=False):\n    form=soup.select_one('[data-profile-control-form]')","def correction_page(soup,es=False):\n    if soup.body: soup.body['class']=list(set(soup.body.get('class',[])+['hf35-corrections']))\n    form=soup.select_one('[data-profile-control-form]')")
p.write_text(s,encoding='utf-8')
print('HF3.5 builder preflight complete')
