from __future__ import annotations

import unittest
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.env import EnvValidationError, validate_backend_env
from app.core.redaction import REDACTED, redact_for_log


class SecurityEnvTests(unittest.TestCase):
    def test_backend_env_rejects_public_secret_names(self) -> None:
        with self.assertRaises(EnvValidationError):
            validate_backend_env({"NEXT_PUBLIC_OPENAI_API_KEY": "sk-test"})

    def test_backend_env_allows_empty_public_secret_placeholders(self) -> None:
        env = validate_backend_env({"NEXT_PUBLIC_OPENAI_API_KEY": ""})

        self.assertIsNone(env.internal_api_secret)

    def test_backend_env_rejects_short_internal_secret_when_set(self) -> None:
        with self.assertRaises(EnvValidationError):
            validate_backend_env({"CREATORKIT_INTERNAL_API_SECRET": "short"})

    def test_redact_for_log_redacts_sensitive_keys_and_openai_values(self) -> None:
        value = {
            "status": "failed",
            "openai_api_key": "sk-secret-value",
            "headers": {"authorization": "Bearer secret"},
            "items": [{"token": "abc"}, "prefix sk-abcdefghijklmnopqrstuvwxyz123456 suffix", "safe"],
        }

        redacted = redact_for_log(value)

        self.assertEqual(redacted["status"], "failed")
        self.assertEqual(redacted["openai_api_key"], REDACTED)
        self.assertEqual(redacted["headers"]["authorization"], REDACTED)
        self.assertEqual(redacted["items"][0]["token"], REDACTED)
        self.assertEqual(redacted["items"][1], f"prefix {REDACTED} suffix")
        self.assertEqual(redacted["items"][2], "safe")


if __name__ == "__main__":
    unittest.main()
