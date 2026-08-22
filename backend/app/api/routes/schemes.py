from typing import Optional

from fastapi import APIRouter, Query

from app.schemas.scheme import Scheme
from app.services.schemes import SchemeService

router = APIRouter(tags=["schemes"])

_service = SchemeService()


@router.get("/schemes", response_model=list[Scheme])
def list_schemes(
    state: Optional[str] = Query(default=None, description="Filter to a state, or 'All' / omitted for every scheme."),
    occupation: Optional[str] = Query(default=None, description="Accepted for the frontend filter UI; not yet used to compute eligibility."),
    income_bracket: Optional[str] = Query(default=None, alias="incomeBracket"),
    area_type: Optional[str] = Query(default=None, alias="areaType"),
) -> list[Scheme]:
    """Return the curated government welfare-scheme catalogue.

    Only `state` is used to filter results — occupation/income/area-type are
    accepted but not used to compute a match, since this service has no real
    eligibility rules to evaluate for those. See each Scheme's `eligibility`
    field for what a citizen should verify themselves.
    """
    return _service.list_schemes(
        state=state,
        occupation=occupation,
        income_bracket=income_bracket,
        area_type=area_type,
    )
