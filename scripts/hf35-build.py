#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
import json, re

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
RELEASE='FR-NAV1.24.0-HF3.5'
CSS='/assets/hf35.css?v=frnav1240'
MEMBER_JS='/assets/hf35-member-public.js?v=frnav1240'
CONTROL_JS='/assets/hf35-profile-control.js?v=frnav1240'


def tx(es,en_text,es_text): return es_text if es else en_text

def route_for(path):
    rel=path.relative_to(DIST).as_posix()
    if rel=='index.html': return '/'
    if rel.endswith('/index.html'): return '/'+rel[:-10]
    return '/'+rel

def tag(soup,name,text=None,**attrs):
    t=soup.new_tag(name)
    for k,v in attrs.items():
        if v is None: continue
        t['class' if k=='class_' else k.replace('_','-')]=v
    if text is not None:t.string=text
    return t

def set_release(soup):
    head=soup.head
    if not head:return
    m=head.select_one('meta[name="franklin-release"]')
    if not m:
        m=tag(soup,'meta',name='franklin-release');head.append(m)
    m['content']=RELEASE
    if not head.select_one('link[href^="/assets/hf35.css"]'):
        head.append(tag(soup,'link',rel='stylesheet',href=CSS))
    if soup.body:
        classes=list(soup.body.get('class',[]))
        if 'hf35' not in classes:classes.append('hf35')
        soup.body['class']=classes

def details_wrap(soup,summary_text,nodes,cls='hf35-disclosure'):
    d=tag(soup,'details',class_=cls)
    d.append(tag(soup,'summary',summary_text))
    body=tag(soup,'div',class_='hf35-disclosure-body')
    for node in nodes:
        try: body.append(node.extract())
        except: pass
    d.append(body)
    return d

def simplify_home(soup,es=False):
    if not soup.body:return
    # Keep the homepage useful, but compress the connected-help bridge and lower discovery content.
    bridge=soup.select_one('.r30-home-bridge')
    if bridge:
        bridge['class']=list(set(bridge.get('class',[])+['hf35-home-bridge']))
        actions=bridge.select_one('.r30-actions')
        if actions:
            links=actions.find_all('a',recursive=False)
            for x in links[2:]: x.decompose()
    # Collapse the activities area if it is not already collapsed.
    for sec in soup.select('main > section.section'):
        if sec.select_one('a[href*="/youth-family/"]') and sec.select_one('a[href*="/sports/"]') and not sec.select_one('details'):
            wrap=sec.select_one(':scope > .wrap') or sec
            nodes=[n for n in list(wrap.children) if not isinstance(n,NavigableString) or n.strip()]
            wrap.clear();wrap.append(details_wrap(soup,tx(es,'Explore activities, sports, learning and clubs','Explorar actividades, deportes, aprendizaje y clubes'),nodes,'hf35-disclosure hf35-home-more'))
            break
    # Put the history gallery behind one explicit disclosure.
    hist=soup.select_one('.r22-history')
    if hist and not hist.select_one('details.hf35-history-more'):
        wrap=hist.select_one(':scope > .wrap') or hist
        nodes=[n for n in list(wrap.children) if not isinstance(n,NavigableString) or n.strip()]
        wrap.clear();wrap.append(details_wrap(soup,tx(es,'Franklin through time','Franklin a través del tiempo'),nodes,'hf35-disclosure hf35-history-more'))

def simplify_business(soup,es=False):
    main=soup.select_one('main');
    if not main:return
    kids=[x for x in main.find_all(recursive=False) if getattr(x,'name',None)]
    hero=kids[0] if kids else None
    membership=next((s for s in kids if s.select_one('.r29-plan')),None)
    benefit=next((s for s in kids if len(s.select('.r29-panel'))>=3),None)
    free=next((s for s in kids if 'Membership remains optional' in s.get_text(' ',strip=True) or 'La membresía' in s.get_text(' ',strip=True)),None)
    how=next((s for s in kids if s.select_one('ol.r28-steps')),None)
    if membership:
        plan=membership.select_one('.r29-plan')
        if plan and not plan.select_one('.hf35-member-focus'):
            box=tag(soup,'div',class_='hf35-member-focus')
            box.append(tag(soup,'h3',tx(es,'Keep the focus on your business','Mantenga el enfoque en su negocio')))
            box.append(tag(soup,'p',tx(es,
                'Active Community Member profiles do not show the Similar local profiles section on their own profile page.',
                'Los perfiles de Miembros Comunitarios activos no muestran la sección de perfiles locales similares en su propia página.')))
            box.append(tag(soup,'p',tx(es,
                'Membership does not change ordinary Directory ranking, factual accuracy, credentials or public safety information.',
                'La membresía no cambia la clasificación normal del Directorio, la exactitud factual, las credenciales ni la información pública de seguridad.'),class_='fine-print'))
            plan.append(box)
        if not membership.select_one('.hf35-profile-comparison'):
            comp=tag(soup,'div',class_='hf35-profile-comparison')
            for title,items in [
                (tx(es,'Free public profile','Perfil público gratuito'),[
                    tx(es,'Core public facts and verified public contact links','Datos públicos básicos y enlaces de contacto públicos verificados'),
                    tx(es,'Free factual corrections and removal requests','Correcciones factuales y solicitudes de retiro gratuitas'),
                    tx(es,'Similar local profiles may appear','Pueden aparecer perfiles locales similares')]),
                (tx(es,'Community Member profile','Perfil de Miembro Comunitario'),[
                    tx(es,'Richer About, services, images and qualified action links','Información, servicios, imágenes y enlaces de acción más completos'),
                    tx(es,'More space for your own business information','Más espacio para la información de su propio negocio'),
                    tx(es,'No Similar local profiles section while membership is active','Sin sección de perfiles locales similares mientras la membresía esté activa')])]:
                card=tag(soup,'article',class_='hf35-compare-card');card.append(tag(soup,'h3',title));ul=tag(soup,'ul',class_='check-list')
                for item in items:ul.append(tag(soup,'li',item))
                card.append(ul);comp.append(card)
            wrap=membership.select_one('.wrap') or membership
            wrap.insert(0,comp)
    if benefit and not benefit.select_one('details.hf35-business-benefits'):
        wrap=benefit.select_one(':scope > .wrap') or benefit
        nodes=[n for n in list(wrap.children) if not isinstance(n,NavigableString) or n.strip()]
        wrap.clear();wrap.append(details_wrap(soup,tx(es,'What Community Membership adds','Qué añade la Membresía Comunitaria'),nodes,'hf35-disclosure hf35-business-benefits'))
    if how:
        how['class']=list(set(how.get('class',[])+['hf35-business-how']))
    # Reorder: hero -> concrete member difference -> free tools -> optional details.
    order=[x for x in [hero,membership,free,benefit,how] if x]
    for node in order: main.append(node.extract())

def simplify_help(soup,es=False):
    hero=soup.select_one('.help-hero')
    if hero:
        actions=hero.select_one('.actions')
        if actions:
            links=actions.find_all('a',recursive=False)
            urgent=next((a for a in links if '#urgent-help' in (a.get('href') or '')),None)
            planner=next((a for a in links if '#make-a-plan' in (a.get('href') or '')),None)
            for a in links:a.extract()
            if urgent:
                urgent['class']=['button','primary'];actions.append(urgent)
            if planner:
                planner['class']=['button'];actions.append(planner)
    planner=soup.select_one('[data-community-help-planner]')
    if planner:
        for p in planner.select('p.fine-print'):
            if 'server submission' in p.get_text(' ',strip=True).lower() or 'external ai' in p.get_text(' ',strip=True).lower():
                p.string=tx(es,'Your choices stay on this page. Franklin Navigator does not send or save this plan.','Sus elecciones permanecen en esta página. Franklin Navigator no envía ni guarda este plan.')
    # Collapse the six-card toolbox to keep urgent help and the planner as the main path.
    toolsec=None
    for sec in soup.select('main > section.section'):
        if sec.select_one('.help-tool-grid'):
            toolsec=sec;break
    if toolsec and not toolsec.select_one('details.hf35-help-tools'):
        wrap=toolsec.select_one(':scope > .wrap') or toolsec
        nodes=[n for n in list(wrap.children) if not isinstance(n,NavigableString) or n.strip()]
        wrap.clear();wrap.append(details_wrap(soup,tx(es,'More free planning tools','Más herramientas gratuitas de planificación'),nodes,'hf35-disclosure hf35-help-tools'))

def simplify_directory(soup,es=False):
    root=soup.select_one('[data-franklin-discovery]')
    if not root or root.select_one('details.hf35-directory-advanced'):return
    toolbar=root.select_one('.r22-directory-toolbar')
    if toolbar:
        labels=toolbar.find_all('label',recursive=False)
        extra=[]
        for lab in labels[2:]: extra.append(lab.extract())
        fact=root.select_one('.r22-fact-filters')
        share=root.select_one('.discovery-share')
        if fact:extra.append(fact.extract())
        if share:extra.append(share.extract())
        if extra:
            d=details_wrap(soup,tx(es,'Advanced filters and sharing','Filtros avanzados y opciones para compartir'),extra,'hf35-disclosure hf35-directory-advanced')
            toolbar.insert_after(d)

def simplify_my_franklin(soup,es=False):
    if soup.body:
        soup.body['class']=list(set(soup.body.get('class',[])+['hf35-my-franklin']))
    pref=soup.select_one('[data-my-franklin] details.r22-dashboard-card')
    if pref:pref.attrs.pop('open',None)
    # Make address-specific tools optional instead of a permanent block.
    cards=soup.select('.r22-dashboard-card')
    address=next((c for c in cards if re.search(r'Address-specific|direcci[oó]n',c.get_text(' ',strip=True),re.I)),None)
    if address and address.name!='details' and not address.get('data-hf35-address'):
        d=tag(soup,'details',class_='r22-dashboard-card hf35-address-tools',data_hf35_address='1')
        d.append(tag(soup,'summary',tx(es,'Address-specific lookups','Consultas según la dirección')))
        body=tag(soup,'div',class_='hf35-disclosure-body')
        for child in list(address.children):
            try:body.append(child.extract())
            except:pass
        d.append(body);address.replace_with(d)

def simplify_learning(soup,es=False):
    repl={
        'Built for useful first value': tx(es,'How this works','Cómo funciona'),
        'No new account or education add-on.': tx(es,'No extra account is required.','No se requiere una cuenta adicional.'),
        'Who the first Franklin pilot serves': tx(es,'Who the Learning Hub serves','A quién sirve el Centro de Aprendizaje'),
        'The first release deliberately excludes direct minor accounts, persistent minor profiles or chat history, school-system integrations and automated high-impact decisions.': tx(es,
            'Franklin Navigator does not provide direct minor accounts, persistent minor profiles, school-system integrations or automated high-impact decisions.',
            'Franklin Navigator no ofrece cuentas directas para menores, perfiles persistentes de menores, integraciones con sistemas escolares ni decisiones automatizadas de alto impacto.'),
        'The initial Learning Hub uses Franklin’s existing free path and current Community Membership choices. Learning providers can prepare a profile, review Growth Desk guidance and evaluate membership without a separate education payment system.': tx(es,
            'The Learning Hub uses Franklin’s existing free path and Community Membership. Learning providers can prepare a profile, review Growth Desk guidance and evaluate membership without a separate education fee.',
            'El Centro de Aprendizaje usa la ruta gratuita existente de Franklin y la Membresía Comunitaria. Los proveedores educativos pueden preparar un perfil, revisar la orientación de Growth Desk y evaluar la membresía sin una tarifa educativa separada.')
    }
    for el in soup.find_all(string=True):
        raw=str(el);norm=' '.join(raw.split())
        if norm in repl:el.replace_with(raw.replace(raw.strip(),repl[norm]))

def correction_page(soup,es=False):
    form=soup.select_one('[data-profile-control-form]')
    if not form:return
    old=None
    for lab in form.find_all('label',recursive=False):
        if lab.select_one('textarea[name="details"]'):old=lab;break
    if old:
        corr1=tag(soup,'label',data_correction_only='1');corr1.append(NavigableString(tx(es,'What information is wrong?','¿Qué información es incorrecta?')));corr1.append(tag(soup,'textarea',name='currentInfo',rows='3',required=''))
        corr2=tag(soup,'label',data_correction_only='1');corr2.append(NavigableString(tx(es,'What should it say instead?','¿Qué debería decir en su lugar?')));corr2.append(tag(soup,'textarea',name='correctInfo',rows='3',required=''))
        evidence=tag(soup,'label',data_correction_only='1');evidence.append(NavigableString(tx(es,'Official source or evidence link (optional)','Enlace a fuente oficial o evidencia (opcional)')));evidence.append(tag(soup,'input',name='evidenceUrl',type='url',placeholder='https://'))
        removal=tag(soup,'label',data_removal_only='');removal.append(NavigableString(tx(es,'Reason for the removal request (optional)','Motivo de la solicitud de retiro (opcional)')));removal.append(tag(soup,'textarea',name='removalReason',rows='3'))
        old.insert_before(corr1);old.insert_before(corr2);old.insert_before(evidence);old.insert_before(removal);old.decompose()
    # Replace runtime with the release-specific controller.
    for sc in soup.find_all('script',src=True):
        if sc.get('src')=='/assets/profile-control.js' or 'hf35-profile-control.js' in sc.get('src',''):sc.decompose()
    soup.body.append(tag(soup,'script',defer='',src=CONTROL_JS))

def profile_page(soup,route,es=False):
    if soup.body:
        soup.body['class']=list(set(soup.body.get('class',[])+['hf35-profile']))
    hero=soup.select_one('.r22-profile-hero')
    actions=soup.select_one('.profile-primary-actions')
    if actions and not actions.previous_sibling:
        pass
    if actions and not soup.select_one('.hf35-contact-label'):
        actions.insert_before(tag(soup,'div',tx(es,'Contact & actions','Contacto y acciones'),class_='hf35-contact-label'))
        links=actions.find_all('a',recursive=False)
        for a in links[1:]:
            classes=[c for c in a.get('class',[]) if c!='primary'];a['class']=classes or ['button']
    layout=soup.select_one('.r22-profile-layout')
    if layout:
        article=layout.find('article',recursive=False)
        side=layout.find('aside',recursive=False)
        if article:
            sections=article.find_all('section',recursive=False)
            for sec in sections:
                text=sec.get_text(' ',strip=True)
                if text.startswith('About ') or text.startswith('Sobre '):sec['id']='about'
                elif 'Services & details' in text or 'Servicios' in text:sec['id']='details'
                elif sec.get('id')=='sources':pass
                elif 'Manage this profile' in text or 'Administrar' in text:sec['id']='manage'
            manage=article.select_one('#manage')
            if manage:
                act=manage.select_one('.actions')
                if act and not manage.select_one('details.hf35-admin-more'):
                    links=act.find_all('a',recursive=False)
                    claim=next((a for a in links if '/claim-profile/' in (a.get('href') or '')),None)
                    member=next((a for a in links if '/profile-studio/' in (a.get('href') or '') or '/member-profile-preview/' in (a.get('href') or '')),None)
                    correction=next((a for a in links if '/corrections/' in (a.get('href') or '') and 'PUBLIC_REMOVAL' not in (a.get('href') or '')),None)
                    removal=next((a for a in links if 'PUBLIC_REMOVAL' in (a.get('href') or '')),None)
                    act.clear()
                    for a in [claim,member]:
                        if a:act.append(a)
                    extras=[x for x in [correction,removal] if x]
                    if extras:act.append(details_wrap(soup,tx(es,'Correction or removal','Corrección o retiro'),extras,'hf35-disclosure hf35-admin-more'))
        if side:
            for card in side.find_all('section',recursive=False):
                h=(card.find(['h2','h3']).get_text(' ',strip=True) if card.find(['h2','h3']) else '')
                if re.search(r'About this listing|Acerca de este listado',h,re.I):card.decompose()
                elif re.search(r'Related local profiles|Similar local profiles|Explore ',h,re.I):
                    card['class']=list(set(card.get('class',[])+['hf35-competitor-card']))
    # Replace old member runtime with HF3.5 integration.
    for sc in soup.find_all('script',src=True):
        if 'hf34-member-public.js' in sc.get('src','') or 'hf35-member-public.js' in sc.get('src',''):sc.decompose()
    soup.body.append(tag(soup,'script',defer='',src=MEMBER_JS))

def member_preview(soup,es=False):
    main=soup.select_one('main');
    if not main:return
    if not soup.select_one('.hf35-member-preview-comparison'):
        hero=soup.select_one('main > section')
        sec=tag(soup,'section',class_='section tint hf35-member-preview-comparison');wrap=tag(soup,'div',class_='wrap')
        wrap.append(tag(soup,'div',tx(es,'See the difference before you pay','Vea la diferencia antes de pagar'),class_='eyebrow'))
        wrap.append(tag(soup,'h2',tx(es,'A member profile becomes a fuller local presence.','Un perfil de miembro se convierte en una presencia local más completa.')))
        comp=tag(soup,'div',class_='hf35-profile-comparison')
        for title,body in [
            (tx(es,'Free public profile','Perfil público gratuito'),tx(es,'Core public facts, verified public contact links, free corrections and removal. Similar local profiles may appear.','Datos públicos básicos, enlaces de contacto verificados, correcciones y retiro gratuitos. Pueden aparecer perfiles locales similares.')),
            (tx(es,'Community Member profile','Perfil de Miembro Comunitario'),tx(es,'Richer About, services, images and verified action links. No Similar local profiles section while membership is active.','Información, servicios, imágenes y enlaces de acción verificados más completos. Sin perfiles locales similares mientras la membresía esté activa.'))]:
            c=tag(soup,'article',class_='hf35-compare-card');c.append(tag(soup,'h3',title),tag(soup,'p',body));comp.append(c)
        wrap.append(comp);sec.append(wrap)
        if hero:hero.insert_after(sec)
    form=soup.select_one('[data-r28-preview-form]')
    if form and not form.find_parent('details'):
        d=tag(soup,'details',class_='hf35-disclosure hf35-preview-builder');d.append(tag(soup,'summary',tx(es,'Build a sample member profile preview','Crear una vista previa de perfil de miembro')))
        body=tag(soup,'div',class_='hf35-disclosure-body');form.replace_with(d);body.append(form);d.append(body)

def membership_start(soup,es=False):
    plan=soup.select_one('.r29-plan')
    if plan and not plan.select_one('.hf35-member-focus'):
        box=tag(soup,'div',class_='hf35-member-focus')
        box.append(tag(soup,'h3',tx(es,'Member profile benefit','Beneficio del perfil de miembro')))
        box.append(tag(soup,'p',tx(es,'Active member profiles do not show the Similar local profiles section on their own profile page.','Los perfiles de miembros activos no muestran la sección de perfiles locales similares en su propia página.')))
        plan.append(box)

def main():
    pages=profiles=0
    for p in DIST.rglob('*.html'):
        pages+=1
        raw=p.read_text(encoding='utf-8',errors='replace')
        soup=BeautifulSoup(raw,'html.parser')
        route=route_for(p);es=route.startswith('/es/') or (soup.html and soup.html.get('lang')=='es')
        set_release(soup)
        if route in ('/','/es/'):simplify_home(soup,es)
        if route in ('/business-dashboard/','/es/negocios/'):simplify_business(soup,es)
        if route in ('/community-help-center/','/es/centro-de-ayuda/'):simplify_help(soup,es)
        if route in ('/directory/','/es/directorio/'):simplify_directory(soup,es)
        if route in ('/my-franklin/','/es/mi-franklin/'):simplify_my_franklin(soup,es)
        if route in ('/learning/','/es/aprendizaje/'):simplify_learning(soup,es)
        if route=='/corrections/':correction_page(soup,es)
        if route in ('/member-profile-preview/','/es/vista-previa-de-perfil/'):member_preview(soup,es)
        if route in ('/membership-start/','/es/iniciar-membresia/'):membership_start(soup,es)
        if route.startswith('/profiles/'):
            profiles+=1;profile_page(soup,route,es)
        p.write_text(str(soup),encoding='utf-8')
    write_assets()
    update_release_metadata(pages,profiles)
    print(json.dumps({'release':RELEASE,'pages':pages,'profiles':profiles},indent=2))

def write_assets():
    css=r'''/* FR-NAV1.24.0 HF3.5 — finishing and simplification */
:root{--hf35-ink:#142c32;--hf35-muted:#52676b;--hf35-line:#d9e3e4;--hf35-soft:#f5f9f8;--hf35-accent:#006c72}
body.hf35 main>.section{scroll-margin-top:82px}
body.hf35 .hf35-disclosure{border:1px solid var(--hf35-line);border-radius:14px;background:#fff;overflow:hidden}
body.hf35 .hf35-disclosure>summary{cursor:pointer;list-style:none;font-weight:750;color:var(--hf35-ink);padding:15px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}
body.hf35 .hf35-disclosure>summary::-webkit-details-marker{display:none}
body.hf35 .hf35-disclosure>summary::after{content:'›';font-size:1.35rem;transform:rotate(90deg);transition:transform .15s ease}
body.hf35 .hf35-disclosure[open]>summary::after{transform:rotate(-90deg)}
body.hf35 .hf35-disclosure-body{padding:0 18px 18px}
body.hf35 .hf35-home-bridge{margin:0;background:#f4f8f7}
body.hf35 .hf35-home-bridge .wrap{padding-block:18px}
body.hf35 .hf35-home-more,body.hf35 .hf35-history-more{background:transparent}
body.hf35 .hf35-profile-comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:0 0 18px}
body.hf35 .hf35-compare-card{border:1px solid var(--hf35-line);border-radius:14px;background:#fff;padding:18px}
body.hf35 .hf35-compare-card h3{margin-top:0}
body.hf35 .hf35-member-focus{margin-top:16px;padding:14px 16px;border-radius:12px;background:#eef8f7;border:1px solid #c8e4e1}
body.hf35 .hf35-member-focus h3{margin:0 0 6px}
body.hf35 .hf35-business-benefits{background:transparent}
body.hf35 .hf35-help-tools{background:transparent}
body.hf35 .hf35-directory-advanced{margin:10px 0 16px}
body.hf35 .hf35-directory-advanced .hf35-disclosure-body{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}
body.hf35 .hf35-directory-advanced .r22-fact-filters,body.hf35 .hf35-directory-advanced .discovery-share{grid-column:1/-1}
body.hf35 .hf35-my-franklin .r22-dashboard-card{padding:16px!important}
body.hf35 .hf35-address-tools>summary{font-weight:750;cursor:pointer}
body.hf35-corrections .p0-control-wrap{max-width:860px}
body.hf35-corrections .p0-control-form{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
body.hf35-corrections .p0-control-form label:has(textarea),body.hf35-corrections .p0-control-form .p0-check,body.hf35-corrections .p0-control-form button,body.hf35-corrections .p0-control-form p{grid-column:1/-1}
body.hf35-profile .r22-profile-hero{background:linear-gradient(180deg,#fff,#f7faf9)}
body.hf35-profile .r22-profile-hero-grid{grid-template-columns:88px minmax(0,1fr) minmax(220px,290px)!important;gap:22px!important;align-items:start}
body.hf35-profile .profile-avatar.large{width:88px!important;height:88px!important;min-width:88px!important;font-size:1.35rem!important;border-radius:18px!important}
body.hf35-profile .profile-avatar img{width:100%;height:100%;object-fit:cover;border-radius:18px}
body.hf35-profile .hf35-contact-label{font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--hf35-muted);margin:16px 0 7px}
body.hf35-profile .profile-primary-actions{display:flex;flex-wrap:wrap;gap:9px}
body.hf35-profile .profile-utility-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;font-size:.92rem}
body.hf35-profile .profile-currentness{border:1px solid var(--hf35-line);border-radius:14px;background:#fff;padding:14px 16px;display:grid;gap:6px}
body.hf35-profile .r22-profile-layout{display:block!important;max-width:980px;margin-inline:auto}
body.hf35-profile .r22-profile-layout>article>section{border-bottom:1px solid var(--hf35-line);padding:22px 0}
body.hf35-profile .profile-facts-grid{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))!important;gap:10px!important}
body.hf35-profile .r22-profile-side{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))!important;gap:12px!important;margin-top:18px}
body.hf35-profile .r22-profile-side .r22-card{margin:0!important}
body.hf35-profile .hf35-admin-more{margin-top:8px;max-width:520px}
body.hf35-profile .hf35-admin-more .hf35-disclosure-body{display:flex;gap:10px;flex-wrap:wrap}
body.hf35-profile .hf35-member-badge{display:inline-flex;align-items:center;border-radius:999px;background:#e4f5f2;border:1px solid #abd9d2;color:#164e4d;font-weight:800;font-size:.8rem;padding:5px 9px;margin:0 0 7px}
body.hf35-profile .hf35-profile-section-nav{position:sticky;top:0;z-index:8;background:rgba(255,255,255,.96);border-block:1px solid var(--hf35-line);display:flex;gap:8px;overflow-x:auto;padding:9px max(16px,calc((100vw - 980px)/2));white-space:nowrap}
body.hf35-profile .hf35-profile-section-nav a{font-size:.9rem;text-decoration:none;padding:7px 10px;border-radius:999px;background:var(--hf35-soft);color:var(--hf35-ink)}
body.hf35-profile .hf35-member-module{padding:20px 0;border-bottom:1px solid var(--hf35-line)}
body.hf35-profile .hf35-member-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
body.hf35-profile .hf35-member-grid>.card{padding:14px}
body.hf35-profile .hf35-member-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
body.hf35-profile .hf35-member-gallery img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px}
body.hf35-profile .hf35-online{display:flex;flex-wrap:wrap;gap:9px}
body.hf35-profile[data-active-member="true"] .hf35-competitor-card{display:none!important}
body.hf35 .hf35-preview-builder{margin-top:0}
body.hf35 .learning-boundary .card,body.hf35 .learning-boundary .card h1,body.hf35 .learning-boundary .card h2,body.hf35 .learning-boundary .card h3,body.hf35 .learning-boundary .card p,body.hf35 .learning-boundary .card li{color:var(--hf35-ink)!important}
@media(max-width:900px){body.hf35-profile .r22-profile-hero-grid{grid-template-columns:72px 1fr!important}body.hf35-profile .profile-currentness{grid-column:1/-1}body.hf35 .hf35-directory-advanced .hf35-disclosure-body{grid-template-columns:1fr 1fr}}
@media(max-width:680px){body.hf35 .hf35-profile-comparison{grid-template-columns:1fr}body.hf35 .hf35-directory-advanced .hf35-disclosure-body{grid-template-columns:1fr}body.hf35-corrections .p0-control-form{grid-template-columns:1fr}body.hf35-profile .r22-profile-hero-grid{grid-template-columns:1fr!important}body.hf35-profile .profile-avatar.large{width:68px!important;height:68px!important;min-width:68px!important}body.hf35-profile .hf35-profile-section-nav{padding-inline:12px}}
'''
    (DIST/'assets/hf35.css').write_text(css,encoding='utf-8')

    control=r'''(()=>{'use strict';const q=(s,r=document)=>r.querySelector(s),form=q('[data-profile-control-form]');if(!form)return;const params=new URLSearchParams(location.search),listing=q('[name="listing"]',form),url=q('[name="url"]',form),profile=q('[name="profileId"]',form),type=q('[name="requestType"]',form),status=q('[data-profile-control-status]'),lang=document.documentElement.lang==='es'?'es':'en',tx=(a,b)=>lang==='es'?b:a;if(params.get('listing'))listing.value=params.get('listing').slice(0,180);if(params.get('url'))url.value=params.get('url').slice(0,800);let pid=params.get('profile')||'';if(!pid&&params.get('url')){const m=params.get('url').match(/\/profiles\/(FR-[A-Z0-9]+-[A-Za-z0-9._-]+)\//);if(m)pid=m[1]}if(/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(pid))profile.value=pid;if(params.get('action')==='PUBLIC_REMOVAL')type.value='PUBLIC_REMOVAL';function sync(){const removal=type.value==='PUBLIC_REMOVAL';form.querySelectorAll('[data-removal-only]').forEach(x=>x.hidden=!removal);form.querySelectorAll('[data-correction-only]').forEach(x=>x.hidden=removal);const a=q('[name="authorityConfirmed"]',form);if(a)a.required=removal;for(const n of ['currentInfo','correctInfo']){const e=q(`[name="${n}"]`,form);if(e)e.required=!removal}}type.addEventListener('change',sync);sync();form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const fd=new FormData(form),kind=String(fd.get('requestType')||'CORRECTION'),removal=kind==='PUBLIC_REMOVAL';status.className='r37-status';status.textContent=tx('Submitting your free request…','Enviando su solicitud gratuita…');const lines=[removal?'PUBLIC PROFILE REMOVAL REQUEST':'FACTUAL PROFILE CORRECTION REQUEST',`Listing: ${String(fd.get('listing')||'').trim()}`,`Requester: ${String(fd.get('requesterName')||'').trim()} <${String(fd.get('requesterEmail')||'').trim()}>`,`Page: ${String(fd.get('url')||'').trim()||'not supplied'}`];if(removal){lines.push(`Authority statement: ${String(fd.get('authorityBasis')||'').trim()}`,`Authority attested: ${fd.get('authorityConfirmed')?'yes':'no'}`,`Removal reason: ${String(fd.get('removalReason')||'').trim()||'not supplied'}`)}else{lines.push(`Information reported wrong: ${String(fd.get('currentInfo')||'').trim()}`,`Requested correction: ${String(fd.get('correctInfo')||'').trim()}`,`Supporting source: ${String(fd.get('evidenceUrl')||'').trim()||'not supplied'}`)}lines.push('No membership or payment is required for this request.');try{const r=await fetch('https://franklin-navigator-membership.onrender.com/api/support/request',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:removal?'PROFILE_PUBLIC_REMOVAL':'PROFILE_FACTUAL_CORRECTION',profileId:String(fd.get('profileId')||'').trim(),preferredLanguage:lang==='es'?'SPANISH':'ENGLISH',message:lines.join('\n')})});let d={};try{d=await r.json()}catch{}if(!r.ok)throw 0;form.querySelector('button[type="submit"]').disabled=true;status.className='r37-status good';status.textContent=tx(`Request received. Reference ${d.requestId}. No payment was made.`,`Solicitud recibida. Referencia ${d.requestId}. No se realizó ningún pago.`);status.focus()}catch{status.className='r37-status warn';status.textContent=tx('We could not submit the request. No payment was made. Please try again or email community@franklinnavigator.com.','No pudimos enviar la solicitud. Inténtelo de nuevo o escriba a community@franklinnavigator.com.');status.focus()}})})();'''
    (DIST/'assets/hf35-profile-control.js').write_text(control,encoding='utf-8')

    member=r'''(()=>{'use strict';const m=location.pathname.match(/^\/profiles\/([^/]+)\/$/);if(!m)return;const id=decodeURIComponent(m[1]),main=document.querySelector('main');if(!/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(id))return;const API='https://franklin-navigator-membership.onrender.com';const n=(t,x,c)=>{const e=document.createElement(t);if(x!==undefined)e.textContent=x;if(c)e.className=c;return e};const safe=v=>{try{const u=new URL(String(v||''));return u.protocol==='https:'&&!u.username&&!u.password?u:null}catch{return null}};const lines=v=>String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const competitorCards=()=>[...document.querySelectorAll('.hf35-competitor-card')];function addAction(label,value){const u=safe(value);if(!u)return;const box=document.querySelector('.profile-primary-actions');if(!box||[...box.querySelectorAll('a')].some(a=>a.href===u.href))return;const a=n('a',label,'button');a.href=u.href;a.rel='noopener noreferrer ugc';box.append(a)}function insertBadge(){const h=document.querySelector('.r22-profile-hero h1');if(!h||document.querySelector('.hf35-member-badge'))return;const b=n('span','Community Member','hf35-member-badge');h.insertAdjacentElement('beforebegin',b)}function navFor(ids){if(ids.length<3||document.querySelector('.hf35-profile-section-nav'))return;const nav=n('nav','', 'hf35-profile-section-nav');nav.setAttribute('aria-label','Profile sections');for(const [id,label] of ids){const a=n('a',label);a.href='#'+id;nav.append(a)}document.querySelector('.r22-profile-hero')?.insertAdjacentElement('afterend',nav)}async function run(){try{const l=await fetch('/data/public-profile-suppressions.json',{cache:'no-store'});if(!l.ok)throw 0;const d=await l.json();if((d.entries||[]).some(e=>e&&e.profileId===id&&e.status==='SUPPRESSED')){document.title='Profile unavailable | Franklin Navigator';if(main){main.innerHTML='<section class="section"><div class="wrap narrow"><h1>This profile is not publicly displayed.</h1><p>This profile has been removed from Franklin Navigator public view.</p></div></section>'}return}}catch{if(main){main.innerHTML='<section class="section"><div class="wrap narrow"><h1>This profile is temporarily unavailable.</h1><p>Franklin Navigator could not verify the public-display status of this profile. Please try again shortly.</p></div></section>'}return}let out;try{const r=await fetch(API+'/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});if(!r.ok)return;out=await r.json()}catch{return}if(out.activePaidMember===true){competitorCards().forEach(x=>x.remove());document.body.dataset.activeMember='true';insertBadge()}const p=out.publication;if(!p||p.profileId!==id||p.provenance!=='MEMBER_SUBMITTED_REVIEWED')return;const f=p.fields||{};addAction('Website',f.website);addAction('Contact',f.contactUrl);addAction('Book',f.bookingUrl);addAction('Get a quote',f.quoteUrl);addAction('Menu',f.menuUrl);addAction('Order',f.orderUrl);addAction('Directions',f.directionsUrl);const image=safe(f.profileImageUrl);if(image){const av=document.querySelector('.profile-avatar');if(av){av.textContent='';const img=document.createElement('img');img.src=image.href;img.alt='';av.append(img)}}const article=document.querySelector('.r22-profile-layout>article');if(!article)return;const anchor=article.querySelector('#sources')||article.querySelector('#manage');const blocks=[];function mod(id,label,value){if(!String(value||'').trim())return;const s=n('section','', 'hf35-member-module');s.id=id;s.append(n('h2',label),n('p',String(value).trim()));blocks.push(s)}mod('member-about','About',f.summary);mod('member-services','Services & specialties',f.services);const details=[['Hours',f.hours],['Service area',f.serviceArea],['Pricing & payment',f.pricing],['Languages',f.languages],['Accessibility',f.accessibility]].filter(x=>String(x[1]||'').trim());if(details.length){const s=n('section','', 'hf35-member-module');s.id='member-details';s.append(n('h2','Details'));const g=n('div','', 'hf35-member-grid');details.forEach(([a,b])=>{const c=n('div','', 'card');c.append(n('strong',a),n('p',b));g.append(c)});s.append(g);blocks.push(s)}[['member-experience','Experience',f.experience],['member-credentials','Credentials & certifications',f.credentials],['member-awards','Awards & honors',f.awards],['member-associations','Associations',f.associations],['member-education','Education & training',f.education],['member-publications','Publications, media & speaking',f.publications],['member-offers','Offers & events',f.offersEvents]].forEach(x=>mod(...x));const gallery=lines(f.galleryUrls).map(safe).filter(Boolean).slice(0,8);if(gallery.length){const s=n('section','', 'hf35-member-module');s.id='member-gallery';s.append(n('h2','Photos'));const g=n('div','', 'hf35-member-gallery');gallery.forEach(u=>{const i=document.createElement('img');i.src=u.href;i.alt='';i.loading='lazy';g.append(i)});s.append(g);blocks.push(s)}const social=lines(f.socialLinks).map(safe).filter(Boolean).slice(0,12);if(social.length){const s=n('section','', 'hf35-member-module');s.id='member-online';s.append(n('h2','Online presence'));const g=n('div','', 'hf35-online');social.forEach(u=>{const a=n('a',u.hostname.replace(/^www\./,''),'button');a.href=u.href;a.rel='noopener noreferrer ugc';g.append(a)});s.append(g);blocks.push(s)}for(const b of blocks){if(anchor)article.insertBefore(b,anchor);else article.append(b)}const navIds=[];if(document.querySelector('#about'))navIds.push(['about','Overview']);for(const b of blocks)navIds.push([b.id,b.querySelector('h2')?.textContent||'Details']);if(document.querySelector('#sources'))navIds.push(['sources','Sources']);if(document.querySelector('#manage'))navIds.push(['manage','Manage']);navFor(navIds)}run()})();'''
    (DIST/'assets/hf35-member-public.js').write_text(member,encoding='utf-8')

def update_release_metadata(pages,profiles):
    pr=ROOT/'PRODUCTION_RELEASE.json'
    data={}
    if pr.exists():
        try:data=json.loads(pr.read_text(encoding='utf-8'))
        except:pass
    data.update({
        'release':RELEASE,
        'releaseState':'QUALIFIED_CANDIDATE_PENDING_MERGE_AND_DEPLOY',
        'releaseDate':'2026-09-11',
        'candidateBranch':'fr-nav1-24-0-hf35-finish-simplify-20260911',
        'scope':'POST_HF34_FULL_SITE_FINISHING_SIMPLIFICATION_PROFILES_CORRECTIONS_DIRECTORY_HELP_BUSINESS_AND_DENSITY',
        'ownerDeployAuthorized':True,
        'dataAndAuthorityBoundaries':{
            'profileFactsChanged':False,'profileCountInherited':profiles,'customerStateMutatedByThisRelease':False,'paymentStateMutatedByThisRelease':False,'membershipEntitlementStateMutatedByThisRelease':False,'communityIsolation':'FRANKLIN_TN_ONLY'
        },
        'nextVersionImprovementList':'NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_24_0_HF35.md'
    })
    pr.write_text(json.dumps(data,indent=2),encoding='utf-8')
    nxt=ROOT/'NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_24_0_HF35.md'
    nxt.write_text('''# Franklin Navigator — Next Version Improvement List\n\nRelease: FR-NAV1.24.0-HF3.5\n\nCarry forward only items that remain materially useful after live owner review.\n\n- Continue owner screenshot review across remaining long-tail page families.\n- Continue Profile Factory link/category/duplicate reconciliation without transferring canonical authority to the Platform.\n- Expand paid-member profile depth only with qualified member-provided or source-backed data.\n- Add a governed reviews/reputation product only if separately approved; never fabricate ratings or badges.\n- Continue Spanish copy refinement where translated wording remains awkward.\n- Continue mobile/accessibility/performance refinement from live evidence.\n- Preserve static-first Sports/Explorer behavior and fail closed against blank/loading-only pages.\n- Keep public navigation simple and secondary detail behind clear disclosures.\n- Do not make changes solely for novelty.\n''',encoding='utf-8')
    (ROOT/'HF35_BUILD_RECEIPT.json').write_text(json.dumps({'release':RELEASE,'pagesProcessed':pages,'profilesProcessed':profiles,'canonicalProfileFactsChanged':False,'ownerDeployAuthorized':True},indent=2),encoding='utf-8')

if __name__=='__main__':main()
