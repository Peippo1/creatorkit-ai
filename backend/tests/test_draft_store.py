from __future__ import annotations

import os
import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from app.schemas.input import AnalyzeRequest
from app.services.history.store import list_saved_drafts, save_draft


class DraftStoreTests(unittest.TestCase):
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

    def _payload(self, platform: str, content_type: str, niche: str) -> AnalyzeRequest:
        return AnalyzeRequest(
            platform=platform,
            content_type=content_type,
            hook="Draft comparison should preserve this hook.",
            caption="A comparison-friendly draft snapshot.",
            transcript="A short script that makes the comparison easy to inspect.",
            duration_seconds=42,
            niche=niche,
            has_cta=True,
        )

    def test_save_and_list_drafts_by_client(self) -> None:
        first_time = datetime(2026, 2, 1, 9, 0, tzinfo=UTC)
        second_time = first_time + timedelta(minutes=10)

        save_draft("client-a", self._payload("TikTok", "Short-form video", "creators"), created_at=first_time)
        save_draft("client-b", self._payload("LinkedIn", "Post draft", "operators"), created_at=second_time)
        save_draft("client-a", self._payload("YouTube", "Long-form script", "education"), created_at=second_time)

        client_a_drafts = list_saved_drafts("client-a")
        client_b_drafts = list_saved_drafts("client-b")

        self.assertEqual([draft.title for draft in client_a_drafts], ["YouTube · Long-form script", "TikTok · Short-form video"])
        self.assertEqual(client_a_drafts[0].request.platform, "YouTube")
        self.assertEqual(client_a_drafts[1].request.content_type, "Short-form video")
        self.assertEqual(len(client_b_drafts), 1)
        self.assertEqual(client_b_drafts[0].request.niche, "operators")

    def test_list_drafts_respects_limit(self) -> None:
        base_time = datetime(2026, 2, 1, 9, 0, tzinfo=UTC)

        for index in range(6):
            save_draft(
                "client-a",
                self._payload("TikTok", "Short-form video", f"niche-{index}"),
                created_at=base_time + timedelta(minutes=index),
            )

        drafts = list_saved_drafts("client-a", limit=3)

        self.assertEqual(len(drafts), 3)
        self.assertEqual([draft.request.niche for draft in drafts], ["niche-5", "niche-4", "niche-3"])


if __name__ == "__main__":
    unittest.main()
