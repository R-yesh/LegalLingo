"""Clause and extracted-field schemas.

Mirrors frontend ExtractedField and Clause (frontend/src/types/index.ts).
"""
from typing import Optional

from pydantic import Field

from app.schemas.base import CamelModel
from app.schemas.common import AttentionLevel, ClauseCategory, ExtractedFieldCategory, Language


class ExtractedField(CamelModel):
    id: str
    label: str
    value: str
    category: ExtractedFieldCategory
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    page_number: Optional[int] = Field(default=None, ge=1)
    verified: Optional[bool] = None


class Clause(CamelModel):
    id: str
    clause_number: str
    title: str
    original_text: str
    simple_meaning: dict[Language, str]
    why_it_matters: dict[Language, str]
    what_to_verify: dict[Language, str]
    severity: AttentionLevel
    page_number: int = Field(..., ge=1)
    confidence: float = Field(..., ge=0, le=1)
    category: ClauseCategory
