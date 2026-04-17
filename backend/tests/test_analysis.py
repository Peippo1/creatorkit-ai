from __future__ import annotations

import unittest
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.schemas.input import AnalyzeRequest
from app.services.critique.feedback import build_feedback, rewrite_hook
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
        self.assertEqual(len(feedback["rewritten_hooks"]), 3)
        self.assertTrue(all(item for item in feedback["rewritten_hooks"]))

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

    def test_text_first_post_prefers_concise_platform_native_copy(self) -> None:
        payload = AnalyzeRequest(
            platform="LinkedIn",
            content_type="Post draft",
            hook="Turn one draft into a sharper post.",
            caption="A concise post for operators who want a cleaner draft and a sharper angle.",
            transcript="The goal is to make the point quickly, keep the structure tight, and end with a useful next step.",
            duration_seconds=50,
            niche="founders",
            has_cta=True,
        )

        scores = score_submission(payload)
        feedback = build_feedback(payload, scores)

        self.assertGreaterEqual(scores["clarity_score"], 60)
        self.assertGreaterEqual(scores["platform_fit_score"], 60)
        self.assertTrue(
            any("platform-native" in item.lower() or "concise" in item.lower() for item in feedback["suggestions"])
        )

    def test_long_form_script_with_mixed_lengths_scores_as_a_publishable_draft(self) -> None:
        payload = AnalyzeRequest(
            platform="YouTube",
            content_type="Long-form script",
            hook="Here is the edit that makes viewers stay.",
            caption="A compact summary that tees up the long-form argument.",
            transcript=(
                "Start with the problem, explain why the current approach wastes time, show the better "
                "workflow in plain steps, add one quick example from a real creator, and close by "
                "telling the viewer exactly what to change in their next draft and why it matters."
            ),
            duration_seconds=180,
            niche="creator education",
            has_cta=True,
        )

        scores = score_submission(payload)
        feedback = build_feedback(payload, scores)

        self.assertGreaterEqual(scores["overall_score"], 65)
        self.assertGreaterEqual(scores["clarity_score"], 70)
        self.assertTrue(any("longer-form platform" in item.lower() for item in feedback["strengths"]))

    def test_rewrite_hook_returns_three_platform_aware_variations(self) -> None:
        rewritten = rewrite_hook(
            "Most founders miss this one pitch mistake.",
            platform="LinkedIn",
            niche="founders",
        )

        self.assertEqual(len(rewritten), 3)
        self.assertTrue(any("LinkedIn" in item for item in rewritten))
        self.assertTrue(any("founders" in item.lower() for item in rewritten))


if __name__ == "__main__":
    unittest.main()
