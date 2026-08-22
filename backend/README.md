# LegalLingo API (backend)

FastAPI backend for LegalLingo. Sits between the frontend and document
analysis services:

```
frontend  ->  FastAPI backend  ->  document analysis services  ->  DocumentAnalysis  ->  frontend
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
      analysis.py                Orchestrates AI -> DocumentAnalysis (not yet available)
      ai.py                       LLM provider interface (unconfigured today)
    core/
      config.py             Settings loaded from environment / .env
      dependencies.py         FastAPI dependency wiring for services
      exceptions.py            Domain exceptions -> honest HTTP error responses
  requirements.txt
  .env.example
```

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
copy .env.example .env        # Windows; cp on macOS/Linux
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`, with interactive docs
at `http://localhost:8000/docs`.

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

Current behavior, by design:

- A valid PDF is parsed for real (page count, per-page text via `pypdf`).
- If the document fails structural validation (e.g. no extractable text —
  such as a scanned image with no text layer), the endpoint returns
  `422 Unprocessable Entity` with the specific validation errors.
- If validation passes, the endpoint still returns `501 Not Implemented`,
  because no AI/analysis provider is wired up yet
  (`app/services/ai.py::UnconfiguredAIService`). **This is intentional** —
  the backend never returns a fabricated `DocumentAnalysis`. Wiring up a
  real provider only requires implementing `AIService` and swapping it in
  `app/core/dependencies.py::get_ai_service`.

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
   backend serializes camelCase to match).
3. Until a real `AIService` is implemented, that call will resolve to a
   `501` — surface that as "analysis unavailable" in the UI rather than
   falling back to sample data.
