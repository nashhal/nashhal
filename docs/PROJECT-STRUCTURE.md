# Nashhal repository structure

## Production site

- `index.html` — main Nashhal news homepage.
- `scripts/fetch_news.py` — RSS headline updater used by the news site.

## Nashhal AI

- `ai/site/` — canonical Arabic-first AI web playground.
- `ai/src/nashhal_ai/` — Python package: retrieval, API, benchmark and dataset tooling.
- `ai/api/` — containerized API and optional model gateway.
- `ai/configs/` — model, training and evaluation configuration.
- `ai/data/` — schemas, samples and benchmark metadata only; large datasets stay outside Git.
- `ai/docs/` — model-selection and RAG design documents.
- `ai/deploy/` — local/server deployment helpers.
- `ai/tests/` — automated tests.

## Automation

All GitHub Actions workflows live under the repository root `.github/workflows/`.

- `pages.yml` — deploys the repository as the GitHub Pages site, preserving both the main site and the AI section.
- `ai-tests.yml` — runs Nashhal AI tests when `ai/**` changes.
- `pylint.yml` — legacy Python lint workflow retained until consolidated.

## Generated and sensitive files

Do not commit provider secrets, local `.env` files, model weights, checkpoints or large generated datasets. See the root `.gitignore`.
