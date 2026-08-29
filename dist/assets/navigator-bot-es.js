(() => {
  const root=document.querySelector('[data-navigator-es]'); if(!root)return;
  const form=root.querySelector('form'),input=root.querySelector('input'),output=root.querySelector('[data-navigator-es-output]'),examples=[...root.querySelectorAll('[data-navigator-es-example]')];
  const routes=[
    {rx:/\b(911|emergencia|peligro|incendio|accidente grave)\b/i,title:'Ayuda urgente',text:'Si hay peligro inmediato o una emergencia, llame al 911. Para una crisis de salud mental o consumo de sustancias, llame o envíe un mensaje de texto al 988.',href:'/es/centro-de-ayuda/',label:'Abrir Centro de ayuda'},
    {rx:/\b(hoy|evento|reuni[oó]n|tr[aá]fico|carretera|cierre)\b/i,title:'Hoy en Franklin',text:'Revise los puntos de partida locales y confirme los detalles que cambian en la fuente oficial.',href:'/es/hoy/',label:'Ver Hoy en Franklin'},
    {rx:/\b(escuela|inscripci[oó]n|distrito escolar|niñ|familia)\b/i,title:'Escuelas y familia',text:'Use la guía local y confirme la escuela, el calendario y los requisitos con el distrito correcto.',href:'/es/ayuda-cotidiana/',label:'Abrir ayuda cotidiana'},
    {rx:/\b(casa|vivienda|renta|alquiler|propiedad|permiso|hipoteca|hoa)\b/i,title:'Vivienda y propiedad',text:'Empiece con la guía de vivienda y propiedad; mantenga nombres, direcciones exactas y documentos privados fuera de esta página.',href:'/es/ayuda-vivienda/',label:'Abrir ayuda de vivienda'},
    {rx:/\b(abogado|legal|tribunal|corte|derecho)\b/i,title:'Ayuda legal',text:'Prepare preguntas generales y use fuentes oficiales. Franklin Navigator no ofrece asesoría legal.',href:'/es/ayuda-legal/',label:'Abrir ayuda legal'},
    {rx:/\b(salud|m[eé]dico|hospital|seguro|crisis)\b/i,title:'Salud y cuidado',text:'Encuentre un punto de partida local sin compartir información médica privada aquí.',href:'/es/ayuda-salud/',label:'Abrir ayuda de salud'},
    {rx:/\b(auto|carro|veh[ií]culo|t[ií]tulo|registro|reparaci[oó]n)\b/i,title:'Auto y vehículo',text:'Prepare el próximo paso y confirme requisitos o información de seguridad en la fuente oficial.',href:'/es/ayuda-vehiculo/',label:'Abrir ayuda de vehículo'},
    {rx:/\b(negocio|empresa|cliente|membres[ií]a|crecer|perfil)\b/i,title:'Para negocios',text:'Revise su presencia pública y las herramientas de crecimiento. La membresía pagada no está abierta hoy.',href:'/es/negocios/',label:'Abrir Para negocios'},
    {rx:/\b(hacer|terminar|tr[aá]mite|pasos|licencia)\b/i,title:'Hacerlo en Franklin',text:'Convierta una necesidad común en pasos claros y continúe al destino oficial.',href:'/es/hacerlo/',label:'Abrir Hacerlo'},
    {rx:/\b(directorio|buscar|restaurante|plomero|contador|servicio|profesional)\b/i,title:'Directorio local',text:'Busque opciones locales verificadas contra fuentes públicas. Los resultados no son rankings ni recomendaciones.',href:'/es/directorio/',label:'Abrir directorio'}
  ];
  const render=value=>{const q=String(value||'').trim();output.replaceChildren();const match=routes.find(r=>r.rx.test(q))||{title:'Caminos locales',text:'Elija una necesidad cotidiana y continúe a una guía o fuente oficial. No se envía ni guarda lo que escribe aquí.',href:'/es/caminos-locales/',label:'Ver caminos locales'};const h=document.createElement('h2');h.textContent=match.title;const p=document.createElement('p');p.textContent=match.text;const a=document.createElement('a');a.className='button primary';a.href=match.href;a.textContent=match.label;output.append(h,p,a)};
  form.addEventListener('submit',e=>{e.preventDefault();render(input.value);output.focus()});
  examples.forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.navigatorEsExample||b.textContent;render(input.value)}));
})();
