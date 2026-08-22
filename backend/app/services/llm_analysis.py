"""LLM-backed AnalysisService implementation.

Architecture: Document → Deterministic extraction → Deterministic validation
              → LLM explanation  →  DocumentAnalysis

The LLM receives:
  - Pre-computed deterministic facts (doc_type, parties, financials, dates,
    attention_items, clauses, validation findings)
  - Page text (marked as untrusted)

The LLM is NOT asked to:
  - assign risk severity       ← done by rules.py
  - decide fraud / illegality  ← never done
  - invent facts               ← forbidden by system instruction

If the LLM is unavailable or returns bad output, this service falls back to
the DeterministicAnalysisService result verbatim — no silent fabrication.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.exceptions import AnalysisNotAvailableError
from app.schemas.analysis import (
    AttentionItem,
    DocumentAnalysis,
    FinancialDetails,
    ImportantDate,
    VerificationStep,
)
from app.schemas.clause import Clause, ExtractedField
from app.schemas.common import Language
from app.schemas.document import Document, DocumentParty
from app.schemas.validation import ValidationResult
from app.services.analysis import AnalysisService
from app.services.deterministic_analysis import DeterministicAnalysisService
from app.services.extraction import facts
from app.services.extraction.clauses import build_clauses
from app.services.extraction.text_utils import join_pages
from app.services.llm.gemini import LLMOutputError, LLMService, LLMUnavailableError
from app.services.llm.prompts import build_analysis_explanation_prompt, build_clause_explanation_prompt
from app.services import rules

logger = logging.getLogger(__name__)


class LLMBackedAnalysisService(AnalysisService):
    """AnalysisService that augments deterministic facts with LLM explanations.

    Pipeline:
      1. Deterministic extraction (facts, clauses, financials, parties, dates)
      2. Deterministic rule evaluation (attention_items, health_score)
      3. LLM explanation enrichment for clauses and summary (per language)
      4. Assemble DocumentAnalysis — LLM output never replaces, only enriches
    """

    def __init__(self, llm_service: LLMService) -> None:
        self._llm = llm_service
        self._deterministic = DeterministicAnalysisService()

    def analyze(self, document: Document, validation: ValidationResult) -> DocumentAnalysis:
        if not validation.is_valid:
            raise AnalysisNotAvailableError(
                "Document failed validation: " + "; ".join(validation.errors)
            )

        # ------------------------------------------------------------------
        # Step 1 & 2: Deterministic extraction + rule evaluation
        # Always runs — LLM enrichment is additive only
        # ------------------------------------------------------------------
        base: DocumentAnalysis = self._deterministic.analyze(document, validation)

        # If LLM is not available, return the deterministic result as-is
        if not self._llm.is_available():
            logger.info(
                "LLM unavailable for document %s — returning deterministic analysis.", document.id
            )
            return base

        # ------------------------------------------------------------------
        # Step 3: LLM explanation enrichment
        # ------------------------------------------------------------------
        pages_payload = [
            {"page_number": p.page_number, "text": p.text[:3000]}  # cap per-page text
            for p in document.pages
        ]
        document_facts = self._build_facts_context(base)

        # 3a. Enrich per-clause simple_meaning, why_it_matters, what_to_verify
        enriched_clauses = self._enrich_clauses(base.clauses, pages_payload)

        # 3b. Generate multilingual summary via LLM
        enriched_summary = self._enrich_summary(
            document_facts=document_facts,
            pages=pages_payload,
            deterministic_summary=base.summary,
        )

        # ------------------------------------------------------------------
        # Step 4: Assemble final DocumentAnalysis
        # severity, health_score, attention_items, extracted_fields → unchanged
        # ------------------------------------------------------------------
        return DocumentAnalysis(
            id=base.id,
            document_id=base.document_id,
            summary=enriched_summary,
            health_score=base.health_score,           # deterministic only
            parties=base.parties,                     # deterministic only
            extracted_fields=base.extracted_fields,   # deterministic only
            financial_details=base.financial_details, # deterministic only
            important_dates=base.important_dates,     # deterministic only
            attention_items=base.attention_items,      # deterministic only — severity never changed
            clauses=enriched_clauses,
            citizen_checklist=base.citizen_checklist, # deterministic only
            analyzed_at=base.analyzed_at,
        )

    # ------------------------------------------------------------------
    # Private: LLM enrichment helpers
    # ------------------------------------------------------------------

    def _enrich_clauses(self, clauses: list[Clause], pages: list[dict]) -> list[Clause]:
        """Ask the LLM to rewrite simple_meaning/why_it_matters/what_to_verify per clause."""
        enriched: list[Clause] = []
        for clause in clauses:
            try:
                for lang in ("en", "hi", "mr"):
                    prompt = build_clause_explanation_prompt(
                        clause_original_text=clause.original_text[:2000],  # cap
                        clause_number=clause.clause_number,
                        clause_title=clause.title,
                        page_number=clause.page_number,
                        severity=clause.severity,  # pre-determined — never changes
                        language=lang,
                    )
                    result = self._llm.generate_json(prompt)
                    # Validate required keys — reject if missing
                    for key in ("simple_meaning", "why_it_matters", "what_to_verify"):
                        if key not in result or not isinstance(result[key], str):
                            raise LLMOutputError(f"Missing or invalid key '{key}' in LLM clause response")

                    # Mutate copies of the dicts — severity, id, etc. are untouched
                    clause.simple_meaning[lang] = result["simple_meaning"]  # type: ignore[index]
                    clause.why_it_matters[lang] = result["why_it_matters"]  # type: ignore[index]
                    clause.what_to_verify[lang] = result["what_to_verify"]  # type: ignore[index]

            except (LLMUnavailableError, LLMOutputError) as exc:
                logger.warning("LLM clause enrichment failed for clause %s: %s", clause.id, exc)
                # Keep deterministic values — never fabricate
            enriched.append(clause)
        return enriched

    def _enrich_summary(
        self,
        *,
        document_facts: dict,
        pages: list[dict],
        deterministic_summary: dict[Language, str],
    ) -> dict[Language, str]:
        """Generate multilingual summary via LLM, falling back to deterministic on failure."""
        summary: dict[Language, str] = dict(deterministic_summary)  # start with deterministic
        for lang in ("en", "hi", "mr"):
            try:
                prompt = build_analysis_explanation_prompt(
                    document_facts=document_facts,
                    pages=pages,
                    language=lang,
                )
                text = self._llm.generate_text(prompt)
                if text and len(text.strip()) > 30:
                    summary[lang] = text.strip()  # type: ignore[literal-required]
            except (LLMUnavailableError, LLMOutputError) as exc:
                logger.warning("LLM summary enrichment failed for lang=%s: %s", lang, exc)
                # Keep deterministic value for this language
        return summary  # type: ignore[return-value]

    @staticmethod
    def _build_facts_context(analysis: DocumentAnalysis) -> dict[str, Any]:
        """Convert deterministic DocumentAnalysis to a structured dict for the LLM prompt."""
        return {
            "document_id": analysis.document_id,
            "health_score": analysis.health_score,
            "parties": [
                {"name": p.name, "role": p.role}
                for p in analysis.parties
            ],
            "financial_details": {
                "total_amount": analysis.financial_details.total_amount,
                "advance_paid": analysis.financial_details.advance_paid,
                "balance_due": analysis.financial_details.balance_due,
                "stamp_duty": analysis.financial_details.stamp_duty,
                "payment_mode": analysis.financial_details.payment_mode,
            },
            "attention_items": [
                {
                    "id": a.id,
                    "title": a.title.get("en", ""),
                    "severity": a.severity,  # pre-determined — never overridden
                    "evidence_page": a.evidence_page,
                    "evidence_clause": a.evidence_clause,
                    "confidence": a.confidence,
                }
                for a in analysis.attention_items
            ],
            "clause_titles": [
                {"clause_number": c.clause_number, "title": c.title, "severity": c.severity}
                for c in analysis.clauses
            ],
            "important_dates": [
                {"label": d.label, "date": d.date}
                for d in analysis.important_dates
            ],
        }
