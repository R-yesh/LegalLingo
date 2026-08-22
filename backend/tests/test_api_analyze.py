"""End-to-end tests for POST /api/analyze: real PDF bytes in, real HTTP
response out, through the actual FastAPI dependency-injected stack.
"""
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


def test_scanned_image_pdf_with_no_text_returns_422(api_client, tmp_path):
    from pypdf import PdfWriter

    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    blank_path = tmp_path / "blank.pdf"
    with open(blank_path, "wb") as f:
        writer.write(f)

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
