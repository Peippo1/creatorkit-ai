from fastapi import APIRouter, Header, Query, Request

from ..internal_auth import build_canonical_json, verify_internal_request
from ...schemas.drafts import SavedDraftResponse, SavedDraftsResponse
from ...schemas.input import AnalyzeRequest
from ...services.history.store import list_saved_drafts, save_draft
from ..utils import resolve_account_key

router = APIRouter(tags=["drafts"])


@router.post("/drafts", response_model=SavedDraftResponse)
def create_draft(
    payload: AnalyzeRequest,
    request: Request,
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_internal_assertion: str | None = Header(default=None, alias="X-Creatorkit-Assertion"),
) -> SavedDraftResponse:
    route = request.url.path + (f"?{request.url.query}" if request.url.query else "")
    internal_request = verify_internal_request(
        assertion=x_internal_assertion,
        method=request.method,
        route=route,
        body=build_canonical_json(payload.model_dump(mode="json")),
    )
    account_key = resolve_account_key(
        client_id=x_client_id,
        fallback="anonymous",
        trusted_account_key=internal_request.account_key if internal_request else None,
    )
    entry = save_draft(account_key, payload)
    return SavedDraftResponse(entry=entry)


@router.get("/drafts", response_model=SavedDraftsResponse)
def drafts(
    request: Request,
    client_id: str | None = Query(default=None, min_length=1),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_internal_assertion: str | None = Header(default=None, alias="X-Creatorkit-Assertion"),
    limit: int = Query(10, ge=1, le=20),
) -> SavedDraftsResponse:
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
    return SavedDraftsResponse(entries=list_saved_drafts(resolved_key, limit))
