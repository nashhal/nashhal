#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Update the Nashhal homepage from allowed RSS sources.

The script imports headlines and short descriptions only, filters them for
South-Yemen/Yemen relevance, and rewrites clearly marked HTML blocks in the
homepage. Original links are preserved so readers can open the source.
"""

from __future__ import annotations

import html
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path

FEEDS = {
    "الجزيرة": "https://www.aljazeera.net/xml/rss/all.xml",
    "فرانس 24": "https://www.france24.com/ar/rss",
    "بي بي سي": "https://feeds.bbci.co.uk/arabic/rss.xml",
    "رويترز عربي": "https://arabic.rt.com/rss/",
}
KEYWORDS = ["اليمن", "عدن", "الجنوب", "حضرموت", "لحج", "أبين", "شبوة", "المهرة", "سقطرى"]
TIMEOUT = 12
TICKER_COUNT = 6
CARD_COUNT = 6
TAG_RE = re.compile(r"<[^>]+>")


def esc(text: str) -> str:
    return html.escape(text or "", quote=True)


def clean_text(text: str, max_len: int | None = None) -> str:
    value = TAG_RE.sub("", text or "")
    value = html.unescape(value).strip()
    value = re.sub(r"\s+", " ", value)
    if max_len and len(value) > max_len:
        value = value[:max_len].rstrip() + "…"
    return value


def relative_time(pubdate_raw: str) -> str:
    try:
        return parsedate_to_datetime(pubdate_raw).strftime("%H:%M")
    except Exception:
        return "تحديث تلقائي"


def fetch_feed(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "NashhalBot/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        return response.read()


def parse_items(xml_bytes: bytes, source_name: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return items
    for item in root.iter("item"):
        title_el = item.find("title")
        link_el = item.find("link")
        desc_el = item.find("description")
        date_el = item.find("pubDate")
        title = clean_text(title_el.text if title_el is not None else "")
        link = (link_el.text or "").strip() if link_el is not None else ""
        desc = clean_text(desc_el.text if desc_el is not None else "", max_len=160)
        pubdate = date_el.text if date_el is not None else ""
        if title:
            items.append({
                "title": title,
                "link": link,
                "source": source_name,
                "dek": desc,
                "time": relative_time(pubdate),
            })
    return items


def matches_keywords(title: str) -> bool:
    return any(keyword in title for keyword in KEYWORDS)


def collect_headlines() -> list[dict[str, str]]:
    collected: list[dict[str, str]] = []
    for name, url in FEEDS.items():
        try:
            for item in parse_items(fetch_feed(url), name):
                if matches_keywords(item["title"]):
                    collected.append(item)
        except Exception as exc:  # pragma: no cover - network dependent
            print(f"تحذير: تعذّر جلب {name} ({url}): {exc}", file=sys.stderr)
    return collected


def replace_block(html_text: str, pattern: re.Pattern[str], replacement: str, label: str) -> tuple[str, bool]:
    match = pattern.search(html_text)
    if not match:
        print(f"تحذير: لم يتم العثور على قسم {label} — تم تخطيه.", file=sys.stderr)
        return html_text, False
    return html_text[:match.start(2)] + replacement + html_text[match.end(2):], True


def update_index_html(path: Path, headlines: list[dict[str, str]]) -> bool:
    html_text = path.read_text(encoding="utf-8")
    changed = False

    ticker_items = headlines[:TICKER_COUNT]
    if ticker_items:
        ticker = "\n        ".join(f'<span>{esc(it["source"])}</span>{esc(it["title"])}' for it in ticker_items)
        pattern = re.compile(r'(<div class="track">\n)(.*?)(\n\s*</div>\n\s*</div>\n\s*</div>)', re.S)
        html_text, ok = replace_block(html_text, pattern, ticker, "الشريط العاجل")
        changed = changed or ok

    if headlines:
        lead = headlines[0]
        h1_pattern = re.compile(r'(<h1>)(.*?)(</h1>)', re.S)
        html_text, ok1 = replace_block(
            html_text,
            h1_pattern,
            f'<a href="{esc(lead["link"])}" target="_blank" rel="noopener">{esc(lead["title"])}</a>',
            "عنوان الهيرو",
        )
        dek_pattern = re.compile(r'(<p class="dek">)(.*?)(</p>)', re.S)
        html_text, ok2 = replace_block(html_text, dek_pattern, esc(lead["dek"] or "التفاصيل عبر المصدر الأصلي."), "ملخص الهيرو")
        byline_pattern = re.compile(r'(<div class="byline">)(.*?)(</div>)', re.S)
        byline = (
            f'\n            <span>المصدر: <b>{esc(lead["source"])}</b></span>\n'
            f'            <span>{esc(lead["time"])}</span>\n'
            "            <span>تحديث تلقائي</span>\n          "
        )
        html_text, ok3 = replace_block(html_text, byline_pattern, byline, "بيانات الهيرو")
        changed = changed or ok1 or ok2 or ok3

    cards = headlines[1 : 1 + CARD_COUNT] or headlines[:CARD_COUNT]
    if cards:
        card_html = "".join(
            f'''\n          <article class="card">\n            <div class="card-figure"><span class="tag">{esc(it["source"])}</span></div>\n            <div class="card-body">\n              <h3><a href="{esc(it["link"])}" target="_blank" rel="noopener">{esc(it["title"])}</a></h3>\n              <p>{esc(it["dek"] or "التفاصيل الكاملة عبر رابط المصدر.")}</p>\n              <div class="meta"><span>{esc(it["source"])}</span><span>{esc(it["time"])}</span></div>\n            </div>\n          </article>'''
            for it in cards
        )
        cards_pattern = re.compile(r'(<div class="card-grid">)(.*?)(\n\s*</div>\n\s*</div>\n\s*</section>)', re.S)
        html_text, ok = replace_block(html_text, cards_pattern, card_html + "\n        ", "بطاقات الأخبار")
        changed = changed or ok

    if changed:
        path.write_text(html_text, encoding="utf-8")
    return changed


def main() -> int:
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("index.html")
    headlines = collect_headlines()
    if not headlines:
        print("لا توجد عناوين مطابقة الآن — لم يتغير الملف.", file=sys.stderr)
        return 0
    changed = update_index_html(target, headlines)
    print("تم تحديث الصفحة." if changed else "لم يتم تغيير الصفحة.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
