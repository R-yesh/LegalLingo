import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useDocument } from '../context/DocumentContext';
import { sendAIMessage } from '../services/aiService';
import { startSpeechToText, speakText, isSpeechRecognitionSupported } from '../services/voiceService';
import { AIMessage } from '../types';
import { Button } from '../components/common/Button';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

export const AIPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { 
    currentDocumentId, 
    currentDocument, 
    currentClause, 
    aiMessages, 
    addAIMessage, 
    clearAIMessages 
  } = useDocument();

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechController, setActiveSpeechController] = useState<{ stop: () => void } | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleSend = async (queryText?: string) => {
    const text = queryText || inputQuery.trim();
    if (!text || isLoading) return;

    const userMessage: AIMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: language,
      clauseReference: currentClause ? {
        clauseId: currentClause.id,
        clauseNumber: currentClause.clauseNumber,
        title: currentClause.title,
      } : undefined,
    };

    addAIMessage(userMessage);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await sendAIMessage(text, {
        documentId: currentDocumentId || undefined,
        clauseId: currentClause?.id,
        activeClause: currentClause,
        language: language,
        history: aiMessages,
      });
      addAIMessage(response);
    } catch (e) {
      addAIMessage({
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        content: 'Failed to process inquiry. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: language,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      activeSpeechController?.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const controller = startSpeechToText(
      language,
      (transcript) => {
        setInputQuery(transcript);
        setIsListening(false);
      },
      (error) => {
        console.error(error);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
    setActiveSpeechController(controller);
  };

  const handleTextToSpeech = (msg: AIMessage) => {
    if (speakingMessageId === msg.id) {
      activeSpeechController?.stop();
      setSpeakingMessageId(null);
      return;
    }

    setSpeakingMessageId(msg.id);
    const controller = speakText(msg.content, language, () => {
      setSpeakingMessageId(null);
    });
    setActiveSpeechController(controller);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-slate-200/80 shadow-whisper">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal font-display">
              {t.aiAssistantTitle}
            </h1>
            <p className="text-xs text-steel">
              {currentDocument ? `Context: ${currentDocument.filename}` : 'General Legal Contract Assistant'}
            </p>
          </div>
        </div>

        {aiMessages.length > 0 && (
          <Button
            onClick={clearAIMessages}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Clear Conversation
          </Button>
        )}
      </div>

      {/* Chat Container */}
      <div className="bg-surface rounded-3xl border border-slate-200/80 shadow-whisper flex flex-col h-[600px] overflow-hidden">
        
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {aiMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal text-base">{t.suggestedQuestions}</h3>
                <p className="text-xs text-steel max-w-sm mt-1">{t.aiSubtitle}</p>
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-2">
                {[t.quickPrompt1, t.quickPrompt2, t.quickPrompt3, t.quickPrompt4].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-brand-50/50 hover:border-brand-300 text-xs font-medium text-charcoal transition-all text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            aiMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%] space-y-1.5",
                    isUser ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  {msg.clauseReference && (
                    <span className="text-[11px] text-brand-700 font-semibold bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                      Clause {msg.clauseReference.clauseNumber}: {msg.clauseReference.title}
                    </span>
                  )}

                  <div
                    className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed shadow-whisper",
                      isUser
                        ? "bg-brand-600 text-white rounded-br-none"
                        : "bg-slate-50 text-charcoal border border-slate-200/80 rounded-bl-none"
                    )}
                  >
                    {msg.content}
                  </div>

                  <div className="flex items-center gap-2 px-1 text-[11px] text-steel">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleTextToSpeech(msg)}
                        className="hover:text-brand-600 transition-colors"
                        title="Read aloud"
                      >
                        {speakingMessageId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {msg.suggestedFollowUps.map((f, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(f)}
                          className="text-xs bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-full font-medium transition-all"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-steel italic p-3 bg-slate-50 rounded-xl max-w-xs">
              <span className="w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              <span>{t.aiThinking}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200/80 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {isSpeechRecognitionSupported() && (
              <button
                type="button"
                onClick={handleVoiceInput}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  isListening
                    ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                    : "bg-slate-100 text-steel hover:text-charcoal border-slate-200"
                )}
                title="Voice input"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={t.aiPlaceholder}
              className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />

            <Button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              size="md"
              className="rounded-xl px-5"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Send</span>
            </Button>
          </form>
        </div>

      </div>

    </div>
  );
};
