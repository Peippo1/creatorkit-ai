from fastapi import APIRouter, Header, Query

from ...schemas.drafts import SavedDraftResponse, SavedDraftsResponse
from ...schemas.input import AnalyzeRequest
from ...services.history.store import list_saved_drafts, save_draft
from ..utils import resolve_account_key

router = APIRouter(tags=["drafts"])


@router.post("/drafts", response_model=SavedDraftResponse)
def create_draft(
    payload: AnalyzeRequest,
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_account_key: str | None = Header(default=None, alias="X-Account-Key"),
) -> SavedDraftResponse:
    account_key = resolve_account_key(
        account_key=x_account_key,
        client_id=x_client_id,
        fallback="anonymous",
    )
    entry = save_draft(account_key, payload)
    return SavedDraftResponse(entry=entry)


@router.get("/drafts", response_model=SavedDraftsResponse)
def drafts(
    client_id: str | None = Query(default=None, min_length=1),
    account_key: str | None = Query(default=None, min_length=1),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_account_key: str | None = Header(default=None, alias="X-Account-Key"),
    limit: int = Query(10, ge=1, le=20),
) -> SavedDraftsResponse:
    resolved_key = resolve_account_key(
        account_key=account_key or x_account_key,
        client_id=client_id or x_client_id,
        fallback="anonymous",
    )
    return SavedDraftsResponse(entries=list_saved_drafts(resolved_key, limit))
