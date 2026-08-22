"""LLM service package.

Exports the abstract interface (LLMService) and the Gemini implementation
(GeminiLLMService). The rest of the backend only imports from this package,
never from google.generativeai directly.
"""
from app.services.llm.gemini import GeminiLLMService, LLMService, LLMUnavailableError

__all__ = ["GeminiLLMService", "LLMService", "LLMUnavailableError"]
