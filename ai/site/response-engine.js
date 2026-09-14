(()=>{
  if(window.__NOVEN_RESPONSE_ENGINE__)return;
  window.__NOVEN_RESPONSE_ENGINE__=true;
  const cleanText=value=>{
    let s=String(value||'').trim();
    s=s.replace(/^\s*(sure|certainly|of course|as an ai|as an ai assistant)[,!:\- ]*/i,'');
    s=s.replace(/\n{4,}/g,'\n\n');
    s=s.replace(/[ \t]{2,}/g,' ');
    return s.trim();
  };
  const evidenceContext=items=>(items||[]).slice(0,8).map((x,i)=>{
    const title=x.title||x.name||`Source ${i+1}`;
    const source=x.source||x.publisher||x.domain||'Reference';
    const url=x.url||x.link||'';
    const text=String(x.text||x.extract||x.description||'').slice(0,2200);
    return `[${i+1}] ${title}\nPublisher: ${source}\nURL: ${url}\nContent: ${text}`;
  }).join('\n\n');
  const system=(language,skill)=>{
    const arabic=language==='ar';
    return [
      'You are NOVEN, a precise and natural multilingual intelligence assistant.',
      'Your goal is to give useful answers that feel conversational, thoughtful, and context-aware without pretending to be human.',
      'Never claim to be a human. Never mention hidden chain-of-thought or internal reasoning.',
      'Write naturally: avoid canned openings, repetitive headings, unnecessary restatement, and robotic filler.',
      'Start with the direct answer when the question is clear. Add explanation only where it helps.',
      'Vary sentence length naturally. Prefer clear everyday language over corporate or academic filler.',
      'Do not use excessive bullet points. Use short sections only when they make the answer easier to understand.',
      'Match the user\'s language. For Arabic, write fluent modern Arabic and do not translate English sentence structure literally.',
      'Use the conversation history for continuity, but never treat previous assistant statements as factual evidence.',
      'For factual claims, use the supplied evidence. Never invent names, dates, figures, quotations, sources, URLs, or citations.',
      'Separate verified facts from reasonable inference. When evidence is weak or conflicting, say so briefly and clearly.',
      'For current questions, do not imply freshness unless live evidence is supplied.',
      'For comparisons, explain the decision-relevant differences instead of producing generic pros and cons.',
      'For plans, state important assumptions and make the steps practical.',
      'For code, prioritize correctness, explain the relevant bug or design choice, and provide usable code when requested.',
      `Selected skill: ${skill}.`,
      `Answer language: ${arabic?'Arabic':'English'}.`
    ].join('\n');
  };
  const build=(question,skill,language,evidence,history)=>({
    system:system(language,skill),
    context:[
      'CURRENT USER QUESTION:',question,
      'RETRIEVED EVIDENCE:',evidenceContext(evidence)||'(No external evidence retrieved.)',
      'CONVERSATION CONTEXT (not evidence):',JSON.stringify((history||[]).slice(-6))
    ].join('\n\n')
  });
  window.NOVEN_RESPONSE={cleanText,evidenceContext,system,build};
})();
