from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_jsonl(path: str | Path) -> list[dict[str, Any]]:
    """Load a JSONL benchmark while preserving source/provenance metadata."""
    rows: list[dict[str, Any]] = []
    with Path(path).open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSONL at line {line_number}: {exc}") from exc
    return rows


def benchmark_manifest(path: str | Path) -> dict[str, Any]:
    rows = load_jsonl(path)
    by_task: dict[str, int] = {}
    by_split: dict[str, int] = {}
    for row in rows:
        task = str(row.get("task", "unknown"))
        split = str(row.get("split", "unknown"))
        by_task[task] = by_task.get(task, 0) + 1
        by_split[split] = by_split.get(split, 0) + 1
    return {"examples": len(rows), "by_task": by_task, "by_split": by_split}


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Inspect a Nashhal AI JSONL benchmark")
    parser.add_argument("path")
    args = parser.parse_args()
    print(json.dumps(benchmark_manifest(args.path), ensure_ascii=False, indent=2))
