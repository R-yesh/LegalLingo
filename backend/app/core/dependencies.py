"""FastAPI dependency providers wiring service interfaces to implementations.

Swapping an implementation (e.g. plugging in a real AIService) only
requires changing the constructor call here.
"""
from functools import lru_cache

from app.services.ai import AIService, UnconfiguredAIService
from app.services.analysis import AIBackedAnalysisService, AnalysisService
from app.services.document_processing import DocumentProcessingService, PdfDocumentProcessingService
from app.services.validation import BasicValidationService, ValidationService


@lru_cache
def get_document_processing_service() -> DocumentProcessingService:
    return PdfDocumentProcessingService()


@lru_cache
def get_validation_service() -> ValidationService:
    return BasicValidationService()


@lru_cache
def get_ai_service() -> AIService:
    return UnconfiguredAIService()


@lru_cache
def get_analysis_service() -> AnalysisService:
    return AIBackedAnalysisService(ai_service=get_ai_service())
