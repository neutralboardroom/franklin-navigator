'use strict';
(()=>{
  const payload=document.querySelector('script[data-explorer-static-payload]');
  if(!payload||typeof window.fetch!=='function'||typeof window.Response!=='function')return;
  const text=payload.textContent?.trim()||'';
  try{
    const data=JSON.parse(text);
    if(data?.schemaVersion!=='franklin.activities.v1'||data?.edition!=='FRANKLIN_TN'||!Array.isArray(data.startingPoints)||!Array.isArray(data.currentWindow))return;
    const native=window.fetch.bind(window);
    window.fetch=(input,init)=>{
      try{
        const raw=typeof input==='string'?input:input?.url;
        const u=new URL(raw||'',location.href);
        if(u.origin===location.origin&&u.pathname==='/data/franklin-activities.json'){
          return Promise.resolve(new Response(text,{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}));
        }
      }catch{}
      return native(input,init);
    };
    document.documentElement.dataset.hf33ExplorerPayload='ready';
  }catch(error){console.warn('Franklin local options fallback could not be prepared.',error);}
})();
