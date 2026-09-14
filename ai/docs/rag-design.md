# Nashhal RAG design

RAG is the source-of-truth layer for changing information. The language model should not be treated as the database of current events.

## Pipeline

```text
Approved sources
   ↓
Ingestion
   ↓
Normalize + deduplicate
   ↓
Provenance record + content hash
   ↓
Chunk by article/event structure
   ↓
Arabic/multilingual embeddings
   ↓
Hybrid retrieval (lexical + semantic)
   ↓
Reranking
   ↓
Evidence window
   ↓
LLM answer / summary
   ↓
Citation + confidence + abstain when evidence is weak
```

## Retrieval rules

1. Retrieve by event and time, not only by keyword similarity.
2. Prefer primary/official evidence when available.
3. Preserve source URL, publisher, publication time and retrieval time with every chunk.
4. Do not allow a generated statement to be presented as verified unless supporting evidence was retrieved.
5. When evidence conflicts, surface the disagreement instead of silently merging claims.
6. Keep article-level deduplication separate from factual verification.

## Storage

Start simple. A PostgreSQL database with vector support is sufficient for the first prototype. Move to a dedicated vector database only when scale or latency requires it.

## What belongs in fine-tuning vs RAG

| Problem | Preferred method |
|---|---|
| Arabic news writing style | LoRA/SFT |
| Output schema and task behavior | LoRA/SFT |
| Event/entity extraction format | LoRA/SFT or task model |
| Current breaking-news facts | RAG |
| Source attribution | RAG + deterministic metadata |
| Historical archive search | RAG |
| New source onboarding | Retrieval/indexing, not retraining |
| Safety/quality policy | System rules + evaluation |
