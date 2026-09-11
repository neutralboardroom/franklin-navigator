#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'

def save(path,soup): path.write_text(str(soup),encoding='utf-8')
def tag(soup,name,text=None,**attrs):
    t=soup.new_tag(name)
    for k,v in attrs.items(): t['class' if k=='class_' else k.replace('_','-')]=v
    if text is not None:t.string=text
    return t

def add_member_focus(plan,soup):
    if not plan:return
    ul=plan.find('ul')
    if not ul:
        ul=tag(soup,'ul',class_='check-list');plan.append(ul)
    text=plan.get_text(' ',strip=True)
    benefit='Active member profiles do not show Similar local profiles on their own profile page.'
    if benefit not in text:ul.append(tag(soup,'li',benefit))

def membership_pages():
    # Profile preview: make the member difference concrete before purchase.
    p=DIST/'member-profile-preview/index.html'
    if p.exists():
        s=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
        plan=s.select_one('.r29-plan')
        add_member_focus(plan,s)
        if plan and not plan.select_one('.hf34-member-difference'):
            box=tag(s,'div',class_='hf34-member-difference')
            box.append(tag(s,'h3','What changes on a member profile'))
            ul=tag(s,'ul',class_='check-list')
            for x in ['Richer About, services and business details','Qualified photos, official online links and action links','No Similar local profiles section on your active member profile','Ordinary Directory ranking and factual accuracy do not change']:
                ul.append(tag(s,'li',x))
            box.append(ul);plan.insert_before(box)
        save(p,s)
    # Membership decision page: same concrete benefit next to price; simplify jargon.
    p=DIST/'membership-start/index.html'
    if p.exists():
        s=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
        add_member_focus(s.select_one('.r29-plan'),s)
        for para in s.find_all('p'):
            t=para.get_text(' ',strip=True)
            if 'unrestricted raw contact exports' in t:
                para.string='Use practical English, Spanish or bilingual tools to plan local outreach and community participation.'
        save(p,s)

def simplify_home():
    for rel in ('index.html','es/index.html'):
        p=DIST/rel
        if not p.exists():continue
        s=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
        # The route-card block duplicates global navigation and adds an entire extra screen.
        dest=s.select_one('.r24-destinations')
        if dest:dest.decompose()
        # Keep the valuable activity routes, but let residents open them when needed.
        sec=None
        for candidate in s.select('main > section.section'):
            if candidate.select_one('a[href*="/sports/"]') and candidate.select_one('a[href*="/outdoors/"]') and candidate.select_one('a[href*="/youth-family/"]'):
                sec=candidate;break
        if sec and not sec.select_one('details.hf34-home-more'):
            wrap=sec.select_one(':scope > .wrap') or sec
            children=list(wrap.children)
            d=tag(s,'details',class_='hf34-disclosure hf34-home-more')
            d.append(tag(s,'summary','Explore activities, sports, learning and clubs' if rel=='index.html' else 'Explorar actividades, deportes, aprendizaje y clubes'))
            body=tag(s,'div',class_='hf34-disclosure-body')
            for c in children:
                try: body.append(c.extract())
                except: pass
            d.append(body);wrap.append(d)
        save(p,s)

def simplify_my_franklin():
    for rel in ('my-franklin/index.html','es/mi-franklin/index.html'):
        p=DIST/rel
        if not p.exists():continue
        s=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
        if s.body:
            classes=list(s.body.get('class',[]))
            if 'hf34-my-franklin' not in classes:classes.append('hf34-my-franklin')
            s.body['class']=classes
        grid=s.select_one('.r22-dashboard-grid');main=s.select_one('.r22-dashboard-main');side=s.select_one('.r22-dashboard-side')
        if grid and main and side:
            pref=side.select_one('details.r22-dashboard-card')
            if pref:pref.attrs.pop('open',None)
            tools=tag(s,'div',class_='hf34-my-tools')
            for child in list(side.children):
                try: tools.append(child.extract())
                except: pass
            main.insert(0,tools);side.decompose()
        save(p,s)

def patch_member_runtime():
    p=DIST/'assets/hf34-member-public.js'
    if not p.exists():return
    js=p.read_text(encoding='utf-8')
    old="function related(){return [...document.querySelectorAll('.r22-profile-side .r22-card')].find(x=>/Related local profiles|Similar local profiles/i.test(x.querySelector('h2')?.textContent||''))}"
    new="function competitorCards(){return [...document.querySelectorAll('.r22-profile-side .r22-card')].filter(x=>/Related local profiles|Similar local profiles|Explore /i.test(x.querySelector('h2')?.textContent||''))}"
    js=js.replace(old,new).replace("if(out.activePaidMember===true){related()?.remove();document.body.dataset.activeMember='true'}","if(out.activePaidMember===true){competitorCards().forEach(x=>x.remove());document.body.dataset.activeMember='true'}")
    p.write_text(js,encoding='utf-8')

def css_append():
    p=DIST/'assets/hf34.css'
    if not p.exists():return
    css=p.read_text(encoding='utf-8')
    extra=r'''
/* HF3.4 high-traffic finishing pass */
body.hf34 .empty-state{min-height:0!important;padding:12px 14px!important;margin-block:10px!important}
body.hf34 .hf34-member-difference{border:1px solid var(--hf34-line);border-radius:12px;background:var(--hf34-soft);padding:16px;margin:14px 0 18px}
body.hf34 .hf34-member-difference h3{margin-top:0}
body.hf34 .hf34-home-more{margin-block:0}
body.hf34 .hf34-home-more>.hf34-disclosure-body{padding-top:8px}
body.hf34-my-franklin .r22-dashboard-grid{grid-template-columns:1fr!important;gap:14px!important}
body.hf34-my-franklin .r22-dashboard-main{display:grid;gap:14px}
body.hf34-my-franklin .hf34-my-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
body.hf34-my-franklin .r22-dashboard-card{padding:18px!important}
body.hf34-profile .hf34-profile-image{width:100%;height:100%;object-fit:cover;border-radius:16px}
body.hf34-profile .r22-profile-side{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))!important}
@media(max-width:760px){body.hf34-my-franklin .hf34-my-tools{grid-template-columns:1fr}}
'''
    if 'HF3.4 high-traffic finishing pass' not in css:p.write_text(css+extra,encoding='utf-8')

def main():
    membership_pages();simplify_home();simplify_my_franklin();patch_member_runtime();css_append();print('HF3.4 post-build simplification complete')
if __name__=='__main__':main()
