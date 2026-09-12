(()=>{'use strict';
const C=window.FranklinAssistantCore,B=window.FranklinAssistantFilesR1293;if(!C||!B)return;
const lang=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('es')?'es':'en';
const tx=(en,es)=>lang()==='es'?es:en;
const flat=v=>String(v||'').replace(/\s+/g,' ').trim();
const unique=a=>[...new Set(a.filter(Boolean))];
function sensitive(t){return/(\b\d{3}-\d{2}-\d{4}\b|social security|ssn|routing number|account number|medical record number|patient id|password|passcode|date of birth|fecha de nacimiento|numero de cuenta|seguro social|contrase[nñ]a)/i.test(t)}
function kind(t){const n=C.norm(t),rows=[['court or legal notice',/\b(court|summons|complaint|hearing|citation|plaintiff|defendant|attorney|appeal|legal notice|tribunal|audiencia|citacion|apelacion)\b/],['bill, claim or insurance document',/\b(invoice|bill|claim|policy|premium|deductible|coverage|insurance|factura|reclamo|poliza|seguro)\b/],['health or medical document',/\b(patient|medical|doctor|clinic|hospital|medication|lab|diagnosis|paciente|medico|clinica|medicamento|diagnostico)\b/],['property, HOA or permit document',/\b(property|parcel|hoa|permit|zoning|contractor|inspection|propiedad|parcela|permiso|zonificacion)\b/],['benefits or government notice',/\b(benefit|eligibility|agency|department|notice|application|snap|medicaid|beneficio|elegibilidad|agencia|departamento)\b/],['school or education document',/\b(school|student|teacher|enrollment|grade|district|escuela|estudiante|maestro|inscripcion)\b/],['business or contract document',/\b(contract|agreement|business|vendor|invoice|service terms|contrato|acuerdo|negocio|proveedor)\b/]];return rows.find(x=>x[1].test(n))?.[0]||'document'}
function dates(t){return unique((t.match(/\b(?:\d{1,2}[/-]){2}\d{2,4}\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?/gi)||[])).slice(0,8)}
function money(t){return unique((t.match(/\$\s?\d[\d,]*(?:\.\d{2})?/g)||[])).slice(0,8)}
function phones(t){return unique((t.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g)||[])).slice(0,5)}
function emails(t){return unique((t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[])).slice(0,5)}
function urls(t){return unique((t.match(/https?:\/\/[^\s)\]}>]+/gi)||[])).slice(0,5)}
function sentences(t){return flat(t).split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=22&&x.length<=520)}
function actionSentences(ss){const r=/\b(must|required|requirement|due|deadline|respond|response|submit|submission|pay|payment|call|contact|appear|appearance|hearing|appeal|appeal by|complete|provide|return|sign|send|file|schedule|before|no later than|debe|requerid[oa]|vence|fecha limite|responder|enviar|pagar|llamar|contactar|comparecer|audiencia|apelar|completar|proporcionar|devolver|firmar|presentar|programar|antes de)\b/i;return ss.filter(x=>r.test(x)).slice(0,4)}
function questionSentences(ss,q){const tokens=C.meaningful(q);if(!tokens.length)return[];return ss.map(s=>({s,score:tokens.reduce((n,w)=>n+(C.norm(s).includes(w)?8:0),0)+(/\b(when|date|deadline|due|amount|cost|price|phone|email|address|what do i do|next|fecha|plazo|vence|monto|precio|telefono|correo|direccion|que hago|siguiente)\b/i.test(q)&&/\d|\$|@|must|required|due|deadline|contact|call|submit|appeal|debe|vence|contactar|enviar|apelar/i.test(s)?10:0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.s)}
function answer(raw,q=''){
  const source=String(raw||'').slice(0,120000),clean=flat(source);if(!clean)return{text:tx('I could not read usable text from this attachment.','No pude leer texto utilizable de este archivo.'),sensitive:false};
  const ss=sentences(clean),ds=dates(clean),ms=money(clean),ps=phones(clean),es=emails(clean),us=urls(clean),acts=actionSentences(ss),qs=questionSentences(ss,q);
  const out=[];out.push(tx(`This appears to be a ${kind(clean)}.`,`Esto parece ser un ${kind(clean)}.`));
  if(ds.length)out.push(tx(`Dates shown: ${ds.slice(0,5).join(', ')}.`,`Fechas mostradas: ${ds.slice(0,5).join(', ')}.`));
  if(ms.length)out.push(tx(`Amounts shown: ${ms.slice(0,5).join(', ')}.`,`Montos mostrados: ${ms.slice(0,5).join(', ')}.`));
  if(q&&qs.length)out.push(tx(`Most relevant text for your question: ${qs.join(' ')}`,`Texto más relevante para su pregunta: ${qs.join(' ')}`));
  else if(acts.length)out.push(tx(`The clearest action or deadline language I found is: ${acts.slice(0,2).join(' ')}`,`El lenguaje de acción o plazo más claro que encontré es: ${acts.slice(0,2).join(' ')}`));
  else if(ss.length)out.push(tx(`The document begins by saying: ${ss.slice(0,2).join(' ')}`,`El documento comienza diciendo: ${ss.slice(0,2).join(' ')}`));
  const contacts=[ps.length?tx(`Phone: ${ps.join(', ')}`,`Teléfono: ${ps.join(', ')}`):'',es.length?tx(`Email: ${es.join(', ')}`,`Correo: ${es.join(', ')}`):'',us.length?tx(`Website: ${us.join(', ')}`,`Sitio web: ${us.join(', ')}`):''].filter(Boolean);if(contacts.length)out.push(contacts.join(' · ')+'.');
  if(/\b(deadline|due|appeal|hearing|court|summons|notice|vence|plazo|apelacion|audiencia|tribunal|citacion|aviso)\b/i.test(clean))out.push(tx('Because this may involve a deadline or formal notice, confirm the exact date and required action with the issuing organization or an appropriate professional before relying on this reading.','Como esto puede incluir un plazo o aviso formal, confirme la fecha exacta y la acción requerida con la organización emisora o un profesional adecuado antes de depender de esta lectura.'));
  return{text:out.join(' '),sensitive:sensitive(clean),kind:kind(clean),dates:ds,amounts:ms,phones:ps,emails:es,urls:us,actionCount:acts.length};
}
window.FranklinAssistantFilesR1293=Object.freeze({install:B.install,get:B.get,isBusy:B.isBusy,answer});
})();
