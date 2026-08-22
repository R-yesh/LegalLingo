"""Validation result schema.

This is a backend-only concept (the frontend has no equivalent type): the
outcome of validating an extracted Document before it is handed to the
analysis service.
"""
from app.schemas.base import CamelModel


class ValidationResult(CamelModel):
    is_valid: bool
    errors: list[str] = []
    warnings: list[str] = []
