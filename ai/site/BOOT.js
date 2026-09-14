(()=>{
  if(window.__NOVEN_MASTER_BOOT__)return;
  window.__NOVEN_MASTER_BOOT__=true;
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`${src}?v=20260914-30`;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  const stopLegacy=()=>{
    for(const k of ['__NOVEN_RUNTIME_SWITCH__','__NOVEN_WEBLLM_LOCAL__','__NOVEN_STABLE_RUNTIME__']){
      try{delete window[k]}catch{}
    }
  };
  const boot=async()=>{
    stopLegacy();
    try{await load('accuracy-engine.js')}catch(e){console.warn(e)}
    try{await load('master-runtime.js')}catch(e){console.error('NOVEN master runtime failed',e)}
    try{await load('skills.js')}catch(e){console.warn(e)}
    try{await load('web3.js')}catch(e){console.warn(e)}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
