from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass

from fastapi import HTTPException, status

INTERNAL_ASSERTION_HEADER = "X-Creatorkit-Assertion"
INTERNAL_API_SECRET_ENV = "CREATORKIT_INTERNAL_API_SECRET"
INTERNAL_ASSERTION_TTL_SECONDS = 300


@dataclass(frozen=True)
class InternalRequestClaims:
    sub: str
    account_key: str
    route: str
    method: str
    body_sha256: str
    issued_at: int


def _decode_base64url(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("utf-8"))


def _canonical_body_digest(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def _internal_secret() -> bytes:
    secret = os.getenv(INTERNAL_API_SECRET_ENV)
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal auth is not configured",
        )
    return secret.encode("utf-8")


def build_canonical_json(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
        "utf-8"
    )


def verify_internal_request(
    *,
    assertion: str | None,
    method: str,
    route: str,
    body: bytes,
) -> InternalRequestClaims | None:
    if not assertion:
        return None

    try:
        payload_part, signature_part = assertion.split(".", 1)
        payload_bytes = _decode_base64url(payload_part)
        signature = _decode_base64url(signature_part)
        payload = json.loads(payload_bytes)
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError, binascii.Error):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal authorization",
        ) from None

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal authorization",
        )

    expected_signature = hmac.new(_internal_secret(), payload_bytes, hashlib.sha256).digest()
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal authorization",
        )

    try:
        claims = InternalRequestClaims(
            sub=str(payload["sub"]),
            account_key=str(payload["account_key"]),
            route=str(payload["route"]),
            method=str(payload["method"]),
            body_sha256=str(payload["body_sha256"]),
            issued_at=int(payload["ts"]),
        )
    except (KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal authorization",
        ) from None

    if claims.method.upper() != method.upper():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Internal authorization does not match this request",
        )

    if claims.route != route:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Internal authorization does not match this request",
        )

    if claims.account_key != f"user:{claims.sub}":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Internal authorization does not match this request",
        )

    if claims.body_sha256 != _canonical_body_digest(body):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Internal authorization does not match this request",
        )

    now = int(time.time())
    if claims.issued_at > now + 30 or now - claims.issued_at > INTERNAL_ASSERTION_TTL_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Internal authorization has expired",
        )

    return claims
