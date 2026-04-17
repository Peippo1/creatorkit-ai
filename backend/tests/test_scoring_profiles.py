from __future__ import annotations

import unittest
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.schemas.input import AnalyzeRequest
from app.services.scoring.profiles import (
    LONG_FORM_PROFILE,
    SHORT_FORM_PROFILE,
    TEXT_FIRST_PROFILE,
    calculate_overall_score,
    select_scoring_profile,
)


class ScoringProfileTests(unittest.TestCase):
    def test_selects_short_form_profile_for_hook_led_platforms(self) -> None:
        payload = AnalyzeRequest(
            platform="TikTok",
            content_type="Hook-led short-form video",
            hook="Most creators miss this one edit before publishing.",
            caption="",
            transcript="",
            duration_seconds=28,
            niche="creator education",
            has_cta=True,
        )

        profile = select_scoring_profile(payload)

        self.assertEqual(profile.name, SHORT_FORM_PROFILE.name)

    def test_selects_long_form_profile_for_script_content(self) -> None:
        payload = AnalyzeRequest(
            platform="YouTube",
            content_type="Long-form script",
            hook="This is the edit that keeps viewers watching.",
            caption="A structured walkthrough of the draft.",
            transcript="Start with the problem, show the fix, then explain the payoff.",
            duration_seconds=180,
            niche="marketing",
            has_cta=False,
        )

        profile = select_scoring_profile(payload)

        self.assertEqual(profile.name, LONG_FORM_PROFILE.name)

    def test_profile_weights_change_the_overall_score(self) -> None:
        hook_score = 80
        clarity_score = 65
        platform_fit_score = 60
        hook_words = 8
        caption_words = 15
        transcript_words = 25

        short_score = calculate_overall_score(
            SHORT_FORM_PROFILE,
            hook_score=hook_score,
            clarity_score=clarity_score,
            platform_fit_score=platform_fit_score,
            has_cta=True,
            hook_words=hook_words,
            caption_words=caption_words,
            transcript_words=transcript_words,
        )
        long_score = calculate_overall_score(
            LONG_FORM_PROFILE,
            hook_score=hook_score,
            clarity_score=clarity_score,
            platform_fit_score=platform_fit_score,
            has_cta=True,
            hook_words=hook_words,
            caption_words=caption_words,
            transcript_words=transcript_words,
        )
        text_first_score = calculate_overall_score(
            TEXT_FIRST_PROFILE,
            hook_score=hook_score,
            clarity_score=clarity_score,
            platform_fit_score=platform_fit_score,
            has_cta=True,
            hook_words=hook_words,
            caption_words=caption_words,
            transcript_words=transcript_words,
        )

        self.assertGreater(short_score, long_score)
        self.assertNotEqual(short_score, text_first_score)


if __name__ == "__main__":
    unittest.main()
