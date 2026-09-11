(() => {
  'use strict';

  const root = document.querySelector('[data-community-explorer]');
  if (!root) return;

  const lang = document.documentElement.lang === 'es' ? 'es' : 'en';
  const scope = document.body.dataset.explorerScope || 'all';
  const q = (selector, base = root) => base.querySelector(selector);
  const text = {
    en: {
      loading: 'Loading Franklin options…',
      loadError: 'The local activity catalog could not load. Use the official source links on this page and try again later.',
      retry: 'Retry loading local options',
      showing: () => 'Activities & local options',
      none: 'No option matches those filters. Clear a filter or try a broader search.',
      source: 'Details',
      profile: 'Open Franklin profile',
      reviewed: 'Checked',
      recheck: 'Schedules, registration, fees, capacity, location and eligibility can change. Recheck before relying on them.',
      add: 'Save to shortlist',
      selected: count => `${count} selected`,
      emptyPlan: 'Choose an option above to add it to your shortlist.',
      planTitle: 'My Franklin activity short list',
      copied: 'Copied',
      copy: 'Copy list',
      download: 'Download list',
      currentNone: 'No current items are listed here right now. See the local options below.',
      currentSource: 'Check current details',
      filterAll: 'All'
    },
    es: {
      loading: 'Cargando opciones de Franklin…',
      loadError: 'No se pudo cargar el catálogo local. Use los enlaces de fuentes oficiales de esta página e inténtelo más tarde.',
      retry: 'Volver a cargar opciones locales',
      showing: () => 'Actividades y opciones locales',
      none: 'Ninguna opción coincide con esos filtros. Borre un filtro o pruebe una búsqueda más general.',
      source: 'Detalles',
      profile: 'Abrir perfil de Franklin',
      reviewed: 'Revisado',
      recheck: 'Los horarios, inscripciones, costos, cupos, ubicaciones y requisitos pueden cambiar. Confírmelos antes de depender de ellos.',
      add: 'Guardar en mi lista',
      selected: count => `${count} seleccionados`,
      emptyPlan: 'Elija una opción para añadirla a su lista.',
      planTitle: 'Mi lista de actividades de Franklin',
      copied: 'Copiado',
      copy: 'Copiar lista',
      download: 'Descargar lista',
      currentNone: 'No hay elementos vigentes en esta sección. Consulte las opciones locales que aparecen abajo.',
      currentSource: 'Confirmar detalles',
      filterAll: 'Todos'
    }
  }[lang];

  const grid = q('[data-explorer-grid]');
  const summary = q('[data-explorer-summary]');
  const empty = q('[data-explorer-empty]');
  const search = q('[data-explorer-search]');
  const audience = q('[data-explorer-audience]');
  const sport = q('[data-explorer-sport]');
  const geography = q('[data-explorer-geography]');
  const reset = q('[data-explorer-reset]');
  const currentGrid = q('[data-explorer-current]');
  const currentEmpty = q('[data-explorer-current-empty]');
  const selectedCount = q('[data-explorer-selected-count]');
  const buildButton = q('[data-explorer-build]');
  const clearButton = q('[data-explorer-clear]');
  const shortlist = root.querySelector('.explorer-shortlist');
  const output = q('[data-explorer-output]');
  const copyButton = q('[data-explorer-copy]');
  const downloadButton = q('[data-explorer-download]');
  const printButton = q('[data-explorer-print]');
  const selected = new Set();
  let catalog = [];
  let current = [];
  let loadingCatalog = false;

  const create = (tag, attrs = {}, value = '') => {
    const node = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'class') node.className = val;
      else node.setAttribute(key, val);
    }
    if (value) node.textContent = value;
    return node;
  };

  const spanishLabels = {
    adult: 'Adultos', adaptive: 'Recreación adaptada', family: 'Familias', senior: 'Personas mayores', teen: 'Adolescentes', youth: 'Niños y jóvenes',
    basketball: 'Baloncesto', baseball: 'Béisbol', bowling: 'Boliche', cheerleading: 'Animación', cycling: 'Ciclismo', dance: 'Danza', 'disc-golf': 'Golf de disco',
    football: 'Fútbol americano', 'flag-football': 'Fútbol bandera', golf: 'Golf', hiking: 'Senderismo', kickball: 'Kickball', lacrosse: 'Lacrosse',
    'mountain-biking': 'Bicicleta de montaña', 'multi-sport': 'Multideporte', nature: 'Naturaleza', paddling: 'Remo', pickleball: 'Pickleball', play: 'Juego',
    running: 'Carreras', soccer: 'Fútbol', softball: 'Sóftbol', swimming: 'Natación', 'table-tennis': 'Tenis de mesa', tennis: 'Tenis', volleyball: 'Voleibol', walking: 'Caminata',
    'school-sports': 'Deportes escolares', 'general-recreation': 'Recreación general', FRANKLIN_CORE: 'Ciudad de Franklin', WILLIAMSON_COUNTY: 'Condado de Williamson'
  };
  const label = value => lang === 'es' && spanishLabels[value] ? spanishLabels[value] : String(value || '').replaceAll('-', ' ').replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  const localized = (item, key) => lang === 'es' && item[`${key}Es`] ? item[`${key}Es`] : item[key];
  const inScope = item => {
    if (scope === 'all') return true;
    const sports = item.sports || [];
    const features = item.features || [];
    if (scope.startsWith('sport:')) return sports.includes(scope.slice('sport:'.length));
    if (scope.startsWith('sport-group:')) return scope.slice('sport-group:'.length).split(',').some(value => sports.includes(value));
    if (scope.startsWith('adult-sport:')) return sports.includes(scope.slice('adult-sport:'.length)) && item.audiences.some(value => ['adult', 'senior'].includes(value));
    if (scope.startsWith('feature:')) return features.includes(scope.slice('feature:'.length));
    if (scope === 'adult-leagues') return item.categories.includes('sports') && item.audiences.some(value => ['adult', 'senior'].includes(value));
    if (scope === 'youth-leagues') return item.categories.includes('sports') && item.audiences.some(value => ['youth', 'teen'].includes(value));
    return item.categories.includes(scope) || (scope === 'youth-family' && item.audiences.some(value => ['youth', 'teen', 'family'].includes(value)));
  };
  const searchable = item => [item.name, item.nameEs, item.summary, item.summaryEs, ...item.categories, ...item.audiences, ...item.sports, item.geographyLabel].join(' ').toLowerCase();

  const updateSelection = () => {
    selectedCount.textContent = text.selected(selected.size);
    if (shortlist) shortlist.hidden = selected.size === 0;
    buildButton.disabled = selected.size === 0;
    clearButton.disabled = selected.size === 0;
    for (const checkbox of root.querySelectorAll('[data-explorer-select]')) checkbox.checked = selected.has(checkbox.value);
  };

  const addOption = (select, value) => {
    const option = create('option', { value }, label(value));
    select.append(option);
  };

  const populateOptions = () => {
    while (sport.options.length > 1) sport.remove(1);
    const sports = [...new Set(catalog.flatMap(item => item.sports))].sort();
    sports.forEach(value => addOption(sport, value));
  };

  const sourceCard = (item, resource = false) => {
    const card = create('article', { class: 'explorer-card' });
    const tags = create('div', { class: 'explorer-tags' });
    const rawType = localized(item, 'typeLabel');
    const humanTypes = {
      'Local participation group':'Community group','Local golf league':'Golf','Local adult league route':'Softball',
      'Official event calendar':'Events','Public outdoors':'Parks & outdoors','Local youth leagues':'Youth sports',
      'Community ensemble':'Music','Local youth league':'Youth sports','Golf / coaching':'Golf',
      'Official starting point':'Official resource','Public starting point':'Official resource'
    };
    tags.append(create('span', { class: 'explorer-tag' }, humanTypes[rawType] || rawType));
    for (const value of item.audiences.slice(0, 3)) tags.append(create('span', { class: 'explorer-tag is-age' }, label(value)));
    tags.append(create('span', { class: 'explorer-tag is-source' }, item.geographyLabel));
    const heading = create('h3', {}, localized(item, 'name'));
    const description = create('p', {}, localized(item, 'summary'));
    const sportsLine = item.sports.length ? create('p', { class: 'explorer-mini-note' }, `${lang === 'es' ? 'Deportes' : 'Sports'}: ${item.sports.map(label).join(', ')}`) : null;

    const actions = create('div', { class: 'actions' });
    const link = create('a', { class: 'button small', href: item.url, target: '_blank', rel: 'noopener' }, text.source);
    actions.append(link);
    if (item.profileRoute) actions.append(create('a', { class: 'button small', href: item.profileRoute }, text.profile));
    const choice = create('label', { class: 'explorer-choice' });
    const checkbox = create('input', { type: 'checkbox', value: item.id, 'data-explorer-select': '' });
    checkbox.checked = selected.has(item.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selected.add(item.id);
      else selected.delete(item.id);
      updateSelection();
    });
    choice.append(checkbox, create('span', {}, text.add));
    card.append(tags, heading, description);
    if (sportsLine) card.append(sportsLine);
    card.append(actions);
    if (!resource) card.append(choice);
    return card;
  };

  const render = () => {
    const needle = String(search.value || '').trim().toLowerCase();
    const audienceValue = audience.value;
    const sportValue = sport.value;
    const geographyValue = geography.value;
    const scoped = catalog.filter(inScope);
    const filtered = scoped.filter(item => (!needle || searchable(item).includes(needle)) && (!audienceValue || item.audiences.includes(audienceValue)) && (!sportValue || item.sports.includes(sportValue)) && (!geographyValue || item.geographyTier === geographyValue));
    const isResource = item => /official|public|route|starting point|calendar/i.test(String(item.typeLabel || ''));
    const residentOptions = filtered.filter(item => !isResource(item));
    const resourceOptions = filtered.filter(isResource);
    grid.replaceChildren(...residentOptions.map(item => sourceCard(item, false)));
    const resourceGrid = root.querySelector('[data-explorer-official-grid]');
    if (resourceGrid) resourceGrid.replaceChildren(...resourceOptions.map(item => sourceCard(item, true)));
    summary.textContent = text.showing(residentOptions.length, scoped.length);
    empty.hidden = residentOptions.length !== 0;
    updateSelection();
  };

  const formatDate = value => {
    const zoned = value.length === 10 ? `${value}T12:00:00-05:00` : /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}-05:00`;
    return new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: value.includes('T') ? 'numeric' : undefined, minute: value.includes('T') ? '2-digit' : undefined, timeZone: 'America/Chicago' }).format(new Date(zoned));
  };

  const renderCurrent = () => {
    if (!currentGrid) return;
    const now = Date.now();
    const releaseFloor = new Date('2026-09-12T00:00:00-05:00').getTime();
    const visible = current.filter(item => inScope(item) && new Date(item.expiresAt).getTime() > Math.max(now, releaseFloor) && item.status !== 'CANCELED').slice(0, 6);
    const cards = visible.map(item => {
      const card = create('article', { class: 'explorer-current-card' });
      card.append(create('div', { class: 'explorer-date' }, formatDate(item.startsAt)), create('h3', {}, localized(item, 'name')), create('p', {}, item.location), create('p', {}, localized(item, 'summary')));
      const actions = create('div', { class: 'actions' });
      actions.append(create('a', { class: 'button small', href: item.url, target: '_blank', rel: 'noopener' }, text.currentSource));
      card.append(actions);
      return card;
    });
    currentGrid.replaceChildren(...cards);
    if (currentEmpty) {
      currentEmpty.hidden = cards.length !== 0;
      currentEmpty.textContent = text.currentNone;
    }
  };

  const buildPlan = () => {
    const rows = catalog.filter(item => selected.has(item.id));
    if (!rows.length) {
      output.textContent = text.emptyPlan;
      return;
    }
    const lines = [text.planTitle, '', lang === 'es' ? 'Preparado en este dispositivo; no enviado.' : 'Prepared on this device; not submitted.', ''];
    rows.forEach((item, index) => {
      lines.push(`${index + 1}. ${localized(item, 'name')}`, `   ${localized(item, 'summary')}`, `   ${text.currentSource}: ${item.url}`, '');
    });
    lines.push(lang === 'es' ? 'Antes de inscribirse:' : 'Before registering:', lang === 'es' ? '- Confirme ubicación, fechas, edad, cupo, costo, accesibilidad, equipo, clima y cancelaciones en la fuente.' : '- Confirm location, dates, age, capacity, cost, accessibility, equipment, weather and cancellations at the source.', lang === 'es' ? '- Franklin Navigator no clasifica ni recomienda proveedores.' : '- Franklin Navigator does not rank or endorse providers.', lang === 'es' ? '- Ningún nombre, historia privada o selección se colocó en la URL.' : '- No name, private story or selection was placed in the URL.');
    output.textContent = lines.join('\n');
    output.focus();
    copyButton.disabled = false;
    downloadButton.disabled = false;
    printButton.disabled = false;
  };

  const download = () => {
    const blob = new Blob([`${output.textContent}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = create('a', { href: url, download: lang === 'es' ? 'lista-actividades-franklin.txt' : 'franklin-activity-shortlist.txt' });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  [search, audience, sport, geography].forEach(control => control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', render));
  reset.addEventListener('click', () => {
    search.value = '';
    audience.value = '';
    sport.value = '';
    geography.value = '';
    render();
    search.focus();
  });
  buildButton.addEventListener('click', buildPlan);
  clearButton.addEventListener('click', () => {
    selected.clear();
    output.textContent = text.emptyPlan;
    copyButton.disabled = true;
    downloadButton.disabled = true;
    printButton.disabled = true;
    updateSelection();
  });
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.textContent);
      copyButton.textContent = text.copied;
      setTimeout(() => { copyButton.textContent = text.copy; }, 1500);
    } catch {
      output.focus();
    }
  });
  downloadButton.addEventListener('click', download);
  printButton.addEventListener('click', () => window.print());

  const fetchCatalogAttempt = (cacheMode, timeoutMs, bustCache = false) => {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    let timer = 0;
    const timeout = new Promise((_, reject) => {
      timer = window.setTimeout(() => {
        if (controller) controller.abort();
        reject(new Error('catalog timeout'));
      }, timeoutMs);
    });
    const suffix = bustCache ? `?franklin-retry=${Date.now()}` : '';
    const request = fetch(`/data/franklin-activities.json${suffix}`, {
      credentials: 'same-origin',
      cache: cacheMode,
      ...(controller ? { signal: controller.signal } : {})
    }).then(response => {
      if (!response.ok) throw new Error('catalog unavailable');
      return response.json();
    });
    return Promise.race([request, timeout]).finally(() => window.clearTimeout(timer));
  };

  const acceptCatalog = data => {
    if (data.schemaVersion !== 'franklin.activities.v1' || data.edition !== 'FRANKLIN_TN' || !Array.isArray(data.startingPoints) || !Array.isArray(data.currentWindow)) throw new Error('catalog invalid');
    catalog = data.startingPoints.filter(item => item.currentnessState !== 'SUPPRESSED' && item.sourceClass !== 'DISCOVERY_ONLY_REJECTED');
    current = data.currentWindow.filter(item => item.currentnessState === 'RECHECK_BEFORE_USE');
    populateOptions();
    render();
    renderCurrent();
  };

  const showLoadError = () => {
    summary.textContent = text.loadError;
    empty.hidden = true;
    const panel = create('div', { class: 'explorer-empty' });
    panel.append(create('p', {}, text.loadError));
    const retry = create('button', { class: 'button', type: 'button' }, text.retry);
    retry.addEventListener('click', () => loadCatalog(true));
    panel.append(retry);
    grid.replaceChildren(panel);
    if (currentGrid) currentGrid.replaceChildren();
    if (currentEmpty) {
      currentEmpty.textContent = text.loadError;
      currentEmpty.hidden = false;
    }
  };

  const setLoadingState = () => {
    summary.textContent = text.showing(0, 0);
    grid.textContent = text.loading;
    empty.hidden = true;
    if (currentEmpty) currentEmpty.hidden = true;
  };

  const loadCatalog = async (forceReload = false) => {
    if (loadingCatalog) return;
    loadingCatalog = true;
    setLoadingState();
    try {
      let data;
      if (forceReload) {
        data = await fetchCatalogAttempt('no-store', 7000, true);
      } else {
        try {
          data = await fetchCatalogAttempt('default', 4500, false);
        } catch (firstError) {
          console.warn('Franklin activity catalog first load attempt did not complete; retrying once.', firstError);
          data = await fetchCatalogAttempt('no-store', 7000, true);
        }
      }
      acceptCatalog(data);
    } catch (error) {
      console.warn('Franklin activity catalog could not load after bounded retries.', error);
      showLoadError();
    } finally {
      loadingCatalog = false;
    }
  };

  loadCatalog();
})();
