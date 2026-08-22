"""Shared helpers for locating matches within a multi-page document and
building small, honest evidence snippets around them.
"""
from dataclasses import dataclass

from app.schemas.document import DocumentPage


@dataclass(frozen=True)
class PageSpan:
    page_number: int
    start: int
    end: int  # exclusive, offset into the joined full_text


@dataclass(frozen=True)
class JoinedText:
    full_text: str
    spans: list[PageSpan]

    def page_for_offset(self, offset: int) -> int:
        for span in self.spans:
            if span.start <= offset < span.end:
                return span.page_number
        return self.spans[-1].page_number if self.spans else 1


def join_pages(pages: list[DocumentPage]) -> JoinedText:
    """Concatenate page text with a separator, tracking each page's offsets
    so any match found in the joined text can be attributed back to a page.
    """
    parts: list[str] = []
    spans: list[PageSpan] = []
    cursor = 0
    for page in pages:
        text = page.text or ""
        start = cursor
        parts.append(text)
        cursor += len(text)
        spans.append(PageSpan(page_number=page.page_number, start=start, end=cursor))
        # Separator between pages so cross-page substring matches don't glue
        # unrelated sentences together.
        parts.append("\n\n")
        cursor += 2
    return JoinedText(full_text="".join(parts), spans=spans)


def snippet(text: str, start: int, end: int, radius: int = 90, max_len: int = 220) -> str:
    """A short, faithful excerpt of the source text around a match."""
    lo = max(0, start - radius)
    hi = min(len(text), end + radius)
    excerpt = text[lo:hi].strip()
    excerpt = " ".join(excerpt.split())  # collapse whitespace/newlines
    if len(excerpt) > max_len:
        excerpt = excerpt[:max_len].rstrip() + "…"
    prefix = "…" if lo > 0 else ""
    return f"{prefix}{excerpt}"


def has_negation_nearby(text: str, match_start: int, markers: list[str], window: int = 45) -> bool:
    lo = max(0, match_start - window)
    context = text[lo:match_start].lower()
    return any(marker in context for marker in markers)


def parse_amount(raw: str) -> float | None:
    try:
        return float(raw.replace(",", ""))
    except (ValueError, AttributeError):
        return None


def amounts_roughly_equal(a: float, b: float, tolerance: float = 0.02) -> bool:
    if a == 0 and b == 0:
        return True
    denom = max(abs(a), abs(b), 1.0)
    return abs(a - b) / denom <= tolerance
