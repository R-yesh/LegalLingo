"""Document processing service: turns raw uploaded bytes into a Document.

This is a real (not fabricated) implementation for the one format we can
reliably parse today (PDF text extraction via pypdf). Anything we cannot
genuinely extract is left empty rather than guessed at.
"""
import io
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone

from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.core.exceptions import UnsupportedDocumentError
from app.schemas.document import Document, DocumentPage

SUPPORTED_CONTENT_TYPES = {"application/pdf"}


class DocumentProcessingService(ABC):
    """Interface for turning an uploaded file into a structured Document."""

    @abstractmethod
    def process(self, filename: str, content: bytes, content_type: str) -> Document:
        """Extract a Document (with per-page text) from raw file bytes.

        Must raise UnsupportedDocumentError rather than return a Document
        with invented content when extraction is not possible.
        """


class PdfDocumentProcessingService(DocumentProcessingService):
    """Extracts real text content from PDF files using pypdf.

    Non-PDF uploads are rejected rather than silently faked, since we have
    no genuine extraction path for them yet.
    """

    def process(self, filename: str, content: bytes, content_type: str) -> Document:
        if not content:
            raise UnsupportedDocumentError("Uploaded file is empty.")

        if content_type not in SUPPORTED_CONTENT_TYPES and not filename.lower().endswith(".pdf"):
            raise UnsupportedDocumentError(
                f"Unsupported file type '{content_type or 'unknown'}'. "
                f"Only PDF documents are supported at this time."
            )

        try:
            reader = PdfReader(stream=io.BytesIO(content))
        except (PdfReadError, ValueError) as exc:
            raise UnsupportedDocumentError(f"Could not read PDF file: {exc}") from exc

        pages: list[DocumentPage] = []
        for index, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            pages.append(
                DocumentPage(page_number=index, text=text, char_count=len(text))
            )

        return Document(
            id=str(uuid.uuid4()),
            filename=filename,
            file_size=len(content),
            file_type=content_type or "application/pdf",
            document_type="Other",
            uploaded_at=datetime.now(timezone.utc).isoformat(),
            status="processing",
            page_count=len(pages),
            pages=pages,
        )
