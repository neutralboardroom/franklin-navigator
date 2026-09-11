#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse, quote
from datetime import datetime, timezone
import json, re, html

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
RELEASE='FR-NAV1.23.0-HF3.4'
CSS_HREF='/assets/hf34.css?v=frnav1230'
EXPLORER_JS='/assets/hf34-explorer.js?v=frnav1230'
MEMBER_JS='/assets/hf34-member-public.js?v=frnav1230'

catalog=json.loads((DIST/'data/franklin-activities.json').read_text(encoding='utf-8'))
starting=catalog.get('startingPoints',[])
current=catalog.get('currentWindow',[])

SPANISH_PREFIX='/es/'

def route_for(path:Path):
    rel=path.relative_to(DIST).as_posix()
    if rel=='index.html': return '/'
    if rel.endswith('/index.html'): return '/'+rel[:-10]
    return '/'+rel

def is_es(route): return route.startswith('/es/') or route=='/es/'

def tx(route,en,es): return es if is_es(route) else en

def add_class(tag,name):
    if not tag: return
    classes=list(tag.get('class',[]))
    if name not in classes: classes.append(name)
    tag['class']=classes

def mk_tag(soup,name,text=None,**attrs):
    t=soup.new_tag(name)
    for k,v in attrs.items():
        if v is None: continue
        t[k.replace('_','-')]=v
    if text is not None: t.string=text
    return t

def replace_nav(soup,route):
    nav=soup.select_one('header nav.nav')
    if not nav: return
    es=is_es(route)
    core=[
        ('/es/#ask-navigator' if es else '/#ask-navigator','Preguntar a Franklin Assistant' if es else 'Ask Franklin Assistant'),
        ('/es/directorio/' if es else '/directory/','Buscar en Franklin' if es else 'Find Local'),
        ('/es/hacerlo/' if es else '/get-it-done/','Resolver tareas' if es else 'Get It Done'),
    ]
    more=[
        ('/es/hoy/' if es else '/today/','Hoy' if es else 'Today'),
        ('/es/actividades/' if es else '/activities/','Actividades' if es else 'Activities'),
        ('/es/comunidad/' if es else '/community/','Comunidad' if es else 'Community'),
        ('/es/mi-franklin/' if es else '/my-franklin/','Mi Franklin' if es else 'My Franklin'),
        ('/es/negocios/' if es else '/business-dashboard/','Para negocios' if es else 'For businesses'),
        ('/es/centro-de-ayuda/' if es else '/community-help-center/','Centro de ayuda' if es else 'Help Center'),
    ]
    nav.clear()
    nav['class']=['nav','hf34-nav']
    for href,label in core:
        a=mk_tag(soup,'a',label,href=href)
        if (href!='/' and route.startswith(href)) or route==href: a['aria-current']='page'
        nav.append(a)
    d=mk_tag(soup,'details',class_='hf34-nav-more')
    s=mk_tag(soup,'summary','Más' if es else 'More')
    menu=mk_tag(soup,'div',class_='hf34-nav-more-menu')
    for href,label in more:
        a=mk_tag(soup,'a',label,href=href)
        if route.startswith(href): a['aria-current']='page'
        menu.append(a)
    d.append(s);d.append(menu);nav.append(d)

def replace_footer(soup,route):
    nav=soup.select_one('footer .footer-links')
    if not nav: return
    es=is_es(route)
    items=[
        ('/es/centro-de-ayuda/' if es else '/community-help-center/','Centro de ayuda' if es else 'Help Center'),
        ('/es/negocios/' if es else '/business-dashboard/','Para negocios' if es else 'For businesses'),
        ('/membership-start/','Membresía' if es else 'Membership'),
        ('/privacy/','Privacidad' if es else 'Privacy'),
        ('/terms/','Términos' if es else 'Terms'),
        ('/accessibility/','Accesibilidad' if es else 'Accessibility'),
    ]
    nav.clear(); nav['class']=['footer-links','hf34-footer-links']
    for href,label in items: nav.append(mk_tag(soup,'a',label,href=href))

def release_assets(soup):
    head=soup.head
    if not head: return
    for el in list(head.select('link[href*="hf33"],script[src*="hf33"]')): el.decompose()
    meta=head.select_one('meta[name="franklin-release"]')
    if not meta:
        meta=mk_tag(soup,'meta',name='franklin-release'); head.append(meta)
    meta['content']=RELEASE
    if not head.select_one('link[href^="/assets/hf34.css"]'):
        head.append(mk_tag(soup,'link',rel='stylesheet',href=CSS_HREF))

def body_base(soup):
    if soup.body: add_class(soup.body,'hf34')

def scope_match(item,scope):
    cats=item.get('categories',[]); aud=item.get('audiences',[]); sports=item.get('sports',[]); features=item.get('features',[])
    if scope in ('','all'): return True
    if scope.startswith('sport:'): return scope.split(':',1)[1] in sports
    if scope.startswith('sport-group:'): return any(x in sports for x in scope.split(':',1)[1].split(','))
    if scope.startswith('adult-sport:'): return scope.split(':',1)[1] in sports and any(x in ('adult','senior') for x in aud)
    if scope.startswith('feature:'): return scope.split(':',1)[1] in features
    if scope=='adult-leagues': return 'sports' in cats and any(x in ('adult','senior') for x in aud)
    if scope=='youth-leagues': return 'sports' in cats and any(x in ('youth','teen') for x in aud)
    if scope=='youth-family': return 'youth-family' in cats or any(x in ('youth','teen','family') for x in aud)
    return scope in cats

def local(item,key,es):
    return item.get(key+'Es') if es and item.get(key+'Es') else item.get(key,'')

def label(value,es):
    sp={'adult':'Adultos','adaptive':'Recreación adaptada','family':'Familias','senior':'Personas mayores','teen':'Adolescentes','youth':'Niños y jóvenes','basketball':'Baloncesto','baseball':'Béisbol','bowling':'Boliche','cycling':'Ciclismo','football':'Fútbol americano','flag-football':'Fútbol bandera','golf':'Golf','pickleball':'Pickleball','running':'Carreras','soccer':'Fútbol','softball':'Sóftbol','swimming':'Natación','table-tennis':'Tenis de mesa','tennis':'Tenis','volleyball':'Voleibol','FRANKLIN_CORE':'Ciudad de Franklin','WILLIAMSON_COUNTY':'Condado de Williamson'}
    if es and value in sp:return sp[value]
    return str(value).replace('-',' ').replace('_',' ').title()

def explorer_card(soup,item,es):
    c=mk_tag(soup,'article',class_='explorer-card hf34-explorer-card')
    c['data-audience']=' '.join(item.get('audiences',[]));c['data-sports']=' '.join(item.get('sports',[]));c['data-geo']=item.get('geographyTier','')
    c['data-search']=' '.join([item.get('name',''),item.get('nameEs',''),item.get('summary',''),item.get('summaryEs',''),item.get('geographyLabel',''),*item.get('sports',[]),*item.get('audiences',[])]).lower()
    tags=mk_tag(soup,'div',class_='explorer-tags')
    tags.append(mk_tag(soup,'span',local(item,'typeLabel',es),class_='explorer-tag'))
    for x in item.get('audiences',[])[:2]: tags.append(mk_tag(soup,'span',label(x,es),class_='explorer-tag is-age'))
    c.append(tags)
    c.append(mk_tag(soup,'h3',local(item,'name',es)))
    c.append(mk_tag(soup,'p',local(item,'summary',es)))
    if item.get('sports'):
        c.append(mk_tag(soup,'p',('Deportes: ' if es else 'Sports: ')+', '.join(label(x,es) for x in item['sports']),class_='explorer-mini-note'))
    reviewed=item.get('reviewedOn','')
    c.append(mk_tag(soup,'p',('Revisado: ' if es else 'Last checked: ')+reviewed,class_='explorer-mini-note'))
    actions=mk_tag(soup,'div',class_='actions')
    actions.append(mk_tag(soup,'a','Fuente oficial' if es else 'Official source',href=item.get('url','#'),target='_blank',rel='noopener',class_='button small'))
    if item.get('profileRoute'): actions.append(mk_tag(soup,'a','Abrir perfil' if es else 'Open profile',href=item['profileRoute'],class_='button small'))
    c.append(actions)
    choice=mk_tag(soup,'label',class_='explorer-choice')
    inp=mk_tag(soup,'input',type='checkbox',value=item.get('id',''),data_explorer_select='')
    choice.append(inp); choice.append(mk_tag(soup,'span','Guardar en mi lista' if es else 'Save to shortlist'))
    c.append(choice)
    return c

def current_card(soup,item,es):
    c=mk_tag(soup,'article',class_='explorer-current-card')
    c.append(mk_tag(soup,'h3',local(item,'name',es)))
    c.append(mk_tag(soup,'p',local(item,'summary',es)))
    c.append(mk_tag(soup,'p',item.get('location','')))
    a=mk_tag(soup,'a','Confirmar en la fuente' if es else 'Check current source',href=item.get('url','#'),target='_blank',rel='noopener',class_='button small')
    ac=mk_tag(soup,'div',class_='actions');ac.append(a);c.append(ac)
    return c

def collapse_sections(soup,sections,summary,after_node,cls):
    sections=[s for s in sections if s and s.parent]
    if not sections:return
    outer=mk_tag(soup,'section',class_='section '+cls)
    wrap=mk_tag(soup,'div',class_='wrap')
    d=mk_tag(soup,'details',class_='hf34-disclosure')
    d.append(mk_tag(soup,'summary',summary))
    body=mk_tag(soup,'div',class_='hf34-disclosure-body')
    for sec in sections:
        inner=sec.select_one(':scope > .wrap')
        if inner:
            for child in list(inner.children): body.append(child.extract())
        sec.decompose()
    d.append(body);wrap.append(d);outer.append(wrap)
    after_node.insert_after(outer)

def transform_explorer(soup,route):
    root=soup.select_one('[data-community-explorer]')
    if not root:return
    add_class(soup.body,'hf34-explorer')
    scope=soup.body.get('data-explorer-scope','all')
    es=is_es(route)
    scoped=[x for x in starting if scope_match(x,scope)]
    scoped.sort(key=lambda x:(0 if x.get('geographyTier')=='FRANKLIN_CORE' else 1, x.get('name','')))
    # Remove legacy high-risk explorer mutation/runtime scripts.
    for sc in list(soup.select('script[src]')):
        src=sc.get('src','')
        if any(k in src for k in ('community-explorer.js','hf31-deep-language-runtime.js','hf33-explorer-preload.js')): sc.decompose()
    hero=root.select_one('.explorer-hero')
    if hero:
        card=hero.select_one('.explorer-hero-card')
        if card: card.decompose()
    finder=root.select_one('#finder')
    if hero and finder:
        finder.extract(); hero.insert_after(finder)
    grid=root.select_one('[data-explorer-grid]')
    if grid:
        grid.clear()
        for item in scoped:grid.append(explorer_card(soup,item,es))
    summary=root.select_one('[data-explorer-summary]')
    if summary: summary.string=('Mostrando ' if es else 'Showing ')+f'{len(scoped)} '+('opciones locales' if es else 'local options')
    empty=root.select_one('[data-explorer-empty]')
    if empty: empty['hidden']=''
    sport=root.select_one('[data-explorer-sport]')
    if sport:
        first=sport.find('option')
        sport.clear(); sport.append(first or mk_tag(soup,'option','Todos' if es else 'All',value=''))
        vals=sorted({v for i in scoped for v in i.get('sports',[])})
        for v in vals:sport.append(mk_tag(soup,'option',label(v,es),value=v))
    controls=root.select_one('.explorer-controls')
    if controls and len(scoped)<=4:add_class(controls,'hf34-small-results')
    # Render valid current items at build time; hide empty current sections.
    csec=root.select_one('[data-explorer-current-section]'); cgrid=root.select_one('[data-explorer-current]')
    now=datetime.now(timezone.utc)
    visible=[]
    for i in current:
        if not scope_match(i,scope) or i.get('status')=='CANCELED':continue
        try:
            dt=datetime.fromisoformat(i.get('expiresAt','').replace('Z','+00:00'))
            if dt.tzinfo and dt.astimezone(timezone.utc)>now:visible.append(i)
        except: pass
    if cgrid:
        cgrid.clear()
        for i in visible:cgrid.append(current_card(soup,i,es))
    if csec and not visible:csec['hidden']=''
    # Deep pages should not show generic Franklin Recreation Complex notice unless they are facilities pages.
    if 'facilities' not in route and 'instalaciones' not in route:
        addr=root.select_one('.explorer-address')
        if addr:
            sec=addr.find_parent('section')
            if sec:sec.decompose()
    # Collapse broad cross-navigation and explanatory material.
    hubs=next((s for s in root.find_all('section',recursive=False) if 'Activity hubs' in str(s.get('aria-label','')) or 'Centros de actividades' in str(s.get('aria-label',''))),None)
    routes=root.select_one('section.explorer-sport-routes')
    if finder: collapse_sections(soup,[hubs,routes],'Explorar otros deportes y actividades' if es else 'Explore other sports and activities',finder,'hf34-explorer-more')
    prep=next((s for s in root.find_all('section',recursive=False) if 'Prepare before contacting' in s.get_text(' ',strip=True) or 'Check the details before you register' in s.get_text(' ',strip=True)),None)
    about=next((s for s in root.find_all('section',recursive=False) if 'What these results include' in s.get_text(' ',strip=True)),None)
    organizer=next((s for s in root.find_all('section',recursive=False) if 'For local organizers' in s.get_text(' ',strip=True)),None)
    anchor=root.select_one('.hf34-explorer-more') or finder
    if anchor: collapse_sections(soup,[prep,about,organizer],'Antes de inscribirse y sobre estos resultados' if es else 'Before you register and about these results',anchor,'hf34-explorer-info')
    short=root.select_one('#short-list')
    if short: short['hidden']=''
    sticky=root.select_one('.explorer-shortlist')
    if sticky: sticky['hidden']=''
    # Add deterministic lightweight filter/shortlist runtime.
    if not soup.select_one('script[src^="/assets/hf34-explorer.js"]'):
        soup.body.append(mk_tag(soup,'script',src=EXPLORER_JS,defer=''))

def transform_business(soup,route):
    if route not in ('/business-dashboard/','/es/negocios/'):return
    add_class(soup.body,'hf34-business')
    es=is_es(route)
    hero=soup.select_one('.r29-hero')
    if hero:
        card=hero.select_one('.r29-local-card')
        if card:card.decompose()
        h=hero.find('h1'); lead=hero.select_one('.r29-lead'); acts=hero.select_one('.actions')
        if h:h.string='Haga crecer su presencia local en Franklin.' if es else 'Grow your local presence in Franklin.'
        if lead:lead.string='Empiece con su perfil público. Corríjalo gratis y vea lo que añade la Membresía Comunitaria.' if es else 'Start with your public profile. Correct it for free, then see what Community Membership can add.'
        if acts:
            acts.clear();acts.append(mk_tag(soup,'a','Buscar o revisar mi perfil' if es else 'Find or review my profile',href='/claim-profile/',class_='button primary'));acts.append(mk_tag(soup,'a','Ver membresía' if es else 'See membership',href='/member-profile-preview/',class_='button'))
    # Turn the process list into one quiet disclosure.
    for sec in soup.select('main > section.section'):
        if 'Your Franklin community path' in sec.get_text(' ',strip=True):
            wrap=sec.select_one('.wrap') or sec
            ol=wrap.find('ol'); h=wrap.find('h2')
            if h:h.decompose()
            if ol:
                ol.extract();d=mk_tag(soup,'details',class_='hf34-disclosure');d.append(mk_tag(soup,'summary','How it works'));body=mk_tag(soup,'div',class_='hf34-disclosure-body');body.append(ol);d.append(body);wrap.append(d)
    # Plain-language benefits.
    for p in soup.find_all('p'):
        t=p.get_text(' ',strip=True)
        if 'Prepare controlled audience plans' in t:
            p.string='Use practical English, Spanish or bilingual tools to plan local outreach and community participation.'
    plan=soup.select_one('.r29-plan')
    if plan:
        ul=plan.find('ul') or mk_tag(soup,'ul',class_='check-list')
        if not ul.parent:plan.append(ul)
        benefit='Active member profiles do not show Similar local profiles on their own profile page.'
        if benefit not in plan.get_text(' ',strip=True):ul.append(mk_tag(soup,'li',benefit))
        if not plan.select_one('.hf34-membership-cta'):
            plan.append(mk_tag(soup,'a','See Community Membership',href='/member-profile-preview/',class_='button primary hf34-membership-cta'))
    one=soup.select_one('.r29-one-action')
    if one:one.decompose()
    # Preserve member starter planner without an extra full-width sales section.
    free=next((s for s in soup.select('main > section') if 'Free tools today' in s.get_text(' ',strip=True)),None)
    if free:
        acts=free.select_one('.actions')
        if acts and not acts.find('a',href='/member-starter-plan/'):
            acts.append(mk_tag(soup,'a','Build member starter plan',href='/member-starter-plan/',class_='button'))
    for sec in list(soup.select('main > section')):
        if 'Start with value, not a sales call' in sec.get_text(' ',strip=True):sec.decompose()

def transform_help(soup,route):
    if route not in ('/community-help-center/','/es/centro-de-ayuda/'):return
    add_class(soup.body,'hf34-help')
    main=soup.select_one('main'); es=is_es(route)
    if not main:return
    direct=[x for x in main.find_all('section',recursive=False)]
    hero=direct[0] if direct else None
    urgent=next((s for s in direct if 'Call 911' in s.get_text(' ',strip=True) or 'Llame al 911' in s.get_text(' ',strip=True)),None)
    planner=next((s for s in direct if 'See the whole situation' in s.get_text(' ',strip=True) or 'situación completa' in s.get_text(' ',strip=True)),None)
    common=next((s for s in direct if 'Prepare before you call' in s.get_text(' ',strip=True) or 'Prepárese antes' in s.get_text(' ',strip=True)),None)
    anchor=hero
    for s in (urgent,planner,common):
        if s and anchor:
            s.extract();anchor.insert_after(s);anchor=s
    # Replace architecture-style eyebrows with user language.
    for e in main.select('.eyebrow'):
        if re.search(r'\b\d+\s+DEEP\b|TRACKS|PATHWAYS',e.get_text(' ',strip=True),re.I):e.string='Más ayuda' if es else 'More help'
    # Keep only the essential first flow visible; put specialized modules behind one disclosure.
    keep={x for x in (hero,urgent,planner,common) if x}
    rest=[s for s in main.find_all('section',recursive=False) if s not in keep]
    if anchor and rest:collapse_sections(soup,rest,'Más herramientas y guías especializadas' if es else 'More tools and specialized guides',anchor,'hf34-help-more')

def transform_corrections(soup,route):
    if route!='/corrections/':return
    add_class(soup.body,'hf34-corrections')
    form=soup.select_one('[data-profile-control-form]')
    if form:
        lab=next((l for l in form.find_all('label') if l.find('input',attrs={'name':'profileId'})),None)
        if lab:add_class(lab,'hf34-internal-field')
        ta=form.find('textarea',attrs={'name':'details'})
        if ta and ta.parent:
            texts=[x for x in ta.parent.contents if isinstance(x,NavigableString)]
            if texts:
                texts[0].replace_with('What information is wrong, and what should it say instead?')
    det=soup.select_one('details.r22-disclosure')
    if det:add_class(det,'hf34-disclosure')

def transform_directory(soup,route):
    if route in ('/directory/','/es/directorio/'):
        add_class(soup.body,'hf34-directory')

def add_profile_id_to_url(href,pid):
    if not href or not href.startswith('/corrections/'):return href
    p=urlparse(href);qs=dict(parse_qsl(p.query,keep_blank_values=True));qs.setdefault('profile',pid)
    return urlunparse((p.scheme,p.netloc,p.path,p.params,urlencode(qs),p.fragment))

def transform_profile(soup,route):
    m=re.match(r'^/profiles/([^/]+)/$',route)
    if not m:return
    pid=m.group(1);add_class(soup.body,'hf34-profile');soup.body['data-profile-id']=pid
    # Give correction/removal links the actual profile id.
    for a in soup.find_all('a',href=True):
        if a['href'].startswith('/corrections/'):a['href']=add_profile_id_to_url(a['href'],pid)
    # Make About specific to the actual listing instead of database boilerplate.
    name=(soup.select_one('.r22-profile-hero h1') or mk_tag(soup,'span','this profile')).get_text(' ',strip=True)
    cat=(soup.select_one('.r22-profile-hero .eyebrow') or mk_tag(soup,'span','')).get_text(' ',strip=True)
    loc=(soup.select_one('.profile-location') or mk_tag(soup,'span','Franklin')).get_text(' ',strip=True)
    article=soup.select_one('.r22-profile-layout > article')
    if article:
        first=article.find('section',recursive=False)
        if first:
            h=first.find('h2');p=first.find('p')
            if h:h.string=f'About {name}'
            if p and ('public information about this listing' in p.get_text().lower() or 'public-source profile' in p.get_text().lower()):
                p.string=f'{name} is listed as {cat or "a local organization"} at {loc}. Use the verified contact and source links on this page to confirm current services, hours, pricing and availability.'
        facts=article.select_one('.profile-facts-grid')
        if facts:
            for d in list(facts.find_all('div',recursive=False)):
                if 'Business or organization' in d.get_text(' ',strip=True):d.decompose()
        manage=next((s for s in article.find_all('section',recursive=False) if 'Suggest a correction or claim this profile' in s.get_text(' ',strip=True)),None)
        if manage:
            h=manage.find('h2');p=manage.find('p');acts=manage.select_one('.actions')
            if h:h.string='Manage this profile'
            if p:p.string='Claiming, factual corrections and public-profile removal are separate. Corrections and removal requests are free.'
            if acts and not any('PUBLIC_REMOVAL' in a.get('href','') for a in acts.find_all('a',href=True)):
                url='https://franklinnavigator.com'+route
                acts.append(mk_tag(soup,'a','Request removal from public view',href=f'/corrections/?action=PUBLIC_REMOVAL&profile={quote(pid)}&url={quote(url,safe="")}',class_='button'))
    # Replace old member runtime with the audited HF3.4 runtime.
    for sc in list(soup.select('script[src$="/assets/member-public.js"],script[src="/assets/member-public.js"]')):sc.decompose()
    if not soup.select_one('script[src^="/assets/hf34-member-public.js"]'):soup.body.append(mk_tag(soup,'script',src=MEMBER_JS,defer=''))

def scrub_public_jargon(soup,route):
    # Only modify rendered text nodes, never scripts/styles/data.
    replacements=[
        (re.compile(r'controlled audience plans?',re.I),'local outreach plans'),
        (re.compile(r'raw list export[^.]*\.?',re.I),'practical community outreach tools.'),
        (re.compile(r'consumer acceptance',re.I),'current publication review'),
        (re.compile(r'producer-qualified',re.I),'source-reviewed'),
        (re.compile(r'canonicalization',re.I),'record review'),
        (re.compile(r'\bingestion\b',re.I),'data update'),
    ]
    for node in list(soup.find_all(string=True)):
        if node.parent and node.parent.name in ('script','style','code','textarea'):continue
        text=str(node);new=text
        for rx,repl in replacements:new=rx.sub(repl,new)
        if new!=text:node.replace_with(new)

def write_assets():
    css=r'''/* Franklin Navigator HF3.4 — audited simplification. No automatic color guessing. */
:root{--hf34-ink:#172126;--hf34-muted:#52666a;--hf34-line:#d9e4e2;--hf34-soft:#f5faf9;--hf34-teal:#07575d;--hf34-dark:#064e54;--hf34-link:#075e66}
body.hf34{background:#fff;color:var(--hf34-ink)}
body.hf34 main>.hero,body.hf34 main>.r22-hero,body.hf34 main>.r29-hero,body.hf34 main>.explorer-hero{padding-block:clamp(26px,3vw,42px)!important}
body.hf34 main h1{font-size:clamp(2rem,3.15vw,3.15rem);line-height:1.06;letter-spacing:-.03em}
body.hf34 .section{padding-block:clamp(28px,3vw,42px)}
body.hf34 header .top{min-height:64px}
.hf34-nav{display:flex;align-items:center;gap:18px}.hf34-nav>a,.hf34-nav summary{font-weight:800;text-decoration:none;color:#10282c;white-space:nowrap}.hf34-nav-more{position:relative}.hf34-nav-more>summary{list-style:none;cursor:pointer}.hf34-nav-more>summary::-webkit-details-marker{display:none}.hf34-nav-more>summary::after{content:' ▾'}.hf34-nav-more[open]>summary::after{content:' ▴'}.hf34-nav-more-menu{position:absolute;right:0;top:calc(100% + 10px);z-index:40;min-width:220px;background:#fff;border:1px solid var(--hf34-line);border-radius:12px;box-shadow:0 14px 32px rgba(18,47,50,.12);padding:8px;display:grid;gap:2px}.hf34-nav-more-menu a{padding:10px 12px;border-radius:8px;text-decoration:none;color:#12363a}.hf34-nav-more-menu a:hover,.hf34-nav-more-menu a:focus-visible{background:#edf7f5}
.hf34-footer-links{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px!important}.footer{padding-block:28px 34px!important}
.hf34-disclosure{border:1px solid var(--hf34-line);border-radius:12px;background:#fff}.hf34-disclosure>summary{cursor:pointer;list-style:none;font-weight:800;color:var(--hf34-link);padding:14px 16px}.hf34-disclosure>summary::-webkit-details-marker{display:none}.hf34-disclosure>summary::after{content:' ▾'}.hf34-disclosure[open]>summary::after{content:' ▴'}.hf34-disclosure-body{padding:0 16px 16px}.hf34-disclosure-body>.section,.hf34-disclosure-body>.wrap{padding:0!important}
/* Explicit dark surfaces only. */
body.hf34 :is(.urgent-section,.history-section,.growth-trust,.growth-boundaries,.home-command-bar){color:#f8fcfb!important}body.hf34 :is(.urgent-section,.history-section,.growth-trust,.growth-boundaries,.home-command-bar) :is(h1,h2,h3,h4,p,li,span,strong,small,label){color:inherit!important}body.hf34 :is(.urgent-section,.history-section,.growth-trust,.growth-boundaries,.home-command-bar) a{color:#fff0a8!important}body.hf34 :is(.urgent-section,.history-section,.growth-trust,.growth-boundaries,.home-command-bar) :is(.card,.r22-card,.r29-panel){color:var(--hf34-ink)!important}
/* Explorer: useful HTML first; JS only filters. */
body.hf34-explorer .explorer-hero-grid{grid-template-columns:1fr!important}body.hf34-explorer #finder{padding-block:26px!important}body.hf34-explorer .explorer-controls{padding:14px!important;gap:10px!important}body.hf34-explorer .explorer-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}body.hf34-explorer .explorer-card{padding:16px!important}body.hf34-explorer .explorer-choice{margin-top:10px}body.hf34-explorer .hf34-small-results>label:not(:first-child),body.hf34-explorer .hf34-small-results>[data-explorer-reset]{display:none!important}body.hf34-explorer #short-list[hidden],body.hf34-explorer .explorer-shortlist[hidden],body.hf34-explorer [data-explorer-current-section][hidden]{display:none!important}.hf34-explorer-more,.hf34-explorer-info{padding-block:10px 18px!important}
/* Corrections: never light-on-light. */
body.hf34-corrections main,body.hf34-corrections main :is(h1,h2,h3,p,label,span,strong,small){color:var(--hf34-ink)!important}body.hf34-corrections .hero{background:linear-gradient(100deg,#f2faf8,#fff9f1)!important}body.hf34-corrections .p0-control-form{background:#fff;border:1px solid var(--hf34-line);border-radius:16px;padding:20px;gap:14px}body.hf34-corrections .p0-control-form label{font-weight:750;color:var(--hf34-ink)!important}body.hf34-corrections .p0-control-form :is(input,select,textarea){background:#fff;color:#111;border:1px solid #9bb2b0;border-radius:8px;padding:10px}body.hf34-corrections .hf34-internal-field{display:none!important}body.hf34-corrections .r37-status{color:var(--hf34-ink)!important}
/* Business: fewer sales bands, one clear path. */
body.hf34-business .r29-hero-grid{grid-template-columns:minmax(0,780px)!important}body.hf34-business .r29-plan-grid{grid-template-columns:minmax(0,680px)!important;justify-content:center}body.hf34-business .r29-plan{max-width:680px;width:100%;box-sizing:border-box}body.hf34-business .hf34-membership-cta{display:block;margin-top:18px;text-align:center}body.hf34-business .r29-panel{min-height:0}
/* Directory */
body.hf34-directory .r22-directory-toolbar{position:sticky;top:64px;z-index:8;background:#fff;padding-block:10px}body.hf34-directory .r22-profile-result{padding:16px!important}
/* Public profiles: polished record, related profiles below instead of a top competitor rail. */
body.hf34-profile{background:#f7f9fa}body.hf34-profile main{background:#f7f9fa}body.hf34-profile .breadcrumbs{padding-block:12px}body.hf34-profile .r22-profile-hero{background:#fff;border-block:1px solid var(--hf34-line);padding-block:26px}body.hf34-profile .r22-profile-hero-grid{display:grid!important;grid-template-columns:auto minmax(0,1fr) minmax(210px,280px)!important;gap:22px!important;align-items:start!important}body.hf34-profile .profile-avatar{width:76px!important;height:76px!important;min-width:76px!important;border-radius:16px!important;font-size:1.2rem!important}body.hf34-profile .r22-profile-hero h1{font-size:clamp(2rem,3vw,3rem)!important;margin:.15rem 0 .35rem}body.hf34-profile .profile-primary-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}body.hf34-profile .profile-utility-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;font-size:.92rem}body.hf34-profile .profile-currentness{font-size:.88rem;color:var(--hf34-muted)}body.hf34-profile .r22-profile-layout{display:grid!important;grid-template-columns:1fr!important;gap:18px!important}body.hf34-profile .r22-profile-layout>article{display:grid;gap:16px}body.hf34-profile .r22-profile-layout>article>section,body.hf34-profile .r22-profile-side .r22-card,body.hf34-profile [data-member-publication] .hf34-member-module{background:#fff;border:1px solid var(--hf34-line);border-radius:15px;padding:20px;margin:0}body.hf34-profile .r22-profile-side{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px!important}body.hf34-profile .profile-facts-grid{display:flex!important;flex-wrap:wrap;gap:8px!important}body.hf34-profile .profile-facts-grid>div{min-width:0!important;border:1px solid var(--hf34-line);border-radius:999px;background:var(--hf34-soft);padding:8px 12px!important}body.hf34-profile [data-member-publication]{padding-top:0!important}body.hf34-profile .hf34-member-module{margin-top:14px!important}body.hf34-profile .hf34-member-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}body.hf34-profile .hf34-member-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}body.hf34-profile .hf34-member-gallery img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px}body.hf34-profile .hf34-online{display:flex;flex-wrap:wrap;gap:8px}.hf34-member-badge{display:inline-block;background:#eaf6f4;color:#07545a;border-radius:999px;padding:5px 9px;font-size:.8rem;font-weight:800;margin-bottom:8px}
/* Help center */
body.hf34-help .urgent-section{margin-top:0!important}body.hf34-help .hf34-help-more{padding-block:12px 28px!important}
@media(max-width:960px){body.hf34-explorer .explorer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}body.hf34-profile .r22-profile-hero-grid{grid-template-columns:auto 1fr!important}body.hf34-profile .profile-currentness{grid-column:2}body.hf34-profile .r22-profile-side{grid-template-columns:1fr 1fr}}
@media(max-width:720px){header .top{align-items:flex-start}.hf34-nav{gap:12px;flex-wrap:wrap}.hf34-nav-more-menu{left:0;right:auto}.hf34-footer-links{grid-template-columns:1fr}body.hf34-explorer .explorer-grid{grid-template-columns:1fr}body.hf34-profile .r22-profile-hero-grid{grid-template-columns:1fr!important}body.hf34-profile .profile-currentness{grid-column:auto}body.hf34-profile .r22-profile-side,body.hf34-profile .hf34-member-grid{grid-template-columns:1fr}body.hf34-profile .hf34-member-gallery{grid-template-columns:1fr 1fr}}
@media print{.r37-language-switch,.hf34-nav-more,body.hf34-profile .profile-utility-actions{display:none!important}}
'''
    (DIST/'assets/hf34.css').write_text(css,encoding='utf-8')
    explorer=r'''(()=>{'use strict';const root=document.querySelector('[data-community-explorer]');if(!root)return;const q=(s)=>root.querySelector(s),qa=(s)=>[...root.querySelectorAll(s)];const cards=qa('.hf34-explorer-card');const search=q('[data-explorer-search]'),aud=q('[data-explorer-audience]'),sport=q('[data-explorer-sport]'),geo=q('[data-explorer-geography]'),reset=q('[data-explorer-reset]'),summary=q('[data-explorer-summary]'),empty=q('[data-explorer-empty]');const selected=new Set(),short=q('#short-list'),output=q('[data-explorer-output]'),copy=q('[data-explorer-copy]'),download=q('[data-explorer-download]'),print=q('[data-explorer-print]'),count=q('[data-explorer-selected-count]'),build=q('[data-explorer-build]'),clear=q('[data-explorer-clear]'),bar=root.querySelector('.explorer-shortlist');const visible=()=>{const needle=(search?.value||'').trim().toLowerCase(),a=aud?.value||'',s=sport?.value||'',g=geo?.value||'';let n=0;cards.forEach(c=>{const ok=(!needle||(c.dataset.search||'').includes(needle))&&(!a||(c.dataset.audience||'').split(' ').includes(a))&&(!s||(c.dataset.sports||'').split(' ').includes(s))&&(!g||c.dataset.geo===g);c.hidden=!ok;if(ok)n++});if(summary)summary.textContent=`Showing ${n} of ${cards.length} local options`;if(empty)empty.hidden=n!==0};[search,aud,sport,geo].forEach(x=>x?.addEventListener(x.tagName==='INPUT'?'input':'change',visible));reset?.addEventListener('click',()=>{if(search)search.value='';if(aud)aud.value='';if(sport)sport.value='';if(geo)geo.value='';visible();search?.focus()});function sync(){qa('[data-explorer-select]').forEach(x=>x.checked=selected.has(x.value));if(count)count.textContent=`${selected.size} selected`;if(bar)bar.hidden=selected.size===0;if(build)build.disabled=selected.size===0;if(clear)clear.disabled=selected.size===0}qa('[data-explorer-select]').forEach(x=>x.addEventListener('change',()=>{x.checked?selected.add(x.value):selected.delete(x.value);sync()}));build?.addEventListener('click',()=>{if(!selected.size)return;if(short)short.hidden=false;const rows=cards.filter(c=>selected.has(c.querySelector('[data-explorer-select]')?.value));if(output)output.textContent=['My Franklin activity short list','',...rows.map((c,i)=>`${i+1}. ${c.querySelector('h3')?.textContent||''}`),'','Confirm current details at the original source before registering or traveling.'].join('\n');copy&&(copy.disabled=false);download&&(download.disabled=false);print&&(print.disabled=false);short?.scrollIntoView({behavior:'smooth',block:'start'})});clear?.addEventListener('click',()=>{selected.clear();if(short)short.hidden=true;sync()});copy?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output?.textContent||'')}catch{output?.focus()}});download?.addEventListener('click',()=>{const b=new Blob([output?.textContent||''],{type:'text/plain'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='franklin-activity-shortlist.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),0)});print?.addEventListener('click',()=>window.print());visible();sync()})();'''
    (DIST/'assets/hf34-explorer.js').write_text(explorer,encoding='utf-8')
    member=r'''(()=>{'use strict';const m=location.pathname.match(/^\/profiles\/([^/]+)\/$/);if(!m)return;const id=decodeURIComponent(m[1]),main=document.querySelector('main');if(!/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(id))return;const API='https://franklin-navigator-membership.onrender.com';const n=(t,x,c)=>{const e=document.createElement(t);if(x!==undefined)e.textContent=x;if(c)e.className=c;return e};const safe=v=>{try{const u=new URL(String(v||''));return u.protocol==='https:'&&!u.username&&!u.password?u:null}catch{return null}};const lines=v=>String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);function related(){return [...document.querySelectorAll('.r22-profile-side .r22-card')].find(x=>/Related local profiles|Similar local profiles/i.test(x.querySelector('h2')?.textContent||''))}function addAction(label,value){const u=safe(value);if(!u)return;const box=document.querySelector('.profile-primary-actions');if(!box)return;if([...box.querySelectorAll('a')].some(a=>a.href===u.href))return;const a=n('a',label,'button');a.href=u.href;a.rel='noopener noreferrer ugc';box.append(a)}async function run(){try{const l=await fetch('/data/public-profile-suppressions.json',{cache:'no-store'});if(!l.ok)throw 0;const d=await l.json();if((d.entries||[]).some(e=>e&&e.profileId===id&&e.status==='SUPPRESSED')){document.title='Profile unavailable | Franklin Navigator';if(main){main.innerHTML='<section class="section"><div class="wrap narrow"><h1>This profile is not publicly displayed.</h1><p>This profile has been removed from Franklin Navigator public view.</p></div></section>'}return}}catch{if(main){main.innerHTML='<section class="section"><div class="wrap narrow"><h1>This profile is temporarily unavailable.</h1><p>Franklin Navigator could not verify the public-display status of this profile. Please try again shortly.</p></div></section>'}return}let out;try{const r=await fetch(API+'/api/member/public-profile?profileId='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});if(!r.ok)return;out=await r.json()}catch{return}if(out.activePaidMember===true){related()?.remove();document.body.dataset.activeMember='true'}const p=out.publication;if(!p||p.profileId!==id||p.provenance!=='MEMBER_SUBMITTED_REVIEWED')return;const f=p.fields||{};addAction('Website',f.website);addAction('Contact',f.contactUrl);addAction('Book',f.bookingUrl);addAction('Get a quote',f.quoteUrl);addAction('Menu',f.menuUrl);addAction('Order',f.orderUrl);addAction('Directions',f.directionsUrl);const image=safe(f.profileImageUrl);if(image){const av=document.querySelector('.profile-avatar');if(av){av.textContent='';const img=document.createElement('img');img.src=image.href;img.alt='';img.className='hf34-profile-image';av.append(img)}}const section=n('section','', 'section');section.dataset.memberPublication='';const wrap=n('div','', 'wrap');section.append(wrap);wrap.append(n('span','Community Member','hf34-member-badge'),n('h2','More about this business'));function mod(h,v){if(!String(v||'').trim())return;const s=n('section','', 'hf34-member-module');s.append(n('h3',h),n('p',String(v).trim()));wrap.append(s)}mod('About',f.summary);mod('Services & specialties',f.services);const details=[['Hours',f.hours],['Service area',f.serviceArea],['Pricing & payment',f.pricing],['Languages',f.languages],['Accessibility',f.accessibility]].filter(x=>String(x[1]||'').trim());if(details.length){const s=n('section','', 'hf34-member-module');s.append(n('h3','Details'));const g=n('div','', 'hf34-member-grid');details.forEach(([a,b])=>{const c=n('div','', 'card');c.append(n('strong',a),n('p',b));g.append(c)});s.append(g);wrap.append(s)}[['Experience',f.experience],['Credentials & certifications',f.credentials],['Awards & honors',f.awards],['Associations',f.associations],['Education & training',f.education],['Publications, media & speaking',f.publications],['Offers & events',f.offersEvents]].forEach(x=>mod(...x));const gallery=lines(f.galleryUrls).map(safe).filter(Boolean).slice(0,8);if(gallery.length){const s=n('section','', 'hf34-member-module');s.append(n('h3','Gallery'));const g=n('div','', 'hf34-member-gallery');gallery.forEach(u=>{const i=document.createElement('img');i.src=u.href;i.alt='';i.loading='lazy';g.append(i)});s.append(g);wrap.append(s)}const social=lines(f.socialLinks).map(safe).filter(Boolean).slice(0,12);if(social.length){const s=n('section','', 'hf34-member-module');s.append(n('h3','Online presence'));const g=n('div','', 'hf34-online');social.forEach(u=>{const a=n('a',u.hostname.replace(/^www\./,''),'button');a.href=u.href;a.rel='noopener noreferrer ugc';g.append(a)});s.append(g);wrap.append(s)}const base=document.querySelector('.r22-profile-layout')?.closest('.section');base?.insertAdjacentElement('afterend',section)}run()})();'''
    (DIST/'assets/hf34-member-public.js').write_text(member,encoding='utf-8')
    profile_control=r'''(()=>{'use strict';const q=(s,r=document)=>r.querySelector(s),form=q('[data-profile-control-form]');if(!form)return;const params=new URLSearchParams(location.search),listing=q('[name="listing"]',form),url=q('[name="url"]',form),profile=q('[name="profileId"]',form),type=q('[name="requestType"]',form),status=q('[data-profile-control-status]'),lang=document.documentElement.lang==='es'?'es':'en',tx=(a,b)=>lang==='es'?b:a;if(params.get('listing'))listing.value=params.get('listing').slice(0,180);if(params.get('url'))url.value=params.get('url').slice(0,800);let pid=params.get('profile')||'';if(!pid&&params.get('url')){const m=params.get('url').match(/\/profiles\/(FR-[A-Z0-9]+-[A-Za-z0-9._-]+)\//);if(m)pid=m[1]}if(/^FR-[A-Z0-9]+-[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(pid))profile.value=pid;if(params.get('action')==='PUBLIC_REMOVAL')type.value='PUBLIC_REMOVAL';function sync(){const r=type.value==='PUBLIC_REMOVAL';form.querySelectorAll('[data-removal-only]').forEach(x=>x.hidden=!r);const a=q('[name="authorityConfirmed"]',form);if(a)a.required=r}type.addEventListener('change',sync);sync();form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const fd=new FormData(form),kind=String(fd.get('requestType')||'CORRECTION'),removal=kind==='PUBLIC_REMOVAL';status.className='r37-status';status.textContent=tx('Submitting your free request…','Enviando su solicitud gratuita…');const lines=[removal?'PUBLIC PROFILE REMOVAL REQUEST':'FACTUAL PROFILE CORRECTION REQUEST',`Listing: ${String(fd.get('listing')||'').trim()}`,`Requester: ${String(fd.get('requesterName')||'').trim()} <${String(fd.get('requesterEmail')||'').trim()}>`,`Page: ${String(fd.get('url')||'').trim()||'not supplied'}`];if(removal)lines.push(`Authority statement: ${String(fd.get('authorityBasis')||'').trim()}`,`Authority attested: ${fd.get('authorityConfirmed')?'yes':'no'}`);lines.push(`Details: ${String(fd.get('details')||'').trim()}`,'No membership or payment is required for this request.');try{const r=await fetch('https://franklin-navigator-membership.onrender.com/api/support/request',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:removal?'PROFILE_PUBLIC_REMOVAL':'PROFILE_FACTUAL_CORRECTION',profileId:String(fd.get('profileId')||'').trim(),preferredLanguage:lang==='es'?'SPANISH':'ENGLISH',message:lines.join('\n')})});let d={};try{d=await r.json()}catch{}if(!r.ok)throw 0;form.querySelector('button[type="submit"]').disabled=true;status.className='r37-status good';status.textContent=tx(`Request received. Reference ${d.requestId}. No payment was made.`,`Solicitud recibida. Referencia ${d.requestId}. No se realizó ningún pago.`);status.focus()}catch{status.className='r37-status warn';status.textContent=tx('We could not submit the request. No payment was made. Please try again or email community@franklinnavigator.com.','No pudimos enviar la solicitud. Inténtelo de nuevo o escriba a community@franklinnavigator.com.');status.focus()}})})();'''
    (DIST/'assets/profile-control.js').write_text(profile_control,encoding='utf-8')

def main():
    write_assets()
    pages=list(DIST.rglob('*.html'))
    counts={'pages':0,'profiles':0,'explorers':0}
    for path in pages:
        route=route_for(path)
        text=path.read_text(encoding='utf-8',errors='replace')
        soup=BeautifulSoup(text,'html.parser')
        body_base(soup);release_assets(soup);replace_nav(soup,route);replace_footer(soup,route)
        transform_explorer(soup,route);transform_business(soup,route);transform_help(soup,route);transform_corrections(soup,route);transform_directory(soup,route);transform_profile(soup,route);scrub_public_jargon(soup,route)
        path.write_text(str(soup),encoding='utf-8')
        counts['pages']+=1
        if route.startswith('/profiles/'):counts['profiles']+=1
        if soup.select_one('[data-community-explorer]'):counts['explorers']+=1
    (ROOT/'HF34_BUILD_RECEIPT.json').write_text(json.dumps({'release':RELEASE,**counts,'base':'rollback-pre-HF3.3','strategy':'build-time static simplification; no global DOM mutation; deterministic explorer cards'},indent=2),encoding='utf-8')
    print(json.dumps(counts,indent=2))
if __name__=='__main__':main()
