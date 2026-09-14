# NOVEN accuracy policy

NOVEN now classifies each query into a skill and decides whether freshness is required. The browser runtime retrieves local knowledge plus public Wikipedia/Wikidata evidence and refuses a factual answer when evidence is insufficient.

For production-level answers, configure `NASHHAL_AI_CONFIG.apiBase` to a server endpoint that performs model generation with live grounding. The frontend must never contain a provider secret.

Recommended grounding uses a live-search-capable model and primary-source retrieval. Current questions should be grounded at request time; factual claims should be aligned to returned citations.
