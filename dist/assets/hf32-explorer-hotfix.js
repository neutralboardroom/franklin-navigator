(() => {
  'use strict';

  const root = document.querySelector('[data-community-explorer]');
  if (!root) return;

  document.body.classList.add('hf32-site-cleanup', 'hf31-explorer-page', 'hf32-explorer-hotfix');

  const q = (selector, base = root) => base.querySelector(selector);
  const qa = (selector, base = root) => [...base.querySelectorAll(selector)];
  const isEs = () => document.documentElement.lang === 'es' || location.pathname.startsWith('/es/');

  /* The accepted activity catalog is embedded at build time on explorer pages.
     Serve that exact static payload to the existing explorer runtime so first render
     does not depend on a second network request. Other fetches remain untouched. */
  const payloadNode = document.querySelector('script[data-explorer-static-payload]');
  const payloadText = payloadNode?.textContent?.trim() || '';
  if (payloadText && typeof window.fetch === 'function' && typeof window.Response === 'function') {
    try {
      const parsed = JSON.parse(payloadText);
      if (parsed?.schemaVersion === 'franklin.activities.v1' && parsed?.edition === 'FRANKLIN_TN' && Array.isArray(parsed.startingPoints) && Array.isArray(parsed.currentWindow)) {
        const nativeFetch = window.fetch.bind(window);
        window.fetch = (input, init) => {
          try {
            const raw = typeof input === 'string' ? input : input?.url;
            const url = new URL(raw || '', location.href);
            if (url.origin === location.origin && url.pathname === '/data/franklin-activities.json') {
              return Promise.resolve(new Response(payloadText, {
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
              }));
            }
          } catch {}
          return nativeFetch(input, init);
        };
      }
    } catch (error) {
      console.warn('Franklin explorer embedded catalog could not be prepared.', error);
    }
  }

  const hero = q('.explorer-hero');
  const finder = q('#finder');
  const heroCard = q('.explorer-hero-card');
  if (heroCard) heroCard.hidden = true;
  if (hero && finder && finder.previousElementSibling !== hero) hero.after(finder);

  /* Keep the broad cross-navigation, but collapse it so the requested local results
     are the first substantive content after the hero. */
  if (!q('.hf32-explorer-other')) {
    const activity = qa(':scope > section').find(section => /Activity hubs|Centros de actividades/i.test(section.getAttribute('aria-label') || ''));
    const sports = q('.explorer-sport-routes');
    if (activity || sports) {
      const section = document.createElement('section');
      section.className = 'section hf32-explorer-other';
      const wrap = document.createElement('div');
      wrap.className = 'wrap';
      const details = document.createElement('details');
      details.className = 'hf32-explorer-other-details';
      const summary = document.createElement('summary');
      summary.textContent = isEs() ? 'Explorar otros deportes y actividades' : 'Explore other sports and activities';
      const content = document.createElement('div');
      content.className = 'hf32-explorer-other-content';
      if (activity) {
        const activityWrap = q('.wrap', activity);
        if (activityWrap) content.append(...[...activityWrap.children]);
        activity.remove();
      }
      if (sports) {
        const sportsWrap = q('.wrap', sports);
        if (sportsWrap) content.append(...[...sportsWrap.children]);
        sports.remove();
      }
      details.append(summary, content);
      wrap.append(details);
      section.append(wrap);
      (finder || hero)?.after(section);
    }
  }

  /* A generic Recreation Complex address is not necessarily relevant to a scoped
     sport or activity result. Individual result/source links retain their facts. */
  const genericAddress = q('.explorer-address');
  if (genericAddress) genericAddress.closest('section')?.remove();

  /* Empty current-event bands and shortlist workspaces should not reserve screens. */
  const currentSection = q('[data-explorer-current-section]');
  const currentGrid = q('[data-explorer-current]');
  const currentEmpty = q('[data-explorer-current-empty]');
  const tuneCurrent = () => {
    if (!currentSection) return;
    const hasCards = Boolean(currentGrid?.querySelector('.explorer-current-card'));
    const settledEmpty = Boolean(currentEmpty && !currentEmpty.hidden && !hasCards);
    currentSection.hidden = !hasCards && settledEmpty;
  };
  if (currentSection) currentSection.hidden = true;
  if (currentGrid) new MutationObserver(tuneCurrent).observe(currentGrid, { childList: true, subtree: true });
  if (currentEmpty) new MutationObserver(tuneCurrent).observe(currentEmpty, { attributes: true, attributeFilter: ['hidden'] });

  const shortlistSection = q('#short-list');
  if (shortlistSection) shortlistSection.hidden = true;
  q('[data-explorer-build]')?.addEventListener('click', () => {
    if (!shortlistSection) return;
    shortlistSection.hidden = false;
  });
  q('[data-explorer-clear]')?.addEventListener('click', () => {
    if (shortlistSection) shortlistSection.hidden = true;
  });

  /* Small scoped result sets do not need four prominent filter controls. */
  const resultGrid = q('[data-explorer-grid]');
  const controls = q('.explorer-controls');
  const tuneResults = () => {
    if (!resultGrid || !controls) return;
    const cards = qa('.explorer-card', resultGrid);
    controls.classList.toggle('hf32-explorer-small-result', cards.length > 0 && cards.length <= 4);
  };
  if (resultGrid) new MutationObserver(tuneResults).observe(resultGrid, { childList: true, subtree: true });
  setTimeout(tuneResults, 0);
})();
