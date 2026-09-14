## Browser/API boundary

The static client uses a configurable API origin. The API must allow the exact deployed origin via `CORS_ORIGINS`; do not use a wildcard origin in production.