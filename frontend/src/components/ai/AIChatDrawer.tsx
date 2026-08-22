import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useDocument } from '../../context/DocumentContext';
import { sendAIMessage } from '../../services/aiService';
import { startSpeechToText, speakText, isSpeechRecognitionSupported } from '../../services/voiceService';
import { AIMessage } from '../../types';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  RefreshCw, 
  FileText
} from 'lucide-react';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';

export const AIChatDrawer: React.FC = () => {
  const { language, t } = useLanguage();
  const { 
    currentDocumentId, 
    currentDocument, 
    currentClause, 
    aiMessages, 
    addAIMessage, 
    clearAIMessages,
    isAIChatOpen, 
    setIsAIChatOpen 
  } = useDocument();

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechController, setActiveSpeechController] = useState<{ stop: () => void } | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAIChatOpen) {
      scrollToBottom();
    }
  }, [aiMessages, isAIChatOpen]);

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

  if (!isAIChatOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-surface shadow-2xl border-l border-slate-200 flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-charcoal flex items-center gap-1.5">
              {t.aiAssistantTitle}
              <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                Context-Aware
              </span>
            </h3>
            <p className="text-xs text-steel">
              {currentDocument ? currentDocument.filename : 'Global Assistant'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {aiMessages.length > 0 && (
            <button
              onClick={clearAIMessages}
              title="Clear chat"
              className="p-1.5 text-steel hover:text-charcoal hover:bg-slate-200/60 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsAIChatOpen(false)}
            className="p-1.5 text-steel hover:text-charcoal hover:bg-slate-200/60 rounded-lg"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Clause Scope Banner */}
      {currentClause && (
        <div className="bg-brand-50 border-b border-brand-200/60 p-3 px-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-brand-900 font-medium truncate">
            <FileText className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
            <span className="truncate">
              Focusing on <strong>Clause {currentClause.clauseNumber}: {currentClause.title}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {aiMessages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-charcoal text-sm mb-1">{t.suggestedQuestions}</h4>
            <p className="text-xs text-steel mb-4 max-w-xs">{t.aiSubtitle}</p>
            
            {/* Quick Prompts */}
            <div className="w-full space-y-2">
              {[t.quickPrompt1, t.quickPrompt2, t.quickPrompt3, t.quickPrompt4].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-brand-50/50 hover:border-brand-300 text-xs font-medium text-charcoal transition-all"
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
                  "flex flex-col max-w-[85%] space-y-1",
                  isUser ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {msg.clauseReference && (
                  <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    Clause {msg.clauseReference.clauseNumber}
                  </span>
                )}
                
                <div
                  className={cn(
                    "p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-whisper",
                    isUser
                      ? "bg-brand-600 text-white rounded-br-none"
                      : "bg-slate-100/90 text-charcoal border border-slate-200/60 rounded-bl-none"
                  )}
                >
                  {msg.content}
                </div>

                <div className="flex items-center gap-2 px-1 text-[10px] text-steel">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleTextToSpeech(msg)}
                      className="hover:text-brand-600 transition-colors"
                      title="Read aloud"
                    >
                      {speakingMessageId === msg.id ? (
                        <VolumeX className="w-3 h-3 text-rose-500" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                {/* AI Follow-up Suggestions */}
                {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {msg.suggestedFollowUps.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(f)}
                        className="text-[11px] bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 px-2.5 py-1 rounded-full font-medium transition-all"
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
          <div className="flex items-center gap-2 text-xs text-steel italic p-3 bg-slate-50 rounded-xl max-w-[70%]">
            <span className="w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span>{t.aiThinking}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-slate-200/80 bg-white">
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
                "p-2.5 rounded-xl border transition-all",
                isListening
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                  : "bg-slate-100 text-steel hover:text-charcoal border-slate-200"
              )}
              title="Voice input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={t.aiPlaceholder}
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />

          <Button
            type="submit"
            size="sm"
            disabled={!inputQuery.trim() || isLoading}
            className="rounded-xl px-3.5 py-2.5"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

    </div>
  );
};
