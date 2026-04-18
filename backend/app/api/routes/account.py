from __future__ import annotations

from fastapi import APIRouter, Header, Request

from ..internal_auth import build_canonical_json, verify_internal_request
from ...schemas.account import CreatorAccountResponse, CreatorAccountUpdate
from ...services.history.store import ensure_creator_account, get_creator_account_summary
from ..utils import resolve_account_key

router = APIRouter(tags=["account"])


@router.get("/account", response_model=CreatorAccountResponse)
def get_account(
    request: Request,
    x_account_email: str | None = Header(default=None, alias="X-Account-Email"),
    x_account_name: str | None = Header(default=None, alias="X-Account-Name"),
    x_internal_assertion: str | None = Header(default=None, alias="X-Creatorkit-Assertion"),
) -> CreatorAccountResponse:
    route = request.url.path + (f"?{request.url.query}" if request.url.query else "")
    internal_request = verify_internal_request(
        assertion=x_internal_assertion,
        method=request.method,
        route=route,
        body=b"",
    )
    resolved_key = resolve_account_key(
        trusted_account_key=internal_request.account_key if internal_request else None,
        require_trusted_user=True,
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
    request: Request,
    x_account_email: str | None = Header(default=None, alias="X-Account-Email"),
    x_account_name: str | None = Header(default=None, alias="X-Account-Name"),
    x_internal_assertion: str | None = Header(default=None, alias="X-Creatorkit-Assertion"),
) -> CreatorAccountResponse:
    route = request.url.path + (f"?{request.url.query}" if request.url.query else "")
    internal_request = verify_internal_request(
        assertion=x_internal_assertion,
        method=request.method,
        route=route,
        body=build_canonical_json(payload.model_dump(mode="json")),
    )
    resolved_key = resolve_account_key(
        trusted_account_key=internal_request.account_key if internal_request else None,
        require_trusted_user=True,
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
