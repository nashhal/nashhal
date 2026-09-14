(() => {
  const config = window.NASHHAL_AI_CONFIG || {};
  const API_BASE = typeof config.apiBase === 'string' ? config.apiBase.trim() : '';

  const form = document.getElementById('chatForm');
  const question = document.getElementById('question');
  const send = document.getElementById('send');
  const result = document.getElementById('result');
  const answer = document.getElementById('answer');
  const sources = document.getElementById('sources');
  const count = document.getElementById('charCount');
  const historyList = document.querySelector('.history-list');

  if (!form || !question || !send || !result || !answer || !sources) {
    console.error('NOVEN: required UI elements are missing.');
    return;
  }

  const history = [];
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const builtIn = [
    { keys: ['what is noven', 'what does noven', 'nov en'], title: 'NOVEN', source: 'NOVEN', url: './', text: 'NOVEN is a global intelligence workspace for asking questions, retrieving evidence, comparing sources, and creating a verifiable record of the result.' },
    { keys: ['what is ai', 'what is artificial intelligence', 'artificial intelligence'], title: 'Artificial intelligence', source: 'Reference', url: 'https://en.wikipedia.org/wiki/Artificial_intelligence', text: 'Artificial intelligence is the field of building computer systems that can perform tasks commonly associated with human intelligence, including learning, reasoning, perception, language understanding, and decision-making.' },
    { keys: ['web3', 'blockchain', 'on chain', 'on-chain'], title: 'Web3 verification', source: 'NOVEN', url: './#web3', text: 'NOVEN uses Web3 as an optional trust layer. A result can be hashed locally, signed with EIP-712, packaged as evidence, and optionally attested on a public testnet.' },
    { keys: ['github pages', 'gpu', 'local model', 'qwen'], title: 'NOVEN architecture', source: 'NOVEN', url: './#system', text: 'GitHub Pages serves the static interface. A full language model needs compute outside static hosting, so NOVEN combines browser retrieval with public references and keeps a path open for a self-hosted model.' },
    { keys: ['retrieval', 'search', 'source', 'sources', 'evidence'], title: 'Retrieval and evidence', source: 'NOVEN', url: './#research', text: 'NOVEN ranks available knowledge records against the question, selects the strongest matches, and keeps supporting evidence attached to the response.' },
    { keys: ['hello', 'hi', 'مرحبا', 'السلام'], title: 'NOVEN', source: 'NOVEN', url: './', text: 'Hello. I’m NOVEN. Ask a question and I’ll search the available knowledge and public reference sources.' }
  ];

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[\u064B-\u065F\u0670]/g, '').replace(/[إأآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/ة/g, 'ه').replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function addHistory(q) {
    if (!historyList || history.includes(q)) return;
    history.unshift(q);
    history.splice(12);
    historyList.innerHTML = '';
    history.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'history-item';
      button.textContent = item;
      button.addEventListener('click', () => { question.value = item; updateCounter(); question.focus(); });
      historyList.appendChild(button);
    });
  }

  function updateCounter() { if (count) count.textContent = String(question.value.length); }

  async function loadJson(path) {
    const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadKnowledge() {
    for (const path of ['../data/live-news.json', '../data/demo-kb.json']) {
      try {
        const data = await loadJson(path);
        const docs = Array.isArray(data) ? data : data?.documents;
        if (Array.isArray(docs) && docs.length) return docs;
      } catch (error) { console.warn('NOVEN knowledge source unavailable:', path, error); }
    }
    return [];
  }

  function score(query, doc) {
    const tokens = new Set(normalize(query).split(/\s+/).filter((token) => token.length > 1));
    if (!tokens.size) return 0;
    const title = normalize(doc.title);
    const body = normalize(doc.text || doc.description || '');
    let hits = 0;
    for (const token of tokens) { if (title.includes(token)) hits += 1.5; else if (body.includes(token)) hits += 1; }
    return Math.min(1, hits / tokens.size);
  }

  function findBuiltIn(q) {
    const normalized = normalize(q);
    return builtIn.find((item) => item.keys.some((key) => normalized.includes(normalize(key))));
  }

  async function publicReference(q) {
    const language = /[\u0600-\u06ff]/.test(q) ? 'ar' : 'en';
    const api = `https://${language}.wikipedia.org/w/api.php?action=query&origin=*&format=json&list=search&srsearch=${encodeURIComponent(q)}&srlimit=3`;
    const response = await fetch(api, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Wikipedia HTTP ${response.status}`);
    const data = await response.json();
    const first = data?.query?.search?.[0];
    if (!first?.title) return null;
    return { title: first.title, source: 'Wikipedia', url: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(first.title.replace(/ /g, '_'))}`, text: `A public reference for “${first.title}” was found. Open the source to read the full article.`, score: 1 };
  }

  function renderSources(items) {
    sources.innerHTML = items.length
      ? items.map((item, index) => `<article class="source"><div><a href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title || `Source ${index + 1}`)}</a><small>${escapeHtml(item.source || 'Reference')}</small></div><small>${item.score ? Number(item.score).toFixed(2) : 'ref'}</small></article>`).join('')
      : '<div class="empty-evidence">No external source attached.</div>';
    const evidenceState = document.getElementById('evidenceState');
    if (evidenceState) evidenceState.textContent = items.length ? `${items.length} sources` : 'No sources';
  }

  async function hashText(text) {
    if (!window.crypto?.subtle) return 'browser-demo';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async function answerQuestion(q) {
    const direct = findBuiltIn(q);
    if (direct) return { text: direct.text, sources: [{ ...direct, score: 1 }] };
    const docs = await loadKnowledge();
    const ranked = docs.map((doc) => ({ ...doc, score: score(q, doc) })).filter((doc) => doc.score >= 0.25).sort((a, b) => b.score - a.score).slice(0, 5);
    if (ranked.length) {
      const lead = ranked[0];
      return { text: `${lead.text || lead.description || lead.title}\n\nNOVEN found matching evidence in its current knowledge layer.`, sources: ranked };
    }
    try {
      const ref = await publicReference(q);
      if (ref) return { text: `${ref.text}\n\nReference: ${ref.title} (Wikipedia).`, sources: [ref] };
    } catch (error) { console.warn('NOVEN public reference lookup unavailable:', error); }
    return { text: 'I could not retrieve a reliable public reference for that question right now. The browser runtime is active; try a more specific question.', sources: [] };
  }

  async function optionalApi(q) {
    if (!API_BASE) return null;
    try {
      const response = await fetch(`${API_BASE.replace(/\/$/, '')}/v1/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, top_k: 6 }) });
      if (!response.ok) throw new Error(`AI API HTTP ${response.status}`);
      return await response.json();
    } catch (error) { console.warn('NOVEN optional AI backend unavailable:', error); return null; }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const q = question.value.trim();
    if (!q) return;
    send.disabled = true;
    send.innerHTML = '<span>Thinking</span><b>…</b>';
    result.classList.remove('hidden');
    answer.textContent = '';
    sources.innerHTML = '<div class="empty-evidence">NOVEN is searching…</div>';
    try {
      const apiResult = await optionalApi(q);
      const data = apiResult || await answerQuestion(q);
      const text = data.answer || data.text || 'No response.';
      let output = '';
      for (const part of String(text).split(/(\s+)/)) { output += part; answer.textContent = output; await sleep(part.trim() ? 5 : 1); }
      const evidence = data.sources || data.evidence || [];
      renderSources(evidence);
      const fullHash = await hashText(`${q}\n${text}\n${JSON.stringify(evidence)}`);
      const shortHash = `${fullHash.slice(0, 24)}…`;
      document.getElementById('verificationHash')?.replaceChildren(document.createTextNode(shortHash));
      document.getElementById('web3Hash')?.replaceChildren(document.createTextNode(shortHash));
      window.NOVEN_TRUST_RUN = {
        runId: `NVR-${Date.now().toString(36).toUpperCase()}`,
        question: q,
        answer: text,
        sources: evidence,
        outputHash: fullHash,
        createdAt: new Date().toISOString(),
        runtime: apiResult ? 'ai-backend' : 'browser-runtime',
        model: apiResult?.model || 'NOVEN browser runtime',
        dataset: apiResult?.dataset || 'NOVEN knowledge layer'
      };
      window.dispatchEvent(new CustomEvent('noven:run', { detail: window.NOVEN_TRUST_RUN }));
      const chip = document.querySelector('.model-chip');
      if (chip) chip.textContent = apiResult ? 'NOVEN · AI backend' : 'NOVEN · Browser runtime';
      addHistory(q);
    } catch (error) {
      console.error('NOVEN runtime error:', error);
      answer.textContent = 'NOVEN encountered a temporary runtime error. Please try again.';
      renderSources([]);
    } finally {
      send.disabled = false;
      send.innerHTML = '<span>Ask</span><b>↗</b>';
    }
  }, true);

  document.querySelectorAll('.suggestion').forEach((button) => button.addEventListener('click', () => { question.value = button.dataset.question || ''; updateCounter(); form.requestSubmit(); }));
  document.querySelectorAll('.mode').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.mode').forEach((item) => item.classList.remove('active')); button.classList.add('active'); question.dataset.prefix = button.dataset.prefix || ''; question.focus(); }));
  document.querySelector('.new-chat')?.addEventListener('click', () => { question.value = ''; updateCounter(); result.classList.add('hidden'); answer.textContent = ''; sources.innerHTML = ''; window.NOVEN_TRUST_RUN = null; document.getElementById('verificationHash')?.replaceChildren(document.createTextNode('Awaiting a run')); document.getElementById('web3Hash')?.replaceChildren(document.createTextNode('Awaiting a run')); document.getElementById('verificationSignature')?.replaceChildren(document.createTextNode('—')); question.focus(); });
  question.addEventListener('input', updateCounter);
  window.addEventListener('load', updateCounter);
})();
