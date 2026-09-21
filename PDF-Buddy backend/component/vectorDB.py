import hashlib
from pathlib import Path

import chromadb
import httpx


class VectorStore:
    """Embed chunks via Ollama, store + search in Chroma."""

    EMBED_URL   = "http://localhost:11434/api/embeddings"
    EMBED_MODEL = "nomic-embed-text"

    def __init__(self, persist_dir: str | Path = "./chroma_db") -> None:
        self.client = chromadb.PersistentClient(path=str(persist_dir))
        print(f"[vectorDB] persistent store at {persist_dir}")

    # ---------- embed ----------
    def _embed(self, text: str) -> list[float]:
        resp = httpx.post(
            self.EMBED_URL,
            json={"model": self.EMBED_MODEL, "prompt": text},
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json()["embedding"]

    # ---------- stable collection name ----------
    @staticmethod
    def _collection_name(pdf_path: Path) -> str:
        pdf_path = Path(pdf_path)
        file_hash = hashlib.md5(pdf_path.read_bytes()).hexdigest()[:12]
        safe_stem = pdf_path.stem.replace(" ", "_").replace("-", "_")
        return f"{safe_stem}_{file_hash}"

    @staticmethod
    def _heading_of(chunk: str) -> str:
        """First non-empty line, trimmed — used as a label for the chunk."""
        for line in chunk.split("\n"):
            line = line.strip()
            if line:
                return line[:80]
        return "(no heading)"

    # ---------- store ----------
    def build_collection(self, pdf_path: Path, chunks: list[str]) -> str:
        pdf_path = Path(pdf_path)
        name = self._collection_name(pdf_path)

        existing = [c.name for c in self.client.list_collections()]
        if name in existing:
            print(f"[vectorDB] collection '{name}' already exists — skipping embed")
            return name

        print(f"[vectorDB] creating collection '{name}'")
        collection = self.client.create_collection(name)

        for i, chunk in enumerate(chunks, 1):
            heading = self._heading_of(chunk)
            labelled = f"{heading}\n{chunk}"          # embed with heading prefix
            vec = self._embed(labelled)

            collection.add(
                ids=[f"chunk_{i}"],
                embeddings=[vec],
                documents=[chunk],                     # store the clean chunk
                metadatas=[{
                    "chunk_index": i,
                    "source": pdf_path.name,
                    "heading": heading,
                }],
            )
            print(f"[vectorDB]   embedded {i}/{len(chunks)}", end="\r")

        print()
        return name

    # ---------- retrieve ----------
    def query(self, collection_name: str, question: str, k: int = 5):
        """Return list of (chunk_text, metadata) tuples."""
        collection = self.client.get_collection(collection_name)
        q_vec = self._embed(question)
        result = collection.query(
            query_embeddings=[q_vec],
            n_results=k,
            include=["documents", "metadatas"],
        )
        docs = result["documents"][0]
        metas = result["metadatas"][0]
        return list(zip(docs, metas))

    def count(self, collection_name: str) -> int:
        return self.client.get_collection(collection_name).count()