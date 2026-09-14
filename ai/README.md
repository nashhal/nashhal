# Nashhal AI

Nashhal AI is the machine-learning layer for the Nashhal news platform.

## Initial scope

- Arabic news understanding
- Article classification
- Event/entity extraction
- Duplicate and similarity detection
- Retrieval-augmented generation (RAG)
- Source-aware answers
- Reproducible evaluation

## Architecture

```text
Sources → ingestion → cleaning → datasets → model/RAG → evaluation → API
                                      ↑                    ↓
                                  versioning           deployment
```

## Repository policy

GitHub stores source code, configuration, tests, documentation and small samples. Large datasets, checkpoints and model weights should use dedicated artifact/model storage rather than ordinary Git commits.

## Status

Phase 0 — repository foundation.
