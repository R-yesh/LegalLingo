"""Analysis service: the orchestration boundary that will eventually turn a
validated Document into a DocumentAnalysis.

Today this depends on AIService, which is unconfigured, so it raises
AnalysisNotAvailableError rather than returning fabricated legal content.
When a real AI provider is added (see app/services/ai.py), this class is
the only place that needs to change to start returning real analyses.
"""
from abc import ABC, abstractmethod

from app.core.exceptions import AnalysisNotAvailableError
from app.schemas.analysis import DocumentAnalysis
from app.schemas.document import Document
from app.schemas.validation import ValidationResult
from app.services.ai import AIService


class AnalysisService(ABC):
    """Interface for producing a DocumentAnalysis from a validated Document."""

    @abstractmethod
    def analyze(self, document: Document, validation: ValidationResult) -> DocumentAnalysis:
        ...


class AIBackedAnalysisService(AnalysisService):
    def __init__(self, ai_service: AIService):
        self._ai_service = ai_service

    def analyze(self, document: Document, validation: ValidationResult) -> DocumentAnalysis:
        if not validation.is_valid:
            raise AnalysisNotAvailableError(
                "Document failed validation and cannot be analyzed: "
                + "; ".join(validation.errors)
            )

        if not self._ai_service.is_available():
            raise AnalysisNotAvailableError(
                "Analysis is not available yet: no AI provider is configured "
                "on the backend. The document was received and validated "
                "successfully, but no analysis can be produced at this time."
            )

        # self._ai_service.analyze_document(document) would be called here
        # once a real provider is configured, and its output mapped into a
        # DocumentAnalysis. Left unimplemented intentionally.
        raise AnalysisNotAvailableError(
            "Analysis is not available yet: no AI provider is configured."
        )
