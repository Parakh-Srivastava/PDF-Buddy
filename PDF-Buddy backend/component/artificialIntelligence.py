import httpx
from typing import Any


class AiWorker:
    """Talk to local Ollama for generation."""

    OLLAMA_URL = "http://localhost:11434/api/generate"
    DEFAULT_MODEL = "llama3.2:3b"

    def __init__(self, default_model: str = "llama3.2:3b", timeout: int = 180) -> None:
        self.client = httpx.Client(timeout=timeout)
        self.MODEL = default_model

    # ---------- low-level ----------
    def _ask(self, prompt: str, model: str | None = None, num_predict: int = 450) -> str:
        chosen_model = model or self.MODEL
        payload: dict[str, Any] = {
            "model": chosen_model,
            "prompt": prompt,
            "stream": False,
            "keep_alive": "30m",
            "options": {"num_predict": num_predict},
        }
        resp = self.client.post(self.OLLAMA_URL, json=payload)
        resp.raise_for_status()
        return resp.json()["response"].strip()

    # ---------- high-level ----------
    def summarise(self, text: str, model: str | None = None) -> str:
        prompt = (
            "Summarise the text below in exactly 5 bullet points. "
            "Each bullet is ONE sentence, max 15 words. "
            "Never stop mid-sentence.\n\n"
            "---BEGIN TEXT---\n"
            f"{text.strip()}\n"
            "---END TEXT---\n\n"
            "Summary:"
        )
        return self._ask(prompt, model=model, num_predict=350)

    def answer(self, question: str, chunks: list[str], model: str | None = None) -> str:
        context = "\n\n---\n\n".join(chunks)
        prompt = (
            "You are answering questions about a document. "
            "Use ONLY the context below. Do NOT invent numbers, time units, "
            "or structure that isn't explicitly present. "
            "If the context says weeks, say weeks. If the context says months, say months. "
            "If it doesn't say a thing, say 'The document does not specify.'\n\n"
            "Quote exact phrases when giving times, durations, or quantities.\n\n"
            "---BEGIN CONTEXT---\n"
            f"{context}\n"
            "---END CONTEXT---\n\n"
            f"Question: {question}\n\n"
            "Answer:"
        )
        return self._ask(prompt, model=model, num_predict=450)