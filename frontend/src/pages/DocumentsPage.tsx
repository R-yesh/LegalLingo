import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useDocument } from '../context/DocumentContext';
import { getDocuments } from '../services/documentService';
import { LegalDocument } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, formatBytes } from '../lib/utils';
import { 
  FolderGit2, 
  Search, 
  FileText, 
  ArrowRight, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

export const DocumentsPage: React.FC = () => {
  const { t } = useLanguage();
  const { loadDocument } = useDocument();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        const docs = await getDocuments();
        setDocuments(docs);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleContinueAnalysis = async (docId: string) => {
    await loadDocument(docId);
    navigate(`/documents/${docId}/analysis`);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || doc.documentType === selectedType;
    return matchesSearch && matchesType;
  });

  const documentTypes = ['All', 'Sale Agreement', 'Sale Deed', 'Rent Agreement', 'Gift Deed', 'NOC'];

  return (
    <div className="space-y-8 py-4">
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal font-display">
            {t.myDocsTitle}
          </h1>
          <p className="text-sm text-steel mt-1">
            {t.myDocsSubtitle}
          </p>
        </div>

        <Button
          onClick={() => navigate('/upload')}
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t.uploadNewDoc}
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-surface p-4 rounded-2xl border border-slate-200/80 shadow-whisper">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchDocsPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {documentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                selectedType === type
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 text-steel hover:text-charcoal hover:bg-slate-200"
              )}
            >
              {type === 'All' ? t.allTypes : type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-8 shadow-whisper">
          <EmptyState
            title={t.noDocsFound}
            description={t.noDocsSubtext}
            actionText={t.uploadNewDoc}
            onAction={() => navigate('/upload')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-surface rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-whisper hover:shadow-diffused transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {doc.isSample && (
                      <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full uppercase">
                        Sample
                      </span>
                    )}
                    <span className="text-xs font-mono bg-slate-100 text-steel px-2 py-0.5 rounded font-medium">
                      {doc.documentType}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-charcoal text-base mb-1 line-clamp-2 group-hover:text-brand-600 transition-colors">
                  {doc.filename}
                </h3>
                
                <div className="flex items-center gap-3 text-xs text-steel font-mono mb-4">
                  <span>{formatBytes(doc.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(doc.uploadedAt)}</span>
                </div>

                {/* Attention count and verification status */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4 flex items-center justify-between text-xs">
                  <span className="text-steel font-medium">Attention Items:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {doc.attentionCount || 0} flagged
                  </span>
                </div>
              </div>

              {/* Continue Analysis CTA */}
              <Button
                onClick={() => handleContinueAnalysis(doc.id)}
                variant="primary"
                size="sm"
                className="w-full justify-between mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                <span>{t.continueAnalysisBtn}</span>
              </Button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
