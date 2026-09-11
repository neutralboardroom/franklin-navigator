/* FR-NAV1.27.0-HF3.8 preview readiness — device-only, never a public score. */
(()=>{const form=document.querySelector('.hf37-preview-form'),box=document.querySelector('[data-r38-preview-readiness]');if(!form||!box)return;
const status=box.querySelector('[data-r38-preview-status]'),progress=box.querySelector('[data-r38-preview-progress]'),list=box.querySelector('[data-r38-preview-list]');
const v=n=>String(form.elements[n]?.type==='checkbox'?(form.elements[n]?.checked?'yes':''):form.elements[n]?.value||'').trim();
const groups=()=>[
 ['Identity',Boolean(v('name')&&v('category')&&v('city'))],
 ['Contact',Boolean(v('website')||v('phone')||v('email'))],
 ['About',v('about').length>=20],
 ['Services',Boolean(v('services'))],
 ['Practical details',Boolean(v('hours')||v('languages'))],
 ['Online / photos',Boolean(v('online')||v('photos'))]
];
const render=()=>{const g=groups(),n=g.filter(x=>x[1]).length;status.textContent=`${n} of ${g.length} useful sections ready`;progress.value=n;list.replaceChildren(...g.map(([label,ok])=>{const li=document.createElement('li');li.textContent=(ok?'Ready: ':'Add: ')+label;li.className=ok?'r38-ready':'r38-not-ready';return li}))};
form.addEventListener('input',render);form.addEventListener('change',render);render()})();