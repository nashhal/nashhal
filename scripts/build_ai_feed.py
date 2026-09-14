#!/usr/bin/env python3
"""Build a source-grounded, multi-source feed for NOVEN."""
from __future__ import annotations

import hashlib
import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

FEEDS = {
    "BBC": "https://feeds.bbci.co.uk/news/rss.xml",
    "Al Jazeera": "https://www.aljazeera.com/xml/rss/all.xml",
    "DW": "https://rss.dw.com/rdf/rss-en-all",
}
OUT = Path("ai/data/live-news.json")
LIMIT = 60
MAX_CLUSTER = 6


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value or "")
    return html.unescape(re.sub(r"\s+", " ", value)).strip()


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "NOVEN-feed/2.0"})
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.read()


def tokenize(text: str) -> set[str]:
    text = text.lower()
    text = re.sub(r"[^\w\u0600-\u06ff]+", " ", text)
    return {token for token in text.split() if len(token) > 2}


def similarity(a: str, b: str) -> float:
    left, right = tokenize(a), tokenize(b)
    if not left or not right:
        return 0.0
    return len(left & right) / max(1, len(left | right))


def parse(xml_bytes: bytes, source: str) -> list[dict[str, str]]:
    root = ET.fromstring(xml_bytes)
    records: list[dict[str, str]] = []
    for item in root.iter("item"):
        title = clean(item.findtext("title", ""))
        link = clean(item.findtext("link", ""))
        description = clean(item.findtext("description", ""))
        pub_date = clean(item.findtext("pubDate", ""))
        if title and link:
            records.append({
                "id": hashlib.sha256(link.encode("utf-8")).hexdigest()[:20],
                "title": title,
                "text": description or title,
                "url": link,
                "source": source,
                "published_at": pub_date,
            })
    return records


def cluster(records: list[dict[str, str]]) -> list[list[dict[str, str]]]:
    groups: list[list[dict[str, str]]] = []
    for record in records:
        target = None
        best_score = 0.0
        for group in groups:
            score = max(similarity(record["title"], item["title"]) for item in group)
            if score > best_score:
                best_score = score
                target = group
        if target is not None and best_score >= 0.42 and len(target) < MAX_CLUSTER:
            target.append(record)
        else:
            groups.append([record])
    return groups


def build_story(group: list[dict[str, str]]) -> dict:
    unique_sources = sorted({item["source"] for item in group})
    lead = max(group, key=lambda item: len(tokenize(item["text"])))
    return {
        "id": hashlib.sha256("|".join(sorted(item["url"] for item in group)).encode("utf-8")).hexdigest()[:24],
        "title": lead["title"],
        "text": lead["text"],
        "url": lead["url"],
        "source": lead["source"],
        "published_at": lead["published_at"],
        "source_count": len(unique_sources),
        "sources": [
            {
                "source": item["source"],
                "title": item["title"],
                "url": item["url"],
                "published_at": item["published_at"],
            }
            for item in group
        ],
        "cross_checked": len(unique_sources) >= 2,
        "conflict": False,
    }


def main() -> None:
    records: list[dict[str, str]] = []
    seen_urls: set[str] = set()
    for source, url in FEEDS.items():
        try:
            for record in parse(fetch(url), source):
                if record["url"] not in seen_urls:
                    seen_urls.add(record["url"])
                    records.append(record)
        except Exception as exc:
            print(f"warning: {source}: {exc}")

    stories = [build_story(group) for group in cluster(records)]
    stories.sort(key=lambda item: (item["cross_checked"], item["source_count"], item["published_at"]), reverse=True)
    stories = stories[:LIMIT]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source_count": len(records),
            "story_count": len(stories),
            "documents": stories,
            "method": "multi-source lexical clustering with source attribution; no LLM required",
        }, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {len(stories)} clustered stories from {len(records)} records")


if __name__ == "__main__":
    main()
