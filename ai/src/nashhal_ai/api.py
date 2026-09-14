"""FastAPI service for the Nashhal AI playground.

The endpoint is source-grounded by design. In production, set MODEL_ENDPOINT
(or replace the generate function) with the chosen hosted/self-hosted model.
No API keys are stored in the repository.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from .rag import LexicalRetriever, SourceDocument, load_jsonl

try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel, Field
except ImportError:  # pragma: no cover
    FastAPI = None  # type: ignore


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATASET = ROOT / "data" / "benchmark.sample.jsonl"


def _load_retriever() -> LexicalRetriever:
    if not DEFAULT_DATASET.exists():
        return LexicalRetriever([])
    try:
        docs = load_jsonl(DEFAULT_DATASET)
    except Exception:
        docs = []
    return LexicalRetriever(docs)


retriever = _load_retriever()


def _grounded_fallback(question: str, sources: list[Any]) -> str:
    if not sources:
        return "لم أجد مصدرًا موثوقًا في قاعدة المعرفة الحالية يدعم إجابة مؤكدة. أضف مصادر مصرحًا بها ثم أعد المحاولة."
    lead = sources[0].document
    return (
        "وفقًا للمصادر المسترجعة، أقرب مادة مرتبطة بالسؤال هي: "
        f"{lead.title}. لا أقدم هذه النتيجة كحقيقة نهائية قبل تشغيل نموذج التوليد "
        "والتحقق من الأدلة المرتبطة بالمصدر."
    )


def _external_model(question: str, sources: list[Any]) -> str | None:
    """Optional HTTP model integration hook.

    The endpoint should accept JSON {"question": str, "sources": [...]}
    and return JSON {"answer": str}. Keeping this external avoids secrets and
    provider-specific SDK coupling in the public repository.
    """
    endpoint = os.getenv("MODEL_ENDPOINT")
    if not endpoint:
        return None
    try:
        import json
        from urllib.request import Request, urlopen

        payload = {
            "question": question,
            "sources": [
                {
                    "id": item.document.id,
                    "title": item.document.title,
                    "text": item.document.text,
                    "url": item.document.url,
                    "published_at": item.document.published_at,
                }
                for item in sources
            ],
        }
        req = Request(
            endpoint,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
        answer = result.get("answer")
        return answer if isinstance(answer, str) and answer.strip() else None
    except Exception:
        return None


if FastAPI is not None:
    app = FastAPI(title="Nashhal AI API", version="0.1.0")

    class ChatRequest(BaseModel):
        question: str = Field(min_length=1, max_length=4000)
        top_k: int = Field(default=5, ge=1, le=10)

    @app.get("/health")
    def health() -> dict[str, Any]:
        return {"status": "ok", "retrieval_documents": len(retriever.documents)}

    @app.post("/v1/chat")
    def chat(body: ChatRequest) -> dict[str, Any]:
        hits = retriever.search(body.question, top_k=body.top_k)
        answer = _external_model(body.question, hits) or _grounded_fallback(body.question, hits)
        return {
            "answer": answer,
            "grounded": bool(hits),
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
