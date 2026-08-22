import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LegalDocument, DocumentAnalysis, Clause, UserProfile, AIMessage } from '../types';
import { getDocument, getDocumentAnalysis, updateChecklistStatus, updateExtractedFieldValue, getDocuments } from '../services/documentService';
import { SAMPLE_DOCUMENT, SAMPLE_ANALYSIS, DEFAULT_USER_PROFILE } from '../data/sampleDocument';


interface DocumentContextType {
  documents: LegalDocument[];
  currentDocumentId: string | null;
  currentDocument: LegalDocument | null;
  documentAnalysis: DocumentAnalysis | null;
  currentClauseId: string | null;
  currentClause: Clause | null;
  isLoading: boolean;
  error: string | null;
  userProfile: UserProfile;
  aiMessages: AIMessage[];
  isAIChatOpen: boolean;
  loadDocument: (docId: string) => Promise<boolean>;
  loadDocumentWithAnalysis: (doc: LegalDocument, analysis: DocumentAnalysis) => void;
  selectClause: (clauseId: string | null) => void;
  loadSampleAgreement: () => Promise<string>;
  refreshDocumentsList: () => Promise<void>;
  toggleChecklist: (checklistItemId: string) => Promise<void>;
  updateExtractedField: (fieldId: string, value: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addAIMessage: (msg: AIMessage) => void;
  clearAIMessages: () => void;
  setIsAIChatOpen: (open: boolean) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<LegalDocument[]>([SAMPLE_DOCUMENT]);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentDocument, setCurrentDocument] = useState<LegalDocument | null>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [currentClauseId, setCurrentClauseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);

  const refreshDocumentsList = useCallback(async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (e) {
      console.error('Failed to fetch documents', e);
    }
  }, []);

  useEffect(() => {
    refreshDocumentsList();
  }, [refreshDocumentsList]);

  const loadDocument = useCallback(async (docId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const doc = await getDocument(docId);
      if (!doc) {
        setError(`Document ${docId} not found`);
        setIsLoading(false);
        return false;
      }

      const analysis = await getDocumentAnalysis(docId);
      setCurrentDocumentId(docId);
      setCurrentDocument(doc);
      setDocumentAnalysis(analysis);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Failed to load document analysis');
      setIsLoading(false);
      return false;
    }
  }, []);

  const selectClause = useCallback((clauseId: string | null) => {
    setCurrentClauseId(clauseId);
  }, []);

  const loadDocumentWithAnalysis = useCallback((doc: LegalDocument, analysis: DocumentAnalysis) => {
    setCurrentDocumentId(doc.id);
    setCurrentDocument(doc);
    setDocumentAnalysis(analysis);
    setError(null);
    setIsLoading(false);
  }, []);

  const loadSampleAgreement = useCallback(async (): Promise<string> => {
    setIsLoading(true);
    setCurrentDocumentId(SAMPLE_DOCUMENT.id);
    setCurrentDocument(SAMPLE_DOCUMENT);
    setDocumentAnalysis(SAMPLE_ANALYSIS);
    setIsLoading(false);
    return SAMPLE_DOCUMENT.id;
  }, []);

  const toggleChecklist = useCallback(async (checklistItemId: string) => {
    if (!currentDocumentId || !documentAnalysis) return;

    const item = documentAnalysis.citizenChecklist.find(c => c.id === checklistItemId);
    if (!item) return;

    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    await updateChecklistStatus(currentDocumentId, checklistItemId, nextStatus);

    setDocumentAnalysis(prev => {
      if (!prev) return null;
      return {
        ...prev,
        citizenChecklist: prev.citizenChecklist.map(c =>
          c.id === checklistItemId ? { ...c, status: nextStatus } : c
        ),
      };
    });
  }, [currentDocumentId, documentAnalysis]);

  const updateExtractedField = useCallback(async (fieldId: string, value: string) => {
    if (!currentDocumentId || !documentAnalysis) return;

    const field = documentAnalysis.extractedFields.find(f => f.id === fieldId);
    if (!field) return;

    await updateExtractedFieldValue(currentDocumentId, fieldId, value);

    setDocumentAnalysis(prev => {
      if (!prev) return null;
      return {
        ...prev,
        extractedFields: prev.extractedFields.map(f =>
          f.id === fieldId ? { ...f, value } : f
        ),
      };
    });
  }, [currentDocumentId, documentAnalysis]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  }, []);

  const addAIMessage = useCallback((msg: AIMessage) => {
    setAiMessages(prev => [...prev, msg]);
  }, []);

  const clearAIMessages = useCallback(() => {
    setAiMessages([]);
  }, []);

  // Compute currentClause
  const currentClause = documentAnalysis && currentClauseId
    ? documentAnalysis.clauses.find(c => c.id === currentClauseId) || null
    : null;

  return (
    <DocumentContext.Provider
      value={{
        documents,
        currentDocumentId,
        currentDocument,
        documentAnalysis,
        currentClauseId,
        currentClause,
        isLoading,
        error,
        userProfile,
        aiMessages,
        isAIChatOpen,
        loadDocument,
        loadDocumentWithAnalysis,
        selectClause,
        loadSampleAgreement,
        refreshDocumentsList,
        toggleChecklist,
        updateExtractedField,
        updateProfile,
        addAIMessage,
        clearAIMessages,
        setIsAIChatOpen,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = (): DocumentContextType => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};
