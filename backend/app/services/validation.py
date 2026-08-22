"""Validation service: checks an extracted Document before analysis."""
from abc import ABC, abstractmethod

from app.schemas.document import Document
from app.schemas.validation import ValidationResult


class ValidationService(ABC):
    """Interface for validating a Document is fit for analysis."""

    @abstractmethod
    def validate(self, document: Document) -> ValidationResult:
        ...


class BasicValidationService(ValidationService):
    """Structural validation only: no legal judgement, just sanity checks."""

    MIN_EXTRACTED_CHARS = 20

    def validate(self, document: Document) -> ValidationResult:
        errors: list[str] = []
        warnings: list[str] = []

        if document.page_count == 0 or not document.pages:
            errors.append("No pages could be extracted from the document.")

        total_chars = sum(page.char_count for page in document.pages)
        if document.pages and total_chars < self.MIN_EXTRACTED_CHARS:
            errors.append(
                "Extracted text is too short to analyze reliably "
                "(the PDF may be a scanned image without a text layer)."
            )

        if document.file_size == 0:
            errors.append("Uploaded file is empty.")

        empty_pages = [p.page_number for p in document.pages if p.char_count == 0]
        if empty_pages and len(empty_pages) < len(document.pages):
            warnings.append(
                f"Pages with no extractable text: {', '.join(map(str, empty_pages))}."
            )

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
        )
