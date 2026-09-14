(()=>{
  if(window.__NOVEN_RUNTIME_SWITCH__)return;
  window.__NOVEN_RUNTIME_SWITCH__=true;
  const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=`${src}?v=20260914-22`;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  const switchRuntime=async()=>{
    const old=document.getElementById('chatForm');
    if(old){const fresh=old.cloneNode(true);old.replaceWith(fresh)}
    try{
      await load('accuracy-engine.js');
      await load('webllm-local.js');
    }catch(e){console.error('NOVEN local runtime failed',e)}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',switchRuntime,{once:true});
  else switchRuntime();
})();
