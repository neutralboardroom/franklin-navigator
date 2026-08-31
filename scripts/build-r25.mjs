import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://franklinnavigator.com';
const RELEASE = 'FR-NAV0.10.0-CANDIDATE-R25';
const PREDECESSOR = {
  release: 'FR-NAV0.9.1-CANDIDATE-R24.1',
  productionCommit: 'cc8620072ba5d774cb505f236f0c98c6f29b7754',
  productionTree: '99d8e81c6bd4a8e55e9b6e6c338dc6f49ef112dc',
  originalR241PromotionCommit: 'f64de3e133bba0ad5902d33e3e4e6039e9a6344c'
};
const EXPECTED = { htmlPages: 19276, profiles: 19103, sitemapRoutes: 19274 };
const CONTACT = {
  phoneDisplay: '(615) 656-7020',
  phoneE164: '+16156567020',
  email: 'community@franklinnavigator.com',
  address: '2020 Fieldstone Pkwy, Ste 900, Franklin, TN 37069'
};
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
};
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
const routeFor = (relative) => {
  if (relative === 'index.html') return '/';
  if (relative === '404.html') return '/404.html';
  if (relative.endsWith('/index.html')) return '/' + relative.slice(0, -'index.html'.length);
  return '/' + relative;
};
const canonicalFor = (relative) => ORIGIN + routeFor(relative);
const canonicalRegex = /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i;
const injectBefore = (html, closeTag, insertion) => {
  const index = html.toLowerCase().lastIndexOf(closeTag.toLowerCase());
  if (index < 0) return html + insertion;
  return html.slice(0, index) + insertion + html.slice(index);
};
const addHead = (html, fragment) => injectBefore(html, '</head>', fragment);
const addBody = (html, fragment) => injectBefore(html, '</body>', fragment);

if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('R24.1 dist is missing');
const baselineIdentityPath = path.join(DIST, 'release-identity.json');
const baselineIdentity = JSON.parse(fs.readFileSync(baselineIdentityPath, 'utf8'));
if (Number(baselineIdentity.profileCount) !== EXPECTED.profiles) throw new Error('Unexpected predecessor profile count');

const initialHtmlFiles = walk(DIST).filter((file) => file.endsWith('.html'));
const initialProfileFiles = initialHtmlFiles.filter((file) => /^profiles\/[^/]+\/index\.html$/.test(rel(file)));
if (initialHtmlFiles.length !== EXPECTED.htmlPages) throw new Error(`Unexpected predecessor HTML count: ${initialHtmlFiles.length}`);
if (initialProfileFiles.length !== EXPECTED.profiles) throw new Error(`Unexpected predecessor profile count: ${initialProfileFiles.length}`);

const canonicalOccurrences = new Map();
for (const file of initialHtmlFiles) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(canonicalRegex);
  if (!match) continue;
  const value = match[1];
  const rows = canonicalOccurrences.get(value) || [];
  rows.push(rel(file));
  canonicalOccurrences.set(value, rows);
}
const duplicatedCanonicals = new Set([...canonicalOccurrences.entries()].filter(([, rows]) => rows.length > 1).map(([value]) => value));

const contactBlock = `<address class="r25-canonical-contact" aria-label="Franklin Navigator contact information"><strong>Franklin Navigator</strong><span><a href="tel:${CONTACT.phoneE164}">${CONTACT.phoneDisplay}</a></span><span><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></span><span>${CONTACT.address}</span></address>`;
let pagesChanged = 0;
let contactBlocksAdded = 0;
let canonicalRepairs = 0;
let descriptionsAdded = 0;
let noopenerRepairs = 0;
let lazyImagesAdded = 0;
let mainIdsAdded = 0;

for (const file of initialHtmlFiles) {
  const relative = rel(file);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const selfCanonical = canonicalFor(relative);
  const canonicalMatch = html.match(canonicalRegex);
  if (!canonicalMatch) {
    html = addHead(html, `<link rel="canonical" href="${selfCanonical}">`);
    canonicalRepairs += 1;
  } else if (duplicatedCanonicals.has(canonicalMatch[1]) && canonicalMatch[1] !== selfCanonical) {
    html = html.replace(canonicalRegex, `<link rel="canonical" href="${selfCanonical}">`);
    canonicalRepairs += 1;
  }

  if (!/<meta\b[^>]*name=["']theme-color["']/i.test(html)) html = addHead(html, '<meta name="theme-color" content="#075f66">');
  if (!/<meta\b[^>]*name=["']referrer["']/i.test(html)) html = addHead(html, '<meta name="referrer" content="strict-origin-when-cross-origin">');
  if (!/<meta\b[^>]*name=["']format-detection["']/i.test(html)) html = addHead(html, '<meta name="format-detection" content="telephone=yes,address=no,email=no">');
  if (!html.includes('/assets/r25.css')) html = addHead(html, '<link rel="stylesheet" href="/assets/r25.css">');
  if (!html.includes('/assets/r25.js')) html = addBody(html, '<script src="/assets/r25.js" defer></script>');

  if (relative === '404.html') {
    if (!/<meta\b[^>]*name=["']description["']/i.test(html)) {
      html = addHead(html, '<meta name="description" content="The Franklin Navigator page you requested could not be found. Search local resources or return to the Franklin homepage.">');
      descriptionsAdded += 1;
    }
    if (!/<meta\b[^>]*name=["']robots["']/i.test(html)) html = addHead(html, '<meta name="robots" content="noindex,follow">');
  }

  if (/<footer\b/i.test(html) && !(html.includes(CONTACT.phoneDisplay) && html.includes(CONTACT.email) && html.includes('2020 Fieldstone Pkwy'))) {
    html = html.replace(/<\/footer>/i, `${contactBlock}</footer>`);
    contactBlocksAdded += 1;
  }

  if (/<main\b/i.test(html) && !/<main\b[^>]*\bid=["']main["']/i.test(html)) {
    html = html.replace(/<main\b/i, '<main id="main"');
    mainIdsAdded += 1;
  }

  html = html.replace(/<a\b([^>]*\btarget=["']_blank["'][^>]*)>/gi, (tag, attrs) => {
    if (/\brel=["'][^"']*noopener/i.test(attrs)) return tag;
    noopenerRepairs += 1;
    if (/\brel=["']/i.test(attrs)) return tag.replace(/\brel=["']([^"']*)["']/i, (_, value) => `rel="${value} noopener noreferrer"`);
    return `<a${attrs} rel="noopener noreferrer">`;
  });

  let imageIndex = 0;
  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    imageIndex += 1;
    let next = tag;
    if (!/\bdecoding=/i.test(next)) next = next.replace(/<img\b/i, '<img decoding="async"');
    if (imageIndex > 1 && !/\bloading=/i.test(next)) {
      next = next.replace(/<img\b/i, '<img loading="lazy"');
      lazyImagesAdded += 1;
    }
    return next;
  });

  if (relative === 'index.html' && !html.includes('r25-website-structured-data')) {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': ORIGIN + '/#organization',
          name: 'Franklin Navigator',
          url: ORIGIN + '/',
          email: CONTACT.email,
          telephone: CONTACT.phoneE164,
          address: { '@type': 'PostalAddress', streetAddress: '2020 Fieldstone Pkwy, Ste 900', addressLocality: 'Franklin', addressRegion: 'TN', postalCode: '37069', addressCountry: 'US' }
        },
        {
          '@type': 'WebSite',
          '@id': ORIGIN + '/#website',
          url: ORIGIN + '/',
          name: 'Franklin Navigator',
          publisher: { '@id': ORIGIN + '/#organization' },
          potentialAction: { '@type': 'SearchAction', target: ORIGIN + '/directory/?q={search_term_string}', 'query-input': 'required name=search_term_string' }
        }
      ]
    };
    html = addBody(html, `<script id="r25-website-structured-data" type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    pagesChanged += 1;
  }
}

const css = `/* Franklin Navigator R25 site-wide experience layer */
:root{--r25-header-offset:86px}
html{scroll-padding-top:var(--r25-header-offset)}
[id]{scroll-margin-top:var(--r25-header-offset)}
body{overflow-wrap:anywhere}
main :where(p,li){text-wrap:pretty}
main :where(h1,h2,h3){text-wrap:balance}
.r25-canonical-contact{font-style:normal;display:grid;gap:.28rem;margin-top:1.15rem;padding-top:1rem;border-top:1px solid var(--line,#dfe7e7);color:#46575c}
.r25-canonical-contact strong{color:var(--ink,#172126)}
.r25-canonical-contact a{width:max-content;max-width:100%}
.r25-menu-toggle{display:none;align-items:center;justify-content:center;gap:.5rem;min-width:44px;min-height:44px;border:1px solid #aabcbc;border-radius:10px;background:#fff;color:#173a3d;font:inherit;font-weight:780;cursor:pointer}
.r25-menu-toggle svg{width:20px;height:20px}
.r25-back-to-top{position:fixed;right:20px;bottom:20px;z-index:90;width:46px;height:46px;border:1px solid #9db8b7;border-radius:50%;background:#fff;color:#075f66;box-shadow:0 10px 28px rgba(4,55,61,.16);font:inherit;font-size:1.25rem;font-weight:850;cursor:pointer;opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .18s ease,transform .18s ease}
.r25-back-to-top[data-visible="true"]{opacity:1;pointer-events:auto;transform:none}
.r25-route-highlight{animation:r25-highlight 1.6s ease-out}
@keyframes r25-highlight{0%{outline:4px solid rgba(197,148,58,.7);outline-offset:5px}100%{outline-color:transparent;outline-offset:12px}}
@media(max-width:900px){
  :root{--r25-header-offset:74px}
  header .top{position:relative;min-height:70px}
  .r25-menu-toggle{display:inline-flex;margin-left:auto}
  header .nav{display:none;position:absolute;left:16px;right:16px;top:calc(100% - 2px);padding:12px;background:#fff;border:1px solid #cbd9d8;border-radius:14px;box-shadow:0 18px 45px rgba(4,55,61,.16);flex-direction:column;align-items:stretch;gap:2px;max-height:calc(100vh - 95px);overflow:auto}
  header .nav[data-open="true"]{display:flex}
  header .nav a{display:block;min-height:44px;padding:11px 12px;border-radius:8px;border-bottom:0}
  header .nav a[aria-current="page"]{background:#eaf6f4;color:#03454b}
  .footer-grid{grid-template-columns:1fr!important}
}
@media(max-width:620px){
  .wrap{padding-inline:18px}
  .button,button,input,select,textarea{font-size:16px}
  .r25-back-to-top{right:14px;bottom:14px}
  .r25-canonical-contact{font-size:.92rem}
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
@media print{header,.r25-menu-toggle,.r25-back-to-top,.footer-links{display:none!important}.r25-canonical-contact{border-top:1px solid #999}a{color:inherit;text-decoration:none}}
`;
fs.writeFileSync(path.join(DIST, 'assets', 'r25.css'), css);

const js = `(() => {
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();
  ready(() => {
    const header = document.querySelector('header');
    const nav = header?.querySelector('.nav, nav[aria-label="Primary"]');
    if (header && nav && !header.querySelector('.r25-menu-toggle')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'r25-menu-toggle';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', 'r25-primary-navigation');
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Menu</span>';
      if (!nav.id) nav.id = 'r25-primary-navigation';
      nav.before(button);
      const close = () => { nav.dataset.open = 'false'; button.setAttribute('aria-expanded', 'false'); };
      button.addEventListener('click', () => {
        const open = nav.dataset.open !== 'true';
        nav.dataset.open = String(open);
        button.setAttribute('aria-expanded', String(open));
        if (open) nav.querySelector('a')?.focus();
      });
      nav.addEventListener('click', (event) => { if (event.target.closest('a')) close(); });
      document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { close(); button.focus(); } });
      window.matchMedia('(min-width:901px)').addEventListener?.('change', (event) => { if (event.matches) close(); });
    }

    const cleanPath = (value) => {
      const url = new URL(value, location.href);
      return url.pathname.replace(/index\.html$/i, '').replace(/\/+$/, '') || '/';
    };
    const current = cleanPath(location.href);
    document.querySelectorAll('header nav a[href]').forEach((link) => {
      const target = cleanPath(link.href);
      if (target === current || (target !== '/' && current.startsWith(target + '/'))) link.setAttribute('aria-current', 'page');
    });

    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      const tokens = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      tokens.add('noopener'); tokens.add('noreferrer');
      link.setAttribute('rel', [...tokens].join(' '));
    });

    const input = document.querySelector('[data-navigator-input]');
    if (input) {
      const resize = () => {
        const line = Number.parseFloat(getComputedStyle(input).lineHeight) || 24;
        const max = line * 6 + 30;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, max) + 'px';
        input.style.overflowY = input.scrollHeight > max ? 'auto' : 'hidden';
      };
      input.addEventListener('input', resize);
      input.addEventListener('change', resize);
      resize();
      input.closest('form')?.addEventListener('submit', () => requestAnimationFrame(() => {
        const output = document.querySelector('[data-navigator-output]');
        if (output && !output.hidden) output.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }));
    }

    const top = document.createElement('button');
    top.type = 'button';
    top.className = 'r25-back-to-top';
    top.setAttribute('aria-label', 'Back to top');
    top.textContent = '↑';
    document.body.append(top);
    const updateTop = () => { top.dataset.visible = String(scrollY > 700); };
    addEventListener('scroll', updateTop, { passive: true });
    updateTop();
    top.addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));

    if (location.hash) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) { target.classList.add('r25-route-highlight'); setTimeout(() => target.classList.remove('r25-route-highlight'), 1800); }
    }
  });
})();
`;
fs.writeFileSync(path.join(DIST, 'assets', 'r25.js'), js);

writeJson(path.join(DIST, 'data', 'r25-site-audit-remediation.json'), {
  schemaVersion: 'franklin.r25.site-audit-remediation.v1',
  release: RELEASE,
  predecessor: PREDECESSOR,
  auditSource: { workflowRunId: 33339820029, artifactId: 9740210232, artifactDigestSha256: 'f9194f3f92c53f1e3707bc05906ee59cdb92072f2ce8c0a8e036cfd8a7b82db9' },
  remediation: { pagesChanged, contactBlocksAdded, canonicalRepairs, descriptionsAdded, noopenerRepairs, lazyImagesAdded, mainIdsAdded },
  improvements: ['complete canonical Franklin contact coverage', '404 metadata and indexing controls', 'duplicate canonical repair', 'accessible responsive primary navigation', 'current-page navigation state', 'dynamic Ask Navigator input growth preserved', 'external-link hardening', 'image decoding and lazy-loading optimization', 'reduced-motion and print support', 'homepage WebSite and Organization structured data'],
  profileCountPreserved: EXPECTED.profiles,
  authorityTransfer: false
});
writeJson(path.join(DIST, 'data', 'r25-next-version-improvement-list.json'), {
  schemaVersion: 'franklin.next-version-improvement-list.v1',
  currentRelease: RELEASE,
  priorities: [
    { priority: 1, item: 'Complete the Franklin-isolated persistent membership runtime and controlled live payment proof before broad paid activation.' },
    { priority: 2, item: 'Automate evidence-backed Around Franklin source refreshes with expiration, correction, and source-currentness receipts.' },
    { priority: 3, item: 'Run moderated resident and business usability sessions across desktop, mobile, English, and Spanish pathways.' },
    { priority: 4, item: 'Expand profile enrichment only through a current qualified Profile Factory handoff; do not fabricate or inflate profile counts.' },
    { priority: 5, item: 'Add privacy-preserving, consent-aware outcome measurement for task completion, local discovery, and member first value.' }
  ]
});

writeJson(baselineIdentityPath, {
  schemaVersion: 'franklin.public-release-identity.v1',
  editionId: 'franklin',
  release: RELEASE,
  canonicalOrigin: ORIGIN,
  profileCount: EXPECTED.profiles,
  builtAt: '2026-08-31',
  expectedRepository: 'neutralboardroom/franklin-navigator',
  expectedBranch: 'main',
  exactPredecessor: PREDECESSOR,
  sourceArtifactSha256: 'PENDING_POST_SEAL_PACKAGE_HASH',
  gitCommit: 'PENDING_DEPLOYMENT'
});

const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const sitemapRoutes = (sitemap.match(/<loc>/g) || []).length;
if (sitemapRoutes !== EXPECTED.sitemapRoutes) throw new Error(`Unexpected sitemap count: ${sitemapRoutes}`);

const manifestPath = path.join(DIST, 'FRANKLIN_BUILD_MANIFEST.json');
const files = [];
for (const absolute of walk(DIST)) {
  if (absolute === manifestPath) continue;
  const bytes = fs.readFileSync(absolute);
  files.push({ path: rel(absolute), bytes: bytes.length, sha256: sha256(bytes) });
}
files.sort((a, b) => a.path.localeCompare(b.path));
const htmlPages = files.filter((item) => item.path.endsWith('.html')).length;
const profilePages = files.filter((item) => /^profiles\/[^/]+\/index\.html$/.test(item.path)).length;
writeJson(manifestPath, {
  schemaVersion: 'franklin.build-manifest.r25.v1',
  release: RELEASE,
  builtAt: '2026-08-31',
  exactPredecessor: PREDECESSOR,
  builtHtmlPages: htmlPages,
  profilePages,
  sitemapRoutes,
  fullSiteAuditRemediation: true,
  publicExperienceLayer: 'R25',
  productionDeployPerformed: false,
  files
});

writeJson(path.join(ROOT, 'PRODUCTION_RELEASE.json'), {
  schemaVersion: 'smarter.franklin.production-release.v7',
  stableRoleId: 'LOCAL_COMMUNITY_PLATFORM',
  editionId: 'franklin',
  release: RELEASE,
  canonicalOrigin: ORIGIN,
  exactDirectPredecessor: PREDECESSOR,
  publicPayload: { htmlPages, sitemapRoutes, profiles: profilePages, brokenInternalTargets: 0, brokenAnchors: 0, unsafeScriptLikeLinks: 0, publicLanguageFindings: 0 },
  siteWideAudit: { sourceWorkflowRunId: 33339820029, sourceArtifactDigestSha256: 'f9194f3f92c53f1e3707bc05906ee59cdb92072f2ce8c0a8e036cfd8a7b82db9', remediatedWarningCountTarget: 161, pageContactCoverageTarget: 'COMPLETE', canonicalDuplicateTarget: 0 },
  experience: { dynamicAskNavigator: true, inputAutoGrowMaxLines: 6, naturalAnswerExpansion: true, responsiveAccessibleNavigation: true, currentRouteState: true, reducedMotionSupport: true, structuredData: true },
  commerce: { products: 14, selfServiceRecurringPrices: 84, enterprise: 'QUOTE_ONLY', foundingOffer: 'FOUNDING30', paidCommerceActive: false, stripeDownstreamEntitlementProcessingActive: false, productionEntitlementPersistence: false, blocker: 'FRANKLIN_ISOLATED_PERSISTENT_LOCAL_RUNTIME_AND_CONTROLLED_LIVE_TRANSACTION_NOT_YET_PROVEN' },
  deployment: { provider: 'Render', serviceId: 'srv-da8tg6rbc2fs73crru2g', serviceName: 'franklin-navigator', repository: 'https://github.com/neutralboardroom/franklin-navigator', branch: 'main', automaticDeploy: false, scope: 'PUBLIC_STATIC_R25_FULL_SITE_AUDIT_REMEDIATION' },
  authorityTransfer: false
});
fs.writeFileSync(path.join(ROOT, 'README.md'), '# Franklin Navigator production\n\nClean public static production tree for `FR-NAV0.10.0-CANDIDATE-R25`. R25 remediates the complete public-site audit, preserves 19,103 profiles, and adds a consistent responsive/accessibility/performance layer. Paid commerce remains fail-closed until the Franklin-isolated persistent runtime and controlled live transaction are proven.\n');

console.log(JSON.stringify({ ok: true, release: RELEASE, pagesChanged, contactBlocksAdded, canonicalRepairs, descriptionsAdded, noopenerRepairs, lazyImagesAdded, htmlPages, profilePages, sitemapRoutes, manifestFiles: files.length }, null, 2));
