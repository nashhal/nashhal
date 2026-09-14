# Nashhal AI

Nashhal AI is the machine-learning layer for the Nashhal news platform.

## Goal

Build a high-quality Arabic news intelligence system that **discovers, structures, compares and grounds information in evidence**. It is not designed as a single model that memorizes breaking-news facts.

## Current architecture

```text
Approved sources
      ↓
Ingestion + provenance
      ↓
Cleaning + deduplication
      ↓
Versioned datasets
      ↓
┌───────────────────────────────┐
│ Task models / QLoRA adapters   │
│ RAG retrieval + reranking      │
└───────────────────────────────┘
      ↓
Benchmark + human review
      ↓
API / Nashhal website
```

## Tasks

- Arabic news understanding
- Article classification
- Event and entity extraction
- Duplicate/event clustering
- News summarization
- Source-grounded question answering
- Retrieval-augmented generation (RAG)
- Provenance and citation tracking
- Reproducible evaluation

## Model strategy

We use **benchmark-first selection**. The initial bake-off is Qwen3-8B and Fanar-1-9B-Instruct, with SILMA as an optional third candidate subject to license review. See `configs/candidates.yaml` and `docs/model-selection.md`.

The current training configuration uses QLoRA as the first experiment, not as a permanent commitment. The base model remains a candidate until it wins on the Nashhal holdout benchmark.

## Data policy

Do not commit large scraped corpora, copyrighted article bodies, model checkpoints, or secrets to Git. The repository contains schemas, manifests, tests and synthetic/permissioned samples. Full datasets should be stored in an appropriate versioned artifact store with source URL, publisher, timestamps, license/usage status and content hash.

## Quality gates

A production model must show acceptable performance on factuality, source grounding, Arabic quality, news-task accuracy and latency/cost. Test data must be isolated from training and validation, including near-duplicate and event-level leakage checks.

## Repository map

- `configs/` — model candidates and reproducible training settings
- `data/` — schemas, manifests and small safe samples
- `docs/` — architecture and decision records
- `src/nashhal_ai/` — reusable Python components
- `tests/` — unit tests
- `.github/workflows/` — continuous integration

## Status

Phase 1 — model selection and evaluation foundation.
