const config = window.NASHHAL_AI_CONFIG || {};
const API_BASE = config.apiBase || localStorage.getItem('nashhal_ai_api') || '';
const form = document.getElementById('chatForm');
const question = document.getElementById('question');
const send = document.getElementById('send');
const result = document.getElementById('result');
const answer = document.getElementById('answer');
const sources = document.getElementById('sources');

function renderSources(items = []) {
  if (!items.length) {
    sources.innerHTML = '<small>لم يتم العثور على مصادر مطابقة في قاعدة المعرفة الحالية.</small>';
    return;
  }
  sources.innerHTML = items.map((item, index) => {
    const safeTitle = String(item.title || `مصدر ${index + 1}`);
    const href = String(item.url || '#');
    const source = String(item.source || 'مصدر غير معروف');
    return `<div class="source"><div><a href="${href}" target="_blank" rel="noopener noreferrer">${safeTitle}</a><small>${source} · ${item.published_at || 'وقت النشر غير متاح'}</small></div><small>relevance ${Number(item.score || 0).toFixed(3)}</small></div>`;
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

async function runBrowserDemo(q) {
  const docs = await loadDemoKnowledge();
  const ranked = docs
    .map((doc) => ({ ...doc, score: scoreDocument(q, doc) }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!ranked.length) {
    return {
      answer: 'هذه نسخة تجريبية مجانية تعمل من المتصفح فقط. لم أجد في قاعدة المعرفة التجريبية مصدرًا يطابق السؤال، لذلك لن أخمّن الإجابة.',
      sources: [],
    };
  }

  const best = ranked[0];
  return {
    answer: `وضع العرض التجريبي: بناءً على المصدر الأعلى تطابقًا، ${best.text} هذه ليست إجابة من نموذج لغوي كبير، بل تجربة للاسترجاع الموثق قبل تشغيل النموذج الكامل.`,
    sources: ranked,
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const q = question.value.trim();
  if (!q) return;

  send.disabled = true;
  send.textContent = API_BASE ? 'جارٍ الاسترجاع…' : 'جارٍ البحث…';
  result.classList.remove('hidden');
  answer.textContent = API_BASE
    ? 'يبحث Nashhal AI في المصادر المرتبطة بالسؤال…'
    : 'يبحث Nashhal AI في قاعدة المعرفة التجريبية المحلية…';
  sources.innerHTML = '';

  try {
    if (!API_BASE) {
      const data = await runBrowserDemo(q);
      answer.textContent = data.answer;
      renderSources(data.sources);
      return;
    }

    const response = await fetch(`${API_BASE.replace(/\/$/, '')}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, top_k: 5 }),
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    answer.textContent = data.answer || 'لم ينتج النموذج إجابة.';
    renderSources(data.sources);
  } catch (error) {
    answer.textContent = API_BASE
      ? 'تعذر الاتصال بخدمة Nashhal AI حاليًا. تحقق من عنوان API وحالة الخادم.'
      : 'تعذر تحميل قاعدة العرض التجريبي. تأكد من أن GitHub Pages نشر مجلد ai/data.';
    renderSources([]);
    console.error(error);
  } finally {
    send.disabled = false;
    send.innerHTML = 'اسأل النموذج <span>↗</span>';
  }
});