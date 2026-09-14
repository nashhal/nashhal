(()=>{
  if(window.__NOVEN_MASTER_BOOT__)return;
  window.__NOVEN_MASTER_BOOT__=true;
  const VERSION='20260914-52';
  const load=src=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=`${src}?v=${VERSION}`;
    s.async=false;
    s.onload=resolve;
    s.onerror=reject;
    document.head.appendChild(s);
  });
  async function boot(){
    const files=[
      ['accuracy-engine.js','accuracy'],
      ['response-engine.js','response'],
      ['model-bridge.js','model'],
      ['master-runtime.js','runtime'],
      ['skills.js','skills'],
      ['web3.js','web3'],
      ['ui-fix.js','ui'],
      ['interaction-fix.js','interactions']
    ];
    for(const [file,label] of files){
      try{await load(file);}
      catch(error){console.warn(`NOVEN ${label} layer failed`,error);}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
