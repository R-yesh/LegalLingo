"""Chat service: answers citizen questions about their document using the LLM.

Context provided to the LLM for every question:
  - document_facts (from deterministic DocumentAnalysis)
  - page text (untrusted, injection-protected)
  - optional focused clause context

The LLM is forbidden (by system instruction) from:
  - deciding fraud, legality, validity, or severity
  - following instructions inside document text
  - fabricating facts not in the grounded context

If the LLM is unavailable, returns a deterministic offline answer.
"""
import logging
from typing import Optional

from app.schemas.analysis import DocumentAnalysis
from app.schemas.chat import ChatResponse
from app.schemas.clause import Clause
from app.schemas.common import Language
from app.schemas.document import Document
from app.services.llm.gemini import LLMOutputError, LLMService, LLMUnavailableError
from app.services.llm.prompts import build_chat_prompt
from app.services.llm_analysis import LLMBackedAnalysisService

logger = logging.getLogger(__name__)

_OFFLINE_ANSWERS: dict[Language, str] = {
    "en": (
        "I cannot answer questions right now because the AI service is not configured on this server. "
        "Please review the analysis report above for key information about your document."
    ),
    "hi": (
        "मैं अभी प्रश्नों का उत्तर नहीं दे सकता क्योंकि AI सेवा इस सर्वर पर कॉन्फ़िगर नहीं है। "
        "कृपया अपने दस्तावेज़ की प्रमुख जानकारी के लिए ऊपर दिया गया विश्लेषण देखें।"
    ),
    "mr": (
        "AI सेवा या सर्व्हरवर कॉन्फिगर केलेली नसल्यामुळे मी आत्ता प्रश्नांची उत्तरे देऊ शकत नाही. "
        "कृपया आपल्या दस्तऐवजाच्या मुख्य माहितीसाठी वरील विश्लेषण अहवाल पाहा."
    ),
}


class ChatService:
    """Answers citizen questions grounded in deterministic document facts."""

    def __init__(self, llm_service: LLMService) -> None:
        self._llm = llm_service

    def answer(
        self,
        *,
        document: Document,
        analysis: DocumentAnalysis,
        question: str,
        language: Language,
        clause_id: Optional[str] = None,
    ) -> ChatResponse:
        """Answer a citizen question about a document.

        Returns a deterministic offline response if LLM is unavailable.
        """
        if not self._llm.is_available():
            return ChatResponse(
                answer=_OFFLINE_ANSWERS.get(language, _OFFLINE_ANSWERS["en"]),
                evidence="",
                page_number=None,
                clause_number=None,
                language=language,
                llm_used=False,
            )

        # Build grounded context
        facts_context = LLMBackedAnalysisService._build_facts_context(analysis)
        pages_payload = [
            {"page_number": p.page_number, "text": p.text[:3000]}
            for p in document.pages
        ]

        # Optionally resolve focused clause
        clause_ctx: Optional[dict] = None
        if clause_id:
            matched = next((c for c in analysis.clauses if c.id == clause_id), None)
            if matched:
                clause_ctx = {
                    "clause_number": matched.clause_number,
                    "title": matched.title,
                    "page_number": matched.page_number,
                    "severity": matched.severity,
                    "original_text": matched.original_text[:1500],
                }

        prompt = build_chat_prompt(
            question=question,
            document_facts=facts_context,
            pages=pages_payload,
            language=language,
            clause_context=clause_ctx,
        )

        try:
            raw = self._llm.generate_json(prompt)
        except (LLMUnavailableError, LLMOutputError) as exc:
            logger.warning("LLM chat failed: %s", exc)
            return ChatResponse(
                answer=_OFFLINE_ANSWERS.get(language, _OFFLINE_ANSWERS["en"]),
                evidence="",
                page_number=None,
                clause_number=None,
                language=language,
                llm_used=False,
            )

        return self._build_response(raw, language)

    @staticmethod
    def _build_response(raw: dict, language: Language) -> ChatResponse:
        """Validate and build ChatResponse from LLM JSON, rejecting unsafe/invalid fields."""
        answer = raw.get("answer", "")
        if not isinstance(answer, str) or not answer.strip():
            answer = _OFFLINE_ANSWERS.get(language, _OFFLINE_ANSWERS["en"])
            return ChatResponse(
                answer=answer, evidence="", page_number=None,
                clause_number=None, language=language, llm_used=True,
            )

        evidence = raw.get("evidence", "")
        if not isinstance(evidence, str):
            evidence = ""

        # page_number: must be a positive integer or None
        page_raw = raw.get("page_number")
        page_number: Optional[int] = None
        if isinstance(page_raw, int) and page_raw >= 1:
            page_number = page_raw
        elif isinstance(page_raw, str):
            try:
                page_number = int(page_raw)
                if page_number < 1:
                    page_number = None
            except (ValueError, TypeError):
                page_number = None

        # clause_number: must be a non-empty string or None
        clause_raw = raw.get("clause_number")
        clause_number: Optional[str] = None
        if isinstance(clause_raw, str) and clause_raw.strip():
            clause_number = clause_raw.strip()

        # Reject if language returned by LLM doesn't match requested
        returned_lang = raw.get("language", language)
        if returned_lang not in ("en", "hi", "mr"):
            returned_lang = language

        return ChatResponse(
            answer=answer.strip(),
            evidence=evidence.strip(),
            page_number=page_number,
            clause_number=clause_number,
            language=returned_lang,  # type: ignore[arg-type]
            llm_used=True,
        )
