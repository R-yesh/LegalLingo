import { LegalDocument, DocumentAnalysis, Clause } from '../types';
import { SAMPLE_DOCUMENT, SAMPLE_ANALYSIS } from '../data/sampleDocument';
import { API_BASE_URL } from './api';

// In-memory / localStorage document storage for client-side state
const STORAGE_DOCS_KEY = 'legallingo_documents';
const STORAGE_ANALYSIS_KEY = 'legallingo_analyses';

function getStoredDocs(): LegalDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_DOCS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredDocs(docs: LegalDocument[]) {
  try {
    localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save documents to localStorage', e);
  }
}

function getStoredAnalyses(): Record<string, DocumentAnalysis> {
  try {
    const raw = localStorage.getItem(STORAGE_ANALYSIS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredAnalyses(analyses: Record<string, DocumentAnalysis>) {
  try {
    localStorage.setItem(STORAGE_ANALYSIS_KEY, JSON.stringify(analyses));
  } catch (e) {
    console.error('Failed to save analyses to localStorage', e);
  }
}

/**
 * Maps camelCase backend DocumentAnalysis shape to our frontend type.
 * The backend returns camelCase (via CamelModel) so keys already match the
 * frontend TypeScript interface — we just fill in any gaps.
 */
function normaliseBackendAnalysis(raw: any, docId: string): DocumentAnalysis {
  return {
    id: raw.id ?? `analysis-${docId}`,
    documentId: raw.documentId ?? docId,
    summary: raw.summary ?? { en: '', hi: '', mr: '' },
    healthScore: raw.healthScore ?? 50,
    parties: raw.parties ?? [],
    extractedFields: raw.extractedFields ?? [],
    financialDetails: raw.financialDetails ?? {},
    importantDates: raw.importantDates ?? [],
    attentionItems: raw.attentionItems ?? [],
    clauses: raw.clauses ?? [],
    citizenChecklist: raw.citizenChecklist ?? [],
    analyzedAt: raw.analyzedAt ?? new Date().toISOString(),
  };
}

export async function uploadDocument(
  file: File,
  supportingFiles: File[] = [],
  onProgress?: (percent: number) => void
): Promise<{ document: LegalDocument; analysis: DocumentAnalysis }> {
  if (onProgress) onProgress(15);

  const formData = new FormData();
  formData.append('file', file);
  supportingFiles.forEach((sf) => formData.append('supporting_files', sf));

  if (onProgress) onProgress(40);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });
  } catch (netError) {
    // Backend unreachable. Never fabricate a fake "successful" analysis here —
    // the UI must show a real error state instead (see frontend/index.md: "Do
    // NOT create fake successful analysis" / "UI should expect real API responses").
    console.error('[LegalLingo] Backend unreachable:', netError);
    throw new Error(
      'Could not reach the LegalLingo server. Please check your connection and try again.'
    );
  }

  if (onProgress) onProgress(75);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Upload error' }));
    const backendError = typeof errorData.detail === 'string'
      ? errorData.detail
      : JSON.stringify(errorData.detail);
    console.warn('[LegalLingo] Backend error:', response.status, backendError);
    if (onProgress) onProgress(100);
    throw new Error(`Analysis failed: ${backendError}`);
  }

  const rawData = await response.json();
  const docId = rawData.documentId ?? `doc-${Date.now()}`;
  const backendAnalysis = normaliseBackendAnalysis(rawData, docId);
  console.info('[LegalLingo] Backend analysis received, documentId:', docId);

  if (onProgress) onProgress(100);

  const document: LegalDocument = {
    id: docId,
    filename: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/pdf',
    documentType: 'Sale Agreement',
    uploadedAt: new Date().toISOString(),
    status: 'completed',
    attentionCount: backendAnalysis.attentionItems?.length ?? 0,
    isSample: false,
  };

  // Persist to localStorage under the backend-assigned docId
  const docs = getStoredDocs();
  docs.unshift(document);
  saveStoredDocs(docs);

  const analyses = getStoredAnalyses();
  analyses[docId] = backendAnalysis;
  saveStoredAnalyses(analyses);

  return { document, analysis: backendAnalysis };
}

export async function getDocuments(): Promise<LegalDocument[]> {
  const stored = getStoredDocs();
  return [SAMPLE_DOCUMENT, ...stored];
}

export async function getDocument(documentId: string): Promise<LegalDocument | null> {
  if (documentId === SAMPLE_DOCUMENT.id) {
    return SAMPLE_DOCUMENT;
  }
  const stored = getStoredDocs();
  return stored.find(d => d.id === documentId) || null;
}

export async function getDocumentAnalysis(documentId: string): Promise<DocumentAnalysis | null> {
  if (documentId === SAMPLE_DOCUMENT.id) {
    return SAMPLE_ANALYSIS;
  }
  const stored = getStoredAnalyses();
  return stored[documentId] || null;
}

export async function getClause(documentId: string, clauseId: string): Promise<Clause | null> {
  const analysis = await getDocumentAnalysis(documentId);
  if (!analysis) return null;
  return analysis.clauses.find(c => c.id === clauseId) || null;
}

export async function updateChecklistStatus(
  documentId: string,
  checklistItemId: string,
  status: 'pending' | 'completed'
): Promise<boolean> {
  const analysis = await getDocumentAnalysis(documentId);
  if (!analysis) return false;

  const item = analysis.citizenChecklist.find(c => c.id === checklistItemId);
  if (item) {
    item.status = status;
    if (documentId !== SAMPLE_DOCUMENT.id) {
      const stored = getStoredAnalyses();
      stored[documentId] = analysis;
      saveStoredAnalyses(stored);
    }
    return true;
  }
  return false;
}
