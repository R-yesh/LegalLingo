"""POST /api/chat — citizen questions about their documents.

Security:
  - document_id is validated against the in-process DocumentStore.
    Only documents analysed in this server process are accessible.
  - The question is validated by ChatRequest (max 1000 chars, injection patterns rejected).
  - The LLM prompt treats uploaded document text as untrusted data.
  - The response is validated by ChatResponse Pydantic model.
  - GEMINI_API_KEY is never returned to the caller.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_chat_service, get_document_store
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat import ChatService
from app.services.document_store import DocumentStore

router = APIRouter(tags=["chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    responses={
        404: {"description": "Document not found in server session"},
        422: {"description": "Invalid request (question too long or contains disallowed content)"},
    },
)
def chat(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service),
    store: DocumentStore = Depends(get_document_store),
) -> ChatResponse:
    """Answer a citizen's natural-language question about a specific document.

    The answer is grounded in deterministic analysis facts. The LLM is
    forbidden from deciding fraud, legality, validity, or risk severity.
    If the AI service is not configured, a deterministic offline answer is returned.
    """
    document = store.get_document(request.document_id)
    analysis = store.get_analysis(request.document_id)

    if document is None or analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Document '{request.document_id}' was not found in this server session. "
                "Please re-upload the document before asking questions."
            ),
        )

    return chat_service.answer(
        document=document,
        analysis=analysis,
        question=request.question,
        language=request.language,
        clause_id=request.clause_id,
    )
