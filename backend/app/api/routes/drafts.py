from fastapi import APIRouter, Header, Query

from ...schemas.drafts import SavedDraftResponse, SavedDraftsResponse
from ...schemas.input import AnalyzeRequest
from ...services.history.store import list_saved_drafts, save_draft

router = APIRouter(tags=["drafts"])


@router.post("/drafts", response_model=SavedDraftResponse)
def create_draft(
    payload: AnalyzeRequest,
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> SavedDraftResponse:
    entry = save_draft(x_client_id or "anonymous", payload)
    return SavedDraftResponse(entry=entry)


@router.get("/drafts", response_model=SavedDraftsResponse)
def drafts(
    client_id: str = Query("anonymous", min_length=1),
    limit: int = Query(10, ge=1, le=20),
) -> SavedDraftsResponse:
    return SavedDraftsResponse(entries=list_saved_drafts(client_id, limit))
