#!/usr/bin/env python3
"""Build a small source-grounded feed for NOVEN from public RSS feeds."""
from __future__ import annotations

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
LIMIT = 40


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value or "")
    return html.unescape(re.sub(r"\s+", " ", value)).strip()


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "NOVEN-feed/1.0"})
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.read()


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
                "id": link,
                "title": title,
                "text": description or title,
                "url": link,
                "source": source,
                "published_at": pub_date,
            })
    return records


def main() -> None:
    output: list[dict[str, str]] = []
    seen: set[str] = set()
    for source, url in FEEDS.items():
        try:
            for record in parse(fetch(url), source):
                if record["id"] in seen:
                    continue
                seen.add(record["id"])
                output.append(record)
        except Exception as exc:
            print(f"warning: {source}: {exc}")
    output = output[:LIMIT]
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_count": len(output),
        "documents": output,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(output)} records to {OUT}")


if __name__ == "__main__":
    main()
