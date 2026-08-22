Build the LegalLingo frontend in the existing Antigravity project using the existing Stitch designs as the visual source of truth.

IMPORTANT:
- This is the frontend for our final LegalLingo project.
- Do NOT create a new project.
- Do NOT replace the existing project structure unnecessarily.
- Do NOT add hardcoded Ramesh/demo data.
- Do NOT use fake analysis data as a permanent implementation.
- Preserve the Stitch visual design as closely as practical.
- Build reusable production-quality React/Next.js components.
- Keep the frontend ready to connect to the real backend APIs later.

FIRST:
Inspect the existing frontend and Stitch-generated screens before modifying files.

Create an implementation plan, then implement the frontend.

==================================================
1. GLOBAL APP STRUCTURE
==================================================

Create a clean frontend structure around:

- app/
- components/
- features/
  - documents/
  - analysis/
  - clauses/
  - ai/
  - schemes/
  - profile/
  - voice/
- lib/
- hooks/
- types/
- i18n/

Adapt this to the existing repository rather than blindly creating duplicate folders.

==================================================
2. GLOBAL APPLICATION STATE
==================================================

Create one reliable source of truth for:

- currentLanguage
- currentDocumentSetId
- currentDocumentId
- currentDocument
- documentAnalysis
- currentClauseId
- user profile/preferences
- AI conversation/context

Do not allow individual components to maintain separate copies of document identity.

The selected document must remain consistent across:

Upload
→ My Documents
→ Analysis
→ Clause Detail
→ AI Chat
→ PDF

Changing language must not change document facts.

==================================================
3. ROUTES
==================================================

Implement or connect the following frontend routes:

/
 /upload
 /documents
 /documents/[documentId]/analysis
 /documents/[documentId]/clause/[clauseId]
 /schemes
 /profile
 /ai

Use the existing router conventions when possible.

Requirements:

- Continue Analysis must open the exact document.
- Back navigation must preserve the expected user flow.
- Refreshing a document analysis route must not accidentally display another document.
- Never fall back to a sample document.

==================================================
4. LANDING PAGE
==================================================

Use Stitch design.

Provide:

- LegalLingo branding
- clear value proposition
- language selector
- upload CTA
- My Documents CTA
- simple explanation of the product
- trust/disclaimer area

Keep the interface citizen-friendly and simple.

==================================================
5. DOCUMENT UPLOAD
==================================================

Create the complete frontend upload experience.

Main document:
- Sale Agreement / primary legal document

Supporting documents:
- Seller PAN
- Buyer PAN
- Previous Deed
- NOC
- other supporting documents

Frontend requirements:

- drag and drop
- file picker
- file type validation
- file size validation
- upload progress
- processing state
- success state
- error state
- remove file
- retry processing
- document type labels

Do not create fake successful analysis.

The UI should expect real API responses.

==================================================
6. MY DOCUMENTS
==================================================

Build the document library UI.

Each document card should show:

- filename
- document type
- upload date
- processing status
- analysis status
- attention count where available
- Continue Analysis

Continue Analysis must navigate using documentId.

Never navigate to a generic analysis page that loses document identity.

==================================================
7. ANALYSIS DASHBOARD
==================================================

Build the main Legal Document Analysis screen from Stitch.

Sections:

- document header
- filename
- document type
- summary
- extracted information
- parties
- property
- transaction/financial information
- important dates
- attention items
- document health
- citizen checklist

Attention levels:

STANDARD
REVIEW
HIGH ATTENTION
VERIFIED

Use clear visual hierarchy.

Do not use:
- ILLEGAL
- INVALID
- FRAUDULENT

The UI should communicate that items require verification, not that the system has made a final legal judgment.

==================================================
8. ATTENTION ITEM COMPONENT
==================================================

Create a reusable attention-card component.

Each card should support:

- severity
- title
- short explanation
- why it matters
- recommended verification step
- evidence page
- evidence clause
- confidence if supplied by backend

Clicking it should open the related clause/detail view.

==================================================
9. CLAUSE DETAIL
==================================================

Create a dedicated clause-detail experience.

Display:

ORIGINAL CLAUSE

SIMPLE MEANING

WHY THIS MATTERS

WHAT SHOULD I VERIFY?

EVIDENCE

PAGE NUMBER

CONFIDENCE

Provide:

"Ask LegalLingo About This Clause"

The currently selected clause must become part of the AI context.

==================================================
10. AI CHAT UI
==================================================

Build a reusable AI assistant panel.

Support:

- document summary
- explain this document
- explain this clause
- what should I verify?
- why is this important?
- what should I do next?

The frontend must send:

- documentId
- clauseId when applicable
- currentLanguage
- relevant conversation context

Do not hardcode AI answers.

Create a clean loading/streaming state.

Add:
- message history
- typing/loading indicator
- error state
- retry
- voice input button
- text-to-speech button

==================================================
11. GLOBAL LANGUAGE
==================================================

Supported languages:

English
Hindi
Marathi

Create one global language selector.

Changing the language must update the entire UI.

It must affect:

- navigation
- headings
- buttons
- dashboard
- attention explanations
- checklist
- AI interface
- schemes
- PDF controls
- voice controls

Do NOT translate the original legal clause shown to the user.

Original legal text remains unchanged.

==================================================
12. GOVERNMENT SCHEMES
==================================================

Create the schemes screen.

Filters:

- State
- Occupation
- Income
- Area type

Each scheme card should support:

- scheme name
- category
- explanation
- why it may match
- eligibility
- required documents
- potential match percentage
- official portal button

Use the label:

"Potential Match"

Do not imply guaranteed eligibility.

Frontend should consume API data rather than hardcoded results.

==================================================
13. VOICE UI
==================================================

Create reusable voice controls for:

Speech-to-text
Text-to-speech

The selected global language must control the voice experience.

Voice must operate on the current AI response/document context.

Include browser unsupported/error states.

==================================================
14. PDF EXPORT
==================================================

Create the frontend PDF export interaction.

The export action must use:

currentDocumentId
currentDocument
currentAnalysis
currentLanguage

Do not generate a sample document.

Provide:

- export button
- generating state
- success state
- error state

==================================================
15. LOADING / ERROR / EMPTY STATES
==================================================

Every major screen must have proper:

- loading state
- empty state
- error state
- retry action

Never display fake content when data is unavailable.

==================================================
16. RESPONSIVENESS
==================================================

The application must work on:

- desktop
- tablet
- mobile

Preserve the Stitch visual hierarchy.

==================================================
17. ACCESSIBILITY
==================================================

Implement:

- semantic buttons
- keyboard navigation
- visible focus states
- accessible labels
- appropriate contrast
- screen-reader-friendly status messages

==================================================
18. TYPE SAFETY
==================================================

Create shared TypeScript interfaces/types for:

Document
DocumentSet
DocumentPage
ExtractedField
Clause
ValidationResult
DocumentAnalysis
AIMessage
Scheme
UserProfile

Do not use `any` unless absolutely unavoidable.

==================================================
19. API BOUNDARY
==================================================

Create frontend service functions/hooks for:

- uploadDocument()
- getDocuments()
- getDocument()
- getDocumentAnalysis()
- getClause()
- sendAIMessage()
- getSchemes()
- generatePDF()
- speechToText()
- textToSpeech()

Use clear interfaces so these can later connect to FastAPI/backend endpoints.

For development, use explicit loading/error states rather than silently replacing missing API data with sample data.

==================================================
20. DEMO MODE
==================================================

A sample document may exist ONLY as an explicit user action:

"Try Sample Agreement"

It must never be an automatic fallback.

Clearly separate demo data from real uploaded documents.

==================================================
21. TESTING
==================================================

After implementation:

- run TypeScript checks
- run lint
- run build
- test navigation
- test documentId persistence
- test language switching
- test mobile responsiveness
- test upload states
- test error states
- test clause navigation
- test AI context propagation

Verify:

Document A
→ Analysis A

Document B
→ Analysis B

and never:

Document B
→ Sample/Ramesh Analysis

==================================================
22. IMPLEMENTATION RULE
==================================================

Do NOT attempt to build the entire application in one giant rewrite.

Implement in this order:

1. Global layout/navigation
2. Global state
3. Routes
4. Upload UI
5. My Documents
6. Analysis dashboard
7. Clause detail
8. AI panel
9. Language system
10. Schemes
11. Voice
12. PDF export
13. Responsive/accessibility polish
14. Tests

After each phase:
- run the relevant checks
- fix errors
- report files changed
- do not move to unrelated functionality until the current phase works.

Start by inspecting the current repository and Stitch implementation, then implement phases in order.