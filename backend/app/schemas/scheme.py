"""Government welfare scheme schema for GET /api/schemes.

Mirrors frontend/src/types/index.ts::Scheme field-for-field.
"""
from typing import Literal

from app.schemas.base import CamelModel
from app.schemas.common import Language

SchemeCategory = Literal[
    "Housing", "Subsidy", "Legal Aid", "Farmer", "Women Empowerment", "Senior Citizen"
]


class Scheme(CamelModel):
    id: str
    name: dict[Language, str]
    category: SchemeCategory
    description: dict[Language, str]
    why_it_matches: dict[Language, str]
    eligibility: dict[Language, list[str]]
    required_documents: dict[Language, list[str]]
    match_percentage: int
    state: str
    official_portal_url: str
    financial_benefit: str
