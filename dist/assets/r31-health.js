(()=>{
  const KEY='franklin_product_health_v1';
  const ALLOWED=new Set(['assistant_dialog_open','assistant_dialog_close','assistant_spanish_handoff','planner_empty_needs','planner_plan_built','planner_prep_handoff','prep_packet_built','prep_empty_needs','notice_organizer_built','chronology_packet_built','appeal_review_packet_built','resource_load_error','script_error','benefits_health_plan_built','work_income_plan_built','caregiver_plan_built','member_starter_plan_built','plan_saved_to_my_franklin','plan_completion_changed','safe_share_used','promise_rejection']);
  let memory={};
  const read=()=>{try{const v=JSON.parse(sessionStorage.getItem(KEY)||'{}');if(v&&typeof v==='object'){memory={...v};return {...v}}}catch{}return {...memory}};
  const write=v=>{memory={...v};try{sessionStorage.setItem(KEY,JSON.stringify(v))}catch{}};
  const record=code=>{if(!ALLOWED.has(code))return;const v=read();v[code]=(Number(v[code])||0)+1;write(v)};
  window.FranklinProductHealth=Object.freeze({record,snapshot:()=>Object.freeze(read()),clear:()=>{memory={};try{sessionStorage.removeItem(KEY)}catch{}}});
  addEventListener('error',event=>{const el=event.target;if(el&&el!==window&&(el.tagName==='SCRIPT'||el.tagName==='LINK'))record('resource_load_error');else if(event.error)record('script_error')},true);
  addEventListener('unhandledrejection',()=>record('promise_rejection'));
})();
