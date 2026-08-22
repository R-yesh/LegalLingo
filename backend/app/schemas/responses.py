"""Small reusable response envelopes."""
from app.schemas.base import CamelModel


class HealthResponse(CamelModel):
    status: str
    service: str


class ErrorResponse(CamelModel):
    detail: str
    errors: list[str] = []
