import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useDocument } from '../context/DocumentContext';
import { AttentionCard } from '../components/analysis/AttentionCard';
import { DocumentHealthMeter } from '../components/analysis/DocumentHealthMeter';
import { CitizenChecklist } from '../components/analysis/CitizenChecklist';
import { PartiesCard } from '../components/analysis/PartiesCard';
import { ExtractedInfoGrid } from '../components/analysis/ExtractedInfoGrid';
import { ClausesList } from '../components/analysis/ClausesList';
import { DocumentAnalysisSkeleton } from '../components/common/SkeletonLoader';
import { Button } from '../components/common/Button';
import { generatePDF } from '../services/pdfService';
import { AttentionLevel } from '../types';
import { 
  FileText, 
  Download, 
  Sparkles, 
  Calendar, 
  IndianRupee, 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export const AnalysisPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { language, t } = useLanguage();
  const { 
    currentDocument, 
    documentAnalysis, 
    loadDocument, 
    isLoading, 
    error, 
    toggleChecklist,
    updateExtractedField,
    setIsAIChatOpen 
  } = useDocument();
  const navigate = useNavigate();

  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'ALL' | AttentionLevel>('ALL');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId, loadDocument]);

  if (isLoading) {
    return <DocumentAnalysisSkeleton />;
  }

  if (error || !documentAnalysis || !currentDocument) {
    return (
      <div className="bg-surface rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto my-12 space-y-4 shadow-whisper">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-charcoal">
          {error || 'Document Analysis Not Found'}
        </h3>
        <p className="text-xs text-steel">
          The requested document analysis could not be loaded. Please verify the document ID or upload a new file.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button onClick={() => navigate('/documents')} variant="outline">
            {t.navDocuments}
          </Button>
          <Button onClick={() => navigate('/upload')} variant="primary">
            {t.uploadTitle}
          </Button>
        </div>
      </div>
    );
  }

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await generatePDF(currentDocument, documentAnalysis, language);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const filteredAttentionItems = documentAnalysis.attentionItems.filter(item => {
    if (selectedSeverityFilter === 'ALL') return true;
    return item.severity === selectedSeverityFilter;
  });

  const summary = documentAnalysis.summary[language] || documentAnalysis.summary.en;

  return (
    <div className="space-y-8 py-2">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-steel hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.navDocuments}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            isLoading={isExportingPDF}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t.exportPDFBtn}
          </Button>

          <Button
            onClick={() => setIsAIChatOpen(true)}
            variant="primary"
            size="sm"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            {t.askAIBtn}
          </Button>
        </div>
      </div>

      {/* Main Document Header & Plain Language Summary */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-whisper space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal font-display">
                  {currentDocument.filename}
                </h1>
                <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full border border-brand-200">
                  {currentDocument.documentType}
                </span>
                {currentDocument.isSample && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase">
                    Interactive Sample
                  </span>
                )}
              </div>
              <p className="text-xs text-steel mt-1 font-mono">
                Document ID: {currentDocument.id}
              </p>
            </div>
          </div>
        </div>

        {/* Executive Citizen Summary */}
        <div className="bg-brand-50/70 rounded-2xl p-5 sm:p-6 border border-brand-200/70">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-900 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Executive Plain Language Summary</span>
          </h3>
          <p className="text-sm sm:text-base text-charcoal font-medium leading-relaxed">
            {summary}
          </p>
        </div>
      </div>

      {/* Document Health & Parties Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <DocumentHealthMeter
            score={documentAnalysis.healthScore}
            explanation={t.healthExplanation}
          />
        </div>

        <div className="lg:col-span-8">
          <PartiesCard parties={documentAnalysis.parties} />
        </div>
      </div>

      {/* Financial & Important Dates Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Financial Breakdown */}
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-whisper">
          <h4 className="font-bold text-charcoal text-base flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            <span>{t.financialSummary}</span>
          </h4>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-steel">{t.totalConsideration}:</span>
              <span className="font-bold text-charcoal font-mono text-base">
                {documentAnalysis.financialDetails.totalAmount || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-steel">{t.advancePaid}:</span>
              <span className="font-semibold text-emerald-700 font-mono">
                {documentAnalysis.financialDetails.advancePaid || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-steel">{t.balanceDue}:</span>
              <span className="font-semibold text-charcoal font-mono">
                {documentAnalysis.financialDetails.balanceDue || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-steel">{t.stampDutyPaid}:</span>
              <span className="font-semibold text-slate-700 font-mono">
                {documentAnalysis.financialDetails.stampDuty || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Key Dates Breakdown */}
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-whisper">
          <h4 className="font-bold text-charcoal text-base flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Calendar className="w-5 h-5 text-brand-600" />
            <span>{t.keyDates}</span>
          </h4>

          <div className="space-y-3">
            {documentAnalysis.importantDates.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-bold text-xs text-charcoal">{item.label}</h5>
                  <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {item.date}
                  </span>
                </div>
                <p className="text-[11px] text-steel">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Extracted Key Information Grid */}
      <ExtractedInfoGrid
        fields={documentAnalysis.extractedFields}
        onUpdateField={(fieldId, value) => updateExtractedField(fieldId, value)}
      />

      {/* All Clauses, Simplified */}
      <ClausesList
        clauses={documentAnalysis.clauses}
        documentId={currentDocument.id}
        language={language}
      />

      {/* Attention Items Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-charcoal font-display flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <span>{t.attentionItemsSection}</span>
            </h3>
            <p className="text-xs text-steel">
              Items flagged for citizen review and verification before signing.
            </p>
          </div>

          {/* Severity Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['ALL', 'HIGH ATTENTION', 'REVIEW', 'STANDARD', 'VERIFIED'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverityFilter(sev)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-xl whitespace-nowrap transition-all",
                  selectedSeverityFilter === sev
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-steel hover:text-charcoal hover:bg-slate-200"
                )}
              >
                {sev === 'ALL' ? t.filterAll : sev}
              </button>
            ))}
          </div>
        </div>

        {/* Attention Cards List */}
        <div className="space-y-4">
          {filteredAttentionItems.map((item) => (
            <AttentionCard
              key={item.id}
              item={item}
              documentId={currentDocument.id}
              language={language}
            />
          ))}
        </div>
      </section>

      {/* Citizen Action Checklist */}
      <CitizenChecklist
        items={documentAnalysis.citizenChecklist}
        onToggleItem={toggleChecklist}
      />

    </div>
  );
};
