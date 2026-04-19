from __future__ import annotations

from ...schemas.input import AnalyzeRequest
from .profiles import (
    SHORT_FORM_PLATFORMS,
    LONG_FORM_PLATFORMS,
    TEXT_FIRST_PLATFORMS,
    calculate_overall_score,
    normalize_content_type,
    normalize_text,
    select_scoring_profile,
    word_count,
)

HOOK_CURIOSITY_WORDS = {
    "how",
    "why",
    "what",
    "before",
    "after",
    "mistake",
    "secret",
    "stop",
    "instead",
    "3",
    "5",
    "7",
}

HOOK_VAGUE_WORDS = {
    "thing",
    "things",
    "stuff",
    "something",
    "interesting",
    "nice",
    "good",
    "better",
}


def _normalize(text: str) -> str:
    return normalize_text(text)


def _word_count(text: str) -> int:
    return word_count(text)


def _clamp(value: int) -> int:
    return min(100, max(0, value))


def _hook_score(payload: AnalyzeRequest) -> int:
    hook = _normalize(payload.hook)
    score = 44
    count = _word_count(payload.hook)

    if count == 0:
        return 0

    if 5 <= count <= 12:
        score += 18
    elif 3 <= count <= 15:
        score += 10
    else:
        score += 2

    if any(word in hook.split() for word in HOOK_CURIOSITY_WORDS):
        score += 6
    if any(word in hook.split() for word in HOOK_VAGUE_WORDS):
        score -= 6
    if count < 4:
        score -= 8
    if count > 18:
        score -= 8

    return _clamp(score)


def _clarity_score(payload: AnalyzeRequest) -> int:
    score = 42
    caption_words = _word_count(payload.caption)
    transcript_words = _word_count(payload.transcript)
    niche_words = _word_count(payload.niche)
    content_type = normalize_content_type(payload.content_type)

    if caption_words >= 12:
        score += 12
    elif caption_words >= 4:
        score += 6
    elif caption_words > 0:
        score += 2
    else:
        score -= 6

    if transcript_words >= 60:
        score += 12
    elif transcript_words >= 20:
        score += 8
    elif transcript_words > 0:
        score += 4
    else:
        score -= 10

    if caption_words > 0 and transcript_words > 0:
        score += 6
    if niche_words > 0:
        score += 4

    if "carousel" in content_type or "thread" in content_type or "post" in content_type:
        if caption_words >= 20:
            score += 4
        else:
            score -= 3

    if "script" in content_type or "video" in content_type or "tutorial" in content_type:
        if transcript_words >= 40:
            score += 4
        else:
            score -= 4

    return _clamp(score)


def _platform_fit_score(payload: AnalyzeRequest) -> int:
    score = 45
    platform = _normalize(payload.platform)
    content_type = normalize_content_type(payload.content_type)
    duration = payload.duration_seconds

    if platform in SHORT_FORM_PLATFORMS:
        if 15 <= duration <= 45:
            score += 20
        elif 10 <= duration <= 60:
            score += 14
        elif 61 <= duration <= 90:
            score += 6
        else:
            score -= 10
    elif platform in LONG_FORM_PLATFORMS:
        if 60 <= duration <= 240:
            score += 18
        elif 30 <= duration < 60 or 241 <= duration <= 420:
            score += 10
        else:
            score -= 4
    elif platform in TEXT_FIRST_PLATFORMS:
        if duration <= 90:
            score += 12
        elif duration <= 180:
            score += 6
        else:
            score -= 6
    else:
        if duration <= 120:
            score += 10
        else:
            score -= 3

    if "long-form" in content_type or "tutorial" in content_type:
        if duration >= 45:
            score += 4
        else:
            score -= 4
    elif "short-form" in content_type or "hook-led" in content_type:
        if duration <= 60:
            score += 4
        else:
            score -= 6
    elif "carousel" in content_type or "thread" in content_type or "post" in content_type:
        if duration <= 90:
            score += 4
        else:
            score -= 4

    if payload.has_cta:
        score += 3

    return _clamp(score)


def score_submission(payload: AnalyzeRequest) -> dict[str, int]:
    hook_score = _hook_score(payload)
    clarity_score = _clarity_score(payload)
    platform_fit_score = _platform_fit_score(payload)
    profile = select_scoring_profile(payload)
    overall_score = calculate_overall_score(
        profile,
        hook_score=hook_score,
        clarity_score=clarity_score,
        platform_fit_score=platform_fit_score,
        has_cta=payload.has_cta,
        hook_words=_word_count(payload.hook),
        caption_words=_word_count(payload.caption),
        transcript_words=_word_count(payload.transcript),
    )

    return {
        "overall_score": overall_score,
        "hook_score": hook_score,
        "clarity_score": clarity_score,
        "platform_fit_score": platform_fit_score,
    }
