/* Native Franklin directory: factual matching, accessible comparison and deliberate sharing. */
(() => {
  'use strict';
  const root = document.querySelector('[data-franklin-discovery]');
  if (!root) return;
  const C = window.FranklinDiscoveryCore, data = window.FranklinDiscoveryData;
  if (!C || !data) return;
  const $ = selector => root.querySelector(selector);
  const fields = {q: $('[data-dir-search]'), category: $('[data-dir-category]'), type: $('[data-dir-type]'), area: $('[data-dir-area]'), sort: $('[data-dir-sort]')};
  const results = $('[data-dir-results]'), count = $('[data-dir-count]'), pageLabel = $('[data-dir-page]'), prev = $('[data-dir-prev]'), next = $('[data-dir-next]'), retry = $('[data-dir-retry]'), status = $('[data-dir-status]');
  const tray = $('[data-dir-compare]'), trayBody = $('[data-dir-compare-body]'), compareOpen = $('[data-dir-compare-open]');
  const selected = new Map();
  let rows = [], byId = new Map(), loaded = false, loading = false, comparisonOpen = false, queryTimer;
  let state = C.stateFromSearch(location.search);
  const perPage = 24;
  const language = () => document.documentElement.lang.toLowerCase().startsWith('es') ? 'es' : 'en';
  const tx = (en, es) => language() === 'es' ? es : en;
  const categoryText = value => window.FranklinI18n?.category?.(value) || value;
  const typeNames = {
    organization_or_place: ['Organization or place', 'Organización o lugar'], individual_healthcare_provider: ['Individual healthcare provider', 'Profesional de salud'], healthcare_provider_organization: ['Healthcare organization', 'Organización de salud'], tax_exempt_organization: ['Tax-exempt organization', 'Organización exenta de impuestos'], business: ['Business', 'Negocio'], community_resource: ['Community resource', 'Recurso comunitario'], regulated_child_care_provider: ['Child care provider', 'Proveedor de cuidado infantil'], government_department: ['Government department', 'Departamento público'], public_school: ['Public school', 'Escuela pública'], health_or_regulated_business: ['Health or regulated business', 'Negocio de salud o regulado'], healthcare_practice: ['Healthcare practice', 'Consultorio de salud'], nonprofit: ['Nonprofit', 'Organización sin fines de lucro'], historic_site: ['Historic site', 'Sitio histórico'], government: ['Government', 'Gobierno'], government_social_service: ['Public social service', 'Servicio social público'], professional_firm: ['Professional firm', 'Firma profesional'], public_school_district: ['Public school district', 'Distrito escolar público'], tourism_resource: ['Tourism resource', 'Recurso turístico'], arts_organization: ['Arts organization', 'Organización de arte'], government_facility: ['Government facility', 'Instalación pública'], hospital: ['Hospital', 'Hospital']
  };
  const typeText = value => typeNames[value]?.[language() === 'es' ? 1 : 0] || value.replace(/[_-]/g, ' ');
  function el(tag, text, className) { const n = document.createElement(tag); if (text != null) n.textContent = text; if (className) n.className = className; return n; }
  function button(text, fn, className = 'button small') { const n = el('button', text, className); n.type = 'button'; n.addEventListener('click', fn); return n; }
  function link(text, href, className = '') { const a = el('a', text, className); a.href = href; if (/^https?:/i.test(href)) { a.rel = 'noopener noreferrer'; a.referrerPolicy = 'no-referrer'; } return a; }
  function announce(message) { status.textContent = message; }
  function setHistory(push = false) {
    const suffix = C.searchParams(state), path = location.pathname + (suffix ? '?' + suffix : '');
    try { history[push ? 'pushState' : 'replaceState']({franklinDiscovery: true, state, selected: [...selected.keys()], comparisonOpen}, '', path); } catch (_) { /* Browsing still works without history permission. */ }
  }
  function syncForm() {
    for (const [key, node] of Object.entries(fields)) node.value = state[key];
    root.querySelectorAll('[data-dir-fact]').forEach(n => n.checked = state.facts.includes(n.value));
  }
  function readForm(resetPage = true) {
    state = C.cleanState({...Object.fromEntries(Object.entries(fields).map(([key, node]) => [key, node.value])), facts: [...root.querySelectorAll('[data-dir-fact]:checked')].map(n => n.value), page: resetPage ? 1 : state.page});
  }
  function populate() {
    const choices = [['category', 'c', tx('All categories', 'Todas las categorías'), categoryText], ['type', 't', tx('All types', 'Todos los tipos'), typeText], ['area', 'g', tx('All areas', 'Todas las áreas'), x => x]];
    for (const [key, column, first, label] of choices) {
      const values = [...new Set(rows.map(r => r[column]).filter(Boolean))].sort((a, b) => label(a).localeCompare(label(b)));
      fields[key].replaceChildren(new Option(first, ''), ...values.map(v => new Option(label(v), v)));
      if (state[key] && !values.includes(state[key])) {
        fields[key].append(new Option(tx('Unavailable selection — choose again', 'Selección no disponible — elija otra'), state[key]));
      }
    }
    syncForm();
  }
  function renderLabels() {
    root.querySelectorAll('[data-fr-en][data-fr-es]').forEach(n => { n.textContent = n.dataset[language() === 'es' ? 'frEs' : 'frEn']; });
    fields.q.placeholder = tx('Name, category or place', 'Nombre, categoría o lugar');
    fields.q.setAttribute('aria-label', tx('Search local profiles', 'Buscar perfiles locales'));
    fields.q.maxLength = 160;
    count.setAttribute('aria-live', 'polite'); count.setAttribute('aria-atomic', 'true');
    tray.setAttribute('aria-label', tx('Selected profile comparison', 'Comparación de perfiles seleccionados'));
    if (loaded) { populate(); render(); renderTray(); }
  }
  function card(row) {
    const article = el('article', null, 'r22-profile-result');
    const title = link('', C.canonicalProfile(row.i, language()), 'result-title'); title.append(el('h3', row.n));
    const cat = button(categoryText(row.c) || typeText(row.t), () => { fields.category.value = row.c; readForm(); setHistory(true); render(); }, 'category-tag');
    cat.setAttribute('aria-label', tx('Filter category: ', 'Filtrar categoría: ') + (categoryText(row.c) || typeText(row.t)));
    const locationText = el('p', row.l || row.g || tx('Location not supplied', 'Ubicación no indicada'));
    const checked = el('p', tx('Source date: ', 'Fecha de la fuente: ') + C.dateLabel(row.d, language()), 'fine-print');
    const facts = el('p', null, 'result-facts');
    for (const [yes, en, es] of [[row.phoneHref, 'Phone', 'Teléfono'], [row.websiteHref, 'Website', 'Sitio web'], [row.emailHref, 'Public email', 'Correo público'], [row.h, 'Exact address', 'Dirección exacta']]) if (yes) facts.append(el('span', tx(en, es)));
    const actions = el('div', null, 'result-actions');
    const choose = button(selected.has(row.i) ? tx('Selected', 'Seleccionado') : tx('Compare', 'Comparar'), () => toggle(row.i));
    choose.dataset.compareId = row.i; choose.setAttribute('aria-pressed', String(selected.has(row.i)));
    choose.setAttribute('aria-label', tx(selected.has(row.i) ? 'Remove from comparison: ' : 'Compare: ', selected.has(row.i) ? 'Quitar de la comparación: ' : 'Comparar: ') + row.n);
    const savePath = (language() === 'es' ? '/es/mi-franklin/' : '/my-franklin/') + '?saveProfile=' + encodeURIComponent(row.i) + '&chunk=' + row.x;
    actions.append(link(tx('Open profile', 'Abrir perfil'), C.canonicalProfile(row.i, language()), 'button small primary'), choose, link(tx('Save', 'Guardar'), savePath, 'button small'));
    if (row.websiteHref) actions.append(link(tx('Listed website', 'Sitio web indicado'), row.websiteHref, 'button small'));
    article.append(title, cat, locationText, checked, facts, actions); return article;
  }
  function render() {
    if (!loaded) return;
    const found = C.matchRows(rows, state), pages = Math.max(1, Math.ceil(found.length / perPage));
    state.page = Math.min(state.page, pages);
    results.replaceChildren(...found.slice((state.page - 1) * perPage, state.page * perPage).map(card));
    if (!found.length) {
      const panel = el('div', null, 'empty-state');
      panel.append(el('h2', tx('No matching profiles', 'No hay perfiles coincidentes')), el('p', tx('Try fewer words or remove a filter. Matches use listed names, categories and places; they do not confirm services or availability.', 'Pruebe con menos palabras o quite un filtro. Las coincidencias usan nombres, categorías y lugares indicados; no confirman servicios ni disponibilidad.')));
      panel.append(button(tx('Clear filters', 'Quitar filtros'), clearFilters), link(tx('I do not see my business or organization', 'No veo mi negocio u organización'), '/profile-request/', 'button'));
      results.append(panel);
    }
    count.textContent = new Intl.NumberFormat(language()).format(found.length) + tx(found.length === 1 ? ' result' : ' results', found.length === 1 ? ' resultado' : ' resultados');
    pageLabel.textContent = tx(`Page ${state.page} of ${pages}`, `Página ${state.page} de ${pages}`);
    prev.disabled = state.page <= 1; next.disabled = state.page >= pages;
    root.dataset.loaded = 'true';
    setHistory();
  }
  function toggle(id) {
    if (selected.has(id)) selected.delete(id);
    else if (selected.size === 3) { announce(tx('Three profiles are selected. Remove one before adding another.', 'Hay tres perfiles seleccionados. Quite uno antes de agregar otro.')); return; }
    else if (byId.has(id)) selected.set(id, byId.get(id));
    announce(tx(`${selected.size} of 3 selected.`, `${selected.size} de 3 seleccionados.`));
    renderTray(); render();
    const restored = [...root.querySelectorAll('[data-compare-id]')].find(n => n.dataset.compareId === id);
    (restored || trayBody.querySelector('button') || fields.q).focus({preventScroll:true});
  }
  function selectedText() {
    const lines = [tx('Franklin Navigator — contact preparation', 'Franklin Navigator — preparación para contactar'), '', tx('Public directory facts only. No message was sent and no appointment was made. Confirm services, credentials where relevant, costs and availability directly.', 'Solo datos públicos del directorio. No se envió ningún mensaje ni se concertó una cita. Confirme directamente los servicios, las credenciales pertinentes, los costos y la disponibilidad.'), ''];
    [...selected.values()].forEach((r, i) => {
      lines.push(`${i + 1}. ${r.n}`, categoryText(r.c), r.l || r.g, 'https://franklinnavigator.com' + C.canonicalProfile(r.i, language()), tx('Source date: ', 'Fecha de la fuente: ') + C.dateLabel(r.d, language()));
      if (r.websiteHref) lines.push(tx('Listed website: ', 'Sitio web indicado: ') + r.websiteHref);
      if (r.phoneHref) lines.push(tx('Phone: ', 'Teléfono: ') + r.p);
      if (r.emailHref) lines.push(tx('Public email: ', 'Correo público: ') + r.e);
      lines.push('');
    });
    lines.push(tx('Questions to ask', 'Preguntas para hacer'), ...questions().map((x, i) => `${i + 1}. ${x}`), '', tx('Selection is yours, not a recommendation or paid ranking. A source date is not proof of current availability.', 'La selección es suya, no una recomendación ni una clasificación pagada. La fecha de la fuente no confirma la disponibilidad actual.'));
    return lines.join('\n');
  }
  const questions = () => [tx('Do you provide the service I need at my location?', '¿Ofrece el servicio que necesito en mi ubicación?'), tx('What are the total costs and any cancellation terms before I commit?', '¿Cuáles son los costos totales y las condiciones de cancelación antes de comprometerme?'), tx('How do I confirm availability or arrange the next step?', '¿Cómo confirmo la disponibilidad o acuerdo el siguiente paso?'), tx('What language or accessibility support is available?', '¿Qué apoyo de idioma o accesibilidad está disponible?'), tx('What information do you actually need from me, and how should I send it securely?', '¿Qué información necesita realmente de mí y cómo debo enviarla de forma segura?')];
  function downloadText() {
    if (!selected.size) return;
    try {
      const url = URL.createObjectURL(new Blob([selectedText()], {type: 'text/plain;charset=utf-8'}));
      const a = link('', url); a.download = 'franklin-contact-checklist.txt'; a.hidden = true; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      announce(tx('Checklist download requested. Nothing was sent to a provider.', 'Se solicitó descargar la lista. No se envió nada a ningún proveedor.'));
    } catch (_) { announce(tx('Download was unavailable. Select and copy the comparison instead.', 'No se pudo descargar. Seleccione y copie la comparación.')); }
  }
  function renderTray() {
    tray.hidden = selected.size === 0;
    $('[data-dir-compare-count]').textContent = String(selected.size);
    compareOpen.textContent = comparisonOpen ? tx('Hide comparison', 'Ocultar comparación') : tx('Compare now', 'Comparar ahora');
    compareOpen.setAttribute('aria-expanded', String(comparisonOpen));
    trayBody.replaceChildren();
    if (!selected.size) { comparisonOpen = false; return; }
    const mini = el('ul', null, 'discovery-selected-list');
    selected.forEach(r => { const li = el('li'); const remove = button(tx('Remove', 'Quitar'), () => toggle(r.i)); remove.setAttribute('aria-label', tx('Remove ', 'Quitar ') + r.n); li.append(el('span', r.n), remove); mini.append(li); });
    trayBody.append(mini);
    if (!comparisonOpen) return;
    const wrap = el('div', null, 'compare-table-wrap'); wrap.tabIndex = 0; wrap.setAttribute('role', 'region'); wrap.setAttribute('aria-label', tx('Scrollable factual comparison', 'Comparación de datos desplazable'));
    const table = el('table', null, 'compare-table'); table.append(el('caption', tx('Compare listed information — confirm changing details directly', 'Compare los datos indicados — confirme los detalles cambiantes directamente')));
    const head = el('thead'), hrow = el('tr'); const factHead = el('th', tx('Fact', 'Dato')); factHead.scope = 'col'; hrow.append(factHead);
    selected.forEach(r => { const th = el('th'); th.scope = 'col'; th.append(link(r.n, C.canonicalProfile(r.i, language()))); hrow.append(th); }); head.append(hrow);
    const body = el('tbody'), no = () => el('span', tx('Not listed', 'No indicado'));
    const lines = [
      [tx('Category', 'Categoría'), r => el('span', categoryText(r.c))], [tx('Location', 'Ubicación'), r => el('span', r.l || r.g)],
      [tx('Website', 'Sitio web'), r => r.websiteHref ? link(tx('Open listed website', 'Abrir sitio web indicado'), r.websiteHref) : no()],
      [tx('Phone', 'Teléfono'), r => r.phoneHref ? link(r.p, r.phoneHref) : no()],
      [tx('Public email', 'Correo público'), r => r.emailHref ? link(r.e, r.emailHref) : no()],
      [tx('Source date', 'Fecha de la fuente'), r => el('span', C.dateLabel(r.d, language()))]
    ];
    for (const [label, value] of lines) { const tr = el('tr'), th = el('th', label); th.scope = 'row'; tr.append(th); selected.forEach(r => { const td = el('td'); td.append(value(r)); tr.append(td); }); body.append(tr); }
    table.append(head, body); wrap.append(table); trayBody.append(wrap);
    const prep = el('section', null, 'discovery-contact-prep'); prep.append(el('h3', tx('Prepare before contacting', 'Prepárese antes de contactar')));
    const list = el('ol'); questions().forEach(q => list.append(el('li', q))); prep.append(list, el('p', tx('Keep personal, medical, legal and account details out of public messages. Use the provider’s secure channel when needed.', 'No incluya datos personales, médicos, legales ni de cuentas en mensajes públicos. Use el canal seguro del proveedor cuando sea necesario.')));
    const actions = el('div', null, 'actions');
    actions.append(button(tx('Download contact checklist', 'Descargar lista para contactar'), downloadText, 'button primary'), button(tx('Print comparison', 'Imprimir comparación'), () => { document.body.dataset.franklinPrint = 'comparison'; window.print(); setTimeout(() => delete document.body.dataset.franklinPrint, 500); }, 'button'), link(tx('More preparation tools', 'Más herramientas de preparación'), '/preparation-studio/', 'button'));
    prep.append(actions); trayBody.append(prep);
  }
  function clearFilters() { state = C.cleanState(); syncForm(); setHistory(true); render(); announce(tx('Filters cleared.', 'Filtros eliminados.')); fields.q.focus(); }
  async function load() {
    if (loading) return; loading = true; retry.hidden = true; root.setAttribute('aria-busy', 'true');
    count.textContent = tx('Loading local profiles…', 'Cargando perfiles locales…');
    try {
      const suppressionResponse=await fetch('/data/public-profile-suppressions.json',{cache:'no-store'}); if(!suppressionResponse.ok)throw new Error('SUPPRESSION_LEDGER_UNAVAILABLE'); const suppressionData=await suppressionResponse.json(); const suppressed=new Set((suppressionData.entries||[]).filter(e=>e&&e.status==='SUPPRESSED').map(e=>e.profileId)); rows = (await data.all()).filter(r=>!suppressed.has(r.i)); byId = new Map(rows.map(r => [r.i, r])); loaded = true;
      if (history.state?.franklinDiscovery) {
        state = C.cleanState(history.state.state);
        for (const id of (Array.isArray(history.state.selected) ? history.state.selected : []).slice(0, 3)) if (byId.has(id)) selected.set(id, byId.get(id));
        comparisonOpen = !!history.state.comparisonOpen;
      }
      populate(); render(); renderTray(); announce('');
    } catch (_) {
      loaded = false; count.textContent = tx('Directory unavailable', 'Directorio no disponible'); retry.hidden = false;
      results.replaceChildren(el('p', tx('The directory could not be loaded and checked. Your filters are still here. Retry, or browse the local help starting points.', 'No se pudo cargar y comprobar el directorio. Sus filtros siguen aquí. Inténtelo de nuevo o explore los puntos de partida de ayuda local.'), 'empty-state'), link(tx('Open local help', 'Abrir ayuda local'), '/community-help-center/', 'button'));
      announce(tx('The directory did not load. No search results are being shown.', 'El directorio no se cargó. No se muestran resultados de búsqueda.'));
    } finally { loading = false; root.setAttribute('aria-busy', 'false'); }
  }
  fields.q.addEventListener('input', () => { clearTimeout(queryTimer); queryTimer = setTimeout(() => { readForm(); render(); }, 120); });
  for (const [key, input] of Object.entries(fields)) if (key !== 'q') input.addEventListener('change', () => { readForm(); setHistory(true); render(); });
  root.querySelectorAll('[data-dir-fact]').forEach(n => n.addEventListener('change', () => { readForm(); setHistory(true); render(); }));
  $('[data-dir-clear]').addEventListener('click', clearFilters); retry.addEventListener('click', load);
  prev.addEventListener('click', () => { if (!prev.disabled) { state.page--; setHistory(true); render(); results.focus(); } });
  next.addEventListener('click', () => { if (!next.disabled) { state.page++; setHistory(true); render(); results.focus(); } });
  $('[data-dir-compare-clear]').addEventListener('click', () => { selected.clear(); comparisonOpen = false; renderTray(); render(); announce(tx('Comparison cleared.', 'Comparación eliminada.')); fields.q.focus({preventScroll:true}); });
  compareOpen.addEventListener('click', () => { comparisonOpen = !comparisonOpen; renderTray(); setHistory(); });
  $('[data-dir-share]').addEventListener('click', async () => {
    readForm(false); const suffix = C.searchParams(state), path = language() === 'es' ? '/es/directorio/' : '/directory/';
    const href = 'https://franklinnavigator.com' + path + (suffix ? '?' + suffix : '');
    const output = $('[data-dir-share-output]'); output.hidden = false; output.value = href;
    try { await navigator.clipboard.writeText(href); announce(tx('Search link copied. It includes your words and filters, not your comparison.', 'Enlace de búsqueda copiado. Incluye sus palabras y filtros, no su comparación.')); }
    catch (_) { output.focus(); output.select(); announce(tx('Copy the selected search link. Review its words before sharing.', 'Copie el enlace seleccionado. Revise sus palabras antes de compartirlo.')); }
  });
  window.addEventListener('popstate', e => {
    state = e.state?.franklinDiscovery ? C.cleanState(e.state.state) : C.stateFromSearch(location.search);
    selected.clear(); for (const id of (Array.isArray(e.state?.selected) ? e.state.selected : []).slice(0, 3)) if (byId.has(id)) selected.set(id, byId.get(id));
    comparisonOpen = !!e.state?.comparisonOpen; syncForm(); render(); renderTray();
  });
  window.addEventListener('franklinlanguagechange', renderLabels);
  window.addEventListener('afterprint', () => delete document.body.dataset.franklinPrint);
  renderLabels(); syncForm(); load();
})();
