from fastapi import APIRouter, Header, Query

from ...schemas.history import AnalysisHistoryResponse
from ...services.history.store import list_recent_analyses
from ..utils import resolve_account_key

router = APIRouter(tags=["history"])


@router.get("/history", response_model=AnalysisHistoryResponse)
def history(
    client_id: str | None = Query(default=None, min_length=1),
    account_key: str | None = Query(default=None, min_length=1),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_account_key: str | None = Header(default=None, alias="X-Account-Key"),
    limit: int = Query(5, ge=1, le=20),
) -> AnalysisHistoryResponse:
    resolved_key = resolve_account_key(
        account_key=account_key or x_account_key,
        client_id=client_id or x_client_id,
        fallback="anonymous",
    )
    return AnalysisHistoryResponse(entries=list_recent_analyses(resolved_key, limit))
