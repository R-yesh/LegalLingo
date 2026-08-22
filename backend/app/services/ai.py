"""AI service interface.

No LLM is wired up yet. AnalysisService depends on this interface so that
plugging in a real model later (Claude, etc.) is a matter of adding a new
implementation here — nothing else in the request pipeline needs to change.
"""
from abc import ABC, abstractmethod

from app.schemas.document import Document


class AIService(ABC):
    """Interface for an LLM-backed reasoning provider."""

    @abstractmethod
    def is_available(self) -> bool:
        """Whether this service is configured and able to serve requests."""

    @abstractmethod
    def analyze_document(self, document: Document) -> dict:
        """Run the model over a Document's extracted pages.

        Implementations must raise AnalysisNotAvailableError (rather than
        return placeholder content) if they cannot produce a genuine result.
        """


class UnconfiguredAIService(AIService):
    """Default AI service: honestly reports that no model is configured."""

    def is_available(self) -> bool:
        return False

    def analyze_document(self, document: Document) -> dict:
        from app.core.exceptions import AnalysisNotAvailableError

        raise AnalysisNotAvailableError(
            "No AI provider is configured on the backend yet."
        )
