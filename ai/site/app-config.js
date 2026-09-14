window.NASHHAL_AI_CONFIG = window.NASHHAL_AI_CONFIG || {
  // Free-first runtime: WebLLM can run an open model in the browser via WebGPU.
  // An optional server API can be configured later without exposing secrets here.
  apiBase: '',
  localModel: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
  localRuntime: 'WebLLM',
  grounding: 'Wikipedia + Wikidata + NOVEN knowledge',
  privacy: 'browser-local-inference'
};

// NOVEN has one runtime entry point: BOOT.js.
// Do not load legacy runtimes here, as they can replace the form and break ASK.
