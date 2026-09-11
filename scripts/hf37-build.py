#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
from difflib import SequenceMatcher
import json,re,hashlib

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
RELEASE='FR-NAV1.26.0-HF3.7'
BASE='FR-NAV1.25.0-HF3.6'
CSS='/assets/hf37.css?v=frnav1260'
JS='/assets/hf37.js?v=frnav1260'


def write_once(path, marker, addition):
    text=path.read_text(encoding='utf-8')
    if marker not in text:
        text=text.rstrip()+"\n\n"+addition.rstrip()+"\n"
        path.write_text(text,encoding='utf-8')


def release_page(path, body_class, add_js=True):
    text=path.read_text(encoding='utf-8')
    text=re.sub(r'(<meta content=")[^"]+(" name="franklin-release"/>)',rf'\g<1>{RELEASE}\2',text,count=1)
    if 'name="franklin-release"' not in text:
        text=text.replace('</head>',f'<meta content="{RELEASE}" name="franklin-release"/></head>',1)
    if CSS not in text:
        text=text.replace('</head>',f'<link href="{CSS}" rel="stylesheet"/></head>',1)
    if body_class and body_class not in text:
        text=text.replace('<body class="','<body class="'+body_class+' ',1)
    if add_js and JS not in text:
        text=text.replace('</body>',f'<script defer="" src="{JS}"></script></body>',1)
    path.write_text(text,encoding='utf-8')


def replace_main(path, html, body_class, add_js=True):
    text=path.read_text(encoding='utf-8')
    if not re.search(r'<main\b[^>]*>.*?</main>',text,re.S):
        raise RuntimeError(f'main not found: {path}')
    text=re.sub(r'<main\b[^>]*>.*?</main>',html,text,count=1,flags=re.S)
    path.write_text(text,encoding='utf-8')
    release_page(path,body_class,add_js)


# ---------------------------------------------------------------------
# 1) Site-wide header repair WITHOUT rewriting every HTML file.
#    styles.css fixes visual order; app.js fixes DOM/tab order at runtime.
# ---------------------------------------------------------------------
write_once(DIST/'assets/styles.css','HF3.7 SITEWIDE HEADER ORDER',r'''
/* HF3.7 SITEWIDE HEADER ORDER — brand left, primary navigation next, language right. */
header .wrap.top{display:flex!important;align-items:center!important;gap:18px!important}
header .wrap.top>a.brand{order:1!important;margin:0!important;flex:0 0 auto!important}
header .wrap.top>nav.nav{order:2!important;margin-left:auto!important;flex:0 1 auto!important}
header .wrap.top>.r37-language-switch{order:3!important;margin-left:10px!important;flex:0 0 auto!important;position:static!important}
@media(max-width:900px){header .wrap.top{flex-wrap:wrap!important}header .wrap.top>a.brand{order:1!important}header .wrap.top>.r37-language-switch{order:2!important;margin-left:auto!important}header .wrap.top>nav.nav{order:3!important;width:100%!important;margin-left:0!important}}
''')
write_once(DIST/'assets/app.js','HF3.7 shell DOM order',r'''
/* HF3.7 shell DOM order: visual order and keyboard order match. */
(()=>{const fix=()=>{document.querySelectorAll('header .wrap.top').forEach(top=>{if(top.dataset.hf37Shell==='1')return;const brand=top.querySelector(':scope > a.brand'),nav=top.querySelector(':scope > nav.nav'),lang=top.querySelector(':scope > .r37-language-switch');if(brand)top.insertBefore(brand,top.firstChild);if(nav){if(lang)top.insertBefore(nav,lang);else top.append(nav)}if(lang)top.append(lang);top.dataset.hf37Shell='1'})};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix,{once:true});else fix()})();
''')


# ---------------------------------------------------------------------
# 2) Membership sales page: short, concrete, no internal status language.
# ---------------------------------------------------------------------
membership_main=r'''<main id="main">
<section class="r29-hero hf37-sales-hero"><div class="wrap r29-hero-grid"><div><div class="eyebrow">Franklin Navigator Community Membership</div><h1>Grow your Franklin presence.</h1><p class="r29-lead">Your basic public profile, factual corrections and removal requests remain free. Community Membership adds a fuller profile and practical local business tools.</p><div class="actions"><a class="button primary" href="/member-profile-preview/">Preview my member profile</a><a class="button" href="/claim-profile/">Find or manage my profile</a></div></div><aside class="hf37-quick-value"><strong>$35/year</strong><span>One optional annual Community Membership</span></aside></div></section>
<section class="section"><div class="wrap"><div class="eyebrow">What membership adds</div><h2>A fuller profile that keeps the focus on your organization.</h2><div class="grid four hf37-benefit-grid"><article class="r29-panel"><h3>Richer profile</h3><p>Add reviewed About text, services, hours, accessibility, language and other qualified business details.</p></article><article class="r29-panel"><h3>More ways to reach you</h3><p>Show verified website, phone, email, booking and other qualified action links when supplied.</p></article><article class="r29-panel"><h3>Photos & local participation</h3><p>Add qualified images, offers, events and community-participation information where supported.</p></article><article class="r29-panel"><h3>No Similar local profiles</h3><p>While membership is active, your own member profile does not display the Similar local profiles section.</p></article></div></div></section>
<section class="section tint"><div class="wrap"><article class="hf37-price-card"><div class="eyebrow">Community Membership</div><h2>Franklin Navigator Community Membership</h2><p class="r29-price"><strong>$35</strong><span>per year</span></p><ul class="check-list"><li>Renews annually until canceled</li><li>Secure billing through Stripe</li><li>Richer reviewed member-profile capabilities</li><li>No Similar local profiles section on your active member profile</li></ul><div class="actions"><a class="button primary" href="/member-profile-preview/">Preview my member profile</a><a class="button" href="/claim-profile/">Start with my profile</a></div></article><div class="hf37-trust-note"><strong>Always free:</strong> public-profile review, factual corrections and public-profile removal requests. <strong>Membership does not change:</strong> factual accuracy, ordinary Directory ranking, credentials, endorsement or guaranteed results.</div></div></section>
<section class="section hf37-small-tools"><div class="wrap"><details><summary>See membership boundaries and profile information</summary><div><p>Membership supports richer reviewed profile content and local participation tools. It does not buy ranking, endorsement, leads, customers, sales or guaranteed results. Contact details and other changing information should be confirmed at the current official source.</p></div></details></div></section>
</main>'''
replace_main(DIST/'membership-start/index.html',membership_main,'hf37-membership-start',False)


# ---------------------------------------------------------------------
# 3) Member profile preview: actual value preview, sticky desktop panel.
# ---------------------------------------------------------------------
preview_main=r'''<main id="main">
<section class="r29-hero hf37-preview-hero"><div class="wrap"><div class="eyebrow">Your Franklin profile</div><h1>See what your Community Member profile can become.</h1><p class="r29-lead">Start with your existing profile when possible. Corrections and removal stay free; Community Membership is optional.</p><div class="actions"><a class="button primary" href="/claim-profile/">Find my profile</a><a class="button" href="/profile-request/">I don't see my business</a></div></div></section>
<section class="section tint hf37-compare-section"><div class="wrap"><div class="eyebrow">See the difference before you decide</div><div class="hf35-profile-comparison"><article class="hf35-compare-card"><h2>Free public profile</h2><p>Core public facts, verified public contact links, free corrections and removal. Similar local profiles may appear.</p></article><article class="hf35-compare-card"><h2>Community Member profile</h2><p>Richer reviewed content, qualified images and action links, plus no Similar local profiles section while membership is active.</p></article></div></div></section>
<section class="section hf37-preview-workspace"><div class="wrap hf37-preview-layout"><form class="r29-panel hf37-preview-form" data-r28-preview-form=""><div class="eyebrow">Build a sample preview</div><h2>Use public business information</h2><label>Organization or business name<input autocomplete="organization" name="name" placeholder="Your organization"/></label><label>Actual city or service area<input name="city" placeholder="Franklin, Brentwood, Spring Hill…"/><span class="hf32-field-help">Use the business's actual physical city or accurate service area.</span></label><label>Category<input name="category" placeholder="Restaurant, nonprofit, attorney, home service…"/></label><div class="hf37-form-two"><label>Public phone<input autocomplete="tel" name="phone" placeholder="(615) 555-0123"/></label><label>Public email<input autocomplete="email" name="email" placeholder="hello@example.com"/></label></div><label>Official website<input autocomplete="url" name="website" placeholder="https://example.com"/></label><label>About<textarea name="about" placeholder="Describe how you serve or participate in the Franklin community." rows="4"></textarea></label><label>Services or participation areas<input name="services" placeholder="Haircuts, catering, tax preparation, community events…"/></label><div class="hf37-form-two"><label>Hours<input name="hours" placeholder="Mon–Fri 9–5"/></label><label>Languages / accessibility<input name="languages" placeholder="Spanish available; step-free entrance…"/></label></div><label>Official online presence<input name="online" placeholder="LinkedIn, Instagram or other official public URLs"/></label><label class="hf37-check"><input name="photos" type="checkbox" value="yes"/> I have qualified public photos or a gallery to add after review.</label><p class="fine-print">Do not enter customer, patient, client, account, payment, medical, legal-case or other confidential information.</p></form><aside aria-live="polite" class="r28-preview-card hf37-member-preview" data-r28-preview=""></aside></div></section>
<section class="section tint"><div class="wrap"><article class="hf37-price-card hf37-preview-price"><div class="eyebrow">Optional Community Membership</div><h2>Community Membership — $35/year</h2><p>Use the preview above to see the kind of richer profile presentation membership can support. Only reviewed information you actually supply or that is lawfully source-backed is published.</p><ul class="check-list"><li>Richer About, services, hours, images and qualified action links</li><li>No Similar local profiles section on your active member profile</li><li>Ordinary Directory ranking and factual accuracy do not change</li></ul><a class="button primary" href="/membership-start/">Review Community Membership — $35/year</a></article></div></section>
<section class="section hf37-free-control"><div class="wrap"><div class="hf37-trust-note"><strong>Need to correct or remove a profile?</strong> Factual corrections and removal from public view are free. Membership is not required. <a href="/corrections/">Correct or remove a profile</a>.</div><details class="hf32-policy-details"><summary>About profile information</summary><div><p>Contact details, websites, staff roles, services, hours and booking pages can change. Confirm changing details at the current official source before relying on them.</p></div></details></div></section>
</main>'''
replace_main(DIST/'member-profile-preview/index.html',preview_main,'hf37-member-profile-preview',True)


# ---------------------------------------------------------------------
# 4) Claim/manage profile: one workflow instead of repeating three times.
# ---------------------------------------------------------------------
claim_main=r'''<main id="main" data-claim-profile="">
<section class="r29-hero hf37-claim-hero"><div class="wrap"><div class="eyebrow">Free profile review · optional Community Membership</div><h1>Find or manage your Franklin profile.</h1><p class="r29-lead">Search by business, professional practice, organization, category or location. Then open the exact profile to manage it, correct facts, request removal or preview the member version.</p><form action="/directory/" class="hf37-profile-search" method="get"><label for="hf37-profile-q">Business, professional or organization</label><div><input id="hf37-profile-q" maxlength="160" name="q" placeholder="Name, category or place" type="search"/><button class="button primary" type="submit">Search profiles</button></div></form><p class="hf37-missing-profile">Can't find it? <a href="/profile-request/">Request a free basic public profile</a>.</p></div></section>
<section class="section"><div class="wrap"><h2>After you find the right profile</h2><div class="grid four hf37-claim-actions"><article class="r22-card"><h3>Manage or claim it</h3><p>Confirm that you represent the profile before member-provided content can be managed.</p></article><article class="r22-card"><h3>Correct information</h3><p>Anyone can suggest factual corrections for free. Claiming or membership is not required.</p></article><article class="r22-card"><h3>Request removal</h3><p>Public-profile removal requests are free and are reviewed separately from membership.</p></article><article class="r22-card"><h3>Preview membership</h3><p>See the optional richer member-profile presentation without changing ordinary Directory ranking.</p><a href="/member-profile-preview/">Preview member profile</a></article></div><div class="hf37-trust-note hf37-claim-trust"><strong>Location stays exact.</strong> New profiles use the business's actual physical location or accurate service area. Nearby organizations are not relabeled as being physically in Franklin.</div></div></section>
<section class="section tint hf37-claim-footer"><div class="wrap"><p><strong>Corrections and removal are free.</strong> Community Membership is optional and does not buy factual accuracy, ranking, endorsement or guaranteed results.</p></div></section>
</main>'''
replace_main(DIST/'claim-profile/index.html',claim_main,'hf37-claim-profile',False)


# ---------------------------------------------------------------------
# 5) Directory: resident-facing hero, factual local relevance, compact cards.
# ---------------------------------------------------------------------
dir_path=DIST/'directory/index.html'
dir_text=dir_path.read_text(encoding='utf-8')
dir_text=dir_text.replace('Search and compare 19,103 Franklin-area businesses, professionals, organizations and services.','Search Franklin-area businesses, professionals, organizations and services by name, category or place.')
dir_text=dir_text.replace('<h1>Find local businesses, services &amp; organizations.</h1><p>Search 19,103 local profiles built from public information. Filter by category, type, area, or available contact details, or compare up to three profiles.</p>','<h1>Find Local</h1><p>Search Franklin-area businesses, services, professionals and organizations by name, category or place. Franklin locations appear first by default; membership does not affect ordinary Directory ranking.</p>')
dir_path.write_text(dir_text,encoding='utf-8')
release_page(dir_path,'hf37-directory',False)

# Category display aliases + technical-source cleanup + quieter count/compare.
ld=DIST/'assets/local-discovery.js'
text=ld.read_text(encoding='utf-8')
old="const categoryText = value => window.FranklinI18n?.category?.(value) || value;"
new="""const categoryAliases = {'organization':'Organization','Religion-Related':'Community / faith organization','Non-Profit Organizations':'Nonprofit','Vitamins And Supplements':'Vitamins & supplements','Health Maintenance Organization':'Healthcare organization','investing':'Investing'};\n  const categoryText = value => window.FranklinI18n?.category?.(value) || categoryAliases[value] || value;\n  const displayLocation = row => { const raw=String(row.l||row.g||'').trim(); return raw.replace(/^Public IRS filing address geocoded in Williamson County:\\s*/i,'').replace(/^Public IRS filing address:\\s*/i,'') || tx('Location not supplied','Ubicación no indicada'); };"""
if old not in text: raise RuntimeError('categoryText pattern missing')
text=text.replace(old,new,1)
text=text.replace("const locationText = el('p', row.l || row.g || tx('Location not supplied', 'Ubicación no indicada'), 'hf36-result-location');","const locationText = el('p', displayLocation(row), 'hf36-result-location');",1)
text=text.replace("selected.has(row.i) ? tx('Selected', 'Seleccionado') : tx('Compare', 'Comparar')","selected.has(row.i) ? tx('✓ Compare', '✓ Comparar') : tx('□ Compare', '□ Comparar')",1)
old_count="count.textContent = new Intl.NumberFormat(language()).format(found.length) + tx(found.length === 1 ? ' result' : ' results', found.length === 1 ? ' resultado' : ' resultados');"
new_count="const filtered = !!(state.q || state.category || state.type || state.area || state.facts.length); count.textContent = filtered ? new Intl.NumberFormat(language()).format(found.length) + tx(found.length === 1 ? ' match' : ' matches', found.length === 1 ? ' coincidencia' : ' coincidencias') : tx('Local profiles', 'Perfiles locales');"
if old_count not in text: raise RuntimeError('directory count pattern missing')
text=text.replace(old_count,new_count,1)
ld.write_text(text,encoding='utf-8')

# Directory sorting remains payment-neutral: geography -> public contact completeness -> exact-address factual completeness -> name.
core=DIST/'assets/local-discovery-core.js'
text=core.read_text(encoding='utf-8')
old="const localRank = r => { const t = norm([r.g, r.l].join(' ')); return t.includes('franklin') ? 0 : t.includes('williamson') ? 1 : 2; };"
new="""const localRank = r => {\n      const t = norm([r.g, r.l].join(' '));\n      const geo = t.includes('franklin') ? 0 : t.includes('williamson') ? 1 : 2;\n      const contacts = Number(!!r.websiteHref) + Number(!!r.phoneHref) + Number(!!r.emailHref);\n      const sourceOnly = /^FR-IRS-/.test(r.i) && contacts === 0 ? 1 : 0;\n      return geo * 100 + sourceOnly * 18 + (3 - contacts) * 4 + (r.h ? 0 : 2);\n    };"""
if old not in text: raise RuntimeError('localRank pattern missing')
text=text.replace(old,new,1)
core.write_text(text,encoding='utf-8')


# ---------------------------------------------------------------------
# 6) Profile Factory reconciliation handoff: evidence candidates only.
#    No automatic merge and no mutation of source rows.
# ---------------------------------------------------------------------
def norm(v):
    v=str(v or '').lower()
    v=re.sub(r'public irs filing address geocoded in williamson county:\s*','',v)
    v=re.sub(r'[^a-z0-9]+',' ',v)
    return re.sub(r'\s+',' ',v).strip()

def nname(v):
    s=norm(v)
    s=re.sub(r'\b(percent|nashville|franklin|tennessee|tn|llc|inc|incorporated|corp|corporation|pc|pllc|ltd|company|co|one|two|1|2)\b',' ',s)
    return re.sub(r'\s+',' ',s).strip()

def naddr(v):
    s=norm(v)
    replacements={'north':'n','south':'s','east':'e','west':'w','avenue':'ave','street':'st','road':'rd','boulevard':'blvd','drive':'dr','lane':'ln','place':'pl'}
    for a,b in replacements.items(): s=re.sub(rf'\b{a}\b',b,s)
    s=re.sub(r'\bfranklin\b','',s);s=re.sub(r'\btn\b','',s);s=re.sub(r'\b\d{5}(?:\s\d{4})?\b','',s)
    return re.sub(r'\s+',' ',s).strip()

raw=json.loads((DIST/'data/discovery/index.json').read_text(encoding='utf-8'))
rows=[]
for a in raw['rows']:
    row={'id':a[0],'name':a[1],'location':a[2],'category':raw['categories'][a[3]],'type':raw['types'][a[4]],'area':raw['areas'][a[5]]}
    rows.append(row)
groups={}
for r in rows:
    address=naddr(r['location'])
    if address: groups.setdefault(address,[]).append(r)
candidates=[]
for address,items in groups.items():
    if len(items)<2: continue
    pairs=[]
    for i in range(len(items)):
        for j in range(i+1,len(items)):
            a,b=items[i],items[j]
            na,nb=nname(a['name']),nname(b['name'])
            if not na or not nb: continue
            ta,tb=set(na.split()),set(nb.split())
            jac=len(ta&tb)/max(1,len(ta|tb));seq=SequenceMatcher(None,na,nb).ratio()
            if jac>=0.55 or seq>=0.72 or na in nb or nb in na:
                pairs.append({'a':a['id'],'b':b['id'],'nameA':a['name'],'nameB':b['name'],'jaccard':round(jac,3),'nameSimilarity':round(seq,3)})
    if pairs:
        candidates.append({'normalizedAddress':address,'records':[{'id':x['id'],'name':x['name'],'location':x['location'],'category':x['category'],'type':x['type'],'area':x['area']} for x in items],'candidatePairs':pairs,'requiredAction':'Profile Factory identity review; do not auto-merge or suppress solely from this handoff.'})
candidates=sorted(candidates,key=lambda g:(-max(p['jaccard'] for p in g['candidatePairs']),g['normalizedAddress']))[:250]
handoff={'schemaVersion':'franklin.profile-factory-reconciliation-handoff.v1','release':RELEASE,'sourceRecordCount':len(rows),'candidateGroupCount':len(candidates),'authority':'Profile Factory remains authoritative for identity resolution and public record acceptance. Platform did not mutate or merge source records.','candidateGroups':candidates}
(ROOT/'PROFILE_FACTORY_RECONCILIATION_HANDOFF__HF37.json').write_text(json.dumps(handoff,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')


# ---------------------------------------------------------------------
# 7) Release CSS/JS used only by the reviewed pages.
# ---------------------------------------------------------------------
(DIST/'assets/hf37.css').write_text(r'''/* FR-NAV1.26.0-HF3.7 safe commercial/profile/directory finishing */
.hf37-membership-start .r29-hero,.hf37-member-profile-preview .r29-hero,.hf37-claim-profile .r29-hero{padding-block:42px}.hf37-sales-hero .r29-hero-grid{align-items:center}.hf37-quick-value{border:1px solid #bfd4d1;border-radius:16px;background:#fff;padding:22px;display:grid;gap:4px;min-width:230px}.hf37-quick-value strong{font-size:2rem}.hf37-benefit-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.hf37-benefit-grid .r29-panel{min-height:0;padding:20px}.hf37-price-card{max-width:760px;margin:0 auto;border:1px solid #9fc7c3;border-radius:18px;background:#fff;padding:30px;box-shadow:0 14px 35px rgba(0,58,64,.08)}.hf37-price-card .r29-price{margin-block:12px}.hf37-price-card .actions{margin-top:18px}.hf37-trust-note{max-width:950px;margin:22px auto 0;padding:16px 18px;border:1px solid #c9dcda;border-radius:14px;background:#f6fbfa;color:#17383b}.hf37-small-tools{padding-block:24px}.hf37-small-tools details,.hf37-free-control details{max-width:950px;margin:0 auto;border-top:1px solid #d7e3e1;border-bottom:1px solid #d7e3e1;padding:14px 0}.hf37-small-tools summary,.hf37-free-control summary{cursor:pointer;font-weight:800}
.hf37-compare-section{padding-block:30px}.hf37-preview-workspace{padding-block:36px}.hf37-preview-layout{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:22px;align-items:start}.hf37-preview-form{display:grid;gap:12px}.hf37-preview-form label{display:grid;gap:6px;font-weight:700}.hf37-form-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.hf37-check{grid-template-columns:auto 1fr!important;align-items:start}.hf37-member-preview{position:sticky;top:86px;min-height:0;padding:0!important;overflow:hidden}.hf37-preview-card-top{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;padding:24px;border-bottom:1px solid #d5e2e0}.hf37-preview-mark{width:76px;height:76px;border-radius:16px;background:#075a61;color:#fff;display:grid;place-items:center;font-size:1.45rem;font-weight:900}.hf37-preview-card-top h2{margin:0 0 4px}.hf37-preview-card-top p{margin:0}.hf37-preview-actions{display:flex;flex-wrap:wrap;gap:8px;padding:16px 24px;border-bottom:1px solid #d5e2e0}.hf37-preview-actions a{display:inline-flex;align-items:center;min-height:40px;padding:8px 12px;border:1px solid #0a5d64;border-radius:9px;font-weight:800;text-decoration:none}.hf37-preview-section{padding:18px 24px;border-bottom:1px solid #e0e9e7}.hf37-preview-section:last-child{border-bottom:0}.hf37-preview-section h3{margin:0 0 8px;font-size:1.05rem}.hf37-preview-chips{display:flex;flex-wrap:wrap;gap:7px}.hf37-preview-chip{border:1px solid #c2dad7;border-radius:999px;padding:6px 9px;background:#f4faf9}.hf37-preview-empty{color:#617477;font-style:italic}.hf37-member-badge-preview{display:inline-flex;border-radius:999px;background:#e9f6f4;color:#075a61;padding:5px 9px;font-size:.78rem;font-weight:900}.hf37-preview-price{max-width:820px}.hf37-free-control{padding-block:30px}.hf37-free-control .hf37-trust-note{margin-top:0;margin-bottom:20px}
.hf37-profile-search{max-width:1000px;margin-top:24px}.hf37-profile-search>label{font-weight:800}.hf37-profile-search>div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;margin-top:7px}.hf37-profile-search input{width:100%;min-height:50px}.hf37-missing-profile{margin-top:12px}.hf37-claim-actions{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.hf37-claim-actions .r22-card{min-height:0}.hf37-claim-trust{margin-top:20px}.hf37-claim-footer{padding-block:25px}.hf37-claim-footer p{margin:0;text-align:center}
.hf37-directory .r22-hero{padding-block:36px}.hf37-directory .r22-directory-grid{align-items:start}.hf37-directory .hf36-directory-card{align-self:start}.hf37-directory [data-dir-count]{font-size:.9rem;color:#5c7072;font-weight:700}.hf37-directory .hf36-compare{font-size:.86rem;text-decoration:none!important;color:#31585c}.hf37-directory .hf36-source-date{font-size:.78rem}.hf37-directory .hf36-result-location{line-height:1.45}.hf37-directory .hf36-directory-toolbar{position:sticky;top:64px;z-index:8;background:#fff;padding:9px 0}.hf37-directory .hf35-directory-advanced{margin-top:8px}
@media(max-width:1000px){.hf37-benefit-grid,.hf37-claim-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.hf37-preview-layout{grid-template-columns:1fr}.hf37-member-preview{position:static}.hf37-directory .hf36-directory-toolbar{top:112px}}
@media(max-width:620px){.hf37-benefit-grid,.hf37-claim-actions,.hf37-form-two{grid-template-columns:1fr}.hf37-price-card{padding:22px}.hf37-profile-search>div{grid-template-columns:1fr}.hf37-directory .hf36-directory-toolbar{position:static}.hf37-preview-card-top{grid-template-columns:1fr}.hf37-preview-mark{width:64px;height:64px}}
''',encoding='utf-8')

(DIST/'assets/hf37.js').write_text(r'''/* FR-NAV1.26.0-HF3.7 member-profile preview enhancement. */
(()=>{const form=document.querySelector('.hf37-preview-form[data-r28-preview-form]'),preview=document.querySelector('.hf37-member-preview[data-r28-preview]');if(!form||!preview)return;const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const safeUrl=s=>{try{const u=new URL(String(s||'').trim());return /^https?:$/.test(u.protocol)?u.href:''}catch{return''}};const safePhone=s=>/^[+\d().\s-]{7,30}$/.test(String(s||'').trim())?String(s).trim():'';const safeEmail=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s||'').trim())?String(s).trim():'';const split=s=>String(s||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,8);const render=()=>{const d=new FormData(form),name=String(d.get('name')||'').trim(),city=String(d.get('city')||'').trim(),category=String(d.get('category')||'').trim(),about=String(d.get('about')||'').trim(),services=split(d.get('services')),hours=String(d.get('hours')||'').trim(),languages=String(d.get('languages')||'').trim(),website=safeUrl(d.get('website')),phone=safePhone(d.get('phone')),email=safeEmail(d.get('email')),online=split(d.get('online')).map(safeUrl).filter(Boolean),photos=d.get('photos')==='yes';const display=name||'Your organization',initials=(name?name.split(/\s+/).map(x=>x[0]).join('').slice(0,2):'FN').toUpperCase();const actions=[website?`<a href="${esc(website)}" target="_blank" rel="noopener noreferrer">Website</a>`:'',phone?`<a href="tel:${esc(phone.replace(/[^+\d]/g,''))}">Call</a>`:'',email?`<a href="mailto:${esc(email)}">Email</a>`:''].filter(Boolean).join('');const chips=services.length?`<div class="hf37-preview-chips">${services.map(x=>`<span class="hf37-preview-chip">${esc(x)}</span>`).join('')}</div>`:'<p class="hf37-preview-empty">Add services or participation areas to preview them here.</p>';const links=online.length?`<ul>${online.map(u=>`<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(new URL(u).hostname.replace(/^www\./,''))}</a></li>`).join('')}</ul>`:'<p class="hf37-preview-empty">Add official public links to preview online presence.</p>';preview.innerHTML=`<div class="hf37-preview-card-top"><div class="hf37-preview-mark" aria-hidden="true">${esc(initials)}</div><div><span class="hf37-member-badge-preview">Community Member preview</span><h2>${esc(display)}</h2><p>${esc(category||'Category not added yet')}${city?' · '+esc(city):''}</p></div></div>${actions?`<div class="hf37-preview-actions">${actions}</div>`:''}<section class="hf37-preview-section"><h3>About</h3>${about?`<p>${esc(about)}</p>`:'<p class="hf37-preview-empty">Add an About description to preview it here.</p>'}</section><section class="hf37-preview-section"><h3>Services / participation</h3>${chips}</section>${hours?`<section class="hf37-preview-section"><h3>Hours</h3><p>${esc(hours)}</p></section>`:''}${languages?`<section class="hf37-preview-section"><h3>Languages & accessibility</h3><p>${esc(languages)}</p></section>`:''}<section class="hf37-preview-section"><h3>Online presence</h3>${links}</section>${photos?'<section class="hf37-preview-section"><h3>Photos / gallery</h3><p>Qualified public photos can appear here after representation and content review.</p></section>':''}<section class="hf37-preview-section"><p class="fine-print">Preview only. Nothing shown here is published by this form. Membership does not imply endorsement, ranking, certification or guaranteed results.</p></section>`};form.addEventListener('input',render);form.addEventListener('change',render);queueMicrotask(render)})();
''',encoding='utf-8')

# Add hf37 asset links to the reviewed English pages only.
for rel in ['membership-start/index.html','member-profile-preview/index.html','claim-profile/index.html','directory/index.html']:
    p=DIST/rel
    text=p.read_text(encoding='utf-8')
    if CSS not in text:text=text.replace('</head>',f'<link href="{CSS}" rel="stylesheet"/></head>',1)
    if rel=='member-profile-preview/index.html' and JS not in text:text=text.replace('</body>',f'<script defer="" src="{JS}"></script></body>',1)
    p.write_text(text,encoding='utf-8')

# Release receipt and required improvement list.
receipt={'release':RELEASE,'date':'2026-09-11','base':BASE,'scope':'Regression-safe commercial profile, claim flow and Directory finishing','preserved':['Sports static-first rendering','public profile direct contact actions','active-member Similar local profiles suppression','free corrections/removal','Profile Factory authority','ordinary Directory ranking neutrality to membership'],'changed':['sitewide header order via global shared shell assets','membership sales page shortened and de-duplicated','member profile preview upgraded to realistic entered-data-only preview','claim/manage profile flow consolidated','Directory public display normalized and local relevance refined','Profile Factory near-duplicate reconciliation handoff created without source mutation']}
(ROOT/'HF37_BUILD_RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
(ROOT/'PRODUCTION_RELEASE.json').write_text(json.dumps({'release':RELEASE,'date':'2026-09-11','base':BASE,'scope':receipt['scope'],'counts':{'profiles':raw['recordCount']},'preserved':receipt['preserved']},indent=2)+'\n',encoding='utf-8')
(ROOT/'NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_26_0_HF37.md').write_text('''# FR-NAV1.26.0-HF3.7 — Next Version Improvement List\n\n## Completed in this release\n- Repair the sitewide desktop header without rewriting working page content.\n- Shorten and clarify the Community Membership sales page while keeping $35/year, free corrections/removal, ranking neutrality, and the active-member competitor-free profile benefit.\n- Make the member-profile preview visually demonstrate richer member value using only entered public business information.\n- Consolidate the claim/manage profile path into one search-first workflow.\n- Improve Directory display taxonomy, strip producer-facing IRS location wording, reduce count emphasis, and refine default Franklin-first factual relevance without membership influence.\n- Create a Profile Factory reconciliation handoff for likely same-address/similar-name identity candidates; no automatic source merge.\n\n## Next version candidates\n1. Reconcile qualified identity candidates in the authoritative Profile Factory and consume accepted identity/display-name receipts downstream.\n2. Add richer reviewed profile modules only where qualified evidence/member submissions exist; never fabricate reviews, ratings, awards, credentials, photos, hours, services, or availability.\n3. Continue mobile, accessibility and live-browser review of remaining less-trafficked pages.\n4. Continue reducing duplicated explanatory copy where the user can instead complete the task directly.\n''',encoding='utf-8')

print(json.dumps({'release':RELEASE,'profileFactoryCandidateGroups':len(candidates),'sourceRecords':raw['recordCount']},indent=2))
