'use strict';
const fs=require('fs');
const crypto=require('crypto');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const gitBlobSha1=s=>{const b=Buffer.from(s,'utf8');return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex')};
const checks=[];
const ok=(name,value)=>{assert.ok(value,name);checks.push(name)};
const RELEASE='FR-NAV1.30.67-HF3.13.49';

// Owner lock: R1367 may change the phone presentation, but the established
// desktop/laptop homepage stylesheet must remain byte-for-byte unchanged.
const baseStyles=read('dist/assets/styles.css');
ok('desktop/laptop homepage stylesheet remains byte-identical to R1366',gitBlobSha1(baseStyles)==='65e31e734a7f68ebb10ed5ed4197a700bf76c3cb');

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
  ok(`${page} carries the R1367 release marker`,html.includes(`content="${RELEASE}" name="franklin-release"`));
}
const esHome=read('dist/es/index.html');
ok('Spanish homepage no longer says membership enrollment is closed',!esHome.includes('mientras la inscripción permanece cerrada'));
ok('Spanish homepage accurately states optional $35/year Community Membership and preserves free rights',esHome.includes('Membresía Comunitaria opcional de $35/año')&&esHome.includes('corregir hechos')&&esHome.includes('solicitar el retiro'));
ok('Spanish Explore Community stays in the Spanish experience',esHome.includes('href="/es/comunidad/">Explorar Comunidad'));
ok('Spanish footer membership stays in the Spanish experience',esHome.includes('href="/es/iniciar-membresia/">Membresía'));
ok('Spanish footer privacy stays in the Spanish experience',esHome.includes('href="/es/privacidad/">Privacidad'));

for(const page of ['dist/profile-studio/index.html','dist/membership-status/index.html']){
  const html=read(page);
  ok(`${page} carries the R1367 release marker`,html.includes(`content="${RELEASE}" name="franklin-release"`));
  ok(`${page} does not contradict the live reviewed-PDF capability`,!/PDF (?:flyer\/coupon )?uploads are not supported/i.test(html));
  ok(`${page} states the reviewed PDF size and page limits`,html.includes('PDF')&&html.includes('4 MB')&&html.includes('20 pages'));
  ok(`${page} states fail-closed unsafe PDF classes`,html.includes('active')&&html.includes('encrypted')&&html.includes('embedded-file')&&html.includes('form-like'));
}

// R1360 carried-forward identity boundary: an intentionally suppressed generic
// profile must not re-enter public discovery, claim, membership or checkout scope.
const suppressed='FR-ORG-a0776afee5ec-firstbank';
const aliasPublic=JSON.parse(read('dist/data/profile-aliases-r1360.json'));
const aliasRuntime=JSON.parse(read('runtime/franklin-membership/data/profile-aliases-r1360.json'));
ok('public alias contract explicitly distinguishes intentional generic suppression',JSON.stringify(aliasPublic.suppressedGenericProfileIds)==JSON.stringify([suppressed]));
ok('runtime alias contract explicitly distinguishes intentional generic suppression',JSON.stringify(aliasRuntime.suppressedGenericProfileIds)==JSON.stringify([suppressed]));
ok('review-hold state remains distinct and empty in the accepted PF15.38 contract',Array.isArray(aliasRuntime.reviewHeldProfileIds)&&aliasRuntime.reviewHeldProfileIds.length===0);
ok('canonical alias state remains distinct with 100 retired-to-canonical mappings',Object.keys(aliasRuntime.aliases||{}).length===100);

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
const scopeLoader=read('runtime/franklin-membership/lib/profile-scope.js');
ok('runtime profile loader fails closed on explicit suppressed-generic contract entries',scopeLoader.includes('for(const suppressed of aliasContract.suppressedGenericProfileIds||[])delete profiles[suppressed]'));

console.log(JSON.stringify({result:'PASS',releaseCandidate:RELEASE,checks:checks.length,items:checks},null,2));
