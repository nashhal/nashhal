(() => {
  const config = window.NASHHAL_AI_CONFIG || {};
  const API_BASE = config.apiBase || localStorage.getItem('nashhal_ai_api') || '';
  const form = document.getElementById('chatForm');
  const question = document.getElementById('question');
  const send = document.getElementById('send');
  const result = document.getElementById('result');
  const answer = document.getElementById('answer');
  const sources = document.getElementById('sources');
  const count = document.getElementById('charCount');
  const HISTORY_KEY = 'noven_sessions_v5';

  if (!form || !question || !send || !result || !answer || !sources) return;

  const builtIn = [
    { keys: ['what is noven', 'what does noven', 'nov en'], title: 'NOVEN', source: 'NOVEN', url: './', text: 'NOVEN is a global intelligence workspace designed to ask questions, retrieve supporting evidence, compare available sources, and create a verifiable record of the result.' },
    { keys: ['what is ai', 'what is artificial intelligence', 'artificial intelligence'], title: 'Artificial intelligence', source: 'NOVEN reference', url: 'https://en.wikipedia.org/wiki/Artificial_intelligence', text: 'Artificial intelligence is the field of building computer systems that can perform tasks commonly associated with human intelligence, such as learning, reasoning, perception, language understanding, and decision-making.' },
    { keys: ['web3', 'blockchain', 'on chain', 'on-chain'], title: 'Web3 verification', source: 'NOVEN', url: './#web3', text: 'NOVEN uses Web3 as an optional trust layer. A result can be hashed locally, signed by a compatible wallet, and later anchored to a public testnet when that feature is enabled.' },
    { keys: ['github pages', 'gpu', 'local model', 'qwen'], title: 'NOVEN architecture', source: 'NOVEN', url: './#system', text: 'GitHub Pages serves the static interface. A full language model needs compute outside static hosting, so the current browser runtime combines local retrieval with public references and keeps a path for a self-hosted model.' },
    { keys: ['retrieval', 'search', 'source', 'sources', 'evidence'], title: 'Retrieval and evidence', source: 'NOVEN', url: './#research', text: 'NOVEN ranks available knowledge records against the question, selects the strongest matches, and keeps their evidence attached to the response.' },
    { keys: ['hello', 'hi', 'مرحبا', 'السلام'], title: 'NOVEN', source: 'NOVEN', url: './', text: 'Hello. I’m NOVEN. Ask me a question and I’ll search the available knowledge and public reference sources.' },
  ];

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ')
    .trim();

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function loadJson(path) {
    const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path} ${response.status}`);
    return response.json();
  }

  async function loadKnowledge() {
    for (const path of ['../data/live-news.json', '../data/demo-kb.json']) {
      try {
        const data = await loadJson(path);
        const docs = Array.isArray(data) ? data : data.documents;
        if (Array.isArray(docs) && docs.length) return docs;
      } catch (error) {
        console.warn('Knowledge source unavailable:', path, error);
      }
    }
    return [];
  }

  function score(query, doc) {
    const q = new Set(normalize(query).split(/\s+/).filter((token) => token.length > 1));
    if (!q.size) return 0;
    const title = normalize(doc.title);
    const body = normalize(doc.text || doc.description || '');
    let hits = 0;
    for (const token of q) {
      if (title.includes(token)) hits += 1.5;
      else if (body.includes(token)) hits += 1;
    }
    return Math.min(1, hits / q.size);
  }

  async function wikipediaSearch(q) {
    const language = /[\u0600-\u06ff]/.test(q) ? 'ar' : 'en';
    const endpoint = `https://${language}.wikipedia.org/w/api.php?action=query&origin=*&format=json&list=search&srsearch=${encodeURIComponent(q)}&srlimit=3`;
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Wikipedia ${response.status}`);
    const searchData = await response.json();
    const hits = searchData?.query?.search || [];
    const first = hits[0];
    if (!first?.title) return null;

    const summaryEndpoint = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(first.title.replace(/ /g, '_'))}`;
    const summaryResponse = await fetch(summaryEndpoint, { cache: 'no-store' });
    if (!summaryResponse.ok) throw new Error(`Wikipedia summary ${summaryResponse.status}`);
    const summary = await summaryResponse.json();
    if (!summary?.extract) return null;

    return {
      title: summary.title || first.title,
      source: 'Wikipedia',
      url: summary.content_urls?.desktop?.page || `https://${language}.wikipedia.org/wiki/${encodeURIComponent(first.title.replace(/ /g, '_'))}`,
      text: summary.extract,
      score: 1,
    };
  }

  function builtInMatch(q) {
    const n = normalize(q);
    return builtIn.find((item) => item.keys.some((key) => n.includes(normalize(key))));
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

  async function typeText(text) {
    answer.textContent = '';
    let out = '';
    for (const part of String(text).split(/(\s+)/)) {
      out += part;
      answer.textContent = out;
      await sleep(part.trim() ? 5 : 1);
    }
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  }

  function saveHistory(item) {
    const next = [item, ...getHistory().filter((entry) => entry.question !== item.question)].slice(0, 25);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    renderHistory();
  }

  function renderHistory() {
    const list = document.querySelector('.history-list');
    if (!list) return;
    const items = getHistory();
    list.innerHTML = items.length
      ? items.map((item, index) => `<button type="button" class="history-item" data-history="${index}">${escapeHtml(item.question)}</button>`).join('')
      : '<span class="history-empty">No sessions yet</span>';
    list.querySelectorAll('.history-item').forEach((button) => button.addEventListener('click', () => {
      const item = items[Number(button.dataset.history)];
      if (!item) return;
      question.value = item.question;
      question.dispatchEvent(new Event('input'));
      question.focus();
    }));
  }

  async function run(q) {
    const direct = builtInMatch(q);
    if (direct) return { text: direct.text, sources: [{ ...direct, score: 1 }] };

    const docs = await loadKnowledge();
    const ranked = docs.map((doc) => ({ ...doc, score: score(q, doc) }))
      .filter((doc) => doc.score >= 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (ranked.length) {
      const lead = ranked[0];
      const related = ranked.slice(1).map((doc) => doc.title).filter(Boolean);
      const relatedText = related.length ? `\n\nRelated evidence: ${related.join(' · ')}.` : '';
      return {
        text: `${lead.text || lead.description || lead.title}${relatedText}\n\nNOVEN attached the matching evidence to this answer.`,
        sources: ranked,
      };
    }

    const wiki = await wikipediaSearch(q);
    if (wiki) return { text: `${wiki.text}\n\nReference: ${wiki.title} (Wikipedia).`, sources: [wiki] };

    return {
      text: 'I could not find a reliable reference for that question from the browser sources currently available. Try a more specific question.',
      sources: [],
    };
  }

  async function runOptionalApi(q) {
    if (!API_BASE) return null;
    try {
      const response = await fetch(`${API_BASE.replace(/\/$/, '')}/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, top_k: 6 }),
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Optional AI API unavailable; using resilient browser runtime.', error);
      return null;
    }
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
    sources.innerHTML = '<div class="empty-evidence">NOVEN is working…</div>';

    try {
      const apiData = await runOptionalApi(q);
      const data = apiData || await run(q);
      await typeText(data.answer || data.text || 'No response.');
      const items = data.sources || data.evidence || [];
      renderSources(items);
      const fullHash = await hashText(`${q}\n${data.answer || data.text || ''}\n${JSON.stringify(items)}`);
      const shortHash = `${fullHash.slice(0, 24)}…`;
      document.getElementById('verificationHash')?.replaceChildren(document.createTextNode(shortHash));
      document.getElementById('web3Hash')?.replaceChildren(document.createTextNode(shortHash));
      saveHistory({ question: q, answer: data.answer || data.text || '', hash: fullHash, created_at: new Date().toISOString() });
      const chip = document.querySelector('.model-chip');
      if (chip) chip.textContent = apiData ? 'NOVEN · AI backend' : 'NOVEN · Browser runtime';
    } catch (error) {
      console.error('NOVEN runtime error:', error);
      answer.textContent = 'NOVEN encountered a temporary runtime error. Please try again.';
      renderSources([]);
    } finally {
      send.disabled = false;
      send.innerHTML = '<span>Ask</span><b>↗</b>';
    }
  }, true);

  document.querySelectorAll('.suggestion').forEach((button) => button.addEventListener('click', () => {
    question.value = button.dataset.question || '';
    question.dispatchEvent(new Event('input'));
    form.requestSubmit();
  }));

  document.querySelectorAll('.mode').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.mode').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    question.dataset.prefix = button.dataset.prefix || '';
    question.placeholder = button.dataset.prefix ? `${button.textContent.trim().split(' ')[0]} something…` : 'Ask anything…';
    question.focus();
  }));

  document.querySelector('.new-chat')?.addEventListener('click', () => {
    question.value = '';
    question.dataset.prefix = '';
    question.dispatchEvent(new Event('input'));
    result.classList.add('hidden');
    answer.textContent = '';
    sources.innerHTML = '';
    document.getElementById('verificationHash')?.replaceChildren(document.createTextNode('Awaiting a run'));
    document.getElementById('web3Hash')?.replaceChildren(document.createTextNode('Awaiting a run'));
    question.focus();
  });

  question.addEventListener('input', () => {
    if (count) count.textContent = String(question.value.length);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      document.querySelector('.new-chat')?.click();
    }
  });

  window.addEventListener('load', async () => {
    renderHistory();
    const initialHash = await hashText('NOVEN · resilient browser runtime');
    const shortHash = `${initialHash.slice(0, 24)}…`;
    document.getElementById('verificationHash')?.replaceChildren(document.createTextNode(shortHash));
    document.getElementById('web3Hash')?.replaceChildren(document.createTextNode(shortHash));
  });
})();
