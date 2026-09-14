# Nashhal AI Web

Static Arabic-first research playground.

Open `index.html` directly for the UI. For a deployed API, set the API base URL in browser `localStorage`:

```js
localStorage.setItem('nashhal_ai_api', 'https://YOUR-AI-API.example.com')
```

The browser must never contain provider API keys. The model gateway belongs on the server side.