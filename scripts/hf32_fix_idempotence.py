from pathlib import Path

p = Path('dist/assets/hf32-public.js')
s = p.read_text(encoding='utf-8')

old = "const update=()=>Object.values(groups).forEach(({section,inner})=>section.hidden=!qa('.today-card',inner).some(c=>!c.hidden));update();"
new = "const update=()=>Object.values(groups).forEach(({section,inner})=>{const next=!qa('.today-card',inner).some(c=>!c.hidden);if(section.hidden!==next)section.hidden=next});update();"
if old not in s:
    raise SystemExit('today observer block not found')
s = s.replace(old, new, 1)

old = "const count=q('[data-dir-count]',root),page=q('[data-dir-page]',root),prev=q('[data-dir-prev]',root);if(!count||!page)return;const total=Number((count.textContent.match(/[\\d,\\.]+/)||['0'])[0].replace(/[^\\d]/g,''));const pg=Number((page.textContent.match(/\\d+/)||['1'])[0]);if(!total)return;const start=(pg-1)*24+1,end=Math.min(pg*24,total);markNative(page,`Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`,`Mostrando ${start.toLocaleString()}–${end.toLocaleString()} de ${total.toLocaleString()}`);if(prev)prev.hidden=pg<=1;if(!meaningfulDirectoryState(root)&&document.body.classList.contains('hf32-directory-browse'))markNative(count,`${total.toLocaleString()} local profiles`,`${total.toLocaleString()} perfiles locales`)"
new = "const count=q('[data-dir-count]',root),page=q('[data-dir-page]',root),prev=q('[data-dir-prev]',root);if(!count||!page)return;const total=Number((count.textContent.match(/[\\d,\\.]+/)||['0'])[0].replace(/[^\\d]/g,''));const pg=Number((page.textContent.match(/\\d+/)||['1'])[0]);if(!total)return;const start=(pg-1)*24+1,end=Math.min(pg*24,total);const pageEn=`Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`,pageEs=`Mostrando ${start.toLocaleString()}–${end.toLocaleString()} de ${total.toLocaleString()}`;if(page.textContent.trim()!==tx(pageEn,pageEs))markNative(page,pageEn,pageEs);if(prev&&prev.hidden!==(pg<=1))prev.hidden=pg<=1;if(!meaningfulDirectoryState(root)&&document.body.classList.contains('hf32-directory-browse')){const countEn=`${total.toLocaleString()} local profiles`,countEs=`${total.toLocaleString()} perfiles locales`;if(count.textContent.trim()!==tx(countEn,countEs))markNative(count,countEn,countEs)}"
if old not in s:
    raise SystemExit('directory count block not found')
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
print('HF3.2 observer idempotence patched')
