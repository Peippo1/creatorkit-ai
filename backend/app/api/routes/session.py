from fastapi import APIRouter, Header, HTTPException, Request, status

from ..rate_limit import enforce_rate_limit
from ..internal_auth import verify_internal_request
from ...schemas.session import SessionClearResponse
from ...services.history.store import delete_session_data
from ..utils import resolve_account_key

router = APIRouter(tags=["session"])


@router.delete("/session", response_model=SessionClearResponse)
def clear_session(
    request: Request,
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_internal_assertion: str | None = Header(default=None, alias="X-Creatorkit-Assertion"),
) -> SessionClearResponse:
    route = request.url.path + (f"?{request.url.query}" if request.url.query else "")
    internal_request = verify_internal_request(
        assertion=x_internal_assertion,
        method=request.method,
        route=route,
        body=b"",
    )
    resolved_key = resolve_account_key(
        client_id=x_client_id,
        trusted_account_key=internal_request.account_key if internal_request else None,
    )
    if not resolved_key.startswith("session:"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only anonymous browser sessions can be cleared",
        )

    enforce_rate_limit("session-clear", resolved_key, limit=5, window_seconds=60)
    cleared = delete_session_data(resolved_key)
    return SessionClearResponse(**cleared)
