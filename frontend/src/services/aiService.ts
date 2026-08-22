import { AIMessage, Language, Clause } from '../types';
import { API_BASE_URL } from './api';

export interface AISendMessageOptions {
  documentId?: string;
  clauseId?: string;
  activeClause?: Clause | null;
  language: Language;
  history: AIMessage[];
}

interface ChatResponsePayload {
  answer: string;
  evidence: string;
  pageNumber: number | null;
  clauseNumber: string | null;
  language: Language;
  llmUsed: boolean;
}

const _NO_DOCUMENT_MESSAGE: Record<Language, string> = {
  en: 'Please upload or open a document first — I can only answer questions grounded in a specific document.',
  hi: 'कृपया पहले कोई दस्तावेज़ अपलोड या खोलें — मैं केवल किसी विशिष्ट दस्तावेज़ पर आधारित प्रश्नों के उत्तर दे सकता हूँ।',
  mr: 'कृपया आधी एखादे दस्तऐवज अपलोड करा किंवा उघडा — मी फक्त विशिष्ट दस्तऐवजावर आधारित प्रश्नांची उत्तरे देऊ शकतो.',
};

const _NETWORK_ERROR_MESSAGE: Record<Language, string> = {
  en: 'Could not reach the LegalLingo server right now. Please try again in a moment.',
  hi: 'अभी LegalLingo सर्वर से संपर्क नहीं हो सका। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
  mr: 'सध्या LegalLingo सर्व्हरशी संपर्क होऊ शकला नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.',
};

function buildAssistantMessage(
  content: string,
  language: Language,
  activeClause?: Clause | null,
  suggestedFollowUps?: string[]
): AIMessage {
  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    language,
    clauseReference: activeClause ? {
      clauseId: activeClause.id,
      clauseNumber: activeClause.clauseNumber,
      title: activeClause.title,
    } : undefined,
    suggestedFollowUps,
  };
}

/**
 * Sends a citizen question to the real backend (POST /api/chat), grounded in
 * the previously-analyzed document held in the server's DocumentStore.
 *
 * Falls back to a clear, honest local message (never a fabricated answer)
 * when there's no document context yet or the request fails.
 */
export async function sendAIMessage(
  query: string,
  options: AISendMessageOptions
): Promise<AIMessage> {
  const { documentId, clauseId, activeClause, language } = options;

  if (!documentId) {
    return buildAssistantMessage(_NO_DOCUMENT_MESSAGE[language] || _NO_DOCUMENT_MESSAGE.en, language);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        question: query,
        language,
        clauseId: clauseId ?? null,
      }),
    });
  } catch (netError) {
    console.warn('[LegalLingo] /api/chat unreachable:', netError);
    return buildAssistantMessage(_NETWORK_ERROR_MESSAGE[language] || _NETWORK_ERROR_MESSAGE.en, language, activeClause);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Chat request failed' }));
    const detail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
    console.warn('[LegalLingo] /api/chat error:', response.status, detail);

    if (response.status === 404) {
      // Document not found in this server session (e.g. server restarted since upload)
      const notFoundMsg: Record<Language, string> = {
        en: 'This document is no longer available on the server (it may have restarted). Please re-upload it to keep asking questions.',
        hi: 'यह दस्तावेज़ अब सर्वर पर उपलब्ध नहीं है (सर्वर पुनरारंभ हुआ हो सकता है)। प्रश्न पूछना जारी रखने के लिए कृपया इसे फिर से अपलोड करें।',
        mr: 'हे दस्तऐवज आता सर्व्हरवर उपलब्ध नाही (सर्व्हर रीस्टार्ट झाला असावा). प्रश्न विचारणे सुरू ठेवण्यासाठी कृपया ते पुन्हा अपलोड करा.',
      };
      return buildAssistantMessage(notFoundMsg[language] || notFoundMsg.en, language, activeClause);
    }

    return buildAssistantMessage(_NETWORK_ERROR_MESSAGE[language] || _NETWORK_ERROR_MESSAGE.en, language, activeClause);
  }

  const raw: ChatResponsePayload = await response.json();

  let content = raw.answer;
  if (raw.evidence) {
    content += `\n\n"${raw.evidence}"`;
    if (raw.pageNumber) content += ` (p. ${raw.pageNumber})`;
  }

  return buildAssistantMessage(content, raw.language || language, activeClause);
}
