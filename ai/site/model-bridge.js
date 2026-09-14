(()=>{
  if(window.__NOVEN_MODEL_BRIDGE__)return;
  window.__NOVEN_MODEL_BRIDGE__=true;
  const cfg=window.NASHHAL_AI_CONFIG||{};
  let enginePromise=null;
  let engineModel='';
  const history=[];
  const candidates=[
    cfg.localModel,
    'Llama-3.1-8B-Instruct-q4f32_1-MLC',
    'Llama-3.2-3B-Instruct-q4f16_1-MLC'
  ].filter(Boolean);
  const langName=language=>language==='ar'?'Arabic':'English';
  const setStatus=text=>{
    const m=document.querySelector('.model-chip');
    if(m)m.innerHTML=`<span class="model-dot"></span>${String(text).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}`;
  };
  async function load(){
    if(enginePromise)return enginePromise;
    if(!('gpu' in navigator))return null;
    enginePromise=(async()=>{
      try{
        setStatus('NOVEN · loading open model');
        const W=await import('https://esm.run/@mlc-ai/web-llm@0.2.85');
        const list=W.prebuiltAppConfig?.model_list||[];
        const available=candidates.find(id=>list.some(x=>x.model_id===id));
        const model=available||list.find(x=>/Llama-3\.2-3B-Instruct|Llama-3\.1-8B-Instruct/.test(x.model_id||''))?.model_id;
        if(!model)throw new Error('No supported WebLLM model found');
        engineModel=model;
        const appConfig={...W.prebuiltAppConfig,cacheBackend:'indexeddb'};
        const engine=await W.CreateMLCEngine(model,{appConfig,initProgressCallback:p=>setStatus(`NOVEN · ${p?.text||Math.round((p?.progress||0)*100)+'%'}`)});
        setStatus(`NOVEN · ${model}`);
        return engine;
      }catch(error){
        enginePromise=null;
        console.warn('NOVEN model bridge unavailable',error);
        setStatus('NOVEN · evidence mode');
        return null;
      }
    })();
    return enginePromise;
  }
  async function chat({query,skill,language,evidence}={}){
    const engine=await load();
    if(!engine)return null;
    const response=window.NOVEN_RESPONSE;
    const built=response?.build
      ? response.build(query,skill||'answer',language||'en',evidence||[],history)
      : {system:`You are NOVEN. Answer in ${langName(language||'en')}. Use only supplied evidence.`,context:String(query||'')};
    const messages=[
      {role:'system',content:built.system},
      ...history.slice(-6),
      {role:'user',content:built.context}
    ];
    const result=await engine.chat.completions.create({
      messages,
      temperature:.25,
      top_p:.9,
      repetition_penalty:1.05,
      max_tokens:900,
      stream:false
    });
    let text=result?.choices?.[0]?.message?.content?.trim()||'';
    if(response?.cleanText)text=response.cleanText(text);
    if(text){
      history.push({role:'user',content:String(query||'').slice(0,2500)});
      history.push({role:'assistant',content:text.slice(0,5000)});
      if(history.length>12)history.splice(0,history.length-12);
    }
    return text||null;
  }
  window.NOVEN_LLM={chat,get engine(){return enginePromise},get model(){return engineModel||'WebLLM'}};
})();
