from __future__ import annotations

from collections import defaultdict
from datetime import datetime


def temporal_split(records: list[dict], train_cutoff: str, validation_cutoff: str) -> dict[str, list[dict]]:
    """Create time-based splits to reduce future-information leakage in news evaluation."""
    train_end = datetime.fromisoformat(train_cutoff.replace("Z", "+00:00"))
    validation_end = datetime.fromisoformat(validation_cutoff.replace("Z", "+00:00"))
    out = {"train": [], "validation": [], "test": [], "ood": []}
    for row in records:
        published = datetime.fromisoformat(str(row["published_at"]).replace("Z", "+00:00"))
        if published <= train_end:
            out["train"].append(row)
        elif published <= validation_end:
            out["validation"].append(row)
        else:
            out["test"].append(row)
    return out


def source_balance(records: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for row in records:
        counts[str(row.get("source", "unknown"))] += 1
    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0])))
