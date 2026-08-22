import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useDocument } from '../context/DocumentContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { getSeverityStyles } from '../lib/utils';
import { 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  ShieldAlert, 
  BookOpen, 
  FileSearch,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';

export const ClauseDetailPage: React.FC = () => {
  const { documentId, clauseId } = useParams<{ documentId: string; clauseId: string }>();
  const { language, t } = useLanguage();
  const { 
    currentDocument, 
    documentAnalysis, 
    loadDocument, 
    selectClause, 
    currentClause,
    isLoading,
    setIsAIChatOpen 
  } = useDocument();
  const navigate = useNavigate();

  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId, loadDocument]);

  useEffect(() => {
    if (clauseId) {
      selectClause(clauseId);
    }
    return () => {
      selectClause(null);
    };
  }, [clauseId, selectClause]);

  if (isLoading || !documentAnalysis || !currentDocument) {
    return (
      <div className="py-12 text-center text-steel animate-pulse space-y-4">
        <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm">Loading clause breakdown...</p>
      </div>
    );
  }

  const clause = documentAnalysis.clauses.find(c => c.id === clauseId);

  if (!clause) {
    return (
      <div className="bg-surface rounded-2xl border border-slate-200/80 p-8 text-center max-w-lg mx-auto my-12 space-y-4">
        <h3 className="text-lg font-bold text-charcoal">Clause Not Found</h3>
        <p className="text-xs text-steel">The requested clause could not be located in this document.</p>
        <Button onClick={() => navigate(`/documents/${documentId}/analysis`)} variant="primary">
          {t.backToAnalysis}
        </Button>
      </div>
    );
  }

  const styles = getSeverityStyles(clause.severity);
  const simpleMeaning = clause.simpleMeaning[language] || clause.simpleMeaning.en;
  const whyItMatters = clause.whyItMatters[language] || clause.whyItMatters.en;
  const whatToVerify = clause.whatToVerify[language] || clause.whatToVerify.en;

  const handleAskAI = () => {
    setIsAIChatOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      
      {/* Top Breadcrumb & Back button */}
      <div className="flex items-center justify-between">
        <Link
          to={`/documents/${documentId}/analysis`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-steel hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToAnalysis}</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge severity={clause.severity}>{clause.severity}</Badge>
          <span className="text-xs font-mono font-bold text-steel bg-slate-100 px-2.5 py-0.5 rounded-full">
            Page {clause.pageNumber}
          </span>
        </div>
      </div>

      {/* Clause Header Card */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-whisper space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                Clause {clause.clauseNumber}
              </span>
              <span className="text-xs text-steel font-medium capitalize">
                Category: {clause.category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal font-display">
              {clause.title}
            </h1>
          </div>

          <Button
            onClick={handleAskAI}
            variant="primary"
            size="md"
            leftIcon={<Sparkles className="w-4 h-4" />}
            className="flex-shrink-0"
          >
            {t.askAboutClauseBtn}
          </Button>
        </div>

        {/* Confidence & Evidence metadata */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-steel font-mono">
          <span><strong>Document:</strong> {currentDocument.filename}</span>
          <span>•</span>
          <span><strong>Extraction Confidence:</strong> {(clause.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Original Legal Text (VERBATIM - UNTRANSLATED) */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-8 shadow-diffused space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>{t.originalClauseTitle}</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
            Verbatim Legal Record
          </span>
        </div>

        <p className="font-mono text-xs sm:text-sm leading-relaxed bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800 text-slate-200 select-all">
          "{clause.originalText}"
        </p>

        <p className="text-[11px] text-slate-400 italic">
          {t.originalClauseNotice}
        </p>
      </div>

      {/* Citizen Plain Language Breakdown Stack */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Simple Citizen Meaning */}
        <div className="bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-whisper space-y-2">
          <h3 className="font-bold text-charcoal text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <span>{t.simpleMeaningTitle}</span>
          </h3>
          <p className="text-sm text-charcoal/90 leading-relaxed font-medium bg-brand-50/50 p-4 rounded-xl border border-brand-100/60">
            {simpleMeaning}
          </p>
        </div>

        {/* Why This Matters */}
        <div className="bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-whisper space-y-2">
          <h3 className="font-bold text-charcoal text-base flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>{t.whyMattersTitle}</span>
          </h3>
          <p className="text-sm text-steel leading-relaxed bg-amber-50/40 p-4 rounded-xl border border-amber-200/60">
            {whyItMatters}
          </p>
        </div>

        {/* Recommended Verification Steps */}
        <div className="bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-whisper space-y-2">
          <h3 className="font-bold text-charcoal text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{t.whatToVerifyTitle}</span>
          </h3>
          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/60 text-sm text-emerald-950 leading-relaxed font-medium">
            {whatToVerify}
          </div>
        </div>

      </div>

      {/* Bottom Floating AI Prompt Action */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-diffused">
        <div className="space-y-1">
          <h4 className="font-bold text-sm sm:text-base">Have doubts about Clause {clause.clauseNumber}?</h4>
          <p className="text-xs text-slate-300">
            Ask LegalLingo AI in Hindi, Marathi, or English.
          </p>
        </div>

        <Button
          onClick={handleAskAI}
          variant="primary"
          size="md"
          className="bg-white text-brand-950 hover:bg-slate-100 font-bold whitespace-nowrap"
        >
          {t.askAboutClauseBtn}
        </Button>
      </div>

    </div>
  );
};
