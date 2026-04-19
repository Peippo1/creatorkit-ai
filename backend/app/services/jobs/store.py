from __future__ import annotations

import re
import threading
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from ...schemas.input import AnalyzeRequest
from ...schemas.job import (
    AnalysisJobResponse,
    CreateJobRequest,
    GenerateUploadUrlResponse,
    JobStatus,
)
from ...schemas.output import AnalyzeResponse
from ..critique.feedback import build_feedback
from ..scoring.predictor import score_submission
from ..scoring.profiles import normalize_content_type, normalize_text

_LOCK = threading.Lock()
_JOBS: dict[str, "JobRecord"] = {}
_UPLOAD_URL_BASE = "https://uploads.invalid"
_JOB_PROCESSING_DELAY_SECONDS = 0.2


@dataclass(slots=True)
class JobRecord:
    job_id: str
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    request: CreateJobRequest
    result: AnalyzeResponse | None = None
    error: str | None = None


def _now() -> datetime:
    return datetime.now(UTC)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def _sanitize_filename(file_name: str) -> str:
    stem = Path(file_name).stem.strip() or "upload"
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip("-_.")
    return cleaned or "upload"


def generate_upload_url(file_name: str, content_type: str | None = None) -> GenerateUploadUrlResponse:
    upload_id = _new_id("upload")
    safe_name = _sanitize_filename(file_name)
    object_key = f"uploads/{upload_id}/{safe_name}"
    headers = {"Content-Type": content_type or "application/octet-stream"}

    return GenerateUploadUrlResponse(
        upload_id=upload_id,
        upload_url=f"{_UPLOAD_URL_BASE}/{object_key}",
        object_key=object_key,
        headers=headers,
    )


def _subject_phrase(payload: CreateJobRequest) -> str:
    idea = (payload.idea or "").strip()
    if idea:
        return idea

    if payload.upload_filename:
        filename = Path(payload.upload_filename).stem.replace("_", " ").replace("-", " ").strip()
        if filename:
            return filename

    niche = payload.niche.strip()
    if niche:
        return niche

    return "your next video"


def _mock_hook(payload: CreateJobRequest, subject: str) -> str:
    platform = payload.platform.lower()

    if platform == "tiktok":
        return f"Stop the scroll: a clearer opening about {subject}."

    if platform == "instagram reels":
        return f"Make the first second count with a sharper opening about {subject}."

    if platform == "youtube shorts":
        return f"Hook viewers fast with a stronger opening about {subject}."

    if platform == "youtube":
        return f"Here’s the simplest way to explain {subject} in a script."

    if platform == "linkedin":
        return f"A clearer way to open a LinkedIn post about {subject}."

    if platform == "x":
        return f"A faster way to make your point about {subject}."

    if platform == "threads":
        return f"A simple opening for a thread about {subject}."

    return f"A clearer opening about {subject}."


def _mock_caption(payload: CreateJobRequest, subject: str) -> str:
    platform = payload.platform.lower()

    if platform == "linkedin":
        return f"A starting point for a sharper post about {subject}."

    if platform == "youtube":
        return f"A simple outline you can turn into a stronger script about {subject}."

    if platform in {"x", "threads"}:
        return f"A clean opening idea for {subject}."

    return f"A short draft to tighten before you post about {subject}."


def _mock_transcript(payload: CreateJobRequest, subject: str) -> str:
    platform = normalize_text(payload.platform)
    content_type = normalize_content_type(payload.content_type)

    if "long-form" in content_type or platform == "youtube":
        return " ".join(
            [
                f"Open with the problem your audience feels around {subject}.",
                "Show why the usual approach falls short.",
                "Walk through the fix in a few clear steps.",
                "Close with one direct next move.",
            ]
        )

    if "carousel" in content_type or content_type == "thread":
        return " ".join(
            [
                f"Open with the main point about {subject}.",
                "Add one concrete example so the idea feels real.",
                "Keep the language concise and easy to scan.",
                "Finish with a clear takeaway or question.",
            ]
        )

    if platform == "linkedin":
        return " ".join(
            [
                f"Lead with a simple point about {subject}.",
                "Share one practical example that makes it credible.",
                "Keep the tone calm, clear, and professional.",
                "End with a direct next step or reflection.",
            ]
        )

    if platform in {"x", "threads"}:
        return " ".join(
            [
                f"Start with the quickest useful point about {subject}.",
                "Use short lines and one strong example.",
                "Keep the idea easy to skim and easy to share.",
                "Close with a simple takeaway.",
            ]
        )

    return " ".join(
        [
            f"Start with the hook for {subject}.",
            "Show one quick example that makes the point obvious.",
            "Keep the pace tight and the value easy to see.",
            "End with one simple next step.",
        ]
    )


def _build_analysis_request(payload: CreateJobRequest) -> AnalyzeRequest:
    subject = _subject_phrase(payload)
    hook = payload.hook or _mock_hook(payload, subject)
    caption = payload.caption or _mock_caption(payload, subject)
    transcript = payload.transcript or _mock_transcript(payload, subject)

    return AnalyzeRequest(
        platform=payload.platform,
        content_type=payload.content_type,
        hook=hook,
        caption=caption,
        transcript=transcript,
        duration_seconds=payload.duration_seconds,
        niche=payload.niche,
        has_cta=payload.has_cta,
    )


def _touch_job(job_id: str, **updates: object) -> None:
    with _LOCK:
        record = _JOBS[job_id]
        for key, value in updates.items():
            setattr(record, key, value)
        record.updated_at = _now()


def _process_job(job_id: str) -> None:
    try:
        _touch_job(job_id, status=JobStatus.processing)
        import time

        time.sleep(_JOB_PROCESSING_DELAY_SECONDS)

        with _LOCK:
            record = _JOBS[job_id]
            payload = record.request

        analysis_request = _build_analysis_request(payload)
        scores = score_submission(analysis_request)
        feedback = build_feedback(analysis_request, scores)
        result = AnalyzeResponse(**scores, **feedback)
        _touch_job(job_id, status=JobStatus.complete, result=result, error=None)
    except Exception as exc:  # pragma: no cover - defensive async guard
        _touch_job(job_id, status=JobStatus.failed, error=str(exc))


def create_job(payload: CreateJobRequest) -> AnalysisJobResponse:
    now = _now()
    job_id = _new_id("job")
    record = JobRecord(
        job_id=job_id,
        status=JobStatus.pending,
        created_at=now,
        updated_at=now,
        request=payload,
    )

    with _LOCK:
        _JOBS[job_id] = record

    worker = threading.Thread(target=_process_job, args=(job_id,), daemon=True)
    worker.start()
    return get_job(job_id)


def get_job(job_id: str) -> AnalysisJobResponse:
    with _LOCK:
        record = _JOBS.get(job_id)

    if record is None:
        raise KeyError(job_id)

    return AnalysisJobResponse(
        job_id=record.job_id,
        status=record.status,
        created_at=record.created_at,
        updated_at=record.updated_at,
        upload_id=record.request.upload_id,
        upload_filename=record.request.upload_filename,
        result=record.result,
        error=record.error,
    )
