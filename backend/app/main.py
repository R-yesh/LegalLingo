"""LegalLingo FastAPI application entrypoint."""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import (
    AnalysisNotAvailableError,
    DocumentValidationError,
    LegalLingoError,
    UnsupportedDocumentError,
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.exception_handler(UnsupportedDocumentError)
async def unsupported_document_handler(request: Request, exc: UnsupportedDocumentError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})


@app.exception_handler(DocumentValidationError)
async def validation_error_handler(request: Request, exc: DocumentValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc), "errors": exc.errors},
    )


@app.exception_handler(AnalysisNotAvailableError)
async def analysis_not_available_handler(request: Request, exc: AnalysisNotAvailableError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_501_NOT_IMPLEMENTED, content={"detail": str(exc)})


@app.exception_handler(LegalLingoError)
async def legallingo_error_handler(request: Request, exc: LegalLingoError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})
