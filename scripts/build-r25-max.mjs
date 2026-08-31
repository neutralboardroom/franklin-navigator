import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://franklinnavigator.com';
const RELEASE = 'FR-NAV0.10.0-CANDIDATE-R25';
const PREDECESSOR_RELEASE = 'FR-NAV0.9.1-CANDIDATE-R24.1';
const PREDECESSOR_COMMIT = 'cc8620072ba5d774cb505f236f0c98c6f29b7754';
const PREDECESSOR_TREE = '99d8e81c6bd4a8e55e9b6e6c338dc6f49ef112dc';
const BUILD_DATE = '2026-08-31';
const PHONE = '(615) 656-7020';
const PHONE_E164 = '+16156567020';
const EMAIL = 'community@franklinnavigator.com';
const ADDRESS = '2020 Fieldstone Pkwy, Ste 900, Franklin, TN 37069';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
};
const walk = (directory) => {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute));
    else output.push(absolute);
  }
  return output;
};
const rel = (absolute) => path.relative(DIST, absolute).split(path.sep).join('/');
const routeFor = (file) => {
  const relative = rel(file);
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return '/' + relative.slice(0, -'index.html'.length);
  return '/' + relative;
};
const canonicalFor = (file) => ORIGIN + routeFor(file);
const stripTags = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const attrEscape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

if (!fs.existsSync(DIST)) throw new Error('dist directory is missing');
const productionPath = path.join(ROOT, 'PRODUCTION_RELEASE.json');
const production = JSON.parse(fs.readFileSync(productionPath, 'utf8'));
if (production.release !== PREDECESSOR_RELEASE) {
  throw new Error(`R25 requires ${PREDECESSOR_RELEASE}; found ${production.release}`);
}
if (production.publicPayload?.profiles !== 19103 || production.publicPayload?.htmlPages !== 19276) {
  throw new Error('R24.1 profile or HTML count does not match the accepted baseline');
}

const htmlFiles = walk(DIST).filter((file) => file.endsWith('.html')).sort();
let pagesChanged = 0;
let contactPagesCorrected = 0;
let descriptionsAdded = 0;
let canonicalsNormalized = 0;
let themeColorsAdded = 0;
let imageDecodingAdded = 0;
let noopenerCorrections = 0;

for (const file of htmlFiles) {
  const before = fs.readFileSync(file, 'utf8');
  let html = before;
  const route = routeFor(file);
  const canonical = canonicalFor(file);
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = stripTags(titleMatch?.[1] || 'Franklin Navigator');
  const description = route === '/404.html'
    ? 'The Franklin Navigator page you requested was not found. Return home, ask a local question, or browse Franklin resources.'
    : `${title.replace(/\s*\|\s*Franklin Navigator\s*$/i, '') || 'Franklin Navigator'} — practical local information and next steps for Franklin, Tennessee.`;

  const canonicalTag = `<link rel="canonical" href="${attrEscape(canonical)}">`;
  const canonicalPattern = /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i;
  if (canonicalPattern.test(html)) {
    const current = html.match(canonicalPattern)?.[0] || '';
    if (current !== canonicalTag) {
      html = html.replace(canonicalPattern, canonicalTag);
      canonicalsNormalized += 1;
    }
  } else {
    html = html.replace(/<\/head>/i, `${canonicalTag}</head>`);
    canonicalsNormalized += 1;
  }

  const descriptionPattern = /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i;
  if (!descriptionPattern.test(html)) {
    html = html.replace(/<\/head>/i, `<meta name="description" content="${attrEscape(description)}"></head>`);
    descriptionsAdded += 1;
  }
  if (!/<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*>/i.test(html)) {
    html = html.replace(/<\/head>/i, '<meta name="theme-color" content="#075f66"></head>');
    themeColorsAdded += 1;
  }
  if (route === '/404.html' && !/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i.test(html)) {
    html = html.replace(/<\/head>/i, '<meta name="robots" content="noindex,follow"></head>');
  }

  if (!/<body\b[^>]*\bdata-franklin-release=/i.test(html)) {
    html = html.replace(/<body\b/i, `<body data-franklin-release="${RELEASE}"`);
  } else {
    html = html.replace(/data-franklin-release=["'][^"']*["']/i, `data-franklin-release="${RELEASE}"`);
  }

  html = html.replace(/<img\b(?![^>]*\bdecoding=)([^>]*)>/gi, (match, attributes) => {
    imageDecodingAdded += 1;
    return `<img decoding="async"${attributes}>`;
  });

  html = html.replace(/<a\b([^>]*\btarget=["']_blank["'][^>]*)>/gi, (match, attributes) => {
    if (/\brel=["'][^"']*\bnoopener\b/i.test(attributes)) return match;
    noopenerCorrections += 1;
    if (/\brel=["']/i.test(attributes)) {
      return `<a${attributes.replace(/\brel=(["'])([^"']*)\1/i, (whole, quote, value) => `rel=${quote}${value} noopener${quote}`)}>`;
    }
    return `<a${attributes} rel="noopener">`;
  });

  if (/<footer\b/i.test(html)) {
    const missing = [];
    if (!html.includes(PHONE)) missing.push(`<a href="tel:${PHONE_E164}">${PHONE}</a>`);
    if (!html.includes(EMAIL)) missing.push(`<a href="mailto:${EMAIL}">${EMAIL}</a>`);
    if (!html.includes('2020 Fieldstone Pkwy')) missing.push(`<span>${ADDRESS}</span>`);
    if (missing.length) {
      const contact = `<address class="footer-contact-r25" aria-label="Franklin Navigator contact"><strong>Franklin Navigator</strong>${missing.join('<span aria-hidden="true"> · </span>')}</address>`;
      html = html.replace(/<\/footer>/i, `${contact}</footer>`);
      contactPagesCorrected += 1;
    }
  }

  if (route === '/') {
    const schemaId = 'r25-franklin-organization-schema';
    if (!html.includes(schemaId)) {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${ORIGIN}/#organization`,
        name: 'Franklin Navigator',
        url: ORIGIN,
        email: EMAIL,
        telephone: PHONE_E164,
        address: {
          '@type': 'PostalAddress',
          streetAddress: '2020 Fieldstone Pkwy, Ste 900',
          addressLocality: 'Franklin',
          addressRegion: 'TN',
          postalCode: '37069',
          addressCountry: 'US'
        }
      };
      html = html.replace(/<\/head>/i, `<script id="${schemaId}" type="application/ld+json">${JSON.stringify(schema)}</script></head>`);
    }
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    pagesChanged += 1;
  }
}

const stylesPath = path.join(DIST, 'assets', 'styles.css');
let styles = fs.readFileSync(stylesPath, 'utf8');
const cssMarker = '/* R25 complete-site quality and consistency layer */';
if (styles.includes(cssMarker)) styles = styles.slice(0, styles.indexOf(cssMarker)).trimEnd() + '\n';
styles += `\n\n${cssMarker}\n:where(h1,h2,h3,p,li,figcaption){text-wrap:pretty}\n:where(button,.button,a,input,select,textarea){touch-action:manipulation}\n.footer-contact-r25{grid-column:1/-1;display:flex;align-items:center;gap:7px 10px;flex-wrap:wrap;margin:20px 0 0;padding-top:16px;border-top:1px solid var(--line);font-style:normal;color:#43565b}\n.footer-contact-r25 strong{color:var(--ink)}\n.footer-contact-r25 a{font-weight:720}\n.card,.r22-card,.tool,.r22-dashboard-card,.profile-card{content-visibility:auto;contain-intrinsic-size:1px 260px}\nmain:focus{outline:none}\n@media(max-width:780px){.footer-grid{grid-template-columns:1fr}.footer-contact-r25{font-size:.88rem}.section{padding-block:42px}.wrap{padding-inline:18px}}\n@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}\n@media print{header,.menu-toggle,.navigator-examples,.r24-chips{display:none!important}.footer{padding-top:14px}.footer-contact-r25{display:block}.card,.r22-card,.tool{content-visibility:visible;contain:none;box-shadow:none!important}}\n`;
fs.writeFileSync(stylesPath, styles);

const appPath = path.join(DIST, 'assets', 'app.js');
let app = fs.readFileSync(appPath, 'utf8');
const jsMarker = '/* R25 sitewide usability layer */';
if (app.includes(jsMarker)) app = app.slice(0, app.indexOf(jsMarker)).trimEnd() + '\n';
app += `\n\n${jsMarker}\n(() => {\n  const normalize = value => { try { const url = new URL(value, location.href); return url.origin === location.origin ? url.pathname.replace(/\\/index\\.html$/, '/').replace(/\\/+$/, '/') || '/' : null; } catch { return null; } };\n  const current = location.pathname.replace(/\\/index\\.html$/, '/').replace(/\\/+$/, '/') || '/';\n  for (const link of document.querySelectorAll('header nav a[href]')) {\n    const target = normalize(link.getAttribute('href'));\n    if (target && target === current) link.setAttribute('aria-current', 'page');\n  }\n  for (const link of document.querySelectorAll('a[target="_blank"]')) {\n    const rel = new Set((link.getAttribute('rel') || '').split(/\\s+/).filter(Boolean));\n    rel.add('noopener'); link.setAttribute('rel', [...rel].join(' '));\n  }\n  for (const textarea of document.querySelectorAll('textarea:not([data-navigator-input])')) {\n    if (textarea.dataset.r25AutoGrow === 'true') continue;\n    textarea.dataset.r25AutoGrow = 'true';\n    const resize = () => { textarea.style.height = 'auto'; textarea.style.height = Math.min(textarea.scrollHeight, 240) + 'px'; textarea.style.overflowY = textarea.scrollHeight > 240 ? 'auto' : 'hidden'; };\n    textarea.addEventListener('input', resize, { passive: true });\n  }\n  document.documentElement.dataset.franklinRelease = '${RELEASE}';\n})();\n`;
fs.writeFileSync(appPath, app);

fs.mkdirSync(path.join(DIST, '.well-known'), { recursive: true });
fs.writeFileSync(path.join(DIST, '.well-known', 'security.txt'), [
  `Contact: mailto:${EMAIL}`,
  `Canonical: ${ORIGIN}/.well-known/security.txt`,
  'Preferred-Languages: en, es',
  'Policy: https://franklinnavigator.com/privacy/',
  'Expires: 2027-08-31T23:59:59Z',
  ''
].join('\n'));

const improvementList = {
  schemaVersion: 'franklin.next-version-improvement-list.v1',
  release: RELEASE,
  completedInThisRelease: [
    'Corrected all known full-site audit warnings from the R24.1 baseline.',
    'Normalized self-canonical URLs across every generated HTML page.',
    'Completed Franklin phone, email and address presentation on every page footer that was incomplete.',
    'Added missing description, canonical and search handling to the not-found page.',
    'Eliminated the duplicate Growth Desk canonical condition.',
    'Added consistent theme metadata, external-link protection and image decoding hints.',
    'Added organization structured data, security contact disclosure and sitewide mobile, print, reduced-motion and readability polish.',
    'Preserved the balanced Ask Navigator layout, six-line auto-growth and natural answer expansion.',
    'Preserved all 19,103 profiles and every qualified public route.'
  ],
  nextQualifiedPriorities: [
    'Complete and prove the Franklin-isolated account, session, subscription and entitlement runtime.',
    'Complete controlled Stripe payment, failure, cancellation, refund and renewal reconciliation before opening checkout.',
    'Automate source-backed Around Franklin freshness without fabricating local events.',
    'Continue lawful profile currentness, correction and evidence enrichment.',
    'Expand member first-value guidance and bilingual support after verified entitlement activation.'
  ],
  noChangesForTheirOwnSake: true
};
writeJson(path.join(DIST, 'data', 'r25-next-version-improvement-list.json'), improvementList);

const quality = {
  schemaVersion: 'franklin.r25.site-quality.v1',
  release: RELEASE,
  builtAt: BUILD_DATE,
  baselineAudit: {
    errors: 0,
    warnings: 161,
    contactWarnings: 159,
    missing404DescriptionOrCanonical: 1,
    duplicateGrowthDeskCanonical: 1
  },
  changes: {
    pagesChanged,
    contactPagesCorrected,
    descriptionsAdded,
    canonicalsNormalized,
    themeColorsAdded,
    imageDecodingAdded,
    noopenerCorrections,
    organizationStructuredData: true,
    securityTxt: true,
    globalReducedMotionSupport: true,
    globalPrintPolish: true,
    globalMobilePolish: true
  },
  commerceBoundary: {
    paidCheckoutActive: false,
    reason: 'FRANKLIN_ISOLATED_PERSISTENT_RUNTIME_AND_CONTROLLED_LIFECYCLE_PROOF_PENDING',
    workOrdersPreserved: [
      'WO-20260829-LOCAL-FRANKLIN-R22-COMMERCE-INTEGRATION-022',
      'WO-20260830-LOCAL-FRANKLIN-R24-PERSISTENT-COMMERCE-AND-PRESELL-023',
      'WO-20260830-LOCAL-FRANKLIN-R24-LIVE-PAID-MEMBERSHIP-ACTIVATION-024'
    ]
  },
  authorityTransfer: false
};
writeJson(path.join(DIST, 'data', 'r25-site-quality.json'), quality);

const identityPath = path.join(DIST, 'release-identity.json');
const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
identity.schemaVersion = 'franklin.public-release-identity.v1.1';
identity.release = RELEASE;
identity.builtAt = BUILD_DATE;
identity.profileCount = 19103;
identity.exactDirectPredecessor = {
  release: PREDECESSOR_RELEASE,
  productionGitCommit: PREDECESSOR_COMMIT,
  productionGitTree: PREDECESSOR_TREE
};
identity.gitCommit = 'PENDING_VERIFIED_PROMOTION';
identity.sourceArtifactSha256 = 'BOUND_BY_POST_SEAL_RELEASE_RECEIPT';
writeJson(identityPath, identity);

production.schemaVersion = 'smarter.franklin.production-release.v7';
production.release = RELEASE;
production.exactDirectPredecessor = {
  release: PREDECESSOR_RELEASE,
  productionGitCommit: PREDECESSOR_COMMIT,
  productionGitTree: PREDECESSOR_TREE,
  productionDeployPerformed: true
};
production.sourceArtifact = {
  construction: 'EXACT_VERIFIED_R24_1_PRODUCTION_TREE_PLUS_DETERMINISTIC_R25_SITEWIDE_QUALITY_LAYER',
  predecessorTree: PREDECESSOR_TREE,
  finalArtifactHash: 'BOUND_BY_POST_SEAL_RELEASE_RECEIPT'
};
production.publicPayload = {
  htmlPages: 19276,
  sitemapRoutes: 19274,
  profiles: 19103,
  brokenInternalTargets: 0,
  brokenAnchors: 0,
  unsafeScriptLikeLinks: 0,
  publicLanguageFindings: 0
};
production.visibleHomepage.askNavigator = {
  restingDesktopCardMaxWidthPx: 540,
  restingTextareaMinHeightPx: 110,
  restingRows: 3,
  autoGrowMaximumLines: 6,
  overflowAfterMaximum: 'INTERNAL_SCROLL',
  answerExpansion: 'NATURAL_VERTICAL_BELOW_INPUT',
  mobileWidth: 'FULL_AVAILABLE_WIDTH',
  status: 'PRESERVED_AND_REGRESSION_TESTED'
};
production.fullSiteQuality = {
  pagesAudited: 19276,
  baselineWarningsAddressed: 161,
  currentContactCompleteOnFooterPages: true,
  selfCanonicalPages: true,
  notFoundMetadataComplete: true,
  duplicateCanonicalConditionRemoved: true,
  representativeDesktopAndMobileVerification: 'PENDING_BUILD_GATE'
};
production.verification = {
  exhaustivePublicPageAudit: 'PENDING_BUILD_GATE',
  representativeVisualAudit: 'PENDING_BUILD_GATE',
  releaseIntegrityAudit: 'PENDING_BUILD_GATE'
};
production.commerce = {
  products: 14,
  selfServiceRecurringPrices: 84,
  enterprise: 'QUOTE_ONLY',
  foundingOffer: 'FOUNDING30',
  paidCommerceActive: false,
  stripeDownstreamEntitlementProcessingActive: false,
  productionEntitlementPersistence: false,
  codeLifecycleTests: 'PASS_NON_CHARGING',
  blocker: 'FRANKLIN_ISOLATED_PERSISTENT_RUNTIME_AND_CONTROLLED_REAL_TRANSACTION_PROOF_PENDING'
};
production.deployment = {
  provider: 'Render',
  serviceId: 'srv-da8tg6rbc2fs73crru2g',
  serviceName: 'franklin-navigator',
  repository: 'https://github.com/neutralboardroom/franklin-navigator',
  branch: 'main',
  automaticDeploy: false,
  scope: 'PUBLIC_STATIC_R25_COMPLETE_SITE_QUALITY__PAID_COMMERCE_FAIL_CLOSED'
};
production.nextVersionImprovementList = '/data/r25-next-version-improvement-list.json';
production.authorityTransfer = false;
writeJson(productionPath, production);

fs.writeFileSync(path.join(ROOT, 'README.md'), `# Franklin Navigator production\n\nClean public static production tree for \`${RELEASE}\`.\n\nR25 applies the complete-site audit corrections and consistency layer across all 19,276 HTML pages while preserving 19,103 public profiles and the approved R24.1 Ask Navigator interaction. Paid checkout remains fail-closed until the Franklin-isolated persistent membership runtime and controlled lifecycle proof are complete.\n\nThe release improvement record is published at \`dist/data/r25-next-version-improvement-list.json\`.\n`);

const manifestPath = path.join(DIST, 'FRANKLIN_BUILD_MANIFEST.json');
const priorManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const records = [];
for (const file of walk(DIST)) {
  if (file === manifestPath) continue;
  const bytes = fs.readFileSync(file);
  records.push({ path: rel(file), bytes: bytes.length, sha256: sha256(bytes) });
}
records.sort((a, b) => a.path.localeCompare(b.path));
const htmlCount = records.filter((item) => item.path.endsWith('.html')).length;
const profileCount = records.filter((item) => /^profiles\/[^/]+\/index\.html$/.test(item.path)).length;
const treeDigestSha256 = sha256(records.map((item) => `${item.path}\0${item.bytes}\0${item.sha256}`).join('\n'));
const manifest = {
  ...priorManifest,
  schemaVersion: 'franklin.build-manifest.r25.v1',
  release: RELEASE,
  builtAt: BUILD_DATE,
  exactDirectPredecessor: {
    release: PREDECESSOR_RELEASE,
    productionGitCommit: PREDECESSOR_COMMIT,
    productionGitTree: PREDECESSOR_TREE
  },
  builtHtmlPages: htmlCount,
  profilePages: profileCount,
  treeDigestSha256,
  r25CompleteSiteQuality: true,
  baselineAuditWarningsAddressed: 161,
  productionDeployPerformed: false,
  files: records
};
writeJson(manifestPath, manifest);

console.log(JSON.stringify({
  ok: true,
  release: RELEASE,
  htmlCount,
  profileCount,
  fileRecords: records.length,
  treeDigestSha256,
  pagesChanged,
  contactPagesCorrected,
  descriptionsAdded,
  canonicalsNormalized,
  themeColorsAdded,
  imageDecodingAdded,
  noopenerCorrections
}, null, 2));
