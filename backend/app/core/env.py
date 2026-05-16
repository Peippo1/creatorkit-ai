from __future__ import annotations

import os
from dataclasses import dataclass


class EnvValidationError(RuntimeError):
    pass


SECRET_NAME_MARKERS = (
    "API_KEY",
    "OPENAI_KEY",
    "OPENAI_API_KEY",
    "PASSWORD",
    "PRIVATE_KEY",
    "SECRET",
    "TOKEN",
)

INTERNAL_API_SECRET_ENV = "CREATORKIT_INTERNAL_API_SECRET"


@dataclass(frozen=True)
class BackendEnv:
    internal_api_secret: str | None


def _is_secret_name(name: str) -> bool:
    upper_name = name.upper()
    return any(marker in upper_name for marker in SECRET_NAME_MARKERS)


def validate_backend_env(environ: dict[str, str] | None = None) -> BackendEnv:
    source = environ if environ is not None else os.environ
    public_secrets = sorted(
        name
        for name, value in source.items()
        if value and name.startswith("NEXT_PUBLIC_") and _is_secret_name(name)
    )
    if public_secrets:
        raise EnvValidationError(
            "Secret-like environment variables must not use NEXT_PUBLIC_: "
            + ", ".join(public_secrets)
        )

    internal_api_secret = source.get(INTERNAL_API_SECRET_ENV)
    if internal_api_secret is not None and len(internal_api_secret.strip()) < 8:
        raise EnvValidationError(f"{INTERNAL_API_SECRET_ENV} must be at least 8 characters when set")

    return BackendEnv(internal_api_secret=internal_api_secret)


def get_internal_api_secret() -> str | None:
    return validate_backend_env().internal_api_secret
