window.NASHHAL_AI_CONFIG = window.NASHHAL_AI_CONFIG || {
  // Free-first runtime: WebLLM runs an open model in the browser via WebGPU.
  // An optional server API can still be configured later without exposing secrets here.
  apiBase: '',
  localModel: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
  localRuntime: 'WebLLM',
  grounding: 'Wikipedia + Wikidata + NOVEN knowledge',
  privacy: 'browser-local-inference'
};

// Replace the legacy form handler after it loads, then attach the free local AI runtime.
window.addEventListener('load', () => {
  const script = document.createElement('script');
  script.src = 'runtime-switch.js?v=20260914-22';
  script.async = true;
  document.head.appendChild(script);
}, { once: true });
