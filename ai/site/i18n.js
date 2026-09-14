(() => {
  const languages = [
    ['auto', 'Auto'], ['en', 'English'], ['ar', 'العربية'], ['es', 'Español'], ['fr', 'Français'],
    ['de', 'Deutsch'], ['pt', 'Português'], ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어'],
    ['hi', 'हिन्दी'], ['tr', 'Türkçe'], ['ru', 'Русский'], ['it', 'Italiano'], ['nl', 'Nederlands'],
    ['id', 'Bahasa Indonesia'], ['vi', 'Tiếng Việt'], ['th', 'ไทย'], ['pl', 'Polski'], ['uk', 'Українська'],
    ['fa', 'فارسی'], ['ur', 'اردو'], ['bn', 'বাংলা'], ['he', 'עברית']
  ];

  const dict = {
    en: {
      workspace: 'Workspace', newSession: 'New session', newChat: 'New session', ask: 'Ask', research: 'Research', evidence: 'Evidence', trust: 'Trust layer', recent: 'RECENT',
      browserRuntime: 'Browser runtime', trustReady: 'Evidence + trust ready', news: 'News', trustVerify: 'Trust Verify', docs: 'Docs',
      client: 'Client-side intelligence', connect: 'Connect wallet', eyebrow: 'INTELLIGENCE WORKSPACE', think: 'Think.', verify: 'Verify.',
      hero: 'A research surface that retrieves evidence and turns important AI outputs into structured, verifiable receipts.',
      analyze: 'Analyze', build: 'Build', anything: 'Ask anything…', evidenceAware: 'Evidence aware', helper: 'Browser-first · API optional', askButton: 'Ask', tryIt: 'Try',
      response: 'RESPONSE', liveRun: 'Live run', sources: 'SOURCES', outputHash: 'OUTPUT HASH', sign: 'Sign EIP-712', receipt: 'Receipt', attest: 'Attest EAS',
      workflow: '01 / WORKFLOW', searchTrail: 'Search the web.\nKeep the trail.', attached: 'Evidence attached.', attachedBody: 'The answer keeps source records beside it so the result has a traceable evidence layer.',
      receipts: 'Structured receipts.', receiptsBody: 'NOVEN hashes the question, answer, evidence, model/runtime and dataset layer into a portable receipt.',
      independent: 'Independent verification.', independentBody: 'A wallet can sign the receipt with EIP-712; selected runs can be published as EAS attestations on Sepolia.',
      trustKicker: '02 / TRUST LAYER', trustTitle: 'Blockchain as a receipt.', trustBody: 'Web3 does not run the model. It records provenance around important outputs so another party can inspect what was signed or attested.',
      trustItems: ['Identity · wallet signer','Provenance · evidence hashes','Integrity · EIP-712 receipt','Public record · EAS / Sepolia','Independent check · Trust Verify'],
      useSepolia: 'Use Sepolia', registerSchema: 'Register schema', exportReceipt: 'Export receipt',
      systemKicker: '03 / UNDER THE HOOD', discover: 'Discover', discoverBody: 'Pull records from public feeds and local knowledge.', cross: 'Cross-check', crossBody: 'Rank evidence before producing the result.',
      reason: 'Reason', reasonBody: 'Answer from the strongest available context.', attestUnder: 'Attest', attestBody: 'Hash, sign, export, and optionally attest.',
      footer: 'Intelligence workspace · verifiable AI experiment', language: 'Language', auto: 'Auto-detect', agentNetwork: 'Agent network', agentIdentity: 'Agent identity', reputation: 'Reputation', validation: 'Validation', payments: 'Payments',
      networkTitle: 'Open agent network.', networkBody: 'NOVEN is prepared to act as a verifiable AI agent with portable identity, reputation signals, validation hooks, and x402-ready service discovery.',
      registerAgent: 'Register NOVEN agent', agentReady: 'ERC-8004 ready', x402Ready: 'x402 ready', pending: 'Not registered yet', testnet: 'Sepolia testnet',
      registerNote: 'Registration is optional and requires a wallet transaction on Sepolia.', noWallet: 'Connect a wallet to continue.'
    },
    ar: { workspace:'مساحة العمل',newSession:'جلسة جديدة',newChat:'جلسة جديدة',ask:'سؤال',research:'بحث',evidence:'الأدلة',trust:'طبقة الثقة',recent:'الأخيرة',browserRuntime:'تشغيل عبر المتصفح',trustReady:'الأدلة + الثقة جاهزة',news:'الأخبار',trustVerify:'التحقق من الثقة',docs:'الوثائق',client:'ذكاء يعمل من جهة العميل',connect:'ربط المحفظة',eyebrow:'مساحة استخباراتية',think:'فكّر.',verify:'تحقّق.',hero:'مساحة بحث تجمع الأدلة وتحول مخرجات الذكاء الاصطناعي المهمة إلى سجلات منظمة قابلة للتحقق.',analyze:'تحليل',build:'خطة',anything:'اسأل أي شيء…',evidenceAware:'مدعوم بالأدلة',helper:'يعمل من المتصفح · API اختياري',askButton:'اسأل',tryIt:'جرّب',response:'الإجابة',liveRun:'تشغيل مباشر',sources:'المصادر',outputHash:'بصمة المخرج',sign:'توقيع EIP-712',receipt:'السجل',attest:'توثيق EAS',workflow:'01 / سير العمل',searchTrail:'ابحث في الويب.\nاحتفظ بالأثر.',attached:'الأدلة مرتبطة.',attachedBody:'تبقى سجلات المصادر بجانب الإجابة حتى تكون النتيجة قابلة للتتبع.',receipts:'سجلات منظمة.',receiptsBody:'ينشئ NOVEN بصمات للسؤال والإجابة والأدلة والنموذج وطبقة البيانات في سجل قابل للنقل.',independent:'تحقق مستقل.',independentBody:'يمكن للمحفظة توقيع السجل عبر EIP-712 ونشر التشغيلات المختارة كتزكيات EAS على Sepolia.',trustKicker:'02 / طبقة الثقة',trustTitle:'البلوكشين كسجل إثبات.',trustBody:'Web3 لا يشغّل النموذج بل يسجل مصدر مخرجات مهمة حتى يستطيع طرف آخر فحص ما تم توقيعه أو توثيقه.',trustItems:['الهوية · موقّع المحفظة','المصدر · بصمات الأدلة','السلامة · سجل EIP-712','السجل العام · EAS / Sepolia','فحص مستقل · Trust Verify'],useSepolia:'استخدم Sepolia',registerSchema:'تسجيل المخطط',exportReceipt:'تصدير السجل',systemKicker:'03 / تحت الغطاء',discover:'اكتشاف',discoverBody:'جلب سجلات من المصادر العامة والمعرفة المحلية.',cross:'تحقق متقاطع',crossBody:'ترتيب الأدلة قبل إنتاج الإجابة.',reason:'استدلال',reasonBody:'الإجابة من أقوى سياق متاح.',attestUnder:'توثيق',attestBody:'إنشاء البصمة والتوقيع والتصدير والتوثيق الاختياري.',footer:'مساحة استخباراتية · تجربة ذكاء اصطناعي قابلة للتحقق',language:'اللغة',auto:'اكتشاف تلقائي',agentNetwork:'شبكة الوكلاء',agentIdentity:'هوية الوكيل',reputation:'السمعة',validation:'التحقق',payments:'المدفوعات',networkTitle:'شبكة وكلاء مفتوحة.',networkBody:'NOVEN مهيأ ليعمل كوكيل ذكاء اصطناعي قابل للتحقق مع هوية محمولة وإشارات سمعة وآليات تحقق واكتشاف خدمات جاهز لـ x402.',registerAgent:'تسجيل وكيل NOVEN',agentReady:'جاهز لـ ERC-8004',x402Ready:'جاهز لـ x402',pending:'غير مسجل بعد',testnet:'شبكة Sepolia التجريبية',registerNote:'التسجيل اختياري ويتطلب معاملة من المحفظة على Sepolia.',noWallet:'اربط محفظة للمتابعة.'},
    es: { workspace:'Espacio de trabajo',newSession:'Nueva sesión',newChat:'Nueva sesión',ask:'Preguntar',research:'Investigar',evidence:'Evidencia',trust:'Capa de confianza',recent:'RECIENTE',browserRuntime:'Runtime del navegador',trustReady:'Evidencia + confianza listas',news:'Noticias',trustVerify:'Verificar confianza',docs:'Docs',client:'Inteligencia del cliente',connect:'Conectar wallet',eyebrow:'ESPACIO DE INTELIGENCIA',think:'Piensa.',verify:'Verifica.',hero:'Una superficie de investigación que recupera evidencia y convierte resultados importantes de IA en recibos verificables.',analyze:'Analizar',build:'Construir',anything:'Pregunta lo que quieras…',evidenceAware:'Con evidencia',helper:'Primero navegador · API opcional',askButton:'Preguntar',tryIt:'Prueba',response:'RESPUESTA',liveRun:'Ejecución en vivo',sources:'FUENTES',outputHash:'HASH DE SALIDA',sign:'Firmar EIP-712',receipt:'Recibo',attest:'Atestiguar EAS',workflow:'01 / FLUJO',searchTrail:'Busca en la web.\nConserva el rastro.',attached:'Evidencia adjunta.',attachedBody:'Las fuentes permanecen junto a la respuesta para mantener un rastro verificable.',receipts:'Recibos estructurados.',receiptsBody:'NOVEN genera hashes de pregunta, respuesta, evidencia, modelo/runtime y datos.',independent:'Verificación independiente.',independentBody:'Una wallet puede firmar el recibo con EIP-712 y publicar ejecuciones seleccionadas como atestaciones EAS en Sepolia.',trustKicker:'02 / CAPA DE CONFIANZA',trustTitle:'Blockchain como recibo.',trustBody:'Web3 no ejecuta el modelo. Registra la procedencia de resultados importantes.',trustItems:['Identidad · firmante','Procedencia · hashes','Integridad · recibo EIP-712','Registro público · EAS / Sepolia','Comprobación · Trust Verify'],useSepolia:'Usar Sepolia',registerSchema:'Registrar esquema',exportReceipt:'Exportar recibo',systemKicker:'03 / BAJO EL CAPÓ',discover:'Descubrir',discoverBody:'Extraer registros de fuentes públicas y locales.',cross:'Verificar',crossBody:'Ordenar evidencia antes de responder.',reason:'Razonar',reasonBody:'Responder con el contexto más sólido.',attestUnder:'Atestiguar',attestBody:'Hash, firma, exportación y atestación opcional.',footer:'Espacio de inteligencia · experimento de IA verificable',language:'Idioma',auto:'Detección automática',agentNetwork:'Red de agentes',agentIdentity:'Identidad',reputation:'Reputación',validation:'Validación',payments:'Pagos',networkTitle:'Red abierta de agentes.',networkBody:'NOVEN está preparado para actuar como agente de IA verificable con identidad portátil, reputación, validación y descubrimiento de servicios compatible con x402.',registerAgent:'Registrar agente NOVEN',agentReady:'Listo para ERC-8004',x402Ready:'Listo para x402',pending:'Aún no registrado',testnet:'Red de prueba Sepolia',registerNote:'El registro es opcional y requiere una transacción en Sepolia.',noWallet:'Conecta una wallet para continuar.'},
    fr: { workspace:'Espace de travail',newSession:'Nouvelle session',newChat:'Nouvelle session',ask:'Demander',research:'Recherche',evidence:'Preuves',trust:'Couche de confiance',recent:'RÉCENT',browserRuntime:'Runtime navigateur',trustReady:'Preuves + confiance prêtes',news:'Actualités',trustVerify:'Vérifier la confiance',docs:'Docs',client:'Intelligence côté client',connect:'Connecter le wallet',eyebrow:'ESPACE INTELLIGENT',think:'Pensez.',verify:'Vérifiez.',hero:'Une surface de recherche qui récupère des preuves et transforme les sorties importantes de l’IA en reçus vérifiables.',analyze:'Analyser',build:'Construire',anything:'Posez une question…',evidenceAware:'Avec preuves',helper:'Navigateur d’abord · API facultative',askButton:'Demander',tryIt:'Essayer',response:'RÉPONSE',liveRun:'Exécution en direct',sources:'SOURCES',outputHash:'HASH DE SORTIE',sign:'Signer EIP-712',receipt:'Reçu',attest:'Attester EAS',workflow:'01 / FLUX',searchTrail:'Cherchez sur le web.\nGardez la trace.',attached:'Preuves attachées.',attachedBody:'Les sources restent liées à la réponse pour conserver une traçabilité vérifiable.',receipts:'Reçus structurés.',receiptsBody:'NOVEN hache la question, la réponse, les preuves, le modèle/runtime et les données.',independent:'Vérification indépendante.',independentBody:'Un wallet peut signer le reçu avec EIP-712 et publier certains runs via EAS sur Sepolia.',trustKicker:'02 / COUCHE DE CONFIANCE',trustTitle:'La blockchain comme reçu.',trustBody:'Web3 n’exécute pas le modèle. Il enregistre la provenance des résultats importants.',trustItems:['Identité · signataire','Provenance · hashes','Intégrité · reçu EIP-712','Registre public · EAS / Sepolia','Contrôle indépendant · Trust Verify'],useSepolia:'Utiliser Sepolia',registerSchema:'Enregistrer le schéma',exportReceipt:'Exporter le reçu',systemKicker:'03 / SOUS LE CAPOT',discover:'Découvrir',discoverBody:'Charger des enregistrements publics et locaux.',cross:'Recouper',crossBody:'Classer les preuves avant la réponse.',reason:'Raisonner',reasonBody:'Répondre avec le meilleur contexte.',attestUnder:'Attester',attestBody:'Hacher, signer, exporter et attester si nécessaire.',footer:'Espace intelligent · expérience IA vérifiable',language:'Langue',auto:'Détection automatique',agentNetwork:'Réseau d’agents',agentIdentity:'Identité',reputation:'Réputation',validation:'Validation',payments:'Paiements',networkTitle:'Réseau ouvert d’agents.',networkBody:'NOVEN est prêt à devenir un agent IA vérifiable avec identité portable, réputation, validation et découverte de services x402.',registerAgent:'Enregistrer l’agent NOVEN',agentReady:'Compatible ERC-8004',x402Ready:'Compatible x402',pending:'Pas encore enregistré',testnet:'Réseau de test Sepolia',registerNote:'L’enregistrement est facultatif et nécessite une transaction sur Sepolia.',noWallet:'Connectez un wallet pour continuer.'}
  };

  const responseText = {
    en: {
      noven: 'NOVEN is a global intelligence workspace for asking questions, retrieving evidence, comparing sources, and creating verifiable records.',
      web3: 'NOVEN uses Web3 as a trust layer for identity, provenance, signatures, attestations, and future agent-to-agent services.',
      ai: 'Artificial intelligence is the field of building computer systems that perform tasks commonly associated with human intelligence, including learning, reasoning, perception, language understanding, and decision-making.',
      hello: 'Hello. I’m NOVEN. Ask a question and I’ll search the available knowledge and public reference sources.'
    },
    ar: { noven:'NOVEN هو مساحة استخباراتية عالمية لطرح الأسئلة واسترجاع الأدلة ومقارنة المصادر وإنشاء سجلات قابلة للتحقق.', web3:'يستخدم NOVEN ‏Web3 كطبقة ثقة للهوية والمصدر والتوقيعات والتوثيقات وخدمات الوكلاء المستقبلية.', ai:'الذكاء الاصطناعي هو مجال بناء أنظمة حاسوبية تنفذ مهام ترتبط عادة بالذكاء البشري مثل التعلم والاستدلال والإدراك وفهم اللغة واتخاذ القرار.', hello:'مرحبًا أنا NOVEN اطرح سؤالك وسأبحث في المعرفة المتاحة والمراجع العامة.' },
    es: { noven:'NOVEN es un espacio global de inteligencia para hacer preguntas, recuperar evidencia, comparar fuentes y crear registros verificables.', web3:'NOVEN usa Web3 como capa de confianza para identidad, procedencia, firmas, atestaciones y futuros servicios entre agentes.', ai:'La inteligencia artificial es el campo de construir sistemas informáticos capaces de realizar tareas asociadas al intelecto humano, como aprendizaje, razonamiento y comprensión del lenguaje.', hello:'Hola Soy NOVEN Haz una pregunta y buscaré en el conocimiento disponible y en fuentes públicas.' },
    fr: { noven:'NOVEN est un espace mondial de renseignement pour poser des questions, récupérer des preuves, comparer des sources et créer des enregistrements vérifiables.', web3:'NOVEN utilise Web3 comme couche de confiance pour l’identité, la provenance, les signatures, les attestations et les futurs services entre agents.', ai:'L’intelligence artificielle est le domaine qui consiste à construire des systèmes informatiques capables d’accomplir des tâches liées à l’intelligence humaine, comme l’apprentissage, le raisonnement et la compréhension du langage.', hello:'Bonjour Je suis NOVEN Posez une question et je chercherai dans les connaissances et les sources publiques disponibles.' }
  };

  function detectLanguage() {
    const raw = (navigator.language || 'en').toLowerCase();
    const base = raw.split('-')[0];
    return dict[base] ? base : 'en';
  }

  let selected = 'auto';
  try { selected = localStorage.getItem('noven_language') || 'auto'; } catch {}
  const state = { selected, active: selected === 'auto' ? detectLanguage() : selected };

  function setLanguage(code) {
    state.selected = code;
    state.active = code === 'auto' ? detectLanguage() : (dict[code] ? code : 'en');
    try { localStorage.setItem('noven_language', code); } catch {}
    document.documentElement.lang = state.active;
    document.documentElement.dir = ['ar','fa','ur','he'].includes(state.active) ? 'rtl' : 'ltr';
    apply();
    window.dispatchEvent(new CustomEvent('noven:language', { detail: state.active }));
  }

  function text(key) { return (dict[state.active] || dict.en)[key] ?? dict.en[key] ?? key; }
  function response(key) { return (responseText[state.active] || responseText.en)[key] || responseText.en[key]; }

  function apply() {
    const d = dict[state.active] || dict.en;
    const set = (selector, value) => { const node = document.querySelector(selector); if (node && value != null) node.textContent = value; };
    set('.crumb span', d.workspace); set('.crumb strong', d.newSession); set('.new-chat span:nth-child(2)', d.newChat);
    const nav = [...document.querySelectorAll('.side-nav .nav-item')]; [d.ask,d.research,d.evidence,d.trust].forEach((v,i)=>{ if(nav[i]) nav[i].childNodes[nav[i].childNodes.length-1].nodeValue = v; });
    set('.history-block .nav-caption', d.recent); set('.system-card strong', d.browserRuntime); set('.system-card small', d.trustReady);
    const mini=[...document.querySelectorAll('.mini-links a')]; if(mini[0]) mini[0].textContent=d.news; if(mini[1]) mini[1].textContent=d.trustVerify; if(mini[2]) mini[2].textContent=d.docs;
    set('.top-actions > span:nth-child(2)', d.client); set('#walletButton', d.connect); set('.eyebrow', d.eyebrow); set('.hero span', d.verify); set('.hero > p', d.hero);
    const modes=[...document.querySelectorAll('.mode')]; if(modes[0]) modes[0].childNodes[0].nodeValue=d.ask+' '; if(modes[1]) modes[1].childNodes[0].nodeValue=d.research+' '; if(modes[2]) modes[2].childNodes[0].nodeValue=d.analyze+' '; if(modes[3]) modes[3].childNodes[0].nodeValue=d.build+' ';
    set('#question', ''); const q=document.querySelector('#question'); if(q) q.placeholder=d.anything;
    set('.context-chip', d.evidenceAware); set('.helper', d.helper); const send=document.querySelector('#send span'); if(send) send.textContent=d.askButton;
    const tryNode=document.querySelector('.suggestions > span'); if(tryNode) tryNode.textContent=d.tryIt;
    set('.response-meta .label', d.response); set('.response-meta span:nth-child(2)', d.liveRun); set('#evidenceState', d.sources); set('.verification-label', d.outputHash);
    const v=document.querySelector('#verifyWalletButton'); if(v) v.textContent=d.sign; const r=document.querySelector('#downloadReceiptButton'); if(r) r.textContent=d.receipt; const a=document.querySelector('#anchorButton'); if(a) a.textContent=d.attest;
    set('.section-kicker', d.workflow); set('#research h2', d.searchTrail); const ps=[...document.querySelectorAll('#research .principles p')]; if(ps[0]){ps[0].innerHTML=`<strong>${d.attached}</strong> ${d.attachedBody}`;} if(ps[1]){ps[1].innerHTML=`<strong>${d.receipts}</strong> ${d.receiptsBody}`;} if(ps[2]){ps[2].innerHTML=`<strong>${d.independent}</strong> ${d.independentBody}`;}
    const secK=[...document.querySelectorAll('.section-kicker')]; if(secK[1]) secK[1].textContent=d.trustKicker; if(secK[2]) secK[2].textContent=d.systemKicker;
    set('#web3 h2', d.trustTitle); set('#web3 .web3-grid > div:first-child > p', d.trustBody); const tis=[...document.querySelectorAll('.web3-trust-list span')]; d.trustItems.forEach((v,i)=>{if(tis[i])tis[i].textContent=v;});
    set('#sepoliaButton', d.useSepolia); set('#registerSchemaButton', d.registerSchema); set('#downloadReceiptButton2', d.exportReceipt);
    const sys=[...document.querySelectorAll('#system .system-grid > div')]; [['discover','discoverBody'],['cross','crossBody'],['reason','reasonBody'],['attestUnder','attestBody']].forEach(([a,b],i)=>{if(sys[i]){sys[i].querySelector('h3').textContent=d[a];sys[i].querySelector('p').textContent=d[b];}});
    const footer=document.querySelector('footer span:nth-child(2)'); if(footer) footer.textContent=d.footer;
    const langSelect=document.querySelector('#languageSelect'); if(langSelect) langSelect.value=state.selected;
  }

  window.NOVEN_I18N = { languages, get language(){ return state.active; }, get selection(){ return state.selected; }, setLanguage, text, response, apply };
  window.NOVEN_LANG = state.active;
  document.addEventListener('DOMContentLoaded', () => {
    const top=document.querySelector('.top-actions');
    if(top && !document.getElementById('languageSelect')) {
      const wrap=document.createElement('label'); wrap.className='language-picker'; wrap.setAttribute('aria-label','Language');
      const select=document.createElement('select'); select.id='languageSelect'; languages.forEach(([code,label])=>{const o=document.createElement('option');o.value=code;o.textContent=label;select.appendChild(o);});
      select.value=state.selected; select.addEventListener('change',()=>setLanguage(select.value)); wrap.appendChild(select); top.insertBefore(wrap, top.firstChild);
    }
    setLanguage(state.selected);
  });
})();
