from __future__ import annotations

import sys
import time
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app


class JobPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    def test_generate_upload_url_returns_stubbed_payload(self) -> None:
        response = self.client.post(
            "/uploads/url",
            json={"file_name": "draft.mp4", "content_type": "video/mp4"},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["upload_id"].startswith("upload_"))
        self.assertTrue(body["upload_url"].startswith("https://uploads.invalid/"))
        self.assertTrue(body["object_key"].startswith("uploads/upload_"))
        self.assertEqual(body["headers"]["Content-Type"], "video/mp4")

    def test_job_lifecycle_completes_with_analysis_result(self) -> None:
        response = self.client.post(
            "/jobs",
            json={
                "platform": "TikTok",
                "content_type": "short_video",
                "niche": "creator education",
                "duration_seconds": 35,
                "has_cta": True,
                "upload_id": "upload_12345678",
                "upload_filename": "creator-hook.mp4",
                "idea": "turn one idea into three hooks",
            },
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertTrue(body["job_id"].startswith("job_"))
        self.assertIn(body["status"], {"pending", "processing"})
        self.assertIsNone(body["result"])

        final_body = None
        for _ in range(30):
            poll = self.client.get(f"/jobs/{body['job_id']}")
            self.assertEqual(poll.status_code, 200)
            final_body = poll.json()
            if final_body["status"] == "complete":
                break
            time.sleep(0.05)

        self.assertIsNotNone(final_body)
        assert final_body is not None
        self.assertEqual(final_body["status"], "complete")
        self.assertIsNone(final_body["error"])
        self.assertIsInstance(final_body["result"], dict)
        self.assertIn("overall_score", final_body["result"])
        self.assertEqual(len(final_body["result"]["rewritten_hooks"]), 3)

    def test_missing_job_returns_404(self) -> None:
        response = self.client.get("/jobs/job_missing")
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
