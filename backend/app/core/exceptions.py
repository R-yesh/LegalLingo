"""Domain-level exceptions for the analysis pipeline.

These are translated into honest HTTP error responses in main.py's exception
handlers. None of them are ever swallowed into a fabricated success response.
"""


class LegalLingoError(Exception):
    """Base class for all domain errors raised by LegalLingo services."""


class UnsupportedDocumentError(LegalLingoError):
    """Raised when an uploaded file cannot be processed (bad type/empty/corrupt)."""


class DocumentTooLargeError(LegalLingoError):
    """Raised when an uploaded file exceeds the configured size limit."""


class DocumentValidationError(LegalLingoError):
    """Raised when a document fails validation before analysis can proceed."""

    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__("; ".join(errors) or "Document failed validation")


class AnalysisNotAvailableError(LegalLingoError):
    """Raised when the analysis service cannot produce a real result.

    This is the expected error today: no AI/analysis backend is wired up
    yet, so we refuse to return a result rather than fabricate one.
    """
