from __future__ import annotations

import unittest
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from pydantic import ValidationError

from app.schemas.input import AnalyzeRequest


class InputValidationTests(unittest.TestCase):
    def test_hook_length_is_capped(self) -> None:
        with self.assertRaises(ValidationError):
            AnalyzeRequest(
                platform="TikTok",
                content_type="Short-form video",
                hook="x" * 241,
                caption="Short caption",
                transcript="Short transcript",
                duration_seconds=30,
                niche="creators",
                has_cta=True,
            )

    def test_transcript_length_is_capped(self) -> None:
        with self.assertRaises(ValidationError):
            AnalyzeRequest(
                platform="YouTube",
                content_type="Long-form script",
                hook="A valid hook",
                caption="Short caption",
                transcript="x" * 20001,
                duration_seconds=180,
                niche="creators",
                has_cta=True,
            )


if __name__ == "__main__":
    unittest.main()
