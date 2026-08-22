"""Deterministic (non-LLM) implementation of AnalysisService.

Produces a real DocumentAnalysis from the document's own extracted text
using pattern matching and rule-based checks -- see app/services/extraction/
and app/services/rules.py. No network calls, no model inference, and no
invented facts: every value either comes from the document text or is left
absent.
"""
import uuid
from datetime import datetime, timezone

from app.schemas.analysis import DocumentAnalysis, VerificationStep
from app.schemas.clause import ExtractedField
from app.schemas.document import Document
from app.schemas.validation import ValidationResult
from app.services.analysis import AnalysisService
from app.services.extraction import facts
from app.services.extraction.clauses import build_clauses
from app.services.extraction.text_utils import join_pages
from app.services import rules

DOC_TYPE_LABEL_HI = {
    "Sale Agreement": "बिक्री करार", "Sale Deed": "विक्रय पत्र", "Rent Agreement": "किराया करार",
    "Gift Deed": "उपहार विलेख", "NOC": "अनापत्ति प्रमाण पत्र", "PAN Card": "पैन कार्ड",
    "Title Deed": "स्वामित्व विलेख", "Encumbrance Certificate": "भार प्रमाण पत्र", "Other": "दस्तावेज़",
}
DOC_TYPE_LABEL_MR = {
    "Sale Agreement": "विक्री करार", "Sale Deed": "विक्रीपत्र", "Rent Agreement": "भाडे करार",
    "Gift Deed": "बक्षीसपत्र", "NOC": "ना-हरकत प्रमाणपत्र", "PAN Card": "पॅन कार्ड",
    "Title Deed": "मालकी हक्क पत्र", "Encumbrance Certificate": "बोजा दाखला", "Other": "दस्तऐवज",
}


class DeterministicAnalysisService(AnalysisService):
    """Rule-based analysis. Does not depend on AIService."""

    def analyze(self, document: Document, validation: ValidationResult) -> DocumentAnalysis:
        # Validity is enforced by the caller (see api/routes/analyze.py), but
        # this service refuses to run on invalid input if called directly.
        if not validation.is_valid:
            from app.core.exceptions import AnalysisNotAvailableError

            raise AnalysisNotAvailableError(
                "Document failed validation and cannot be analyzed: " + "; ".join(validation.errors)
            )

        joined = join_pages(document.pages)

        doc_type, doc_type_confidence = facts.classify_document_type(joined)
        parties, party_fields = facts.extract_parties(joined)
        financial_details, financial_fields, numeric_values = facts.extract_financials(joined)
        important_dates, labeled_dates = facts.extract_dates(joined)
        property_fields = facts.extract_property_info(joined)
        mortgage_mentions = facts.extract_mortgage_mentions(joined)
        registration_fields = facts.extract_registration_info(joined)
        clauses = build_clauses(document.pages)

        doc_type_field = ExtractedField(
            id=f"f-{uuid.uuid4().hex[:10]}",
            label="Document Type",
            value=doc_type,
            category="legal",
            confidence=round(doc_type_confidence, 2),
            page_number=1,
            verified=False,
        )

        extracted_fields = (
            [doc_type_field] + party_fields + financial_fields + property_fields + registration_fields
        )

        attention_items = rules.evaluate_all(
            parties=parties,
            party_fields=party_fields,
            financial_fields=financial_fields,
            numeric_values=numeric_values,
            important_dates=important_dates,
            labeled_dates=labeled_dates,
            property_fields=property_fields,
            mortgage_mentions=mortgage_mentions,
            clauses=clauses,
        )

        health_score = self._compute_health_score(attention_items)
        summary = self._build_summary(
            doc_type=doc_type,
            parties=parties,
            clauses=clauses,
            attention_items=attention_items,
            financial_details=financial_details,
        )
        checklist = self._build_checklist(mortgage_mentions, property_fields, registration_fields)

        return DocumentAnalysis(
            id=f"analysis-{uuid.uuid4().hex[:12]}",
            document_id=document.id,
            summary=summary,
            health_score=health_score,
            parties=parties,
            extracted_fields=extracted_fields,
            financial_details=financial_details,
            important_dates=important_dates,
            attention_items=attention_items,
            clauses=clauses,
            citizen_checklist=checklist,
            analyzed_at=datetime.now(timezone.utc).isoformat(),
        )

    @staticmethod
    def _compute_health_score(attention_items) -> int:
        high = sum(1 for a in attention_items if a.severity == "HIGH ATTENTION")
        review = sum(1 for a in attention_items if a.severity == "REVIEW")
        score = 100 - (20 * high) - (8 * review)
        return max(5, min(100, score))

    @staticmethod
    def _build_summary(*, doc_type, parties, clauses, attention_items, financial_details) -> dict[str, str]:
        party_count = len(parties)
        clause_count = len(clauses)
        high_count = sum(1 for a in attention_items if a.severity == "HIGH ATTENTION")
        review_count = sum(1 for a in attention_items if a.severity == "REVIEW")
        amount = financial_details.total_amount or "not stated in the document"

        en = (
            f"This document was automatically classified as a {doc_type}. "
            f"{party_count} named part{'y' if party_count == 1 else 'ies'} were identified "
            f"across {clause_count} reviewed clause{'s' if clause_count != 1 else ''}. "
            f"Total amount referenced: {amount}. "
        )
        if high_count or review_count:
            en += (
                f"{high_count} item(s) need high attention and {review_count} item(s) need review "
                f"before you rely on this document."
            )
        else:
            en += "No automated checks were flagged, but you should still read the full document yourself."

        doc_type_hi = DOC_TYPE_LABEL_HI.get(doc_type, doc_type)
        doc_type_mr = DOC_TYPE_LABEL_MR.get(doc_type, doc_type)
        hi = (
            f"इस दस्तावेज़ को स्वचालित रूप से {doc_type_hi} के रूप में वर्गीकृत किया गया है। "
            f"{clause_count} खंडों में {party_count} पक्षकार पहचाने गए। "
            f"कुल राशि: {amount}। "
            f"{high_count} विषय उच्च ध्यान और {review_count} विषय समीक्षा हेतु चिह्नित हैं।"
        )
        mr = (
            f"हा दस्तऐवज स्वयंचलितपणे {doc_type_mr} म्हणून वर्गीकृत करण्यात आला आहे. "
            f"{clause_count} कलमांमध्ये {party_count} पक्षकार ओळखले गेले. "
            f"एकूण रक्कम: {amount}. "
            f"{high_count} बाबी उच्च लक्ष व {review_count} बाबी पुनरावलोकनासाठी चिन्हांकित आहेत."
        )
        return {"en": en, "hi": hi, "mr": mr}

    @staticmethod
    def _build_checklist(mortgage_mentions, property_fields, registration_fields) -> list[VerificationStep]:
        checklist: list[VerificationStep] = []

        checklist.append(
            VerificationStep(
                id="chk-read-original",
                title="Read the Full Original Document",
                description="This automated summary is a starting point, not a substitute for reading the complete document yourself.",
                status="pending",
            )
        )

        if any(m["is_active_mention"] for m in mortgage_mentions):
            checklist.append(
                VerificationStep(
                    id="chk-encumbrance",
                    title="Verify Encumbrance Certificate (Index-II)",
                    description="Check the official Sub-Registrar / IGR portal to confirm the current encumbrance status.",
                    status="pending",
                    required_document="Encumbrance Certificate",
                )
            )

        if property_fields:
            checklist.append(
                VerificationStep(
                    id="chk-property-id",
                    title="Confirm Property Identifiers",
                    description="Match the survey/plot number and location found in this document against the property card or 7/12 extract.",
                    status="pending",
                )
            )

        if not registration_fields:
            checklist.append(
                VerificationStep(
                    id="chk-registration",
                    title="Confirm Registration Status",
                    description="No registration number was found automatically. Confirm this document's registration status with the Sub-Registrar office.",
                    status="pending",
                )
            )

        return checklist
