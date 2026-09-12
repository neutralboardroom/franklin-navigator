from pathlib import Path
import json, re, shutil, hashlib

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
EVID=ROOT/'evidence'/'hf311'/'historical_public_asset_archive'
EVID.mkdir(parents=True,exist_ok=True)

BASE_RELEASE='FR-NAV1.29.0-HF3.10'
RELEASE='FR-NAV1.30.0-HF3.11'
BASE_COMMIT='fc7e380c8f4f05e3d73ee4883df638e6dd234aa6'
BASE_ARCHIVE_SHA256='f924101085a7516de78c0354c031b84da033776098826309e035e1bfe77c0762'
OWNER_COMMAND_SHA256='6e0c85a4c79dc3b53a43988a55741f8779ca057db1c21b611d934b7601de16e2'
LI33_SHA256='cc9ab4fabf60ff26443e797b43bd7df78dac1f4e11ae3ad3df8adc043e81c6fe'
PF1522_SHA256='517a6948078b902bfbb1d7b5c97e46a068abf209ca5bdb8765b42138aea7463d'
SCCR16_SHA256='b1ef9af361df5b478fb0a33cb2b3b2053592ece2d9b12331d79bf55b90138646'

prod=json.loads((ROOT/'PRODUCTION_RELEASE.json').read_text())
if prod.get('release') != BASE_RELEASE:
    raise SystemExit(f'wrong base release: {prod.get("release")} != {BASE_RELEASE}')

archive_rels=[
 'dist/data/r28-community-strategy-receipt.json',
 'dist/data/r29-payment-readiness.json',
 'dist/data/r23-pricing-preview.json',
 'dist/assets/r25-membership.js',
 'dist/assets/r26-membership.js',
]
archived=[]
for rel in archive_rels:
    p=ROOT/rel
    if p.exists():
        dest=EVID/p.name
        shutil.copy2(p,dest)
        archived.append({'source':rel,'archive':dest.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size})
        p.unlink()

current_plan={
  'id':'ANNUAL','amountUsd':35,'billing':'RECURRING_ANNUAL','autoRenew':True,
  'renewal':'UNTIL_CANCELED','label':'Franklin Navigator Community Membership','publicCheckoutAvailable':True
}
pricing={
  'schemaVersion':'franklin.public-membership-pricing.v8.single-annual.v1','release':RELEASE,
  'community':'FRANKLIN_TN','currency':'USD','freePresenceUsd':0,
  'factualCorrectionsFree':True,'publicProfileRemovalFree':True,
  'publicCheckoutOpen':True,'newPublicPaidEnrollmentOpen':True,
  'paidEntitlementsActive':True,'existingPaidMembershipActive':True,
  'paidChoices':[current_plan],
  'historicalPlanRecognition':'INTERNAL_ONLY_FOR_EXISTING_MEMBER_SERVICING',
  'retiredPlansAvailableForNewSale':False,'noPayToRank':True,'noGuaranteedOutcomes':True,
  'status':'PUBLIC_SINGLE_ANNUAL_35_ONLY'
}
(DIST/'data/membership-pricing.json').write_text(json.dumps(pricing,indent=2,sort_keys=True)+'\n')
compat={
  'schemaVersion':'franklin.community-membership.compatibility-pointer.v2','release':RELEASE,'community':'FRANKLIN_TN',
  'canonicalCatalog':'/data/membership-checkout-catalog.json','canonicalPricing':'/data/membership-pricing.json',
  'publicCheckoutOpen':True,'publicChoices':[current_plan],'publicCta':'PREVIEW_MEMBER_PROFILE',
  'retiredPlans':{'publiclySuppressed':True,'newSaleEligible':False,'historicalServicingInternalOnly':True},
  'boundaries':['FREE_FACTUAL_CORRECTIONS','FREE_PUBLIC_PROFILE_REMOVAL','NO_PAY_TO_RANK','NO_ENDORSEMENT','NO_GUARANTEED_RESULTS'],
  'status':'CURRENT_SINGLE_ANNUAL_COMPATIBILITY_POINTER'
}
(DIST/'data/community-membership-v4.json').write_text(json.dumps(compat,indent=2,sort_keys=True)+'\n')
offer={
  'schemaVersion':'franklin.public-offer.hf311.single-annual.v1','release':RELEASE,
  'community':'FRANKLIN_TN','masterBrand':'Franklin Navigator','assistantBrand':'Franklin Assistant',
  'freePresence':{'priceUsd':0,'factualCorrectionsFree':True,'publicProfileRemovalFree':True},
  'paidChoices':[{'id':'ANNUAL','priceUsd':35,'billing':'RECURRING_ANNUAL','featured':True,'autoRenew':True,'renewal':'UNTIL_CANCELED'}],
  'publicCheckoutOpen':True,'retiredPlansAvailableForNewSale':False,
  'historicalPlanRecognition':'INTERNAL_ONLY_FOR_EXISTING_MEMBER_SERVICING',
  'noPayToRank':True,'noGuaranteedOutcomes':True,'status':'CURRENT_SINGLE_ANNUAL_35_ONLY'
}
(DIST/'data/r29-v6-public-offer.json').write_text(json.dumps(offer,indent=2,sort_keys=True)+'\n')

r28=DIST/'assets/r28-community.js'
text=r28.read_text()
text=re.sub(r"const plans=\{.*?\n  \};", "const plans={annual:{label:'Franklin Navigator Community Membership',price:35,billing:'per year',renewal:'renews annually until canceled',autoRenew:true,termMonths:12}};", text, flags=re.S)
text=re.sub(r"const selectedPlan=form=>.*?;", "const selectedPlan=()=>plans.annual;", text)
r28.write_text(text)

support=DIST/'member-support/index.html'
s=support.read_text()
s=s.replace('<strong>Membership terms</strong><ul class="check-list"><li>Franklin Navigator Community Membership — $35/year. Renews annually until canceled.</li><li>Franklin Navigator Community Membership — $35/year. Renews annually until canceled.</li><li>Franklin Navigator Community Membership — $35/year. Renews annually until canceled.</li></ul>', '<strong>Current membership</strong><ul class="check-list"><li>Franklin Navigator Community Membership — $35/year. Renews annually until canceled.</li><li>Retired plans are not available for new enrollment.</li></ul>')
s=s.replace('Monthly and annual members can use secure billing tools to manage payment methods, view billing information and cancel future renewals.', 'Existing members can use secure billing tools to manage payment methods, view billing information and cancel future renewals. Retired billing terms are serviced only for existing legacy accounts and are not new-sale options.')
s=s.replace('<h2>Existing historical memberships</h2><p>The prepaid 36-month term does not automatically renew. Franklin Navigator is designed to provide 60-, 30- and 7-day expiration reminders and require a fresh affirmative renewal choice.</p>', '<h2>Existing legacy memberships</h2><p>Some existing accounts may have historical billing terms. Support can service those accounts without creating a duplicate membership. New enrollment uses only the current $35/year Community Membership.</p>')
support.write_text(s)

retired_markers=[
 '$5/mes','$50/año','$5/month','$50/year','$120','once for three years','36 prepaid months',
 'charter membership','monthly and annual memberships renew','prepaid for 36 months','one-time 36-month',
 'community or charter membership','community membership and charter membership'
]
def stale(v):
    z=str(v).lower()
    return any(m.lower() in z for m in retired_markers)

enp=DIST/'data/r37-en-public-strings.json'
if enp.exists():
    d=json.loads(enp.read_text())
    d['strings']=[x for x in d.get('strings',[]) if not stale(x.get('en',''))]
    d['count']=len(d['strings']); d['hf311RetiredMembershipOfferScrub']=True
    enp.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
esp=DIST/'data/r37-es-public-strings.json'
if esp.exists():
    d=json.loads(esp.read_text()); trans=d.get('translations',{})
    d['translations']={k:v for k,v in trans.items() if not stale(k) and not stale(v)}
    d['count']=len(d['translations']); d['hf311RetiredMembershipOfferScrub']=True
    esp.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')

prod.update({'release':RELEASE,'date':'2026-09-12','base':BASE_RELEASE,'scope':'Commercial-truth hardening: remove retired public membership offers from all current sale-facing assets/catalogs/translations while preserving internal historical servicing; upstream handoff reconciliation continues.'})
(ROOT/'PRODUCTION_RELEASE.json').write_text(json.dumps(prod,indent=2)+'\n')

(ROOT/'NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_30_0_HF311.md').write_text('''# Next Version Improvement List — FR-NAV1.30.0-HF3.11\n\n1. Continue owner laptop/mobile review after deployment; any retired-plan display is P0 and must fail closed.\n2. Complete PF15.22 profile migration only after every predecessor-only profile has an explicit no-loss disposition.\n3. Integrate LI33 consumer-safe records only through route-specific currentness and product tests; keep blocked point-of-use alert state quarantined.\n4. Continue verified profile-link enrichment from accepted Profile Factory handoffs.\n5. Keep the single new-sale Community Membership at $35/year unless a newer explicit owner-authorized commercial contract supersedes it.\n6. Preserve historical-plan recognition only for existing-member servicing; never render retired plans as new-sale choices.\n7. Continue accessibility, mobile, currentness, SEO, performance and no-loss regression checks.\n''')

receipt={
 'schemaVersion':'franklin.hf311.commercial-truth-receipt.v1','release':RELEASE,'base':BASE_RELEASE,
 'baseCommit':BASE_COMMIT,'baseExactSourceArchiveSha256':BASE_ARCHIVE_SHA256,'ownerCommandSha256':OWNER_COMMAND_SHA256,
 'upstreamEvidence':{'sccR16Sha256':SCCR16_SHA256,'profileFactory15_22Sha256':PF1522_SHA256,'localInvestigator33Sha256':LI33_SHA256},
 'currentNewSalePlan':{'amountUsd':35,'billing':'RECURRING_ANNUAL','renewal':'UNTIL_CANCELED'},
 'retiredNewSalePlansRemovedFromPublicPresentation':True,'historicalExistingMemberServicingPreserved':True,
 'archivedFormerPublicAssets':archived,'homepagePreviewRoute':'/member-profile-preview/','homepagePreviewExpectedPlan':'$35/year only',
 'publicCatalogs':['dist/data/membership-checkout-catalog.json','dist/data/membership-pricing.json','dist/data/community-membership-v4.json','dist/data/r29-v6-public-offer.json'],
 'profileFactory15_22ConsumerDisposition':'DEFER_WITH_CAUSE_NO_LOSS_PROFILE_ID_RECONCILIATION_REQUIRED_BEFORE_IMPORT',
 'localInvestigator33ConsumerDisposition':'DEFER_WITH_CAUSE_ROUTE_SPECIFIC_CURRENTNESS_AND_PUBLICATION_MAPPING_REQUIRED',
 'smarterJusticeDonor':'NOT_USED','status':'BUILT_PENDING_QUALIFICATION'
}
(ROOT/'HF311_COMMERCIAL_TRUTH_RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n')
