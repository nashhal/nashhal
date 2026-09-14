# Nashhal AI datasets

Do not commit scraped article bodies or large copyrighted corpora here.

This directory stores schemas, task definitions, small synthetic/permissioned samples, and dataset manifests. Full datasets belong in versioned artifact storage (for example Hugging Face Datasets, object storage, or DVC) with provenance and license metadata.

## Required fields

Every training or evaluation example should preserve:

- stable example id
- task
- title/text
- source name and URL
- retrieved_at and published_at when known
- content hash when available
- dataset version
- split
- license/usage status

## Split policy

Use source- and event-aware splitting. Never let near-duplicate articles from the same event leak across train, validation, and test. Maintain a separate `ood` split for unseen events or source distributions.
