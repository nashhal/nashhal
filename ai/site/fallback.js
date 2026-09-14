(() => {
  const form = document.getElementById('chatForm');
  const question = document.getElementById('question');
  const send = document.getElementById('send');
  const result = document.getElementById('result');
  const answer = document.getElementById('answer');
  const sources = document.getElementById('sources');
  const hash = document.getElementById('verificationHash');
  if (!form || !question || !send || !result || !answer || !sources) return;

  const replies = [
    { keys: ['demo', 'prototype', 'what does', 'what is this'], text: 'NOVEN is a browser-first intelligence prototype. It retrieves matching knowledge, shows the supporting evidence, and creates a verification hash for the result. A full language model can be connected later without changing the workspace.' },
    { keys: ['web3', 'blockchain', 'on-chain', 'on chain'], text: 'NOVEN uses Web3 as an optional trust layer. The current prototype can hash an output and, when a wallet is available, sign the verification record. On-chain anchoring is intended for a public testnet rather than as a requirement for everyday use.' },
    { keys: ['github pages', 'gpu', 'local model', 'qwen'], text: 'GitHub Pages is used for the interface and static knowledge files. A large language model such as Qwen3-8B needs compute outside GitHub Pages, so the current demo uses browser retrieval first and keeps the local-model deployment path ready.' },
    { keys: ['retrieval', 'search', 'source', 'sources', 'evidence'], text: 'The prototype ranks available knowledge records by term overlap and shows the strongest matching evidence beside the response. This is a retrieval demo, not yet a full semantic search or reasoning model.' },
  ];

  function norm(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ').trim();
  }

  function pick(q) {
    const n = norm(q);
    const hit = replies.find((item) => item.keys.some((key) => n.includes(norm(key))));
    if (hit) return hit.text;
    return `I received your question: “${q}”\n\nThe current free prototype is running without a hosted language model. It can answer from its local knowledge layer, show evidence when a match exists, and create a verification hash. For open-ended questions outside that knowledge, it will not pretend that a full AI model is running when it is not.`;
  }

  async function makeHash(text) {
    if (!window.crypto?.subtle) return 'browser-demo';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const q = question.value.trim();
    if (!q) return;
    send.disabled = true;
    send.innerHTML = '<span>Thinking</span><b>…</b>';
    result.classList.remove('hidden');
    answer.textContent = '';
    sources.innerHTML = '<div class="empty-evidence">Browser reasoning active…</div>';
    const text = pick(q);
    let out = '';
    for (const part of text.split(/(\s+)/)) {
      out += part;
      answer.textContent = out;
      await new Promise((resolve) => setTimeout(resolve, part.trim() ? 8 : 1));
    }
    sources.innerHTML = '<div class="empty-evidence">Fallback response · no external AI API</div>';
    const digest = await makeHash(`${q}\n${text}`);
    if (hash) hash.textContent = `${digest.slice(0, 24)}…`;
    const web3Hash = document.getElementById('web3Hash');
    if (web3Hash) web3Hash.textContent = `${digest.slice(0, 24)}…`;
    send.disabled = false;
    send.innerHTML = '<span>Ask</span><b>↗</b>';
  }, true);
})();
