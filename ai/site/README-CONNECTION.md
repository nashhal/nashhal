## Connect the playground

1. Deploy `ai/api` on a FastAPI-compatible host.
2. Set `CORS_ORIGINS=https://nashhal.github.io` on that API service.
3. In the browser console on the playground, set:

```js
localStorage.setItem('nashhal_ai_api', 'https://YOUR-AI-API.example.com')
location.reload()
```

4. Verify `/health`, then use `/v1/chat` from the Playground.

The repository does not contain model credentials. Use the deployment platform's secret manager for them.
