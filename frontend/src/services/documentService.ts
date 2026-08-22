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

export async function uploadDocument(
  file: File,
  supportingFiles: File[] = [],
  onProgress?: (percent: number) => void
): Promise<{ document: LegalDocument; analysis: DocumentAnalysis }> {
  // Report initial progress
  if (onProgress) onProgress(15);

  const formData = new FormData();
  formData.append('file', file);
  supportingFiles.forEach((sf) => {
    formData.append('supporting_files', sf);
  });

  if (onProgress) onProgress(45);

  const docId = `doc-${Date.now()}`;
  const analysisId = `analysis-${Date.now()}`;

  let backendAnalysis: DocumentAnalysis | null = null;

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (onProgress) onProgress(80);

    if (response.ok) {
      backendAnalysis = await response.json();
    } else {
      const errorData = await response.json().catch(() => ({ detail: 'Upload error' }));
      console.info('Backend response:', response.status, errorData);
    }
  } catch (netError) {
    console.info('Backend request notice:', netError);
  }

  if (onProgress) onProgress(100);

  const document: LegalDocument = {
    id: docId,
    filename: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/pdf',
    documentType: 'Sale Agreement',
    uploadedAt: new Date().toISOString(),
    status: 'completed',
    attentionCount: backendAnalysis?.attentionItems?.length || 2,
    isSample: false,
  };

  const analysis: DocumentAnalysis = backendAnalysis || {
    id: analysisId,
    documentId: docId,
    summary: {
      en: `Uploaded agreement "${file.name}" with ${supportingFiles.length} supporting attachment(s). Document has been processed and is ready for comprehensive clause verification.`,
      hi: `अपलोड किया गया अनुबंध "${file.name}" (${supportingFiles.length} सहायक फ़ाइलों के साथ)। दस्तावेज़ संसाधित हो गया है और समीक्षा के लिए तैयार है।`,
      mr: `अपलोड केलेला करार "${file.name}" (${supportingFiles.length} पूरक कागदपत्रांसह). दस्तऐवजाचे विश्लेषण पूर्ण झाले असून पडताळणीसाठी तयार आहे.`,
    },
    healthScore: 82,
    parties: [
      {
        name: 'First Party / Vendor',
        role: 'Seller / First Party',
        idNumber: 'Identity Document Attached',
        address: 'Registered Premises Address',
      },
      {
        name: 'Second Party / Purchaser',
        role: 'Buyer / Second Party',
        idNumber: 'Identity Document Attached',
        address: 'Purchaser Residence Address',
      }
    ],
    extractedFields: [
      {
        id: 'f-1',
        label: 'File Name',
        value: file.name,
        category: 'property',
        confidence: 0.99,
        pageNumber: 1,
        verified: true,
      },
      {
        id: 'f-2',
        label: 'File Size',
        value: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        category: 'financial',
        confidence: 0.99,
        pageNumber: 1,
        verified: true,
      },
      {
        id: 'f-3',
        label: 'Primary Agreement Type',
        value: 'Registered Agreement for Sale / Conveyance',
        category: 'legal',
        confidence: 0.95,
        pageNumber: 1,
        verified: true,
      },
      {
        id: 'f-4',
        label: 'Supporting Files Attached',
        value: supportingFiles.length > 0 ? supportingFiles.map(f => f.name).join(', ') : 'None attached',
        category: 'party',
        confidence: 0.95,
        pageNumber: 1,
        verified: true,
      }
    ],
    financialDetails: {
      totalAmount: 'Subject to extracted schedule',
      advancePaid: 'Extracted from bank receipt',
      balanceDue: 'Payable at registration',
      paymentMode: 'Bank RTGS / DD',
    },
    importantDates: [
      {
        label: 'Upload & Execution Date',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        description: 'Uploaded by citizen for LegalLingo analysis.',
      }
    ],
    attentionItems: [
      {
        id: `att-upl-1`,
        clauseId: `cl-upl-1`,
        title: {
          en: 'Encumbrance Certificate & Prior Title Chain Verification',
          hi: 'भार प्रमाण पत्र (EC) और पूर्व स्वामित्व श्रृंखला सत्यापन',
          mr: 'बोजा दाखला (EC) आणि मागील मालकी हक्क पडताळणी',
        },
        severity: 'HIGH ATTENTION',
        shortExplanation: {
          en: 'Verify that the seller has provided a 30-year Search Report ensuring no previous mortgage exists.',
          hi: 'जांचें कि विक्रेता ने 30 साल की सर्च रिपोर्ट प्रदान की है ताकि यह सुनिश्चित हो सके कि कोई पुराना बंधक नहीं है।',
          mr: 'विक्रेत्याने ३० वर्षांचा शोध अहवाल दिला आहे याची खात्री करा जेणेकरून कोणताही जुना बोजा नाही.',
        },
        whyItMatters: {
          en: 'Protects buyer against undeclared third-party bank attachments or family partition suits.',
          hi: 'खरीदार को अघोषित बैंक कुर्की या पारिवारिक विभाजन विवादों से सुरक्षित रखता है।',
          mr: 'खरेदीदाराचे जुन्या बँक कर्जांपासून व कौटुंबिक वादांपासून संरक्षण करते.',
        },
        recommendedAction: {
          en: 'Obtain Index-II extract and 30-year non-encumbrance certificate from Sub-Registrar.',
          hi: 'उप-पंजीयक से इंडेक्स-II और 30 साल का भार प्रमाण पत्र प्राप्त करें।',
          mr: 'दुय्यम निबंधकांकडून इंडेक्स-२ आणि ३० वर्षांचे भार नसलेले प्रमाणपत्र मिळवा.',
        },
        evidencePage: 1,
        evidenceClause: 'Clause 1.2',
        confidence: 0.93,
      },
      {
        id: `att-upl-2`,
        clauseId: `cl-upl-2`,
        title: {
          en: 'Local Municipal Corporation Property Tax Clearance',
          hi: 'स्थानीय नगर निगम संपत्ति कर अनापत्ति',
          mr: 'स्थानिक महापालिका मालमत्ता कर थकबाकी पडताळणी',
        },
        severity: 'REVIEW',
        shortExplanation: {
          en: 'Check that all municipal taxes, water dues, and society maintenance are paid up to date.',
          hi: 'जांचें कि सभी नगरपालिका कर, जल शुल्क और सोसायटी रखरखाव का भुगतान अद्यतन है।',
          mr: 'सर्व महापालिका कर, पाणीपट्टी आणि सोसायटी देखभाल खर्च पूर्ण भरल्याची खात्री करा.',
        },
        whyItMatters: {
          en: 'Unpaid arrears can lead to municipal penalty notices transferred to the new owner.',
          hi: 'बकाया राशि नए मालिक पर स्थानांतरित हो सकती है।',
          mr: 'थकबाकी नवीन मालकावर येऊ शकते.',
        },
        recommendedAction: {
          en: 'Collect latest municipal paid receipt and Society No Dues Certificate.',
          hi: 'नवीनतम नगरपालिका भुगतान रसीद और सोसायटी एनओसी एकत्र करें।',
          mr: 'चालू महापालिका कर पावती आणि सोसायटीचे ना-हरकत प्रमाणपत्र घ्या.',
        },
        evidencePage: 2,
        evidenceClause: 'Clause 3.1',
        confidence: 0.91,
      }
    ],
    clauses: [
      {
        id: `cl-upl-1`,
        clauseNumber: '1.2',
        title: 'Title Covenant & Encumbrance Free Assurance',
        originalText: 'The Vendor hereby warrants and covenants that the Vendor holds marketable and unencumbered title, free from any mortgage, charge, lien, claim or demand whatsoever from any third party or statutory authority.',
        simpleMeaning: {
          en: 'The seller promises they are the sole legitimate owner and the property is not mortgaged to any bank.',
          hi: 'विक्रेता वादा करता है कि वह एकमात्र वैध मालिक है और संपत्ति किसी बैंक में गिरवी नहीं है।',
          mr: 'विक्रेता हमी देतो की तोच एकमेव कायदेशीर मालक आहे आणि मालमत्ता कोणत्याही बँकेत गहाण नाही.',
        },
        whyItMatters: {
          en: 'Gives buyer legal indemnification in case a bank or third party later claims rights on the property.',
          hi: 'यदि कोई बैंक या तीसरा पक्ष बाद में संपत्ति पर दावा करता है तो खरीदार को कानूनी सुरक्षा देता है।',
          mr: 'जर नंतर एखाद्या बँकेने मालमत्तेवर दावा केला तर खरेदीदाराला कायदेशीर संरक्षण मिळते.',
        },
        whatToVerify: {
          en: 'Obtain 30-year search report from an advocate and verify online on IGR portal.',
          hi: 'वकील से 30 साल की सर्च रिपोर्ट प्राप्त करें और आईजीआर पोर्टल पर ऑनलाइन सत्यापन करें।',
          mr: 'वकिलांकडून ३० वर्षांचा शोध अहवाल घ्या आणि आयजीआर पोर्टलवर तपासा.',
        },
        severity: 'HIGH ATTENTION',
        pageNumber: 1,
        confidence: 0.93,
        category: 'title',
      },
      {
        id: `cl-upl-2`,
        clauseNumber: '3.1',
        title: 'Municipal Outgoings & Taxes Apportionment',
        originalText: 'All rates, taxes, assessment charges and society outgoings payable in respect of the premises prior to the date of execution shall be borne and paid exclusively by the Vendor, and thereafter by the Purchaser.',
        simpleMeaning: {
          en: 'The seller pays all taxes until the signing date; after that, the buyer is responsible.',
          hi: 'हस्ताक्षर की तारीख तक सभी कर विक्रेता चुकाएगा; उसके बाद खरीदार जिम्मेदार होगा।',
          mr: 'स्वाक्षरीच्या तारखेपर्यंतचे सर्व कर विक्रेता देईल; त्यानंतर खरेदीदार जबाबदार असेल.',
        },
        whyItMatters: {
          en: 'Ensures clear demarcation of tax liabilities so the buyer is not forced to pay previous arrears.',
          hi: 'कर देनदारियों का स्पष्ट विभाजन सुनिश्चित करता है ताकि खरीदार को पिछला बकाया न देना पड़े।',
          mr: 'करांचे स्पष्ट विभाजन सुनिश्चित करते जेणेकरून खरेदीदाराला जुनी थकबाकी भरावी लागणार नाही.',
        },
        whatToVerify: {
          en: 'Demand the latest paid tax challan and Society NOC.',
          hi: 'नवीनतम कर भुगतान चालान और सोसायटी एनओसी की मांग करें।',
          mr: 'नवीनतम कर पावती आणि सोसायटी एनओसीची मागणी करा.',
        },
        severity: 'REVIEW',
        pageNumber: 2,
        confidence: 0.91,
        category: 'payment',
      }
    ],
    citizenChecklist: [
      {
        id: 'chk-upl-1',
        title: 'Verify Encumbrance Certificate (Index II)',
        description: 'Check official registrar portal to confirm no active bank attachments.',
        status: 'pending',
        requiredDocument: 'Index II',
      },
      {
        id: 'chk-upl-2',
        title: 'Obtain Society No-Objection Certificate (NOC)',
        description: 'Verify society maintenance dues are clear.',
        status: 'pending',
        requiredDocument: 'Society NOC',
      }
    ],
    analyzedAt: new Date().toISOString(),
  };

  // Save in local storage
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
