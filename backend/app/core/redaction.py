from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from typing import Any


REDACTED = "[REDACTED]"
SENSITIVE_KEY_MARKERS = (
    "api_key",
    "authorization",
    "cookie",
    "openai",
    "password",
    "private_key",
    "secret",
    "token",
)
SECRET_LITERAL_PATTERNS = (re.compile(r"sk-[A-Za-z0-9_-]{20,}"),)


def _is_sensitive_key(key: str) -> bool:
    normalized = key.lower().replace("-", "_")
    return any(marker in normalized for marker in SENSITIVE_KEY_MARKERS)


def _redact_sensitive_values(value: str) -> str:
    redacted = value
    for pattern in SECRET_LITERAL_PATTERNS:
        redacted = pattern.sub(REDACTED, redacted)
    return redacted


def redact_for_log(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {
            key: REDACTED if _is_sensitive_key(str(key)) else redact_for_log(item)
            for key, item in value.items()
        }

    if isinstance(value, str):
        return _redact_sensitive_values(value)

    if isinstance(value, Sequence) and not isinstance(value, (bytes, bytearray, str)):
        return [redact_for_log(item) for item in value]

    return value
