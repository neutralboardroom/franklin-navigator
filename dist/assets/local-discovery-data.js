/* Exact-source public data loading. Integrity is not an upstream acceptance claim. */
(() => {
  'use strict';
  const C = window.FranklinDiscoveryCore;
  if (!C) return;
  let manifestPromise, indexPromise;
  const shards = new Map();
  async function verified(path, expectedHash, maxBytes) {
    if (!/^\/data\/discovery\/[a-zA-Z0-9._/-]+\.json$/.test(path) || path.includes('..') || !/^[a-f0-9]{64}$/.test(expectedHash)) throw Error('Invalid source binding');
    if (!window.crypto?.subtle) throw Error('Secure source checking unavailable');
    const control = new AbortController(), timer = setTimeout(() => control.abort(), 20000);
    try {
      const response = await fetch(path, {credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-cache', signal: control.signal});
      if (!response.ok || !/application\/json/i.test(response.headers.get('content-type') || '')) throw Error('Public directory unavailable');
      const declared = Number(response.headers.get('content-length') || 0);
      if (declared > maxBytes) throw Error('Source response too large');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > maxBytes) throw Error('Source response too large');
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
      if (digest !== expectedHash) throw Error('Source data changed');
      return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
    } finally { clearTimeout(timer); }
  }
  async function manifest() {
    if (!manifestPromise) manifestPromise = (async () => {
      const meta = document.querySelector('meta[name="franklin-discovery-manifest"]');
      if (!meta) throw Error('Missing public source binding');
      const data = await verified(meta.content, meta.dataset.sha256 || '', 64000);
      if (data.community !== C.EDITION || data.schemaVersion !== 'franklin.discovery-manifest.v1' || !Array.isArray(data.shards) || data.shards.length !== 64 || !data.index || !Number.isInteger(data.recordCount)) throw Error('Wrong public source');
      return data;
    })().catch(e => { manifestPromise = undefined; throw e; });
    return manifestPromise;
  }
  async function all() {
    if (!indexPromise) indexPromise = (async () => {
      const m = await manifest(), raw = await verified(m.index.file, m.index.sha256, 12000000);
      const rows = C.decodeIndex(raw);
      if (rows.length !== m.recordCount || raw.sourceManifestSha256 !== m.sourceManifestSha256) throw Error('Directory set mismatch');
      return rows;
    })().catch(e => { indexPromise = undefined; throw e; });
    return indexPromise;
  }
  async function profile(id) {
    const shard = C.shardFor(id), m = await manifest();
    const entry = m.shards.find(x => x.id === shard);
    if (!entry) throw Error('Missing route source');
    if (!shards.has(shard)) shards.set(shard, verified(entry.file, entry.sha256, 600000).then(d => {
      if (d.community !== C.EDITION || d.schemaVersion !== 'franklin.profile-route-shard.v1' || d.sourceManifestSha256 !== m.sourceManifestSha256 || !Array.isArray(d.records) || d.records.length !== entry.count) throw Error('Invalid profile routes');
      const rows = C.decodeIndex({...d, schemaVersion: 'franklin.discovery-index.v1', rows: d.records, recordCount: d.records.length});
      if (rows.some(r => C.shardFor(r.i) !== shard)) throw Error('Wrong shard');
      return new Map(rows.map(r => [r.i, r]));
    }).catch(e => { shards.delete(shard); throw e; }));
    return (await shards.get(shard)).get(id) || null;
  }
  window.FranklinDiscoveryData = Object.freeze({all, profile, manifest});
})();
