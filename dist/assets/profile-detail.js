/* Resolve legacy query links to the existing canonical profile, never create a second profile. */
(() => {
  'use strict';
  const root = document.querySelector('[data-profile-detail]'); if (!root) return;
  const C = window.FranklinDiscoveryCore, D = window.FranklinDiscoveryData;
  const status = root.querySelector('[data-profile-status]'), article = root.querySelector('[data-profile-body]');
  const params = new URLSearchParams(location.search), id = params.get('id') || '';
  const lang = () => document.documentElement.lang.startsWith('es') || params.get('lang') === 'es' ? 'es' : 'en';
  const tx = (en, es) => lang() === 'es' ? es : en;
  article.hidden = true; status.dataset.franklinNativeLocale = ''; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const choices = document.createElement('div'); choices.className = 'actions'; choices.dataset.franklinNativeLocale = ''; status.after(choices);
  function show(message, canRetry = false) {
    status.textContent = message; choices.replaceChildren();
    if (canRetry) { const b = document.createElement('button'); b.type = 'button'; b.className = 'button'; b.textContent = tx('Try again', 'Intentar de nuevo'); b.addEventListener('click', resolve); choices.append(b); }
    const a = document.createElement('a'); a.href = lang() === 'es' ? '/es/directorio/' : '/directory/'; a.className = 'button'; a.textContent = tx('Find local profiles', 'Encontrar perfiles locales'); choices.append(a);
  }
  async function resolve() {
    if (!C || !D || !C.ID.test(id)) { show(tx('Choose a profile from Find Local. That link does not identify a Franklin profile.', 'Elija un perfil en el directorio local. Ese enlace no identifica un perfil de Franklin.')); return; }
    show(tx('Opening the listed profile…', 'Abriendo el perfil indicado…')); root.setAttribute('aria-busy', 'true');
    try {
      const row = await D.profile(id);
      if (!row) { show(tx('That profile is not in the current directory. Search by name instead; no replacement has been guessed.', 'Ese perfil no está en el directorio actual. Busque por nombre; no se ha supuesto ningún reemplazo.')); return; }
      const destination = C.canonicalProfile(row.i, lang());
      const a = document.createElement('a'); a.href = destination; a.textContent = tx('Open ', 'Abrir ') + row.n; a.className = 'button primary'; choices.prepend(a);
      // Only an exact source-checked ID can become an internal canonical destination.
      location.replace(destination);
    } catch (_) { show(tx('The profile could not be checked. Nothing has been replaced. Retry or search the directory.', 'No se pudo comprobar el perfil. No se ha reemplazado nada. Inténtelo de nuevo o busque en el directorio.'), true); }
    finally { root.setAttribute('aria-busy', 'false'); }
  }
  resolve();
})();
