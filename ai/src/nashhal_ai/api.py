"""Self-hosted FastAPI service for Nashhal AI.

The service can run a local Hugging Face model and local RAG data. No
commercial AI provider is required. Set MODEL_ID (or MODEL_PATH) to the
model you want to run on your own GPU/CPU host.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from .rag import LexicalRetriever, SourceDocument, load_jsonl

try:
    from fastapi import FastAPI
    from pydantic import BaseModel, Field
except ImportError:  # pragma: no cover
    FastAPI = None  # type: ignore

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATASET = ROOT / "data" / "benchmark.sample.jsonl"
MODEL_ID = os.getenv("MODEL_ID", "Qwen/Qwen3-8B")
MODEL_PATH = os.getenv("MODEL_PATH", "").strip()
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "512"))


def _load_retriever() -> LexicalRetriever:
    dataset = Path(os.getenv("NASHHAL_DATASET", str(DEFAULT_DATASET)))
    if not dataset.exists():
        return LexicalRetriever([])
    try:
        return LexicalRetriever(load_jsonl(dataset))
    except Exception:
        return LexicalRetriever([])


retriever = _load_retriever()
_model = None
_tokenizer = None
_model_error: str | None = None


def _load_local_model() -> tuple[Any, Any]:
    global _model, _tokenizer, _model_error
    if _model is not None and _tokenizer is not None:
        return _model, _tokenizer
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        model_name = MODEL_PATH or MODEL_ID
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModelForCausalLM.from_pretrained(
            model_name,
            device_map="auto",
            torch_dtype="auto",
        )
        return _model, _tokenizer
    except Exception as exc:  # pragma: no cover - depends on host hardware/model
        _model_error = str(exc)
        raise RuntimeError(f"Local model could not be loaded: {exc}") from exc


def _generate_local(question: str, sources: list[Any]) -> str | None:
    if os.getenv("ENABLE_LOCAL_MODEL", "0").lower() not in {"1", "true", "yes"}:
        return None
    model, tokenizer = _load_local_model()
    evidence = "\n\n".join(
        f"[{i + 1}] {x.document.title}\n{x.document.text}\nالمصدر: {x.document.source}"
        for i, x in enumerate(sources)
    )
    prompt = (
        "أنت Nashhal AI، مساعد إخباري عربي يعتمد على الأدلة. "
        "أجب بالعربية بوضوح، ولا تضف ادعاءً غير موجود في الأدلة. "
        "إذا لم تكف الأدلة فقل إن المعلومات غير كافية.\n\n"
        f"السؤال: {question}\n\nالأدلة:\n{evidence or 'لا توجد أدلة مسترجعة.'}"
    )
    messages = [
        {"role": "system", "content": "أنت مساعد عربي دقيق، مصدر-أول، وتفصل بين الحقيقة والاستنتاج."},
        {"role": "user", "content": prompt},
    ]
    if hasattr(tokenizer, "apply_chat_template"):
        text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    else:
        text = prompt
    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=MAX_NEW_TOKENS, do_sample=False)
    generated = outputs[0][inputs["input_ids"].shape[-1]:]
    return tokenizer.decode(generated, skip_special_tokens=True).strip() or None


def _grounded_fallback(question: str, sources: list[Any]) -> str:
    if not sources:
        return "لم أجد مصدرًا موثوقًا في قاعدة المعرفة الحالية يدعم إجابة مؤكدة."
    lead = sources[0].document
    return (
        f"وجدت مادة مرتبطة بالسؤال: {lead.title}. "
        "هذه إجابة استرجاعية وليست توليدًا من النموذج؛ فعّل ENABLE_LOCAL_MODEL=1 "
        "لتشغيل النموذج المحلي."
    )


if FastAPI is not None:
    app = FastAPI(title="Nashhal AI — Self Hosted", version="0.2.0")

    class ChatRequest(BaseModel):
        question: str = Field(min_length=1, max_length=4000)
        top_k: int = Field(default=5, ge=1, le=10)

    @app.get("/health")
    def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "mode": "local-model" if os.getenv("ENABLE_LOCAL_MODEL", "0").lower() in {"1", "true", "yes"} else "retrieval-only",
            "model": MODEL_PATH or MODEL_ID,
            "retrieval_documents": len(retriever.documents),
            "model_loaded": _model is not None,
            "model_error": _model_error,
        }

    @app.post("/v1/chat")
    def chat(body: ChatRequest) -> dict[str, Any]:
        hits = retriever.search(body.question, top_k=body.top_k)
        try:
            answer = _generate_local(body.question, hits)
        except RuntimeError:
            answer = None
        answer = answer or _grounded_fallback(body.question, hits)
        return {
            "answer": answer,
            "grounded": bool(hits),
            "mode": "local-model" if _model is not None else "retrieval-only",
            "sources": [
                {
                    "id": hit.document.id,
                    "title": hit.document.title,
                    "source": hit.document.source,
                    "url": hit.document.url,
                    "published_at": hit.document.published_at,
                    "score": round(hit.score, 4),
                }
                for hit in hits
            ],
        }
else:
    app = None
