from pathlib import Path
p=Path('dist/assets/hf32-public.js')
s=p.read_text(encoding='utf-8')
old="const typeText=facts?(q('div:nth-child(2) strong',facts)?.textContent||''):'';"
new="const typeText=facts?(facts.textContent||''):'';"
if old not in s:
    raise SystemExit('profile type detection block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('HF3.2 profile type label detection fixed')
