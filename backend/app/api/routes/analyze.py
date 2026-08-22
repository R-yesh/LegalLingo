import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.core.dependencies import (
    get_analysis_service,
    get_document_processing_service,
    get_document_store,
    get_ocr_service,
    get_validation_service,
)
from app.core.exceptions import AnalysisNotAvailableError, UnsupportedDocumentError
from app.schemas.analysis import DocumentAnalysis
from app.schemas.document import Document, DocumentPage
from app.services.analysis import AnalysisService
from app.services.document_processing import DocumentProcessingService
from app.services.document_store import DocumentStore
from app.services.ocr.gemini_ocr import OcrOutputError, OcrService, OcrUnavailableError
from app.services.validation import ValidationService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analysis"])

# A page is treated as "no usable text layer" below this many characters —
# well under BasicValidationService.MIN_EXTRACTED_CHARS, so a page with a
# stray watermark or page number still gets OCR'd rather than being
# (wrongly) treated as already extracted.
_OCR_CANDIDATE_PAGE_CHAR_THRESHOLD = 5


def _merge_ocr_text(document: Document, ocr_page_texts: list[str]) -> Document:
    """Fills in OCR transcriptions only for pages pypdf couldn't extract text from.

    Pages that already have a real text layer are left untouched — OCR is
    additive, never a replacement for genuinely extracted content.
    """
    merged_pages: list[DocumentPage] = []
    for page, ocr_text in zip(document.pages, ocr_page_texts):
        if page.char_count < _OCR_CANDIDATE_PAGE_CHAR_THRESHOLD and ocr_text.strip():
            text = ocr_text.strip()
            merged_pages.append(
                DocumentPage(page_number=page.page_number, text=text, char_count=len(text))
            )
        else:
            merged_pages.append(page)
    return document.model_copy(update={"pages": merged_pages})


@router.post(
    "/analyze",
    response_model=DocumentAnalysis,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"description": "Uploaded file could not be processed"},
        422: {"description": "Document failed validation"},
        501: {"description": "Analysis is not available yet"},
    },
)
async def analyze_document(
    file: UploadFile,
    settings: Settings = Depends(get_settings),
    document_processing: DocumentProcessingService = Depends(get_document_processing_service),
    validation_service: ValidationService = Depends(get_validation_service),
    ocr_service: OcrService = Depends(get_ocr_service),
    analysis_service: AnalysisService = Depends(get_analysis_service),
    store: DocumentStore = Depends(get_document_store),
) -> DocumentAnalysis:
    """Accept an uploaded document and return its structured analysis.

    This endpoint never fabricates a result: if the file can't be parsed,
    fails validation, or no analysis provider is configured, it returns a
    proper error response instead of a fake success payload.

    Scanned PDFs (a readable PDF with no embedded text layer) fail initial
    validation with an empty/near-empty extraction. When a Gemini API key is
    configured, this is retried once through Gemini OCR before giving up —
    the transcribed text is spliced into the same Document.pages structure
    real text-layer extraction would have produced, so it flows through the
    exact same deterministic extraction/rules pipeline. If OCR is
    unavailable or also fails, the original honest validation error is
    returned; nothing is ever fabricated.

    On success, saves the (Document, DocumentAnalysis) pair in the in-process
    DocumentStore so that POST /api/chat can access document context by ID.
    """
    content = await file.read()

    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_upload_size_mb}MB upload limit.",
        )

    try:
        document = document_processing.process(
            filename=file.filename or "document.pdf",
            content=content,
            content_type=file.content_type or "",
        )
    except UnsupportedDocumentError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    validation = validation_service.validate(document)

    if not validation.is_valid and document.page_count > 0 and ocr_service.is_available():
        try:
            ocr_page_texts = ocr_service.extract_pages(content, expected_page_count=document.page_count)
            document = _merge_ocr_text(document, ocr_page_texts)
            validation = validation_service.validate(document)
            if validation.is_valid:
                logger.info(
                    "OCR fallback recovered text for '%s' (%d pages).",
                    document.filename,
                    document.page_count,
                )
        except (OcrUnavailableError, OcrOutputError) as exc:
            logger.warning("OCR fallback failed for '%s': %s", document.filename, exc)
            # Fall through with the original (failed) validation result —
            # the caller still gets an honest 422, never a fabricated result.

    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Document failed validation.", "errors": validation.errors},
        )

    try:
        analysis = analysis_service.analyze(document, validation)
    except AnalysisNotAvailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(exc),
        ) from exc

    # Save to document store so /api/chat can look up this document by ID
    store.save(document, analysis)

    return analysis
