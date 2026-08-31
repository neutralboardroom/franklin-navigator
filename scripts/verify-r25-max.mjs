import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://franklinnavigator.com';
const RELEASE = 'FR-NAV0.10.0-CANDIDATE-R25';
const EXPECTED_HTML = 19276;
const EXPECTED_PROFILES = 19103;
const EXPECTED_SITEMAP = 19274;
const PHONE = '(615) 656-7020';
const EMAIL = 'community@franklinnavigator.com';
const failures = [];
const warnings = [];
const fail = (code, detail) => failures.push({ code, detail });
const warn = (code, detail) => warnings.push({ code, detail });
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const walk = (directory) => {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute));
    else output.push(absolute);
  }
  return output;
};
const rel = (file) => path.relative(DIST, file).split(path.sep).join('/');
const routeFor = (file) => {
  const relative = rel(file);
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return '/' + relative.slice(0, -'index.html'.length);
  return '/' + relative;
};
const canonicalFor = (file) => ORIGIN + routeFor(file);
const decodeEntities = (value) => String(value).replaceAll('&amp;', '&').replaceAll('&#38;', '&');
const htmlFiles = walk(DIST).filter((file) => file.endsWith('.html')).sort();
const allFiles = new Set(walk(DIST).map(rel));
const htmlByRoute = new Map();
const idsByRoute = new Map();
const canonicals = new Map();
let referencesChecked = 0;
let footerPages = 0;
let profilePages = 0;
let imageCount = 0;
let formControlCount = 0;
let duplicateIdCount = 0;
let unsafeLinkCount = 0;

for (const file of htmlFiles) {
  const relative = rel(file);
  const route = routeFor(file);
  const html = fs.readFileSync(file, 'utf8');
  htmlByRoute.set(route, html);
  if (/^profiles\/[^/]+\/index\.html$/.test(relative)) profilePages += 1;

  if (!/^<!doctype html>/i.test(html.trimStart())) fail('DOCTYPE_MISSING', relative);
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) fail('HTML_LANG_MISSING', relative);
  if (!/<meta\b(?=[^>]*\bname=["']viewport["'])[^>]*>/i.test(html)) fail('VIEWPORT_MISSING', relative);
  if (!/<title[^>]*>\s*[^<]+\s*<\/title>/i.test(html)) fail('TITLE_MISSING', relative);
  if (!/<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["'][^"']{20,}["'])[^>]*>/i.test(html)) fail('DESCRIPTION_MISSING_OR_SHORT', relative);
  if (!/<main\b/i.test(html)) fail('MAIN_MISSING', relative);
  if (!/<h1\b/i.test(html)) fail('H1_MISSING', relative);
  if (!new RegExp(`data-franklin-release=["']${RELEASE.replaceAll('.', '\\.') }["']`, 'i').test(html)) fail('RELEASE_BINDING_MISSING', relative);

  const canonicalTags = [...html.matchAll(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)];
  if (canonicalTags.length !== 1) {
    fail('CANONICAL_COUNT', `${relative}:${canonicalTags.length}`);
  } else {
    const canonical = decodeEntities(canonicalTags[0][1]);
    const expected = canonicalFor(file);
    if (canonical !== expected) fail('CANONICAL_NOT_SELF', `${relative}:${canonical} expected ${expected}`);
    if (canonicals.has(canonical)) fail('DUPLICATE_CANONICAL', `${relative} and ${canonicals.get(canonical)} => ${canonical}`);
    else canonicals.set(canonical, relative);
  }

  const ids = new Set();
  for (const match of html.matchAll(/\bid=["']([^"']+)["']/gi)) {
    const id = match[1];
    if (ids.has(id)) {
      duplicateIdCount += 1;
      fail('DUPLICATE_ID', `${relative}#${id}`);
    }
    ids.add(id);
  }
  for (const match of html.matchAll(/<a\b[^>]*\bname=["']([^"']+)["']/gi)) ids.add(match[1]);
  idsByRoute.set(route, ids);

  if (/<footer\b/i.test(html)) {
    footerPages += 1;
    if (!html.includes(PHONE)) fail('FOOTER_PHONE_MISSING', relative);
    if (!html.includes(EMAIL)) fail('FOOTER_EMAIL_MISSING', relative);
    if (!html.includes('2020 Fieldstone Pkwy')) fail('FOOTER_ADDRESS_MISSING', relative);
  }

  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    imageCount += 1;
    const attrs = match[1];
    if (!/\balt=["'][^"']*["']/i.test(attrs)) fail('IMAGE_ALT_MISSING', relative);
    if (!/\bdecoding=["']async["']/i.test(attrs)) fail('IMAGE_DECODING_HINT_MISSING', relative);
  }
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const attrs = match[1];
    if (/\btarget=["']_blank["']/i.test(attrs) && !/\brel=["'][^"']*\bnoopener\b/i.test(attrs)) fail('NOOPENER_MISSING', relative);
  }
  for (const match of html.matchAll(/<(button|input|select|textarea)\b([^>]*)>([\s\S]*?)<\/\1>|<(input)\b([^>]*)\/?\s*>/gi)) {
    formControlCount += 1;
    const tag = (match[1] || match[4] || '').toLowerCase();
    const attrs = match[2] || match[5] || '';
    if (tag === 'input' && /\btype=["']hidden["']/i.test(attrs)) continue;
    const text = (match[3] || '').replace(/<[^>]+>/g, ' ').trim();
    const hasName = /\baria-label=["'][^"']+["']/i.test(attrs) || /\baria-labelledby=["'][^"']+["']/i.test(attrs) || /\btitle=["'][^"']+["']/i.test(attrs) || text.length > 0;
    if (tag === 'button' && !hasName) fail('UNLABELED_BUTTON', relative);
  }

  const banned = /\b(?:SRE_OWNER_CONSOLE|LOCAL_COMMUNITY_PLATFORM|WORK_ORDER_RESULT_RECEIPT|WO-2026\d+|builder packet|deployment candidate|activation interlock)\b/i;
  const visible = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  if (banned.test(visible)) fail('INTERNAL_LANGUAGE_PUBLIC', relative);
  if (/javascript\s*:/i.test(html)) {
    unsafeLinkCount += 1;
    fail('UNSAFE_JAVASCRIPT_LINK', relative);
  }
}

const fileForPathname = (pathname) => {
  let clean;
  try { clean = decodeURIComponent(pathname); } catch { clean = pathname; }
  clean = clean.replace(/^\/+/, '');
  if (!clean) return 'index.html';
  const candidates = [];
  if (clean.endsWith('/')) candidates.push(clean + 'index.html');
  else {
    candidates.push(clean);
    candidates.push(clean + '/index.html');
    if (!path.extname(clean)) candidates.push(clean + '.html');
  }
  return candidates.find((candidate) => allFiles.has(candidate)) || null;
};

for (const file of htmlFiles) {
  const relative = rel(file);
  const route = routeFor(file);
  const html = htmlByRoute.get(route);
  const attributeRegex = /\b(?:href|src)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attributeRegex)) {
    referencesChecked += 1;
    const raw = decodeEntities(match[1]).trim();
    if (!raw || raw.startsWith('data:') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('sms:') || raw.startsWith('geo:')) continue;
    let url;
    try { url = new URL(raw, ORIGIN + route); } catch { fail('INVALID_URL', `${relative}:${raw}`); continue; }
    if (url.origin !== ORIGIN) continue;
    const targetFile = fileForPathname(url.pathname);
    if (!targetFile) {
      fail('BROKEN_INTERNAL_TARGET', `${relative} -> ${raw}`);
      continue;
    }
    if (url.hash && url.hash !== '#') {
      const targetRoute = routeFor(path.join(DIST, targetFile));
      const ids = idsByRoute.get(targetRoute) || new Set();
      let fragment = url.hash.slice(1);
      try { fragment = decodeURIComponent(fragment); } catch {}
      if (!ids.has(fragment)) fail('BROKEN_ANCHOR', `${relative} -> ${raw}`);
    }
  }
}

if (htmlFiles.length !== EXPECTED_HTML) fail('HTML_COUNT', `${htmlFiles.length} expected ${EXPECTED_HTML}`);
if (profilePages !== EXPECTED_PROFILES) fail('PROFILE_COUNT', `${profilePages} expected ${EXPECTED_PROFILES}`);
const sitemapPath = path.join(DIST, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const sitemapRoutes = [...sitemap.matchAll(/<loc>[^<]+<\/loc>/g)].length;
if (sitemapRoutes !== EXPECTED_SITEMAP) fail('SITEMAP_COUNT', `${sitemapRoutes} expected ${EXPECTED_SITEMAP}`);

const page404 = fs.readFileSync(path.join(DIST, '404.html'), 'utf8');
if (!page404.includes(`${ORIGIN}/404.html`)) fail('404_CANONICAL', '404.html');
if (!/<meta\b(?=[^>]*name=["']robots["'])(?=[^>]*content=["']noindex,follow["'])[^>]*>/i.test(page404)) fail('404_ROBOTS', '404.html');

const security = fs.readFileSync(path.join(DIST, '.well-known', 'security.txt'), 'utf8');
if (!security.includes(`Contact: mailto:${EMAIL}`)) fail('SECURITY_CONTACT', '.well-known/security.txt');

const production = JSON.parse(fs.readFileSync(path.join(ROOT, 'PRODUCTION_RELEASE.json'), 'utf8'));
if (production.release !== RELEASE) fail('PRODUCTION_RELEASE_ID', production.release);
if (production.publicPayload?.profiles !== EXPECTED_PROFILES) fail('PRODUCTION_PROFILE_COUNT', production.publicPayload?.profiles);
if (production.publicPayload?.htmlPages !== EXPECTED_HTML) fail('PRODUCTION_HTML_COUNT', production.publicPayload?.htmlPages);
if (production.commerce?.paidCommerceActive !== false) fail('COMMERCE_MUST_REMAIN_FAIL_CLOSED', 'paidCommerceActive');
if (production.commerce?.productionEntitlementPersistence !== false) fail('ENTITLEMENT_PERSISTENCE_MUST_NOT_BE_FABRICATED', 'productionEntitlementPersistence');
if (!String(production.commerce?.blocker || '').includes('PERSISTENT_RUNTIME')) fail('COMMERCE_BLOCKER_MISSING', production.commerce?.blocker);

const quality = JSON.parse(fs.readFileSync(path.join(DIST, 'data', 'r25-site-quality.json'), 'utf8'));
if (quality.release !== RELEASE || quality.baselineAudit?.warnings !== 161) fail('R25_QUALITY_RECORD', 'mismatch');
const nextList = JSON.parse(fs.readFileSync(path.join(DIST, 'data', 'r25-next-version-improvement-list.json'), 'utf8'));
if (nextList.release !== RELEASE || !Array.isArray(nextList.completedInThisRelease) || !Array.isArray(nextList.nextQualifiedPriorities)) fail('NEXT_VERSION_LIST', 'missing or invalid');

const manifestPath = path.join(DIST, 'FRANKLIN_BUILD_MANIFEST.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.release !== RELEASE) fail('MANIFEST_RELEASE', manifest.release);
if (manifest.builtHtmlPages !== EXPECTED_HTML) fail('MANIFEST_HTML_COUNT', manifest.builtHtmlPages);
if (manifest.profilePages !== EXPECTED_PROFILES) fail('MANIFEST_PROFILE_COUNT', manifest.profilePages);
for (const item of manifest.files || []) {
  const absolute = path.join(DIST, item.path);
  if (!fs.existsSync(absolute)) { fail('MANIFEST_FILE_MISSING', item.path); continue; }
  const bytes = fs.readFileSync(absolute);
  const digest = sha256(bytes);
  if (bytes.length !== item.bytes || digest !== item.sha256) fail('MANIFEST_HASH_MISMATCH', item.path);
}
const actualRecords = walk(DIST).filter((file) => file !== manifestPath).length;
if ((manifest.files || []).length !== actualRecords) fail('MANIFEST_FILE_COUNT', `${(manifest.files || []).length} expected ${actualRecords}`);

const report = {
  schemaVersion: 'franklin.r25.exhaustive-verification.v1',
  release: RELEASE,
  status: failures.length ? 'FAIL' : 'PASS',
  counts: {
    htmlPages: htmlFiles.length,
    profiles: profilePages,
    sitemapRoutes,
    footerPages,
    imageCount,
    formControlCount,
    referencesChecked,
    duplicateIdCount,
    unsafeLinkCount,
    canonicalCount: canonicals.size,
    manifestFileRecords: (manifest.files || []).length
  },
  failures,
  warnings,
  commerceFailClosedVerified: production.commerce?.paidCommerceActive === false && production.commerce?.productionEntitlementPersistence === false,
  authorityTransfer: false
};
fs.mkdirSync(path.join(ROOT, 'audit-output'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'audit-output', 'FRANKLIN_R25_EXHAUSTIVE_SITE_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
