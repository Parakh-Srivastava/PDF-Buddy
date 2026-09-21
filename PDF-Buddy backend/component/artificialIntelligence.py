import httpx
from typing import Any


class AiWorker:
    """Talk to local Ollama for generation."""

    OLLAMA_URL = "http://localhost:11434/api/generate"
    MODEL = "llama3.2:3b"

    def __init__(self, timeout: int = 180) -> None:
        self.client = httpx.Client(timeout=timeout)

    # ---------- low-level ----------
    def _ask(self, prompt: str, num_predict: int = 400) -> str:
        payload: dict[str, Any] = {
            "model": self.MODEL,
            "prompt": prompt,
            "stream": False,
            "keep_alive": "30m",
            "options": {"num_predict": num_predict},
        }
        resp = self.client.post(self.OLLAMA_URL, json=payload)
        resp.raise_for_status()
        return resp.json()["response"].strip()

    # ---------- high-level ----------
    def summarise(self, text: str) -> str:
        prompt = (
            "Summarise the text below in exactly 5 bullet points. "
            "Each bullet is ONE sentence, max 15 words. "
            "Never stop mid-sentence.\n\n"
            "---BEGIN TEXT---\n"
            f"{text.strip()}\n"
            "---END TEXT---\n\n"
            "Summary:"
        )
        return self._ask(prompt, num_predict=350)

    def answer(self, question: str, chunks: list[str]) -> str:
        context = "\n\n---\n\n".join(chunks)
        prompt = (
            "Answer the question using ONLY the information in the context below.\n"
            "You may infer or combine facts from the context, but do not invent details "
            "that aren't there. If the context genuinely doesn't contain the answer, "
            "say 'The document does not cover this.'\n\n"
            "---BEGIN CONTEXT---\n"
            f"{context}\n"
            "---END CONTEXT---\n\n"
            f"Question: {question}\n\n"
            "Answer:"
        )
        return self._ask(prompt, num_predict=300)