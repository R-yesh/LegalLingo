# LegalLingo API (backend)

FastAPI backend for LegalLingo. Sits between the frontend and document
analysis services:

```
frontend  ->  FastAPI backend  ->  document analysis service  ->  DocumentAnalysis  ->  frontend
```

## Structure

```
backend/
  app/
    main.py              FastAPI app, CORS, exception handlers
    api/
      router.py           aggregates route modules under /api
      routes/
        health.py          GET /api/health
        analyze.py          POST /api/analyze
    schemas/                Pydantic models mirroring frontend/src/types/index.ts
      document.py            Document, DocumentPage, DocumentParty
      clause.py               Clause, ExtractedField
      validation.py            ValidationResult
      analysis.py               DocumentAnalysis, AttentionItem, VerificationStep, ...
    services/                Service interfaces (ABCs) + current implementations
      document_processing.py   PDF text extraction (pypdf) — real, not mocked
      validation.py             Structural validation of extracted documents
      deterministic_analysis.py  Rule-based AnalysisService — the default (see below)
      analysis.py                AnalysisService interface + AIBackedAnalysisService (future)
      ai.py                       LLM provider interface (unconfigured, for later)
      extraction/                 Deterministic fact-extraction engine
        lexicon.py                 Keyword/regex patterns for Indian legal documents
        text_utils.py               Page-aware text joining, snippet/evidence helpers
        facts.py                    Document type, parties, amounts, dates, property, mortgage, registration
        clauses.py                   Clause segmentation + categorization
        templates.py                 Static per-category multilingual guidance text
      rules.py                    Validation rules -> AttentionItems (mismatches, missing info)
    core/
      config.py             Settings loaded from environment / .env
      dependencies.py         FastAPI dependency wiring for services
      exceptions.py            Domain exceptions -> honest HTTP error responses
  tests/
    conftest.py            Test helpers: build a Document directly, or render one to a real PDF
    fixtures/documents.py   Sample document texts (lease, sale, mortgage, sparse/missing-fields)
    test_deterministic_analysis.py  Unit tests against the analysis engine directly
    test_api_analyze.py              End-to-end tests through the real HTTP endpoint
  requirements.txt
  requirements-dev.txt    Adds pytest, httpx, reportlab (test-only)
  .env.example
```

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements-dev.txt   # or requirements.txt if you don't need to run tests
copy .env.example .env        # Windows; cp on macOS/Linux
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`, with interactive docs
at `http://localhost:8000/docs`.

## Tests

```bash
pytest
```

31 tests cover the deterministic analysis engine directly (`test_deterministic_analysis.py`)
and the full HTTP pipeline with real generated PDFs (`test_api_analyze.py`), across four
document scenarios: a residential lease, a sale agreement, a sale agreement with an active
mortgage clause, and a sparse document with missing fields.

## Endpoints

### `GET /api/health`

```bash
curl http://localhost:8000/api/health
```

```json
{ "status": "ok", "service": "LegalLingo API" }
```

### `POST /api/analyze`

Accepts a `multipart/form-data` upload with a single `file` field (PDF
only, for now) and returns a `DocumentAnalysis` on success.

```bash
curl -X POST http://localhost:8000/api/analyze -F "file=@/path/to/document.pdf"
```

**As of Phase 2B, this returns a real, deterministically-computed analysis**
(`200 OK`) — document type, parties, amounts, dates, property identifiers,
clauses, and attention items are all extracted from the document's own text
via pattern matching in `app/services/extraction/` and `app/services/rules.py`.
No LLM is called and nothing is fabricated: a fact that can't be found is
left absent (`null` in `financialDetails`, an empty list, or an explicit
"No X Identified" attention item) rather than guessed at.

Error responses, by design:

- `400 Bad Request` — the file isn't a PDF, or can't be parsed at all.
- `422 Unprocessable Entity` — the PDF parsed, but has no usable text (e.g.
  a scanned image with no text layer), with the specific validation errors.
- `501 Not Implemented` — only reachable if `AnalysisService.analyze()` is
  ever called on an already-invalid document directly (not through this
  endpoint, which validates first); kept as a safety net, not a normal path.
- `413 Payload Too Large` — file exceeds `MAX_UPLOAD_SIZE_MB`.

### Limitations of the deterministic engine

- Regex/keyword-based extraction on Indian legal-document phrasing
  conventions; documents that phrase things very differently, or PDFs
  scanned as images with no text layer, will yield sparser results (flagged
  via "missing information" attention items, not silently wrong ones).
- Clause segmentation relies on numbered-heading conventions (`1.`, `1.1`);
  documents without numbering fall back to paragraph-based chunking with
  lower confidence.
- `Clause.simpleMeaning` / `whyItMatters` / `whatToVerify` are static
  per-category guidance text (see `app/services/extraction/templates.py`),
  not a generated interpretation of the specific clause — the actual clause
  text is preserved verbatim in `originalText`.
- Hindi/Marathi text for validation findings (`AttentionItem`) is templated
  per rule type; document-specific details (names, amounts, page numbers)
  are included in the English text but not auto-translated into hi/mr.
- Name and amount extraction are heuristic; they're deliberately
  conservative (skip rather than guess) but can still miss or misread
  unusual formatting.

## Connecting the frontend

The frontend (`frontend/`, currently a Vite + React app) does not call this
API yet. To wire it up:

1. Add a base URL (e.g. `VITE_API_BASE_URL=http://localhost:8000`) to the
   frontend's environment.
2. Replace the client-side placeholder logic in
   `frontend/src/services/documentService.ts` (`uploadDocument`) with a
   `fetch`/`FormData` call to `POST {VITE_API_BASE_URL}/api/analyze`,
   returning the `DocumentAnalysis` JSON directly — its shape matches
   `frontend/src/types/index.ts::DocumentAnalysis` field-for-field (the
   backend serializes camelCase to match), plus a few additive fields
   (e.g. `ExtractedField.evidenceSnippet`) the current frontend types don't
   declare but will simply ignore.
3. Surface `attentionItems` and `citizenChecklist` as returned — they now
   reflect real findings for the uploaded document, not fixed sample data.
