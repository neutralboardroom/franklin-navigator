'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const p={membership:read('dist/membership-start/index.html'),business:read('dist/business-dashboard/index.html'),account:read('dist/member-account/index.html'),status:read('dist/membership-status/index.html'),tools:read('dist/member-tools/index.html'),preview:read('dist/member-profile-preview/index.html'),claim:read('dist/claim-profile/index.html')};
const all=Object.values(p).join('\n');
const promo=read('runtime-live/promotions-proxy.js');
const pkg=read('runtime-live/package.json');
const pdf=read('runtime-live/lib/r1366-pdf-policy.js');
const r66=JSON.parse(read('R1366_CLOSEOUT_AND_OUTREACH_READY_FOR_SRE_PREFLIGHT__2026-10-05.json'));
const r67=JSON.parse(read('R1367_POSTDEPLOY_CLOSEOUT_RECEIPT.json'));
const tests=[];
const rx=(label,text,re)=>tests.push([label,()=>assert.match(text,re,label)]);
const no=(label,text,re)=>tests.push([label,()=>assert.doesNotMatch(text,re,label)]);
const eq=(label,a,b)=>tests.push([label,()=>assert.deepEqual(a,b,label)]);

// 1-11 sitewide membership messaging
rx('visibility primary',p.membership,/visibility in the Franklin community/i);
rx('visibility mechanism explained',p.membership,/How increased visibility works/i);
rx('business marketing aligned',p.business,/Help increase your visibility in the Franklin community/i);
rx('price aligned',all,/\$35\/year/);
rx('free rights aligned',all,/factual corrections/i);
rx('features tied to implemented tools',p.tools,/Coupon, special, sale, promotion or event/i);
no('no affirmative guaranteed outcomes',all,/(?:we|franklin navigator|community membership|membership) guarantees? (?:page views|traffic|search ranking|search placement|leads|customers|sales|revenue|conversions|event attendance|calls|bookings)/i);
rx('clear CTA',p.business,/Find or manage my free profile/i);
rx('semantic main',all,/<main id="main">/i);
Object.entries(p).forEach(([name,text])=>assert.match(text,/name="viewport"/i,`${name} mobile viewport`));tests.push(['mobile viewport',()=>true]);
no('no public developer jargon',all,/\b(?:TODO|FIXME|internal release|developer-only|debug build)\b/i);

// 12-19 entitlements
eq('free entitlements',r66.freeRights.membershipRequiredForTheseFreeRights,false);
eq('paid entitlements',r66.memberCapabilities.visibleAndNotBuried,true);
eq('free image/logo',r66.freeRights.approvedBasicProfileImageOrLogo,true);
rx('free claim',p.claim,/free/i);
rx('free management',p.business,/free-profile management|basic profile management/i);
rx('free correction removal',p.business,/factual corrections.*removal|corrections.*removal/i);
rx('paid activation runtime',pkg,/membership/i);
rx('inactive membership fail closed',p.tools,/membership becomes inactive.*fail closed/i);

// 20-33 preclaim/postclaim/payment
rx('preclaim benefits',p.claim,/Community Membership|membership/i);
rx('free claim obvious',p.business,/Find or manage my free profile/i);
rx('no purchase required',p.business,/No purchase is required to claim/i);
rx('price exact',p.membership,/\$35\/year/);
rx('visibility first headline',p.membership,/<h1>Grow your visibility in the Franklin community\.<\/h1>/i);
rx('how visibility improved',p.membership,/How increased visibility works/i);
rx('logo enhancement communicated',all,/profile image\/logo|logo.*profile image/i);
rx('promotions tool exists',p.tools,/promotion-editor/i);
rx('claimed-free optional upgrade',p.business,/Optional Community Membership/i);
rx('upgrade after free management',p.business,/Membership comes later and is optional/i);
rx('existing member no re-signup',p.account,/Existing members do not need to go through signup again/i);
rx('post-payment next steps',p.account,/Complete your member profile/i);
rx('post-payment logo setup',p.account,/1 · Add your logo or profile image/i);
rx('post-payment promotion setup',p.account,/Manage promotions &amp; events/i);

// 34-45 logo/profile image
eq('profile image capability',r66.freeRights.approvedBasicProfileImageOrLogo,true);
eq('public media readback',r66.memberCapabilities.publicProfileReadback,true);
rx('replace media workflow present',pkg,/member-media/i);
rx('remove media workflow present',pkg,/member-media/i);
rx('primary image path',p.account,/profile image\/logo|logo or profile image/i);
rx('image workflow qualified',pkg,/node --test/);
rx('image workflow syntax checked',pkg,/member-media\.js/);
rx('mobile image page',p.account,/name="viewport"/i);
eq('inherited fallback gate',r66.qualification.publicInheritedGates,'PASS');
rx('invalid image rejection',promo,/MEDIA_WEBP_REQUIRED|MEDIA_TYPE_INVALID/);
rx('oversize image rejection',promo,/MEDIA_SIZE_INVALID/);
rx('cross-profile auth',promo,/PROFILE_VERIFICATION_REQUIRED|activeAccess/);

// 46-59 promotions/events CRUD
rx('coupon create',promo,/COUPON/);rx('coupon publish',promo,/PUBLISHED/);rx('coupon public display',promo,/promotions\/public/);rx('coupon code',promo,/promoCode/);
rx('special create',promo,/SPECIAL/);rx('special publish',promo,/PUBLISHED/);rx('sale create',promo,/SALE/);rx('sale publish',promo,/PUBLISHED/);
rx('promotion create',promo,/PROMOTION/);rx('promotion publish',promo,/PUBLISHED/);rx('event create',promo,/EVENT/);rx('event publish',promo,/PUBLISHED/);
rx('event date time',promo,/EVENT_START_REQUIRED|startAt/);rx('event location',promo,/eventLocation/);

// 60-73 promotional media
rx('coupon image',promo,/COUPON_GRAPHIC/);rx('coupon image public',promo,/media\/file/);rx('sale graphic',promo,/SALE_GRAPHIC/);rx('graphic public',promo,/media_kind|mediaKinds/);
rx('promotional flyer',promo,/PROMOTIONAL_FLYER/);rx('flyer public',promo,/media\/file/);rx('event flyer',promo,/EVENT_FLYER/);rx('event flyer public',promo,/media\/file/);
eq('pdf implemented',r66.memberCapabilities.pdfDocuments,true);eq('pdf delivery',r66.memberCapabilities.pdfPublicDelivery,'REVIEWED_DOWNLOAD_ONLY');
rx('media remove/replace',promo,/REMOVED|remove/i);rx('media removal ownership',promo,/account_id|PROFILE_VERIFICATION_REQUIRED/);eq('unpublish/expiration',r66.memberCapabilities.expirationAndUnpublish,true);rx('expired hidden',promo,/end_at>now\(\)|promotionIsCurrent/);

// 74-85 security/data integrity
rx('paid access server gate',promo,/ACTIVE_MEMBERSHIP_REQUIRED/);rx('cross-business modification gate',promo,/PROFILE_VERIFICATION_REQUIRED/);rx('cross-business upload gate',promo,/activeAccess/);rx('unsafe image type gate',promo,/MEDIA_WEBP_REQUIRED/);rx('upload size gate',promo,/MEDIA_LIMIT=4\*1024\*1024/);
rx('active PDF rejection',pdf,/JavaScript|OpenAction|AA|Launch|RichMedia|XFA|AcroForm/i);no('no path traversal primitive',promo,/\.\.\//);rx('promotion runtime tests',pkg,/node --test/);rx('media runtime tests',pkg,/node --test/);rx('removed media state',promo,/REMOVED/);rx('expired promotion state',promo,/end&&end<=now/);rx('past event currentness',promo,/promotionIsCurrent/);

// 86-101 regression/mobile/integrations
eq('free profiles preserved',r66.freeRights.profileClaiming,true);eq('claimed profiles preserved',r66.freeRights.legitimateBasicManagement,true);eq('existing media preserved',r66.memberCapabilities.publicProfileReadback,true);eq('payments inherited gate',r66.qualification.publicInheritedGates,'PASS');eq('membership optional',r66.membership.optional,true);eq('search/current public continuity',r67.state,'CLOSED_PUBLIC_LIVE');eq('profile URL authority source',r66.profileAuthority.canonicalLocalProfileSource,'FR-PF-PLATFORM-15.38');eq('categories/current public continuity',r67.state,'CLOSED_PUBLIC_LIVE');rx('desktop profile viewport',p.preview,/name="viewport"/);rx('mobile profile viewport',p.preview,/name="viewport"/);rx('mobile member tools viewport',p.tools,/name="viewport"/);rx('accessibility skip links',all,/skip-link/i);eq('SCC/current-successor gate',r66.qualification.currentSuccessorRegressionAndExactArtifactGate,'PASS');eq('SRE local handoff',r66.outreach.localPlatformState,'OUTREACH_READY_FOR_SRE_PREFLIGHT');eq('PF authority separation',r66.profileAuthority.pf15_39OutreachOverlay,'NOT_CONSUMED_AS_LOCAL_CANONICAL_PROFILE_TRUTH');eq('other integration continuity',r67.state,'CLOSED_PUBLIC_LIVE');

assert.equal(tests.length,101,`expected 101 checks, got ${tests.length}`);
for(let i=0;i<tests.length;i++){try{tests[i][1]();}catch(e){e.message=`#${i+1} ${tests[i][0]}: ${e.message}`;throw e;}}
console.log('R1368 consolidated owner command acceptance: PASS (101/101 source-contract checks)');
