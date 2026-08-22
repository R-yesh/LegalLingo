"""Gemini LLM service abstraction.

The rest of the backend imports from this module, never from the
google.genai SDK directly. Swapping models or providers only requires
changing this file and prompts.py.

Key design decisions:
  - GeminiLLMService is only instantiated when GEMINI_API_KEY is present.
  - All calls are synchronous (uvicorn is run in default threaded mode).
  - Malformed / partial LLM JSON is repaired or rejected — never silently
    forwarded as valid structured output.
  - The system instruction (in prompts.py) is passed as `system_instruction`
    so it never leaks into the user-visible turn.
  - Temperature is set to 0.2 for factual grounded tasks (low creativity).
"""
import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Lazily import the SDK so that the module can be imported even when the
# google-genai package is not yet installed (e.g. in tests that stub it out).
try:
    from google import genai  # type: ignore[import]
    from google.genai import types as genai_types  # type: ignore[import]
    _SDK_AVAILABLE = True
except ImportError:
    genai = None  # type: ignore
    genai_types = None  # type: ignore
    _SDK_AVAILABLE = False


class LLMUnavailableError(Exception):
    """Raised when the LLM cannot be reached or is not configured."""


class LLMOutputError(Exception):
    """Raised when the LLM returns malformed or untrustworthy output."""


# ------------------------------------------------------------------
# Abstract interface — the rest of the backend depends on this only
# ------------------------------------------------------------------

class LLMService(ABC):
    """Abstract LLM service interface used by the analysis and chat layers."""

    @abstractmethod
    def is_available(self) -> bool:
        """True when an API key is configured and the SDK is installed."""

    @abstractmethod
    def generate_text(self, prompt: str, *, max_tokens: int = 2048) -> str:
        """Generate a plain-text response for the given prompt.

        Raises LLMUnavailableError if the service is not configured.
        Raises LLMOutputError if the model returns an empty or blocked response.
        """

    @abstractmethod
    def generate_json(self, prompt: str, *, max_tokens: int = 2048) -> dict[str, Any]:
        """Generate a JSON response and parse it into a dict.

        Raises LLMUnavailableError if the service is not configured.
        Raises LLMOutputError if the JSON cannot be parsed or is empty.
        """


# ------------------------------------------------------------------
# Stub for when no API key is configured
# ------------------------------------------------------------------

class UnavailableLLMService(LLMService):
    """Default stub: tells callers the LLM is not configured."""

    def is_available(self) -> bool:
        return False

    def generate_text(self, prompt: str, *, max_tokens: int = 2048) -> str:
        raise LLMUnavailableError("GEMINI_API_KEY is not set. LLM features are disabled.")

    def generate_json(self, prompt: str, *, max_tokens: int = 2048) -> dict[str, Any]:
        raise LLMUnavailableError("GEMINI_API_KEY is not set. LLM features are disabled.")


# ------------------------------------------------------------------
# Gemini implementation
# ------------------------------------------------------------------

_MODEL_ID = "gemini-3.6-flash"

class GeminiLLMService(LLMService):
    """Calls Google Gemini via the google-genai SDK.

    Instantiate only when GEMINI_API_KEY is present and _SDK_AVAILABLE is True.
    """

    def __init__(self, api_key: str) -> None:
        if not _SDK_AVAILABLE:
            raise LLMUnavailableError(
                "google-genai SDK is not installed. Run: pip install google-genai"
            )
        if not api_key or not api_key.strip():
            raise LLMUnavailableError("GEMINI_API_KEY is empty.")

        from app.services.llm.prompts import SYSTEM_INSTRUCTION

        self._client = genai.Client(api_key=api_key.strip())
        self._system_instruction = SYSTEM_INSTRUCTION
        self._config = genai_types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=4096,
            system_instruction=self._system_instruction,
        )

    def is_available(self) -> bool:
        return True

    def generate_text(self, prompt: str, *, max_tokens: int = 2048) -> str:
        config = genai_types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=max_tokens,
            system_instruction=self._system_instruction,
        )
        try:
            response = self._client.models.generate_content(
                model=_MODEL_ID,
                contents=prompt,
                config=config,
            )
        except Exception as exc:
            logger.error("Gemini generate_text failed: %s", exc)
            raise LLMUnavailableError(f"Gemini API error: {exc}") from exc

        text = self._extract_text(response)
        if not text:
            raise LLMOutputError("Gemini returned an empty or blocked response.")
        return text

    def generate_json(self, prompt: str, *, max_tokens: int = 2048) -> dict[str, Any]:
        raw = self.generate_text(prompt, max_tokens=max_tokens)
        return self._parse_json_safe(raw)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_text(response) -> str:
        """Extract the text from a GenerateContentResponse safely."""
        try:
            return response.text or ""
        except Exception:
            pass
        try:
            return response.candidates[0].content.parts[0].text or ""
        except Exception:
            return ""

    @staticmethod
    def _parse_json_safe(raw: str) -> dict[str, Any]:
        """Parse a JSON string from the model, stripping markdown fences if present.

        Raises LLMOutputError on failure — never silently returns partial data.
        """
        # Strip common markdown code fences the model sometimes adds
        cleaned = raw.strip()
        # Remove ```json ... ``` or ``` ... ```
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()

        if not cleaned:
            raise LLMOutputError("LLM returned empty JSON output.")

        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            # Attempt a second pass: sometimes the model wraps with extra text
            # before/after the JSON block. Try to find the first {...} span.
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    result = json.loads(match.group())
                except json.JSONDecodeError:
                    raise LLMOutputError(
                        f"LLM returned malformed JSON: {exc}. Raw: {raw[:300]}"
                    ) from exc
            else:
                raise LLMOutputError(
                    f"LLM returned malformed JSON: {exc}. Raw: {raw[:300]}"
                ) from exc

        if not isinstance(result, dict):
            raise LLMOutputError(
                f"LLM returned unexpected JSON type {type(result).__name__}. Expected dict."
            )

        return result


def build_llm_service(api_key: Optional[str]) -> LLMService:
    """Factory: returns GeminiLLMService if a key is present, else the stub."""
    if _SDK_AVAILABLE and api_key and api_key.strip():
        try:
            return GeminiLLMService(api_key)
        except LLMUnavailableError as exc:
            logger.warning("Could not initialise GeminiLLMService: %s. Falling back to stub.", exc)
    return UnavailableLLMService()
