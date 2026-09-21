from pathlib import Path
import re

import pdfplumber


class PdfExtractor:
    """Extract text from a PDF, preserving tables and page boundaries."""

    @staticmethod
    def extract(pdf_path: str | Path) -> str:
        pdf_path = Path(pdf_path)
        if not pdf_path.is_file():
            raise FileNotFoundError(pdf_path)

        pieces: list[str] = []

        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                # 1) extract tables as structured rows (pipe-separated)
                tables = page.extract_tables()
                table_text = ""
                for table in tables:
                    for row in table:
                        cells = [str(c).strip() if c else "" for c in row]
                        table_text += " | ".join(cells) + "\n"
                    table_text += "\n"

                # 2) extract normal text
                full_text = page.extract_text() or ""

                # 3) prefer table version if tables were found
                body = full_text.strip()
                if table_text.strip():
                    body = f"{body}\n\n[TABLE]\n{table_text.strip()}"
                if body:
                    pieces.append(f"--- PAGE {page_num} ---\n{body}")

        raw = "\n\n".join(pieces)

        # clean common PDF garbage
        raw = raw.replace("(cid:127)", "•")
        raw = raw.replace("(cid:129)", "•")
        raw = re.sub(r"\(cid:\d+\)", "", raw)     # drop any other cid glyphs
        raw = re.sub(r"\n{3,}", "\n\n", raw)      # collapse excess blank lines
        raw = re.sub(r"[ \t]+", " ", raw)         # collapse runs of spaces

        return raw.strip()