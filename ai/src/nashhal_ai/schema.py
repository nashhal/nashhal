from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Literal


NewsTask = Literal[
    "classification",
    "event_extraction",
    "entity_extraction",
    "summarization",
    "source_grounded_qa",
    "duplicate_detection",
]


@dataclass(frozen=True)
class Provenance:
    url: str
    source_name: str
    retrieved_at: str
    published_at: str | None = None
    license: str | None = None
    content_hash: str | None = None


@dataclass(frozen=True)
class NewsExample:
    id: str
    task: NewsTask
    title: str
    text: str
    source: Provenance
    label: str | None = None
    target: str | None = None
    split: Literal["train", "validation", "test", "ood"] = "train"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def validate_example(example: NewsExample) -> list[str]:
    errors: list[str] = []
    if not example.id.strip():
        errors.append("id: empty")
    if not example.title.strip():
        errors.append("title: empty")
    if not example.text.strip():
        errors.append("text: empty")
    if not example.source.url.strip():
        errors.append("source.url: empty")
    if not example.source.source_name.strip():
        errors.append("source.source_name: empty")
    if not example.source.retrieved_at.strip():
        errors.append("source.retrieved_at: empty")
    if example.task in {"classification", "event_extraction", "entity_extraction", "summarization", "source_grounded_qa"} and not (example.target or "").strip():
        errors.append("target: empty")
    return errors
