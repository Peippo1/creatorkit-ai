from __future__ import annotations

from fastapi import HTTPException, status


def resolve_account_key(
    *,
    account_key: str | None = None,
    client_id: str | None = None,
    fallback: str | None = None,
) -> str:
    resolved = account_key or client_id or fallback
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account key or client id is required",
        )
    return resolved
