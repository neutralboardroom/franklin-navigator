import fs from 'node:fs/promises';
import path from 'node:path';
import { URL } from 'node:url';

const root = path.resolve('dist');
const SELF = new Set(['franklinnavigator.com','www.franklinnavigator.com']);
const TIMEOUT_MS = 7000;
const CONCURRENCY = 80;

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

const htmlFiles = (await walk(root)).filter(f => f.endsWith('.html'));
const refs = new Map();
const internalAbs = new Set();
const generatedMaps = new Set();

for (const file of htmlFiles) {
  const rel = path.relative(root, file).replaceAll('\\','/');
  const html = await fs.readFile(file, 'utf8');
  const re = /(?:href|src|action)\s*=\s*["']([^"']+)["']/gi;
  for (const m of html.matchAll(re)) {
    const raw = m[1].trim();
    if (!/^https?:\/\//i.test(raw)) continue;
    let u;
    try { u = new URL(raw); } catch { continue; }
    const host = u.hostname.toLowerCase();
    if (SELF.has(host)) {
      internalAbs.add(raw);
      continue;
    }
    if ((host === 'google.com' || host === 'www.google.com') && u.pathname.startsWith('/maps/search/')) {
      generatedMaps.add(raw);
      continue;
    }
    const info = refs.get(raw) || { url: raw, count: 0, pages: [] };
    info.count++;
    if (info.pages.length < 8) info.pages.push(rel);
    refs.set(raw, info);
  }
}

function roundRobinByHost(items) {
  const groups = new Map();
  for (const item of items) {
    const h = new URL(item.url).hostname.toLowerCase();
    if (!groups.has(h)) groups.set(h, []);
    groups.get(h).push(item);
  }
  const queues = [...groups.values()].sort((a,b)=>b.length-a.length);
  const out = [];
  let remaining = items.length;
  while (remaining) {
    for (const q of queues) if (q.length) { out.push(q.shift()); remaining--; }
  }
  return out;
}

async function fetchOnce(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'FranklinNavigator-LinkAudit/1.0 (+https://franklinnavigator.com)',
        ...(method === 'GET' ? { range: 'bytes=0-1023' } : {})
      }
    });
    if (res.body) { try { await res.body.cancel(); } catch {} }
    return { ok: true, status: res.status, finalUrl: res.url };
  } catch (e) {
    return { ok: false, error: String(e?.cause?.code || e?.name || e?.message || e) };
  } finally { clearTimeout(timer); }
}

async function probe(item) {
  const started = Date.now();
  let r = await fetchOnce(item.url, 'HEAD');
  if (!r.ok || r.status >= 400 || r.status === 405 || r.status === 501) {
    const g = await fetchOnce(item.url, 'GET');
    if (g.ok || !r.ok) r = g;
  }
  let bucket;
  if (!r.ok) bucket = 'network_error';
  else if (r.status >= 200 && r.status < 400) bucket = 'reachable';
  else if ([400,401,402,403,405,406,407,408,409,412,415,418,422,423,424,425,426,428,429,431,451].includes(r.status)) bucket = 'access_limited';
  else if ([404,410].includes(r.status)) bucket = 'hard_broken';
  else if (r.status >= 500) bucket = 'server_error';
  else bucket = 'other_http';
  return { ...item, ...r, bucket, elapsedMs: Date.now()-started };
}

const ordered = roundRobinByHost([...refs.values()]);
const results = new Array(ordered.length);
let cursor = 0;
async function worker() {
  while (true) {
    const i = cursor++;
    if (i >= ordered.length) break;
    results[i] = await probe(ordered[i]);
    if ((i+1) % 500 === 0) console.log(`checked ${i+1}/${ordered.length}`);
  }
}
await Promise.all(Array.from({length: CONCURRENCY}, worker));

const keyRoutes = [
  '/', '/today/', '/get-it-done/', '/directory/', '/community/', '/my-franklin/',
  '/business-dashboard/', '/membership-start/', '/membership-pricing/', '/profile-studio/',
  '/community-help-center/', '/whole-situation-navigator/'
];
const selfChecks = [];
for (const route of keyRoutes) selfChecks.push(await probe({url:`https://franklinnavigator.com${route}`,count:1,pages:['KEY_ROUTE']}));

const counts = {};
for (const r of results) counts[r.bucket] = (counts[r.bucket]||0)+1;
const hardBroken = results.filter(r=>r.bucket==='hard_broken');
const networkErrors = results.filter(r=>r.bucket==='network_error');
const serverErrors = results.filter(r=>r.bucket==='server_error');
const accessLimited = results.filter(r=>r.bucket==='access_limited');
const selfFailures = selfChecks.filter(r=>r.bucket!=='reachable');

const report = {
  schemaVersion:'franklin.r23.prebuild-external-link-audit.v1',
  auditedCommit: process.env.GITHUB_SHA || null,
  htmlPages: htmlFiles.length,
  uniqueThirdPartyUrlsNetworkChecked: results.length,
  generatedGoogleMapsUrlsSyntaxChecked: generatedMaps.size,
  absoluteSelfUrlsStructurallyCovered: internalAbs.size,
  counts,
  keyProductionRouteChecks: selfChecks,
  hardBroken,
  networkErrors,
  serverErrors,
  accessLimited,
  completedAt: new Date().toISOString()
};
await fs.writeFile('r23-external-link-audit.json', JSON.stringify(report,null,2));
const summary = [
  `# Franklin R23 pre-build outbound link audit`,
  `- HTML pages scanned: ${htmlFiles.length}`,
  `- Unique third-party URLs network-checked: ${results.length}`,
  `- Generated Google Maps URLs syntax-checked: ${generatedMaps.size}`,
  `- Reachable: ${counts.reachable||0}`,
  `- Access-limited/bot-protected: ${counts.access_limited||0}`,
  `- Hard broken (404/410 after GET confirmation): ${hardBroken.length}`,
  `- Server errors: ${serverErrors.length}`,
  `- Network/DNS/TLS/timeouts: ${networkErrors.length}`,
  `- Key production route failures: ${selfFailures.length}`,
  ``,
  `Hard broken URLs are recorded in the JSON artifact for R23 correction/review; access-limited responses are not treated as broken.`
].join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary+'\n');
