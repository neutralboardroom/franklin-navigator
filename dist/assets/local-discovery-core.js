/* Franklin-owned factual discovery helpers. No external search, storage or ranking service. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FranklinDiscoveryCore = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const EDITION = 'FRANKLIN_TN';
  const ID = /^FR-(?:ORG|PER|NPI|IRS|TDHS|GOV|HLT|EDU|CIV|NPO|PRO)-[A-Za-z0-9._~-]{1,170}$/;
  const MAX = 100000;
  const norm = value => String(value == null ? '' : value).normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  // Query-language equivalents only: never populate a profile's specialty or factual fields.
  const synonymGroups = [
    ['dentist', 'dentists', 'dentistry', 'dental', 'dentista', 'dentistas'],
    ['attorney', 'attorneys', 'lawyer', 'lawyers', 'abogado', 'abogados'],
    ['plumber', 'plumbers', 'plumbing', 'plomero', 'plomeros', 'fontanero'],
    ['restaurant', 'restaurants', 'restaurante', 'restaurantes'],
    ['veterinarian', 'veterinary', 'veterinario', 'veterinarios'],
    ['pharmacy', 'pharmacies', 'farmacia', 'farmacias'],
    ['electrician', 'electricians', 'electricista', 'electricistas'],
    ['pediatrician', 'pediatrics', 'pediatra', 'pediatras'],
    ['library', 'libraries', 'biblioteca', 'bibliotecas'],
    ['childcare', 'daycare', 'guarderia', 'guarderias'],
    ['mechanic', 'mechanics', 'mecanico', 'mecanicos'],
    ['nonprofit', 'nonprofits', 'non profit'],
    ['therapist', 'therapists', 'therapy', 'terapeuta', 'terapia'],
    ['accountant', 'accountants', 'contable', 'contador']
  ];
  const aliases = new Map();
  synonymGroups.forEach(group => group.forEach(word => aliases.set(word, group)));
  const noise = new Set(['i', 'a', 'an', 'the', 'in', 'near', 'find', 'need', 'help', 'me', 'my', 'please', 'busco', 'necesito', 'un', 'una', 'el', 'la', 'en', 'buscar', 'por', 'favor']);
  function queryTerms(value) {
    const raw = norm(String(value || '').slice(0, 160)).split(' ').filter(Boolean);
    const meaningful = raw.filter(word => !noise.has(word));
    return [...new Set(meaningful.length ? meaningful : raw)].slice(0, 12).map(word => aliases.get(word) || [word]);
  }
  function plain(value, max) {
    if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw Error('Invalid text');
    return value;
  }
  function safeWebsite(value) {
    if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\u007f]/.test(value) || !/^https?:\/\//i.test(value)) return '';
    try {
      const u = new URL(value), host = u.hostname.toLowerCase();
      if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || !host || !host.includes('.') || u.port) return '';
      if (/^(?:localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host) || host.includes(':') || /\.(?:local|internal|invalid|test)$/.test(host)) return '';
      if ([...u.searchParams.keys()].some(key => /^(?:token|access_token|session|sessionid|password|secret|api_key|apikey|auth|authorization)$/i.test(key))) return '';
      return value;
    } catch (_) { return ''; }
  }
  const phoneHref = value => typeof value === 'string' && /^[+\d().\s-]{7,30}$/.test(value) && value.replace(/\D/g, '').length >= 7 ? 'tel:' + value.replace(/[^+\d]/g, '') : '';
  const emailHref = value => typeof value === 'string' && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(value) && value.length <= 254 ? 'mailto:' + value : '';
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + 'T12:00:00Z');
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value && +value.slice(0, 4) >= 1900 && +value.slice(0, 4) <= 9998;
  }
  function dateLabel(value, language) {
    if (!validDate(value)) return language === 'es' ? 'Fecha no indicada' : 'Date not supplied';
    return new Intl.DateTimeFormat(language === 'es' ? 'es-US' : 'en-US', {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'}).format(new Date(value + 'T12:00:00Z'));
  }
  const dictionaryValue = (values, key) => {
    if (!Array.isArray(values) || !Number.isInteger(key) || key < 0 || key >= values.length) throw Error('Invalid dictionary reference');
    return plain(values[key], 2048);
  };
  function decodeIndex(input) {
    if (!input || input.schemaVersion !== 'franklin.discovery-index.v1' || input.community !== EDITION || !Array.isArray(input.rows) || input.rows.length !== input.recordCount || input.recordCount < 1 || input.recordCount > MAX) throw Error('Wrong directory source');
    for (const key of ['categories', 'types', 'areas', 'dates', 'websites']) if (!Array.isArray(input[key]) || input[key].length > MAX) throw Error('Invalid dictionary');
    const seen = new Set();
    return input.rows.map(a => {
      if (!Array.isArray(a) || a.length !== 12 || !ID.test(a[0]) || seen.has(a[0]) || typeof a[10] !== 'boolean' || !Number.isInteger(a[11]) || a[11] < 1 || a[11] > 500) throw Error('Invalid profile row');
      seen.add(a[0]);
      const row = {i: a[0], n: plain(a[1], 500), l: plain(a[2], 2000), c: dictionaryValue(input.categories, a[3]), t: dictionaryValue(input.types, a[4]), g: dictionaryValue(input.areas, a[5]), w: dictionaryValue(input.websites, a[6]) || null, p: plain(a[7], 100), e: plain(a[8], 500), d: dictionaryValue(input.dates, a[9]), h: a[10], x: a[11]};
      if (!row.n.trim()) throw Error('Missing profile name');
      row.websiteHref = safeWebsite(row.w);
      row.phoneHref = phoneHref(row.p);
      row.emailHref = emailHref(row.e);
      row.searchText = norm([row.n, row.c, row.t, row.g, row.l].join(' '));
      row.nameKey = norm(row.n);
      return Object.freeze(row);
    });
  }
  function cleanState(raw = {}) {
    const rawFacts = Array.isArray(raw.facts) ? raw.facts : typeof raw.facts === 'string' ? raw.facts.split(',') : [];
    return {
      q: String(raw.q || '').slice(0, 160), category: String(raw.category || '').slice(0, 300), type: String(raw.type || '').slice(0, 100), area: String(raw.area || '').slice(0, 200),
      sort: ['local', 'name', 'checked', 'website', 'address'].includes(raw.sort) ? raw.sort : 'local',
      facts: [...new Set(rawFacts.filter(x => ['website', 'phone', 'email', 'address'].includes(x)))].sort(),
      page: Number.isInteger(Number(raw.page)) && Number(raw.page) >= 1 && Number(raw.page) <= MAX ? Number(raw.page) : 1
    };
  }
  function stateFromSearch(search) { const p = new URLSearchParams(search); return cleanState(Object.fromEntries(p.entries())); }
  function searchParams(raw) {
    const state = cleanState(raw), p = new URLSearchParams();
    for (const k of ['q', 'category', 'type', 'area']) if (state[k]) p.set(k, state[k]);
    if (state.sort !== 'local') p.set('sort', state.sort);
    if (state.facts.length) p.set('facts', state.facts.join(','));
    if (state.page > 1) p.set('page', String(state.page));
    return p.toString();
  }
  function matchRows(rows, raw) {
    const s = cleanState(raw), terms = queryTerms(s.q);
    const matches = rows.filter(r => (!s.category || r.c === s.category) && (!s.type || r.t === s.type) && (!s.area || r.g === s.area) && terms.every(group => group.some(word => r.searchText.includes(word))) && s.facts.every(f => f === 'website' ? !!r.websiteHref : f === 'phone' ? !!r.phoneHref : f === 'email' ? !!r.emailHref : r.h));
    const compare = (a, b) => a.nameKey < b.nameKey ? -1 : a.nameKey > b.nameKey ? 1 : a.i < b.i ? -1 : a.i > b.i ? 1 : 0;
    // HF3.6 local relevance and conservative duplicate suppression.
    const canonicalName = value => norm(value).replace(/\bone\b/g, '1').replace(/\btwo\b/g, '2').replace(/\b(?:llc|inc|incorporated|corp|corporation|pc|pllc|ltd)\b/g, '').replace(/\s+/g, ' ').trim();
    const canonicalAddress = value => norm(value)
      .replace(/\bnorth\b/g, 'n').replace(/\bsouth\b/g, 's').replace(/\beast\b/g, 'e').replace(/\bwest\b/g, 'w')
      .replace(/\bavenue\b/g, 'ave').replace(/\bstreet\b/g, 'st').replace(/\broad\b/g, 'rd').replace(/\bboulevard\b/g, 'blvd').replace(/\bdrive\b/g, 'dr').replace(/\blane\b/g, 'ln').replace(/\bplace\b/g, 'pl')
      .replace(/\bfranklin (?:tennessee|tn) \d{5}(?: \d{4})?\b/g, '').replace(/\bfranklin (?:tennessee|tn)\b/g, '').replace(/\btn \d{5}(?: \d{4})?\b/g, '')
      .replace(/\s+/g, ' ').trim();
    const deduped = [], seenIdentity = new Set();
    for (const r of matches) {
      const address = canonicalAddress(r.l);
      const key = address ? address + '|' + canonicalName(r.n) : '';
      if (key && seenIdentity.has(key)) continue;
      if (key) seenIdentity.add(key);
      deduped.push(r);
    }
    const localRank = r => {
      const t = norm([r.g, r.l].join(' '));
      const geo = t.includes('franklin') ? 0 : t.includes('williamson') ? 1 : 2;
      const contacts = Number(!!r.websiteHref) + Number(!!r.phoneHref) + Number(!!r.emailHref);
      const sourceOnly = /^FR-IRS-/.test(r.i) && contacts === 0 ? 1 : 0;
      return geo * 100 + sourceOnly * 18 + (3 - contacts) * 4 + (r.h ? 0 : 2);
    };
    deduped.sort((a, b) => (s.sort === 'local' ? localRank(a) - localRank(b) : s.sort === 'checked' ? (validDate(b.d) ? b.d : '').localeCompare(validDate(a.d) ? a.d : '') : s.sort === 'website' ? Number(!!b.websiteHref) - Number(!!a.websiteHref) : s.sort === 'address' ? Number(b.h) - Number(a.h) : 0) || compare(a, b));
    // HF3.9 default browse diversification: factual, payment-neutral, and deterministic.
    if (s.sort === 'local' && !s.q && !s.category && !s.type && !s.area && !s.facts.length) {
      const facilityRoot = r => { const m = norm(r.n).match(/^(.+?\b(?:park|farm))\b/); return m ? m[1] : ''; };
      const seenFacility = new Set(), primary = [], related = [];
      for (const r of deduped) { const k = facilityRoot(r); if (k && seenFacility.has(k)) related.push(r); else { if (k) seenFacility.add(k); primary.push(r); } }
      const ordered = primary.concat(related);
      const family = r => { const t = norm([r.c, r.t, r.n].join(' '));
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
        return 'general-services'; };
      const first = [], rest = [], counts = new Map();
      for (const r of ordered) { const f = family(r), n = counts.get(f) || 0; if (first.length < 16 && n < 2) { first.push(r); counts.set(f, n + 1); } else rest.push(r); }
      return first.concat(rest);
    }
    return deduped;
  }
  function shardFor(id) {
    if (typeof id !== 'string' || !ID.test(id)) throw Error('Invalid profile identifier');
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
    return (h % 64).toString(16).padStart(2, '0');
  }
  function canonicalProfile(id, language) {
    if (!ID.test(String(id || ''))) return '';
    return '/profiles/' + encodeURIComponent(id) + '/' + (language === 'es' ? '?lang=es' : '');
  }
  return Object.freeze({EDITION, ID, norm, queryTerms, safeWebsite, phoneHref, emailHref, validDate, dateLabel, decodeIndex, cleanState, stateFromSearch, searchParams, matchRows, shardFor, canonicalProfile});
});
