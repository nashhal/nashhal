window.NASHHAL_AI_CONFIG = window.NASHHAL_AI_CONFIG || {
  // Single-runtime browser AI configuration.
  // No provider secrets are stored in this file.
  apiBase: '',
  localModel: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
  localFallbackModel: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
  localRuntime: 'WebLLM',
  grounding: 'NOVEN knowledge + Wikipedia + Wikidata',
  privacy: 'browser-local-inference',
  responseStyle: 'natural-conversational'
};

// BOOT.js is the only runtime entry point.
// Legacy runtime-switch.js and stable-runtime.js must never be loaded here.
