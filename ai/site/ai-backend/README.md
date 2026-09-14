# NOVEN AI backend

GitHub Pages cannot safely store a provider API key. Deploy a small server endpoint and set its URL in `app-config.js` as `apiBase`.

Required response contract from `POST /v1/chat`:

```json
{
  "answer": "...",
  "sources": [{"title":"...","url":"https://...","source":"...","text":"..."}],
  "grounded": true,
  "model": "provider/model"
}
```

The backend should perform live retrieval/grounding before generation and return the source citations it used. For current information, do not generate from model memory alone.

Recommended production pattern:
1. Classify the skill and freshness requirement.
2. Retrieve primary sources and relevant web results.
3. Give the model only the retrieved evidence plus the user question.
4. Require claim/source alignment and explicit uncertainty.
5. Return answer + citations + grounding metadata.
6. Store only non-sensitive provenance data in the browser trust receipt.

Never put provider secrets in the GitHub Pages frontend.
