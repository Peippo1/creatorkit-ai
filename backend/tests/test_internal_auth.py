from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
import unittest
from pathlib import Path
from unittest.mock import patch
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from fastapi import HTTPException

from app.api.internal_auth import (
    INTERNAL_API_SECRET_ENV,
    build_canonical_json,
    verify_internal_request,
)


def _encode_base64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("utf-8")


def _build_assertion(
    *,
    secret: str,
    sub: str,
    account_key: str,
    route: str,
    method: str,
    body: bytes,
    ts: int | None = None,
) -> str:
    issued_at = ts if ts is not None else int(time.time())
    payload = {
        "account_key": account_key,
        "body_sha256": hashlib.sha256(body).hexdigest(),
        "method": method,
        "nonce": "test-nonce",
        "route": route,
        "sub": sub,
        "ts": issued_at,
        "v": 1,
    }
    payload_bytes = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
        "utf-8"
    )
    signature = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).digest()
    return f"{_encode_base64url(payload_bytes)}.{_encode_base64url(signature)}"


class InternalAuthTests(unittest.TestCase):
    def test_verify_internal_request_allows_valid_assertion(self) -> None:
        body = build_canonical_json({"hook": "Hello", "platform": "TikTok"})
        assertion = _build_assertion(
            secret="dev-secret",
            sub="user_123",
            account_key="user:user_123",
            route="/analyze",
            method="POST",
            body=body,
        )

        with patch.dict("os.environ", {INTERNAL_API_SECRET_ENV: "dev-secret"}, clear=False):
            claims = verify_internal_request(
                assertion=assertion,
                method="POST",
                route="/analyze",
                body=body,
            )

        self.assertIsNotNone(claims)
        self.assertEqual(claims.account_key, "user:user_123")
        self.assertEqual(claims.sub, "user_123")

    def test_verify_internal_request_rejects_route_mismatch(self) -> None:
        body = build_canonical_json({"hook": "Hello", "platform": "TikTok"})
        assertion = _build_assertion(
            secret="dev-secret",
            sub="user_123",
            account_key="user:user_123",
            route="/analyze",
            method="POST",
            body=body,
        )

        with patch.dict("os.environ", {INTERNAL_API_SECRET_ENV: "dev-secret"}, clear=False):
            with self.assertRaises(HTTPException):
                verify_internal_request(
                    assertion=assertion,
                    method="POST",
                    route="/drafts",
                    body=body,
                )

    def test_verify_internal_request_rejects_body_tamper(self) -> None:
        body = build_canonical_json({"hook": "Hello", "platform": "TikTok"})
        assertion = _build_assertion(
            secret="dev-secret",
            sub="user_123",
            account_key="user:user_123",
            route="/analyze",
            method="POST",
            body=body,
        )

        with patch.dict("os.environ", {INTERNAL_API_SECRET_ENV: "dev-secret"}, clear=False):
            with self.assertRaises(HTTPException):
                verify_internal_request(
                    assertion=assertion,
                    method="POST",
                    route="/analyze",
                    body=build_canonical_json({"hook": "Tampered", "platform": "TikTok"}),
                )


if __name__ == "__main__":
    unittest.main()
