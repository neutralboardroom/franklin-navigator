import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseHTML } from 'linkedom';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'audit-output');
const EXPECTED_HTML = 19276;
const EXPECTED_PROFILES = 19103;
const EXPECTED_SITEMAP = 19274;
const ORIGIN = 'https://franklinnavigator.com';
const ENFORCE = process.argv.includes('--enforce');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const walk = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(absolute));
    else out.push(absolute);
  }
  return out;
};
const rel = (p) => path.relative(DIST, p).split(path.sep).join('/');
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const allFiles = walk(DIST);
const fileSet = new Set(allFiles.map(rel));
const htmlFiles = allFiles.filter((p) => p.endsWith('.html'));
const profileFiles = htmlFiles.filter((p) => /^profiles\/[^/]+\/index\.html$/.test(rel(p)));

const routeForFile = (filePath) => {
  const r = rel(filePath);
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return '/' + r.slice(0, -'index.html'.length);
  return '/' + r;
};
const fileForRoute = (pathname) => {
  let clean = decodeURIComponent(pathname || '/').replace(/\/+$/, '/');
  if (!clean.startsWith('/')) clean = '/' + clean;
  const noLead = clean.slice(1);
  const candidates = clean.endsWith('/')
    ? [noLead + 'index.html']
    : [noLead, noLead + '/index.html', noLead + '.html'];
  return candidates.find((candidate) => fileSet.has(candidate)) || null;
};
const routeMap = new Map(htmlFiles.map((p) => [routeForFile(p), rel(p)]));
const fragmentCache = new Map();
const fragmentSetForFile = (targetFile) => {
  if (fragmentCache.has(targetFile)) return fragmentCache.get(targetFile);
  const targetRaw = fs.readFileSync(path.join(DIST, targetFile), 'utf8');
  let targetDoc;
  try { ({ document: targetDoc } = parseHTML(targetRaw)); }
  catch {
    const empty = new Set();
    fragmentCache.set(targetFile, empty);
    return empty;
  }
  const set = new Set();
  for (const node of targetDoc.querySelectorAll('[id]')) {
    const id = node.getAttribute('id');
    if (id) set.add(id);
  }
  for (const node of targetDoc.querySelectorAll('[name]')) {
    const name = node.getAttribute('name');
    if (name) set.add(name);
  }
  fragmentCache.set(targetFile, set);
  return set;
};

const categories = new Map();
const issues = [];
const warnings = [];
const pageStats = [];
const titleCounts = new Map();
const canonicalCounts = new Map();
let internalReferencesChecked = 0;
let brokenInternalTargets = 0;
let brokenAnchors = 0;
let unsafeScriptLikeLinks = 0;
let missingAlt = 0;
let unlabeledControls = 0;
let duplicateIds = 0;
let publicInternalLanguageFindings = 0;
let staleIdentityFindings = 0;
let externalBlankRelFindings = 0;
let pagesWithNoCurrentContact = 0;
let activePaymentLinks = 0;

const push = (severity, type, file, detail, extra = {}) => {
  const row = { severity, type, file, detail, ...extra };
  (severity === 'ERROR' ? issues : warnings).push(row);
  categories.set(type, (categories.get(type) || 0) + 1);
};

const internalTermPatterns = [
  /\bWO-20\d{6}-/i,
  /\bSRE[-_ ](?:OWNER|OC|CP|2\.)/i,
  /\bSGE[-_ ]\d/i,
  /\bOWNER_CONSOLE\b/i,
  /\bstableRoleId\b/i,
  /\bauthorityTransfer\b/i,
  /\bwork order result receipt\b/i,
  /\bdeployment candidate\b/i,
];
const stalePatterns = [
  /FOUNDING50/i,
  /50%\s+off\s+(?:the\s+)?first/i,
  /\(800\)\s*555/i,
  /201\)\s*555/i,
  /New York,?\s+NY/i,
];
const currentContact = {
  phone: '(615) 656-7020',
  email: 'community@franklinnavigator.com',
  addressNeedle: '2020 Fieldstone Pkwy',
};
const paymentUrlPattern = /(?:checkout\.stripe\.com|buy\.stripe\.com|\/api\/(?:billing\/)?checkout)/i;

for (let index = 0; index < htmlFiles.length; index += 1) {
  const filePath = htmlFiles[index];
  const file = rel(filePath);
  const route = routeForFile(filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  let document;
  try {
    ({ document } = parseHTML(raw));
  } catch (error) {
    push('ERROR', 'HTML_PARSE_ERROR', file, String(error?.message || error));
    continue;
  }

  const title = (document.querySelector('title')?.textContent || '').trim();
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';
  titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
  if (canonical) canonicalCounts.set(canonical, (canonicalCounts.get(canonical) || 0) + 1);

  const pageIssueStart = issues.length;
  const pageWarningStart = warnings.length;
  if (!/^\s*<!doctype\s+html>/i.test(raw)) push('ERROR', 'MISSING_DOCTYPE', file, 'HTML5 doctype is missing.');
  const lang = document.documentElement?.getAttribute('lang')?.trim();
  if (!lang) push('ERROR', 'MISSING_HTML_LANG', file, 'The html element has no lang attribute.');
  if (!title) push('ERROR', 'MISSING_TITLE', file, 'The page title is empty.');
  if (!document.querySelector('meta[name="viewport"]')) push('ERROR', 'MISSING_VIEWPORT', file, 'Viewport metadata is missing.');
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim();
  if (!description) push('WARN', 'MISSING_META_DESCRIPTION', file, 'Meta description is missing or empty.');
  const mains = document.querySelectorAll('main');
  if (mains.length !== 1) push('ERROR', 'MAIN_COUNT', file, `Expected exactly one main element; found ${mains.length}.`);
  const h1s = document.querySelectorAll('h1');
  if (h1s.length !== 1) push('ERROR', 'H1_COUNT', file, `Expected exactly one h1; found ${h1s.length}.`);
  if (!canonical) push('WARN', 'MISSING_CANONICAL', file, 'Canonical URL is missing.');
  else {
    try {
      const c = new URL(canonical, ORIGIN);
      if (c.origin !== ORIGIN) push('WARN', 'CANONICAL_ORIGIN', file, `Canonical origin is ${c.origin}.`);
    } catch {
      push('ERROR', 'INVALID_CANONICAL', file, canonical);
    }
  }

  const ids = new Map();
  for (const node of document.querySelectorAll('[id]')) {
    const id = node.getAttribute('id');
    if (!id) continue;
    ids.set(id, (ids.get(id) || 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) {
      duplicateIds += 1;
      push('ERROR', 'DUPLICATE_ID', file, `ID ${id} occurs ${count} times.`);
    }
  }

  const skip = document.querySelector('a.skip-link, a[href="#main"]');
  if (!skip) push('WARN', 'MISSING_SKIP_LINK', file, 'No skip-to-main link was found.');
  else {
    const target = (skip.getAttribute('href') || '').replace(/^#/, '');
    if (target && !document.getElementById(target)) push('ERROR', 'BROKEN_SKIP_LINK', file, `Skip target #${target} does not exist.`);
  }

  for (const img of document.querySelectorAll('img')) {
    if (!img.hasAttribute('alt')) {
      missingAlt += 1;
      push('ERROR', 'IMAGE_MISSING_ALT', file, img.getAttribute('src') || '(no src)');
    }
  }

  const labels = [...document.querySelectorAll('label[for]')];
  for (const control of document.querySelectorAll('input, textarea, select')) {
    const type = (control.getAttribute('type') || '').toLowerCase();
    if (type === 'hidden') continue;
    const id = control.getAttribute('id');
    const labeled = control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby') || (id && labels.some((label) => label.getAttribute('for') === id)) || control.closest('label');
    if (!labeled) {
      unlabeledControls += 1;
      push('ERROR', 'UNLABELED_FORM_CONTROL', file, `${control.tagName.toLowerCase()} ${id || control.getAttribute('name') || '(unnamed)'}`);
    }
  }
  for (const button of document.querySelectorAll('button')) {
    const name = (button.textContent || '').trim() || button.getAttribute('aria-label') || button.getAttribute('title');
    if (!name) push('ERROR', 'UNNAMED_BUTTON', file, button.outerHTML.slice(0, 180));
  }

  for (const node of document.querySelectorAll('[href], [src]')) {
    const attr = node.hasAttribute('href') ? 'href' : 'src';
    const value = (node.getAttribute(attr) || '').trim();
    if (!value) continue;
    if (/^(?:javascript|vbscript|data:text\/html):/i.test(value)) {
      unsafeScriptLikeLinks += 1;
      push('ERROR', 'UNSAFE_SCRIPT_LIKE_URL', file, value.slice(0, 240));
      continue;
    }
    if (node.matches('a[target="_blank"]')) {
      const relValue = (node.getAttribute('rel') || '').toLowerCase();
      if (!relValue.includes('noopener')) {
        externalBlankRelFindings += 1;
        push('WARN', 'TARGET_BLANK_NO_NOOPENER', file, value.slice(0, 240));
      }
    }
    if (/^(?:mailto:|tel:|sms:|geo:)/i.test(value)) continue;
    let url;
    try { url = new URL(value, new URL(route, ORIGIN)); }
    catch {
      push('ERROR', 'INVALID_URL', file, value.slice(0, 240));
      continue;
    }
    if (url.origin !== ORIGIN) continue;
    internalReferencesChecked += 1;
    const targetFile = fileForRoute(url.pathname);
    if (!targetFile) {
      brokenInternalTargets += 1;
      push('ERROR', 'BROKEN_INTERNAL_TARGET', file, `${value} -> ${url.pathname}`);
      continue;
    }
    if (url.hash && targetFile.endsWith('.html')) {
      const fragment = decodeURIComponent(url.hash.slice(1));
      if (fragment && !fragmentSetForFile(targetFile).has(fragment)) {
        brokenAnchors += 1;
        push('ERROR', 'BROKEN_ANCHOR', file, `${value} -> ${targetFile}#${fragment}`);
      }
    }
  }

  const visibleText = (document.body?.textContent || '').replace(/\s+/g, ' ');
  for (const pattern of internalTermPatterns) {
    const match = visibleText.match(pattern);
    if (match) {
      publicInternalLanguageFindings += 1;
      push('ERROR', 'PUBLIC_INTERNAL_LANGUAGE', file, match[0]);
      break;
    }
  }
  for (const pattern of stalePatterns) {
    const match = visibleText.match(pattern);
    if (match) {
      staleIdentityFindings += 1;
      push('ERROR', 'STALE_COMMERCE_OR_CONTACT_TRUTH', file, match[0]);
      break;
    }
  }
  const hasFooter = Boolean(document.querySelector('footer'));
  if (hasFooter && !(raw.includes(currentContact.phone) && raw.includes(currentContact.email) && raw.includes(currentContact.addressNeedle))) {
    pagesWithNoCurrentContact += 1;
    push('WARN', 'FOOTER_CURRENT_CONTACT_INCOMPLETE', file, 'One or more canonical Franklin contact fields are absent.');
  }
  if (paymentUrlPattern.test(raw)) {
    activePaymentLinks += 1;
    push('ERROR', 'PAYMENT_ENTRY_PRESENT_WHILE_FAIL_CLOSED', file, 'Checkout/payment URL exists before persistent fulfillment activation.');
  }

  pageStats.push({ file, route, bytes: Buffer.byteLength(raw), sha256: sha256(raw), title, canonical, h1Count: h1s.length, mainCount: mains.length, errors: issues.length - pageIssueStart, warnings: warnings.length - pageWarningStart });
  if ((index + 1) % 2500 === 0) console.log(`Audited ${index + 1}/${htmlFiles.length} HTML pages`);
}

const sitemapPath = path.join(DIST, 'sitemap.xml');
let sitemapRoutes = 0;
let sitemapMissingTargets = 0;
if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/gsi)].map((m) => m[1].trim());
  sitemapRoutes = locs.length;
  for (const loc of locs) {
    try {
      const u = new URL(loc);
      if (u.origin === ORIGIN && !fileForRoute(u.pathname)) {
        sitemapMissingTargets += 1;
        push('ERROR', 'SITEMAP_TARGET_MISSING', 'sitemap.xml', loc);
      }
    } catch {
      push('ERROR', 'SITEMAP_INVALID_URL', 'sitemap.xml', loc);
    }
  }
} else {
  push('ERROR', 'SITEMAP_MISSING', 'sitemap.xml', 'Sitemap file not found.');
}

const duplicateCanonicalUrls = [...canonicalCounts.entries()].filter(([key, count]) => key && count > 1).map(([canonical, count]) => ({ canonical, count }));
const blankTitles = titleCounts.get('') || 0;
const invariantErrors = [];
if (htmlFiles.length !== EXPECTED_HTML) invariantErrors.push(`HTML page count ${htmlFiles.length} != ${EXPECTED_HTML}`);
if (profileFiles.length !== EXPECTED_PROFILES) invariantErrors.push(`Profile page count ${profileFiles.length} != ${EXPECTED_PROFILES}`);
if (sitemapRoutes !== EXPECTED_SITEMAP) invariantErrors.push(`Sitemap route count ${sitemapRoutes} != ${EXPECTED_SITEMAP}`);
for (const detail of invariantErrors) push('ERROR', 'RELEASE_INVARIANT', 'dist', detail);

const summary = {
  schemaVersion: 'franklin.full-site-audit.v1',
  generatedAtUtc: new Date().toISOString(),
  releaseExpected: 'FR-NAV0.9.0-CANDIDATE-R24_OR_SUCCESSOR',
  counts: { files: allFiles.length, htmlPages: htmlFiles.length, profilePages: profileFiles.length, sitemapRoutes, internalReferencesChecked },
  findings: { errors: issues.length, warnings: warnings.length, brokenInternalTargets, brokenAnchors, unsafeScriptLikeLinks, missingAlt, unlabeledControls, duplicateIds, publicInternalLanguageFindings, staleIdentityFindings, externalBlankRelFindings, pagesWithNoCurrentContact, activePaymentLinks, sitemapMissingTargets, blankTitles, duplicateCanonicalUrlCount: duplicateCanonicalUrls.length },
  categories: Object.fromEntries([...categories.entries()].sort(([a], [b]) => a.localeCompare(b))),
  releaseInvariants: { expectedHtmlPages: EXPECTED_HTML, expectedProfilePages: EXPECTED_PROFILES, expectedSitemapRoutes: EXPECTED_SITEMAP, pass: invariantErrors.length === 0 },
  enforceMode: ENFORCE,
};

const report = { ...summary, errors: issues, warnings, duplicateCanonicalUrls, pages: pageStats };
fs.writeFileSync(path.join(OUT, 'FULL_SITE_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
const md = [
  '# Franklin Navigator Full-Site Audit', '',
  `Generated: ${summary.generatedAtUtc}`, '',
  `- HTML pages: ${htmlFiles.length.toLocaleString()}`,
  `- Profile pages: ${profileFiles.length.toLocaleString()}`,
  `- Sitemap routes: ${sitemapRoutes.toLocaleString()}`,
  `- Internal references checked: ${internalReferencesChecked.toLocaleString()}`,
  `- Errors: ${issues.length.toLocaleString()}`,
  `- Warnings: ${warnings.length.toLocaleString()}`,
  `- Broken internal targets: ${brokenInternalTargets}`,
  `- Broken anchors: ${brokenAnchors}`,
  `- Unsafe script-like links: ${unsafeScriptLikeLinks}`,
  `- Public internal-language findings: ${publicInternalLanguageFindings}`,
  `- Active payment-entry findings: ${activePaymentLinks}`, '',
  '## Finding categories', '',
  ...Object.entries(summary.categories).map(([name, count]) => `- ${name}: ${count}`), '',
  '## First 100 errors', '',
  ...issues.slice(0, 100).map((row) => `- **${row.type}** — \`${row.file}\`: ${row.detail}`), '',
  '## First 100 warnings', '',
  ...warnings.slice(0, 100).map((row) => `- **${row.type}** — \`${row.file}\`: ${row.detail}`), '',
].join('\n');
fs.writeFileSync(path.join(OUT, 'FULL_SITE_AUDIT.md'), md);
fs.writeFileSync(path.join(OUT, 'FULL_SITE_AUDIT_SUMMARY.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));

const criticalTypes = new Set(['HTML_PARSE_ERROR', 'BROKEN_INTERNAL_TARGET', 'BROKEN_ANCHOR', 'UNSAFE_SCRIPT_LIKE_URL', 'PUBLIC_INTERNAL_LANGUAGE', 'STALE_COMMERCE_OR_CONTACT_TRUTH', 'PAYMENT_ENTRY_PRESENT_WHILE_FAIL_CLOSED', 'RELEASE_INVARIANT', 'SITEMAP_TARGET_MISSING', 'DUPLICATE_ID', 'UNLABELED_FORM_CONTROL', 'IMAGE_MISSING_ALT']);
const critical = issues.filter((row) => criticalTypes.has(row.type));
if (ENFORCE && critical.length) {
  console.error(`Full-site audit failed with ${critical.length} critical findings.`);
  process.exit(1);
}
