from pathlib import Path
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

from component.artificialIntelligence import AiWorker
from component.chunker import chunk_document
from component.headerStripper import (
    find_repeated_headers,
    strip_repeated_headers,
)
from component.pdfScanner import PdfExtractor
from component.vectorDB import VectorStore

# ─────────────────────────────────────────────────────────────
# CONFIG & INITIALIZATION
# ─────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

TOP_K = 5
FULL_CONTEXT_LIMIT = 8_000  # chars — under this, skip RAG
MIN_HEADER_REPEAT = 2  # a line must appear this many times to be a header

# Global state holders for the active PDF session
ai = AiWorker()
store = None
collection_name = None
use_rag = False
raw_text = ""


# ─────────────────────────────────────────────────────────────
# API ROUTES
# ─────────────────────────────────────────────────────────────

def ensure_active_session():
    """If server restarted, auto-load the latest file in uploads/ if available."""
    global store, collection_name, use_rag, raw_text
    if raw_text:
        return True

    uploaded_files = sorted(UPLOAD_FOLDER.glob("*.pdf"), key=lambda f: f.stat().st_mtime, reverse=True)
    if not uploaded_files:
        return False

    latest_pdf = uploaded_files[0]
    print(f"[Auto-Recover] Reloading active session from {latest_pdf.name}...")
    try:
        raw_text = PdfExtractor.extract(latest_pdf)
        headers = find_repeated_headers(raw_text, min_occurrences=MIN_HEADER_REPEAT)
        raw_text = strip_repeated_headers(raw_text, headers)
        use_rag = len(raw_text) > FULL_CONTEXT_LIMIT
        if use_rag:
            chunks = chunk_document(raw_text)
            store = VectorStore()
            collection_name = store.build_collection(latest_pdf, chunks)
        else:
            store = None
            collection_name = None
        return True
    except Exception as e:
        print(f"[Auto-Recover Error] {e}")
        return False


@app.route("/active_corpus", methods=["GET"])
def get_active_corpus():
    """Returns currently loaded document info if any."""
    global store, collection_name, use_rag, raw_text
    if not raw_text:
        ensure_active_session()

    if not raw_text:
        return jsonify({"active": False}), 200

    uploaded_files = sorted(UPLOAD_FOLDER.glob("*.pdf"), key=lambda f: f.stat().st_mtime, reverse=True)
    filename = uploaded_files[0].name if uploaded_files else "active_document.pdf"
    
    chunk_count = store.count(collection_name) if (use_rag and store and collection_name) else (1 if raw_text else 0)

    return jsonify({
        "active": True,
        "filename": filename,
        "char_count": len(raw_text),
        "mode": "RAG" if use_rag else "FULL-CONTEXT",
        "chunk_count": chunk_count,
        "collection_name": collection_name
    }), 200


@app.route("/upload", methods=["POST"])
def upload_pdf():
    """Handles PDF file upload from the frontend, extracts text, and initializes RAG if needed."""
    global store, collection_name, use_rag, raw_text

    t_start = time.perf_counter()

    if "pdf" not in request.files:
        return jsonify({"error": "No PDF file provided in the request"}), 400

    file = request.files["pdf"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Securely save the uploaded file temporarily
    filename = secure_filename(file.filename)
    pdf_path = UPLOAD_FOLDER / filename
    file.save(pdf_path)

    print(f"[Upload] Processing uploaded file: {filename}...")

    # 1. Extract text
    raw_text = PdfExtractor.extract(pdf_path)

    # 2. Strip repeated headers
    headers = find_repeated_headers(raw_text, min_occurrences=MIN_HEADER_REPEAT)
    raw_text = strip_repeated_headers(raw_text, headers)

    # 3. Determine mode
    use_rag = len(raw_text) > FULL_CONTEXT_LIMIT
    mode = "RAG" if use_rag else "FULL-CONTEXT"
    print(f"[Init] PDF size: {len(raw_text):,} chars | Mode: {mode}")

    # 4. Chunk and embed if RAG
    if use_rag:
        chunks = chunk_document(raw_text)
        store = VectorStore()
        collection_name = store.build_collection(pdf_path, chunks)
        chunk_count = store.count(collection_name)
        print(f"[Init] Vector store built with {chunk_count} chunks.")
        chunks_data = [
            {
                "id": f"chunk_{i+1:02d}",
                "index": i + 1,
                "token_count": len(c.split()),
                "char_count": len(c),
                "text": c
            }
            for i, c in enumerate(chunks)
        ]
    else:
        store = None
        collection_name = None
        chunk_count = 1 if raw_text else 0
        chunks_data = [
            {
                "id": "chunk_01",
                "index": 1,
                "token_count": len(raw_text.split()),
                "char_count": len(raw_text),
                "text": raw_text
            }
        ] if raw_text else []

    total_time = round(time.perf_counter() - t_start, 2)

    return jsonify({
        "message": "PDF processed successfully",
        "filename": filename,
        "mode": mode,
        "char_count": len(raw_text),
        "chunk_count": chunk_count,
        "chunks": chunks_data,
        "processing_time": f"{total_time}s",
        "processing_time_ms": int(total_time * 1000)
    }), 200


@app.route("/ask", methods=["POST"])
def ask_question():
    """Answers a question using the active processed PDF context."""
    global store, collection_name, use_rag, raw_text

    if not raw_text and not ensure_active_session():
        return jsonify({"error": "No PDF has been uploaded yet. Please upload a PDF first."}), 400


    data = request.get_json()
    if not data or "question" not in data:
        return jsonify({"error": "Missing 'question' in request body"}), 400

    question = data["question"].strip()
    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400

    model_choice = data.get("model", None)

    try:
        # Build context based on mode
        if use_rag:
            results = store.query(collection_name, question, k=TOP_K)
            context_chunks = []
            retrieved_chunks = []
            for item in results:
                # Handle 3-tuple (doc, meta, dist) or 2-tuple (doc, meta)
                if len(item) == 3:
                    doc, meta, dist = item
                else:
                    doc, meta = item
                    dist = 0.0
                
                context_chunks.append(doc)
                heading = meta.get("heading", "") if isinstance(meta, dict) else ""
                index = meta.get("chunk_index", len(context_chunks)) if isinstance(meta, dict) else len(context_chunks)
                
                retrieved_chunks.append({
                    "text": doc,
                    "heading": heading,
                    "index": index,
                    "distance": float(dist) if isinstance(dist, (int, float)) else 0.0
                })
        else:
            context_chunks = [raw_text]
            retrieved_chunks = [{"text": raw_text, "heading": "Full Context", "index": 1, "distance": 0.0}]

        # Generate reply via AI worker
        reply = ai.answer(question, context_chunks, model=model_choice)

        return jsonify({
            "question": question,
            "answer": reply,
            "model_used": model_choice or ai.MODEL,
            "retrieved_chunks": retrieved_chunks
        }), 200

    except Exception as e:
        print(f"[Error] {str(e)}")
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)