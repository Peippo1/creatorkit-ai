from fastapi import APIRouter, Header, Query, Request

from ..rate_limit import enforce_rate_limit
from ..internal_auth import verify_internal_request
from ...schemas.history import AnalysisHistoryResponse
from ...services.history.store import list_recent_analyses
from ..utils import resolve_account_key

router = APIRouter(tags=["history"])


@router.get("/history", response_model=AnalysisHistoryResponse)
def history(
    request: Request,
    client_id: str | None = Query(default=None, min_length=1),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_internal_assertion: str | None = Header(default=None, alias="X-Creatorkit-Assertion"),
    limit: int = Query(5, ge=1, le=20),
) -> AnalysisHistoryResponse:
    route = request.url.path + (f"?{request.url.query}" if request.url.query else "")
    internal_request = verify_internal_request(
        assertion=x_internal_assertion,
        method=request.method,
        route=route,
        body=b"",
    )
    resolved_key = resolve_account_key(
        client_id=client_id or x_client_id,
        fallback="anonymous",
        trusted_account_key=internal_request.account_key if internal_request else None,
    )
    enforce_rate_limit("history", resolved_key, limit=30, window_seconds=60)
    return AnalysisHistoryResponse(entries=list_recent_analyses(resolved_key, limit))
