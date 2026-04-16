from __future__ import annotations

from dataclasses import dataclass

from ...schemas.input import AnalyzeInput


PLATFORM_BASE = {
    "tiktok": 74,
    "instagram": 72,
    "instagram reels": 76,
    "youtube shorts": 75,
    "youtube": 68,
    "linkedin": 64,
    "x": 62,
    "threads": 63,
}

CONTENT_FIT = {
    "short-form video": 10,
    "hook-led video": 9,
    "tutorial": 6,
    "educational carousel": 6,
    "talking-head clip": 5,
    "thread": 4,
    "post draft": 4,
    "long-form script": 2,
}


@dataclass(frozen=True)
class ScoringBreakdown:
    overall_score: int
    hook_score: int
    clarity_score: int
    platform_fit_score: int


def _clamp(value: float) -> int:
    return max(0, min(100, int(round(value))))


def _word_count(text: str) -> int:
    return len([part for part in text.split() if part])


def _hook_score(payload: AnalyzeInput) -> int:
    hook = (payload.hook or payload.caption or payload.transcript[:120]).strip()
    if not hook:
        return 24

    words = _word_count(hook)
    score = 34

    if 6 <= words <= 18:
        score += 24
    elif words < 6:
        score -= 8
    else:
        score += max(0, 16 - (words - 18) * 0.45)

    hook_lower = hook.lower()
    if any(token in hook_lower for token in ["how to", "why ", "stop ", "secret", "mistake", "simple"]):
        score += 8
    if "?" in hook or "!" in hook:
        score += 5
    if any(char.isdigit() for char in hook):
        score += 4
    if len(hook) < 18:
        score -= 6
    if len(hook) > 140:
        score -= 4

    return _clamp(score)


def _clarity_score(payload: AnalyzeInput) -> int:
    caption_words = _word_count(payload.caption)
    transcript_words = _word_count(payload.transcript)

    score = 36
    if 12 <= caption_words <= 40:
        score += 18
    elif caption_words < 6:
        score -= 10
    else:
        score += 8

    if transcript_words == 0:
        score -= 8
    elif 60 <= transcript_words <= 260:
        score += 16
    elif transcript_words > 600:
        score -= 6
    else:
        score += 6

    if payload.has_cta and transcript_words > 0:
        score += 4
    if "," in payload.caption or ";" in payload.caption:
        score += 2
    if payload.duration_seconds > 90 and transcript_words < 80:
        score -= 5

    return _clamp(score)


def _platform_fit_score(payload: AnalyzeInput) -> int:
    platform_key = payload.platform.strip().lower()
    content_key = payload.content_type.strip().lower()
    niche_words = _word_count(payload.niche)

    score = PLATFORM_BASE.get(platform_key, 66)
    score += CONTENT_FIT.get(content_key, 4)

    if platform_key in {"tiktok", "instagram", "instagram reels", "youtube shorts"}:
        if payload.duration_seconds <= 45:
            score += 10
        elif payload.duration_seconds <= 90:
            score += 6
        else:
            score -= 8
    elif platform_key == "youtube":
        if 45 <= payload.duration_seconds <= 480:
            score += 8
        elif payload.duration_seconds < 20:
            score -= 4
    elif platform_key in {"linkedin", "x", "threads"}:
        if payload.duration_seconds <= 60:
            score += 7
        else:
            score -= 4

    if payload.has_cta:
        score += 3
    if niche_words <= 3 and niche_words > 0:
        score += 3
    if niche_words > 8:
        score -= 2

    return _clamp(score)


def score_submission(payload: AnalyzeInput) -> dict[str, int]:
    hook_score = _hook_score(payload)
    clarity_score = _clarity_score(payload)
    platform_fit_score = _platform_fit_score(payload)
    overall_score = _clamp((hook_score * 0.4) + (clarity_score * 0.3) + (platform_fit_score * 0.3))

    breakdown = ScoringBreakdown(
        overall_score=overall_score,
        hook_score=hook_score,
        clarity_score=clarity_score,
        platform_fit_score=platform_fit_score,
    )
    return breakdown.__dict__
