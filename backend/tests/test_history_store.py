from __future__ import annotations

import os
import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from app.schemas.input import AnalyzeRequest
from app.schemas.output import AnalyzeResponse
from app.services.history.store import list_recent_analyses, save_analysis


class AnalysisHistoryStoreTests(unittest.TestCase):
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

    def _payload(self, platform: str = "TikTok") -> AnalyzeRequest:
        return AnalyzeRequest(
            platform=platform,
            content_type="Short-form video",
            hook="Make the edit obvious.",
            caption="A short test caption.",
            transcript="One quick idea, one clear reason to care, and one direct action.",
            duration_seconds=30,
            niche="creators",
            has_cta=True,
        )

    def _result(self, suggestion: str) -> AnalyzeResponse:
        return AnalyzeResponse(
            overall_score=81,
            hook_score=84,
            clarity_score=77,
            platform_fit_score=79,
            strengths=["Hook is strong"],
            risks=["None"],
            critique="This draft is close to publish-ready.",
            suggestions=[suggestion, "Keep the CTA direct."],
        )

    def test_save_and_list_history_by_client(self) -> None:
        first_time = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
        second_time = first_time + timedelta(minutes=5)

        save_analysis("client-a", self._payload("TikTok"), self._result("First fix"), created_at=first_time)
        save_analysis("client-b", self._payload("LinkedIn"), self._result("Second fix"), created_at=second_time)
        save_analysis("client-a", self._payload("YouTube"), self._result("Third fix"), created_at=second_time)

        client_a_history = list_recent_analyses("client-a")
        client_b_history = list_recent_analyses("client-b")

        self.assertEqual([entry.top_suggestion for entry in client_a_history], ["Third fix", "First fix"])
        self.assertEqual(len(client_b_history), 1)
        self.assertEqual(client_b_history[0].platform, "LinkedIn")
        self.assertEqual(client_b_history[0].top_suggestion, "Second fix")

    def test_list_history_respects_limit(self) -> None:
        base_time = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)

        for index in range(7):
            save_analysis(
                "client-a",
                self._payload(),
                self._result(f"Fix {index}"),
                created_at=base_time + timedelta(minutes=index),
            )

        history = list_recent_analyses("client-a", limit=5)

        self.assertEqual(len(history), 5)
        self.assertEqual([entry.top_suggestion for entry in history], ["Fix 6", "Fix 5", "Fix 4", "Fix 3", "Fix 2"])


if __name__ == "__main__":
    unittest.main()
