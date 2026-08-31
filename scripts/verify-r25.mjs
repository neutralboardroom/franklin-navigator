import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'audit-output');
const ORIGIN = 'https://franklinnavigator.com';
const EXPECTED = { htmlPages: 19276, profiles: 19103, sitemapRoutes: 19274 };
const CONTACT = ['(615) 656-7020', 'community@franklinnavigator.com', '2020 Fieldstone Pkwy'];
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const walk = (directory) => {
  const rows = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...walk(absolute));
    else rows.push(absolute);
  }
  return rows;
};
const rel = (absolute) => path.relative(DIST, absolute).split(path.sep).join('/');
const routeFor = (relative) => relative === 'index.html' ? '/' : relative === '404.html' ? '/404.html' : relative.endsWith('/index.html') ? '/' + relative.slice(0, -'index.html'.length) : '/' + relative;
const files = walk(DIST);
const fileSet = new Set(files.map(rel));
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const profileFiles = htmlFiles.filter((file) => /^profiles\/[^/]+\/index\.html$/.test(rel(file)));
const errors = [];
const warnings = [];
const canonicalMap = new Map();
const idCache = new Map();
let internalReferencesChecked = 0;
let contactIncomplete = 0;
let brokenInternalTargets = 0;
let brokenAnchors = 0;
let unsafeLinks = 0;
let duplicateIds = 0;
let missingAlt = 0;
let activePaymentEntries = 0;

const addError = (type, file, detail) => errors.push({ type, file, detail });
const targetFileFor = (pathname) => {
  let clean;
  try { clean = decodeURIComponent(pathname || '/'); } catch { return null; }
  if (!clean.startsWith('/')) clean = '/' + clean;
  const noLead = clean.slice(1);
  const candidates = clean.endsWith('/') ? [noLead + 'index.html'] : [noLead, noLead + '/index.html', noLead + '.html'];
  return candidates.find((candidate) => fileSet.has(candidate)) || null;
};
const idsFor = (targetFile) => {
  if (idCache.has(targetFile)) return idCache.get(targetFile);
  const raw = fs.readFileSync(path.join(DIST, targetFile), 'utf8');
  const ids = new Set();
  for (const match of raw.matchAll(/\b(?:id|name)=["']([^"']+)["']/gi)) ids.add(match[1]);
  idCache.set(targetFile, ids);
  return ids;
};

if (htmlFiles.length !== EXPECTED.htmlPages) addError('HTML_COUNT', 'dist', `${htmlFiles.length}`);
if (profileFiles.length !== EXPECTED.profiles) addError('PROFILE_COUNT', 'dist', `${profileFiles.length}`);

for (const absolute of htmlFiles) {
  const file = rel(absolute);
  const raw = fs.readFileSync(absolute, 'utf8');
  if (!/^\s*<!doctype\s+html>/i.test(raw)) addError('MISSING_DOCTYPE', file, '');
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(raw)) addError('MISSING_LANG', file, '');
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(raw)) addError('MISSING_VIEWPORT', file, '');
  if ((raw.match(/<main\b/gi) || []).length !== 1) addError('MAIN_COUNT', file, String((raw.match(/<main\b/gi) || []).length));
  if ((raw.match(/<h1\b/gi) || []).length !== 1) addError('H1_COUNT', file, String((raw.match(/<h1\b/gi) || []).length));
  if (!raw.includes('/assets/r25.css') || !raw.includes('/assets/r25.js')) addError('R25_LAYER_MISSING', file, '');
  if (/<footer\b/i.test(raw) && !CONTACT.every((needle) => raw.includes(needle))) { contactIncomplete += 1; addError('CONTACT_INCOMPLETE', file, ''); }
  if (/\b(?:FOUNDING50|50%\s+off\s+(?:the\s+)?first|\(800\)\s*555|201\)\s*555|New York,?\s+NY)\b/i.test(raw)) addError('STALE_PUBLIC_TRUTH', file, '');
  const visible = raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  if (/\b(?:WO-20\d{6}-|SRE[-_ ](?:OWNER|OC|CP|2\.)|SGE[-_ ]\d|OWNER_CONSOLE|stableRoleId|authorityTransfer|work order result receipt|deployment candidate)\b/i.test(visible)) addError('PUBLIC_INTERNAL_LANGUAGE', file, '');
  if (/(?:checkout\.stripe\.com|buy\.stripe\.com|\/api\/(?:billing\/)?checkout)/i.test(raw)) { activePaymentEntries += 1; addError('PAYMENT_ENTRY_WHILE_FAIL_CLOSED', file, ''); }
  if (file === '404.html') {
    if (!/<meta\b[^>]*name=["']description["']/i.test(raw)) addError('404_DESCRIPTION', file, '');
    if (!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(raw)) addError('404_ROBOTS', file, '');
  }

  const canonical = raw.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1];
  if (!canonical) addError('MISSING_CANONICAL', file, '');
  else {
    const list = canonicalMap.get(canonical) || [];
    list.push(file);
    canonicalMap.set(canonical, list);
  }

  const seenIds = new Map();
  for (const match of raw.matchAll(/\bid=["']([^"']+)["']/gi)) seenIds.set(match[1], (seenIds.get(match[1]) || 0) + 1);
  for (const [id, count] of seenIds) if (count > 1) { duplicateIds += 1; addError('DUPLICATE_ID', file, `${id}:${count}`); }
  for (const tag of raw.matchAll(/<img\b[^>]*>/gi)) if (!/\balt=["'][^"']*["']/i.test(tag[0])) { missingAlt += 1; addError('IMAGE_MISSING_ALT', file, tag[0].slice(0, 160)); }
  for (const tag of raw.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)) if (!/\brel=["'][^"']*noopener/i.test(tag[0])) addError('NO_NOOPENER', file, tag[0].slice(0, 160));

  const base = new URL(routeFor(file), ORIGIN);
  for (const match of raw.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const value = match[1].trim();
    if (!value || /^(?:mailto:|tel:|sms:|geo:|data:image\/)/i.test(value)) continue;
    if (/^(?:javascript|vbscript|data:text\/html):/i.test(value)) { unsafeLinks += 1; addError('UNSAFE_URL', file, value); continue; }
    let url;
    try { url = new URL(value, base); } catch { addError('INVALID_URL', file, value); continue; }
    if (url.origin !== ORIGIN) continue;
    internalReferencesChecked += 1;
    const target = targetFileFor(url.pathname);
    if (!target) { brokenInternalTargets += 1; addError('BROKEN_INTERNAL_TARGET', file, value); continue; }
    if (url.hash && target.endsWith('.html')) {
      const fragment = decodeURIComponent(url.hash.slice(1));
      if (fragment && !idsFor(target).has(fragment)) { brokenAnchors += 1; addError('BROKEN_ANCHOR', file, `${value} -> ${target}`); }
    }
  }
}

for (const [canonical, rows] of canonicalMap) if (rows.length > 1) addError('DUPLICATE_CANONICAL', rows.join(','), canonical);
const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const sitemapRoutes = (sitemap.match(/<loc>/g) || []).length;
if (sitemapRoutes !== EXPECTED.sitemapRoutes) addError('SITEMAP_COUNT', 'sitemap.xml', String(sitemapRoutes));

const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'FRANKLIN_BUILD_MANIFEST.json'), 'utf8'));
if (manifest.release !== 'FR-NAV0.10.0-CANDIDATE-R25') addError('MANIFEST_RELEASE', 'FRANKLIN_BUILD_MANIFEST.json', manifest.release);
if (manifest.files.length !== files.length - 1) addError('MANIFEST_FILE_COUNT', 'FRANKLIN_BUILD_MANIFEST.json', `${manifest.files.length}/${files.length - 1}`);
for (const item of manifest.files) {
  const absolute = path.join(DIST, item.path);
  if (!fs.existsSync(absolute)) { addError('MANIFEST_MISSING_FILE', item.path, ''); continue; }
  const bytes = fs.readFileSync(absolute);
  if (bytes.length !== item.bytes || sha256(bytes) !== item.sha256) addError('MANIFEST_MISMATCH', item.path, '');
}
const release = JSON.parse(fs.readFileSync(path.join(ROOT, 'PRODUCTION_RELEASE.json'), 'utf8'));
if (release.release !== 'FR-NAV0.10.0-CANDIDATE-R25') addError('PRODUCTION_RELEASE_ID', 'PRODUCTION_RELEASE.json', release.release);
if (release.commerce?.paidCommerceActive !== false || release.commerce?.productionEntitlementPersistence !== false) addError('COMMERCE_FAIL_CLOSED', 'PRODUCTION_RELEASE.json', '');

fs.mkdirSync(OUT, { recursive: true });
const summary = {
  schemaVersion: 'franklin.r25.complete-verification.v1',
  generatedAtUtc: new Date().toISOString(),
  release: release.release,
  counts: { files: files.length, htmlPages: htmlFiles.length, profiles: profileFiles.length, sitemapRoutes, internalReferencesChecked },
  findings: { errors: errors.length, warnings: warnings.length, contactIncomplete, brokenInternalTargets, brokenAnchors, unsafeLinks, duplicateIds, missingAlt, duplicateCanonicals: [...canonicalMap.values()].filter((rows) => rows.length > 1).length, activePaymentEntries },
  assertions: { profileCountPreserved: profileFiles.length === EXPECTED.profiles, htmlCountPreserved: htmlFiles.length === EXPECTED.htmlPages, sitemapCountPreserved: sitemapRoutes === EXPECTED.sitemapRoutes, canonicalContactComplete: contactIncomplete === 0, internalLinksClean: brokenInternalTargets === 0 && brokenAnchors === 0, unsafeLinksAbsent: unsafeLinks === 0, commerceFailClosed: release.commerce?.paidCommerceActive === false },
  errors: errors.slice(0, 500),
  warnings: warnings.slice(0, 500)
};
fs.writeFileSync(path.join(OUT, 'R25_COMPLETE_AUDIT.json'), JSON.stringify(summary, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'R25_COMPLETE_AUDIT.md'), `# Franklin Navigator R25 Complete Audit\n\n- Release: ${summary.release}\n- HTML pages: ${htmlFiles.length}\n- Profile pages: ${profileFiles.length}\n- Sitemap routes: ${sitemapRoutes}\n- Internal references checked: ${internalReferencesChecked}\n- Errors: ${errors.length}\n- Contact-incomplete pages: ${contactIncomplete}\n- Broken targets: ${brokenInternalTargets}\n- Broken anchors: ${brokenAnchors}\n- Unsafe links: ${unsafeLinks}\n- Duplicate canonicals: ${summary.findings.duplicateCanonicals}\n- Active payment entries while fail-closed: ${activePaymentEntries}\n`);
console.log(JSON.stringify(summary, null, 2));
if (errors.length) process.exit(1);
