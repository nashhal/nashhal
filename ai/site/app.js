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

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function renderSources(items = []) {
  if (!items.length) {
    sources.innerHTML = '<div class="empty-evidence">No matching evidence found in the current knowledge base.</div>';
    return;
  }
  sources.innerHTML = items.map((item, index) => {
    const title = escapeHtml(item.title || `Source ${index + 1}`);
    const href = escapeHtml(item.url || '#');
    const source = escapeHtml(item.source || 'Unknown source');
    const date = escapeHtml(item.published_at || 'Date unavailable');
    return `<article class="source"><div><a href="${href}" target="_blank" rel="noopener noreferrer">${title}</a><small>${source} · ${date}</small></div><small>${Number(item.score || 0).toFixed(3)}</small></article>`;
  }).join('');
}

const normalize = (text) => String(text || '')
  .toLowerCase()
  .replace(/[\u064B-\u065F\u0670]/g, '')
  .replace(/[إأآا]/g, 'ا')
  .replace(/[ىي]/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/[^\w\u0600-\u06ff]+/g, ' ')
  .trim();

const tokens = (text) => new Set(normalize(text).split(/\s+/).filter((t) => t.length > 1));

function scoreDocument(query, doc) {
  const q = tokens(query);
  const d = tokens(`${doc.title} ${doc.text}`);
  let hits = 0;
  q.forEach((token) => { if (d.has(token)) hits += 1; });
  return hits / Math.max(q.size, 1);
}

async function loadDemoKnowledge() {
  const base = new URL('../data/demo-kb.json', window.location.href);
  const response = await fetch(base);
  if (!response.ok) throw new Error(`Demo KB ${response.status}`);
  return response.json();
}

async function hashText(text) {
  if (!window.crypto?.subtle) return 'local-demo';
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function showStatus(text) {
  const chip = document.querySelector('.model-chip');
  if (chip) chip.lastChild.textContent = ` ${text}`;
}

async function typeResponse(text) {
  answer.textContent = '';
  const words = String(text).split(/(\s+)/);
  let buffer = '';
  for (const part of words) {
    buffer += part;
    answer.textContent = buffer;
    await sleep(part.trim() ? 10 : 2);
  }
}

async function runBrowserDemo(q) {
  showStatus('NOVEN demo');
  const docs = await loadDemoKnowledge();
  await sleep(280);
  const ranked = docs
    .map((doc) => ({ ...doc, score: scoreDocument(q, doc) }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!ranked.length) {
    return {
      answer: 'No grounded answer was found for this question in the demo knowledge base. NOVEN does not invent a result when supporting evidence is missing.',
      sources: [],
    };
  }

  const best = ranked[0];
  return {
    answer: `Based on the strongest matching source: ${best.text}\n\nThis is the interactive browser prototype. It demonstrates retrieval, evidence display and output verification before a full local model is connected.`,
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
  showStatus(API_BASE ? 'Connected' : 'Browser demo');

  try {
    let data;
    if (!API_BASE) {
      data = await runBrowserDemo(q);
    } else {
      const response = await fetch(`${API_BASE.replace(/\/$/, '')}/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, top_k: 5 }),
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      data = await response.json();
    }

    await typeResponse(data.answer || 'No response.');
    renderSources(data.sources || []);

    const verification = document.getElementById('verificationHash');
    if (verification) verification.textContent = (await hashText(`${q}\n${data.answer || ''}`)).slice(0, 24) + '…';

    const evidence = document.getElementById('evidenceState');
    if (evidence) evidence.textContent = data.sources?.length ? `${data.sources.length} sources` : 'No sources';
  } catch (error) {
    answer.textContent = API_BASE
      ? 'The intelligence service is unavailable right now. Check the API connection.'
      : 'The demo knowledge layer could not be loaded. Refresh the page and try again.';
    renderSources([]);
    console.error(error);
  } finally {
    send.disabled = false;
    send.innerHTML = '<span>Ask</span><b>↗</b>';
  }
});

question.addEventListener('input', () => {
  if (count) count.textContent = question.value.length;
});

document.querySelectorAll('.suggestion').forEach((button) => {
  button.addEventListener('click', () => {
    question.value = button.dataset.question || '';
    if (count) count.textContent = question.value.length;
    question.focus();
  });
});

document.querySelectorAll('.mode').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.mode').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    question.dataset.prefix = button.dataset.prefix || '';
    question.focus();
  });
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    question.focus();
  }
  if (event.key === 'Escape') question.blur();
});

window.addEventListener('load', async () => {
  const demoHash = document.getElementById('verificationHash');
  if (demoHash) demoHash.textContent = (await hashText('NOVEN demo · evidence-first workspace')).slice(0, 24) + '…';
});