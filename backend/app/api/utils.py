from __future__ import annotations

import re

from fastapi import HTTPException, status

ACCOUNT_KEY_PATTERN = re.compile(r"^(?:anonymous|(?:session|user):[A-Za-z0-9._:-]{8,160})$")


def resolve_account_key(
    *,
    account_key: str | None = None,
    client_id: str | None = None,
    fallback: str | None = None,
) -> str:
    explicit = [value.strip() for value in (account_key, client_id) if value]
    if len(set(explicit)) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account identifiers must match",
        )

    resolved = (account_key or client_id or fallback or "").strip()
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account key or client id is required",
        )

    if not ACCOUNT_KEY_PATTERN.fullmatch(resolved):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account key format",
        )

    return resolved
