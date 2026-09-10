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
      showing: (shown, total) => `Showing ${shown} of ${total} local options`,
      none: 'No option matches those filters. Clear a filter or try a broader search.',
      source: 'Official source',
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
      currentSource: 'Check current source',
      filterAll: 'All'
    },
    es: {
      loading: 'Cargando opciones de Franklin…',
      loadError: 'No se pudo cargar el catálogo local. Use los enlaces de fuentes oficiales de esta página e inténtelo más tarde.',
      showing: (shown, total) => `Mostrando ${shown} de ${total} opciones locales`,
      none: 'Ninguna opción coincide con esos filtros. Borre un filtro o pruebe una búsqueda más general.',
      source: 'Fuente oficial',
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
      currentSource: 'Confirmar en la fuente',
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
    const sports = [...new Set(catalog.flatMap(item => item.sports))].sort();
    sports.forEach(value => addOption(sport, value));
  };

  const sourceCard = item => {
    const card = create('article', { class: 'explorer-card' });
    const tags = create('div', { class: 'explorer-tags' });
    tags.append(create('span', { class: 'explorer-tag' }, localized(item, 'typeLabel')));
    for (const value of item.audiences.slice(0, 3)) tags.append(create('span', { class: 'explorer-tag is-age' }, label(value)));
    tags.append(create('span', { class: 'explorer-tag is-source' }, item.geographyLabel));
    const heading = create('h3', {}, localized(item, 'name'));
    const description = create('p', {}, localized(item, 'summary'));
    const sportsLine = item.sports.length ? create('p', { class: 'explorer-mini-note' }, `${lang === 'es' ? 'Deportes' : 'Sports'}: ${item.sports.map(label).join(', ')}`) : null;
    const freshness = create('p', { class: 'explorer-mini-note' }, `${text.reviewed}: ${item.reviewedOn}. ${text.recheck}`);
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
    card.append(freshness, actions, choice);
    return card;
  };

  const render = () => {
    const needle = String(search.value || '').trim().toLowerCase();
    const audienceValue = audience.value;
    const sportValue = sport.value;
    const geographyValue = geography.value;
    const scoped = catalog.filter(inScope);
    const filtered = scoped.filter(item => (!needle || searchable(item).includes(needle)) && (!audienceValue || item.audiences.includes(audienceValue)) && (!sportValue || item.sports.includes(sportValue)) && (!geographyValue || item.geographyTier === geographyValue));
    grid.replaceChildren(...filtered.map(sourceCard));
    summary.textContent = text.showing(filtered.length, scoped.length);
    empty.hidden = filtered.length !== 0;
    updateSelection();
  };

  const formatDate = value => {
    const zoned = value.length === 10 ? `${value}T12:00:00-05:00` : /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}-05:00`;
    return new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: value.includes('T') ? 'numeric' : undefined, minute: value.includes('T') ? '2-digit' : undefined, timeZone: 'America/Chicago' }).format(new Date(zoned));
  };

  const renderCurrent = () => {
    if (!currentGrid) return;
    const now = Date.now();
    const visible = current.filter(item => inScope(item) && new Date(item.expiresAt).getTime() > now && item.status !== 'CANCELED');
    const cards = visible.map(item => {
      const card = create('article', { class: 'explorer-current-card' });
      card.append(create('div', { class: 'explorer-date' }, formatDate(item.startsAt)), create('h3', {}, localized(item, 'name')), create('p', {}, localized(item, 'summary')), create('p', {}, item.location), create('p', { class: 'explorer-recheck' }, text.recheck));
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

  grid.textContent = text.loading;
  fetch('/data/franklin-activities.json', { credentials: 'same-origin' })
    .then(response => {
      if (!response.ok) throw new Error('catalog unavailable');
      return response.json();
    })
    .then(data => {
      if (data.schemaVersion !== 'franklin.activities.v1' || data.edition !== 'FRANKLIN_TN' || !Array.isArray(data.startingPoints)) throw new Error('catalog invalid');
      catalog = data.startingPoints.filter(item => item.currentnessState !== 'SUPPRESSED' && item.sourceClass !== 'DISCOVERY_ONLY_REJECTED');
      current = data.currentWindow.filter(item => item.currentnessState === 'RECHECK_BEFORE_USE');
      populateOptions();
      render();
      renderCurrent();
    })
    .catch(() => {
      grid.textContent = text.loadError;
      summary.textContent = '';
      empty.hidden = true;
      if (currentGrid) currentGrid.textContent = text.loadError;
    });
})();
