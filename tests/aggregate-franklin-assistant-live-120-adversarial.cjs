'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=process.env.RESULT_ROOT||'downloaded-adversarial-results';
const files=[];
function walk(dir){
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name),st=fs.statSync(p);
    if(st.isDirectory())walk(p);
    else if(/^shard-\d+\.json$/.test(name))files.push(p);
  }
}
walk(root);
if(files.length<6)throw new Error('Expected 6 shard files, found '+files.length);
const all=files.flatMap(file=>JSON.parse(fs.readFileSync(file,'utf8')).results);
all.sort((a,b)=>a.id.localeCompare(b.id));
if(all.length!==120)throw new Error('Expected 120 results, found '+all.length);

const passed=all.filter(x=>x.pass).length,failed=120-passed;
const byCategory={},byReason={},byMode={};
for(const r of all){
  const c=byCategory[r.category]||(byCategory[r.category]={passed:0,failed:0,total:0});
  c.total++; c[r.pass?'passed':'failed']++;
  byMode[r.mode||'NO_MODE']=(byMode[r.mode||'NO_MODE']||0)+1;
  for(const reason of r.reasons)byReason[reason]=(byReason[reason]||0)+1;
}
const md=[
  '# Franklin Assistant — Live 120-Question Adversarial Acceptance Report','',
  'Run: '+new Date().toISOString(),'',
  '- Passed: **'+passed+' / 120**',
  '- Failed: **'+failed+' / 120**',
  '- Pass rate: **'+((passed/120)*100).toFixed(1)+'%**','',
  'This bank intentionally uses unfamiliar wording, typos, ambiguity, paraphrases, follow-ups, Spanish variants and provider-vs-information boundary cases.','',
  '## By category','',
  '| Category | Passed | Failed | Total |','|---|---:|---:|---:|'
];
for(const [name,row] of Object.entries(byCategory).sort())md.push('| '+name+' | '+row.passed+' | '+row.failed+' | '+row.total+' |');
md.push('','## Failure reasons','');
for(const [reason,count] of Object.entries(byReason).sort((a,b)=>b[1]-a[1]))md.push('- '+reason+': '+count);
md.push('','## Failed questions','');
for(const r of all.filter(x=>!x.pass)){
  md.push('### '+r.id+' — '+r.category,'','Question: '+r.question,'','Expected: '+r.expected,'Mode: '+String(r.mode),'Reasons: '+r.reasons.join(', '),'','Answer: '+r.answer.replace(/\n/g,' '),'');
}
fs.mkdirSync('tests/results',{recursive:true});
fs.writeFileSync('tests/results/franklin-assistant-live-120-adversarial-latest.json',JSON.stringify({
  runAt:new Date().toISOString(),total:120,passed,failed,passRate:Number(((passed/120)*100).toFixed(1)),
  byCategory,byReason,byMode,results:all
},null,2)+'\n');
fs.writeFileSync('tests/results/franklin-assistant-live-120-adversarial-latest.md',md.join('\n')+'\n');
console.log(JSON.stringify({passed,failed}));
