(()=>{
  if(window.__NOVEN_RUNTIME_SWITCH__)return;
  window.__NOVEN_RUNTIME_SWITCH__=true;
  const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=`${src}?v=20260914-24`;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  const boot=async()=>{
    try{await load('accuracy-engine.js')}catch(e){console.error('NOVEN accuracy layer failed',e)}
    try{await load('stable-runtime.js')}catch(e){console.error('NOVEN stable runtime failed',e)}
    try{await load('skills.js')}catch(e){console.error('NOVEN skills layer failed',e)}
    try{await load('webllm-local.js')}catch(e){console.warn('NOVEN optional WebLLM layer unavailable',e)}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
