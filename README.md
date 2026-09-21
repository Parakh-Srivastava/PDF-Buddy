# PDF-Buddy

PDF-Buddy is a local document Q&A application built for PDF ingestion and retrieval-augmented generation (RAG). Users can upload a PDF, extract its text, split it into chunks, and ask questions grounded in the document content using a local Ollama model and Chroma vector database.

## Features

- PDF upload and text extraction
- Automatic header cleanup to reduce noisy repeated headings
- Chunking for large documents
- Vector search using Chroma and Ollama embeddings
- Local LLM-based answer generation with Ollama
- Full-context fallback for shorter documents
- React frontend for uploading PDFs and asking questions

## Project Structure

- `PDF-Buddy backend/` — Flask API and PDF processing pipeline
- `PDF-Buddy frontend/` — Vite + React client
- `README.md` — project documentation

## Tech Stack

- Python 3.10+
- Flask
- ChromaDB
- Ollama
- React + Vite

## Prerequisites

Before running the app, install:

- Python dependencies from `PDF-Buddy backend/requirements.txt`
- Node.js and npm for the frontend
- Ollama installed locally and running on `http://localhost:11434`
- Required Ollama models pulled:
  - `llama3.2:3b`
  - `nomic-embed-text`

Example:

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

## Backend Setup

1. Open a terminal in the backend folder:

```bash
cd "PDF-Buddy backend"
```

2. Create and activate a virtual environment (optional but recommended):

```bash
python -m venv venv
venv\Scripts\activate
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Start the Flask API:

```bash
python app.py
```

The backend runs on:

- `http://localhost:5000`

## Frontend Setup

1. Open a terminal in the frontend folder:

```bash
cd "PDF-Buddy frontend"
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend typically runs on:

- `http://localhost:5173`

## How It Works

1. A PDF is uploaded from the frontend.
2. The backend extracts raw text from the PDF.
3. Repeated headers are removed to improve structure.
4. If the document is large enough, it is split into chunks and embedded into Chroma.
5. A user question is matched against the stored chunk embeddings.
6. Relevant chunks are sent to the local Ollama model as context.
7. The model answers based only on the retrieved document content.

## API Endpoints

The backend exposes these main routes:

- `POST /upload` — upload a PDF and initialize the document context
- `POST /ask` — ask a question about the active document
- `GET /active_corpus` — get details about the active loaded corpus

## Notes

- The app is intended for local use and relies on local services.
- If Ollama is not running, the backend will fail when embedding or generating answers.
- The Chroma database is stored under `PDF-Buddy backend/chroma_db/`.
- Large PDFs are processed in RAG mode; smaller documents can be answered using full-context mode.

## Example Workflow

```bash
# Terminal 1
cd "PDF-Buddy backend"
python app.py

# Terminal 2
cd "PDF-Buddy frontend"
npm install
npm run dev
```

Then open the frontend in the browser, upload a PDF, and ask questions about it.
