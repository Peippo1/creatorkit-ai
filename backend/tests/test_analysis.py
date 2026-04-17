from __future__ import annotations

import unittest
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.schemas.input import AnalyzeRequest
from app.services.critique.feedback import build_feedback
from app.services.scoring.predictor import score_submission


class AnalysisHeuristicsTests(unittest.TestCase):
    def test_strong_short_form_draft_scores_well(self) -> None:
        payload = AnalyzeRequest(
            platform="TikTok",
            content_type="Short-form video",
            hook="Most creators miss this one edit before publishing.",
            caption="A fast creator-focused draft with a clear pre-publish takeaway.",
            transcript="Use one specific opening, give the viewer a reason to care, and end with a clear action.",
            duration_seconds=35,
            niche="creator education",
            has_cta=True,
        )

        scores = score_submission(payload)
        feedback = build_feedback(payload, scores)

        self.assertGreaterEqual(scores["overall_score"], 65)
        self.assertGreaterEqual(scores["hook_score"], 65)
        self.assertIn("clear next step", " ".join(feedback["strengths"]).lower())

    def test_weak_draft_surfaces_clear_fix_themes(self) -> None:
        payload = AnalyzeRequest(
            platform="YouTube",
            content_type="Long-form script",
            hook="Interesting stuff.",
            caption="",
            transcript="",
            duration_seconds=420,
            niche="marketing",
            has_cta=False,
        )

        scores = score_submission(payload)
        feedback = build_feedback(payload, scores)

        self.assertLess(scores["overall_score"], 60)
        self.assertTrue(any("CTA" in item or "call to action" in item for item in feedback["suggestions"]))
        self.assertTrue(any("opening" in item.lower() or "hook" in item.lower() for item in feedback["risks"]))


if __name__ == "__main__":
    unittest.main()
