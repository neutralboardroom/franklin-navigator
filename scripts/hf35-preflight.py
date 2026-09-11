#!/usr/bin/env python3
from pathlib import Path
p=Path(__file__).with_name('hf35-build.py')
s=p.read_text(encoding='utf-8')
s=s.replace("def tag(soup,name,text=None,**attrs):\n    t=soup.new_tag(name)","def tag(soup,tag_name,text=None,**attrs):\n    t=soup.new_tag(tag_name)")
s=s.replace("c=tag(soup,'article',class_='hf35-compare-card');c.append(tag(soup,'h3',title),tag(soup,'p',body));comp.append(c)","c=tag(soup,'article',class_='hf35-compare-card');c.append(tag(soup,'h3',title));c.append(tag(soup,'p',body));comp.append(c)")
s=s.replace("body.hf35 .hf35-my-franklin .r22-dashboard-card","body.hf35.hf35-my-franklin .r22-dashboard-card")
s=s.replace("for node in order: main.append(node.extract())","for node in reversed(order): main.insert(0,node.extract())")
s=s.replace("def correction_page(soup,es=False):\n    form=soup.select_one('[data-profile-control-form]')","def correction_page(soup,es=False):\n    if soup.body: soup.body['class']=list(set(soup.body.get('class',[])+['hf35-corrections']))\n    form=soup.select_one('[data-profile-control-form]')")
s=s.replace("    if how:\n        how['class']=list(set(how.get('class',[])+['hf35-business-how']))","    if free:\n        starter=free.select_one('a[href*=\"/member-starter-plan/\"]')\n        if starter: starter.decompose()\n    if how:\n        how['class']=list(set(how.get('class',[])+['hf35-business-how']))")
old="""                elif re.search(r'Related local profiles|Similar local profiles|Explore ',h,re.I):
                    card['class']=list(set(card.get('class',[])+['hf35-competitor-card']))
    # Replace old member runtime with HF3.5 integration."""
new="""                elif re.search(r'Related local profiles|Similar local profiles|Explore ',h,re.I):
                    card['class']=list(set(card.get('class',[])+['hf35-competitor-card']))
            comps=side.select('.hf35-competitor-card')
            if len(comps)>1:
                explore=next((c for c in comps if re.search(r'^Explore ',(c.find(['h2','h3']).get_text(' ',strip=True) if c.find(['h2','h3']) else ''),re.I)),None)
                related=next((c for c in comps if re.search(r'Related local profiles|Similar local profiles',(c.find(['h2','h3']).get_text(' ',strip=True) if c.find(['h2','h3']) else ''),re.I)),None)
                if explore and related:
                    link=explore.find('a',href=True)
                    if link:
                        link.string=tx(es,'Browse more in this category','Ver más en esta categoría')
                        link['class']=list(set(link.get('class',[])+['button']))
                        related.append(link.extract())
                    explore.decompose()
    # Replace old member runtime with HF3.5 integration."""
s=s.replace(old,new)
p.write_text(s,encoding='utf-8')
print('HF3.5 builder preflight complete')
