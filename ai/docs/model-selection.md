# Nashhal AI model-selection protocol

## Decision

Nashhal should use a **benchmark-first** approach. The first serious bake-off is:

1. Qwen/Qwen3-8B
2. QCRI/Fanar-1-9B-Instruct
3. SILMA is an optional third candidate, subject to license review

Current public model cards show Qwen3-8B as Apache-2.0 and Fanar-1-9B-Instruct as Apache-2.0. Fanar is specifically Arabic-English and reports continued pretraining on 1T Arabic/English tokens plus instruction tuning. SILMA uses the Gemma license, so its exact downstream obligations must be reviewed before production adoption.

These facts are not sufficient to declare a winner. Nashhal must measure each candidate on the same holdout data and hardware budget.

## Scorecard

| Dimension | Weight | What we measure |
|---|---:|---|
| Factuality | 30% | Faithfulness to supplied evidence; no invented names, dates, places or numbers |
| Source grounding | 25% | Correct citation and refusal when evidence is insufficient |
| Arabic quality | 20% | MSA quality, clarity, morphology, terminology and controlled style |
| News tasks | 15% | Classification, extraction, clustering and summarization |
| Latency/cost | 10% | Tokens/sec, peak VRAM and cost per 1M generated tokens |

A candidate can only become the production base model after it passes the holdout benchmark and license review.

## Task suite

The benchmark should contain separate examples for classification, event extraction, entity extraction, duplicate detection, summarization and source-grounded question answering. Keep a time-separated and event-separated test set so the model cannot win by memorizing near-duplicate articles.

## Important design choice

**Do not fine-tune breaking-news facts into the base model.** Fine-tuning is for behavior, task format, domain terminology and writing style. Current facts should come from a retrieval layer with source metadata, publication time and provenance.
