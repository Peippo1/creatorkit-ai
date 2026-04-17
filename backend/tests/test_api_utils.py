from __future__ import annotations

import unittest
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from fastapi import HTTPException

from app.api.utils import resolve_account_key


class ApiUtilsTests(unittest.TestCase):
    def test_resolve_account_key_rejects_mismatched_identifiers(self) -> None:
        with self.assertRaises(HTTPException):
            resolve_account_key(account_key="user:abc12345", client_id="session:abc12345")

    def test_resolve_account_key_rejects_invalid_format(self) -> None:
        with self.assertRaises(HTTPException):
            resolve_account_key(account_key="user key with spaces")

    def test_resolve_account_key_allows_fallback_identity(self) -> None:
        self.assertEqual(resolve_account_key(fallback="anonymous"), "anonymous")


if __name__ == "__main__":
    unittest.main()
