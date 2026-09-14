# Nashhal AI deployment

GitHub Pages hosts the static playground only. The Python API must run on a server/container that supports FastAPI.

Set these environment variables on the API host:

- `MODEL_ENDPOINT` — private model gateway URL
- `MODEL_TIMEOUT` — request timeout in seconds (default `30`)
- `CORS_ORIGINS` — comma-separated allowed frontend origins

Example production CORS value:

```text
https://nashhal.github.io
```

Keep provider/model credentials in the deployment platform's secret manager, never in Git or browser JavaScript.

The API starts with a deterministic lexical retrieval baseline. Replace it with dense embeddings + reranking and a selected instruction model after Nashhal benchmark evaluation.
