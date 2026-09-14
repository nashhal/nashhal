window.NASHHAL_AI_CONFIG = window.NASHHAL_AI_CONFIG || {
  // Keep provider secrets on the server. Set apiBase to your deployed /v1 backend.
  apiBase: ''
};

// Replace the legacy form handler after it loads, then attach the evidence-first runtime.
window.addEventListener('load', () => {
  const script = document.createElement('script');
  script.src = 'runtime-switch.js?v=20260914-20';
  script.async = true;
  document.head.appendChild(script);
}, { once: true });
