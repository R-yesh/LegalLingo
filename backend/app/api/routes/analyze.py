from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.core.dependencies import (
    get_analysis_service,
    get_document_processing_service,
    get_validation_service,
)
from app.core.exceptions import AnalysisNotAvailableError, UnsupportedDocumentError
from app.schemas.analysis import DocumentAnalysis
from app.services.analysis import AnalysisService
from app.services.document_processing import DocumentProcessingService
from app.services.validation import ValidationService

router = APIRouter(tags=["analysis"])


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
    analysis_service: AnalysisService = Depends(get_analysis_service),
) -> DocumentAnalysis:
    """Accept an uploaded document and return its structured analysis.

    This endpoint never fabricates a result: if the file can't be parsed,
    fails validation, or no analysis provider is configured, it returns a
    proper error response instead of a fake success payload.
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
    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Document failed validation.", "errors": validation.errors},
        )

    try:
        return analysis_service.analyze(document, validation)
    except AnalysisNotAvailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(exc),
        ) from exc
