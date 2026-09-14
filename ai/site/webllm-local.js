(()=>{
  if(window.__NOVEN_WEBLLM_LOCAL__)return;
  window.__NOVEN_WEBLLM_LOCAL__=true;
  const form=document.getElementById('chatForm'),q=document.getElementById('question'),send=document.getElementById('send'),result=document.getElementById('result'),answer=document.getElementById('answer'),sources=document.getElementById('sources');
  if(!form||!q||!send||!result||!answer||!sources)return;
  const CFG=window.NOVEN_ACCURACY||{};
  const language=()=>window.NOVEN_I18N?.language||((navigator.language||'en').split('-')[0]);
  const isArabic=()=>language()==='ar'||/[\u0600-\u06ff]/.test(q.value);
  const normalize=v=>CFG.normalize?CFG.normalize(v):String(v||'').toLowerCase();
  const cache=new Map();
  let enginePromise=null;
  let busy=false;

  const tr=(en,ar)=>isArabic()?ar:en;
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const status=text=>{
    const label=document.querySelector('.model-chip');
    if(label)label.innerHTML=`<span class="model-dot"></span>${esc(text)}`;
  };

  async function json(url,timeout=7000){
    if(cache.has(url))return cache.get(url);
    const ctl=new AbortController(); const timer=setTimeout(()=>ctl.abort(),timeout);
    const p=fetch(url,{signal:ctl.signal,cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(String(r.status));return r.json()}).finally(()=>clearTimeout(timer));
    cache.set(url,p); return p;
  }

  async function wiki(query){
    const lang=/[\u0600-\u06ff]/.test(query)?'ar':'en';
    const url=`https://${lang}.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=4&prop=extracts|info&inprop=url&explaintext=1&exintro=1&exchars=1800`;
    const data=await json(url,6500);
    return Object.values(data?.query?.pages||{}).filter(x=>x.extract).map(x=>({title:x.title,source:'Wikipedia',url:x.fullurl||`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(x.title||'').replace(/ /g,'_'))}`,text:x.extract}));
  }

  async function wikidata(query){
    const url=`https://www.wikidata.org/w/api.php?action=wbsearchentities&origin=*&format=json&language=en&uselang=en&type=item&limit=5&search=${encodeURIComponent(query)}`;
    const data=await json(url,6000);
    return (data?.search||[]).map(x=>({title:x.label||x.id,source:'Wikidata',url:`https://www.wikidata.org/wiki/${x.id}`,text:x.description||x.label||x.id}));
  }

  async function localDocs(){
    const urls=[new URL('../data/demo-kb.json',location.href).href,new URL('../data/live-news.json',location.href).href];
    const out=[];
    const results=await Promise.allSettled(urls.map(u=>json(u,6500)));
    for(const r of results)if(r.status==='fulfilled'){
      const d=r.value; const arr=Array.isArray(d)?d:d?.documents;
      if(Array.isArray(arr))out.push(...arr);
    }
    return out;
  }

  function rank(query,docs){
    const terms=[...new Set(normalize(query).split(/\s+/).filter(x=>x.length>1))];
    if(!terms.length)return[];
    return docs.map(d=>{
      const hay=normalize(`${d.title||''} ${d.text||d.description||''}`);
      let hits=0; for(const t of terms)if(hay.includes(t))hits++;
      return {...d,score:hits/terms.length};
    }).filter(x=>x.score>=0.24).sort((a,b)=>b.score-a.score).slice(0,6);
  }

  async function retrieve(query,skill){
    const docs=await localDocs();
    let evidence=rank(query,docs);
    const needsWeb=(CFG.freshnessNeeded?.(query)||['research','verify','compare'].includes(skill)||evidence.length<2);
    if(needsWeb){
      const [w,d]=await Promise.allSettled([wiki(query),wikidata(query)]);
      if(w.status==='fulfilled')evidence.push(...w.value);
      if(d.status==='fulfilled')evidence.push(...d.value);
      const seen=new Set(); evidence=evidence.filter(x=>{const k=x.url||x.title;if(seen.has(k))return false;seen.add(k);return true}).slice(0,8);
    }
    return evidence;
  }

  async function getEngine(){
    if(enginePromise)return enginePromise;
    if(!navigator.gpu){throw Error('WebGPU unavailable');}
    status(tr('Loading local AI model… first run downloads it once','جاري تحميل نموذج الذكاء الاصطناعي المحلي… في أول مرة فقط'));
    enginePromise=import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/+esm').then(async webllm=>{
      const model='Llama-3.2-3B-Instruct-q4f16_1-MLC';
      return webllm.CreateMLCEngine(model,{
        appConfig:webllm.prebuiltAppConfig,
        initProgressCallback:p=>{status(`${tr('NOVEN ·','NOVEN ·')} ${Math.round((p.progress||0)*100)}%`)}
      },{context_window_size:4096});
    }).catch(e=>{enginePromise=null;throw e;});
    return enginePromise;
  }

  function evidenceText(items){
    return items.slice(0,6).map((x,i)=>`[${i+1}] ${x.title||'Source'}\nPublisher: ${x.source||'Reference'}\nURL: ${x.url||''}\nContent: ${String(x.text||x.description||'').slice(0,1800)}`).join('\n\n');
  }

  function systemPrompt(skill){
    return [
      'You are NOVEN, a verification-first multilingual AI assistant.',
      'Give a direct, useful answer. Do not mention internal implementation unless asked.',
      'For factual claims, use the supplied evidence and do not invent names, dates, numbers, sources, or quotations.',
      'When evidence conflicts, say so and explain the conflict.',
      'When the evidence is insufficient, explicitly say that it is insufficient instead of guessing.',
      'Never present an old source as current. For current questions, rely on retrieved evidence.',
      'Prefer primary/authoritative evidence when it is available in the context.',
      'For comparison, separate criteria and give a clear conclusion.',
      'For code, produce correct runnable code and explain important assumptions briefly.',
      'For translation, preserve meaning and do not add unsupported content.',
      `Skill: ${skill}.`,
      `Answer in ${language()==='ar'?'Arabic':language()==='en'?'English':language()}.`
    ].join('\n');
  }

  async function generate(query,skill,evidence){
    const engine=await getEngine();
    const context=evidenceText(evidence);
    const prompt=CFG.buildPrompt?CFG.buildPrompt(query,context,skill,language()):`Question: ${query}\n\nEvidence:\n${context}`;
    const response=await engine.chat.completions.create({
      messages:[
        {role:'system',content:systemPrompt(skill)},
        {role:'user',content:prompt}
      ],
      temperature:0.15,
      top_p:0.85,
      repetition_penalty:1.05,
      max_tokens:700,
      enable_thinking:false
    });
    return response?.choices?.[0]?.message?.content?.trim()||'';
  }

  function renderEvidence(items){
    sources.innerHTML=items.length?items.map((x,i)=>`<article class="source"><div><a href="${esc(x.url||'#')}" target="_blank" rel="noopener noreferrer">${esc(x.title||`Source ${i+1}`)}</a><small>${esc(x.source||'Reference')}</small></div><small>${x.score!=null?Number(x.score).toFixed(2):'ref'}</small></article>`).join(''):`<div class="empty-evidence">${esc(tr('No external source was available.','لا يوجد مصدر خارجي متاح.'))}</div>`;
    const st=document.getElementById('evidenceState'); if(st)st.textContent=items.length?`${items.length} sources`:'No sources';
  }

  async function digest(text){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(text)));return'0x'+Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('')}

  async function submit(event){
    event.preventDefault(); event.stopImmediatePropagation();
    const query=q.value.trim(); if(!query||busy)return;
    busy=true; send.disabled=true; result.classList.remove('hidden'); answer.textContent='';
    send.innerHTML=`<span>${esc(tr('Thinking','يفكر'))}</span><b>…</b>`;
    status(tr('NOVEN · evidence + local AI','NOVEN · الأدلة + الذكاء المحلي'));
    sources.innerHTML=`<div class="empty-evidence">${esc(tr('Finding evidence…','جاري البحث عن الأدلة…'))}</div>`;
    const started=performance.now();
    try{
      const skill=CFG.detectSkill?CFG.detectSkill(query,q.dataset.skill):'answer';
      const evidence=await retrieve(query,skill);
      if(!evidence.length&&CFG.freshnessNeeded?.(query))throw Error('No reliable evidence for a fresh factual query');
      const text=await generate(query,skill,evidence);
      if(!text)throw Error('Model returned an empty answer');
      answer.textContent=text;
      renderEvidence(evidence);
      const outputHash=await digest(`${query}\n${text}\n${JSON.stringify(evidence)}`);
      const short=`${outputHash.slice(0,26)}…`;
      document.getElementById('verificationHash')?.replaceChildren(document.createTextNode(short));
      document.getElementById('web3Hash')?.replaceChildren(document.createTextNode(short));
      window.NOVEN_TRUST_RUN={runId:`NVR-${Date.now().toString(36).toUpperCase()}`,question:query,answer:text,sources:evidence,outputHash,createdAt:new Date().toISOString(),runtime:'WebLLM local',model:'Llama-3.2-3B-Instruct-q4f16_1-MLC',dataset:'NOVEN local + Wikipedia + Wikidata',language:language(),skill,confidence:evidence.length>=2?'grounded':'guarded',latencyMs:Math.round(performance.now()-started)};
      window.dispatchEvent(new CustomEvent('noven:run',{detail:window.NOVEN_TRUST_RUN}));
      const meta=document.querySelector('.response-meta span:last-child'); if(meta)meta.textContent=`${skill} · ${window.NOVEN_TRUST_RUN.confidence}`;
      status(tr('NOVEN · local model ready','NOVEN · النموذج المحلي جاهز'));
    }catch(e){
      console.error('NOVEN local AI:',e);
      const message=e.message==='WebGPU unavailable'
        ?tr('Local AI needs a WebGPU-compatible browser. The browser evidence engine is still available.','الذكاء الاصطناعي المحلي يحتاج متصفحًا يدعم WebGPU ويمكنك استخدام محرك الأدلة في المتصفح.')
        :tr('NOVEN could not produce a grounded answer. Try a more specific question.','تعذر على NOVEN إنتاج إجابة مبنية على أدلة. جرّب سؤالًا أكثر تحديدًا.');
      answer.textContent=message; renderEvidence([]); status(tr('NOVEN · browser fallback','NOVEN · وضع المتصفح الاحتياطي'));
    }finally{busy=false;send.disabled=false;send.innerHTML='<span>Ask</span><b>↗</b>';}
  }

  const fresh=form.cloneNode(true); form.replaceWith(fresh);
  const F=document.getElementById('chatForm');
  F.addEventListener('submit',submit,true);
  window.addEventListener('load',()=>{status(tr('NOVEN · local AI · WebGPU','NOVEN · ذكاء محلي · WebGPU'));}, {once:true});
})();
