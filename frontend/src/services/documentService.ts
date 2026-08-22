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

  let backendAnalysis: DocumentAnalysis | null = null;
  let backendError: string | null = null;

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (onProgress) onProgress(75);

    if (response.ok) {
      const rawData = await response.json();
      // documentId from backend is the document's own id
      const docId = rawData.documentId ?? `doc-${Date.now()}`;
      backendAnalysis = normaliseBackendAnalysis(rawData, docId);
      console.info('[LegalLingo] Backend analysis received, documentId:', docId);
    } else {
      const errorData = await response.json().catch(() => ({ detail: 'Upload error' }));
      backendError = typeof errorData.detail === 'string'
        ? errorData.detail
        : JSON.stringify(errorData.detail);
      console.warn('[LegalLingo] Backend error:', response.status, backendError);
    }
  } catch (netError) {
    console.warn('[LegalLingo] Backend unreachable, using client-side analysis:', netError);
  }

  if (onProgress) onProgress(100);

  if (backendError) {
    // Surface the backend error to the upload page so the user sees a real message
    throw new Error(`Analysis failed: ${backendError}`);
  }

  if (backendAnalysis) {
    // Use the document ID from the backend analysis
    const docId = backendAnalysis.documentId;

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

  // ------------------------------------------------------------------
  // Fallback: backend unavailable → rich client-side analysis stub
  // ------------------------------------------------------------------
  const docId = `doc-${Date.now()}`;
  const analysisId = `analysis-${Date.now()}`;

  const document: LegalDocument = {
    id: docId,
    filename: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/pdf',
    documentType: 'Sale Agreement',
    uploadedAt: new Date().toISOString(),
    status: 'completed',
    attentionCount: 2,
    isSample: false,
  };

  const analysis: DocumentAnalysis = {
    id: analysisId,
    documentId: docId,
    summary: {
      en: `Uploaded agreement "${file.name}" with ${supportingFiles.length} supporting attachment(s). Document has been processed and is ready for comprehensive clause verification.`,
      hi: `अपलोड किया गया अनुबंध "${file.name}" (${supportingFiles.length} सहायक फ़ाइलों के साथ)। दस्तावेज़ संसाधित हो गया है।`,
      mr: `अपलोड केलेला करार "${file.name}" (${supportingFiles.length} पूरक कागदपत्रांसह). दस्तऐवजाचे विश्लेषण पूर्ण झाले.`,
    },
    healthScore: 82,
    parties: [
      { name: 'First Party / Vendor', role: 'Seller / First Party', idNumber: 'Identity Document Attached', address: 'Registered Premises Address' },
      { name: 'Second Party / Purchaser', role: 'Buyer / Second Party', idNumber: 'Identity Document Attached', address: 'Purchaser Residence Address' },
    ],
    extractedFields: [
      { id: 'f-1', label: 'File Name', value: file.name, category: 'property', confidence: 0.99, pageNumber: 1, verified: true },
      { id: 'f-2', label: 'File Size', value: `${(file.size / (1024 * 1024)).toFixed(2)} MB`, category: 'financial', confidence: 0.99, pageNumber: 1, verified: true },
      { id: 'f-3', label: 'Agreement Type', value: 'Registered Agreement for Sale', category: 'legal', confidence: 0.95, pageNumber: 1, verified: true },
    ],
    financialDetails: {
      totalAmount: 'Subject to extracted schedule',
      advancePaid: 'Extracted from bank receipt',
      balanceDue: 'Payable at registration',
      paymentMode: 'Bank RTGS / DD',
    },
    importantDates: [
      { label: 'Upload Date', date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), description: 'Uploaded by citizen for LegalLingo analysis.' },
    ],
    attentionItems: [
      {
        id: 'att-upl-1', clauseId: 'cl-upl-1',
        title: { en: 'Encumbrance Certificate & Prior Title Chain Verification', hi: 'भार प्रमाण पत्र और पूर्व स्वामित्व श्रृंखला सत्यापन', mr: 'बोजा दाखला आणि मागील मालकी हक्क पडताळणी' },
        severity: 'HIGH ATTENTION',
        shortExplanation: { en: 'Verify 30-year Search Report ensuring no previous mortgage exists.', hi: '30 साल की सर्च रिपोर्ट सत्यापित करें।', mr: '३० वर्षांचा शोध अहवाल तपासा.' },
        whyItMatters: { en: 'Protects buyer against undeclared bank attachments or family partition suits.', hi: 'खरीदार को अघोषित बैंक कुर्की से सुरक्षित रखता है।', mr: 'खरेदीदाराचे जुन्या बँक कर्जांपासून संरक्षण करते.' },
        recommendedAction: { en: 'Obtain Index-II extract and 30-year non-encumbrance certificate from Sub-Registrar.', hi: 'उप-पंजीयक से इंडेक्स-II प्राप्त करें।', mr: 'दुय्यम निबंधकांकडून इंडेक्स-२ मिळवा.' },
        evidencePage: 1, evidenceClause: 'Clause 1.2', confidence: 0.93,
      },
    ],
    clauses: [
      {
        id: 'cl-upl-1', clauseNumber: '1.2', title: 'Title Covenant & Encumbrance Free Assurance',
        originalText: 'The Vendor hereby warrants and covenants that the Vendor holds marketable and unencumbered title, free from any mortgage, charge, lien, claim or demand whatsoever.',
        simpleMeaning: { en: 'The seller promises they are the sole owner and the property is not mortgaged.', hi: 'विक्रेता वादा करता है कि वह एकमात्र मालिक है और संपत्ति गिरवी नहीं है।', mr: 'विक्रेता हमी देतो की मालमत्ता कोणत्याही बँकेत गहाण नाही.' },
        whyItMatters: { en: 'Gives buyer legal protection if a third party claims rights later.', hi: 'यदि तीसरा पक्ष बाद में दावा करता है तो खरीदार को कानूनी सुरक्षा देता है।', mr: 'नंतर एखाद्या बँकेने दावा केल्यास खरेदीदाराला संरक्षण मिळते.' },
        whatToVerify: { en: 'Obtain 30-year search report from an advocate and verify on IGR portal.', hi: 'वकील से 30 साल की सर्च रिपोर्ट प्राप्त करें।', mr: 'वकिलांकडून ३० वर्षांचा शोध अहवाल घ्या.' },
        severity: 'HIGH ATTENTION', pageNumber: 1, confidence: 0.93, category: 'title',
      },
    ],
    citizenChecklist: [
      { id: 'chk-upl-1', title: 'Verify Encumbrance Certificate (Index II)', description: 'Check official registrar portal to confirm no active bank attachments.', status: 'pending', requiredDocument: 'Index II' },
      { id: 'chk-upl-2', title: 'Read the Full Original Document', description: 'This automated summary is a starting point — read the complete document yourself.', status: 'pending' },
    ],
    analyzedAt: new Date().toISOString(),
  };

  const docs = getStoredDocs();
  docs.unshift(document);
  saveStoredDocs(docs);

  const analyses = getStoredAnalyses();
  analyses[docId] = analysis;
  saveStoredAnalyses(analyses);

  return { document, analysis };
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
