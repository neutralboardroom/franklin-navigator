'use strict';
(()=>{
  const STORAGE_KEY='franklinLanguage';
  const SKIP=new Set(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA']);
  let translations={},categories={},language='en',ready=false,processing=false;
  const textOriginal=new WeakMap(),textApplied=new WeakMap(),attrOriginal=new WeakMap();
  const normalize=s=>String(s??'').replace(/\s+/g,' ').trim();
  const trimWrap=(raw,value)=>{
    const m=String(raw).match(/^(\s*)([\s\S]*?)(\s*)$/);return (m?.[1]||'')+value+(m?.[3]||'');
  };
  function special(s){
    if(categories[s])return categories[s];
    const fixed={
      'One simple membership.':'Una membresía sencilla.',
      'One simple membership':'Una membresía sencilla',
      'Franklin Navigator Community Membership':'Membresía Comunitaria de Franklin Navigator',
      '$35/year':'$35/año',
      'per year':'por año',
      'Renews annually until canceled':'Se renueva anualmente hasta que se cancele',
      'Renews annually until canceled.':'Se renueva anualmente hasta que se cancele.',
      'Franklin Navigator Community Membership — $35/year. Renews annually until canceled.':'Membresía Comunitaria de Franklin Navigator — $35/año. Se renueva anualmente hasta que se cancele.',
      'Basic factual corrections and requests to remove a profile from public view are free. No membership or payment is required.':'Las correcciones factuales básicas y las solicitudes para retirar un perfil de la vista pública son gratuitas. No se requiere membresía ni pago.',
      'Factual corrections and requests to remove a profile from public view are free and do not require membership. Membership does not buy factual accuracy, ranking, endorsement, credentials, leads or guaranteed results.':'Las correcciones factuales y las solicitudes para retirar un perfil de la vista pública son gratuitas y no requieren membresía. La membresía no compra exactitud factual, clasificación, respaldo, credenciales, clientes potenciales ni resultados garantizados.',
      'Continue — $35/year':'Continuar — $35/año',
      'Profile verified. Franklin Navigator Community Membership is $35/year and renews annually until canceled.':'Perfil verificado. La Membresía Comunitaria de Franklin Navigator cuesta $35/año y se renueva anualmente hasta que se cancele.',
      'Profile photo viewer':'Visor de fotos del perfil',
      'Close photo':'Cerrar foto',
      'See all photos':'Ver todas las fotos',
      'At a glance':'De un vistazo',
      'Helpful links':'Enlaces útiles',
      'Photos':'Fotos',
      'Management verified':'Administración verificada',
      'Management verified for you':'Administración verificada para usted',
      'Management not yet verified':'Administración aún no verificada',
      'Official Franklin Navigator profile':'Perfil oficial de Franklin Navigator',
      'Upload your own image':'Subir su propia imagen',
      'Claim this profile free to upload your own photo or logo.':'Reclame este perfil gratis para subir su propia foto o logotipo.',
      'Open Profile Center':'Abrir Centro de Perfil',
      'Open reviewer workspace':'Abrir espacio privado de revisión',
      'Private reviewer access is available for this authorized account.':'El acceso privado de revisión está disponible para esta cuenta autorizada.',

      'Access request pending':'Solicitud de acceso pendiente',
      'Check access request':'Revisar solicitud de acceso',
      'Access review needed':'Se necesita revisar el acceso',
      'Get profile access help':'Obtener ayuda con el acceso al perfil',
      'Request management access':'Solicitar acceso de administración',
      'Withdraw access request':'Retirar solicitud de acceso',
      'Request a factual correction':'Solicitar una corrección factual',
      'Need help signing in?':'¿Necesita ayuda para iniciar sesión?', 'Forgot password?':'¿Olvidó su contraseña?', 'Claim this profile':'Reclamar este perfil', 'Claim or manage this profile':'Reclamar o administrar este perfil', 'Review / correct this profile':'Revisar / corregir este perfil', 'Can’t access your email? Get account help':'¿No puede acceder a su correo? Obtenga ayuda con la cuenta', 'Send password-reset instructions':'Enviar instrucciones para restablecer la contraseña', 'Reset your password':'Restablecer su contraseña', 'Choose a new password':'Elija una nueva contraseña', 'Continue to profile access':'Continuar al acceso del perfil',
      'Correct a profile without signing in':'Corregir un perfil sin iniciar sesión',
      'Get profile access support':'Obtener ayuda con el acceso al perfil',
      'Access help':'Ayuda con el acceso',
      'Send support request':'Enviar solicitud de soporte',
      'Your selected profile':'Su perfil seleccionado',
      'Your selected profile stays with you through sign-in and access review. You do not need to search for it again.':'Su perfil seleccionado se conserva durante el inicio de sesión y la revisión de acceso. No necesita buscarlo de nuevo.',
      'Continue with this profile':'Continuar con este perfil',
      'This exact profile is selected.':'Este perfil exacto está seleccionado.',
      'Franklin checks your account and access state before showing the next action. Selecting this profile does not claim it or change public facts.':'Franklin revisa el estado de su cuenta y acceso antes de mostrar la siguiente acción. Seleccionar este perfil no lo reclama ni cambia los datos públicos.',
      'Profile access requests and factual corrections/removal are free. Community Membership is optional.':'Las solicitudes de acceso al perfil y las correcciones factuales o el retiro son gratuitos. La Membresía Comunitaria es opcional.',
      'Choose the next action below. Selecting this result does not claim the profile or change public facts.':'Elija la siguiente acción abajo. Seleccionar este resultado no reclama el perfil ni cambia los datos públicos.',
      'Claim/access verification and factual corrections/removal are free. Community Membership is optional.':'La verificación de reclamo/acceso y las correcciones factuales o el retiro son gratuitos. La Membresía Comunitaria es opcional.',
      'Choose this profile':'Elegir este perfil',
      'Profile access verified. You can manage this profile now.':'Acceso al perfil verificado. Ahora puede administrar este perfil.',
      'Profile access is not yet verified. Complete free management verification before membership can continue.':'El acceso al perfil aún no está verificado. Complete la verificación gratuita de administración antes de continuar con la membresía.',
      'Continue free profile access':'Continuar con el acceso gratuito al perfil',
      'This profile has an access dispute. Contact support so Franklin can review it safely.':'Este perfil tiene una disputa de acceso. Contacte soporte para que Franklin pueda revisarla de forma segura.',
      'Get profile support':'Obtener ayuda con el perfil',
      'Stop managing this profile':'Dejar de administrar este perfil',
      'Your profile-access request is waiting for review.':'Su solicitud de acceso al perfil está pendiente de revisión.',
      'Refresh status':'Actualizar estado',
      'Submit access request':'Enviar solicitud de acceso',
      'Submit updated access request':'Enviar solicitud de acceso actualizada',
      'I confirm that I own, manage, work for, or am otherwise authorized to act for this profile.':'Confirmo que soy propietario, administrador, trabajo para esta organización o estoy autorizado para actuar en nombre de este perfil.',
      'Free profile access':'Acceso gratuito al perfil',
      'Confirm that you are authorized to manage this profile.':'Confirme que está autorizado para administrar este perfil.',
      'Claiming and basic profile management are free. Franklin reviews access before management tools are enabled; a claim never changes public facts by itself.':'Reclamar y administrar un perfil básico es gratuito. Franklin revisa el acceso antes de habilitar las herramientas de administración; una solicitud de acceso no cambia por sí sola los datos públicos.',
      'This profile has an access dispute. Franklin will not accept another access request until the dispute is reviewed.':'Este perfil tiene una disputa de acceso. Franklin no aceptará otra solicitud de acceso hasta que se revise la disputa.',
      'View public profile':'Ver perfil público',
      'Submit a factual correction':'Enviar una corrección factual',
      'Franklin needs more information before this access request can be approved.':'Franklin necesita más información antes de aprobar esta solicitud de acceso.',
      'The previous access request was not approved. You may submit new evidence if you are authorized.':'La solicitud de acceso anterior no fue aprobada. Puede enviar nueva evidencia si está autorizado.',
      'Previous management access ended. You may request access again if you are currently authorized.':'El acceso de administración anterior terminó. Puede solicitar acceso de nuevo si actualmente está autorizado.',
      'Official website or public page showing your connection':'Sitio web oficial o página pública que muestre su relación',
      'How are you authorized to manage this profile?':'¿Cómo está autorizado para administrar este perfil?',
      'Profile Center':'Centro de Perfil',
      'Your verified access lets you manage the profile relationship, request factual corrections or removal, and submit a profile photo or logo for review. Public factual information is reviewed separately and is not changed merely because you manage the profile.':'Su acceso verificado le permite administrar la relación con el perfil, solicitar correcciones factuales o retiro y enviar una foto o logotipo del perfil para revisión. La información factual pública se revisa por separado y no cambia simplemente porque usted administre el perfil.',
      'Request removal':'Solicitar retiro',
      'Account & profile access':'Cuenta y acceso al perfil',
      'Transfer or end management — contact support':'Transferir o finalizar la administración — contactar soporte',
      'Community Member tools':'Herramientas para Miembros de la Comunidad',
      'Your annual Community Member recognition':'Su reconocimiento anual como Miembro de la Comunidad',
      'Your digital current-year recognition and public verification page are active. This does not affect free profile-management rights.':'Su reconocimiento digital del año actual y la página pública de verificación están activos. Esto no afecta sus derechos gratuitos de administración del perfil.',
      'View public verification page':'Ver página pública de verificación',
      'Physical window-decal pilot is not currently open. Your digital recognition remains active.':'El programa piloto de calcomanías para ventana no está abierto actualmente. Su reconocimiento digital permanece activo.',
      'Window decal — confirm a private mailing address. Franklin will not copy the public profile address automatically.':'Calcomanía para ventana — confirme una dirección postal privada. Franklin no copiará automáticamente la dirección pública del perfil.',
      'This mailing address is private fulfillment information and is not published on the profile.':'Esta dirección postal es información privada para el envío y no se publica en el perfil.',
      'Confirm mailing address':'Confirmar dirección postal',
      'Request current-year window decal':'Solicitar calcomanía del año actual',
      'Current-year window decal requested. No second decal request is needed.':'La calcomanía del año actual fue solicitada. No es necesario hacer una segunda solicitud.',
      'Current decal batch is temporarily out of stock. Your digital recognition remains active.':'El lote actual de calcomanías está temporalmente agotado. Su reconocimiento digital permanece activo.',
      'Community Membership verification':'Verificación de Membresía Comunitaria',
      'Verify annual participation.':'Verifique la participación anual.',
      'This page shows live Franklin Navigator Community Membership status for the selected profile. A printed decal is not the source of truth.':'Esta página muestra el estado actual de la Membresía Comunitaria de Franklin Navigator para el perfil seleccionado. Una calcomanía impresa no es la fuente oficial del estado.',
      'Current Community Membership':'Membresía Comunitaria actual',
      'Community Membership participation':'Participación en la Membresía Comunitaria',
      'Verify Community Membership':'Verificar Membresía Comunitaria',
      'View Franklin Navigator profile':'Ver perfil de Franklin Navigator',
      'Choose a valid Franklin Navigator profile to verify.':'Elija un perfil válido de Franklin Navigator para verificar.',
      'This membership verification is unavailable right now. The profile page remains the safe fallback.':'La verificación de membresía no está disponible en este momento. La página del perfil sigue siendo la alternativa segura.',
      'Annual current-year Community Member recognition and, while the physical program is available, eligibility to request one dated storefront window decal':'Reconocimiento anual del año actual como Miembro de la Comunidad y, mientras el programa físico esté disponible, elegibilidad para solicitar una calcomanía fechada para el escaparate',
      'Build the richer member profile.':'Complete el perfil de miembro más detallado.',
      'Optional Community Membership':'Membresía Comunitaria opcional',
      'Want a richer profile?':'¿Quiere un perfil más completo?',
      'Community Membership is $35/year. It adds the richer reviewed profile, cover/gallery media and additional member tools. It is not required for accuracy, claim access, profile removal or your basic profile photo/logo.':'La Membresía Comunitaria cuesta $35/año. Añade un perfil revisado más completo, imágenes de portada/galería y herramientas adicionales para miembros. No se requiere para la exactitud, el acceso de administración, el retiro del perfil ni la foto o logotipo básico del perfil.',
      'See Community Membership — $35/year':'Ver Membresía Comunitaria — $35/año',
      'Preview member profile':'Ver perfil de miembro',
      'Profile management is free':'La administración del perfil es gratuita',
      'Claiming a profile, requesting factual corrections or removal, and managing an approved profile photo/logo do not require Community Membership.':'Reclamar un perfil, solicitar correcciones factuales o retiro y administrar una foto o logotipo aprobado no requieren Membresía Comunitaria.',
      'See optional Community Membership':'Ver Membresía Comunitaria opcional',
      'Correct public facts':'Corregir datos públicos',
      'Correct public facts instead':'Corregir datos públicos en su lugar',
      'Tip: a work or organization email can make profile verification easier when one is available. A personal email is still allowed.':'Consejo: un correo electrónico del trabajo o de la organización puede facilitar la verificación del perfil cuando esté disponible. También se permite un correo personal.',
      'Profile connected to your account. Next, confirm that you are authorized to manage it.':'Perfil conectado a su cuenta. A continuación, confirme que está autorizado para administrarlo.',
      'No payment or membership is required to connect a profile and request management access.':'No se requiere pago ni membresía para conectar un perfil y solicitar acceso de administración.',
      'Profile-access status refreshed.':'Estado de acceso al perfil actualizado.',
      'Your profile-access request was withdrawn. No membership or payment was changed.':'Su solicitud de acceso al perfil fue retirada. No se modificó ninguna membresía ni pago.',
      'Your free profile-access request is saved and waiting for review. No membership or payment was started.':'Su solicitud gratuita de acceso al perfil fue guardada y está pendiente de revisión. No se inició ninguna membresía ni pago.',
      'Claiming and basic profile management are free. Franklin reviews access before Profile Center tools are enabled; a claim never changes public facts by itself.':'Reclamar y administrar un perfil básico es gratuito. Franklin revisa el acceso antes de habilitar las herramientas del Centro de Perfil; una solicitud de acceso no cambia por sí sola los datos públicos.',
      'Your request is under review. Check it through free Profile Access. No membership or payment is required.':'Su solicitud está en revisión. Revísela mediante el acceso gratuito al perfil. No se requiere membresía ni pago.',
      'Get free access to manage your public profile on Franklin Navigator.':'Obtenga acceso gratuito para administrar su perfil público en Franklin Navigator.',
      'This exact public listing stays selected through sign-in, password recovery, and access review.':'Esta ficha pública exacta permanece seleccionada durante el inicio de sesión, la recuperación de contraseña y la revisión de acceso.',
      'Wrong profile? Choose another':'¿Perfil equivocado? Elija otro',
      'Connecting profile…':'Conectando perfil…',
      'Ready to connect this exact profile.':'Listo para conectar este perfil exacto.',
      'Retry connection':'Reintentar conexión',
      'Get help':'Obtener ayuda',
      'Submitting access request…':'Enviando solicitud de acceso…',
      'Correct factual listing details':'Corregir datos factuales de la ficha',
      'Use at least 8 characters. Long passwords and passphrases are welcome.':'Use al menos 8 caracteres. Se permiten contraseñas largas y frases de contraseña.',
      'Check your email':'Revise su correo electrónico',
      'If an account exists for this email, password-reset instructions have been sent.':'Si existe una cuenta para este correo, se han enviado instrucciones para restablecer la contraseña.',
      'Password changed successfully.':'Contraseña cambiada correctamente.',
      'Free profile management':'Administración gratuita del perfil',
      'Claiming and basic profile management are free. Start with the exact business, professional practice or organization name, then sign in or create an account and verify that you manage it. Community Membership is optional.':'Reclamar y administrar un perfil básico es gratuito. Comience con el nombre exacto de la empresa, práctica profesional u organización; luego inicie sesión o cree una cuenta y verifique que la administra. La Membresía Comunitaria es opcional.',
      'Find profile':'Buscar perfil',
      'Sign in':'Iniciar sesión',
      'Verify management':'Verificar administración',
      'Verification pending':'Verificación pendiente',
      'Manage profile':'Administrar perfil',
      'Already have verified access? Open Profile Center.':'¿Ya tiene acceso verificado? Abra el Centro de Perfil.',
      'Business, professional practice or organization name':'Nombre de empresa, práctica profesional u organización',
      'Start with the exact name. Category or location can help if needed.':'Comience con el nombre exacto. La categoría o ubicación puede ayudar si es necesario.',
      'Find my profile':'Buscar mi perfil',
      'Exact name':'Nombre exacto',
      'Can’t find it?':'¿No lo encuentra?',
      'Request a free public profile':'Solicitar un perfil público gratuito',
      'After it is available, you can verify management access for free.':'Cuando esté disponible, puede verificar el acceso de administración gratuitamente.',
      'Profile claim and basic management are free. Factual corrections/removal are free. Community Membership is optional.':'Reclamar y administrar un perfil básico es gratuito. Las correcciones factuales y el retiro son gratuitos. La Membresía Comunitaria es opcional.',
      'Next: sign in or create an account, then verify management. Basic profile management is free.':'Siguiente: inicie sesión o cree una cuenta y luego verifique la administración. La administración básica del perfil es gratuita.',
      'Free alternatives':'Alternativas gratuitas',
      'Optional':'Opcional',
      'See Community Membership benefits':'Ver beneficios de la Membresía Comunitaria',
      '1 matching profile found':'Se encontró 1 perfil coincidente',
      'Your management request is being reviewed.':'Su solicitud de administración está siendo revisada.',
      'Waiting for review':'En espera de revisión',
      'Access request submitted':'Solicitud de acceso enviada',
      'Franklin reviews the submitted evidence. After approval, Profile Center becomes available. No payment is required.':'Franklin revisa la evidencia enviada. Después de la aprobación, el Centro de Perfil estará disponible. No se requiere pago.',
      'What counts as proof?':'¿Qué sirve como prueba?',
      'Use a reliable public source showing your connection or authority, such as an official website or team page, an organization page naming your role, an official public contact channel, or another reliable public source. No website? Another official public page can be used; verification support can help with other cases.':'Use una fuente pública confiable que muestre su relación o autoridad, como un sitio web oficial o página del equipo, una página de la organización que indique su función, un canal público oficial de contacto u otra fuente pública confiable. ¿No tiene sitio web? Puede usar otra página pública oficial; el soporte de verificación puede ayudar con otros casos.',
      'Use website already on this profile':'Usar el sitio web que ya aparece en este perfil',
      'Submitting…':'Enviando…',
      'Submitting your request. Please keep this page open.':'Enviando su solicitud. Mantenga esta página abierta.',
      'We could not confirm whether your request was received. Do not submit again yet. Refresh the page or status first; if it remains unclear, contact verification support.':'No pudimos confirmar si recibimos su solicitud. No la envíe de nuevo todavía. Primero actualice la página o el estado; si sigue sin estar claro, contacte con soporte de verificación.',
      'Help with verification':'Ayuda con la verificación',
      'Withdraw this profile-access request? You can request access again later if you remain authorized.':'¿Retirar esta solicitud de acceso al perfil? Puede volver a solicitar acceso más adelante si sigue autorizado.',
      'You’re signed in.':'Ha iniciado sesión.',
      'Profile management is free':'La administración del perfil es gratuita'
    };
    if(fixed[s])return fixed[s];
    let m;
    if((m=s.match(/^(\d{4}) Community Member$/)))return `${m[1]} Miembro de la Comunidad`;
    if((m=s.match(/^Past Community Member — (\d{4})$/)))return `Miembro anterior de la Comunidad — ${m[1]}`;
    if((m=s.match(/^Participation years: (.+)$/)))return `Años de participación: ${m[1]}`;
    if((m=s.match(/^Current Community Membership: (active|not active)$/)))return `Membresía Comunitaria actual: ${m[1]==='active'?'activa':'no activa'}`;
    if((m=s.match(/^Open profile photo (\d+) of (\d+)$/)))return `Abrir foto del perfil ${m[1]} de ${m[2]}`;
    if((m=s.match(/^Signed in as (.+)\.$/)))return `Sesión iniciada como ${m[1]}.`;
    if((m=s.match(/^Management access verified (.+)\.$/)))return `Acceso de administración verificado ${m[1]}.`;
    if((m=s.match(/^Selected profile: (.+)\. Sign in or create a free account to continue with this exact profile\. You will not need to search again\.$/)))return `Perfil seleccionado: ${m[1]}. Inicie sesión o cree una cuenta gratuita para continuar con este perfil exacto. No tendrá que buscarlo de nuevo.`;
    if((m=s.match(/^Your profile-access request is waiting for review\. Last updated (.+)\.$/)))return `Su solicitud de acceso al perfil está pendiente de revisión. Última actualización: ${m[1]}.`;
    if((m=s.match(/^Verify that you manage (.+)$/)))return `Verifique que administra ${m[1]}`;
    if((m=s.match(/^Continue managing (.+)\.$/)))return `Continúe administrando ${m[1]}.`;
    if((m=s.match(/^(✓ )?(1|2|3|4) (Exact profile|Account|Verify management|Verification pending|Profile Center)( — Current)?$/))){
      const labels={'Exact profile':'Perfil exacto','Account':'Cuenta','Verify management':'Verificar administración','Verification pending':'Verificación pendiente','Profile Center':'Centro de Perfil'};
      return `${m[1]||''}${m[2]} ${labels[m[3]]}${m[4]?' — Actual':''}`;
    }
    if((m=s.match(/^Your request to manage (.+) has been received\. Franklin will review it; Profile Center becomes available after approval\. No payment is required\.$/)))return `Su solicitud para administrar ${m[1]} ha sido recibida. Franklin la revisará; el Centro de Perfil estará disponible después de la aprobación. No se requiere pago.`;
    if((m=s.match(/^You’re signed in\. Next, verify that you manage (.+)\.$/)))return `Ha iniciado sesión. A continuación, verifique que administra ${m[1]}.`;
    if((m=s.match(/^Management access verified for (.+)\.$/)))return `Acceso de administración verificado para ${m[1]}.`;
    if((m=s.match(/^Your request to manage (.+) has been received\.$/)))return `Su solicitud para administrar ${m[1]} ha sido recibida.`;
    if((m=s.match(/^(\d+) matching profiles found$/)))return `Se encontraron ${m[1]} perfiles coincidentes`;
    if((m=s.match(/^Selected: (.+)$/)))return `Seleccionado: ${m[1]}`;
    if((m=s.match(/^Continue with (.+)$/)))return `Continuar con ${m[1].replace('/month','/mes').replace('/year','/año')}`;
    if((m=s.match(/^Explore (.+)$/)))return `Explorar ${categories[m[1]]||m[1]}`;
    if((m=s.match(/^Last checked (.+)$/)))return `Última verificación: ${m[1]}`;
    if((m=s.match(/^checked (.+)$/i)))return `verificado ${m[1]}`;
    if((m=s.match(/^Franklin Navigator has public-source identity, category and location information for (.+)\. A richer description has not been added from a current public source or the organization\.$/)))return `Franklin Navigator tiene información de identidad, categoría y ubicación de fuentes públicas para ${m[1]}. No se ha añadido una descripción más detallada desde una fuente pública actual o la organización.`;
    if((m=s.match(/^(.+?) — (.+?) in the Franklin area\. Public source details and contact options\.$/)))return `${m[1]} — ${categories[m[2]]||m[2]} en el área de Franklin. Detalles de fuentes públicas y opciones de contacto.`;
    if((m=s.match(/^Current named member\/resource serving the Williamson, Inc\. directory community; a street address is not asserted by the cited source\.$/)))return 'Miembro o recurso actual incluido en el directorio de Williamson, Inc.; la fuente citada no afirma una dirección específica.';
    if((m=s.match(/^Current named resource in City of Franklin's official public sitemap\/directory; street address is not asserted by the cited source\.$/)))return 'Recurso actual incluido en el mapa del sitio o directorio público oficial de la Ciudad de Franklin; la fuente citada no afirma una dirección específica.';
    if((m=s.match(/^Current named resource in the assigned community's official public directory; street address is not asserted by the cited source\.$/)))return 'Recurso actual incluido en el directorio público oficial de la comunidad; la fuente citada no afirma una dirección específica.';
    if((m=s.match(/^Current named resource in the assigned community; exact street address not asserted by the cited source\.$/)))return 'Recurso actual de la comunidad; la fuente citada no afirma una dirección exacta.';
    return null;
  }
  function translated(s){
    const n=normalize(s); if(!n)return null;
    return translations[n]??special(n);
  }
  function applyText(node){
    if(!node?.parentElement||SKIP.has(node.parentElement.tagName)||node.parentElement.closest('[data-franklin-native-locale]'))return;
    if(!textOriginal.has(node))textOriginal.set(node,node.nodeValue);
    const en=textOriginal.get(node);
    const t=language==='en'?en:(translated(en)??en);
    const desired=language==='en'?en:trimWrap(en,t);
    textApplied.set(node,desired);
    if(node.nodeValue!==desired)node.nodeValue=desired;
  }
  function attrMap(el){let m=attrOriginal.get(el);if(!m){m=new Map();attrOriginal.set(el,m)}return m}
  function applyAttr(el,name){
    if(el.closest?.('[data-franklin-native-locale]'))return;
    const value=el.getAttribute(name);if(value==null)return;const map=attrMap(el);if(!map.has(name))map.set(name,value);const en=map.get(name);
    if(language==='en'){if(el.getAttribute(name)!==en)el.setAttribute(name,en);return}
    const t=translated(en);if(t!=null)el.setAttribute(name,t);
  }
  function applyMeta(el){if(el.tagName==='META'&&el.getAttribute('name')==='description')applyAttr(el,'content')}
  function walk(root=document){
    processing=true;
    try{
      if(root.nodeType===Node.ELEMENT_NODE&&root.closest('[data-franklin-native-locale]'))return;
      if(root.nodeType===Node.TEXT_NODE){applyText(root);return}
      if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
      if(root.nodeType===Node.ELEMENT_NODE){for(const a of ['title','aria-label','placeholder','alt'])applyAttr(root,a);applyMeta(root)}
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode(n){if(n.nodeType===Node.ELEMENT_NODE&&(SKIP.has(n.tagName)||n.hasAttribute('data-franklin-native-locale')))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT}});
      let n;while((n=walker.nextNode())){if(n.nodeType===Node.TEXT_NODE)applyText(n);else{for(const a of ['title','aria-label','placeholder','alt'])applyAttr(n,a);applyMeta(n)}}
      if(root===document||root===document.documentElement){document.documentElement.lang=language;document.title=language==='es'?(translated(document.title)||document.title):(attrOriginal.get(document.querySelector('title'))?.get('textContent')||document.title)}
    }finally{processing=false}
  }
  function setPressed(){document.querySelectorAll('[data-r37-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.r37Lang===language)))}
  function counterpart(lang){if(!document.body)return null;return lang==='es'?document.body.dataset.r37EsPath:document.body.dataset.r37EnPath}
  function preserveSuffix(path){const p=new URLSearchParams(location.search);if(p.has('lang'))p.set('lang',language);return path+(p.toString()?'?'+p:'')+location.hash}
  function setLanguage(lang,{save=true,navigate=true}={}){language=lang==='es'?'es':'en';if(save){try{localStorage.setItem(STORAGE_KEY,language)}catch{}}const target=counterpart(language);if(navigate&&target&&target!==location.pathname){location.assign(preserveSuffix(target));return}if(save&&new URLSearchParams(location.search).has('lang')){try{history.replaceState(history.state,'',preserveSuffix(location.pathname))}catch{}}document.documentElement.lang=language;setPressed();withObserverPaused(()=>{walk(document.body);applyHead()});window.dispatchEvent(new CustomEvent('franklinlanguagechange',{detail:{language}}))}
  function applyHead(){
    const title=document.querySelector('title');if(title){if(!title.dataset.r37En)title.dataset.r37En=title.textContent;title.textContent=language==='es'?(translated(title.dataset.r37En)||title.dataset.r37En):title.dataset.r37En}
    document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[property="og:title"]').forEach(el=>applyAttr(el,'content'));
  }
  async function load(){
    const [t,c]=await Promise.all([
      fetch('/data/r37-es-public-strings.json',{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error('translation catalog');return r.json()}),
      fetch('/data/r37-es-profile-categories.json',{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error('category catalog');return r.json()}),
    ]);
    translations=t.translations||{};categories=c.categories||{};ready=true;
  }
  function bindControls(){document.querySelectorAll('[data-r37-lang]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.r37Lang)))}
  let observing=false;
  function observeBody(){if(document.body&&!observing){observer.observe(document.body,{childList:true,subtree:true,characterData:true});observing=true}}
  function withObserverPaused(fn){const was=observing;if(was){observer.disconnect();observing=false}try{return fn()}finally{if(was)observeBody()}}
  const observer=new MutationObserver(records=>{if(processing||!ready)return;observer.disconnect();observing=false;try{for(const rec of records){if(rec.type==='characterData'){const node=rec.target;textOriginal.set(node,node.nodeValue);applyText(node)}for(const n of rec.addedNodes)walk(n)}}finally{observeBody()}});
  window.FranklinI18n={get language(){return language},setLanguage,translate:s=>language==='es'?(translated(s)||s):s,category:s=>language==='es'?(categories[s]||s):s};
  document.addEventListener('DOMContentLoaded',async()=>{
    bindControls();
    let saved=null;try{saved=localStorage.getItem(STORAGE_KEY)}catch{}
    const legacyEs=location.pathname==='/es/'||location.pathname.startsWith('/es/');
    const explicit=new URLSearchParams(location.search).get('lang');language=explicit==='en'||explicit==='es'?explicit:(saved==='en'||saved==='es'?saved:(legacyEs?'es':'en'));document.documentElement.lang=language;setPressed();
    const route=counterpart(language);if(route&&route!==location.pathname){location.replace(preserveSuffix(route));return}
    try{await load();setLanguage(language,{save:false,navigate:false});observeBody()}
    catch{document.documentElement.lang=language;setPressed()}
  });
  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.querySelector('[data-navigator-bot],[data-r38-assistant-plans]'))return;
    if(document.querySelector('script[data-r40-assistant-practical]'))return;
    const practical=document.createElement('script');practical.src='/assets/r40-assistant-practical.js';practical.defer=true;practical.dataset.r40AssistantPractical='1';
    practical.addEventListener('load',()=>{if(document.querySelector('script[data-r40-assistant-safety-guard]'))return;const guard=document.createElement('script');guard.src='/assets/r40-assistant-safety-guard.js';guard.defer=true;guard.dataset.r40AssistantSafetyGuard='1';document.head.append(guard)});
    document.head.append(practical);
  });
})();
