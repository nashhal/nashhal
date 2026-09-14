(()=>{
  if(window.__NOVEN_MASTER_RUNTIME__)return;
  window.__NOVEN_MASTER_RUNTIME__=true;
  const form=document.getElementById('chatForm'),q=document.getElementById('question'),send=document.getElementById('send'),result=document.getElementById('result'),answer=document.getElementById('answer'),sources=document.getElementById('sources');
  if(!form||!q||!send||!result||!answer||!sources){console.error('NOVEN: required chat UI is missing');return;}
  let busy=false;
  const cache=new Map();
  const cfg=window.NOVEN_ACCURACY||{};
  const lang=()=>window.NOVEN_I18N?.language||((navigator.language||'en').split('-')[0]);
  const ar=()=>lang()==='ar'||/[\u0600-\u06ff]/.test(q.value);
  const tr=(en,ara)=>ar()?ara:en;
  const norm=v=>cfg.normalize?cfg.normalize(v):String(v||'').toLowerCase().trim();
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const setStatus=t=>{const m=document.querySelector('.model-chip');if(m)m.innerHTML=`<span class="model-dot"></span>${esc(t)}`;};
  const get=async(url,timeout=7500)=>{
    if(cache.has(url))return cache.get(url);
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
    const p=fetch(url,{signal:ctl.signal,cache:'force-cache'})
      .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();})
      .finally(()=>clearTimeout(timer));
    cache.set(url,p);return p;
  };
  const render=items=>{
    const list=Array.isArray(items)?items:[];
    sources.innerHTML=list.length?list.map((x,i)=>`<article class="source"><div><a href="${esc(x.url||'#')}" target="_blank" rel="noopener noreferrer">${esc(x.title||`Source ${i+1}`)}</a><small>${esc(x.source||x.publisher||'Reference')}</small></div><small>${x.score!=null?Number(x.score).toFixed(2):'ref'}</small></article>`).join(''):`<div class="empty-evidence">${esc(tr('No reliable source attached.','لا يوجد مصدر موثوق مرفق.'))}</div>`;
  };
  async function wiki(query){
    const l=/[\u0600-\u06ff]/.test(query)?'ar':((lang()==='en'||lang()==='ar')?lang():'en');
    const u=`https://${l}.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=extracts|info&inprop=url&explaintext=1&exintro=1&exchars=1800`;
    const d=await get(u,7000);
    return Object.values(d?.query?.pages||{}).filter(x=>x.extract).map(x=>({title:x.title,source:'Wikipedia',url:x.fullurl||`https://${l}.wikipedia.org/wiki/${encodeURIComponent(String(x.title||'').replace(/ /g,'_'))}`,text:x.extract,score:.80}));
  }
  async function wikidata(query){
    const u=`https://www.wikidata.org/w/api.php?action=wbsearchentities&origin=*&format=json&language=en&uselang=en&type=item&limit=6&search=${encodeURIComponent(query)}`;
    const d=await get(u,6500);
    return(d?.search||[]).map(x=>({title:x.label||x.id,source:'Wikidata',url:`https://www.wikidata.org/wiki/${x.id}`,text:x.description||x.label||x.id,score:.58}));
  }
  async function localDocs(){
    const paths=['../data/demo-kb.json','../data/live-news.json'];
    const rs=await Promise.allSettled(paths.map(p=>get(new URL(p,location.href).href)));
    const out=[];
    for(const r of rs)if(r.status==='fulfilled'){const v=Array.isArray(r.value)?r.value:r.value?.documents;if(Array.isArray(v))out.push(...v);}
    return out;
  }
  function rank(query,items){
    const ts=[...new Set(norm(query).split(/\s+/).filter(x=>x.length>1))];
    if(!ts.length)return[];
    return items.map(d=>{const h=norm(`${d.title||''} ${d.text||d.description||''}`);let hit=0;for(const t of ts)if(h.includes(t))hit++;return{...d,score:hit/ts.length};}).filter(d=>d.score>=.25).sort((a,b)=>b.score-a.score).slice(0,6);
  }
  async function retrieve(query,skill){
    let e=rank(query,await localDocs());
    const fresh=cfg.freshnessNeeded?.(query);
    if(fresh||['research','verify','compare'].includes(skill)||e.length<2){
      const [w,d]=await Promise.allSettled([wiki(query),wikidata(query)]);
      if(w.status==='fulfilled')e.push(...w.value);
      if(d.status==='fulfilled')e.push(...d.value);
    }
    const seen=new Set();
    return e.filter(x=>{const key=x.url||`${x.source}:${x.title}`;if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,8);
  }
  async function llm(query,skill,evidence){
    const fn=window.NOVEN_LLM?.chat;
    if(typeof fn!=='function')return null;
    return fn({query,skill,language:lang(),evidence}).catch(error=>{console.warn('NOVEN LLM unavailable',error);return null;});
  }
  function fallback(query,skill,e){
    if(!e.length)return tr('I do not have enough reliable evidence to answer this factually without guessing.','لا أملك أدلة موثوقة كافية للإجابة الواقعية دون تخمين.');
    const lead=e[0];
    if(skill==='compare'&&e.length>1)return `${tr('Comparison from retrieved evidence','مقارنة من الأدلة المسترجعة')}\n\n${lead.title}\n${lead.text||lead.description||''}\n\n${e[1].title}\n${e[1].text||e[1].description||''}`;
    if(skill==='summarize')return `${tr('Summary','الملخص')}\n\n${String(lead.text||lead.description||lead.title).slice(0,1400)}`;
    if(skill==='explain')return `${tr('Explanation','الشرح')}\n\n${lead.text||lead.description||lead.title}`;
    return `${lead.text||lead.description||lead.title}\n\n${tr('Sources are shown beside this answer.','المصادر ظاهرة بجانب هذه الإجابة.')}`;
  }
  function focusAsk(){q.focus();q.scrollIntoView({behavior:'smooth',block:'center'});}
  const submit=async ev=>{
    ev.preventDefault();
    ev.stopImmediatePropagation();
    if(busy)return;
    const query=q.value.trim();
    if(!query){focusAsk();return;}
    busy=true;send.disabled=true;result.classList.remove('hidden');answer.removeAttribute('data-placeholder');answer.textContent='';
    setStatus(tr('NOVEN · understanding the question','NOVEN · يفهم السؤال'));
    sources.innerHTML=`<div class="empty-evidence">${esc(tr('Checking trusted references…','جار التحقق من المراجع الموثوقة…'))}</div>`;
    const start=performance.now();
    try{
      const skill=cfg.detectSkill?cfg.detectSkill(query,q.dataset.skill):'answer';
      setStatus(tr('NOVEN · retrieving evidence','NOVEN · يسترجع الأدلة'));
      const evidence=await retrieve(query,skill);
      setStatus(tr('NOVEN · composing answer','NOVEN · يصيغ الإجابة'));
      const generated=await llm(query,skill,evidence);
      const text=generated||(window.NOVEN_RESPONSE?.cleanText?window.NOVEN_RESPONSE.cleanText(fallback(query,skill,evidence)):fallback(query,skill,evidence));
      answer.textContent=text;
      render(evidence);
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${query}\n${text}\n${JSON.stringify(evidence)}`));
      const hash='0x'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      const short=hash.slice(0,26)+'…';
      document.getElementById('verificationHash')?.replaceChildren(document.createTextNode(short));
      document.getElementById('web3Hash')?.replaceChildren(document.createTextNode(short));
      const runtime=generated?(window.NOVEN_LLM?.model||'WebLLM'):'Evidence runtime';
      window.NOVEN_TRUST_RUN={runId:`NVR-${Date.now().toString(36).toUpperCase()}`,question:query,answer:text,sources:evidence,outputHash:hash,createdAt:new Date().toISOString(),runtime,model:runtime,dataset:'NOVEN evidence + Wikipedia + Wikidata',language:lang(),skill,confidence:evidence.length>=2?'grounded':'guarded',latencyMs:Math.round(performance.now()-start)};
      window.dispatchEvent(new CustomEvent('noven:run',{detail:window.NOVEN_TRUST_RUN}));
      const meta=document.querySelector('.response-meta span:last-child');if(meta)meta.textContent=`${skill} · ${window.NOVEN_TRUST_RUN.confidence}`;
      setStatus(generated?tr('NOVEN · AI answer ready','NOVEN · إجابة الذكاء الاصطناعي جاهزة'):tr('NOVEN · evidence answer ready','NOVEN · الإجابة المبنية على الأدلة جاهزة'));
    }catch(error){
      console.error('NOVEN runtime',error);
      answer.textContent=tr('NOVEN could not complete this answer safely right now. Please try again.','تعذر على NOVEN إكمال الإجابة بشكل موثوق الآن حاول مرة أخرى');
      render([]);setStatus(tr('NOVEN · error','NOVEN · خطأ'));
    }finally{busy=false;send.disabled=false;send.innerHTML='<span>Ask</span><b>↗</b>';}
  };
  form.addEventListener('submit',submit,true);
  document.querySelector('.new-chat')?.addEventListener('click',()=>{q.value='';q.dataset.skill='answer';answer.textContent='';result.classList.remove('hidden');render([]);document.querySelector('.response-meta span:last-child')?.replaceChildren(document.createTextNode('Ready'));window.NOVEN_LLM?.reset?.();focusAsk();});
  q.addEventListener('keydown',ev=>{if((ev.ctrlKey||ev.metaKey)&&ev.key==='Enter'){ev.preventDefault();form.requestSubmit();}});
  q.addEventListener('input',()=>{const c=document.getElementById('charCount');if(c)c.textContent=String(q.value.length);});
  document.getElementById('searchButton')?.addEventListener('click',()=>{q.dataset.skill='research';focusAsk();});
  document.getElementById('attachButton')?.addEventListener('click',()=>{setStatus(tr('NOVEN · attachments are not enabled yet','NOVEN · المرفقات غير مفعلة حتى الآن'));});
  window.addEventListener('load',()=>setStatus(tr('NOVEN · ready','NOVEN · جاهز')),{once:true});
})();
