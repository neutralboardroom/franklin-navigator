'use strict';
const fs=require('node:fs');
const path=require('node:path');

const root=process.env.RESULT_ROOT||'downloaded-results';
const files=[];
function walk(dir){
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name),st=fs.statSync(p);
    if(st.isDirectory())walk(p);
    else if(/^shard-\d+\.json$/.test(name))files.push(p);
  }
}
walk(root);
if(files.length<4)throw new Error('Expected 4 shard files, found '+files.length);

const all=files.flatMap(file=>JSON.parse(fs.readFileSync(file,'utf8')).results);
all.sort((a,b)=>a.id.localeCompare(b.id));
if(all.length!==100)throw new Error('Expected 100 results, found '+all.length);

const passed=all.filter(x=>x.pass).length;
const failed=all.length-passed;
const byCategory={};
const byReason={};
const byMode={};
for(const r of all){
  const c=byCategory[r.category]||(byCategory[r.category]={passed:0,failed:0,total:0});
  c.total++; c[r.pass?'passed':'failed']++;
  byMode[r.mode||'NO_MODE']=(byMode[r.mode||'NO_MODE']||0)+1;
  for(const reason of r.reasons)byReason[reason]=(byReason[reason]||0)+1;
}

const failRows=all.filter(x=>!x.pass);
const md=[];
md.push('# Franklin Assistant — Live 100-Question Acceptance Report');
md.push('');
md.push('Run: '+new Date().toISOString());
md.push('');
md.push('Live endpoint: https://franklin-navigator-assistant.onrender.com/api/v2/answer');
md.push('');
md.push('## Overall');
md.push('');
md.push('- Passed: **'+passed+' / 100**');
md.push('- Failed: **'+failed+' / 100**');
md.push('- Pass rate: **'+passed+'%**');
md.push('');
md.push('Automated scoring checks requested behavior class, source presence where required, freshness mode, directory handoff, emergency-first cues, Spanish parity, and basic presentation quality. This is a screening test, not a substitute for human review of every nuanced answer.');
md.push('');
md.push('## By category');
md.push('');
md.push('| Category | Passed | Failed | Total |');
md.push('|---|---:|---:|---:|');
for(const [name,row] of Object.entries(byCategory).sort())md.push('| '+name+' | '+row.passed+' | '+row.failed+' | '+row.total+' |');
md.push('');
md.push('## Failure reasons');
md.push('');
for(const [reason,count] of Object.entries(byReason).sort((a,b)=>b[1]-a[1]))md.push('- '+reason+': '+count);
md.push('');
md.push('## Runtime modes');
md.push('');
for(const [mode,count] of Object.entries(byMode).sort((a,b)=>b[1]-a[1]))md.push('- '+mode+': '+count);
md.push('');
md.push('## Failed questions');
md.push('');
for(const r of failRows){
  md.push('### '+r.id+' — '+r.category);
  md.push('');
  md.push('Question: '+r.question);
  md.push('');
  md.push('Expected: '+r.expected);
  md.push('Mode: '+String(r.mode));
  md.push('Reasons: '+r.reasons.join(', '));
  md.push('');
  md.push('Answer: '+r.answer.replace(/\n/g,' '));
  md.push('');
}
md.push('## Full result inventory');
md.push('');
md.push('| ID | Category | Result | Expected | Mode |');
md.push('|---|---|---|---|---|');
for(const r of all)md.push('| '+r.id+' | '+r.category+' | '+(r.pass?'PASS':'FAIL')+' | '+r.expected+' | '+String(r.mode||'')+' |');
md.push('');

fs.mkdirSync('tests/results',{recursive:true});
fs.writeFileSync('tests/results/franklin-assistant-live-100-latest.json',JSON.stringify({
  runAt:new Date().toISOString(),
  total:100,passed,failed,passRate:passed,
  byCategory,byReason,byMode,results:all
},null,2)+'\n');
fs.writeFileSync('tests/results/franklin-assistant-live-100-latest.md',md.join('\n')+'\n');
console.log(JSON.stringify({passed,failed,files:files.length}));
