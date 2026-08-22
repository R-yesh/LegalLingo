"""Enums / literal types shared across schemas.

Mirrors frontend/src/types/index.ts as closely as possible.
"""
from typing import Literal

Language = Literal["en", "hi", "mr"]

AttentionLevel = Literal["VERIFIED", "STANDARD", "REVIEW", "HIGH ATTENTION"]

DocumentProcessingStatus = Literal[
    "pending", "uploading", "processing", "completed", "error"
]

DocumentType = Literal[
    "Sale Agreement",
    "Sale Deed",
    "Rent Agreement",
    "Gift Deed",
    "NOC",
    "PAN Card",
    "Title Deed",
    "Encumbrance Certificate",
    "Other",
]

PartyRole = Literal[
    "Seller / First Party",
    "Buyer / Second Party",
    "Witness",
    "Bank / Lender",
    "Lessor",
    "Lessee",
    "Other",
]

ExtractedFieldCategory = Literal["party", "property", "financial", "date", "legal"]

ClauseCategory = Literal[
    "title", "payment", "possession", "indemnity", "dispute", "encumbrance", "general"
]

ChecklistStatus = Literal["pending", "completed"]
