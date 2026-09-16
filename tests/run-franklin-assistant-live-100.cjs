'use strict';
const fs=require('node:fs');

const API=process.env.FRANKLIN_ASSISTANT_API||'https://franklin-navigator-assistant.onrender.com/api/v2/answer';
const shard=Number(process.env.SHARD_INDEX||0);
const shardCount=Number(process.env.SHARD_COUNT||4);
const bank=JSON.parse(fs.readFileSync('tests/franklin-assistant-broad-acceptance-bank.json','utf8'));

const histories={
  'SAN-03':[
    {role:'user',content:'How does recycling work in Franklin?'},
    {role:'assistant',content:'Franklin Sanitation and Environmental Services handles curbside recycling and related collection services in Franklin city limits.'}
  ],
  'EVENT-05':[
    {role:'user',content:'What is happening in Franklin this weekend?'},
    {role:'assistant',content:'Saturday, September 19 — Cancer Awareness Walk — 9:00–11:00 AM — Franklin, TN.'}
  ],
  'SCHOOL-05':[
    {role:'user',content:'Which school is my address zoned for?'},
    {role:'assistant',content:'I need the exact street address because Franklin addresses can be served by different school systems.'}
  ],
  'FOLLOW-01':[
    {role:'user',content:'Who do I call about a water service problem?'},
    {role:'assistant',content:'For Franklin water service or repair problems, call Water Management at 615-794-4554.'}
  ],
  'FOLLOW-02':[
    {role:'user',content:'What time is Utility Billing open?'},
    {role:'assistant',content:'Franklin Utility Billing is listed as open 8:00 AM to 5:00 PM Monday through Friday except holidays.'}
  ],
  'FOLLOW-03':[
    {role:'user',content:'Are there events today?'},
    {role:'assistant',content:'I found current Franklin events for today and can check another day too.'}
  ],
  'FOLLOW-04':[
    {role:'user',content:'What public transportation is available in Franklin?'},
    {role:'assistant',content:'Franklin Transit is a City-supported transportation service. Fares and schedules can change.'}
  ],
  'FOLLOW-05':[
    {role:'user',content:'I need the City permits office.'},
    {role:'assistant',content:'Building & Neighborhood Services handles building permits in Franklin.'}
  ]
};

function langFor(row){
  return row.category==='spanish'||/[¿¡áéíóúñ]/i.test(row.question)?'es':'en';
}
function spanishEnough(s){
  return /\b(sí|para|puede|puedo|necesita|necesito|llame|agua|permiso|escuela|buscar|franklin|horario|eventos|dirección|servicio)\b/i.test(s);
}
function basicQuality(data){
  const answer=String(data?.answer||'').trim();
  const reasons=[];
  if(data?.ok!==true)reasons.push('api_not_ok');
  if(answer.length<20)reasons.push('answer_too_short');
  if(/\*\*|https?:\/\//i.test(answer))reasons.push('raw_markup_or_url');
  if(/I do not yet have enough verified local information/i.test(answer))reasons.push('insufficient_local_evidence');
  return reasons;
}
function hostCount(sources){
  const hs=new Set();
  for(const row of Array.isArray(sources)?sources:[]){
    try{hs.add(new URL(row.url).hostname.replace(/^www\./,''))}catch{}
  }
  return hs.size;
}
function score(row,data){
  const answer=String(data?.answer||'').trim();
  const mode=String(data?.mode||'');
  const sources=Array.isArray(data?.sources)?data.sources:[];
  const links=Array.isArray(data?.links)?data.links:[];
  const reasons=basicQuality(data);
  const fail=reason=>{if(!reasons.includes(reason))reasons.push(reason)};

  const sourcedLocalModes=new Set(['verified_fact','official_research_ai','local_web_ai','fresh_web_ai','official_snapshot']);

  switch(row.expected){
    case 'direct_local_fact':
      if(!(sourcedLocalModes.has(mode)&&sources.length))fail('expected_source_backed_local_answer');
      break;
    case 'fresh_current':
      if(mode!=='fresh_web_ai')fail('expected_fresh_web_ai');
      if(!sources.length)fail('missing_fresh_sources');
      if(hostCount(sources)!==sources.length)fail('duplicate_source_hosts');
      break;
    case 'context_followup_fresh':
      if(mode!=='fresh_web_ai')fail('expected_fresh_followup');
      break;
    case 'directory_handoff':
      if(mode!=='directory_handoff')fail('expected_directory_handoff');
      if(!links.length)fail('missing_directory_link');
      break;
    case 'directory_or_local_research':
      if(!(mode==='directory_handoff'||(sourcedLocalModes.has(mode)&&sources.length)))fail('expected_directory_or_local_research');
      break;
    case 'local_research':
      if(!(sourcedLocalModes.has(mode)&&sources.length))fail('expected_local_research_with_source');
      break;
    case 'needs_specific_detail':
      if(!/address|location|where|which|direcci[oó]n|ubicaci[oó]n|d[oó]nde/i.test(answer))fail('missing_specific_detail_request');
      break;
    case 'emergency_first':
      if(!/911|emergency|emergencia|leave|evacuate|salga|call|llame|fire department|gas company/i.test(answer))fail('missing_emergency_first_action');
      break;
    case 'context_followup':
      if(mode==='insufficient_local_evidence')fail('lost_conversation_context');
      if(/name the Franklin service|reformulate|rephrase/i.test(answer))fail('asked_to_restate_context');
      break;
    case 'general_plus_local':
      if(mode==='insufficient_local_evidence')fail('insufficient_general_plus_local');
      break;
  }

  if(row.category==='spanish'&&!spanishEnough(answer))fail('spanish_parity_failure');
  return {pass:reasons.length===0,reasons};
}

async function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function ask(row){
  const body={question:row.question,language:langFor(row),history:histories[row.id]||[]};
  let last={};
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const ctl=new AbortController();
      const timer=setTimeout(()=>ctl.abort(),45000);
      const response=await fetch(API,{
        method:'POST',
        headers:{'Content-Type':'application/json','User-Agent':'Franklin-Assistant-Live-Acceptance/1.0'},
        body:JSON.stringify(body),
        signal:ctl.signal
      });
      clearTimeout(timer);
      const data=await response.json().catch(()=>({}));
      last={httpStatus:response.status,...data};
      if(response.ok&&data?.ok===true)return last;
      if(response.status===429){await sleep(15000*attempt);continue}
      if(response.status>=500){await sleep(3000*attempt);continue}
      return last;
    }catch(error){
      last={ok:false,error:error?.name==='AbortError'?'TIMEOUT':String(error?.message||error)};
      await sleep(2000*attempt);
    }
  }
  return last;
}

(async()=>{
  const selected=bank.cases.filter((_,i)=>i%shardCount===shard);
  const results=[];
  for(const row of selected){
    const started=Date.now();
    const data=await ask(row);
    const verdict=score(row,data);
    results.push({
      id:row.id,
      category:row.category,
      question:row.question,
      expected:row.expected,
      pass:verdict.pass,
      reasons:verdict.reasons,
      httpStatus:data.httpStatus||null,
      mode:data.mode||null,
      answer:String(data.answer||''),
      sources:Array.isArray(data.sources)?data.sources:[],
      links:Array.isArray(data.links)?data.links:[],
      elapsedMs:Date.now()-started
    });
    process.stdout.write(JSON.stringify({id:row.id,pass:verdict.pass,mode:data.mode||null,reasons:verdict.reasons})+'\n');
    await sleep(350);
  }
  fs.mkdirSync('live-test-results',{recursive:true});
  const out={shard,shardCount,runAt:new Date().toISOString(),count:results.length,results};
  fs.writeFileSync('live-test-results/shard-'+shard+'.json',JSON.stringify(out,null,2)+'\n');
  const passed=results.filter(x=>x.pass).length;
  console.log(JSON.stringify({shard,passed,total:results.length}));
})().catch(error=>{console.error(error);process.exit(1)});
