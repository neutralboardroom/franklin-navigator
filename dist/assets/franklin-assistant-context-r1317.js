(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.FranklinAssistantContextR1317=api;})(typeof window==='undefined'?null:window,function(){
'use strict';
const VERSION='FR-NAV1.30.17-HF3.12.9';
const referenceCue=/\b(those|them|these|ones|they|their|it|its|that|this|same|above|previous|there|that one|this one|lo|eso|esa|ese|ellos|ellas|su|sus|mismo|anterior|ahi|allí|aquello|aquella)\b/i;
const continuationStart=/^(and |also |which |what |where |when |who |why |how |can |could |do |does |did |is |are |was |were |should |would |find |show |tell |give |help |y |tambien |también |cual |cuál |cuales |cuáles |que |qué |donde |dónde |cuando |cuándo |quien |quién |por que |por qué |como |cómo |puede |puedo |debo |es |son |mostrar |dime |ayuda )/i;
function inferService(raw,C){
  const direct=C?.serviceFor?.(raw);if(direct)return direct;
  const t=C?.norm?C.norm(raw):String(raw||'').toLowerCase();
  const aliases=[
    ['roofing',/\b(roof|shingle|shingles|gutter|gutters|techo|tejado|canaleta)\b/],
    ['plumber',/\b(pipe|pipes|sink|toilet|drain|faucet|water heater|sewer line|tuberia|tubería|fregadero|inodoro|desague|desagüe|grifo|calentador de agua)\b/],
    ['electrician',/\b(outlet|breaker|electrical panel|wiring|power socket|enchufe|interruptor|panel electrico|panel eléctrico|cableado)\b/],
    ['hvac',/\b(air conditioner|ac unit|furnace|heat pump|thermostat|calefaccion|calefacción|aire acondicionado|termostato)\b/],
    ['auto repair',/\b(car won t start|car won't start|engine|brakes|transmission|battery|motor|frenos|transmision|transmisión|bateria|batería)\b/],
    ['towing',/\b(stranded car|stuck car|tow my car|car is stuck|remolcar|auto varado|carro varado)\b/],
    ['veterinary',/\b(my dog|my cat|pet is sick|dog is sick|cat is sick|mascota enferma|perro enfermo|gato enfermo)\b/],
    ['cleaning',/\b(house needs cleaning|home cleaning|deep clean|limpiar la casa|limpieza profunda)\b/],
    ['landscaping',/\b(yard|lawn|grass|landscape|tree trimming|jardin|jardín|cesped|césped|pasto|paisajismo|poda)\b/]
  ];
  const hit=aliases.find(([,re])=>re.test(t));
  return hit?{q:hit[0]}:null;
}
function serviceActionFollow(raw,C){
  const t=C?.norm?C.norm(raw):String(raw||'').toLowerCase();
  return /\b(need it repaired|need it fixed|repair it|fix it|need someone|need somebody|who can repair|who can fix|hire someone|have it repaired|have it fixed|need a professional|need a contractor|necesito que lo reparen|necesito que lo arreglen|repararlo|arreglarlo|necesito alguien|quien puede repararlo|quien puede arreglarlo|necesito un profesional|necesito un contratista)\b/.test(t);
}
function contextualize(raw,state,C){
  const q=String(raw||'').trim();if(!q)return q;
  const lastEffective=String(state?.lastEffective||'').trim();
  if(!lastEffective)return q;
  const lastService=state?.lastService||null,lastTopics=Array.isArray(state?.lastTopics)?state.lastTopics:[];
  const svc=inferService(q,C),topics=C?.concepts?.(q)||[],words=q.split(/\s+/).length;
  const refersBack=referenceCue.test(q),shortContinuation=words<=9&&continuationStart.test(q);
  const freshSubject=/\b(city hall|city office|school|park|recycling|recycle|trash|garbage|sanitation|transit|transportation|bus|water|utility|meeting|agenda|event|restaurant|doctor|dentist|lawyer|attorney|housing|rent|landlord|property|business|job|childcare|daycare|permit|roof|car|vehicle|pet|veterinarian|ayuntamiento|oficina de la ciudad|escuela|parque|reciclaje|basura|saneamiento|transporte|autobus|autobús|agua|servicio publico|servicio público|reunion|reunión|agenda|evento|restaurante|medico|médico|dentista|abogado|vivienda|alquiler|propietario|propiedad|negocio|empleo|guarderia|guardería|permiso|techo|carro|vehiculo|vehículo|mascota|veterinario)\b/i.test(q);
  if(refersBack){
    const carry=[];if(lastService?.q)carry.push(lastService.q);for(const t of lastTopics.slice(0,2))carry.push(String(t).replace(/-/g,' '));
    return [lastEffective,carry.join(' '),q].filter(Boolean).join(' ');
  }
  if((svc||topics.length>0||freshSubject)&&!(words<=7&&lastService&&topics.includes('permit')&&!freshSubject))return q;
  if(shortContinuation||words<=6){
    const carry=[];if(lastService?.q)carry.push(lastService.q);for(const t of lastTopics.slice(0,2))carry.push(String(t).replace(/-/g,' '));
    return [lastEffective,carry.join(' '),q].filter(Boolean).join(' ');
  }
  return q;
}
return Object.freeze({VERSION,referenceCue,continuationStart,inferService,serviceActionFollow,contextualize});
});