import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useDocument } from '../context/DocumentContext';
import { uploadDocument } from '../services/documentService';
import { LegalDocument, DocumentAnalysis } from '../types';
import { Button } from '../components/common/Button';
import { formatBytes } from '../lib/utils';
import { 
  UploadCloud, 
  FileText, 
  FileCheck, 
  X, 
  AlertCircle, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

export const UploadPage: React.FC = () => {
  const { t } = useLanguage();
  const { loadDocumentWithAnalysis, loadSampleAgreement, refreshDocumentsList } = useDocument();
  const navigate = useNavigate();

  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [isDraggingPrimary, setIsDraggingPrimary] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const primaryInputRef = useRef<HTMLInputElement>(null);
  const supportingInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      return 'Please upload a valid PDF, Word, or image file.';
    }
    const maxSizeBytes = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSizeBytes) {
      return 'File exceeds the 25MB size limit.';
    }
    return null;
  };

  const handlePrimaryFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage(null);
    setPrimaryFile(file);
  };

  const handleSupportingFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const err = validateFile(f);
      if (!err) {
        newFiles.push(f);
      }
    }
    setSupportingFiles(prev => [...prev, ...newFiles]);
  };

  const removeSupportingFile = (index: number) => {
    setSupportingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = async () => {
    if (!primaryFile) {
      setErrorMessage('Please select a primary legal agreement first.');
      return;
    }

    setUploadStatus('uploading');
    setErrorMessage(null);

    try {
      const { document, analysis } = await uploadDocument(
        primaryFile,
        supportingFiles,
        (percent) => {
          setUploadProgress(percent);
          if (percent >= 45) setUploadStatus('processing');
        }
      );

      // Load document directly from the response — no re-fetch needed.
      // This guarantees the analysis is in context before navigation.
      await loadDocumentWithAnalysis(document, analysis);
      await refreshDocumentsList();
      setUploadStatus('success');

      setTimeout(() => {
        navigate(`/documents/${document.id}/analysis`);
      }, 400);

    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err?.message || t.uploadError);
    }
  };

  const handleTrySample = async () => {
    const docId = await loadSampleAgreement();
    navigate(`/documents/${docId}/analysis`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal font-display">
          {t.uploadTitle}
        </h1>
        <p className="text-sm sm:text-base text-steel max-w-xl mx-auto">
          {t.uploadSubtitle}
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-whisper space-y-6">
        
        {/* Primary Agreement Dropzone */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-1">
            {t.primaryDocLabel} <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-steel mb-3">{t.primaryDocHint}</p>

          {!primaryFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingPrimary(true);
              }}
              onDragLeave={() => setIsDraggingPrimary(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingPrimary(false);
                handlePrimaryFileSelect(e.dataTransfer.files);
              }}
              onClick={() => primaryInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center",
                isDraggingPrimary
                  ? "border-brand-500 bg-brand-50/50 scale-[0.99]"
                  : "border-slate-300 hover:border-brand-400 hover:bg-slate-50/50"
              )}
            >
              <input
                ref={primaryInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => handlePrimaryFileSelect(e.target.files)}
              />
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3 shadow-whisper">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-charcoal mb-1">
                {t.dragDropText}{' '}
                <span className="text-brand-600 underline font-bold">{t.browseFiles}</span>
              </p>
              <span className="text-xs text-steel font-mono">PDF, DOCX, JPG (up to 25MB)</span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-brand-200 bg-brand-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-charcoal">{primaryFile.name}</h4>
                  <span className="text-xs text-steel font-mono">{formatBytes(primaryFile.size)}</span>
                </div>
              </div>
              <button
                onClick={() => setPrimaryFile(null)}
                className="p-1.5 text-steel hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                title={t.removeFile}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Supporting Documents Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
            <label className="text-sm font-bold text-charcoal">
              {t.supportingDocLabel}
            </label>
            <button
              type="button"
              onClick={() => supportingInputRef.current?.click()}
              className="text-xs font-bold text-brand-600 hover:text-brand-800 self-start sm:self-auto flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addMoreSupporting}</span>
            </button>
          </div>
          <p className="text-xs text-steel mb-3">{t.supportingDocHint}</p>

          <input
            ref={supportingInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleSupportingFileSelect(e.target.files)}
          />

          {supportingFiles.length > 0 && (
            <div className="space-y-2">
              {supportingFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold text-charcoal truncate">{file.name}</span>
                    <span className="text-steel font-mono text-[11px]">({formatBytes(file.size)})</span>
                  </div>
                  <button
                    onClick={() => removeSupportingFile(idx)}
                    className="text-steel hover:text-rose-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Upload & Processing Status Progress */}
        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-semibold text-charcoal">
              <span>{uploadStatus === 'uploading' ? t.uploadingText : t.processingText}</span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main CTA Action */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-steel">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Bank-grade 256-bit encryption</span>
          </div>

          <Button
            onClick={handleStartAnalysis}
            disabled={!primaryFile || uploadStatus === 'uploading' || uploadStatus === 'processing'}
            isLoading={uploadStatus === 'uploading' || uploadStatus === 'processing'}
            size="lg"
            variant="primary"
            className="w-full sm:w-auto"
          >
            {t.startAnalysisBtn}
          </Button>
        </div>

      </div>

      {/* Demo Action Banner */}
      <div className="p-6 rounded-2xl bg-brand-50 border border-brand-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-brand-900">{t.orTrySample}</h4>
            <p className="text-xs text-brand-700">Explore a real Pune Sale Agreement with highlighted high-attention clauses.</p>
          </div>
        </div>

        <Button
          onClick={handleTrySample}
          variant="outline"
          size="sm"
          className="bg-white text-brand-800 border-brand-300 font-bold whitespace-nowrap"
        >
          {t.trySample}
        </Button>
      </div>

    </div>
  );
};
