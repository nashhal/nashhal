const config = window.NASHHAL_AI_CONFIG || {};
const API_BASE = config.apiBase || localStorage.getItem('nashhal_ai_api') || '';
const form = document.getElementById('chatForm');
const question = document.getElementById('question');
const send = document.getElementById('send');
const result = document.getElementById('result');
const answer = document.getElementById('answer');
const sources = document.getElementById('sources');
const count = document.getElementById('charCount');
const HISTORY_KEY = 'noven_sessions_v4';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FALLBACK_KNOWLEDGE = [
  { id: 'fallback-1', title: 'NOVEN browser prototype', text: 'NOVEN can search a local knowledge snapshot, rank matching records, show evidence, and create a verification hash without a paid AI API.', source: 'NOVEN', url: './', published_at: new Date().toISOString().slice(0, 10) },
  { id: 'fallback-2', title: 'Source-grounded retrieval', text: 'The prototype retrieves the closest available evidence before responding and keeps the supporting source attached to the result.', source: 'NOVEN', url: './', published_at: new Date().toISOString().slice(0, 10) },
  { id: 'fallback-3', title: 'Web3 verification', text: 'NOVEN can hash a result locally and optionally let a browser wallet sign the verification message or anchor the hash on a public testnet.', source: 'NOVEN', url: './', published_at: new Date().toISOString().slice(0, 10) },
  { id: 'fallback-4', title: 'Self-hosted model path', text: 'The production architecture can connect a self-hosted language model and RAG backend later while keeping the same web interface.', source: 'NOVEN', url: './', published_at: new Date().toISOString().slice(0, 10) },
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function renderSources(items = []) {
  if (!sources) return;
  sources.innerHTML = items.length ? items.map((item, index) => {
    const title = escapeHtml(item.title || `Source ${index + 1}`);
    const href = escapeHtml(item.url || '#');
    const source = escapeHtml(item.source || 'Unknown source');
    const date = escapeHtml(item.published_at || 'Date unavailable');
    return `<article class="source"><div><a href="${href}" target="_blank" rel="noopener noreferrer">${title}</a><small>${source} · ${date}</small></div><small>${Number(item.score || 0).toFixed(3)}</small></article>`;
  }).join('') : '<div class="empty-evidence">No matching evidence found.</div>';
}

const normalize = (text) => String(text || '').toLowerCase()
  .replace(/[\u064B-\u065F\u0670]/g, '')
  .replace(/[إأآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[^\w\u0600-\u06ff]+/g, ' ').trim();
const tokens = (text) => new Set(normalize(text).split(/\s+/).filter((t) => t.length > 1));

function scoreDocument(query, doc) {
  const q = tokens(query);
  const titleTokens = tokens(doc.title);
  const bodyTokens = tokens(doc.text);
  if (!q.size) return 0;
  let hits = 0;
  q.forEach((token) => { if (bodyTokens.has(token)) hits += 1; });
  q.forEach((token) => { if (titleTokens.has(token)) hits += 0.8; });
  return Math.min(1, hits / q.size);
}

async function loadJson(path) {
  const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return response.json();
}

async function loadKnowledge() {
  try {
    const live = await loadJson('../data/live-news.json');
    const docs = Array.isArray(live) ? live : live.documents;
    if (Array.isArray(docs) && docs.length) return { documents: docs, live: true, generatedAt: live.generated_at || '' };
  } catch (error) {
    console.warn('Live feed unavailable.', error);
  }
  try {
    const demo = await loadJson('../data/demo-kb.json');
    const docs = Array.isArray(demo) ? demo : demo.documents;
    if (Array.isArray(docs) && docs.length) return { documents: docs, live: false, generatedAt: '' };
  } catch (error) {
    console.warn('Demo feed unavailable; using embedded fallback.', error);
  }
  return { documents: FALLBACK_KNOWLEDGE, live: false, generatedAt: '' };
}

async function hashText(text) {
  if (!window.crypto?.subtle) return 'local-demo';
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function typeResponse(text) {
  answer.textContent = '';
  let buffer = '';
  for (const part of String(text).split(/(\s+)/)) {
    buffer += part;
    answer.textContent = buffer;
    await sleep(part.trim() ? 7 : 1);
  }
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function saveHistory(record) {
  const items = loadHistory();
  items.unshift(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 25)));
}

function updateHistoryUI() {
  const list = document.querySelector('.history-list');
  if (!list) return;
  const items = loadHistory();
  list.innerHTML = items.length
    ? items.map((item, index) => `<button type="button" class="history-item" data-index="${index}">${escapeHtml(item.question)}</button>`).join('')
    : '<span class="history-empty">No sessions yet</span>';
  list.querySelectorAll('.history-item').forEach((button) => button.addEventListener('click', () => {
    const item = items[Number(button.dataset.index)];
    if (!item) return;
    question.value = item.question;
    if (count) count.textContent = question.value.length;
    question.focus();
  }));
}

function bindNewSession() {
  document.querySelector('.new-chat')?.addEventListener('click', () => {
    question.value = '';
    if (count) count.textContent = '0';
    result?.classList.add('hidden');
    if (answer) answer.textContent = '';
    if (sources) sources.innerHTML = '';
    document.getElementById('verificationHash')?.replaceChildren(document.createTextNode('Awaiting a run'));
    document.getElementById('web3Hash')?.replaceChildren(document.createTextNode('Awaiting a run'));
    question?.focus();
  });
}

async function runBrowserDemo(q) {
  const knowledge = await loadKnowledge();
  await sleep(160);
  const ranked = knowledge.documents
    .map((doc) => ({ ...doc, score: scoreDocument(q, doc) }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (!ranked.length) {
    return {
      answer: knowledge.live
        ? 'No grounded match was found in the current web knowledge snapshot. NOVEN will not invent an answer when the evidence is missing.'
        : 'No grounded match was found in the current knowledge snapshot. NOVEN will not invent an answer when the evidence is missing.',
      sources: [], live: knowledge.live, generatedAt: knowledge.generatedAt,
    };
  }

  const lead = ranked[0];
  const independentSources = [...new Set(ranked.map((doc) => doc.source).filter(Boolean))];
  const coverage = independentSources.length > 1
    ? `\n\nSource coverage: ${independentSources.join(', ')}.`
    : '';
  const answerText = `${knowledge.live ? 'From the latest indexed web sources:' : 'From the available knowledge:'}\n\n${lead.text}${coverage}\n\nNOVEN keeps the supporting evidence attached to the result.`;
  return { answer: answerText, sources: ranked, live: knowledge.live, generatedAt: knowledge.generatedAt };
}

function setRuntimeLabel(live) {
  const chip = document.querySelector('.model-chip');
  if (chip) chip.textContent = live ? 'NOVEN · Live knowledge' : 'NOVEN · Local runtime';
}

if (form && question && send && result && answer && sources) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const raw = question.value.trim();
    if (!raw) return;
    const prefix = question.dataset.prefix || '';
    const q = prefix && !raw.startsWith(prefix) ? `${prefix}${raw}` : raw;

    send.disabled = true;
    result.classList.remove('hidden');
    answer.textContent = '';
    sources.innerHTML = '';
    send.innerHTML = '<span>Working</span><b>…</b>';

    try {
      let data;
      if (!API_BASE) {
        data = await runBrowserDemo(q);
      } else {
        const response = await fetch(`${API_BASE.replace(/\/$/, '')}/v1/chat`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, top_k: 6 }),
        });
        if (!response.ok) throw new Error(`API ${response.status}`);
        data = await response.json();
        data.live = true;
      }

      setRuntimeLabel(Boolean(data.live));
      await typeResponse(data.answer || 'No response.');
      renderSources(data.sources || []);

      const fullHash = await hashText(`${q}\n${data.answer || ''}\n${JSON.stringify(data.sources || [])}`);
      const shortHash = `${fullHash.slice(0, 24)}…`;
      document.getElementById('verificationHash')?.replaceChildren(document.createTextNode(shortHash));
      document.getElementById('web3Hash')?.replaceChildren(document.createTextNode(shortHash));
      const evidence = document.getElementById('evidenceState');
      if (evidence) evidence.textContent = data.sources?.length ? `${data.sources.length} sources` : 'No sources';
      saveHistory({ question: q, answer: data.answer || '', hash: fullHash, sources: data.sources || [], live: Boolean(data.live), created_at: new Date().toISOString() });
      updateHistoryUI();
    } catch (error) {
      answer.textContent = 'NOVEN could not complete this run. Please retry; the browser fallback is available for supported demo queries.';
      renderSources([]);
      console.error(error);
    } finally {
      send.disabled = false;
      send.innerHTML = '<span>Ask</span><b>↗</b>';
    }
  });
}

window.addEventListener('load', async () => {
  bindNewSession();
  updateHistoryUI();
  if (question) question.addEventListener('input', () => { if (count) count.textContent = question.value.length; });
  const initial = `${(await hashText('NOVEN · resilient browser runtime · evidence pipeline')).slice(0, 24)}…`;
  document.getElementById('verificationHash')?.replaceChildren(document.createTextNode(initial));
  document.getElementById('web3Hash')?.replaceChildren(document.createTextNode(initial));
});
