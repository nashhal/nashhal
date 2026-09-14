(() => {
  const form = document.getElementById('chatForm');
  const question = document.getElementById('question');
  const send = document.getElementById('send');
  const result = document.getElementById('result');
  const answer = document.getElementById('answer');
  const sources = document.getElementById('sources');
  const hash = document.getElementById('verificationHash');
  if (!form || !question || !send || !result || !answer || !sources) return;

  const localReplies = [
    { keys: ['what is noven', 'what does noven', 'nov en'], text: 'NOVEN is a browser-first intelligence workspace for asking questions, retrieving evidence, comparing sources, and creating a verifiable record of the result.' },
    { keys: ['web3', 'blockchain', 'on-chain', 'on chain'], text: 'NOVEN uses Web3 as an optional trust layer. It can create a SHA-256 hash of a result and, with a compatible wallet, sign the verification record.' },
    { keys: ['github pages', 'gpu', 'local model', 'qwen'], text: 'The interface runs on GitHub Pages. A large language model needs compute outside static hosting, so this demo uses browser retrieval while keeping a path for a self-hosted model.' },
    { keys: ['retrieval', 'search', 'source', 'sources', 'evidence'], text: 'NOVEN ranks available knowledge records against the question, then keeps the strongest matching evidence attached to the response.' },
    { keys: ['hello', 'hi', 'مرحبا', 'السلام'], text: 'Hello. I’m NOVEN. Ask me a question and I’ll search the available knowledge and public reference data in the browser.' },
  ];

  function norm(value) {
    return String(value || '').toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[إأآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/ة/g, 'ه')
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ').trim();
  }

  async function loadJson(path) {
    const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path} ${response.status}`);
    return response.json();
  }

  function score(query, doc) {
    const q = new Set(norm(query).split(/\s+/).filter((x) => x.length > 1));
    const hay = norm(`${doc.title || ''} ${doc.text || ''}`);
    let hits = 0;
    for (const token of q) if (hay.includes(token)) hits += 1;
    return q.size ? hits / q.size : 0;
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

  async function wikipediaAnswer(q) {
    const language = /[\u0600-\u06ff]/.test(q) ? 'ar' : 'en';
    const api = `https://${language}.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=3&prop=extracts&exintro=1&explaintext=1&exchars=900`;
    const response = await fetch(api, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Wikipedia ${response.status}`);
    const data = await response.json();
    const pages = Object.values(data?.query?.pages || {});
    const page = pages.sort((a, b) => (b.extract || '').length - (a.extract || '').length)[0];
    if (!page?.extract) return null;
    return {
      answer: page.extract,
      source: 'Wikipedia',
      url: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(String(page.title || '').replace(/ /g, '_'))}`,
      title: page.title || 'Wikipedia',
    };
  }

  function renderEvidence(items) {
    sources.innerHTML = items.length
      ? items.map((item, i) => `<article class="source"><div><a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer">${item.title || `Source ${i + 1}`}</a><small>${item.source || 'Reference'}</small></div><small>${item.score ? item.score.toFixed(2) : 'ref'}</small></article>`).join('')
      : '<div class="empty-evidence">No source attached to this answer.</div>';
    const evidence = document.getElementById('evidenceState');
    if (evidence) evidence.textContent = items.length ? `${items.length} sources` : 'No sources';
  }

  async function makeHash(text) {
    if (!window.crypto?.subtle) return 'browser-demo';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function localMatch(q) {
    const n = norm(q);
    return localReplies.find((item) => item.keys.some((key) => n.includes(norm(key))));
  }

  async function generate(q) {
    const direct = localMatch(q);
    if (direct) return { text: direct.text, evidence: [] };

    const docs = await loadKnowledge();
    const ranked = docs.map((doc) => ({ ...doc, score: score(q, doc) }))
      .filter((doc) => doc.score >= 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    if (ranked.length) {
      const lead = ranked[0];
      const extra = ranked.length > 1 ? `\n\nRelated evidence: ${ranked.slice(1).map((x) => x.title).join(' · ')}` : '';
      return {
        text: `${lead.text || lead.title}${extra}\n\nThis response is grounded in the knowledge available to NOVEN right now.`,
        evidence: ranked,
      };
    }

    try {
      const wiki = await wikipediaAnswer(q);
      if (wiki) return {
        text: `${wiki.answer}\n\nReference: ${wiki.title} (Wikipedia).`,
        evidence: [{ ...wiki, score: 1 }],
      };
    } catch (error) {
      console.warn('Public reference lookup failed:', error);
    }

    return {
      text: 'I could not find a reliable reference for that question in the current browser sources. Try a more specific question and NOVEN will search again.',
      evidence: [],
    };
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const q = question.value.trim();
    if (!q) return;
    send.disabled = true;
    send.innerHTML = '<span>Searching</span><b>…</b>';
    result.classList.remove('hidden');
    answer.textContent = '';
    sources.innerHTML = '<div class="empty-evidence">Searching knowledge and public references…</div>';

    try {
      const data = await generate(q);
      let out = '';
      for (const part of String(data.text).split(/(\s+)/)) {
        out += part;
        answer.textContent = out;
        await new Promise((resolve) => setTimeout(resolve, part.trim() ? 6 : 1));
      }
      renderEvidence(data.evidence || []);
      const digest = await makeHash(`${q}\n${data.text}\n${JSON.stringify(data.evidence || [])}`);
      const shortHash = `${digest.slice(0, 24)}…`;
      if (hash) hash.textContent = shortHash;
      document.getElementById('web3Hash')?.replaceChildren(document.createTextNode(shortHash));

      const list = document.querySelector('.history-list');
      if (list) {
        const existing = [...list.querySelectorAll('.history-item')].map((el) => el.textContent);
        if (!existing.includes(q)) {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'history-item';
          item.textContent = q;
          item.onclick = () => { question.value = q; question.focus(); };
          list.prepend(item);
        }
      }
    } catch (error) {
      answer.textContent = 'The search layer encountered a temporary error. Please try again.';
      renderEvidence([]);
      console.error(error);
    } finally {
      send.disabled = false;
      send.innerHTML = '<span>Ask</span><b>↗</b>';
    }
  }, true);
})();
