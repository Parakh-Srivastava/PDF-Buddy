import time
from collections import Counter
from pathlib import Path

from component.artificialIntelligence import AiWorker
from component.chunker import chunk_document
from component.headerStripper import (
    find_repeated_headers,
    strip_repeated_headers,
)
from component.pdfScanner import PdfExtractor
from component.vectorDB import VectorStore


# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
PDF_PATH           = Path(r"C:\Users\parak\Downloads\Kishu_6_Month_DSA_Roadmap_Java.pdf")
TOP_K              = 5
FULL_CONTEXT_LIMIT = 8_000     # chars — under this, skip RAG
MIN_HEADER_REPEAT  = 2         # a line must appear this many times to be a header


def banner(step: str) -> None:
    print("\n" + "=" * 60)
    print(f"  {step}")
    print("=" * 60)


def preview(text: str, n: int = 90) -> str:
    return text[:n].replace("\n", " ").strip() + "..."


def main() -> None:
    # ── STEP 1: extract ──────────────────────────────────────
    banner("STEP 1 — Extract text from PDF")
    t0 = time.perf_counter()
    raw_text = PdfExtractor.extract(PDF_PATH)
    t1 = time.perf_counter()
    print(f"[pdfScanner] extracted {len(raw_text):,} chars "
          f"from {PDF_PATH.name} in {t1 - t0:.2f}s")
    print(f"[pdfScanner] preview: {preview(raw_text, 120)!r}")

    # ── DEBUG: raw text dump ─────────────────────────────────
    print("\n--- RAW TEXT PREVIEW (first 1500 chars) ---")
    print(raw_text[:1500])
    print("--- END PREVIEW ---")

    # ── DEBUG: line frequency ────────────────────────────────
    lines = [ln.strip() for ln in raw_text.split("\n") if ln.strip()]
    counts = Counter(lines)
    print("\n--- TOP 10 MOST-COMMON LINES ---")
    for line, n in counts.most_common(10):
        print(f"   {n}x  {line[:90]!r}")
    print("--- END FREQUENCY ---\n")

    # ── STEP 1.5: strip repeated headers ─────────────────────
    banner("STEP 1.5 — Strip repeated headers")
    before = len(raw_text)
    headers = find_repeated_headers(raw_text, min_occurrences=MIN_HEADER_REPEAT)
    print(f"[headerStripper] found {len(headers)} repeated lines "
          f"(min_occurrences={MIN_HEADER_REPEAT})")
    for line in sorted(headers, key=len)[:10]:
        print(f"   · {line[:90]!r}")

    raw_text = strip_repeated_headers(raw_text, headers)
    print(f"[headerStripper] text: {before:,} → {len(raw_text):,} chars "
          f"(-{before - len(raw_text):,})")

    # ── Decide: RAG or full-context? ─────────────────────────
    use_rag = len(raw_text) > FULL_CONTEXT_LIMIT
    mode = "RAG" if use_rag else "FULL-CONTEXT"
    print(f"\n[router] PDF size = {len(raw_text):,} chars → using {mode} mode")

    # ── STEP 2 & 3: chunk + embed (only if RAG) ──────────────
    collection_name = None
    store = None

    if use_rag:
        banner("STEP 2 — Structure-aware chunking")
        t0 = time.perf_counter()
        chunks = chunk_document(raw_text)
        print(f"[chunker] chunks containing markers or short lines:")
        for i, c in enumerate(chunks, 1):
            first = c.split("\n")[0]
            if len(first) < 20 or "---" in first or "PAGE" in first:
                print(f"   [{i}] suspicious heading: {first!r}")
        t1 = time.perf_counter()
        sizes = [len(c) for c in chunks]
        print(f"[chunker] created {len(chunks)} chunks in {t1 - t0:.3f}s")
        print(f"[chunker] sizes: min={min(sizes)} max={max(sizes)} "
              f"avg={sum(sizes) // len(sizes)}")

        # show first 5 chunks with their first line as a label
        print(f"[chunker] first 5 chunks:")
        for i, c in enumerate(chunks[:5], 1):
            first_line = c.split("\n")[0][:80]
            print(f"   [{i}] ({len(c)} chars) {first_line!r}")

        banner("STEP 3 — Embed + store in Chroma")
        t0 = time.perf_counter()
        store = VectorStore()
        collection_name = store.build_collection(PDF_PATH, chunks)
        t1 = time.perf_counter()
        print(f"[vectorDB] '{collection_name}' now holds "
              f"{store.count(collection_name)} chunks ({t1 - t0:.2f}s)")
    else:
        banner("STEP 2 & 3 — Skipped (small PDF, full context is better)")
        print("[router] no chunking, no embedding, no Chroma needed")

    # ── STEP 4: query loop ───────────────────────────────────
    banner("STEP 4 — Ask questions (type 'quit' to exit)")
    ai = AiWorker()

    while True:
        question = input("\nYou: ").strip()
        if not question or question.lower() in {"quit", "exit", "q"}:
            print("bye 👋")
            break

        # 4a — build the context
        if use_rag:
            print("\n[step 4a] retrieving relevant chunks...")
            t0 = time.perf_counter()
            results = store.query(collection_name, question, k=TOP_K)
            t1 = time.perf_counter()
            print(f"[vectorDB] retrieved {len(results)} chunks in {t1 - t0:.2f}s")
            for i, (chunk, meta) in enumerate(results, 1):
                print(f"   [{i}] {meta.get('heading', '?')}  "
                      f"({len(chunk)} chars)")
            context_chunks = [c for c, _ in results]
        else:
            print(f"\n[step 4a] using full PDF as context "
                  f"({len(raw_text):,} chars)")
            context_chunks = [raw_text]

        # 4b — generate
        print("\n[step 4b] generating answer...")
        t0 = time.perf_counter()
        reply = ai.answer(question, context_chunks)
        t1 = time.perf_counter()
        print(f"[AiWorker] generated in {t1 - t0:.2f}s")

        print("\n" + "─" * 60)
        print(f"🤖 PDF-Buddy: {reply}")
        print("─" * 60)


if __name__ == "__main__":
    main()