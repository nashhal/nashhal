(() => {
  const headings = {
    en: ['Think.', 'Verify.'], ar: ['فكّر.', 'تحقّق.'], es: ['Piensa.', 'Verifica.'], fr: ['Pensez.', 'Vérifiez.'],
    de: ['Denke.', 'Prüfe.'], pt: ['Pense.', 'Verifique.'], zh: ['思考。', '验证。'], ja: ['考える。', '検証する。'],
    ko: ['생각하세요.', '검증하세요.'], hi: ['सोचें।', 'सत्यापित करें।'], tr: ['Düşün.', 'Doğrula.'], ru: ['Думайте.', 'Проверяйте.'],
    it: ['Pensa.', 'Verifica.'], nl: ['Denk.', 'Verifieer.'], id: ['Pikirkan.', 'Verifikasi.'], vi: ['Suy nghĩ.', 'Xác minh.'],
    th: ['คิด.', 'ตรวจสอบ.'], pl: ['Myśl.', 'Zweryfikuj.'], uk: ['Думай.', 'Перевіряй.'], fa: ['بیندیش.', 'بررسی کن.'],
    ur: ['سوچیں۔', 'تصدیق کریں۔'], bn: ['ভাবুন।', 'যাচাই করুন।'], he: ['חשבו.', 'אמתו.']
  };
  const suggestions = {
    en: ['What is NOVEN?', 'What is artificial intelligence?', 'What does Web3 add here?'],
    ar: ['ما هو NOVEN؟', 'ما هو الذكاء الاصطناعي؟', 'ماذا يضيف Web3 هنا؟'],
    es: ['¿Qué es NOVEN?', '¿Qué es la inteligencia artificial?', '¿Qué aporta Web3?'],
    fr: ['Qu’est-ce que NOVEN ?', 'Qu’est-ce que l’intelligence artificielle ?', 'Que permet Web3 ?'],
    de: ['Was ist NOVEN?', 'Was ist künstliche Intelligenz?', 'Was bringt Web3?'],
    pt: ['O que é NOVEN?', 'O que é inteligência artificial?', 'O que o Web3 adiciona?'],
    zh: ['什么是 NOVEN？', '什么是人工智能？', 'Web3 有什么作用？'],
    ja: ['NOVENとは？', '人工知能とは？', 'Web3は何を加える？'],
    ko: ['NOVEN이란?', '인공지능이란?', 'Web3는 무엇을 더하나요?'],
    hi: ['NOVEN क्या है?', 'कृत्रिम बुद्धिमत्ता क्या है?', 'Web3 क्या जोड़ता है?'],
    tr: ['NOVEN nedir?', 'Yapay zekâ nedir?', 'Web3 ne ekliyor?'],
    ru: ['Что такое NOVEN?', 'Что такое искусственный интеллект?', 'Что даёт Web3?'],
    it: ['Cos’è NOVEN?', 'Cos’è l’intelligenza artificiale?', 'Cosa aggiunge Web3?'],
    nl: ['Wat is NOVEN?', 'Wat is kunstmatige intelligentie?', 'Wat voegt Web3 toe?'],
    id: ['Apa itu NOVEN?', 'Apa itu kecerdasan buatan?', 'Apa yang ditambahkan Web3?'],
    vi: ['NOVEN là gì?', 'Trí tuệ nhân tạo là gì?', 'Web3 bổ sung gì?'],
    th: ['NOVEN คืออะไร?', 'ปัญญาประดิษฐ์คืออะไร?', 'Web3 เพิ่มอะไร?'],
    pl: ['Czym jest NOVEN?', 'Czym jest sztuczna inteligencja?', 'Co daje Web3?'],
    uk: ['Що таке NOVEN?', 'Що таке штучний інтелект?', 'Що додає Web3?'],
    fa: ['NOVEN چیست؟', 'هوش مصنوعی چیست؟', 'Web3 چه چیزی اضافه می‌کند؟'],
    ur: ['NOVEN کیا ہے؟', 'مصنوعی ذہانت کیا ہے؟', 'Web3 کیا شامل کرتا ہے؟'],
    bn: ['NOVEN কী?', 'কৃত্রিম বুদ্ধিমত্তা কী?', 'Web3 কী যোগ করে?'],
    he: ['מהו NOVEN?', 'מהי בינה מלאכותית?', 'מה Web3 מוסיף?']
  };
  function apply(code) {
    const key = headings[code] ? code : 'en';
    const h = document.querySelector('.hero h1');
    if (h) h.innerHTML = `${headings[key][0]}<br><span>${headings[key][1]}</span>`;
    const items = suggestions[key] || suggestions.en;
    document.querySelectorAll('.suggestion').forEach((button, i) => { if (items[i]) { button.textContent = items[i]; button.dataset.question = items[i]; } });
    const q = document.getElementById('question');
    if (q) q.dir = ['ar','fa','ur','he'].includes(code) ? 'rtl' : 'ltr';
  }
  window.addEventListener('noven:language', (event) => apply(event.detail));
  document.addEventListener('DOMContentLoaded', () => apply(window.NOVEN_I18N?.language || 'en'));
})();
