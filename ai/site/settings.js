window.NASHHAL_AI_CONFIG = window.NASHHAL_AI_CONFIG || {};
try {
  if (!window.NASHHAL_AI_CONFIG.apiBase) {
    window.NASHHAL_AI_CONFIG.apiBase = window.localStorage?.getItem('nashhal_ai_api') || '';
  }
} catch (error) {
  console.warn('NOVEN local settings unavailable; continuing with browser runtime.', error);
  window.NASHHAL_AI_CONFIG.apiBase = window.NASHHAL_AI_CONFIG.apiBase || '';
}
