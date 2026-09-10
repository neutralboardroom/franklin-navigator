#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, pathlib, re, subprocess, tempfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
BASE='736e3cfb5ae6be08758a442ce7bb2f8cedf8b9f0'
RELEASE='FR-NAV1.20.0-HF3.1-CANDIDATE'
CUTOFF=dt.datetime(2026,9,10,0,30,0,tzinfo=dt.timezone.utc)
DATED={
 'dist/index.html','dist/today/index.html','dist/es/index.html','dist/es/hoy/index.html'
}
META=re.compile(rb'(<meta\s+name=["\']franklin-release["\']\s+content=["\'])([^"\']+)(["\'])',re.I)
META_R=re.compile(rb'(<meta\s+content=["\'])([^"\']+)(["\']\s+name=["\']franklin-release["\'])',re.I)
ARTICLE=re.compile(rb'<article\b(?=[^>]*\bdata-event-end=["\']([^"\']+)["\'])[^>]*>.*?</article>',re.I|re.S)

def normalize_marker(data:bytes)->bytes:
    if META.search(data): return META.sub(lambda m:m.group(1)+b'__FRANKLIN_RELEASE__'+m.group(3),data,count=1)
    if META_R.search(data): return META_R.sub(lambda m:m.group(1)+b'__FRANKLIN_RELEASE__'+m.group(3),data,count=1)
    raise SystemExit('Missing franklin-release marker')

def set_marker(data:bytes)->bytes:
    rel=RELEASE.encode()
    if META.search(data): return META.sub(lambda m:m.group(1)+rel+m.group(3),data,count=1)
    if META_R.search(data): return META_R.sub(lambda m:m.group(1)+rel+m.group(3),data,count=1)
    raise SystemExit('Missing franklin-release marker')

def parse_end(raw:bytes)->dt.datetime:
    return dt.datetime.fromisoformat(raw.decode().replace('Z','+00:00')).astimezone(dt.timezone.utc)

def suppress(data:bytes)->bytes:
    def repl(m:re.Match[bytes])->bytes:
        return b'' if parse_end(m.group(1))<CUTOFF else m.group(0)
    return ARTICLE.sub(repl,data)

def require(condition:bool,message:str):
    if not condition: raise SystemExit(message)

def main():
    htmls=sorted(DIST.rglob('index.html'))
    require(len(htmls)==19355,f'Expected 19355 public index pages, got {len(htmls)}')
    profiles=sorted((DIST/'profiles').glob('*/index.html'))
    require(len(profiles)==19103,f'Expected 19103 profiles, got {len(profiles)}')
    marker=f'<meta name="franklin-release" content="{RELEASE}"'.encode()
    marker_rev=f'<meta content="{RELEASE}" name="franklin-release"'.encode()
    bad=[]
    for p in htmls:
        data=p.read_bytes()
        if marker not in data and marker_rev not in data: bad.append(p.relative_to(ROOT).as_posix())
    require(not bad,'Wrong/missing HF3.1 marker: '+', '.join(bad[:12]))

    with tempfile.TemporaryDirectory(prefix='hf31-base-') as td:
        base=pathlib.Path(td)
        archive=subprocess.Popen(['git','archive',BASE,'dist'],cwd=ROOT,stdout=subprocess.PIPE)
        untar=subprocess.run(['tar','-x','-C',str(base)],stdin=archive.stdout,check=True)
        archive.stdout.close(); rc=archive.wait();require(rc==0,'git archive failed')
        current_paths={p.relative_to(ROOT).as_posix() for p in htmls}
        base_paths={p.relative_to(base).as_posix() for p in (base/'dist').rglob('index.html')}
        require(current_paths==base_paths,'Public index member set drifted')
        exact_after_marker=0
        dated_verified=0
        for rel in sorted(current_paths):
            cur=(ROOT/rel).read_bytes();old=(base/rel).read_bytes()
            if rel in DATED:
                expected=suppress(set_marker(old))
                require(cur==expected,f'{rel}: changed beyond deterministic release-marker/expired-card transform')
                for m in ARTICLE.finditer(cur):
                    require(parse_end(m.group(1))>=CUTOFF,f'{rel}: expired card survived {m.group(1)!r}')
                dated_verified+=1
            else:
                require(normalize_marker(cur)==normalize_marker(old),f'{rel}: public content changed beyond release marker')
                exact_after_marker+=1
        require(dated_verified==4,'Did not verify all four dated pages')
        require(exact_after_marker==19351,f'Expected 19351 marker-only pages, got {exact_after_marker}')

    js=(DIST/'assets/hf31-public.js').read_text('utf-8')
    css=(DIST/'assets/hf31-public.css').read_text('utf-8')
    r37=(DIST/'assets/r37-i18n.js').read_text('utf-8')
    patch=(DIST/'assets/hf31-task-save.css').read_text('utf-8')
    require("js.src='/assets/hf31-public.js'" in r37,'HF3.1 loader missing')
    for token in ['hf31-home','hf31-today','hf31-tasks','hf31-directory','hf31-profile-page','suppressExpiredDatedContent','More contact options','More tools','Manage or correct this profile']:
        require(token in js,f'HF3.1 JS contract missing {token}')
    for token in ['hf31-language-inline','hf31-home-events','hf31-task-grid','hf31-directory-results','hf31-profile-layout','hf31-profile-management']:
        require(token in css,f'HF3.1 CSS contract missing {token}')
    require('display:inline-flex!important' in patch and 'hf31-task-save' in patch,'Task Save visibility override missing')
    require('Smarter Justice' not in js and 'smarterjustice' not in js.lower(),'Smarter Justice reference entered public HF3.1 JS')
    require('Smarter Justice' not in css and 'smarterjustice' not in css.lower(),'Smarter Justice reference entered public HF3.1 CSS')
    print('HF31_REVIEWED_PAGES_VALIDATION_PASS public=19355 profiles=19103 marker_only=19351 dated=4 facts_unchanged=true')

if __name__=='__main__':main()
