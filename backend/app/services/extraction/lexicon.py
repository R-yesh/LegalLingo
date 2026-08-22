"""Keyword and regex lexicons for deterministic document analysis.

These lexicons target the phrasing conventions of Indian legal/property
documents (sale agreements, sale deeds, rent/lease agreements, gift deeds).
Everything here is pattern matching against the document's own extracted
text -- nothing here invents facts; it only recognizes them.
"""
import re

# ---------------------------------------------------------------------------
# Document type classification
# ---------------------------------------------------------------------------
# Ordered most-specific first so a document matching several keyword sets is
# classified by its strongest / most distinctive signal.
DOCUMENT_TYPE_KEYWORDS: list[tuple[str, list[str]]] = [
    ("Encumbrance Certificate", ["encumbrance certificate", "non-encumbrance certificate", "search report"]),
    ("Gift Deed", ["gift deed", "deed of gift", "donor", "donee"]),
    ("Sale Deed", ["sale deed", "conveyance deed", "absolute sale"]),
    ("Rent Agreement", [
        "rent agreement", "lease agreement", "leave and license",
        "tenancy agreement", "leave & license", "licensor", "licensee",
    ]),
    ("Title Deed", ["title deed"]),
    ("NOC", ["no objection certificate", "no-objection certificate"]),
    ("PAN Card", ["permanent account number", "income tax department"]),
    ("Sale Agreement", ["agreement for sale", "agreement to sell", "sale agreement", "sale consideration"]),
]

# ---------------------------------------------------------------------------
# Party role detection
# ---------------------------------------------------------------------------
# Maps a role keyword (as it appears in text) to the frontend PartyRole enum.
ROLE_KEYWORD_TO_ROLE: dict[str, str] = {
    "vendor": "Seller / First Party",
    "seller": "Seller / First Party",
    "first party": "Seller / First Party",
    "party of the first part": "Seller / First Party",
    "donor": "Seller / First Party",
    "purchaser": "Buyer / Second Party",
    "buyer": "Buyer / Second Party",
    "second party": "Buyer / Second Party",
    "party of the second part": "Buyer / Second Party",
    "vendee": "Buyer / Second Party",
    "donee": "Buyer / Second Party",
    "licensee": "Lessee",
    "lessee": "Lessee",
    "tenant": "Lessee",
    "licensor": "Lessor",
    "lessor": "Lessor",
    "landlord": "Lessor",
    "mortgagee": "Bank / Lender",
    "lender": "Bank / Lender",
    "bank": "Bank / Lender",
    "witness": "Witness",
}
# Longer keywords must be tried before shorter ones that are substrings
# of them (e.g. "party of the first part" before "first party").
ROLE_KEYWORDS_BY_LENGTH = sorted(ROLE_KEYWORD_TO_ROLE.keys(), key=len, reverse=True)

NAME_TOKEN = r"[A-Z][a-zA-Z.'\-]{1,25}"
NAME_CANDIDATE_RE = re.compile(rf"(?:{NAME_TOKEN}(?:\s+{NAME_TOKEN}){{0,3}})")

HONORIFIC_NAME_RE = re.compile(
    rf"(?:Mr\.?|Mrs\.?|Ms\.?|Shri|Smt\.?|Kumari|M/s\.?)\s+({NAME_TOKEN}(?:\s+{NAME_TOKEN}){{0,3}})"
)

# ---------------------------------------------------------------------------
# Money / amounts
# ---------------------------------------------------------------------------
AMOUNT_RE = re.compile(
    r"(?:Rs\.?|INR|₹|Rupees)\s?\.?\s?([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:/-)?",
    re.IGNORECASE,
)

FINANCIAL_FIELD_KEYWORDS: dict[str, list[str]] = {
    "totalAmount": [
        "total consideration", "sale consideration", "total sale price", "consideration amount", "total amount",
        "monthly rent", "rent payable", "rent amount",
    ],
    "advancePaid": [
        "advance of", "advance paid", "advance amount", "earnest money", "token amount", "part payment received",
        "security deposit", "deposit of",
    ],
    "balanceDue": ["balance amount", "balance consideration", "remaining amount", "balance payment"],
    "stampDuty": ["stamp duty"],
    "registrationFee": ["registration fee", "registration charges"],
}

PAYMENT_MODE_KEYWORDS = [
    "rtgs", "neft", "demand draft", "dd no", "cheque", "cash", "bank transfer", "upi", "imps",
]

# ---------------------------------------------------------------------------
# Dates
# ---------------------------------------------------------------------------
DATE_NUMERIC_RE = re.compile(r"\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b")
DATE_TEXTUAL_RE = re.compile(
    r"\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?"
    r"(January|February|March|April|May|June|July|August|September|October|November|December)"
    r"[,]?\s+(\d{4})\b",
    re.IGNORECASE,
)

DATE_CONTEXT_KEYWORDS: dict[str, list[str]] = {
    "Execution Date": ["executed on", "execution date", "signed on", "dated this", "dated on", "made on"],
    "Registration Date": ["registered on", "registration date", "date of registration"],
    "Possession Date": ["possession date", "possession shall be delivered", "handover date", "date of possession"],
}

MONTH_NAME_TO_NUM = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}

# ---------------------------------------------------------------------------
# Property identifiers / location
# ---------------------------------------------------------------------------
PROPERTY_ID_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("Survey No.", re.compile(r"\bSurvey\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)", re.IGNORECASE)),
    ("Sy. No.", re.compile(r"\bSy\.?\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)", re.IGNORECASE)),
    ("Gat No.", re.compile(r"\bGa?[tu]\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)", re.IGNORECASE)),
    ("CTS No.", re.compile(r"\bC\.?T\.?S\.?\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)", re.IGNORECASE)),
    ("Khasra No.", re.compile(r"\bKhasra\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)", re.IGNORECASE)),
    ("Khata No.", re.compile(r"\bKhata\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)", re.IGNORECASE)),
    ("Plot No.", re.compile(r"\bPlot\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)", re.IGNORECASE)),
    ("Flat No.", re.compile(r"\bFlat\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)", re.IGNORECASE)),
]

PROPERTY_LOCATION_RE = re.compile(
    r"(?:situated?\s+at|located\s+at|situate\s+at)\s+([^.\n]{5,160})",
    re.IGNORECASE,
)

VILLAGE_TALUKA_DISTRICT_RE = re.compile(
    r"Village\s*[:\-]?\s*([A-Za-z ]{2,40}?)[,.]?\s*Taluka\s*[:\-]?\s*([A-Za-z ]{2,40}?)[,.]?\s*District\s*[:\-]?\s*([A-Za-z ]{2,40})",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Mortgage / encumbrance
# ---------------------------------------------------------------------------
MORTGAGE_KEYWORDS = [
    "mortgage", "mortgaged", "hypothecat", "charge on the property",
    "charge created", "lien", "encumbrance", "bank loan", "loan against property",
]
NEGATION_MARKERS = [
    "free from", "free of", "no ", "without any", "unencumbered", "not subject to",
    "no existing", "clear and marketable", "no prior",
]

# ---------------------------------------------------------------------------
# Registration / witnesses
# ---------------------------------------------------------------------------
REGISTRATION_NUMBER_RE = re.compile(
    r"(Registration\s*No\.?|Reg\.?\s*No\.?|Document\s*No\.?|Index[\s-]?II\s*No\.?)\s*[:\-]?\s*([A-Za-z0-9\/\-]+)",
    re.IGNORECASE,
)
SUB_REGISTRAR_RE = re.compile(
    r"Sub[- ]Registrar[,]?\s*(?:Office\s*(?:at|of)?)?\s*([A-Za-z0-9 ,.\-]{2,60})",
    re.IGNORECASE,
)

WITNESS_SECTION_RE = re.compile(
    r"(?:in\s+witness\s+whereof|witness(?:es)?\s*[:\-]|signed\s+in\s+the\s+presence\s+of)",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Clause category keyword lexicon (used for clause segmentation/tagging)
# ---------------------------------------------------------------------------
CLAUSE_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "parties": [
        "party of the first part", "party of the second part",
        "hereinafter referred to as", "executants",
    ],
    "property": [
        "schedule of property", "schedule of the property", "property described",
        "survey no", "plot no", "flat no", "gat no", "cts no", "khasra", "khata",
        "property bearing", "admeasuring", "built-up area", "carpet area",
    ],
    "payment": [
        "payment shall be made", "mode of payment", "installment", "instalment",
        "payment schedule", "cheque no", "demand draft",
    ],
    "consideration": [
        "sale consideration", "total consideration", "consideration amount",
        "in consideration of", "sum of rs",
    ],
    "possession": [
        "possession of the said property", "handover possession", "deliver possession",
        "vacant possession", "possession shall be delivered", "quiet possession",
    ],
    "mortgage_encumbrance": [
        "mortgage", "hypothecat", "charge on the property", "lien", "encumbrance",
        "bank loan", "loan against property",
    ],
    "termination": [
        "terminate this agreement", "termination of this agreement",
        "right to terminate", "agreement shall stand terminated",
    ],
    "forfeiture": [
        "forfeit", "forfeiture", "earnest money shall be forfeited", "liquidated damages",
    ],
    "registration": [
        "sub-registrar", "sub registrar", "registration act", "registered at the office",
        "index-ii", "index ii", "document registration",
    ],
    "dispute_jurisdiction": [
        "dispute", "arbitration", "jurisdiction of the courts", "courts at",
        "arbitration and conciliation act", "sole arbitrator",
    ],
    "witnesses": [
        "in witness whereof", "witness no", "witnesses:", "signed in the presence of",
        "signature of witness",
    ],
}
# Priority order for tie-breaking when multiple categories score equally.
CLAUSE_CATEGORY_PRIORITY = [
    "mortgage_encumbrance", "forfeiture", "dispute_jurisdiction", "termination",
    "registration", "consideration", "payment", "possession", "property",
    "witnesses", "parties",
]

# Frontend Clause.category only has 7 values; internal categories above are
# richer for detection purposes and map down onto that smaller set.
CLAUSE_CATEGORY_TO_FRONTEND: dict[str, str] = {
    "parties": "general",
    "property": "title",
    "payment": "payment",
    "consideration": "payment",
    "possession": "possession",
    "mortgage_encumbrance": "encumbrance",
    "termination": "general",
    "forfeiture": "general",
    "registration": "general",
    "dispute_jurisdiction": "dispute",
    "witnesses": "general",
    "general": "general",
}

HEADING_RE = re.compile(
    r"^\(?(\d{1,2}(?:\.\d{1,2}){0,2})\)?[\.\):]\s*([A-Za-z][A-Za-z /&,\-]{2,70})\s*$"
)
