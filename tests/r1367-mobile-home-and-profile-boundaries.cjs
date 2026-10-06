'use strict';
const fs=require('fs');
const crypto=require('crypto');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const sha256=s=>crypto.createHash('sha256').update(s).digest('hex');
const checks=[];
const ok=(name,value)=>{assert.ok(value,name);checks.push(name)};

// Owner lock: R1367 may change the phone presentation, but the established
// desktop/laptop homepage stylesheet must remain byte-for-byte unchanged.
const baseStyles=read('dist/assets/styles.css');
ok('desktop/laptop homepage stylesheet remains byte-identical to R1366',sha256(baseStyles)==='65e31e734a7f68ebb10ed5ed4197a700bf76c3cb');

const homeCss=read('dist/assets/r27-home.css');
const marker='/* R1367 mobile-only homepage image refinement. Desktop/tablet presentation is intentionally untouched. */';
const markerAt=homeCss.indexOf(marker);
ok('R1367 mobile hero refinement is present',markerAt>=0);
const beforeMarker=homeCss.slice(0,markerAt);
const phoneMediaAt=beforeMarker.lastIndexOf('@media (max-width: 620px)');
const phoneMediaClose=homeCss.indexOf('\n}\n\n@media (prefers-reduced-motion',markerAt);
ok('hero refinement is contained inside the phone-only max-width 620px media query',phoneMediaAt>=0&&phoneMediaClose>markerAt);
const mobileBlock=homeCss.slice(markerAt,phoneMediaClose);
ok('phone hero becomes one full-width column',mobileBlock.includes('grid-template-columns: 1fr'));
ok('phone hero hides extra photo figures',mobileBlock.includes('.r24-hero-photos figure {')&&mobileBlock.includes('display: none'));
ok('phone hero keeps the first Main Street image',mobileBlock.includes('.r24-hero-photos figure:first-child')&&mobileBlock.includes('display: block'));
ok('phone hero uses a stable widescreen image frame',mobileBlock.includes('aspect-ratio: 16 / 9')&&mobileBlock.includes('height: auto')&&mobileBlock.includes('object-fit: cover'));

for(const page of ['dist/index.html','dist/es/index.html']){
  const html=read(page);
  ok(`${page} keeps the same three desktop hero source images`,html.includes('/assets/franklin-photos/main-street.webp')&&html.includes('/assets/franklin-photos/pinkerton.webp')&&html.includes('/assets/franklin-photos/business.webp'));
  ok(`${page} still loads the shared R27 homepage stylesheet`,html.includes('/assets/r27-home.css'));
}

// R1360 carried-forward identity boundary: an intentionally suppressed generic
// profile must not re-enter public discovery, claim, membership or checkout scope.
const suppressed='FR-ORG-a0776afee5ec-firstbank';
const scope=JSON.parse(read('runtime/franklin-membership/data/member-profile-scope.json'));
ok('suppressed generic is absent from membership/entitlement runtime scope',!Object.hasOwn(scope.profiles||{},suppressed));

const manifest=JSON.parse(read('dist/data/franklin-profiles-manifest.json'));
let publicHit=false;
for(const chunk of manifest.chunks||[]){
  const rel=String(chunk.file||'').replace(/^\//,'');
  const payload=JSON.parse(read('dist/'+rel.replace(/^data\//,'data/')));
  if((payload.records||[]).some(r=>r&&r.i===suppressed)){publicHit=true;break;}
}
ok('suppressed generic is absent from the public directory projection',!publicHit);

const suppressedPage=read(`dist/profiles/${suppressed}/index.html`);
ok('suppressed generic public route is noindex/nofollow',suppressedPage.includes('noindex,nofollow'));
ok('suppressed generic route states that it is not claimable',suppressedPage.includes('not published as a claimable profile'));
ok('suppressed generic route offers location discovery instead of claim or membership',suppressedPage.includes('/directory/?q=FirstBank')&&!/claim-profile|membership-start|checkout/i.test(suppressedPage));

const generator=read('scripts/r1360-profile-quality-build.py');
ok('identity generator retains separate alias, review-hold and generic-suppression states',generator.includes('aliases=dict(')&&generator.includes('holds=set()')&&generator.includes("suppressed_generic={'FR-ORG-a0776afee5ec-firstbank'}"));
ok('runtime scope generator removes aliases and suppressed generic identities',generator.includes('if pid in aliases or pid in suppressed_generic: profiles.pop(pid,None)'));

console.log(JSON.stringify({result:'PASS',releaseCandidate:'R1367',checks:checks.length,items:checks},null,2));
