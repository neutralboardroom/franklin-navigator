/* Franklin-owned device data boundary. This module never sends requests or stores credentials. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FranklinDeviceCore = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const EDITION = 'FRANKLIN_TN';
  const KEYS = Object.freeze({preferences: 'franklinNavigator.myFranklin.v1', reminders: 'franklinNavigator.reminders.v1', profiles: 'franklinNavigator.savedProfiles.v1', actions: 'franklinNavigator.savedActionPlans.v1', assistant: 'franklinNavigator.assistantPlans.v1'});
  const ALLOWED_KEYS = new Set(Object.values(KEYS));
  const INTERESTS = new Set(['newcomer', 'homeowner', 'renter', 'children', 'caregiver', 'transit', 'business', 'civic', 'events', 'jobs', 'parks']);
  const PROFILE_ID = /^FR-(?:ORG|PER|NPI|IRS|TDHS|GOV|HLT|EDU|CIV|NPO|PRO)-[A-Za-z0-9._~-]{1,170}$/;
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const owned = x => !x.community || x.community === EDITION;
  const short = (value, max = 120) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
  function date(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || +value.slice(0, 4) < 1900 || +value.slice(0, 4) > 9998) return '';
    const d = new Date(value + 'T12:00:00Z');
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value ? value : '';
  }
  function iso(value) { return typeof value === 'string' && value.length <= 40 && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value)) ? value : ''; }
  function preferences(value) {
    if (!object(value) || !owned(value)) return null;
    if (!Array.isArray(value.interests)) return null;
    return {community: EDITION, area: ['franklin', 'williamson'].includes(value.area) ? value.area : 'franklin', interests: [...new Set(value.interests.filter(x => INTERESTS.has(x)))], savedAt: iso(value.savedAt)};
  }
  function reminders(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value.filter(x => object(x) && owned(x) && typeof x.id === 'string' && /^r-[A-Za-z0-9-]{1,100}$/.test(x.id) && short(x.label) && !seen.has(x.id) && seen.add(x.id)).slice(0, 25)
      .map(x => ({community: EDITION, id: x.id, label: short(x.label), date: date(x.date), createdAt: iso(x.createdAt), completedAt: iso(x.completedAt)}));
  }
  function profiles(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value.filter(x => object(x) && owned(x) && typeof x.id === 'string' && PROFILE_ID.test(x.id) && !seen.has(x.id) && seen.add(x.id)).slice(0, 25)
      .map(x => ({community: EDITION, id: x.id, name: short(x.name, 500), category: short(x.category, 300), location: short(x.location, 2000), checked: date(x.checked), savedAt: iso(x.savedAt)}));
  }
  function createStore(getStorage) {
    function keyAllowed(key) { if (!ALLOWED_KEYS.has(key)) throw Error('Unowned device key'); }
    function read(key, fallback, clean) {
      keyAllowed(key);
      try {
        const storage = getStorage(), raw = storage.getItem(key);
        if (raw == null) return {value: fallback, status: 'empty'};
        if (raw.length > 500000) return {value: fallback, status: 'damaged'};
        let parsed; try { parsed = JSON.parse(raw); } catch (_) { return {value: fallback, status: 'damaged'}; }
        const value = clean(parsed);
        const wrongShape = Array.isArray(fallback) ? !Array.isArray(parsed) : parsed !== null && !object(parsed);
        const lostRecords = Array.isArray(parsed) && Array.isArray(value) && value.length !== parsed.length;
        const rejectedObject = object(parsed) && value == null;
        return {value, status: wrongShape || lostRecords || rejectedObject ? 'damaged' : 'ok'};
      } catch (_) { return {value: fallback, status: 'unavailable'}; }
    }
    function write(key, value) {
      keyAllowed(key);
      try { const text = JSON.stringify(value); if (text.length > 500000) return false; const storage = getStorage(); storage.setItem(key, text); return storage.getItem(key) === text; } catch (_) { return false; }
    }
    function clear() {
      const remaining = [];
      let storage;
      try { storage = getStorage(); } catch (_) { return {ok: false, remaining: [...ALLOWED_KEYS]}; }
      for (const key of ALLOWED_KEYS) {
        try { storage.removeItem(key); if (storage.getItem(key) != null) remaining.push(key); } catch (_) { remaining.push(key); }
      }
      return {ok: remaining.length === 0, remaining};
    }
    return Object.freeze({read, write, clear});
  }
  function escapeIcs(value) { return String(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
  function foldIcs(value) {
    const encoder = new TextEncoder(), lines = []; let current = '', bytes = 0;
    for (const ch of value) {
      const size = encoder.encode(ch).length;
      if (bytes + size > 75) { lines.push(current); current = ' '; bytes = 1; }
      current += ch; bytes += size;
    }
    lines.push(current); return lines.join('\r\n');
  }
  function calendar(item, language = 'en', now = new Date()) {
    const chosenDate = date(item?.date);
    if (!chosenDate || !short(item?.label)) return '';
    const start = chosenDate.replace(/-/g, '');
    const end = new Date(chosenDate + 'T12:00:00Z'); end.setUTCDate(end.getUTCDate() + 1);
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const id = typeof item.id === 'string' && /^r-[A-Za-z0-9-]{1,100}$/.test(item.id) ? item.id : 'r-follow-up';
    const description = language === 'es' ? 'Fecha de seguimiento elegida por usted. No es una cita confirmada ni un plazo oficial. No se envió nada a Franklin Navigator.' : 'A follow-up date you chose. Not a confirmed appointment or an official deadline. Nothing was sent to Franklin Navigator.';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Franklin Navigator//Device Follow-up//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:' + id + '@franklinnavigator.com', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + start, 'DTEND;VALUE=DATE:' + end.toISOString().slice(0, 10).replace(/-/g, ''), 'SUMMARY:' + escapeIcs(short(item.label)), 'DESCRIPTION:' + escapeIcs(description), 'TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR', ''];
    return lines.map(foldIcs).join('\r\n');
  }
  return Object.freeze({EDITION, KEYS, INTERESTS, PROFILE_ID, short, date, iso, preferences, reminders, profiles, createStore, calendar, escapeIcs, foldIcs});
});
