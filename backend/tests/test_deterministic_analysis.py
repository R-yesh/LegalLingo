"""Unit tests for the deterministic analysis engine, exercising it directly
against Document objects (bypassing PDF parsing) so the fact-extraction and
rule logic is tested in isolation.
"""
from tests.conftest import make_document
from tests.fixtures.documents import (
    LEASE_AGREEMENT,
    MISSING_FIELDS_DOCUMENT,
    MORTGAGE_SALE_AGREEMENT,
    SALE_AGREEMENT,
)

from app.services.deterministic_analysis import DeterministicAnalysisService
from app.services.validation import BasicValidationService

service = DeterministicAnalysisService()
validator = BasicValidationService()


def analyze(text: str):
    document = make_document(text)
    validation = validator.validate(document)
    assert validation.is_valid, validation.errors
    return service.analyze(document, validation)


class TestLeaseAgreement:
    def test_classifies_as_rent_agreement(self):
        result = analyze(LEASE_AGREEMENT)
        doc_type_field = next(f for f in result.extracted_fields if f.label == "Document Type")
        assert doc_type_field.value == "Rent Agreement"

    def test_identifies_lessor_and_lessee(self):
        result = analyze(LEASE_AGREEMENT)
        roles = {p.role for p in result.parties}
        assert "Lessor" in roles
        assert "Lessee" in roles
        names = {p.name for p in result.parties}
        assert "Rajesh Kulkarni" in names
        assert "Priya Nair" in names

    def test_extracts_rent_amount(self):
        result = analyze(LEASE_AGREEMENT)
        assert result.financial_details.total_amount == "Rs. 18,000"

    def test_no_mortgage_flagged(self):
        result = analyze(LEASE_AGREEMENT)
        assert not any("Mortgage" in a.title["en"] for a in result.attention_items)

    def test_has_possession_and_dispute_clauses(self):
        result = analyze(LEASE_AGREEMENT)
        categories = {c.category for c in result.clauses}
        assert "possession" in categories
        assert "dispute" in categories

    def test_response_is_schema_valid_json(self):
        result = analyze(LEASE_AGREEMENT)
        payload = result.model_dump(by_alias=True)
        assert payload["documentId"] == result.document_id
        assert isinstance(payload["healthScore"], int)


class TestSaleAgreement:
    def test_classifies_as_sale_agreement(self):
        result = analyze(SALE_AGREEMENT)
        doc_type_field = next(f for f in result.extracted_fields if f.label == "Document Type")
        assert doc_type_field.value == "Sale Agreement"

    def test_identifies_seller_and_buyer(self):
        result = analyze(SALE_AGREEMENT)
        by_role = {p.role: p.name for p in result.parties}
        assert by_role.get("Seller / First Party") == "Suresh Patil"
        assert by_role.get("Buyer / Second Party") == "Amit Sharma"

    def test_extracts_property_identifier(self):
        result = analyze(SALE_AGREEMENT)
        survey_fields = [f for f in result.extracted_fields if f.label == "Survey No."]
        assert survey_fields
        assert survey_fields[0].value == "45/2"

    def test_payment_breakdown_is_consistent(self):
        result = analyze(SALE_AGREEMENT)
        assert result.financial_details.total_amount == "Rs. 50,00,000"
        assert result.financial_details.advance_paid == "Rs. 10,00,000"
        assert result.financial_details.balance_due == "Rs. 40,00,000"
        assert not any("Payment Breakdown" in a.title["en"] for a in result.attention_items)

    def test_negated_mortgage_covenant_is_not_flagged_as_risk(self):
        # "free from any mortgage" is a clean-title assurance, not an active
        # encumbrance -- it must not trigger the HIGH ATTENTION mortgage rule.
        result = analyze(SALE_AGREEMENT)
        assert not any(a.severity == "HIGH ATTENTION" for a in result.attention_items)
        encumbrance_clause = next(c for c in result.clauses if c.category == "encumbrance")
        assert encumbrance_clause.severity == "VERIFIED"

    def test_has_evidence_on_extracted_fields(self):
        result = analyze(SALE_AGREEMENT)
        for field in result.extracted_fields:
            assert field.page_number is not None
            assert field.confidence is not None

    def test_witnesses_are_not_flagged_as_name_mismatch(self):
        result = analyze(SALE_AGREEMENT)
        witness_names = {p.name for p in result.parties if p.role == "Witness"}
        assert witness_names == {"Ganesh Rao", "Lata Joshi"}
        assert not any("Name Mismatch" in a.title["en"] for a in result.attention_items)


class TestMortgageDocument:
    def test_active_mortgage_is_flagged_high_attention(self):
        result = analyze(MORTGAGE_SALE_AGREEMENT)
        mortgage_items = [a for a in result.attention_items if "Mortgage" in a.title["en"]]
        assert mortgage_items
        assert mortgage_items[0].severity == "HIGH ATTENTION"

    def test_encumbrance_clause_is_categorized(self):
        result = analyze(MORTGAGE_SALE_AGREEMENT)
        assert any(c.category == "encumbrance" for c in result.clauses)

    def test_never_uses_prohibited_legal_conclusions(self):
        result = analyze(MORTGAGE_SALE_AGREEMENT)
        prohibited = ["fraudulent", "illegal", "invalid", "void", "unlawful"]
        for item in result.attention_items:
            for lang_text in item.short_explanation.values():
                for word in prohibited:
                    assert word not in lang_text.lower()
            for lang_text in item.title.values():
                for word in prohibited:
                    assert word not in lang_text.lower()

    def test_health_score_reflects_high_attention_item(self):
        result = analyze(MORTGAGE_SALE_AGREEMENT)
        clean_result = analyze(SALE_AGREEMENT)
        assert result.health_score < clean_result.health_score

    def test_encumbrance_checklist_item_present(self):
        result = analyze(MORTGAGE_SALE_AGREEMENT)
        assert any(c.id == "chk-encumbrance" for c in result.citizen_checklist)


class TestMissingFieldsDocument:
    def test_no_parties_found(self):
        result = analyze(MISSING_FIELDS_DOCUMENT)
        assert result.parties == []

    def test_missing_information_flagged_not_fabricated(self):
        result = analyze(MISSING_FIELDS_DOCUMENT)
        titles = [a.title["en"] for a in result.attention_items]
        assert "No Parties Identified" in titles
        assert "No Amount Identified" in titles
        assert "No Dates Identified" in titles
        assert "No Property Identifier Found" in titles

    def test_financial_details_are_null_not_invented(self):
        result = analyze(MISSING_FIELDS_DOCUMENT)
        assert result.financial_details.total_amount is None
        assert result.financial_details.advance_paid is None
        assert result.financial_details.balance_due is None

    def test_health_score_is_lower_but_not_zero(self):
        result = analyze(MISSING_FIELDS_DOCUMENT)
        assert 0 < result.health_score < 100

    def test_still_returns_a_valid_analysis_not_an_error(self):
        # Sparse documents are analyzed (with gaps flagged), not rejected --
        # rejection only happens when extraction/validation fails entirely.
        result = analyze(MISSING_FIELDS_DOCUMENT)
        assert result.id
        assert result.analyzed_at
