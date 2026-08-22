export type Language = 'en' | 'hi' | 'mr';

export type AttentionLevel = 'VERIFIED' | 'STANDARD' | 'REVIEW' | 'HIGH ATTENTION';

export type DocumentProcessingStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'error';

export interface DocumentParty {
  name: string;
  role: 'Seller / First Party' | 'Buyer / Second Party' | 'Witness' | 'Bank / Lender' | 'Lessor' | 'Lessee' | 'Other';
  idNumber?: string;
  address?: string;
  phone?: string;
}

export interface ExtractedField {
  id: string;
  label: string;
  value: string;
  category: 'party' | 'property' | 'financial' | 'date' | 'legal';
  confidence?: number;
  pageNumber?: number;
  verified?: boolean;
}

export interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  requiredDocument?: string;
  authorityPortalUrl?: string;
}

export interface Clause {
  id: string;
  clauseNumber: string;
  title: string;
  originalText: string;
  simpleMeaning: Record<Language, string>;
  whyItMatters: Record<Language, string>;
  whatToVerify: Record<Language, string>;
  severity: AttentionLevel;
  pageNumber: number;
  confidence: number;
  category: 'title' | 'payment' | 'possession' | 'indemnity' | 'dispute' | 'encumbrance' | 'general';
}

export interface AttentionItem {
  id: string;
  clauseId: string;
  title: Record<Language, string>;
  severity: AttentionLevel;
  shortExplanation: Record<Language, string>;
  whyItMatters: Record<Language, string>;
  recommendedAction: Record<Language, string>;
  evidencePage: number;
  evidenceClause: string;
  confidence: number;
}

export interface DocumentAnalysis {
  id: string;
  documentId: string;
  summary: Record<Language, string>;
  healthScore: number; // 0 to 100
  parties: DocumentParty[];
  extractedFields: ExtractedField[];
  financialDetails: {
    totalAmount?: string;
    advancePaid?: string;
    balanceDue?: string;
    stampDuty?: string;
    registrationFee?: string;
    paymentMode?: string;
  };
  importantDates: {
    label: string;
    date: string;
    description: string;
  }[];
  attentionItems: AttentionItem[];
  clauses: Clause[];
  citizenChecklist: VerificationStep[];
  analyzedAt: string;
}

export interface LegalDocument {
  id: string;
  documentSetId?: string;
  filename: string;
  fileSize: number;
  fileType: string;
  documentType: 'Sale Agreement' | 'Sale Deed' | 'Rent Agreement' | 'Gift Deed' | 'NOC' | 'PAN Card' | 'Title Deed' | 'Encumbrance Certificate' | 'Other';
  uploadedAt: string;
  status: DocumentProcessingStatus;
  attentionCount?: number;
  isSample?: boolean;
  fileUrl?: string;
}

export interface DocumentSet {
  id: string;
  title: string;
  primaryDocumentId: string;
  documents: LegalDocument[];
  createdAt: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  language: Language;
  clauseReference?: {
    clauseId: string;
    clauseNumber: string;
    title: string;
  };
  suggestedFollowUps?: string[];
}

export interface Scheme {
  id: string;
  name: Record<Language, string>;
  category: 'Housing' | 'Subsidy' | 'Legal Aid' | 'Farmer' | 'Women Empowerment' | 'Senior Citizen';
  description: Record<Language, string>;
  whyItMatches: Record<Language, string>;
  eligibility: Record<Language, string[]>;
  requiredDocuments: Record<Language, string[]>;
  matchPercentage: number;
  state: string; // 'All India' | 'Maharashtra' | 'Delhi' | 'Karnataka' etc.
  officialPortalUrl: string;
  financialBenefit: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  preferredLanguage: Language;
  state: string;
  occupation: string;
  annualIncomeBracket: string;
  areaType: 'Urban' | 'Rural' | 'Semi-Urban';
  documentsAnalyzedCount: number;
}
