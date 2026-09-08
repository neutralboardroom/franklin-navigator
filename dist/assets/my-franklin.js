/* Franklin device-only dashboard: honest persistence, recoverable local data and current profile links. */
(() => {
  'use strict';
  const root = document.querySelector('[data-my-franklin]'), C = window.FranklinDeviceCore, D = window.FranklinDiscoveryData, Q = window.FranklinDiscoveryCore;
  if (!root || !C || !D || !Q) return;
  const $ = s => root.querySelector(s), form = $('form:not([data-franklin-reminder-form])'), output = $('[data-my-franklin-output]'), status = $('[data-my-franklin-status]'), reset = $('[data-my-franklin-clear]');
  const reminderForm = $('[data-franklin-reminder-form]'), reminderList = $('[data-franklin-reminders]'), savedList = $('[data-saved-profiles]'), recovery = $('[data-device-recovery]'), resetPanel = $('[data-device-reset-confirm]');
  const store = C.createStore(() => localStorage), hydrated = new Map();
  let hydrateGeneration = 0, lastNotice = '', importPending = false;
  const language = () => document.documentElement.lang.toLowerCase().startsWith('es') ? 'es' : 'en';
  const tx = (en, es) => language() === 'es' ? es : en;
  const routeMap = {
    newcomer: ['New to Franklin', 'Nuevo en Franklin', '/new-to-franklin/'], homeowner: ['Home & property', 'Casa y propiedad', '/home-property-help/'], renter: ['Housing & renter starting help', 'Vivienda y alquiler', '/housing/'], children: ['Schools & family', 'Escuelas y familia', '/school-enrollment/'], caregiver: ['Senior & caregiving', 'Personas mayores y cuidado', '/local-pathways/seniors-caregiving/'], transit: ['Transportation & mobility', 'Transporte y movilidad', '/getting-around/'], business: ['For businesses', 'Para negocios', '/business-dashboard/'], civic: ['Civic & neighborhood', 'Vida cívica y vecindario', '/local-pathways/civic-neighborhood/'], events: ['Today & local events', 'Hoy y eventos locales', '/today/'], jobs: ['Jobs & career', 'Empleo y carrera', '/local-pathways/jobs-career/'], parks: ['Parks & community', 'Parques y comunidad', '/community/']
  };
  const readPrefs = () => store.read(C.KEYS.preferences, null, C.preferences);
  const readReminders = () => store.read(C.KEYS.reminders, [], C.reminders);
  const readProfiles = () => store.read(C.KEYS.profiles, [], C.profiles);
  function el(tag, text, className) { const n = document.createElement(tag); if (text != null) n.textContent = text; if (className) n.className = className; return n; }
  function action(text, fn, focusKey) { const b = el('button', text, 'button small'); b.type = 'button'; if (focusKey) b.dataset.focusKey = focusKey; b.addEventListener('click', fn); return b; }
  function link(text, href) { const a = el('a', text, 'button small'); a.href = href; return a; }
  function announce(en, es) { lastNotice = language() === 'es' ? es : en; status.textContent = lastNotice; }
  function keepFocus(container, fn) {
    const current = document.activeElement, key = container.contains(current) ? current.dataset.focusKey : null;
    fn(); if (key) { const next = [...container.querySelectorAll('[data-focus-key]')].find(n => n.dataset.focusKey === key); (next || container).focus({preventScroll: true}); }
  }
  function write(key, value) {
    if (!store.write(key, value)) { announce('This browser did not save the change. Your previous saved data was not replaced by a success message. Keep the page open or use a download.', 'Este navegador no guardó el cambio. No se mostrará una confirmación falsa. Mantenga la página abierta o use una descarga.'); renderRecovery(); return false; }
    return true;
  }
  function renderRecovery() {
    recovery.replaceChildren();
    const items = [[C.KEYS.preferences, readPrefs(), ['preferences', 'preferencias']], [C.KEYS.reminders, readReminders(), ['reminders', 'recordatorios']], [C.KEYS.profiles, readProfiles(), ['saved profiles', 'perfiles guardados']]];
    if (items.some(([, result]) => result.status === 'unavailable')) {
      recovery.append(el('p', tx('This browser is not allowing access to saved data. Browsing still works. Changes will not be reported as saved. On a shared device, also use your browser’s privacy controls.', 'Este navegador no permite acceder a los datos guardados. Puede seguir navegando. No se informará que los cambios están guardados. En un dispositivo compartido, use también los controles de privacidad del navegador.'), 'notice'));
    }
    for (const [key, result, names] of items.filter(([, result]) => result.status === 'damaged')) {
      const panel = el('section', null, 'notice');
      panel.append(el('p', tx(`Some ${names[0]} could not be read safely. Readable items are shown; nothing has been deleted.`, `No se pudieron leer algunos ${names[1]} de forma segura. Se muestran los elementos legibles; no se ha eliminado nada.`)));
      panel.append(action(tx('Keep readable items; discard unreadable items', 'Conservar los elementos legibles; descartar los ilegibles'), () => {
        if (write(key, result.value)) { announce('Readable data kept; unreadable saved items discarded on this device.', 'Se conservaron los datos legibles y se descartaron los elementos ilegibles en este dispositivo.'); renderAll(); }
      }, 'repair-' + key)); recovery.append(panel);
    }
    recovery.hidden = !recovery.childElementCount;
  }
  function writable(key, result) {
    if (result.status === 'damaged') { announce('Review the unreadable saved-data notice before changing this list. Your readable items are still here.', 'Revise el aviso de datos ilegibles antes de cambiar esta lista. Sus elementos legibles siguen aquí.'); recovery.focus(); return false; }
    return true;
  }
  function renderPrefs() {
    output.replaceChildren(); const prefs = readPrefs().value;
    output.append(el('h2', tx('Your Franklin starting points', 'Sus puntos de partida en Franklin')));
    if (!prefs?.interests.length) { output.append(el('p', tx('Choose what matters to you and save it on this device to build a shorter personal dashboard.', 'Elija lo que le importa y guárdelo en este dispositivo para crear un panel más corto.'))); return; }
    const grid = el('div', null, 'grid three');
    prefs.interests.forEach(id => { const r = routeMap[id]; if (!r) return; const card = el('article', null, 'card'); card.append(el('h3', r[language() === 'es' ? 1 : 0]), el('p', tx('Keep this Franklin topic close at hand.', 'Mantenga este tema de Franklin a mano.')), link(tx('Open', 'Abrir'), r[2])); grid.append(card); });
    output.append(grid);
    const links = el('div', null, 'actions'); links.append(link(tx('See what matters today', 'Ver lo importante hoy'), language() === 'es' ? '/es/hoy/' : '/today/'), link(tx('Ask Franklin Assistant', 'Preguntar al Navegador'), '/assistant/')); output.append(links);
  }
  function renderProfiles() {
    keepFocus(savedList, () => {
      const items = readProfiles().value; savedList.replaceChildren();
      if (!items.length) { savedList.append(el('p', tx('No local profiles saved yet.', 'Todavía no hay perfiles locales guardados.'), 'empty-state')); return; }
      const grid = el('div', null, 'grid three');
      for (const item of items) {
        const result = hydrated.get(item.id), row = result?.row;
        const card = el('article', null, 'card saved-profile-card');
        card.append(el('h3', row?.n || item.name || tx('Saved profile', 'Perfil guardado')));
        const meta = el('p');
        if (row) meta.textContent = [window.FranklinI18n?.category?.(row.c) || row.c, row.l || row.g, tx('Source date: ', 'Fecha de la fuente: ') + Q.dateLabel(row.d, language())].filter(Boolean).join(' · ');
        else meta.textContent = result?.state === 'missing' ? tx('This profile is no longer in the current directory. Your bookmark has not been silently replaced.', 'Este perfil ya no está en el directorio actual. Su marcador no se ha sustituido por otro.') : result?.state === 'error' ? tx('Saved copy. The current listing could not be checked. Retry before relying on its details.', 'Copie guardada. No se pudo comprobar el perfil actual. Vuelva a intentarlo antes de confiar en sus datos.') : tx('Checking the current public listing…', 'Comprobando el perfil público actual…');
        const actions = el('div', null, 'actions');
        if (row) actions.append(link(tx('View profile', 'Ver perfil'), Q.canonicalProfile(row.i, language())), link(tx('Prepare before contacting', 'Preparar antes de contactar'), '/preparation-studio/?source=saved-profile'));
        else if (result?.state === 'error') actions.append(action(tx('Retry listing check', 'Volver a comprobar el perfil'), () => hydrateProfiles(true), 'retry-' + item.id));
        else if (result?.state === 'missing') actions.append(link(tx('Find local profiles', 'Buscar perfiles locales'), language() === 'es' ? '/es/directorio/' : '/directory/'));
        const remove = action(tx('Remove', 'Quitar'), () => {
          const before = readProfiles(); if (!writable(C.KEYS.profiles, before)) return;
          if (write(C.KEYS.profiles, before.value.filter(r => r.id !== item.id))) { announce('Bookmark removed from this device.', 'Marcador eliminado de este dispositivo.'); renderProfiles(); }
        }, 'remove-' + item.id);
        remove.setAttribute('aria-label', tx('Remove bookmark: ', 'Quitar marcador: ') + (row?.n || item.name || tx('saved profile', 'perfil guardado')));
        actions.append(remove); card.append(meta, actions); grid.append(card);
      }
      savedList.append(grid);
    });
  }
  async function hydrateProfiles(force = false) {
    const generation = ++hydrateGeneration, items = readProfiles().value.filter(x => force || !hydrated.has(x.id));
    let cursor = 0;
    await Promise.all(Array.from({length: Math.min(3, items.length)}, async () => {
      while (cursor < items.length) {
        const item = items[cursor++];
        try { const row = await D.profile(item.id); if (generation === hydrateGeneration) hydrated.set(item.id, {state: row ? 'ready' : 'missing', row}); }
        catch (_) { if (generation === hydrateGeneration) hydrated.set(item.id, {state: 'error'}); }
      }
    }));
    if (generation === hydrateGeneration) renderProfiles();
  }
  function downloadCalendar(item) {
    const text = C.calendar(item, language()); if (!text) return;
    try { const url = URL.createObjectURL(new Blob([text], {type: 'text/calendar;charset=utf-8'})); const a = document.createElement('a'); a.href = url; a.download = 'franklin-follow-up.ics'; a.hidden = true; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); announce('Calendar download requested. This is your chosen reminder, not an appointment or official deadline.', 'Se solicitó descargar el calendario. Es un recordatorio elegido por usted, no una cita ni un plazo oficial.'); }
    catch (_) { announce('Calendar download was unavailable. Keep your chosen date in your own calendar.', 'No se pudo descargar el calendario. Guarde la fecha elegida en su propio calendario.'); }
  }
  function renderReminders() {
    keepFocus(reminderList, () => {
      reminderList.replaceChildren(); const items = readReminders().value.sort((a, b) => Number(!!a.completedAt) - Number(!!b.completedAt) || (a.date || '9999').localeCompare(b.date || '9999') || a.id.localeCompare(b.id));
      if (!items.length) { reminderList.append(el('p', tx('No local reminders saved yet.', 'Todavía no hay recordatorios locales guardados.'), 'empty-state')); return; }
      const list = el('ul', null, 'reminder-list');
      for (const item of items) {
        const li = el('li'), body = el('div'); body.append(el('strong', item.label));
        body.append(el('p', item.completedAt ? tx('Done', 'Hecho') : item.date ? Q.dateLabel(item.date, language()) : tx('No follow-up date selected', 'No se eligió una fecha de seguimiento'), 'fine-print'));
        const actions = el('div', null, 'actions');
        const change = updater => { const before = readReminders(); if (!writable(C.KEYS.reminders, before)) return; if (write(C.KEYS.reminders, updater(before.value))) { renderReminders(); announce('Reminder updated on this device only.', 'Recordatorio actualizado solo en este dispositivo.'); } };
        const done = action(item.completedAt ? tx('Reopen', 'Reabrir') : tx('Mark as done', 'Marcar como hecho'), () => change(rows => rows.map(r => r.id === item.id ? {...r, completedAt: r.completedAt ? '' : new Date().toISOString()} : r)), 'done-' + item.id);
        done.setAttribute('aria-pressed', String(!!item.completedAt)); done.setAttribute('aria-label', (item.completedAt ? tx('Reopen ', 'Reabrir ') : tx('Mark as done: ', 'Marcar como hecho: ')) + item.label);
        actions.append(done);
        if (item.date) actions.append(action(tx('Add date to calendar', 'Agregar fecha al calendario'), () => downloadCalendar(item), 'calendar-' + item.id));
        const remove = action(tx('Remove', 'Quitar'), () => change(rows => rows.filter(r => r.id !== item.id)), 'remove-' + item.id); remove.setAttribute('aria-label', tx('Remove reminder: ', 'Quitar recordatorio: ') + item.label); actions.append(remove);
        li.append(body, actions); list.append(li);
      }
      reminderList.append(list);
    });
  }
  function renderAll() { renderPrefs(); renderReminders(); renderProfiles(); renderRecovery(); }
  function localizedLabels() {
    root.querySelectorAll('[data-device-en][data-device-es]').forEach(n => { n.textContent = n.dataset[language() === 'es' ? 'deviceEs' : 'deviceEn']; });
    renderAll();
  }
  form.addEventListener('submit', event => {
    event.preventDefault(); const before = readPrefs(); if (!writable(C.KEYS.preferences, before)) return;
    const fd = new FormData(form), prefs = C.preferences({community: C.EDITION, area: String(fd.get('area') || ''), interests: fd.getAll('interests'), savedAt: new Date().toISOString()});
    if (write(C.KEYS.preferences, prefs)) { renderPrefs(); announce('Preferences saved on this device only. Nothing was sent to Franklin Navigator.', 'Preferencias guardadas solo en este dispositivo. No se envió nada a Franklin Navigator.'); }
  });
  reminderForm.addEventListener('submit', event => {
    event.preventDefault(); const fd = new FormData(reminderForm), label = C.short(fd.get('label')), rawDate = String(fd.get('date') || ''), chosenDate = C.date(rawDate);
    if (!label) { announce('Enter a short reminder.', 'Escriba un recordatorio breve.'); return; }
    if (rawDate && !chosenDate) { announce('Choose a valid calendar date.', 'Elija una fecha válida del calendario.'); return; }
    const before = readReminders(); if (!writable(C.KEYS.reminders, before)) return;
    if (before.value.length >= 25) { announce('You have 25 reminders. Remove one before saving another; nothing was silently discarded.', 'Tiene 25 recordatorios. Quite uno antes de guardar otro; no se ha descartado nada automáticamente.'); return; }
    const item = {community: C.EDITION, id: 'r-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2)), label, date: chosenDate, createdAt: new Date().toISOString(), completedAt: ''};
    if (write(C.KEYS.reminders, [...before.value, item])) { reminderForm.reset(); renderReminders(); announce('Reminder saved on this device only. No notification service or appointment was created.', 'Recordatorio guardado solo en este dispositivo. No se creó ningún servicio de notificación ni cita.'); }
  });
  reset.addEventListener('click', event => {
    event.preventDefault(); event.stopImmediatePropagation(); resetPanel.hidden = false; $('[data-device-reset-yes]').focus();
  }, true);
  $('[data-device-reset-no]').addEventListener('click', () => { resetPanel.hidden = true; reset.focus(); });
  $('[data-device-reset-yes]').addEventListener('click', () => {
    const result = store.clear(); hydrateGeneration++; hydrated.clear(); resetPanel.hidden = true;
    if (result.ok) { form.reset(); reminderForm.reset(); announce('Franklin preferences, reminders, bookmarks, action plans and Assistant plans were removed from this device. Your membership account and other websites were not changed.', 'Se eliminaron de este dispositivo las preferencias, recordatorios, marcadores y planes de Franklin. No se modificaron su cuenta de membresía ni otros sitios web.'); }
    else announce('Some saved Franklin data could not be removed. We have not marked it all deleted. Retry or use your browser’s site-data controls.', 'No se pudieron eliminar algunos datos guardados de Franklin. No se ha indicado que todo esté eliminado. Inténtelo de nuevo o use los controles de datos del navegador.');
    renderAll(); window.FranklinR34SavedPlans?.render?.(); window.FranklinR38Assistant?.renderSaved?.(); reset.focus();
  });
  async function importRequestedProfile(params) {
    const id = params.get('saveProfile'); if (!id) return;
    if (!C.PROFILE_ID.test(id)) { announce('That bookmark request was not a Franklin profile. Nothing was saved.', 'La solicitud no corresponde a un perfil de Franklin. No se guardó nada.'); return; }
    importPending = true;
    try {
      const row = await D.profile(id); if (!row) throw Error('No current profile');
      const before = readProfiles(); if (!writable(C.KEYS.profiles, before)) return;
      if (before.value.some(x => x.id === id)) { hydrated.set(id, {state: 'ready', row}); announce('This profile was already saved on this device.', 'Este perfil ya estaba guardado en este dispositivo.'); return; }
      if (before.value.length >= 25) { announce('You can save up to 25 profiles. Remove one before saving another.', 'Puede guardar hasta 25 perfiles. Quite uno antes de guardar otro.'); return; }
      const item = {community: C.EDITION, id: row.i, name: row.n, category: row.c, location: row.l || row.g, checked: row.d, savedAt: new Date().toISOString()};
      if (write(C.KEYS.profiles, [item, ...before.value])) { hydrated.set(id, {state: 'ready', row}); announce('Public profile saved on this device only.', 'Perfil público guardado solo en este dispositivo.'); }
    } catch (_) { announce('That current profile could not be checked and saved. Please return to the directory and try again.', 'No se pudo comprobar y guardar el perfil actual. Vuelva al directorio e inténtelo de nuevo.'); }
    finally { importPending = false; renderProfiles(); renderRecovery(); }
  }
  function prefillReminder(params) {
    const label = C.short(params.get('newReminder')); if (!label) return;
    reminderForm.elements.label.value = label; reminderForm.elements.date.value = C.date(params.get('date'));
    announce('Review the reminder below, then choose Save reminder. A link alone does not add a reminder.', 'Revise el recordatorio y luego elija Guardar recordatorio. Un enlace por sí solo no agrega un recordatorio.');
    reminderForm.elements.label.focus({preventScroll: true});
  }
  const prefs = readPrefs().value;
  if (prefs) { form.elements.area.value = prefs.area; form.querySelectorAll('input[name="interests"]').forEach(input => input.checked = prefs.interests.includes(input.value)); }
  for (const n of [output, savedList, reminderList, recovery, status, resetPanel]) n.dataset.franklinNativeLocale = '';
  savedList.tabIndex = reminderList.tabIndex = recovery.tabIndex = -1;
  status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
  localizedLabels(); hydrateProfiles();
  const initial = new URLSearchParams(location.search);
  importRequestedProfile(initial).finally(() => {
    prefillReminder(initial);
    if (initial.has('saveProfile') || initial.has('newReminder')) {
      const reminderDraft = initial.has('newReminder');
      for (const key of ['saveProfile', 'chunk', 'newReminder', 'date']) initial.delete(key);
      try { history.replaceState(history.state, '', location.pathname + (initial.toString() ? '?' + initial : '') + (reminderDraft ? '#follow-ups' : location.hash)); } catch (_) {}
    }
  });
  window.addEventListener('franklinlanguagechange', localizedLabels);
  window.addEventListener('storage', event => { if (Object.values(C.KEYS).includes(event.key) || event.key === null) { renderAll(); hydrateProfiles(true); } });
})();
