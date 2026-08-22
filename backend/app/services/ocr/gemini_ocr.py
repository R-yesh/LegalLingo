"""Gemini-based OCR fallback for scanned PDFs.

pypdf's text-layer extraction (document_processing.py) returns empty or
near-empty text for scanned image PDFs that have no embedded text layer.
Rather than rasterizing pages ourselves (no image-conversion package is
installable in this project's build environment), this service hands the
raw PDF bytes directly to Gemini as native multimodal input and asks it to
transcribe each page's visible text verbatim.

This is a transcription fallback only: OCR output is spliced into the same
Document.pages structure that pypdf would have produced, and from there it
flows through the exact same deterministic extraction/rules pipeline as any
other document. It never bypasses that pipeline, never invents facts, and
never marks a page as analyzed when transcription failed -- callers that
get OcrUnavailableError/OcrOutputError should fall back to the existing
honest "document failed validation" error.
"""
import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Optional

logger = logging.getLogger(__name__)

# Lazily import the SDK so the module can be imported even when google-genai
# is not installed (mirrors app/services/llm/gemini.py).
try:
    from google import genai  # type: ignore[import]
    from google.genai import types as genai_types  # type: ignore[import]
    _SDK_AVAILABLE = True
except ImportError:
    genai = None  # type: ignore
    genai_types = None  # type: ignore
    _SDK_AVAILABLE = False


class OcrUnavailableError(Exception):
    """Raised when OCR cannot be attempted (no API key / SDK missing)."""


class OcrOutputError(Exception):
    """Raised when the OCR call fails, is blocked, or returns unusable output."""


_MODEL_ID = "gemini-3.6-flash"

_OCR_PROMPT = """You are transcribing a scanned legal/government document for a citizen \
literacy tool. Read every page of the attached PDF and transcribe the visible \
text VERBATIM -- do not summarize, translate, correct, or add anything that \
is not visibly printed or handwritten on the page. If a page is blank or \
illegible, use an empty string for that page's text.

Respond with ONLY a JSON object of this exact shape, no markdown fences, no \
commentary:
{"pages": [{"page_number": 1, "text": "..."}, {"page_number": 2, "text": "..."}]}

The number of entries in "pages" MUST equal the number of pages in the PDF."""


class OcrService(ABC):
    """Interface for the scanned-document OCR fallback."""

    @abstractmethod
    def is_available(self) -> bool:
        """True when an API key is configured and the SDK is installed."""

    @abstractmethod
    def extract_pages(self, content: bytes, expected_page_count: int) -> list[str]:
        """Transcribes each page of a PDF and returns a list of page texts.

        The returned list always has exactly `expected_page_count` entries,
        indexed so that result[i] is the text for page i + 1.

        Raises OcrUnavailableError if OCR is not configured, or
        OcrOutputError if the call fails or returns unusable output --
        never returns a partial/fabricated result.
        """


class UnavailableOcrService(OcrService):
    """Default stub used when no Gemini API key is configured."""

    def is_available(self) -> bool:
        return False

    def extract_pages(self, content: bytes, expected_page_count: int) -> list[str]:
        raise OcrUnavailableError("GEMINI_API_KEY is not set. OCR fallback is disabled.")


class GeminiOcrService(OcrService):
    """Sends raw PDF bytes to Gemini as native multimodal input for transcription."""

    def __init__(self, api_key: str) -> None:
        if not _SDK_AVAILABLE:
            raise OcrUnavailableError(
                "google-genai SDK is not installed. Run: pip install google-genai"
            )
        if not api_key or not api_key.strip():
            raise OcrUnavailableError("GEMINI_API_KEY is empty.")
        self._client = genai.Client(api_key=api_key.strip())

    def is_available(self) -> bool:
        return True

    def extract_pages(self, content: bytes, expected_page_count: int) -> list[str]:
        try:
            response = self._client.models.generate_content(
                model=_MODEL_ID,
                contents=[
                    genai_types.Part.from_bytes(data=content, mime_type="application/pdf"),
                    _OCR_PROMPT,
                ],
                config=genai_types.GenerateContentConfig(
                    temperature=0.0,
                    max_output_tokens=8192,
                ),
            )
        except Exception as exc:
            logger.error("Gemini OCR call failed: %s", exc)
            raise OcrOutputError(f"Gemini OCR error: {exc}") from exc

        text = self._extract_text(response)
        if not text:
            raise OcrOutputError("Gemini OCR returned an empty or blocked response.")

        payload = self._parse_json_safe(text)
        pages_raw = payload.get("pages")
        if not isinstance(pages_raw, list) or not pages_raw:
            raise OcrOutputError("Gemini OCR returned no page transcriptions.")

        by_number: dict[int, str] = {}
        for entry in pages_raw:
            if not isinstance(entry, dict):
                continue
            try:
                page_number = int(entry.get("page_number"))
            except (TypeError, ValueError):
                continue
            by_number[page_number] = str(entry.get("text") or "")

        if not by_number:
            raise OcrOutputError("Gemini OCR response did not contain any usable page entries.")

        return [by_number.get(i, "") for i in range(1, expected_page_count + 1)]

    # ------------------------------------------------------------------
    # Internal helpers (mirrors app/services/llm/gemini.py)
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_text(response) -> str:
        try:
            return response.text or ""
        except Exception:
            pass
        try:
            return response.candidates[0].content.parts[0].text or ""
        except Exception:
            return ""

    @staticmethod
    def _parse_json_safe(raw: str) -> dict:
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()

        if not cleaned:
            raise OcrOutputError("Gemini OCR returned empty JSON output.")

        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    result = json.loads(match.group())
                except json.JSONDecodeError:
                    raise OcrOutputError(f"Gemini OCR returned malformed JSON: {exc}") from exc
            else:
                raise OcrOutputError(f"Gemini OCR returned malformed JSON: {exc}") from exc

        if not isinstance(result, dict):
            raise OcrOutputError("Gemini OCR returned unexpected JSON type.")

        return result


def build_ocr_service(api_key: Optional[str]) -> OcrService:
    """Factory: returns GeminiOcrService if a key is present, else the stub."""
    if _SDK_AVAILABLE and api_key and api_key.strip():
        try:
            return GeminiOcrService(api_key)
        except OcrUnavailableError as exc:
            logger.warning("Could not initialise GeminiOcrService: %s. Falling back to stub.", exc)
    return UnavailableOcrService()
