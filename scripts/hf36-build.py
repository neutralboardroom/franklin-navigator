#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
import json,re

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
RELEASE='FR-NAV1.25.0-HF3.6'
CSS='/assets/hf36.css?v=frnav1250'
JS='/assets/hf36.js?v=frnav1250'


def tx(es,en,spa): return spa if es else en

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

def add_class(node,name):
    if not node:return
    classes=list(node.get('class',[]))
    if name not in classes:classes.append(name)
    node['class']=classes

def remove_class(node,name):
    if not node:return
    node['class']=[c for c in node.get('class',[]) if c!=name]

def summary_details(soup,label,nodes,cls='hf36-details'):
    d=tag(soup,'details',class_=cls)
    d.append(tag(soup,'summary',label))
    body=tag(soup,'div',class_='hf36-details-body')
    for n in nodes:
        if n is None: continue
        try:body.append(n.extract())
        except:body.append(n)
    d.append(body)
    return d

def direct_sections(main):
    return [x for x in main.find_all(recursive=False) if getattr(x,'name',None)=='section'] if main else []

def text_of(n):return ' '.join(n.get_text(' ',strip=True).split()) if n else ''

# ---------- global shell ----------
def global_text_pass(path):
    text=path.read_text(encoding='utf-8')
    # Update release identity everywhere without reparsing 19k pages.
    text=re.sub(r'(<meta content=")[^"]+(" name="franklin-release"/>)',rf'\g<1>{RELEASE}\2',text,count=1)
    if 'name="franklin-release"' not in text:
        text=text.replace('</head>',f'<meta content="{RELEASE}" name="franklin-release"/></head>',1)
    if CSS not in text:
        text=text.replace('</head>',f'<link href="{CSS}" rel="stylesheet"/></head>',1)
    if JS not in text:
        text=text.replace('</body>',f'<script defer="" src="{JS}"></script></body>',1)
    # Move the language selector into the existing main header row.  No content loss.
    if 'r37-language-switch' in text and 'hf36-language-in-header' not in text:
        m=re.search(r'(<div[^>]*class="r37-language-switch"[^>]*>.*?</div>)',text,re.S)
        if m:
            switch=m.group(1).replace('class="r37-language-switch"','class="r37-language-switch hf36-language-in-header"',1)
            text=text[:m.start()]+text[m.end():]
            text=text.replace('<div class="wrap top">','<div class="wrap top">'+switch,1)
    path.write_text(text,encoding='utf-8')

# ---------- homepage ----------
def simplify_home(soup,es=False):
    main=soup.select_one('main')
    if not main:return
    add_class(soup.body,'hf36-home')
    bridge=soup.select_one('.r30-home-bridge')
    if bridge:
        h2=bridge.find('h2');p=bridge.find('p')
        if h2:h2.string=tx(es,'Need help with several things at once?','¿Necesita ayuda con varias cosas a la vez?')
        if p:p.string=tx(es,'Build one private plan when legal, health, home, vehicle, civic or community needs overlap.','Cree un solo plan privado cuando se superpongan necesidades legales, de salud, hogar, vehículo, civismo o comunidad.')
        actions=bridge.select_one('.r30-actions')
        if actions:
            links=actions.find_all('a',recursive=False)
            for a in links[1:]:a.decompose()
            if links:
                links[0].string=tx(es,'Help with connected needs','Ayuda con necesidades conectadas')
        add_class(bridge,'hf36-compact-bridge')
    # Keep only two current items; source-backed data remains on Today.
    events=soup.select('.r24-home-events > article')
    for e in events[2:]:e.decompose()
    # Improve resident-facing everyday-help language.
    for sec in direct_sections(main):
        h2=sec.find('h2')
        if h2 and text_of(h2) in ('Do more than find a link.','Haga más que encontrar un enlace.'):
            h2.string=tx(es,'Get practical help with everyday problems.','Obtenga ayuda práctica con problemas cotidianos.')
            add_class(sec,'hf36-everyday')
    # Business section: one profile action + one distinct membership action.
    bus=soup.select_one('.r24-business-section')
    if bus:
        acts=bus.select_one('.actions')
        if acts:
            links=acts.find_all('a',recursive=False)
            if links:
                links[0].string=tx(es,'Find or claim my profile','Buscar o reclamar mi perfil')
            if len(links)>1:
                links[1]['href']='/membership-start/' if not es else '/es/iniciar-membresia/'
                links[1].string=tx(es,'See Community Membership','Ver Membresía Comunitaria')
            for a in links[2:]:a.decompose()
    # Restore Then & Now as visible content; no hidden dark disclosure.
    hist=soup.select_one('.r22-history')
    if hist:
        details=hist.select_one('details.hf35-history-more')
        if details:
            body=details.select_one('.hf35-disclosure-body')
            if body:
                replacement=tag(soup,'div',class_='hf36-history-visible')
                for child in list(body.children):
                    try:replacement.append(child.extract())
                    except:pass
                details.replace_with(replacement)
        add_class(hist,'hf36-history')
        heading=hist.find('h2')
        if heading:heading.string=tx(es,'Franklin Through Time — Then & Now','Franklin a través del tiempo — Antes y ahora')

# ---------- get it done ----------
def simplify_get_it_done(soup,es=False):
    add_class(soup.body,'hf36-get-it-done')
    search=soup.select_one('.r22-task-search')
    if search:
        acts=search.select_one('.actions')
        if acts:
            links=acts.find_all('a',recursive=False)
            if links:
                links[0].string=tx(es,'Help me choose a task','Ayúdeme a elegir una tarea')
            for a in links[1:]:a.decompose()
    chips=soup.select_one('[data-task-categories]')
    if chips and not chips.select_one('details.hf36-task-more-categories'):
        buttons=chips.find_all('button',recursive=False)
        keep=buttons[:6]
        extra=buttons[6:]
        if extra:
            d=summary_details(soup,tx(es,'More categories','Más categorías'),extra,'hf36-task-more-categories')
            chips.append(d)
    grid=soup.select_one('[data-task-grid]')
    if grid:
        cards=grid.find_all('article',recursive=False)
        for i,c in enumerate(cards):
            c.select_one('.link-button[data-r22-remind]') and c.select_one('.link-button[data-r22-remind]').decompose()
            if i>=6:add_class(c,'hf36-extra-task')
        if len(cards)>6 and not grid.find_next_sibling(attrs={'data-hf36-show-tasks':True}):
            b=tag(soup,'button',tx(es,'View all tasks','Ver todas las tareas'),class_='button hf36-show-all',type='button',data_hf36_show_tasks='1')
            grid.insert_after(b)
    # Compact the explanatory section and remove internal release language.
    how=None
    for sec in direct_sections(soup.select_one('main')):
        if sec.find('h2') and 'Understand' in text_of(sec.find('h2')):
            how=sec;break
    if how:
        p=how.find('p')
        if p:p.string=tx(es,'Each guide shows what to prepare, the official destination and what to check afterward.','Cada guía muestra qué preparar, el destino oficial y qué revisar después.')
        mini=how.select_one('.r22-mini-list')
        if mini:add_class(mini,'hf36-inline-trust')
        acts=how.select_one('.actions')
        if acts:
            nodes=list(acts.children)
            acts.replace_with(summary_details(soup,tx(es,'More tools','Más herramientas'),nodes,'hf36-task-more-tools'))
        add_class(how,'hf36-how-tasks')

# ---------- activities ----------
def simplify_activities(soup,es=False):
    add_class(soup.body,'hf36-activities')
    hero=soup.select_one('.explorer-hero')
    if hero:
        h1=hero.find('h1');p=hero.find('p')
        if h1:h1.string=tx(es,'Find something local to do in Franklin.','Encuentre algo local que hacer en Franklin.')
        if p:p.string=tx(es,'Search local activities, leagues, classes, arts, parks and community programs. Confirm changing details at the original source.','Busque actividades, ligas, clases, artes, parques y programas comunitarios locales. Confirme los detalles cambiantes en la fuente original.')
        acts=hero.select_one('.actions')
        if acts:
            links=acts.find_all('a',recursive=False)
            if links:
                links[0].string=tx(es,'Find activities','Buscar actividades')
            for a in links[1:]:a.decompose()
    main=soup.select_one('main')
    finder=soup.select_one('#finder')
    # Move current programs ahead of the long directory.
    current=None
    for sec in direct_sections(main):
        h=sec.find('h2')
        if h and text_of(h) in ('Current programs and registration windows','Programas actuales y períodos de inscripción'):
            current=sec;break
    if current and finder:
        finder.insert_before(current.extract())
        add_class(current,'hf36-current-activities')
        cards=current.select('article,.card,.r22-card')
        for i,c in enumerate(cards):
            if i>=4:add_class(c,'hf36-current-extra')
        if len(cards)>4 and not current.select_one('[data-hf36-show-current]'):
            wrap=current.select_one('.wrap') or current
            wrap.append(tag(soup,'button',tx(es,'Show more current items','Mostrar más elementos actuales'),class_='button',type='button',data_hf36_show_current='1'))
    if finder:
        h2=finder.find('h2')
        if h2:h2.string=tx(es,'Find an activity','Buscar una actividad')
        controls=finder.select_one('.explorer-controls')
        if controls and not controls.select_one('details.hf36-activity-more-filters'):
            labels=controls.find_all('label',recursive=False)
            extras=[]
            # Keep Search + Sport/activity visible. Audience/geography/reset become secondary.
            for lab in labels:
                if lab.select_one('[data-explorer-audience],[data-explorer-geography]'):
                    extras.append(lab.extract())
            reset=controls.select_one('[data-explorer-reset]')
            if reset:extras.append(reset.extract())
            if extras:controls.append(summary_details(soup,tx(es,'More filters','Más filtros'),extras,'hf36-activity-more-filters'))
        grid=finder.select_one('[data-explorer-grid]')
        if grid:
            cards=grid.find_all('article',recursive=False)
            for i,c in enumerate(cards):
                choice=c.select_one('.explorer-choice span')
                if choice:choice.string=tx(es,'Save','Guardar')
                if i>=9:add_class(c,'hf36-extra-activity')
            if len(cards)>9 and not finder.select_one('[data-hf36-show-activities]'):
                grid.insert_after(tag(soup,'button',tx(es,'Show more activities','Mostrar más actividades'),class_='button hf36-show-more-activities',type='button',data_hf36_show_activities='1'))
    # Remove malformed empty lower blocks found in owner review.
    for sec in list(direct_sections(main)):
        txt=text_of(sec)
        if 'Explore other sports and activities' in txt or 'Explorar otros deportes y actividades' in txt:
            sec.decompose()
    for h in list(soup.select('main h2, main h3')):
        if not text_of(h):h.decompose()

# ---------- community ----------
def simplify_community(soup,es=False):
    add_class(soup.body,'hf36-community')
    hero=soup.select_one('.r22-hero')
    if hero:
        acts=hero.select_one('.actions')
        if acts:
            links=acts.find_all('a',recursive=False)
            # Keep organizations + one get involved route.
            org=next((a for a in links if 'directory' in (a.get('href') or '')),None)
            civic=next((a for a in links if 'civic' in (a.get('href') or '')),None)
            acts.clear()
            if org:
                org['class']=['button','primary'];org.string=tx(es,'Find organizations','Buscar organizaciones');acts.append(org)
            if civic:
                civic['class']=['button'];civic.string=tx(es,'Get involved','Participar');acts.append(civic)
    sections=direct_sections(soup.select_one('main'))
    ways=next((s for s in sections if s.find('h2') and 'Choose how you want' in text_of(s.find('h2'))),None)
    civic_sec=next((s for s in sections if s.find('h2') and 'Make local participation' in text_of(s.find('h2'))),None)
    stay=next((s for s in sections if s.find('h2') and 'Stay connected' in text_of(s.find('h2'))),None)
    if ways:
        grid=ways.select_one('.r22-compact-grid')
        if grid:
            cards=grid.find_all('article',recursive=False)
            # Merge community project + response into one path.
            project=next((c for c in cards if 'Plan a community project' in text_of(c)),None)
            response=next((c for c in cards if 'Respond to a community need' in text_of(c)),None)
            if project:
                p=project.find('p')
                if p:p.string=tx(es,'Turn a neighborhood, nonprofit idea or community need into a clear checklist and next steps.','Convierta una idea vecinal, sin fines de lucro o una necesidad comunitaria en una lista clara y próximos pasos.')
            if response:response.decompose()
            # Parks/library become optional resources, not equal participation paths.
            resource_cards=[c for c in grid.find_all('article',recursive=False) if any(x in text_of(c) for x in ['Parks & recreation','Library & meeting space','Parques','Biblioteca'])]
            if resource_cards:
                d=summary_details(soup,tx(es,'Community spaces & resources','Espacios y recursos comunitarios'),resource_cards,'hf36-community-resources')
                grid.insert_after(d)
        if civic_sec:
            civic_nodes=[]
            mini=civic_sec.select_one('.r22-mini-list')
            acts=civic_sec.select_one('.actions')
            if mini:civic_nodes.append(mini)
            if acts:civic_nodes.append(acts)
            ways.select_one('.wrap').append(summary_details(soup,tx(es,'Useful civic links','Enlaces cívicos útiles'),civic_nodes,'hf36-civic-links'))
            civic_sec.decompose()
    if stay:
        add_class(stay,'hf36-stay-connected')
        acts=stay.select_one('.actions')
        if acts:
            links=acts.find_all('a',recursive=False)
            for a in links:
                if '/es/' in (a.get('href') or ''):a.decompose()

# ---------- my franklin ----------
def simplify_my_franklin(soup,es=False):
    add_class(soup.body,'hf36-my-franklin')
    root=soup.select_one('[data-my-franklin]')
    if not root:return
    maincol=root.select_one('.r22-dashboard-main')
    tools=root.select_one('.hf34-my-tools')
    output=root.select_one('[data-my-franklin-output]')
    cards=maincol.find_all('div',class_='r22-dashboard-card',recursive=False) if maincol else []
    saved_profile=next((c for c in cards if c.select_one('[data-saved-profiles]')),None)
    saved_plans=next((c for c in cards if c.select_one('[data-r34-saved-plans]')),None)
    assistant=next((c for c in cards if c.select_one('[data-r38-assistant-plans]')),None)
    follow=next((c for c in cards if c.get('id')=='follow-ups'),None)
    if maincol and saved_profile and saved_plans and assistant and not maincol.select_one('.hf36-saved-hub'):
        hub=tag(soup,'div',class_='r22-dashboard-card hf36-saved-hub')
        hub.append(tag(soup,'h2',tx(es,'Saved in My Franklin','Guardado en Mi Franklin')))
        hub.append(tag(soup,'p',tx(es,'Profiles, plans and Assistant next steps saved privately on this device.','Perfiles, planes y próximos pasos del Asistente guardados de forma privada en este dispositivo.'),class_='fine-print'))
        empty=tag(soup,'div',class_='empty-state hf36-saved-empty',data_hf36_saved_empty='1')
        empty.append(tag(soup,'strong',tx(es,'Nothing saved yet.','Todavía no hay nada guardado.')))
        empty.append(NavigableString(' '+tx(es,'Save a local profile or task plan and it will appear here.','Guarde un perfil local o un plan de tareas y aparecerá aquí.')))
        hub.append(empty)
        blocks=tag(soup,'div',class_='hf36-saved-blocks')
        for title,card,selector in [
            (tx(es,'Profiles','Perfiles'),saved_profile,'[data-saved-profiles]'),
            (tx(es,'Plans','Planes'),saved_plans,'[data-r34-saved-plans]'),
            (tx(es,'Assistant','Asistente'),assistant,'[data-r38-assistant-plans]')]:
            block=tag(soup,'section',class_='hf36-saved-block')
            block.append(tag(soup,'h3',title))
            container=card.select_one(selector)
            if container:block.append(container.extract())
            blocks.append(block)
        hub.append(blocks)
        actions=tag(soup,'div',class_='actions hf36-saved-actions')
        actions.append(tag(soup,'a',tx(es,'Find Local','Buscar local'),href='/directory/' if not es else '/es/directorio/',class_='button'))
        actions.append(tag(soup,'a',tx(es,'Get It Done','Hacerlo'),href='/get-it-done/' if not es else '/es/hacerlo/',class_='button'))
        hub.append(actions)
        saved_profile.insert_before(hub)
        saved_profile.decompose();saved_plans.decompose();assistant.decompose()
    # Reorder: saved -> reminder -> compact settings -> optional dashboard output.
    hub=maincol.select_one('.hf36-saved-hub') if maincol else None
    if maincol and hub:
        if follow: hub.insert_after(follow.extract())
        if tools:
            follow_now=maincol.select_one('#follow-ups')
            if follow_now:follow_now.insert_after(tools.extract())
        if output:
            add_class(output,'hf36-starting-points')
            tools_now=maincol.select_one('.hf34-my-tools')
            if tools_now:tools_now.insert_after(output.extract())
    # Compact preference tiles.
    for tile in soup.select('.r22-interest-tile'):add_class(tile,'hf36-interest-tile')

# ---------- business ----------
def simplify_business(soup,es=False):
    add_class(soup.body,'hf36-business')
    main=soup.select_one('main')
    hero=direct_sections(main)[0] if direct_sections(main) else None
    if hero:
        acts=hero.select_one('.actions')
        if acts:
            links=acts.find_all('a',recursive=False)
            if links:
                links[0].string=tx(es,'Find or review my profile','Buscar o revisar mi perfil')
            if len(links)>1:
                links[1]['href']='/member-profile-preview/' if not es else '/es/vista-previa-perfil-miembro/'
                links[1].string=tx(es,'See member profile example','Ver ejemplo de perfil de miembro')
            for a in links[2:]:a.decompose()
    # Remove repeated focus panel; benefit remains in comparison + price card.
    for x in soup.select('.hf35-member-focus'):x.decompose()
    plan=soup.select_one('.r29-plan')
    if plan:
        cta=plan.select_one('a.hf34-membership-cta, a.button.primary')
        if cta:
            cta['href']='/membership-start/' if not es else '/es/iniciar-membresia/'
            cta.string=tx(es,'Join Community Membership — $35/year','Unirse a la Membresía Comunitaria — $35/año')
        # tangible benefits, still honest and entitlement-neutral.
        ul=plan.select_one('ul.check-list')
        if ul:
            items=[
                tx(es,'Richer business information, services and images','Información, servicios e imágenes del negocio más completos'),
                tx(es,'Verified contact and action links displayed clearly','Enlaces verificados de contacto y acción mostrados claramente'),
                tx(es,'No Similar local profiles section on your active member profile','Sin sección de perfiles locales similares en su perfil de miembro activo'),
                tx(es,'Renews annually until canceled; secure Stripe billing','Se renueva anualmente hasta cancelarse; facturación segura de Stripe')]
            ul.clear()
            for item in items:ul.append(tag(soup,'li',item))
        add_class(plan,'hf36-membership-card')
    # Turn free tools / optional policy into one short trust note + disclosure.
    free=None
    for sec in direct_sections(main):
        if 'Membership remains optional' in text_of(sec) or 'La membresía' in text_of(sec):free=sec;break
    if free:
        wrap=free.select_one('.wrap') or free
        trust=tag(soup,'div',class_='hf36-membership-trust')
        trust.append(tag(soup,'strong',tx(es,'Corrections and removal requests are always free.','Las correcciones y solicitudes de retiro siempre son gratuitas.')))
        trust.append(tag(soup,'p',tx(es,'Membership does not change ordinary Directory ranking, factual accuracy, credentials or public safety information.','La membresía no cambia la clasificación normal del Directorio, la exactitud factual, las credenciales ni la información pública de seguridad.')))
        tools=[]
        for a in free.select('a.button'):tools.append(a)
        if tools:trust.append(summary_details(soup,tx(es,'Free business tools','Herramientas comerciales gratuitas'),tools,'hf36-free-business-tools'))
        wrap.clear();wrap.append(trust)
    benefit=soup.select_one('details.hf35-business-benefits')
    if benefit:
        benefit.attrs.pop('open',None)
        # Replace vague heading.
        for h in benefit.find_all('h3'):
            if 'Growth Desk planning' in text_of(h):h.string=tx(es,'Local growth planning','Planificación de crecimiento local')
        benefit.summary.string=tx(es,'See all member benefits','Ver todos los beneficios para miembros')

# ---------- help center ----------
def simplify_help(soup,es=False):
    add_class(soup.body,'hf36-help')
    output=soup.select_one('.help-plan-output')
    if output:add_class(output,'hf36-help-plan-output')
    # Merge secondary tool disclosures into one.
    primary=soup.select_one('details.hf35-help-tools')
    secondary=soup.select_one('.hf34-help-more details.hf34-disclosure')
    if primary:
        primary.summary.string=tx(es,'More help & tools','Más ayuda y herramientas')
        if secondary:
            pbody=primary.select_one('.hf35-disclosure-body')
            sbody=secondary.select_one('.hf34-disclosure-body')
            if pbody and sbody:
                divider=tag(soup,'hr',class_='hf36-detail-divider');pbody.append(divider)
                for child in list(sbody.children):
                    try:pbody.append(child.extract())
                    except:pass
            sec=secondary.find_parent('section')
            if sec:sec.decompose()
    # Decorative Pinkerton image does not belong at the end of help flow.
    for img in list(soup.select('main img')):
        if 'pinkerton' in (img.get('src') or '').lower():
            sec=img.find_parent('section')
            if sec:sec.decompose()
            else:
                fig=img.find_parent('figure')
                if fig:fig.decompose()
    # Keep critical urgent routes directly visible.
    planner=soup.select_one('[data-community-help-planner]')
    if planner:add_class(planner,'hf36-help-planner')

# ---------- directory ----------
def simplify_directory_page(soup,es=False):
    add_class(soup.body,'hf36-directory')
    toolbar=soup.select_one('.r22-directory-toolbar')
    if toolbar:add_class(toolbar,'hf36-directory-toolbar')
    sort=soup.select_one('[data-dir-sort]')
    if sort and not sort.select_one('option[value="local"]'):
        opt=tag(soup,'option',tx(es,'Franklin relevance','Relevancia para Franklin'),value='local')
        opt['selected']='selected';sort.insert(0,opt)
    details=soup.select_one('details.hf35-directory-advanced')
    if details:details.summary.string=tx(es,'More filters','Más filtros')

# ---------- public corrections ----------
def preserve_corrections(soup,es=False):
    add_class(soup.body,'hf36-corrections')

# ---------- helpers for selected routes ----------
def transform_key_page(path):
    route=route_for(path);es=route.startswith('/es/')
    text=path.read_text(encoding='utf-8')
    soup=BeautifulSoup(text,'html.parser')
    if route in ('/','/es/'):
        simplify_home(soup,es)
    elif route in ('/get-it-done/','/es/hacerlo/'):
        simplify_get_it_done(soup,es)
    elif route in ('/activities/','/es/actividades/'):
        simplify_activities(soup,es)
    elif route in ('/community/','/es/comunidad/'):
        simplify_community(soup,es)
    elif route in ('/my-franklin/','/es/mi-franklin/'):
        simplify_my_franklin(soup,es)
    elif route in ('/business-dashboard/','/es/negocios/'):
        simplify_business(soup,es)
    elif route in ('/community-help-center/','/es/centro-de-ayuda/'):
        simplify_help(soup,es)
    elif route in ('/directory/','/es/directorio/'):
        simplify_directory_page(soup,es)
    elif route.startswith('/corrections') or route.startswith('/es/corrections'):
        preserve_corrections(soup,es)
    else:return
    path.write_text(str(soup),encoding='utf-8')

# ---------- directory runtime patch ----------
def patch_directory_runtime():
    core=DIST/'assets/local-discovery-core.js'
    s=core.read_text(encoding='utf-8')
    if 'HF3.6 local relevance and conservative duplicate suppression' not in s:
        s=s.replace("sort: ['name', 'checked', 'website', 'address'].includes(raw.sort) ? raw.sort : 'name',","sort: ['local', 'name', 'checked', 'website', 'address'].includes(raw.sort) ? raw.sort : 'local',")
        s=s.replace("if (state.sort !== 'name') p.set('sort', state.sort);","if (state.sort !== 'local') p.set('sort', state.sort);")
        old="""    matches.sort((a, b) => (s.sort === 'checked' ? (validDate(b.d) ? b.d : '').localeCompare(validDate(a.d) ? a.d : '') : s.sort === 'website' ? Number(!!b.websiteHref) - Number(!!a.websiteHref) : s.sort === 'address' ? Number(b.h) - Number(a.h) : 0) || compare(a, b));\n    return matches;"""
        new="""    // HF3.6 local relevance and conservative duplicate suppression.\n    const canonicalName = value => norm(value).replace(/\\bone\\b/g, '1').replace(/\\btwo\\b/g, '2').replace(/\\b(?:llc|inc|incorporated|corp|corporation|pc|pllc|ltd)\\b/g, '').replace(/\\s+/g, ' ').trim();\n    const deduped = [], seenIdentity = new Set();\n    for (const r of matches) {\n      const address = norm(r.l);\n      const key = address ? address + '|' + canonicalName(r.n) : '';\n      if (key && seenIdentity.has(key)) continue;\n      if (key) seenIdentity.add(key);\n      deduped.push(r);\n    }\n    const localRank = r => { const t = norm([r.g, r.l].join(' ')); return t.includes('franklin') ? 0 : t.includes('williamson') ? 1 : 2; };\n    deduped.sort((a, b) => (s.sort === 'local' ? localRank(a) - localRank(b) : s.sort === 'checked' ? (validDate(b.d) ? b.d : '').localeCompare(validDate(a.d) ? a.d : '') : s.sort === 'website' ? Number(!!b.websiteHref) - Number(!!a.websiteHref) : s.sort === 'address' ? Number(b.h) - Number(a.h) : 0) || compare(a, b));\n    return deduped;"""
        if old not in s:raise SystemExit('directory core patch anchor missing')
        s=s.replace(old,new)
        core.write_text(s,encoding='utf-8')
    js=DIST/'assets/local-discovery.js'
    s=js.read_text(encoding='utf-8')
    if 'HF3.6 compact resident-facing directory card' not in s:
        s=s.replace('const perPage = 24;','const perPage = 16;')
        start=s.index('  function card(row) {')
        end=s.index('  function render() {',start)
        card="""  // HF3.6 compact resident-facing directory card.\n  function card(row) {\n    const article = el('article', null, 'r22-profile-result hf36-directory-card');\n    const title = link('', C.canonicalProfile(row.i, language()), 'result-title'); title.append(el('h3', row.n));\n    const cat = button(categoryText(row.c) || typeText(row.t), () => { fields.category.value = row.c; readForm(); setHistory(true); render(); }, 'category-tag hf36-category-link');\n    cat.setAttribute('aria-label', tx('Filter category: ', 'Filtrar categoría: ') + (categoryText(row.c) || typeText(row.t)));\n    const locationText = el('p', row.l || row.g || tx('Location not supplied', 'Ubicación no indicada'), 'hf36-result-location');\n    const checked = el('p', tx('Source date: ', 'Fecha de la fuente: ') + C.dateLabel(row.d, language()), 'fine-print hf36-source-date');\n    const facts = el('div', null, 'result-facts hf36-result-facts');\n    if (row.phoneHref) facts.append(link(tx('Call', 'Llamar'), row.phoneHref, 'hf36-fact-link'));\n    if (row.websiteHref) facts.append(link(tx('Website', 'Sitio web'), row.websiteHref, 'hf36-fact-link'));\n    if (row.emailHref) facts.append(link(tx('Email', 'Correo'), row.emailHref, 'hf36-fact-link'));\n    if (row.h) facts.append(el('span', tx('Exact address', 'Dirección exacta'), 'hf36-fact-text'));\n    const actions = el('div', null, 'result-actions hf36-result-actions');\n    const choose = button(selected.has(row.i) ? tx('Selected', 'Seleccionado') : tx('Compare', 'Comparar'), () => toggle(row.i), 'link-button hf36-compare');\n    choose.dataset.compareId = row.i; choose.setAttribute('aria-pressed', String(selected.has(row.i)));\n    choose.setAttribute('aria-label', tx(selected.has(row.i) ? 'Remove from comparison: ' : 'Compare: ', selected.has(row.i) ? 'Quitar de la comparación: ' : 'Comparar: ') + row.n);\n    actions.append(link(tx('Open profile', 'Abrir perfil'), C.canonicalProfile(row.i, language()), 'button small primary'), choose);\n    article.append(title, cat, locationText, checked, facts, actions); return article;\n  }\n"""
        s=s[:start]+card+s[end:]
        s=s.replace("pageLabel.textContent = tx(`Page ${state.page} of ${pages}`, `Página ${state.page} de ${pages}`);","pageLabel.textContent = tx(`Page ${state.page}`, `Página ${state.page}`);")
        js.write_text(s,encoding='utf-8')

# ---------- assets ----------
CSS_TEXT=r'''/* FR-NAV1.25.0-HF3.6 owner-review finishing */
/* One compact header row: the language control no longer creates its own strip. */
header .top{display:flex;align-items:center;gap:18px;min-height:64px}.r37-language-switch.hf36-language-in-header{position:static!important;margin:0 0 0 12px!important;padding:0!important;background:transparent!important;border:0!important;order:4;white-space:nowrap}.r37-language-switch.hf36-language-in-header button{min-height:34px;padding:6px 9px}.nav.hf34-nav{margin-left:auto;order:3}.brand{order:1}
/* General density and safe contrast. */
.hf36-details,.hf36-task-more-categories,.hf36-task-more-tools,.hf36-community-resources,.hf36-civic-links,.hf36-free-business-tools{border:1px solid #c9dcda;border-radius:14px;background:#fff}.hf36-details>summary,.hf36-task-more-categories>summary,.hf36-task-more-tools>summary,.hf36-community-resources>summary,.hf36-civic-links>summary,.hf36-free-business-tools>summary{cursor:pointer;font-weight:800;padding:15px 16px;color:#082f34}.hf36-details-body{padding:0 16px 16px}.hf36-detail-divider{border:0;border-top:1px solid #d9e5e3;margin:22px 0}
/* Homepage */
.hf36-home .hf36-compact-bridge{padding-block:28px}.hf36-home .hf36-compact-bridge .wrap{align-items:center}.hf36-home .hf36-compact-bridge h2{font-size:clamp(1.45rem,2.2vw,2rem);margin-bottom:8px}.hf36-home .hf36-compact-bridge p{max-width:760px}.hf36-home .navigator-bot .empty-state,.hf36-home [data-hf36-home-empty='1']{display:none!important}.hf36-home .hf36-history{background:#fff;color:#102126}.hf36-home .hf36-history *{color:inherit}.hf36-home .hf36-history .eyebrow{color:#00626c}.hf36-home .hf36-history-visible{padding-block:44px}.hf36-home .r22-history-grid{gap:16px}.hf36-home .r22-history-grid figure{margin:0}.hf36-home .r22-history-grid img{aspect-ratio:16/9;object-fit:cover;border-radius:14px;width:100%;height:auto}.hf36-home .r24-business-section .actions{gap:12px}.hf36-home .hf36-everyday{padding-block:38px}
/* Get It Done */
.hf36-get-it-done .r22-filter-chips{gap:8px}.hf36-get-it-done .hf36-task-more-categories{display:inline-block;vertical-align:top}.hf36-get-it-done .hf36-task-more-categories>summary{padding:9px 13px}.hf36-get-it-done .hf36-task-more-categories .hf36-details-body{display:flex;flex-wrap:wrap;gap:8px;padding:10px}.hf36-get-it-done .hf36-extra-task{display:none}.hf36-get-it-done.hf36-show-all-tasks .hf36-extra-task{display:block}.hf36-get-it-done .hf36-show-all{margin-top:20px}.hf36-get-it-done .task-card{min-height:0;padding:20px}.hf36-get-it-done .task-card p{margin-bottom:14px}.hf36-get-it-done .hf36-how-tasks{padding-block:36px}.hf36-get-it-done .hf36-inline-trust{display:flex;flex-wrap:wrap;gap:8px}.hf36-get-it-done .hf36-inline-trust span{background:#fff;border:1px solid #c9dcda;border-radius:10px;padding:8px 10px}.hf36-get-it-done .hf36-task-more-tools{margin-top:18px;max-width:520px}
/* Activities */
.hf36-activities .explorer-hero{padding-block:40px}.hf36-activities .explorer-controls{grid-template-columns:minmax(280px,2fr) minmax(220px,1fr);align-items:end}.hf36-activities .hf36-activity-more-filters{grid-column:1/-1}.hf36-activities .hf36-activity-more-filters .hf36-details-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.hf36-activities .hf36-extra-activity,.hf36-activities .hf36-current-extra{display:none}.hf36-activities.hf36-show-all-activities .hf36-extra-activity,.hf36-activities.hf36-show-current .hf36-current-extra{display:flex}.hf36-activities .explorer-card{min-height:0;padding:18px}.hf36-activities .explorer-card>p{margin-block:8px}.hf36-activities .explorer-choice{font-size:.9rem;gap:6px}.hf36-activities .explorer-mini-note{font-size:.82rem;color:#5b6e70}.hf36-activities .hf36-current-activities{padding-block:36px}.hf36-activities .hf36-show-more-activities{margin-top:20px}
/* Community */
.hf36-community .r22-compact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hf36-community .r22-compact-grid .r22-card{min-height:0}.hf36-community .hf36-community-resources,.hf36-community .hf36-civic-links{margin-top:20px}.hf36-community .hf36-community-resources .hf36-details-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.hf36-community .hf36-stay-connected{padding-block:28px}.hf36-community .hf36-stay-connected .r22-split{align-items:center}
/* My Franklin: empty data makes the page shorter, not longer. */
.hf36-my-franklin .hf36-saved-hub,.hf36-my-franklin #follow-ups{margin-bottom:18px}.hf36-my-franklin .hf36-saved-blocks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.hf36-my-franklin .hf36-saved-block{border:1px solid #d5e2e0;border-radius:12px;padding:12px}.hf36-my-franklin .hf36-saved-block .empty-state{display:none}.hf36-my-franklin .hf36-saved-block:has(> div:empty){display:none}.hf36-my-franklin .hf36-saved-actions{margin-top:14px}.hf36-my-franklin .hf36-starting-points.hf36-empty-starting{display:none}.hf36-my-franklin .r22-interest-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.hf36-my-franklin .hf36-interest-tile{min-height:0;padding:9px 10px}.hf36-my-franklin .hf34-my-tools{display:grid;grid-template-columns:1fr 1fr;gap:12px}.hf36-my-franklin .hf34-my-tools>details{align-self:start}.hf36-my-franklin .r22-reminder-form{grid-template-columns:minmax(0,1fr) 180px auto}
/* Business membership page */
.hf36-business .hf35-profile-comparison{margin-bottom:18px}.hf36-business .hf36-membership-card{max-width:760px;margin-inline:auto;padding:28px}.hf36-business .hf36-membership-card .r29-price{margin-block:12px}.hf36-business .hf36-membership-trust{max-width:950px;margin:auto;padding:22px;border:1px solid #c9dcda;border-radius:14px;background:#fff}.hf36-business .hf36-membership-trust p{margin-bottom:10px}.hf36-business details.hf35-business-benefits{margin-top:18px}.hf36-business .r29-panel{min-height:0}
/* Help Center */
.hf36-help .urgent-section{padding-block:38px}.hf36-help .hf36-help-plan-output.hf36-empty-plan{display:none}.hf36-help .topic-grid{gap:8px}.hf36-help .topic-choice{padding:10px 12px;min-height:0}.hf36-help .help-planner-layout:has(.hf36-empty-plan){grid-template-columns:1fr}.hf36-help details.hf35-help-tools{margin-block:20px}.hf36-help .help-hero{padding-block:42px}
/* Directory */
.hf36-directory .hf36-directory-toolbar{grid-template-columns:minmax(320px,2.4fr) minmax(190px,1fr)}.hf36-directory .r22-directory-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.hf36-directory .hf36-directory-card{min-height:0!important;padding:16px!important}.hf36-directory .hf36-directory-card h3{font-size:1.06rem;margin-bottom:8px}.hf36-directory .hf36-category-link{border:0!important;background:transparent!important;padding:0!important;text-decoration:underline;text-underline-offset:3px}.hf36-directory .hf36-result-location{margin:10px 0}.hf36-directory .hf36-source-date{margin:6px 0}.hf36-directory .hf36-result-facts{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px}.hf36-directory .hf36-result-facts>*{border:0!important;background:transparent!important;padding:0!important;border-radius:0!important;font-size:.9rem}.hf36-directory .hf36-fact-link{text-decoration:underline}.hf36-directory .hf36-result-actions{display:flex;align-items:center;gap:10px}.hf36-directory .hf36-compare{padding:5px 0;border:0;background:transparent;text-decoration:underline;font-weight:700}.hf36-directory .r22-directory-pager{margin-top:22px}
/* Corrections retain strong readable contrast. */
.hf36-corrections main,.hf36-corrections main *{--hf36-safe-color:#102126}.hf36-corrections main p,.hf36-corrections main label,.hf36-corrections main h1,.hf36-corrections main h2,.hf36-corrections main h3{color:#102126}
@media(max-width:900px){header .top{flex-wrap:wrap;padding-block:8px}.r37-language-switch.hf36-language-in-header{order:2;margin-left:auto!important}.nav.hf34-nav{order:4;width:100%;justify-content:flex-start;overflow:auto}.hf36-directory .r22-directory-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hf36-my-franklin .hf36-saved-blocks,.hf36-my-franklin .r22-interest-grid{grid-template-columns:1fr 1fr}.hf36-my-franklin .r22-reminder-form{grid-template-columns:1fr}.hf36-community .r22-compact-grid{grid-template-columns:1fr 1fr}}
@media(max-width:620px){.hf36-directory .r22-directory-grid,.hf36-my-franklin .hf36-saved-blocks,.hf36-my-franklin .r22-interest-grid,.hf36-community .r22-compact-grid,.hf36-community .hf36-community-resources .hf36-details-body{grid-template-columns:1fr}.hf36-activities .explorer-controls{grid-template-columns:1fr}.hf36-activities .hf36-activity-more-filters .hf36-details-body{grid-template-columns:1fr}.hf36-my-franklin .hf34-my-tools{grid-template-columns:1fr}}
'''

JS_TEXT=r'''/* FR-NAV1.25.0-HF3.6 progressive simplification helpers */
(()=>{'use strict';
const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
ready(()=>{
  const body=document.body;
  if(!body)return;
  // Homepage: suppress an empty saved-checklist box without touching real saved content.
  if(body.classList.contains('hf36-home')){
    const clean=()=>document.querySelectorAll('.navigator-bot .empty-state,.navigator-bot [class*="empty"]').forEach(n=>{if(/No detailed Assistant checklists saved yet|No Assistant/i.test(n.textContent||''))n.dataset.hf36HomeEmpty='1'});
    clean();new MutationObserver(clean).observe(document.querySelector('.navigator-bot')||body,{childList:true,subtree:true});
  }
  // Get It Done: default to six popular tasks; search/category filtering reveals the full matching set.
  if(body.classList.contains('hf36-get-it-done')){
    const search=document.querySelector('[data-task-search]');
    const show=document.querySelector('[data-hf36-show-tasks]');
    const reveal=()=>body.classList.add('hf36-show-all-tasks');
    show?.addEventListener('click',()=>{reveal();show.hidden=true});
    search?.addEventListener('input',()=>{if(search.value.trim())reveal()});
    document.querySelector('[data-task-categories]')?.addEventListener('click',e=>{if(e.target.closest('button'))reveal()});
  }
  // Activities: show a useful first set; filters reveal matching records without deleting data.
  if(body.classList.contains('hf36-activities')){
    const show=document.querySelector('[data-hf36-show-activities]');
    const current=document.querySelector('[data-hf36-show-current]');
    show?.addEventListener('click',()=>{body.classList.add('hf36-show-all-activities');show.hidden=true});
    current?.addEventListener('click',()=>{body.classList.add('hf36-show-current');current.hidden=true});
    const controls=document.querySelector('.explorer-controls');
    controls?.addEventListener('input',()=>body.classList.add('hf36-show-all-activities'));
    controls?.addEventListener('change',()=>body.classList.add('hf36-show-all-activities'));
  }
  // My Franklin: consolidate empty states and only expand when real saved content exists.
  if(body.classList.contains('hf36-my-franklin')){
    const empty=document.querySelector('[data-hf36-saved-empty]');
    const containers=[document.querySelector('[data-saved-profiles]'),document.querySelector('[data-r34-saved-plans]'),document.querySelector('[data-r38-assistant-plans]')].filter(Boolean);
    const update=()=>{
      let any=false;
      containers.forEach(c=>{const meaningful=[...c.children].some(ch=>!ch.classList.contains('empty-state'));c.closest('.hf36-saved-block')?.classList.toggle('hf36-has-saved',meaningful);if(meaningful)any=true});
      if(empty)empty.hidden=any;
      const start=document.querySelector('[data-my-franklin-output]');
      if(start){const t=(start.textContent||'').trim();start.classList.toggle('hf36-empty-starting',/Choose topics below|Choose what matters|Elija/i.test(t))}
    };
    update();containers.forEach(c=>new MutationObserver(update).observe(c,{childList:true,subtree:true}));
  }
  // Help Center: empty output should not take half a screen.
  if(body.classList.contains('hf36-help')){
    const out=document.querySelector('[data-community-help-output]');const aside=document.querySelector('.hf36-help-plan-output');
    const update=()=>{if(!out||!aside)return;const t=(out.textContent||'').trim();aside.classList.toggle('hf36-empty-plan',/Choose one or more broad topics|Elija uno o más/i.test(t)||!t)};
    update();if(out)new MutationObserver(update).observe(out,{childList:true,subtree:true,characterData:true});
  }
});
})();
'''

# Apply lightweight shell change to every public page first.
htmls=list(DIST.rglob('*.html'))
for path in htmls:global_text_pass(path)
# Apply structural changes only to reviewed high-traffic pages.
for rel in [
    'index.html','es/index.html','get-it-done/index.html','es/hacerlo/index.html',
    'activities/index.html','es/actividades/index.html','community/index.html','es/comunidad/index.html',
    'my-franklin/index.html','es/mi-franklin/index.html','business-dashboard/index.html','es/negocios/index.html',
    'community-help-center/index.html','es/centro-de-ayuda/index.html','directory/index.html','es/directorio/index.html',
    'corrections/index.html']:
    p=DIST/rel
    if p.exists():transform_key_page(p)
patch_directory_runtime()
(DIST/'assets/hf36.css').write_text(CSS_TEXT,encoding='utf-8')
(DIST/'assets/hf36.js').write_text(JS_TEXT,encoding='utf-8')

# Release records and the required next-version list.
profile_count=sum(1 for _ in (DIST/'profiles').glob('*/index.html')) if (DIST/'profiles').exists() else 0
explorer_count=sum(1 for p in htmls if 'data-community-explorer' in p.read_text(encoding='utf-8',errors='ignore'))
release={
  'release':RELEASE,'date':'2026-09-11','base':'FR-NAV1.24.0-HF3.5',
  'scope':'Owner-reviewed simplification and regression-safe finishing',
  'counts':{'htmlPages':len(htmls),'profiles':profile_count,'explorers':explorer_count},
  'preserved':['Sports static-first rendering','public profile contact actions','active-member Similar local profiles suppression','free corrections/removal','Profile Factory authority','ordinary Directory ranking neutrality to membership']
}
(ROOT/'PRODUCTION_RELEASE.json').write_text(json.dumps(release,indent=2),encoding='utf-8')
(ROOT/'HF36_BUILD_RECEIPT.json').write_text(json.dumps(release,indent=2),encoding='utf-8')
(ROOT/'NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_25_0_HF36.md').write_text('''# Next Version Improvement List — FR-NAV1.25.0-HF3.6\n\n1. Continue Profile Factory identity-resolution work for near-duplicate legal/business entities beyond the conservative exact-address + normalized-name display suppression used here.\n2. Continue verified link enrichment and richer paid-member profile content as qualified evidence/member submissions become available.\n3. Evaluate resident behavior on simplified task/activity flows before adding any new visible navigation or home-page sections.\n4. Expand browser qualification fixtures for additional Spanish, mobile and accessibility states while preserving the no-loss baseline.\n5. Continue source freshness/currentness refreshes for Today, Activities and local profiles.\n''',encoding='utf-8')
print(json.dumps(release,indent=2))
