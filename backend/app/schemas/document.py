"""Document-related schemas.

Document mirrors frontend LegalDocument (frontend/src/types/index.ts), with
the addition of `pages`, which the frontend type does not have — it is the
backend-internal representation of per-page extracted content that feeds
the analysis stage.
"""
from typing import Optional

from pydantic import Field

from app.schemas.base import CamelModel
from app.schemas.common import DocumentProcessingStatus, DocumentType, PartyRole


class DocumentParty(CamelModel):
    name: str
    role: PartyRole
    id_number: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


class DocumentPage(CamelModel):
    """A single extracted page of a source document."""

    page_number: int = Field(..., ge=1)
    text: str = ""
    char_count: int = Field(default=0, ge=0)


class Document(CamelModel):
    """Backend representation of an uploaded document, pre-analysis."""

    id: str
    document_set_id: Optional[str] = None
    filename: str
    file_size: int = Field(..., ge=0)
    file_type: str
    document_type: DocumentType = "Other"
    uploaded_at: str
    status: DocumentProcessingStatus = "pending"
    page_count: int = Field(default=0, ge=0)
    pages: list[DocumentPage] = Field(default_factory=list)
