#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import re

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'

# 1) Get It Done: preserve the six-card progressive disclosure even though HF3.9
# makes task cards flex containers. Also keep filtered/hidden cards truly hidden.
css=DIST/'assets/hf39.css'
s=css.read_text(encoding='utf-8')
addition='''
/* HF3.9 qualification fix: preserve progressive task disclosure and filtering. */
body.hf36-get-it-done:not(.hf36-show-all-tasks) .task-card.hf36-extra-task{display:none!important}
.hf39-get-it-done .task-card[hidden]{display:none!important}
'''
if 'HF3.9 qualification fix: preserve progressive task disclosure' not in s:
    css.write_text(s.rstrip()+addition+'\n',encoding='utf-8')

# The older helper reveals all tasks as soon as search begins. HF3.9 adds the
# missing final resident-facing filter: match the visible task name/category,
# not deep explanatory copy, so "permit" produces the permit task instead of
# incidental mentions such as permit history.
p=DIST/'assets/hf39.js'
s=p.read_text(encoding='utf-8')
marker="function taskFiltering(){"
if marker not in s:
    insert="""
function taskFiltering(){if(!document.body.classList.contains('hf39-get-it-done'))return;const search=q('[data-task-search]'),grid=q('[data-task-grid]'),empty=q('[data-task-empty]');if(!search||!grid)return;const cards=qa('.task-card',grid);const apply=()=>{const needle=String(search.value||'').trim().toLowerCase();if(!needle)return;let shown=0;cards.forEach(card=>{const title=(q('h3',card)?.textContent||'').toLowerCase(),category=(card.dataset.category||'').toLowerCase(),match=title.includes(needle)||category.includes(needle);card.hidden=!match;if(match)shown++});if(empty)empty.hidden=shown!==0};search.addEventListener('input',apply);}
"""
    if "document.addEventListener('DOMContentLoaded',()=>{" not in s:
        raise SystemExit('expected HF3.9 DOMContentLoaded marker missing')
    s=s.replace("document.addEventListener('DOMContentLoaded',()=>{",insert+"\ndocument.addEventListener('DOMContentLoaded',()=>{taskFiltering();",1)
    p.write_text(s,encoding='utf-8')

# 2) Directory: use a compact 12-result browse page and broaden neutral factual
# category families so Franklin-first never becomes an all-parks front page.
p=DIST/'assets/local-discovery.js'
s=p.read_text(encoding='utf-8')
if 'const perPage = 16;' not in s:
    raise SystemExit('expected directory page-size marker missing')
s=s.replace('const perPage = 16;','const perPage = 12;',1)
p.write_text(s,encoding='utf-8')

p=DIST/'assets/local-discovery-core.js'
s=p.read_text(encoding='utf-8')
pattern=r"const family = r => \{ const t = norm\(\[r\.c, r\.t, r\.n\]\.join\(' '\)\);.*?return 'business-services'; \};"
replacement="""const family = r => { const t = norm([r.c, r.t, r.n].join(' '));
        if (/park|trail|recreation|historic site|playground|pavilion|greenway/.test(t)) return 'parks';
        if (/health|medical|doctor|clinic|hospital|chiropr|dental|pharmacy|care/.test(t)) return 'health';
        if (/restaurant|food|cafe|coffee|pizza|bakery|market/.test(t)) return 'food';
        if (/school|education|learning|academy|college|child care/.test(t)) return 'education';
        if (/nonprofit|organization|community|faith|religion|charity|church/.test(t)) return 'community';
        if (/government|civic|court|police|city|county|public service/.test(t)) return 'civic';
        if (/attorney|law|account|consult|professional|architect|engineer|real estate|insurance/.test(t)) return 'professional';
        if (/plumb|electric|roof|hvac|contractor|construction|landscap|home service|repair/.test(t)) return 'home-services';
        if (/auto|vehicle|car |motor|tire|collision|dealer/.test(t)) return 'auto';
        if (/bank|finance|invest|mortgage|credit|wealth|tax/.test(t)) return 'finance';
        if (/salon|barber|spa|beauty|fitness|gym|wellness/.test(t)) return 'personal-care';
        if (/art|music|theatre|theater|museum|gallery|entertainment/.test(t)) return 'arts';
        if (/hotel|lodging|inn |travel|tourism/.test(t)) return 'lodging';
        if (/store|shop|retail|goods|boutique|clothing|furniture/.test(t)) return 'retail';
        return 'general-services'; };"""
s2,n=re.subn(pattern,replacement,s,count=1,flags=re.S)
if n!=1:
    raise SystemExit('expected directory diversity family marker missing')
p.write_text(s2,encoding='utf-8')

# 3) Activities: the legacy explorer runtime replaces the static cards after load.
# Bring that runtime into the owner-approved resident-facing presentation too:
# no checked dates, concise labels, currentness gate, and official resources in
# the secondary disclosure rather than mixed into ordinary local activities.
p=DIST/'activities/index.html'
soup=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
rgrid=soup.select_one('.hf39-official-grid')
if not rgrid:
    raise SystemExit('expected HF3.9 official-resource grid missing')
rgrid['data-explorer-official-grid']=''
p.write_text(str(soup),encoding='utf-8')

p=DIST/'assets/community-explorer.js'
s=p.read_text(encoding='utf-8')
s=s.replace("showing: (shown, total) => `Showing ${shown} of ${total} local options`,","showing: () => 'Activities & local options',",1)
s=s.replace("showing: (shown, total) => `Mostrando ${shown} de ${total} opciones locales`,","showing: () => 'Actividades y opciones locales',",1)
s=s.replace("source: 'Official source',","source: 'Details',",1)
s=s.replace("source: 'Fuente oficial',","source: 'Detalles',",1)
s=s.replace("currentSource: 'Check current source',","currentSource: 'Check current details',",1)
s=s.replace("currentSource: 'Confirmar en la fuente',","currentSource: 'Confirmar detalles',",1)

needle="""  const sourceCard = item => {
    const card = create('article', { class: 'explorer-card' });
    const tags = create('div', { class: 'explorer-tags' });
    tags.append(create('span', { class: 'explorer-tag' }, localized(item, 'typeLabel')));"""
replacement="""  const sourceCard = (item, resource = false) => {
    const card = create('article', { class: 'explorer-card' });
    const tags = create('div', { class: 'explorer-tags' });
    const rawType = localized(item, 'typeLabel');
    const humanTypes = {
      'Local participation group':'Community group','Local golf league':'Golf','Local adult league route':'Softball',
      'Official event calendar':'Events','Public outdoors':'Parks & outdoors','Local youth leagues':'Youth sports',
      'Community ensemble':'Music','Local youth league':'Youth sports','Golf / coaching':'Golf',
      'Official starting point':'Official resource','Public starting point':'Official resource'
    };
    tags.append(create('span', { class: 'explorer-tag' }, humanTypes[rawType] || rawType));"""
if needle not in s:
    raise SystemExit('community explorer source-card marker missing')
s=s.replace(needle,replacement,1)

fresh="""    const freshness = create('p', { class: 'explorer-mini-note' }, `${text.reviewed}: ${item.reviewedOn}. ${text.recheck}`);"""
if fresh not in s:
    raise SystemExit('community explorer freshness marker missing')
s=s.replace(fresh,"",1)
old_append="""    card.append(freshness, actions, choice);
    return card;"""
new_append="""    card.append(actions);
    if (!resource) card.append(choice);
    return card;"""
if old_append not in s:
    raise SystemExit('community explorer card append marker missing')
s=s.replace(old_append,new_append,1)

old_render="""    const filtered = scoped.filter(item => (!needle || searchable(item).includes(needle)) && (!audienceValue || item.audiences.includes(audienceValue)) && (!sportValue || item.sports.includes(sportValue)) && (!geographyValue || item.geographyTier === geographyValue));
    grid.replaceChildren(...filtered.map(sourceCard));
    summary.textContent = text.showing(filtered.length, scoped.length);
    empty.hidden = filtered.length !== 0;
    updateSelection();"""
new_render="""    const filtered = scoped.filter(item => (!needle || searchable(item).includes(needle)) && (!audienceValue || item.audiences.includes(audienceValue)) && (!sportValue || item.sports.includes(sportValue)) && (!geographyValue || item.geographyTier === geographyValue));
    const isResource = item => /official|public|route|starting point|calendar/i.test(String(item.typeLabel || ''));
    const residentOptions = filtered.filter(item => !isResource(item));
    const resourceOptions = filtered.filter(isResource);
    grid.replaceChildren(...residentOptions.map(item => sourceCard(item, false)));
    const resourceGrid = root.querySelector('[data-explorer-official-grid]');
    if (resourceGrid) resourceGrid.replaceChildren(...resourceOptions.map(item => sourceCard(item, true)));
    summary.textContent = text.showing(residentOptions.length, scoped.length);
    empty.hidden = residentOptions.length !== 0;
    updateSelection();"""
if old_render not in s:
    raise SystemExit('community explorer render marker missing')
s=s.replace(old_render,new_render,1)

old_current="""    const now = Date.now();
    const visible = current.filter(item => inScope(item) && new Date(item.expiresAt).getTime() > now && item.status !== 'CANCELED');
    const cards = visible.map(item => {
      const card = create('article', { class: 'explorer-current-card' });
      card.append(create('div', { class: 'explorer-date' }, formatDate(item.startsAt)), create('h3', {}, localized(item, 'name')), create('p', {}, localized(item, 'summary')), create('p', {}, item.location), create('p', { class: 'explorer-recheck' }, text.recheck));
      const actions = create('div', { class: 'actions' });
      actions.append(create('a', { class: 'button small', href: item.url, target: '_blank', rel: 'noopener' }, text.currentSource));
      card.append(actions);
      return card;
    });"""
new_current="""    const now = Date.now();
    const releaseFloor = new Date('2026-09-12T00:00:00-05:00').getTime();
    const visible = current.filter(item => inScope(item) && new Date(item.expiresAt).getTime() > Math.max(now, releaseFloor) && item.status !== 'CANCELED').slice(0, 6);
    const cards = visible.map(item => {
      const card = create('article', { class: 'explorer-current-card' });
      card.append(create('div', { class: 'explorer-date' }, formatDate(item.startsAt)), create('h3', {}, localized(item, 'name')), create('p', {}, item.location), create('p', {}, localized(item, 'summary')));
      const actions = create('div', { class: 'actions' });
      actions.append(create('a', { class: 'button small', href: item.url, target: '_blank', rel: 'noopener' }, text.currentSource));
      card.append(actions);
      return card;
    });"""
if old_current not in s:
    raise SystemExit('community explorer current-render marker missing')
s=s.replace(old_current,new_current,1)

# Keep the resident-facing summary stable while the dynamic catalog loads; do
# not flash implementation wording like "Loading Franklin options…" over it.
if "summary.textContent = text.loading;" not in s:
    raise SystemExit('community explorer loading-summary marker missing')
s=s.replace("summary.textContent = text.loading;","summary.textContent = text.showing(0, 0);",1)
p.write_text(s,encoding='utf-8')

print('HF3.9 browser-discovered fixes applied')
