(() => {
  const Accuracy = {
    version: '1.0.0',
    skills: [
      { id:'answer', label:'Answer', icon:'↗', description:'Direct answer with evidence' },
      { id:'research', label:'Research', icon:'⌕', description:'Multi-source current research' },
      { id:'explain', label:'Explain', icon:'◎', description:'Clear step-by-step explanation' },
      { id:'compare', label:'Compare', icon:'⇄', description:'Side-by-side comparison' },
      { id:'summarize', label:'Summarize', icon:'≡', description:'Concise source-grounded summary' },
      { id:'translate', label:'Translate', icon:'文', description:'Meaning-preserving translation' },
      { id:'plan', label:'Plan', icon:'✦', description:'Actionable plan with assumptions' },
      { id:'code', label:'Code', icon:'<>', description:'Practical code and debugging' },
      { id:'verify', label:'Verify', icon:'✓', description:'Check claims and show uncertainty' }
    ],

    normalize(value) {
      return String(value || '').toLowerCase()
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[إأآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/ة/g, 'ه')
        .replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ').trim();
    },

    detectSkill(text, requested) {
      const n = this.normalize(text);
      if (requested && this.skills.some(s => s.id === requested)) return requested;
      if (/\b(compare|versus|vs|difference|فرق|قارن|مقارنه)\b/.test(n)) return 'compare';
      if (/\b(summarize|summary|tl dr|لخص|ملخص|اختصر)\b/.test(n)) return 'summarize';
      if (/\b(translate|translation|ترجم|ترجمه)\b/.test(n)) return 'translate';
      if (/\b(explain|why|how does|اشرح|لماذا|كيف)\b/.test(n)) return 'explain';
      if (/\b(plan|roadmap|steps|خطة|خطوات|كيف ابدا)\b/.test(n)) return 'plan';
      if (/\b(code|javascript|python|html|css|api|bug|error|برمج|كود|خطأ)\b/.test(n)) return 'code';
      if (/\b(verify|fact check|check this|تحقق|هل صحيح|تاكد)\b/.test(n)) return 'verify';
      if (/\b(research|sources|latest|current|today|recent|ابحث|بحث|مصادر|اخر|حاليا|اليوم)\b/.test(n)) return 'research';
      return 'answer';
    },

    freshnessNeeded(text) {
      const n = this.normalize(text);
      return /\b(today|latest|current|now|recent|2026|2025|price|score|schedule|news|nowadays|اليوم|حاليا|اخر|احدث|سعر|نتيجه|جدول|اخبار)\b/.test(n);
    },

    buildPrompt(question, context, skill, language) {
      const lang = language || (/[\u0600-\u06ff]/.test(question) ? 'ar' : 'en');
      return [
        'You are NOVEN, a verification-first intelligence assistant.',
        'Answer only from retrieved evidence when the claim is factual.',
        'Never invent sources, dates, names, numbers, quotations, or citations.',
        'Distinguish confirmed facts from inference and say when evidence is insufficient.',
        'For current/fresh questions, require live web evidence before stating a fact as current.',
        'Prefer primary sources: official government, institutions, papers, company documentation, direct datasets.',
        'Cross-check important claims across independent sources when possible.',
        'Return a useful answer even when some details are uncertain; label uncertainty explicitly.',
        `Respond in language: ${lang}.`,
        `Skill: ${skill}.`,
        `Question: ${question}`,
        `Retrieved evidence:\n${context || '(none)'}`
      ].join('\n\n');
    },

    formatEvidence(items) {
      return (items || []).slice(0, 8).map((x, i) => {
        const title = x.title || x.name || `Source ${i + 1}`;
        const source = x.source || x.publisher || x.domain || 'Reference';
        const text = x.text || x.extract || x.description || '';
        const url = x.url || x.link || '';
        return `[${i + 1}] ${title}\nPublisher: ${source}\nURL: ${url}\nContent: ${String(text).slice(0, 1800)}`;
      }).join('\n\n');
    }
  };
  window.NOVEN_ACCURACY = Accuracy;
})();
