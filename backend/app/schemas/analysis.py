"""DocumentAnalysis schema and its sub-schemas.

Mirrors frontend DocumentAnalysis, AttentionItem, VerificationStep
(frontend/src/types/index.ts) as closely as possible.
"""
from typing import Optional

from pydantic import Field

from app.schemas.base import CamelModel
from app.schemas.clause import Clause, ExtractedField
from app.schemas.common import AttentionLevel, ChecklistStatus, Language
from app.schemas.document import DocumentParty


class FinancialDetails(CamelModel):
    total_amount: Optional[str] = None
    advance_paid: Optional[str] = None
    balance_due: Optional[str] = None
    stamp_duty: Optional[str] = None
    registration_fee: Optional[str] = None
    payment_mode: Optional[str] = None


class ImportantDate(CamelModel):
    label: str
    date: str
    description: str


class AttentionItem(CamelModel):
    id: str
    clause_id: str
    title: dict[Language, str]
    severity: AttentionLevel
    short_explanation: dict[Language, str]
    why_it_matters: dict[Language, str]
    recommended_action: dict[Language, str]
    evidence_page: int = Field(..., ge=1)
    evidence_clause: str
    confidence: float = Field(..., ge=0, le=1)


class VerificationStep(CamelModel):
    id: str
    title: str
    description: str
    status: ChecklistStatus
    required_document: Optional[str] = None
    authority_portal_url: Optional[str] = None


class DocumentAnalysis(CamelModel):
    id: str
    document_id: str
    summary: dict[Language, str]
    health_score: int = Field(..., ge=0, le=100)
    parties: list[DocumentParty]
    extracted_fields: list[ExtractedField]
    financial_details: FinancialDetails
    important_dates: list[ImportantDate]
    attention_items: list[AttentionItem]
    clauses: list[Clause]
    citizen_checklist: list[VerificationStep]
    analyzed_at: str
