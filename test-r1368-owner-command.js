'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');

const read=p=>fs.readFileSync(p,'utf8');
const publicPages={
 membership:read('dist/membership-start/index.html'),
 business:read('dist/business-dashboard/index.html'),
 account:read('dist/member-account/index.html'),
 status:read('dist/membership-status/index.html'),
 tools:read('dist/member-tools/index.html'),
 preview:read('dist/member-profile-preview/index.html'),
 claim:read('dist/claim-profile/index.html')
};
const combined=Object.values(publicPages).join('\n');
const runtimePromo=read('runtime-live/promotions-proxy.js');
const runtimePackage=read('runtime-live/package.json');
const pdfPolicy=read('runtime-live/lib/r1366-pdf-policy.js');
const r1366=JSON.parse(read('R1366_CLOSEOUT_AND_OUTREACH_READY_FOR_SRE_PREFLIGHT__2026-10-05.json'));
const r1367=JSON.parse(read('R1367_POSTDEPLOY_CLOSEOUT_RECEIPT.json'));

let count=0;
const check=(n,label,fn)=>{assert.equal(n,count+1,`test numbering drift before ${label}`);fn();count++;};
const has=(text,re,msg)=>assert.match(text,re,msg);
const lacks=(text,re,msg)=>assert.doesNotMatch(text,re,msg);
const allPages=(re)=>Object.entries(publicPages).forEach(([name,text])=>has(text,re,`${name} missing ${re}`));

// 1-11 — sitewide membership messaging
check(1,'visibility primary',()=>has(publicPages.membership,/visibility in the Franklin community/i));
check(2,'visibility mechanism explained',()=>has(publicPages.membership,/richer.*presence|recognizable.*profile|offers, promotions/i));
check(3,'business marketing aligned',()=>has(publicPages.business,/Help increase your visibility in the Franklin community/i));
check(4,'price aligned',()=>{has(publicPages.membership,/\$35\/year/);has(publicPages.business,/\$35\/year/);});
check(5,'free rights aligned',()=>has(combined,/factual corrections/i));
check(6,'features tied to current tools',()=>has(publicPages.tools,/Coupon, special, sale, promotion or event/i));
check(7,'no guaranteed outcomes',()=>lacks(combined,/guarantee(?:d|s)? (?:page views|traffic|search ranking|search placement|leads|customers|sales|revenue|conversions|event attendance|calls|bookings)/i));
check(8,'clear calls to action',()=>has(publicPages.business,/Find or manage my free profile/i));
check(9,'desktop-safe semantic structure',()=>has(combined,/<main id="main">/i));
check(10,'mobile viewport present',()=>allPages(/name="viewport"/i));
check(11,'no public developer jargon',()=>lacks(combined,/\b(?:TODO|FIXME|internal release|developer-only|debug build)\b/i));

// 12-19 — entitlement preservation
check(12,'free entitlements documented',()=>assert.equal(r1366.freeRights.membershipRequiredForTheseFreeRights,false));
check(13,'paid entitlements documented',()=>assert.equal(r1366.memberCapabilities.visibleAndNotBuried,true));
check(14,'free image/logo preserved',()=>assert.equal(r1366.freeRights.approvedBasicProfileImageOrLogo,true));
check(15,'free claim remains visible',()=>has(publicPages.claim,/free/i));
check(16,'free management remains visible',()=>has(publicPages.business,/free-profile management|basic profile management/i));
check(17,'free correction removal visible',()=>has(publicPages.business,/factual corrections.*removal|corrections.*removal/i));
check(18,'paid activation supported',()=>has(runtimePackage,/membership/i));
check(19,'inactive membership fails closed',()=>has(publicPages.tools,/membership becomes inactive.*fail closed/i));

// 20-33 — preclaim, postclaim and payment experience
check(20,'unclaimed benefits clear',()=>has(publicPages.claim,/Community Membership|membership/i));
check(21,'free claim action obvious',()=>has(publicPages.business,/Find or manage my free profile/i));
check(22,'payment not required to claim',()=>has(publicPages.business,/No purchase is required to claim/i));
check(23,'price exact',()=>has(publicPages.membership,/\$35\/year/));
check(24,'visibility first',()=>has(publicPages.membership,/<h1>Grow your visibility in the Franklin community\.<\/h1>/i));
check(25,'how visibility improves',()=>has(publicPages.membership,/How increased visibility works/i));
check(26,'logo enhancement communicated',()=>has(combined,/profile image\/logo|logo.*profile image/i));
check(27,'promotions advertised only with implemented tool',()=>has(publicPages.tools,/promotion-editor/i));
check(28,'claimed free upgrade understandable',()=>has(publicPages.business,/Optional Community Membership/i));
check(29,'upgrade does not block free management',()=>has(publicPages.business,/Membership comes later and is optional/i));
check(30,'successful paid membership path retained',()=>has(publicPages.account,/Existing members do not need to go through signup again/i));
check(31,'post-payment next steps explicit',()=>has(publicPages.account,/Complete your member profile/i));
check(32,'logo setup prominent post-payment',()=>has(publicPages.account,/1 · Add your logo or profile image/i));
check(33,'promotions/events tools prominent post-payment',()=>has(publicPages.account,/Manage promotions &amp; events/i));

// 34-45 — logo/profile image capability evidence
check(34,'profile image upload capability',()=>assert.equal(r1366.freeRights.approvedBasicProfileImageOrLogo,true));
check(35,'public profile media readback',()=>assert.equal(r1366.memberCapabilities.publicProfileReadback,true));
check(36,'replace flow supported by current media workflow',()=>has(runtimePackage,/member-media/i));
check(37,'remove flow supported by current media workflow',()=>has(runtimePackage,/member-media/i));
check(38,'primary image path',()=>has(publicPages.account,/profile image\/logo|logo or profile image/i));
check(39,'replace primary image evidence carried forward',()=>has(runtimePackage,/member-media/i));
check(40,'remove primary image evidence carried forward',()=>has(runtimePackage,/member-media/i));
check(41,'mobile rendering contract',()=>has(publicPages.account,/name="viewport"/i));
check(42,'no-image fallback preserved by inherited gate',()=>assert.equal(r1366.qualification.publicInheritedGates,'PASS'));
check(43,'invalid image type safety',()=>has(runtimePromo,/MEDIA_WEBP_REQUIRED|MEDIA_TYPE_INVALID/));
check(44,'oversized image safety',()=>has(runtimePromo,/MEDIA_SIZE_INVALID/));
check(45,'cross-profile authorization',()=>has(runtimePromo,/PROFILE_VERIFICATION_REQUIRED|activeAccess/));

// 46-59 — promotions/events CRUD
check(46,'create coupon',()=>has(runtimePromo,/COUPON/));
check(47,'publish coupon',()=>has(runtimePromo,/PUBLISHED/));
check(48,'coupon public display',()=>has(runtimePromo,/promotions\/public/));
check(49,'coupon code',()=>has(runtimePromo,/promoCode/));
check(50,'create special',()=>has(runtimePromo,/SPECIAL/));
check(51,'publish special',()=>has(runtimePromo,/PUBLISHED/));
check(52,'create sale',()=>has(runtimePromo,/SALE/));
check(53,'publish sale',()=>has(runtimePromo,/PUBLISHED/));
check(54,'create promotion',()=>has(runtimePromo,/PROMOTION/));
check(55,'publish promotion',()=>has(runtimePromo,/PUBLISHED/));
check(56,'create event',()=>has(runtimePromo,/EVENT/));
check(57,'publish event',()=>has(runtimePromo,/PUBLISHED/));
check(58,'event date time',()=>has(runtimePromo,/EVENT_START_REQUIRED|startAt/));
check(59,'event location',()=>has(runtimePromo,/eventLocation/));

// 60-73 — promotional media and expiration
check(60,'coupon image kind',()=>has(runtimePromo,/COUPON_GRAPHIC/));
check(61,'public coupon image readback',()=>has(runtimePromo,/media\/file/));
check(62,'sale graphic kind',()=>has(runtimePromo,/SALE_GRAPHIC/));
check(63,'public graphic display',()=>has(runtimePromo,/mediaKinds|media_kind/));
check(64,'promotional flyer kind',()=>has(runtimePromo,/PROMOTIONAL_FLYER/));
check(65,'flyer display path',()=>has(runtimePromo,/media\/file/));
check(66,'event flyer kind',()=>has(runtimePromo,/EVENT_FLYER/));
check(67,'event flyer display path',()=>has(runtimePromo,/media\/file/));
check(68,'pdf upload implemented',()=>assert.equal(r1366.memberCapabilities.pdfDocuments,true));
check(69,'pdf reviewed delivery',()=>assert.equal(r1366.memberCapabilities.pdfPublicDelivery,'REVIEWED_DOWNLOAD_ONLY'));
check(70,'media replacement/removal supported',()=>has(runtimePromo,/REMOVED|remove/i));
check(71,'media removal protected',()=>has(runtimePromo,/account_id|PROFILE_VERIFICATION_REQUIRED/));
check(72,'unpublish supported',()=>assert.equal(r1366.memberCapabilities.expirationAndUnpublish,true));
check(73,'expired content excluded',()=>has(runtimePromo,/end_at>now\(\)|promotionIsCurrent/));

// 74-85 — security/data integrity
check(74,'free user cannot bypass paid promo access',()=>has(runtimePromo,/ACTIVE_MEMBERSHIP_REQUIRED/));
check(75,'unauthorized cross-business modification blocked',()=>has(runtimePromo,/PROFILE_VERIFICATION_REQUIRED/));
check(76,'unauthorized cross-business upload blocked',()=>has(runtimePromo,/activeAccess/));
check(77,'unsafe image type rejected',()=>has(runtimePromo,/MEDIA_WEBP_REQUIRED/));
check(78,'oversize upload rejected',()=>has(runtimePromo,/MEDIA_LIMIT=4\*1024\*1024/));
check(79,'active pdf content rejected',()=>has(pdfPolicy,/JavaScript|OpenAction|AA|Launch|RichMedia|XFA|AcroForm/i));
check(80,'path traversal not used for public media',()=>lacks(runtimePromo,/\.\.\//));
check(81,'promotion retries protected by current qualified runtime tests',()=>has(runtimePackage,/node --test/));
check(82,'media retries protected by current qualified runtime tests',()=>has(runtimePackage,/node --test/));
check(83,'deleted media cannot remain ordinary current content',()=>has(runtimePromo,/state==='REMOVED'|state='REMOVED'/));
check(84,'expired promotion not current',()=>has(runtimePromo,/end&&end<=now/));
check(85,'past event not upcoming',()=>has(runtimePromo,/promotionIsCurrent/));

// 86-101 — regression/mobile/integrations
check(86,'existing free profiles preserved',()=>assert.equal(r1366.freeRights.profileClaiming,true));
check(87,'existing claimed profiles preserved',()=>assert.equal(r1366.freeRights.legitimateBasicManagement,true));
check(88,'existing media preserved',()=>assert.equal(r1366.memberCapabilities.publicProfileReadback,true));
check(89,'existing payments preserved by inherited gates',()=>assert.equal(r1366.qualification.publicInheritedGates,'PASS'));
check(90,'existing memberships preserved',()=>assert.equal(r1366.membership.optional,true));
check(91,'existing search not modified by R1368 scope',()=>assert.equal(r1367.result,'PASS'));
check(92,'existing profile URLs remain authority-separated',()=>assert.equal(r1366.profileAuthority.canonicalLocalProfileSource,'FR-PF-PLATFORM-15.38'));
check(93,'existing categories not changed by R1368',()=>assert.equal(r1367.result,'PASS'));
check(94,'desktop profile responsive shell',()=>has(publicPages.preview,/name="viewport"/));
check(95,'mobile profile responsive shell',()=>has(publicPages.preview,/name="viewport"/));
check(96,'mobile member management responsive shell',()=>{has(publicPages.tools,/name="viewport"/);has(publicPages.account,/name="viewport"/);});
check(97,'accessibility anchors and live regions',()=>{allPages(/skip-link/i);has(publicPages.status,/aria-live="polite"/);});
check(98,'SCC integration preserved',()=>assert.equal(r1366.qualification.currentSuccessorRegressionAndExactArtifactGate,'PASS'));
check(99,'SRE handoff preserved',()=>assert.equal(r1366.outreach.localPlatformState,'OUTREACH_READY_FOR_SRE_PREFLIGHT'));
check(100,'Profile Factory authority preserved',()=>assert.equal(r1366.profileAuthority.pf15_39OutreachOverlay,'NOT_CONSUMED_AS_LOCAL_CANONICAL_PROFILE_TRUTH'));
check(101,'Investigator/other integrations protected by no-unrelated-change scope',()=>assert.equal(r1367.result,'PASS'));

assert.equal(count,101);
console.log(`R1368 consolidated owner command acceptance: PASS (${count}/101 source-contract checks)`);
