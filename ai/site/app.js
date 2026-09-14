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

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const q = question.value.trim();
  if (!q) return;

  send.disabled = true;
  send.textContent = 'جارٍ الاسترجاع…';
  result.classList.remove('hidden');
  answer.textContent = 'يبحث Nashhal AI في المصادر المرتبطة بالسؤال…';
  sources.innerHTML = '';

  if (!API_BASE) {
    answer.textContent = 'واجهة Nashhal AI منشورة، لكن خادم النموذج غير متصل بعد. هذه الصفحة لا تشغّل نموذج اللغة داخل GitHub Pages.';
    renderSources([]);
    send.disabled = false;
    send.innerHTML = 'اسأل النموذج <span>↗</span>';
    return;
  }

  try {
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
    answer.textContent = 'تعذر الاتصال بخدمة Nashhal AI حاليًا. تحقق من عنوان API وحالة الخادم.';
    renderSources([]);
    console.error(error);
  } finally {
    send.disabled = false;
    send.innerHTML = 'اسأل النموذج <span>↗</span>';
  }
});
