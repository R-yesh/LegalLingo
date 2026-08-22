"""Deterministic fact extraction: document type, parties, amounts, dates,
property identifiers/location, mortgage mentions, registration & witnesses.

Every function here only reports what it can locate in the document's own
text, with a page number, a source snippet, and a confidence score. Nothing
is invented; when nothing is found the caller gets an empty result.
"""
import uuid
from datetime import date

from app.schemas.analysis import FinancialDetails, ImportantDate
from app.schemas.clause import ExtractedField
from app.schemas.document import DocumentParty

from app.services.extraction import lexicon as lx
from app.services.extraction.text_utils import (
    JoinedText,
    has_negation_nearby,
    parse_amount,
    snippet,
)


def _field_id() -> str:
    return f"f-{uuid.uuid4().hex[:10]}"


# ---------------------------------------------------------------------------
# Document type
# ---------------------------------------------------------------------------
def classify_document_type(joined: JoinedText) -> tuple[str, float]:
    lowered = joined.full_text.lower()
    best_type = "Other"
    best_score = 0
    for doc_type, keywords in lx.DOCUMENT_TYPE_KEYWORDS:
        score = sum(lowered.count(kw) for kw in keywords)
        if score > best_score:
            best_score = score
            best_type = doc_type
    confidence = min(0.55 + 0.1 * best_score, 0.9) if best_score else 0.3
    return best_type, confidence


# ---------------------------------------------------------------------------
# Parties (including witnesses)
# ---------------------------------------------------------------------------
def extract_parties(joined: JoinedText) -> tuple[list[DocumentParty], list[ExtractedField]]:
    text = joined.full_text
    lowered = text.lower()
    found: dict[tuple[str, str], dict] = {}  # (role, name_lower) -> {name, page, confidence, snippet}

    for keyword in lx.ROLE_KEYWORDS_BY_LENGTH:
        role = lx.ROLE_KEYWORD_TO_ROLE[keyword]
        is_witness = keyword == "witness"
        start = 0
        while True:
            idx = lowered.find(keyword, start)
            if idx == -1:
                break
            start = idx + len(keyword)

            name = None
            confidence = 0.55

            if is_witness:
                # Witness blocks read "Witness No. 1: Mr. X" -- the name
                # follows the keyword, on the same line.
                line_end = text.find("\n", start)
                if line_end == -1:
                    line_end = min(len(text), start + 150)
                window = text[start:line_end]
                honorific_matches = list(lx.HONORIFIC_NAME_RE.finditer(window))
                if honorific_matches:
                    name = honorific_matches[0].group(1).strip()
                    confidence = 0.75
                else:
                    generic_matches = list(lx.NAME_CANDIDATE_RE.finditer(window))
                    for m in generic_matches:
                        candidate = m.group(0).strip()
                        if len(candidate.split()) >= 2:
                            name = candidate
                            confidence = 0.5
                            break
            else:
                # Definitional phrasing ("Mr. X ... hereinafter referred to
                # as the Seller") states the name before the keyword, on the
                # same line/paragraph -- bounding the window at the previous
                # newline keeps this from wandering into an unrelated
                # heading or a later back-reference like "The Seller warrants...".
                line_start = text.rfind("\n", 0, idx)
                window_lo = max(0, idx - 220, line_start + 1)
                window = text[window_lo:idx]
                honorific_matches = list(lx.HONORIFIC_NAME_RE.finditer(window))
                if honorific_matches:
                    name = honorific_matches[-1].group(1).strip()
                    confidence = 0.75
                else:
                    generic_matches = list(lx.NAME_CANDIDATE_RE.finditer(window))
                    # Prefer the match closest to the keyword; skip 1-word hits
                    # (too likely to be a stray capitalized word, not a name).
                    for m in reversed(generic_matches):
                        candidate = m.group(0).strip()
                        if len(candidate.split()) >= 2:
                            name = candidate
                            confidence = 0.5
                            break

            if name:
                key = (role, name.lower())
                page = joined.page_for_offset(idx)
                evidence = snippet(text, idx, idx + len(keyword))
                existing = found.get(key)
                if not existing or confidence > existing["confidence"]:
                    found[key] = {
                        "name": name,
                        "role": role,
                        "page": page,
                        "confidence": confidence,
                        "snippet": evidence,
                    }

    parties: list[DocumentParty] = []
    fields: list[ExtractedField] = []
    for entry in found.values():
        parties.append(DocumentParty(name=entry["name"], role=entry["role"]))
        fields.append(
            ExtractedField(
                id=_field_id(),
                label=f"Party ({entry['role']})",
                value=entry["name"],
                category="party",
                confidence=round(entry["confidence"], 2),
                page_number=entry["page"],
                verified=False,
                evidence_snippet=entry["snippet"],
            )
        )
    return parties, fields


# ---------------------------------------------------------------------------
# Amounts / financial details
# ---------------------------------------------------------------------------
def extract_financials(joined: JoinedText) -> tuple[FinancialDetails, list[ExtractedField], dict[str, list[float]]]:
    text = joined.full_text
    lowered = text.lower()

    field_candidates: dict[str, list[dict]] = {key: [] for key in lx.FINANCIAL_FIELD_KEYWORDS}
    numeric_values_by_field: dict[str, list[float]] = {key: [] for key in lx.FINANCIAL_FIELD_KEYWORDS}

    for match in lx.AMOUNT_RE.finditer(text):
        idx = match.start()
        context_lo = max(0, idx - 60)
        context = lowered[context_lo:idx]

        # Pick whichever field's keyword occurs closest to the amount (not
        # just the first field in dict order) -- a window can legitimately
        # contain more than one field's keyword, e.g. "...advance paid,
        # balance amount of Rs. X...".
        matched_field = None
        best_kw_pos = -1
        for field_name, keywords in lx.FINANCIAL_FIELD_KEYWORDS.items():
            for kw in keywords:
                pos = context.rfind(kw)
                if pos > best_kw_pos:
                    best_kw_pos = pos
                    matched_field = field_name
        if not matched_field:
            continue

        raw_value = match.group(1)
        numeric = parse_amount(raw_value)
        page = joined.page_for_offset(idx)
        field_candidates[matched_field].append(
            {
                "value": f"Rs. {raw_value}",
                "numeric": numeric,
                "page": page,
                "snippet": snippet(text, match.start(), match.end()),
            }
        )
        if numeric is not None:
            numeric_values_by_field[matched_field].append(numeric)

    details_kwargs: dict[str, str | None] = {}
    fields: list[ExtractedField] = []
    label_map = {
        "totalAmount": "Total Consideration",
        "advancePaid": "Advance Paid",
        "balanceDue": "Balance Due",
        "stampDuty": "Stamp Duty",
        "registrationFee": "Registration Fee",
    }
    snake_map = {
        "totalAmount": "total_amount",
        "advancePaid": "advance_paid",
        "balanceDue": "balance_due",
        "stampDuty": "stamp_duty",
        "registrationFee": "registration_fee",
    }
    for field_name, candidates in field_candidates.items():
        if not candidates:
            details_kwargs[snake_map[field_name]] = None
            continue
        # Use the first (earliest) mention as the representative value;
        # any disagreement across mentions is left for the validation rules.
        primary = candidates[0]
        details_kwargs[snake_map[field_name]] = primary["value"]
        fields.append(
            ExtractedField(
                id=_field_id(),
                label=label_map[field_name],
                value=primary["value"],
                category="financial",
                confidence=0.7 if len(candidates) == 1 else 0.55,
                page_number=primary["page"],
                verified=False,
                evidence_snippet=primary["snippet"],
            )
        )

    payment_mode = None
    for kw in lx.PAYMENT_MODE_KEYWORDS:
        if kw in lowered:
            payment_mode = kw.upper() if len(kw) <= 4 else kw.title()
            break
    if payment_mode:
        details_kwargs["payment_mode"] = payment_mode
        idx = lowered.find(payment_mode.lower())
        fields.append(
            ExtractedField(
                id=_field_id(),
                label="Payment Mode",
                value=payment_mode,
                category="financial",
                confidence=0.6,
                page_number=joined.page_for_offset(idx) if idx >= 0 else None,
                verified=False,
            )
        )
    else:
        details_kwargs["payment_mode"] = None

    return FinancialDetails(**details_kwargs), fields, numeric_values_by_field


# ---------------------------------------------------------------------------
# Dates
# ---------------------------------------------------------------------------
def _normalize_textual_date(day: str, month_name: str, year: str) -> date | None:
    month = lx.MONTH_NAME_TO_NUM.get(month_name.lower())
    if not month:
        return None
    try:
        return date(int(year), month, int(day))
    except ValueError:
        return None


def _normalize_numeric_date(d: str, m: str, y: str) -> date | None:
    year = int(y)
    if year < 100:
        year += 2000 if year < 70 else 1900
    try:
        # Indian documents conventionally use DD/MM/YYYY.
        return date(year, int(m), int(d))
    except ValueError:
        return None


def extract_dates(joined: JoinedText) -> tuple[list[ImportantDate], dict[str, date]]:
    text = joined.full_text
    lowered = text.lower()

    matches: list[tuple[int, int, str, date | None]] = []
    for m in lx.DATE_TEXTUAL_RE.finditer(text):
        parsed = _normalize_textual_date(*m.groups())
        matches.append((m.start(), m.end(), m.group(0), parsed))
    for m in lx.DATE_NUMERIC_RE.finditer(text):
        parsed = _normalize_numeric_date(*m.groups())
        matches.append((m.start(), m.end(), m.group(0), parsed))
    matches.sort(key=lambda t: t[0])

    important_dates: list[ImportantDate] = []
    labeled: dict[str, date] = {}
    seen_raw: set[str] = set()

    for start, end, raw, parsed in matches:
        if raw in seen_raw:
            continue
        seen_raw.add(raw)

        context_lo = max(0, start - 50)
        context = lowered[context_lo:start]
        label = "Date Mentioned"
        for candidate_label, keywords in lx.DATE_CONTEXT_KEYWORDS.items():
            if any(kw in context for kw in keywords):
                label = candidate_label
                break

        if parsed and label != "Date Mentioned" and label not in labeled:
            labeled[label] = parsed

        important_dates.append(
            ImportantDate(
                label=label,
                date=raw,
                description=snippet(text, start, end, radius=60),
            )
        )

    return important_dates[:10], labeled


# ---------------------------------------------------------------------------
# Property identifiers / location
# ---------------------------------------------------------------------------
def extract_property_info(joined: JoinedText) -> list[ExtractedField]:
    text = joined.full_text
    fields: list[ExtractedField] = []
    seen: set[tuple[str, str]] = set()

    for label, pattern in lx.PROPERTY_ID_PATTERNS:
        for m in pattern.finditer(text):
            value = m.group(1).strip().strip(".,")
            key = (label, value.lower())
            if key in seen or not value:
                continue
            seen.add(key)
            idx = m.start()
            fields.append(
                ExtractedField(
                    id=_field_id(),
                    label=label,
                    value=value,
                    category="property",
                    confidence=0.75,
                    page_number=joined.page_for_offset(idx),
                    verified=False,
                    evidence_snippet=snippet(text, m.start(), m.end()),
                )
            )

    village_match = lx.VILLAGE_TALUKA_DISTRICT_RE.search(text)
    if village_match:
        village, taluka, district = (g.strip() for g in village_match.groups())
        idx = village_match.start()
        fields.append(
            ExtractedField(
                id=_field_id(),
                label="Property Location",
                value=f"Village {village}, Taluka {taluka}, District {district}",
                category="property",
                confidence=0.7,
                page_number=joined.page_for_offset(idx),
                verified=False,
                evidence_snippet=snippet(text, village_match.start(), village_match.end()),
            )
        )
    else:
        loc_match = lx.PROPERTY_LOCATION_RE.search(text)
        if loc_match:
            idx = loc_match.start()
            fields.append(
                ExtractedField(
                    id=_field_id(),
                    label="Property Location",
                    value=loc_match.group(1).strip(),
                    category="property",
                    confidence=0.5,
                    page_number=joined.page_for_offset(idx),
                    verified=False,
                    evidence_snippet=snippet(text, loc_match.start(), loc_match.end()),
                )
            )

    return fields


# ---------------------------------------------------------------------------
# Mortgage / encumbrance mentions
# ---------------------------------------------------------------------------
def extract_mortgage_mentions(joined: JoinedText) -> list[dict]:
    """Returns a list of {page, snippet, is_active_mention} dicts.

    is_active_mention distinguishes a real encumbrance reference from a
    negated "free from encumbrance" / "unencumbered" title-covenant clause,
    so we don't flag standard clean-title assurances as risks.
    """
    text = joined.full_text
    lowered = text.lower()
    mentions: list[dict] = []
    seen_spans: set[int] = set()

    for keyword in lx.MORTGAGE_KEYWORDS:
        start = 0
        while True:
            idx = lowered.find(keyword, start)
            if idx == -1:
                break
            start = idx + len(keyword)
            if idx in seen_spans:
                continue
            seen_spans.add(idx)
            negated = has_negation_nearby(text, idx, lx.NEGATION_MARKERS)
            mentions.append(
                {
                    "page": joined.page_for_offset(idx),
                    "snippet": snippet(text, idx, idx + len(keyword)),
                    "is_active_mention": not negated,
                    "offset": idx,
                }
            )
    return mentions


# ---------------------------------------------------------------------------
# Registration info
# ---------------------------------------------------------------------------
def extract_registration_info(joined: JoinedText) -> list[ExtractedField]:
    text = joined.full_text
    fields: list[ExtractedField] = []

    reg_match = lx.REGISTRATION_NUMBER_RE.search(text)
    if reg_match:
        idx = reg_match.start()
        fields.append(
            ExtractedField(
                id=_field_id(),
                label="Registration Reference",
                value=reg_match.group(2).strip(),
                category="legal",
                confidence=0.7,
                page_number=joined.page_for_offset(idx),
                verified=False,
                evidence_snippet=snippet(text, reg_match.start(), reg_match.end()),
            )
        )

    sro_match = lx.SUB_REGISTRAR_RE.search(text)
    if sro_match:
        idx = sro_match.start()
        office = sro_match.group(1).strip().strip(",.")
        if office:
            fields.append(
                ExtractedField(
                    id=_field_id(),
                    label="Sub-Registrar Office",
                    value=office,
                    category="legal",
                    confidence=0.55,
                    page_number=joined.page_for_offset(idx),
                    verified=False,
                    evidence_snippet=snippet(text, sro_match.start(), sro_match.end()),
                )
            )

    return fields
