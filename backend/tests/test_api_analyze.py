"""End-to-end tests for POST /api/analyze: real PDF bytes in, real HTTP
response out, through the actual FastAPI dependency-injected stack.
"""
import pytest

from app.core.dependencies import get_ocr_service
from app.services.ocr.gemini_ocr import OcrService, UnavailableOcrService
from tests.conftest import make_pdf_bytes
from tests.fixtures.documents import (
    LEASE_AGREEMENT,
    MISSING_FIELDS_DOCUMENT,
    MORTGAGE_SALE_AGREEMENT,
    SALE_AGREEMENT,
)


def upload(api_client, text: str, filename: str = "document.pdf"):
    pdf_bytes = make_pdf_bytes(text)
    return api_client.post(
        "/api/analyze",
        files={"file": (filename, pdf_bytes, "application/pdf")},
    )


@pytest.fixture
def override_ocr_service():
    """Overrides get_ocr_service for one test, restoring it afterwards.

    Without this, whether a scanned-PDF test hits the real Gemini API
    depends on whether GEMINI_API_KEY happens to be set in backend/.env —
    these tests should be deterministic and network-independent regardless.
    """
    from app.main import app

    def _apply(service: OcrService):
        app.dependency_overrides[get_ocr_service] = lambda: service

    yield _apply
    app.dependency_overrides.pop(get_ocr_service, None)


def test_health_endpoint_still_works(api_client):
    response = api_client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "LegalLingo API"}


def test_lease_agreement_returns_structured_analysis(api_client):
    response = upload(api_client, LEASE_AGREEMENT)
    assert response.status_code == 200
    body = response.json()

    assert body["documentId"]
    assert isinstance(body["healthScore"], int)
    assert any(p["role"] == "Lessor" for p in body["parties"])
    assert any(p["role"] == "Lessee" for p in body["parties"])
    assert "summary" in body and set(body["summary"].keys()) == {"en", "hi", "mr"}
    assert isinstance(body["clauses"], list) and len(body["clauses"]) > 0
    assert isinstance(body["citizenChecklist"], list) and len(body["citizenChecklist"]) > 0


def test_sale_agreement_returns_structured_analysis(api_client):
    response = upload(api_client, SALE_AGREEMENT)
    assert response.status_code == 200
    body = response.json()

    role_names = {p["role"]: p["name"] for p in body["parties"]}
    assert role_names.get("Seller / First Party") == "Suresh Patil"
    assert role_names.get("Buyer / Second Party") == "Amit Sharma"
    assert body["financialDetails"]["totalAmount"] == "Rs. 50,00,000"
    # No active mortgage in this document -> no HIGH ATTENTION items.
    assert not any(a["severity"] == "HIGH ATTENTION" for a in body["attentionItems"])


def test_mortgage_document_flags_high_attention(api_client):
    response = upload(api_client, MORTGAGE_SALE_AGREEMENT)
    assert response.status_code == 200
    body = response.json()

    high_attention = [a for a in body["attentionItems"] if a["severity"] == "HIGH ATTENTION"]
    assert high_attention
    assert any("Mortgage" in a["title"]["en"] for a in high_attention)
    # Evidence must be present: a page number and non-trivial confidence.
    for item in high_attention:
        assert item["evidencePage"] >= 1
        assert item["confidence"] > 0


def test_missing_fields_document_is_analyzed_not_rejected(api_client):
    response = upload(api_client, MISSING_FIELDS_DOCUMENT)
    assert response.status_code == 200
    body = response.json()

    assert body["parties"] == []
    assert body["financialDetails"]["totalAmount"] is None
    titles = [a["title"]["en"] for a in body["attentionItems"]]
    assert "No Parties Identified" in titles


def test_unsupported_file_type_returns_400(api_client):
    response = api_client.post(
        "/api/analyze",
        files={"file": ("notes.txt", b"just some plain text", "text/plain")},
    )
    assert response.status_code == 400


def _make_blank_pdf(tmp_path):
    from pypdf import PdfWriter

    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    blank_path = tmp_path / "blank.pdf"
    with open(blank_path, "wb") as f:
        writer.write(f)
    return blank_path


def test_scanned_image_pdf_with_no_text_returns_422(api_client, tmp_path, override_ocr_service):
    # No OCR configured (or OCR genuinely can't recover a truly blank page)
    # -> the original honest validation error still surfaces.
    override_ocr_service(UnavailableOcrService())

    blank_path = _make_blank_pdf(tmp_path)
    with open(blank_path, "rb") as f:
        response = api_client.post(
            "/api/analyze",
            files={"file": ("blank.pdf", f.read(), "application/pdf")},
        )
    assert response.status_code == 422
    assert "errors" in response.json()["detail"]


def test_ocr_fallback_recovers_scanned_document(api_client, tmp_path, override_ocr_service):
    # A scanned PDF (empty pypdf text layer) whose Gemini OCR transcription
    # comes back with real, analyzable content should succeed like any
    # other document -- the OCR text must flow through the same
    # deterministic pipeline as text-layer extraction.
    class FakeOcrService(OcrService):
        def is_available(self) -> bool:
            return True

        def extract_pages(self, content: bytes, expected_page_count: int) -> list[str]:
            return [SALE_AGREEMENT] * expected_page_count

    override_ocr_service(FakeOcrService())

    blank_path = _make_blank_pdf(tmp_path)
    with open(blank_path, "rb") as f:
        response = api_client.post(
            "/api/analyze",
            files={"file": ("scanned.pdf", f.read(), "application/pdf")},
        )
    assert response.status_code == 200
    body = response.json()
    role_names = {p["role"]: p["name"] for p in body["parties"]}
    assert role_names.get("Seller / First Party") == "Suresh Patil"


def test_ocr_output_error_falls_back_to_honest_422(api_client, tmp_path, override_ocr_service):
    from app.services.ocr.gemini_ocr import OcrOutputError

    class FailingOcrService(OcrService):
        def is_available(self) -> bool:
            return True

        def extract_pages(self, content: bytes, expected_page_count: int) -> list[str]:
            raise OcrOutputError("Gemini returned an empty or blocked response.")

    override_ocr_service(FailingOcrService())

    blank_path = _make_blank_pdf(tmp_path)
    with open(blank_path, "rb") as f:
        response = api_client.post(
            "/api/analyze",
            files={"file": ("blank.pdf", f.read(), "application/pdf")},
        )
    assert response.status_code == 422
    assert "errors" in response.json()["detail"]


def test_response_never_contains_ramesh_sample_data(api_client):
    # Phase 2A/2B must not fall back to hardcoded sample/demo content.
    response = upload(api_client, SALE_AGREEMENT)
    assert response.status_code == 200
    body_text = str(response.json())
    assert "Ramesh" not in body_text
