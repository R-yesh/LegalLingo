"""FastAPI dependency providers wiring service interfaces to implementations.

Swapping an implementation (e.g. plugging in a real AIService) only
requires changing the constructor call here.

LLM wiring logic:
  - If GEMINI_API_KEY is set in the environment, GeminiLLMService is used.
  - If GEMINI_API_KEY is absent, UnavailableLLMService is used (no LLM calls).
  - LLMBackedAnalysisService automatically falls back to deterministic output
    when the LLM is unavailable — no fabrication, no sample data.
"""
from functools import lru_cache

from app.core.config import get_settings
from app.services.chat import ChatService
from app.services.document_store import DocumentStore
from app.services.llm.gemini import LLMService, build_llm_service
from app.services.llm_analysis import LLMBackedAnalysisService
from app.services.analysis import AnalysisService
from app.services.document_processing import DocumentProcessingService, PdfDocumentProcessingService
from app.services.validation import BasicValidationService, ValidationService

# Singleton document store (lives for the lifetime of this process)
_document_store = DocumentStore()


@lru_cache
def get_document_processing_service() -> DocumentProcessingService:
    return PdfDocumentProcessingService()


@lru_cache
def get_validation_service() -> ValidationService:
    return BasicValidationService()


@lru_cache
def get_llm_service() -> LLMService:
    settings = get_settings()
    return build_llm_service(settings.gemini_api_key)


@lru_cache
def get_analysis_service() -> AnalysisService:
    return LLMBackedAnalysisService(llm_service=get_llm_service())


def get_document_store() -> DocumentStore:
    """Returns the singleton in-process DocumentStore (not cached via lru_cache)."""
    return _document_store


def get_chat_service() -> ChatService:
    return ChatService(llm_service=get_llm_service())
