"""Lightweight source-grounded retrieval for Nashhal AI.

The module intentionally uses a dependency-light TF-IDF retriever as a safe
baseline. It can later be replaced by a dense retriever/vector database
without changing the API contract used by the application layer.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import re
from typing import Iterable


@dataclass(frozen=True)
class SourceDocument:
    id: str
    title: str
    text: str
    url: str
    source: str
    published_at: str
    content_sha256: str = ""


@dataclass(frozen=True)
class RetrievedSource:
    document: SourceDocument
    score: float


def _tokens(text: str) -> set[str]:
    text = text.lower()
    text = re.sub(r"[^\w\u0600-\u06ff]+", " ", text)
    return {t for t in text.split() if len(t) > 1}


def load_jsonl(path: str | Path) -> list[SourceDocument]:
    records: list[SourceDocument] = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        item = json.loads(line)
        p = item.get("provenance", {})
        records.append(
            SourceDocument(
                id=item["id"],
                title=item["title"],
                text=item["text"],
                url=p.get("url", ""),
                source=item["source"],
                published_at=item["published_at"],
                content_sha256=p.get("content_sha256", ""),
            )
        )
    return records


class LexicalRetriever:
    """Deterministic lexical retriever with source-aware ranking."""

    def __init__(self, documents: Iterable[SourceDocument]) -> None:
        self.documents = list(documents)
        self._document_tokens = [_tokens(f"{d.title} {d.text}") for d in self.documents]
        self._idf: dict[str, float] = {}
        n = max(len(self.documents), 1)
        df: dict[str, int] = {}
        for tokens in self._document_tokens:
            for token in tokens:
                df[token] = df.get(token, 0) + 1
        for token, count in df.items():
            self._idf[token] = 1.0 + __import__("math").log((n + 1) / (count + 1))

    def search(self, query: str, top_k: int = 5) -> list[RetrievedSource]:
        q = _tokens(query)
        if not q:
            return []
        scored: list[RetrievedSource] = []
        for doc, tokens in zip(self.documents, self._document_tokens):
            overlap = q & tokens
            if not overlap:
                continue
            score = sum(self._idf.get(t, 1.0) for t in overlap) / max(len(q), 1)
            if doc.source:
                score *= 1.03
            scored.append(RetrievedSource(doc, score))
        scored.sort(key=lambda x: x.score, reverse=True)
        return scored[: max(top_k, 1)]
