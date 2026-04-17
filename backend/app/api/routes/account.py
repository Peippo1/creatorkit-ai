from __future__ import annotations

from fastapi import APIRouter, Header

from ...schemas.account import CreatorAccountResponse, CreatorAccountUpdate
from ...services.history.store import ensure_creator_account, get_creator_account_summary
from ..utils import resolve_account_key

router = APIRouter(tags=["account"])


@router.get("/account", response_model=CreatorAccountResponse)
def get_account(
    client_id: str | None = None,
    account_key: str | None = None,
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_account_key: str | None = Header(default=None, alias="X-Account-Key"),
    x_account_email: str | None = Header(default=None, alias="X-Account-Email"),
    x_account_name: str | None = Header(default=None, alias="X-Account-Name"),
) -> CreatorAccountResponse:
    resolved_key = resolve_account_key(
        account_key=account_key or x_account_key,
        client_id=client_id or x_client_id,
    )
    ensure_creator_account(
        resolved_key,
        email=x_account_email,
        display_name=x_account_name,
    )
    return get_creator_account_summary(resolved_key)


@router.patch("/account", response_model=CreatorAccountResponse)
def update_account(
    payload: CreatorAccountUpdate,
    client_id: str | None = None,
    account_key: str | None = None,
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_account_key: str | None = Header(default=None, alias="X-Account-Key"),
    x_account_email: str | None = Header(default=None, alias="X-Account-Email"),
    x_account_name: str | None = Header(default=None, alias="X-Account-Name"),
) -> CreatorAccountResponse:
    resolved_key = resolve_account_key(
        account_key=account_key or x_account_key,
        client_id=client_id or x_client_id,
    )
    ensure_creator_account(
        resolved_key,
        email=payload.email or x_account_email,
        display_name=payload.display_name or x_account_name,
        niche=payload.niche,
        brand_name=payload.brand_name,
        preferred_platform=payload.preferred_platform,
    )
    return get_creator_account_summary(resolved_key)
