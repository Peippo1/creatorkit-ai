from __future__ import annotations

import os
import tempfile
import unittest
from datetime import UTC, datetime
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.schemas.input import AnalyzeRequest
from app.schemas.output import AnalyzeResponse
from app.services.history.store import (
    ensure_creator_account,
    get_creator_account_summary,
    save_analysis,
    save_draft,
)


class CreatorAccountStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "analysis_history.sqlite3"
        self.original_db_path = os.environ.get("CREATORKIT_HISTORY_DB_PATH")
        os.environ["CREATORKIT_HISTORY_DB_PATH"] = str(self.db_path)

    def tearDown(self) -> None:
        if self.original_db_path is None:
            os.environ.pop("CREATORKIT_HISTORY_DB_PATH", None)
        else:
            os.environ["CREATORKIT_HISTORY_DB_PATH"] = self.original_db_path
        self.temp_dir.cleanup()

    def _payload(self) -> AnalyzeRequest:
        return AnalyzeRequest(
            platform="LinkedIn",
            content_type="Post draft",
            hook="Make the profile feel real.",
            caption="A creator account draft with enough context to compare.",
            transcript="A short draft that still looks like a real creator workflow.",
            duration_seconds=45,
            niche="creator tools",
            has_cta=True,
        )

    def _result(self) -> AnalyzeResponse:
        return AnalyzeResponse(
            overall_score=82,
            hook_score=84,
            clarity_score=79,
            platform_fit_score=81,
            strengths=["Strong hook"],
            risks=["None"],
            critique="This draft is close to publish-ready.",
            suggestions=["Tighten the opening slightly."],
        )

    def test_creator_account_is_created_and_scoped(self) -> None:
        timestamp = datetime(2026, 3, 1, 12, 0, tzinfo=UTC)

        ensure_creator_account(
            "user:creator-1",
            email="creator@example.com",
            display_name="Creator One",
            niche="education",
            brand_name="Studio One",
            preferred_platform="YouTube",
            created_at=timestamp,
        )
        save_analysis("user:creator-1", self._payload(), self._result(), created_at=timestamp)
        save_draft("user:creator-1", self._payload(), created_at=timestamp)

        summary = get_creator_account_summary("user:creator-1")

        self.assertEqual(summary.account.provider, "clerk")
        self.assertEqual(summary.account.display_name, "Creator One")
        self.assertEqual(summary.account.email, "creator@example.com")
        self.assertEqual(summary.account.brand_name, "Studio One")
        self.assertEqual(summary.analyses_count, 1)
        self.assertEqual(summary.drafts_count, 1)

    def test_creator_account_updates_preserve_existing_profile_values(self) -> None:
        timestamp = datetime(2026, 3, 1, 12, 0, tzinfo=UTC)

        ensure_creator_account(
            "user:creator-2",
            email="alpha@example.com",
            display_name="Alpha",
            niche="fitness",
            brand_name="Alpha Studio",
            preferred_platform="TikTok",
            created_at=timestamp,
        )
        ensure_creator_account("user:creator-2", niche="coaching")

        summary = get_creator_account_summary("user:creator-2")

        self.assertEqual(summary.account.display_name, "Alpha")
        self.assertEqual(summary.account.email, "alpha@example.com")
        self.assertEqual(summary.account.niche, "coaching")
        self.assertEqual(summary.account.brand_name, "Alpha Studio")


if __name__ == "__main__":
    unittest.main()
