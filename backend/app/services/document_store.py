"""In-process document store for the LegalLingo API.

Stores (Document, DocumentAnalysis) pairs keyed by document_id so that
POST /api/chat can look up document context without re-uploading the file.

This is an in-memory store: data is lost on server restart. For production
this would be replaced by a database-backed implementation.
"""
from typing import Optional
import logging

from app.schemas.analysis import DocumentAnalysis
from app.schemas.document import Document

logger = logging.getLogger(__name__)


class DocumentStore:
    """Thread-unsafe in-memory store. Suitable for single-process uvicorn with --reload."""

    def __init__(self) -> None:
        self._docs: dict[str, Document] = {}
        self._analyses: dict[str, DocumentAnalysis] = {}

    def save(self, document: Document, analysis: DocumentAnalysis) -> None:
        self._docs[document.id] = document
        self._analyses[document.id] = analysis
        logger.debug("DocumentStore: saved document %s", document.id)

    def get_document(self, document_id: str) -> Optional[Document]:
        return self._docs.get(document_id)

    def get_analysis(self, document_id: str) -> Optional[DocumentAnalysis]:
        return self._analyses.get(document_id)

    def has(self, document_id: str) -> bool:
        return document_id in self._docs
