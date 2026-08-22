import io
import uuid
from datetime import datetime, timezone

import pytest
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.schemas.document import Document, DocumentPage


def make_document(text: str, filename: str = "test.pdf") -> Document:
    """Build a Document directly from raw text, bypassing PDF parsing.

    Used for unit-testing the analysis engine in isolation from pypdf.
    """
    return Document(
        id=f"doc-{uuid.uuid4().hex[:8]}",
        filename=filename,
        file_size=len(text.encode("utf-8")),
        file_type="application/pdf",
        document_type="Other",
        uploaded_at=datetime.now(timezone.utc).isoformat(),
        status="processing",
        page_count=1,
        pages=[DocumentPage(page_number=1, text=text, char_count=len(text))],
    )


def make_pdf_bytes(text: str) -> bytes:
    """Render `text` into a real single-page PDF for end-to-end API tests.

    Preserves line breaks by drawing one line of text per line of input,
    the way pypdf's extract_text can recover them.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    text_obj = c.beginText(40, height - 40)
    text_obj.setFont("Helvetica", 11)
    for line in text.splitlines():
        text_obj.textLine(line)
    c.drawText(text_obj)
    c.showPage()
    c.save()
    return buffer.getvalue()


@pytest.fixture
def api_client():
    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app)
