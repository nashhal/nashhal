from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class NewsRecord:
    """Minimal canonical record used before model training."""

    id: str
    title: str
    text: str
    source: str
    published_at: str

    def validate(self) -> list[str]:
        errors: list[str] = []
        for field in ("id", "title", "text", "source", "published_at"):
            if not getattr(self, field).strip():
                errors.append(f"{field}: empty")
        return errors


def validate_records(records: Iterable[NewsRecord]) -> list[str]:
    """Return validation errors without mutating the input dataset."""

    errors: list[str] = []
    for index, record in enumerate(records):
        errors.extend(f"row {index}: {error}" for error in record.validate())
    return errors
