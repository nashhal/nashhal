const config = window.NASHHAL_AI_CONFIG || {};
const API_BASE = config.apiBase || localStorage.getItem('nashhal_ai_api') || '';
const form = document.getElementById('chatForm');
const question = document.getElementById('question');
const send = document.getElementById('send');
const result = document.getElementById('result');
const answer = document.getElementById('answer');
const sources = document.getElementById('sources');
const count = document.getElementById('charCount');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const HISTORY_KEY = 'noven_sessions_v1';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
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

const normalize = (text) => String(text || '').toLowerCase().replace(/[\u064B-\u065F\u0670]/g, '').replace(/[إأآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/ة/g, 'ه').replace(/[^\w\u0600-\u06ff]+/g, ' ').trim();
const tokens = (text) => new Set(normalize(text).split(/\s+/).filter((t) => t.length > 1));

function scoreDocument(query, doc) {
  const q = tokens(query);
  const d = tokens(`${doc.title} ${doc.text}`);
  let hits = 0;
  q.forEach((token) => { if (d.has(token)) hits += 1; });
  return hits / Math.max(q.size, 1);
}

async function loadDemoKnowledge() {
  const response = await fetch(new URL('../data/demo-kb.json', window.location.href));
  if (!response.ok) throw new Error(`Demo KB ${response.status}`);
  return response.json();
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
    await sleep(part.trim() ? 9 : 1);
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
  list.innerHTML = items.length ? items.map((item, index) => `<button type="button" class="history-item" data-index="${index}">${escapeHtml(item.question)}</button>`).join('') : '<span class="history-empty">No sessions yet</span>';
  list.querySelectorAll('.history-item').forEach((button) => button.addEventListener('click', () => {
    const item = items[Number(button.dataset.index)];
    if (!item) return;
    question.value = item.question;
    if (count) count.textContent = question.value.length;
    question.focus();
  }));
}

async function runBrowserDemo(q) {
  const docs = await loadDemoKnowledge();
  await sleep(240);
  const ranked = docs.map((doc) => ({ ...doc, score: scoreDocument(q, doc) })).filter((doc) => doc.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  if (!ranked.length) return { answer: 'No grounded answer was found in the current knowledge base. NOVEN will not invent evidence that is not available.', sources: [] };
  return {
    answer: `Based on the strongest matching source:\n\n${ranked[0].text}\n\nThis live browser prototype demonstrates retrieval, evidence display and output verification before a full model is connected.`,
    sources: ranked,
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const q = question.value.trim();
  if (!q) return;
  send.disabled = true;
  result.classList.remove('hidden');
  answer.textContent = '';
  sources.innerHTML = '';
  send.innerHTML = '<span>Working</span><b>…</b>';
  try {
    let data;
    if (!API_BASE) data = await runBrowserDemo(q);
    else {
      const response = await fetch(`${API_BASE.replace(/\/$/, '')}/v1/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, top_k: 5 }) });
      if (!response.ok) throw new Error(`API ${response.status}`);
      data = await response.json();
    }
    await typeResponse(data.answer || 'No response.');
    renderSources(data.sources || []);
    const fullHash = await hashText(`${q}\n${data.answer || ''}`);
    const shortHash = `${fullHash.slice(0, 24)}…`;
    document.getElementById('verificationHash')?.replaceChildren(document.createTextNode(shortHash));
    document.getElementById('web3Hash')?.replaceChildren(document.createTextNode(shortHash));
    const evidence = document.getElementById('evidenceState');
    if (evidence) evidence.textContent = data.sources?.length ? `${data.sources.length} sources` : 'No sources';
    saveHistory({ question: q, answer: data.answer || '', hash: fullHash, created_at: new Date().toISOString() });
    updateHistoryUI();
  } catch (error) {
    answer.textContent = API_BASE ? 'The intelligence service is unavailable right now. Check the API connection.' : 'The local knowledge layer could not be loaded. Refresh and try again.';
    renderSources([]);
    console.error(error);
  } finally {
    send.disabled = false;
    send.innerHTML = '<span>Ask</span><b>↗</b>';
  }
});

window.addEventListener('load', async () => {
  updateHistoryUI();
  const initial = `${(await hashText('NOVEN demo · browser runtime · evidence-first')).slice(0, 24)}…`;
  document.getElementById('verificationHash')?.replaceChildren(document.createTextNode(initial));
  document.getElementById('web3Hash')?.replaceChildren(document.createTextNode(initial));
});