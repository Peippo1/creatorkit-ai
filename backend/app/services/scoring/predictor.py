from __future__ import annotations

from ...schemas.input import AnalyzeRequest


def _word_count(text: str) -> int:
    return len([part for part in text.split() if part])


def _clamp(value: int) -> int:
    return min(100, max(0, value))


def _hook_score(payload: AnalyzeRequest) -> int:
    count = _word_count(payload.hook)
    score = 50
    if 5 <= count <= 12:
        score += 10
    return _clamp(score)


def _clarity_score(payload: AnalyzeRequest) -> int:
    score = 50
    if _word_count(payload.caption) > 0 or _word_count(payload.transcript) > 0:
        score += 10
    return _clamp(score)


def _platform_fit_score(payload: AnalyzeRequest) -> int:
    score = 50
    if payload.duration_seconds < 60:
        score += 10
    return _clamp(score)


def score_submission(payload: AnalyzeRequest) -> dict[str, int]:
    hook_score = _hook_score(payload)
    clarity_score = _clarity_score(payload)
    platform_fit_score = _platform_fit_score(payload)
    overall_score = 50
    if 5 <= _word_count(payload.hook) <= 12:
        overall_score += 10
    if payload.has_cta:
        overall_score += 10
    if payload.duration_seconds < 60:
        overall_score += 10
    overall_score = _clamp(overall_score)

    return {
        "overall_score": overall_score,
        "hook_score": hook_score,
        "clarity_score": clarity_score,
        "platform_fit_score": platform_fit_score,
    }
