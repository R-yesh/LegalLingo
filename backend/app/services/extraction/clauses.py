"""Clause segmentation and categorization.

Splits each page's extracted text into clause-like segments (using numbered
heading conventions common in Indian legal documents, falling back to
paragraph breaks when no numbering is present), then tags each segment with
one of eleven internal categories via keyword scoring.
"""
import uuid

from app.schemas.clause import Clause
from app.schemas.document import DocumentPage

from app.services.extraction import lexicon as lx
from app.services.extraction.templates import get_template

MAX_ORIGINAL_TEXT = 900


def _clause_id() -> str:
    return f"cl-{uuid.uuid4().hex[:10]}"


def _segment_page(page: DocumentPage) -> list[tuple[str | None, str, str]]:
    """Returns a list of (clause_number_or_None, heading_or_empty, body)."""
    lines = (page.text or "").splitlines()
    segments: list[tuple[str | None, str, str]] = []
    current_number: str | None = None
    current_heading = ""
    current_body: list[str] = []

    def flush():
        body = "\n".join(current_body).strip()
        if body or current_heading:
            segments.append((current_number, current_heading, body))

    for line in lines:
        stripped = line.strip()
        heading_match = lx.HEADING_RE.match(stripped)
        if heading_match:
            flush()
            current_number = heading_match.group(1)
            current_heading = heading_match.group(2).strip()
            current_body = []
        else:
            if stripped:
                current_body.append(stripped)
    flush()

    if not segments:
        # No numbered headings detected -- fall back to paragraph chunks so
        # clause detection still produces something, with lower confidence
        # reflected by the caller.
        paragraphs = [p.strip() for p in (page.text or "").split("\n\n") if p.strip()]
        segments = [(None, "", p) for p in paragraphs]

    return segments


def _score_category(text: str) -> str:
    lowered = text.lower()
    best_category = "general"
    best_score = 0
    for category in lx.CLAUSE_CATEGORY_PRIORITY:
        keywords = lx.CLAUSE_CATEGORY_KEYWORDS[category]
        score = sum(lowered.count(kw) for kw in keywords)
        if score > best_score:
            best_score = score
            best_category = category
    return best_category if best_score > 0 else "general"


def _severity_for(internal_category: str, negated: bool) -> str:
    if internal_category == "mortgage_encumbrance":
        return "VERIFIED" if negated else "HIGH ATTENTION"
    if internal_category in {"forfeiture", "termination", "dispute_jurisdiction"}:
        return "REVIEW"
    return "STANDARD"


def build_clauses(pages: list[DocumentPage]) -> list[Clause]:
    clauses: list[Clause] = []

    for page in pages:
        segments = _segment_page(page)
        fallback_index = 0

        for number, heading, body in segments:
            if not body:
                continue

            internal_category = _score_category(f"{heading} {body}")
            template = get_template(internal_category)
            frontend_category = lx.CLAUSE_CATEGORY_TO_FRONTEND.get(internal_category, "general")

            negated = False
            if internal_category == "mortgage_encumbrance":
                lowered_body = body.lower()
                first_hit = min(
                    (lowered_body.find(kw) for kw in lx.MORTGAGE_KEYWORDS if kw in lowered_body),
                    default=-1,
                )
                if first_hit >= 0:
                    window = lowered_body[max(0, first_hit - 45):first_hit]
                    negated = any(marker in window for marker in lx.NEGATION_MARKERS)

            if number is not None:
                clause_number = number
                confidence = 0.7
            else:
                fallback_index += 1
                clause_number = f"p{page.page_number}.{fallback_index}"
                confidence = 0.4  # unstructured fallback segmentation is less reliable

            title = heading if heading else template["title"]["en"]
            original_text = body if len(body) <= MAX_ORIGINAL_TEXT else body[:MAX_ORIGINAL_TEXT].rstrip() + "…"

            clauses.append(
                Clause(
                    id=_clause_id(),
                    clause_number=clause_number,
                    title=title,
                    original_text=original_text,
                    simple_meaning=template["simple_meaning"],
                    why_it_matters=template["why_it_matters"],
                    what_to_verify=template["what_to_verify"],
                    severity=_severity_for(internal_category, negated),
                    page_number=page.page_number,
                    confidence=confidence,
                    category=frontend_category,
                )
            )

    return clauses
