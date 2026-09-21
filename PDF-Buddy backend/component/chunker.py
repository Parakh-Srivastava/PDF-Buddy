"""
Generic structure-aware chunker.
Splits on page breaks > section breaks > paragraphs > sentences > words.
Merges tiny fragments. Enforces a hard max size. Optionally overlaps.
"""

import re


# ordered from BIGGEST boundary to SMALLEST
SEPARATORS = [
    "\n--- PAGE ",       # page break (from pdfScanner)
    "\n\n\n",            # section break
    "\n\n",              # paragraph break
    "\n",                # line break
    ". ",                # sentence end
    " ",                 # word boundary (last resort)
]

MAX_CHUNK = 1200
MIN_CHUNK = 200
OVERLAP   = 0        # set to 0 for now — re-enable once retrieval is clean


# ── internal helpers ────────────────────────────────────────

def _split_recursive(text: str, separators: list[str]) -> list[str]:
    if not separators:
        return [text]

    sep = separators[0]
    parts = text.split(sep)

    restored: list[str] = []
    for i, part in enumerate(parts):
        restored.append(part + sep if i < len(parts) - 1 else part)

    result: list[str] = []
    for part in restored:
        if len(part) <= MAX_CHUNK:
            result.append(part)
        else:
            result.extend(_split_recursive(part, separators[1:]))
    return result


def _strip_markers(chunks: list[str]) -> list[str]:
    cleaned: list[str] = []
    for c in chunks:
        # drop whole leading markers
        c = re.sub(r"^\s*--- PAGE \d+ ---\s*", "", c)
        c = re.sub(r"^\s*\[TABLE\]\s*", "", c)
        # drop orphan marker fragments on ANY line
        c = re.sub(r"^\s*\d+\s*---\s*$", "", c, flags=re.MULTILINE)
        c = re.sub(r"^\s*---\s*\d+\s*$", "", c, flags=re.MULTILINE)
        c = re.sub(r"^\s*--- PAGE.*$", "", c, flags=re.MULTILINE)
        c = c.strip()
        if c:
            cleaned.append(c)
    return cleaned


def _merge_small(chunks: list[str]) -> list[str]:
    """Merge small fragments into their neighbours so nothing is orphaned."""
    merged: list[str] = []
    buffer = ""

    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue

        if len(buffer) + len(chunk) + 2 <= MAX_CHUNK:
            buffer = f"{buffer}\n{chunk}".strip() if buffer else chunk
        else:
            if buffer:
                merged.append(buffer)
            buffer = chunk if len(chunk) < MIN_CHUNK else ""
            if not buffer:
                merged.append(chunk)

    if buffer:
        merged.append(buffer)
    return merged


def _enforce_max(chunks: list[str], max_size: int) -> list[str]:
    """
    Last-resort safety net. Any chunk still over max_size gets hard-sliced.
    Guarantees: no returned chunk is ever larger than max_size.
    """
    out: list[str] = []
    for c in chunks:
        if len(c) <= max_size:
            out.append(c)
            continue
        for i in range(0, len(c), max_size):
            piece = c[i:i + max_size]
            if piece.strip():
                out.append(piece)
    return out


def _add_overlap(chunks: list[str]) -> list[str]:
    if OVERLAP <= 0 or len(chunks) <= 1:
        return chunks

    result = [chunks[0]]
    for i in range(1, len(chunks)):
        tail = chunks[i - 1][-OVERLAP:]
        result.append(tail + "\n" + chunks[i])
    return result


# ── public API ──────────────────────────────────────────────

def chunk_document(text: str) -> list[str]:
    pieces = _split_recursive(text, SEPARATORS)
    pieces = _strip_markers(pieces)          # <-- new
    chunks = _merge_small(pieces)
    chunks = _enforce_max(chunks, MAX_CHUNK) # <-- new
    chunks = _add_overlap(chunks)
    return [c.strip() for c in chunks if len(c.strip()) >= 50]