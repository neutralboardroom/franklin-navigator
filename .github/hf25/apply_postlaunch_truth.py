from pathlib import Path
from html.parser import HTMLParser
from collections import Counter, defaultdict
import hashlib, json, re, sys

ROOT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path('.').resolve()
PATCH=json.loads(Path(sys.argv[2]).read_text()) if len(sys.argv)>2 else json.loads(Path('.github/hf25/postlaunch_truth_patch.json').read_text())
DIST=ROOT/'dist'
if PATCH['base']!='9e8195d9c3939f791795ab38add326402b5d55c8': raise SystemExit('unexpected patch base')

# Keep original HTML text inventory to identify newly introduced public strings.
html_paths=sorted(DIST.rglob('*.html'))
before={p:p.read_text() for p in html_paths}
changed=set(); stats=[]

for item in PATCH['replacements']:
    old,new=item['old'],item['new']; total=0
    for p in html_paths:
        text=p.read_text(); n=text.count(old)
        if n:
            p.write_text(text.replace(old,new)); total+=n; changed.add(p)
    if total < int(item.get('min',1)):
        raise SystemExit(f"replacement underflow {total}<{item.get('min',1)}: {old[:100]}")
    stats.append({'old':old,'new':new,'replacements':total})

# Replace the obsolete membership capability table on the two pages that intentionally share it.
old_table_re=re.compile(r'<tbody><tr><th scope="row">Public profile checked against sources</th>.*?</tbody>',re.S)
for rel in ['capability-status/index.html','free-membership/index.html']:
    p=DIST/rel; text=p.read_text(); text2,n=old_table_re.subn(PATCH['capabilityTableHtml'],text,count=1)
    if n!=1: raise SystemExit(f'capability table not found exactly once: {rel}, {n}')
    p.write_text(text2); changed.add(p)

# Clarify the planner boundary while acknowledging current membership availability.
p=DIST/'member-growth-workspace/index.html'; text=p.read_text()
if text.count(PATCH['memberGrowthOld'])!=1: raise SystemExit('member growth block mismatch')
p.write_text(text.replace(PATCH['memberGrowthOld'],PATCH['memberGrowthNew']))
changed.add(p)

# A few statements need whole-block truth correction rather than phrase replacement.
exact_blocks={
'business-membership/index.html':[
("Paid membership is designed to add a richer profile, practical growth tools and a stronger local community presence—not paid control of factual accuracy or ordinary directory results.","Paid membership adds access to richer reviewed profile details, practical growth tools and a stronger local community presence—not paid control of factual accuracy or ordinary directory results."),
],
'member-support/index.html':[
("Payment failure, recovery, cancellation, refunds and membership access must stay accurate and consistent. New public checkout remains closed while Franklin completes the remaining launch checks. Existing active members can use secure billing and cancellation.","Payment failure, recovery, cancellation, refunds and membership access must stay accurate and consistent. Enrollment is open for eligible verified profiles. Existing active members can use secure billing and cancellation and should not pay again for the same membership."),
],
'terms/index.html':[
("For new enrollment, the approved choices are $5 monthly, $50 annual and $120 once for a prepaid 36-month Franklin Charter Membership. New public checkout is currently closed.","For new enrollment, the approved choices are $5 monthly, $50 annual and $120 once for a prepaid 36-month Franklin Charter Membership. Public checkout is open for eligible verified profiles."),
("New public membership checkout remains closed. An existing paid Community Membership is connected to the correct account and profile, is active, and can use secure billing and cancellation. Do not make another payment for an existing membership while Franklin completes the remaining launch checks.","Franklin Community Membership enrollment is open for eligible verified profiles. Existing active members can use secure billing and cancellation and should not make another payment for the same membership."),
]
}
for rel,pairs in exact_blocks.items():
    p=DIST/rel; text=p.read_text()
    for old,new in pairs:
        if old in text:
            text=text.replace(old,new); changed.add(p); stats.append({'old':old,'new':new,'replacements':1})
    p.write_text(text)

# Ensure changed business/member pages point to the live enrollment route where a prelaunch CTA was formerly passive.
cta_pairs={
'business-membership/index.html': [('href="/membership-start/">Start membership setup','href="/membership-enroll/">Start membership setup')],
'member-value/index.html': [('href="/business-membership/">See membership value','href="/membership-enroll/">Start membership setup')],
'membership-pricing/index.html': [('href="/member-profile-preview/" class="button primary">SHOW ME','href="/membership-enroll/" class="button primary">Start membership setup')]
}
for rel,pairs in cta_pairs.items():
    p=DIST/rel; text=p.read_text()
    for old,new in pairs:
        if old in text: text=text.replace(old,new); changed.add(p)
    p.write_text(text)

# Remove only stale prelaunch HTML claims. Conditional JS recovery copy remains untouched by design.
for phrase in PATCH['bannedVisiblePhrases']:
    hits=[]
    for p in html_paths:
        t=p.read_text()
        if phrase.lower() in t.lower(): hits.append(p.relative_to(DIST).as_posix())
    if hits: raise SystemExit(f"stale public phrase remains {phrase!r}: {hits[:20]}")

# Public text inventory used by the i18n runtime. It intentionally covers rendered HTML text and translatable attributes.
SKIP={'script','style','noscript','code','pre','textarea'}
class Collector(HTMLParser):
    def __init__(self): super().__init__(convert_charrefs=True); self.stack=[]; self.strings=[]
    def handle_starttag(self,tag,attrs):
        self.stack.append(tag)
        d=dict(attrs)
        for name in ('title','aria-label','placeholder','alt'):
            if d.get(name): self.add(d[name])
        if tag=='meta' and (d.get('name')=='description' or d.get('property') in ('og:description','og:title')) and d.get('content'): self.add(d['content'])
    def handle_startendtag(self,tag,attrs):
        d=dict(attrs)
        for name in ('title','aria-label','placeholder','alt'):
            if d.get(name): self.add(d[name])
        if tag=='meta' and (d.get('name')=='description' or d.get('property') in ('og:description','og:title')) and d.get('content'): self.add(d['content'])
    def handle_endtag(self,tag):
        if self.stack:
            # tolerate compact HTML and close to matching tag when possible
            try:i=len(self.stack)-1-self.stack[::-1].index(tag);self.stack=self.stack[:i]
            except ValueError:self.stack.pop()
    def handle_data(self,data):
        if self.stack and self.stack[-1] in SKIP:return
        self.add(data)
    def add(self,s):
        s=re.sub(r'\s+',' ',str(s)).strip()
        if s:self.strings.append(s)

def collect_file(p):
    c=Collector(); c.feed(p.read_text()); return c.strings

counts=Counter(); examples=defaultdict(list)
for p in html_paths:
    rel=p.relative_to(DIST).as_posix()
    for s in collect_file(p):
        counts[s]+=1
        if len(examples[s])<4: examples[s].append(rel)
entries=[{'en':s,'uses':counts[s],'examples':examples[s]} for s in counts]
entries.sort(key=lambda x:(-x['uses'],x['en']))
en={'count':len(entries),'strings':entries}
en_path=DIST/'data/r37-en-public-strings.json'
en_bytes=(json.dumps(en,ensure_ascii=False,indent=2,sort_keys=False)+'\n').encode()
en_path.write_bytes(en_bytes);changed.add(en_path)

# Preserve existing dynamic translations, add exact translations for every new public string introduced by this patch.
es_path=DIST/'data/r37-es-public-strings.json'; es=json.loads(es_path.read_text()); tr=dict(es.get('translations',{})); tr.update(PATCH['newSpanishTranslations'])

# Discover newly introduced normalized strings and require bilingual coverage for each substantive one.
before_strings=set()
for p,t in before.items():
    c=Collector();c.feed(t);before_strings.update(c.strings)
after_strings=set(counts)
introduced=sorted(after_strings-before_strings)
# Names, URLs, numeric-only tokens and existing language labels need no new translation; everything else added by product copy must be covered.
def translatable(s):
    if s in {'English','Español','Franklin Navigator','Growth Desk'}:return False
    if re.fullmatch(r'[\d\W_]+',s):return False
    return any(ch.isalpha() for ch in s)
missing=[s for s in introduced if translatable(s) and s not in tr]
if missing: raise SystemExit('missing Spanish translations for new public strings:\n'+'\n'.join(missing))

# Delete exact obsolete keys that the product no longer renders, but retain conditional runtime recovery strings not touched by this patch.
obsolete=[]
for item in PATCH['replacements']:
    old=item['old']
    if old in tr: obsolete.append(old); tr.pop(old,None)
es['release']=PATCH['successor']; es['sourceCount']=len(entries); es['sourceCatalogSha256']=hashlib.sha256(en_bytes).hexdigest(); es['count']=len(tr); es['postLaunchCommerceTruth']=True; es['translations']=dict(sorted(tr.items()))
es_path.write_text(json.dumps(es,ensure_ascii=False,indent=2,sort_keys=False)+'\n');changed.add(es_path)

# Update changed-page release metadata without rewriting all 19k profiles.
for p in list(changed):
    if p.suffix=='.html':
        t=p.read_text(); t=t.replace('content="FR-NAV1.15.0-CANDIDATE-R40"','content="FR-NAV1.15.0-HF2.5-CANDIDATE"');p.write_text(t)

# Ensure all profile pages remain exactly byte-identical to the input base.
profile_changed=[p.relative_to(DIST).as_posix() for p in changed if p.is_relative_to(DIST/'profiles')]
if profile_changed: raise SystemExit(f'profile files changed unexpectedly: {profile_changed[:10]}')

report={
 'schemaVersion':'franklin.hf25.postlaunch-truth-apply.v1',
 'base':PATCH['base'],'successor':PATCH['successor'],
 'changedFiles':sorted(p.relative_to(ROOT).as_posix() for p in changed),
 'changedFileCount':len(changed),'replacementStats':stats,
 'newPublicStrings':introduced,'spanishTranslationCount':len(tr),
 'enCatalogCount':len(entries),'removedObsoleteTranslationKeys':obsolete,
 'profileFilesChanged':0,'runtimeFilesChanged':0,'commercialContractChanged':False
}
ev=ROOT/'evidence';ev.mkdir(exist_ok=True);(ev/'HF25_POSTLAUNCH_TRUTH_APPLY.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'changedFileCount':len(changed),'newPublicStrings':len(introduced),'enCatalogCount':len(entries),'profileFilesChanged':0},indent=2))
