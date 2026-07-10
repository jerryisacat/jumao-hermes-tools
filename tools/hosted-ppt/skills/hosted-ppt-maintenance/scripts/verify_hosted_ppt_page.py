#!/usr/bin/env python3
"""Verify hosted-ppt standalone HTML page conventions.

Usage:
  python3 verify_hosted_ppt_page.py <slug> [expected_slide_count] [--repo /path/to/hosted-ppt]

Run from anywhere. The --repo flag defaults to the current working directory.
Talks are expected under <repo>/public/talks/<slug>/index.html, and the homepage
directory is expected at <repo>/src/web/pages/index.astro (Astro project layout).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class SlideCounter(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.slides = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = dict(attrs)
        if tag == "section" and "slide" in (attr.get("class") or "").split():
            self.slides += 1


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Verify hosted-ppt standalone HTML page conventions."
    )
    parser.add_argument("slug", help="Presentation slug (e.g. my-deck)")
    parser.add_argument(
        "expected_slide_count",
        type=int,
        nargs="?",
        default=None,
        help="Expected number of slide sections (optional)",
    )
    parser.add_argument(
        "--repo",
        default=os.getcwd(),
        help="Path to the hosted-ppt repository root (default: current directory)",
    )
    args = parser.parse_args()

    slug = args.slug.strip("/")
    repo = Path(args.repo).resolve()

    deck_path = repo / "public" / "talks" / slug / "index.html"
    index_path = repo / "src" / "web" / "pages" / "index.astro"

    # Fallback: if the Astro index doesn't exist, try the static index.html
    if not index_path.exists():
        index_path = repo / "index.html"

    if not deck_path.exists():
        fail(f"missing deck {deck_path}")
    if not index_path.exists():
        fail(f"missing homepage {index_path}")

    deck = deck_path.read_text(encoding="utf-8")
    index = index_path.read_text(encoding="utf-8")

    counter = SlideCounter()
    counter.feed(deck)
    if args.expected_slide_count is not None and counter.slides != args.expected_slide_count:
        fail(f"slide count {counter.slides} != expected {args.expected_slide_count}")

    page_href = f"/talks/{slug}/"
    if page_href not in index:
        fail(f"homepage missing link {page_href}")

    if re.search(r'href=["\']/(?:["\']|#)', deck):
        fail("standalone deck links back to root")
    if re.search(r'href=["\']/talks/', deck):
        fail("standalone deck links to talks directory")

    fixed_canvas = "width: 1600px" in deck and "height: 900px" in deck
    if fixed_canvas:
        required = [".slide-shell", "const SLIDE_WIDTH = 1600", "orientationchange"]
        missing = [token for token in required if token not in deck]
        if missing:
            fail("fixed-size deck missing responsive helpers: " + ", ".join(missing))

    print(f"PASS: deck exists: {deck_path}")
    print(f"PASS: slide count: {counter.slides}")
    print("PASS: homepage links to deck")
    if fixed_canvas:
        print("PASS: fixed-size deck has responsive scaling helper")


if __name__ == "__main__":
    main()
