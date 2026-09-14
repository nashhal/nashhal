# Nashhal AI API

Source-grounded API for the Nashhal AI research playground.

## Run locally

From the repository root:

```bash
pip install -r ai/api/requirements.txt
uvicorn nashhal_ai.api:app --app-dir ai/src --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Chat:

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H 'content-type: application/json' \
  -d '{"question":"ما آخر المعلومات المتاحة؟"}'
```

## Model integration

The public repository does not contain provider API keys. Set `MODEL_ENDPOINT` to a private inference service that accepts:

```json
{"question":"...","sources":[...]}
```

and returns:

```json
{"answer":"..."}
```

The service always returns the retrieved source metadata so the client can render provenance and citations.

## Production requirements

Use HTTPS, authentication/rate limiting, structured logging, request IDs, model timeouts, prompt-injection filtering, source freshness checks, and a real dense retrieval/reranking stack before public launch.
