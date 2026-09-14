from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def validate_jsonl(path: str | Path) -> list[str]:
    errors: list[str] = []
    seen_ids: set[str] = set()
    with Path(path).open("r", encoding="utf-8") as handle:
        for line_no, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                row: dict[str, Any] = json.loads(line)
            except json.JSONDecodeError as exc:
                errors.append(f"line {line_no}: invalid JSON: {exc}")
                continue

            row_id = str(row.get("id", "")).strip()
            if not row_id:
                errors.append(f"line {line_no}: id: empty")
            elif row_id in seen_ids:
                errors.append(f"line {line_no}: duplicate id: {row_id}")
            else:
                seen_ids.add(row_id)

            for key in ("task", "title", "text", "source", "split"):
                if not row.get(key):
                    errors.append(f"line {line_no}: {key}: missing")

            source = row.get("source") or {}
            for key in ("url", "source_name", "retrieved_at"):
                if not source.get(key):
                    errors.append(f"line {line_no}: source.{key}: missing")

            if row.get("split") not in {"train", "validation", "test", "ood"}:
                errors.append(f"line {line_no}: invalid split")
    return errors


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a Nashhal AI JSONL dataset")
    parser.add_argument("path")
    args = parser.parse_args()
    problems = validate_jsonl(args.path)
    if problems:
        print("Dataset validation failed")
        print("\n".join(problems))
        raise SystemExit(1)
    print("Dataset validation passed")
