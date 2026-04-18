from __future__ import annotations

import re

from fastapi import HTTPException, status

ACCOUNT_KEY_PATTERN = re.compile(r"^(?:anonymous|(?:session|user):[A-Za-z0-9._:-]{8,160})$")


def resolve_account_key(
    *,
    account_key: str | None = None,
    client_id: str | None = None,
    fallback: str | None = None,
    trusted_account_key: str | None = None,
    require_trusted_user: bool = False,
) -> str:
    explicit = [value.strip() for value in (account_key, client_id) if value]

    if trusted_account_key is not None:
        if explicit and any(value != trusted_account_key for value in explicit):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account identifiers must match",
            )

        if not ACCOUNT_KEY_PATTERN.fullmatch(trusted_account_key):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid account key format",
            )

        if not trusted_account_key.startswith("user:"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Trusted requests must use a user account",
            )

        return trusted_account_key

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

    if resolved.startswith("user:"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signed-in requests must be proxied through the web app",
        )

    if require_trusted_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signed-in requests must be proxied through the web app",
        )

    return resolved
