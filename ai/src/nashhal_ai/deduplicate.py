from __future__ import annotations

import hashlib
import re
from collections import defaultdict
from typing import Iterable


def normalize_arabic(text: str) -> str:
    """Normalize common Arabic orthographic variants for near-duplicate checks."""
    text = text.strip().lower()
    text = re.sub(r"[\u064B-\u065F\u0670]", "", text)
    text = text.replace("إ", "ا").replace("أ", "ا").replace("آ", "ا")
    text = text.replace("ى", "ي").replace("ة", "ه")
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def content_hash(title: str, text: str) -> str:
    payload = normalize_arabic(f"{title}\n{text}").encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def shingles(text: str, size: int = 5) -> set[str]:
    tokens = normalize_arabic(text).split()
    if len(tokens) <= size:
        return {" ".join(tokens)} if tokens else set()
    return {" ".join(tokens[i : i + size]) for i in range(len(tokens) - size + 1)}


def jaccard_similarity(a: str, b: str, size: int = 5) -> float:
    sa, sb = shingles(a, size), shingles(b, size)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def duplicate_groups(records: Iterable[dict], threshold: float = 0.82) -> list[list[str]]:
    """Return connected groups of exact/near duplicates using conservative text similarity."""
    rows = list(records)
    groups: list[list[str]] = []
    used: set[int] = set()
    hashes: dict[str, list[int]] = defaultdict(list)
    for i, row in enumerate(rows):
        hashes[content_hash(row.get("title", ""), row.get("text", ""))].append(i)
    for indices in hashes.values():
        if len(indices) > 1:
            groups.append([str(rows[i]["id"]) for i in indices])
            used.update(indices)
    for i, a in enumerate(rows):
        if i in used:
            continue
        group = [str(a["id"])]
        for j in range(i + 1, len(rows)):
            if j in used:
                continue
            b = rows[j]
            if jaccard_similarity(f"{a.get('title','')} {a.get('text','')}", f"{b.get('title','')} {b.get('text','')}") >= threshold:
                group.append(str(b["id"]))
                used.add(j)
        if len(group) > 1:
            groups.append(group)
            used.add(i)
    return groups
