"""
Detect and strip repeated lines (table headers, page headers/footers)
from extracted PDF text. Uses frequency + shape heuristics — no content rules.
"""

import re
from collections import Counter


PAGE_MARKER = re.compile(r"^--- PAGE \d+ ---$")


def _looks_like_heading(line: str) -> bool:
    """
    A line we should NEVER strip even if it repeats.
    Real section headings are short, ALL-CAPS, or end with ':'.
    """
    stripped = line.strip()
    if len(stripped) > 60:
        return False

    letters = [c for c in stripped if c.isalpha()]
    if letters and sum(1 for c in letters if c.isupper()) / len(letters) > 0.8:
        return True

    if stripped.endswith(":"):
        return True

    return False


def _looks_like_sentence_fragment(line: str) -> bool:
    """
    Wrapped text often produces short fragments like:
        'windows.'
        'movement and contiguous'
    These repeat across pages but are NOT headers.
    """
    stripped = line.strip()
    if stripped.endswith((".", "!", "?", ",", ";")):
        return True
    # if it starts with lowercase → almost certainly a wrap fragment
    if stripped and stripped[0].islower():
        return True
    return False


def find_repeated_headers(text: str, min_occurrences: int = 3) -> set[str]:
    """
    A line is a header if it:
      - appears >= min_occurrences times
      - is short (<= 50 chars)   → real content lines are longer
      - is not a real heading (caps / colon)
      - is not a sentence fragment (starts lowercase / ends with punctuation)
    """
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    lines = [ln for ln in lines if not PAGE_MARKER.match(ln)]

    counts = Counter(lines)
    headers: set[str] = set()

    for line, n in counts.items():
        if n < min_occurrences:
            continue
        if len(line) > 50:
            continue
        if _looks_like_heading(line):
            continue
        if _looks_like_sentence_fragment(line):
            continue
        headers.add(line)

    return headers


def strip_repeated_headers(text: str, headers: set[str]) -> str:
    """Remove every line whose stripped form is in `headers`."""
    return "\n".join(
        ln for ln in text.split("\n") if ln.strip() not in headers
    )