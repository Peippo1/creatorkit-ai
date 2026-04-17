from __future__ import annotations

from dataclasses import dataclass

from ...schemas.input import AnalyzeRequest

SHORT_FORM_PLATFORMS = {
    "tiktok",
    "instagram",
    "instagram reels",
    "reels",
    "youtube shorts",
    "shorts",
}

LONG_FORM_PLATFORMS = {
    "youtube",
}

TEXT_FIRST_PLATFORMS = {
    "linkedin",
    "threads",
    "x",
}


def normalize_text(text: str) -> str:
    return " ".join(text.lower().split())


def word_count(text: str) -> int:
    return len([part for part in text.split() if part])


@dataclass(frozen=True)
class ScoringProfile:
    name: str
    hook_weight: float
    clarity_weight: float
    platform_fit_weight: float
    cta_bonus: int
    balance_bonus: int
    imbalance_penalty: int


SHORT_FORM_PROFILE = ScoringProfile(
    name="short_form",
    hook_weight=0.46,
    clarity_weight=0.27,
    platform_fit_weight=0.27,
    cta_bonus=4,
    balance_bonus=4,
    imbalance_penalty=5,
)

LONG_FORM_PROFILE = ScoringProfile(
    name="long_form",
    hook_weight=0.28,
    clarity_weight=0.42,
    platform_fit_weight=0.30,
    cta_bonus=2,
    balance_bonus=5,
    imbalance_penalty=4,
)

TEXT_FIRST_PROFILE = ScoringProfile(
    name="text_first",
    hook_weight=0.22,
    clarity_weight=0.46,
    platform_fit_weight=0.32,
    cta_bonus=3,
    balance_bonus=4,
    imbalance_penalty=4,
)

GENERAL_PROFILE = ScoringProfile(
    name="general",
    hook_weight=0.34,
    clarity_weight=0.36,
    platform_fit_weight=0.30,
    cta_bonus=3,
    balance_bonus=3,
    imbalance_penalty=4,
)


def select_scoring_profile(payload: AnalyzeRequest) -> ScoringProfile:
    platform = normalize_text(payload.platform)
    content_type = normalize_text(payload.content_type)

    if platform in SHORT_FORM_PLATFORMS or "short-form" in content_type or "hook-led" in content_type:
        return SHORT_FORM_PROFILE

    if (
        platform in LONG_FORM_PLATFORMS
        or "long-form" in content_type
        or "script" in content_type
        or "tutorial" in content_type
    ):
        return LONG_FORM_PROFILE

    if (
        platform in TEXT_FIRST_PLATFORMS
        or "carousel" in content_type
        or "thread" in content_type
        or "post" in content_type
    ):
        return TEXT_FIRST_PROFILE

    return GENERAL_PROFILE


def calculate_overall_score(
    profile: ScoringProfile,
    *,
    hook_score: int,
    clarity_score: int,
    platform_fit_score: int,
    has_cta: bool,
    hook_words: int,
    caption_words: int,
    transcript_words: int,
) -> int:
    overall_score = round(
        (hook_score * profile.hook_weight)
        + (clarity_score * profile.clarity_weight)
        + (platform_fit_score * profile.platform_fit_weight)
    )

    overall_score += profile.cta_bonus if has_cta else -profile.cta_bonus

    score_values = [hook_score, clarity_score, platform_fit_score]
    if min(score_values) >= 70:
        overall_score += profile.balance_bonus
    if max(score_values) - min(score_values) >= 30:
        overall_score -= profile.imbalance_penalty

    if profile.name == "short_form":
        if 5 <= hook_words <= 12:
            overall_score += 2
        if transcript_words <= 60:
            overall_score += 2
    elif profile.name == "long_form":
        if transcript_words >= 80:
            overall_score += 4
        elif transcript_words < 40:
            overall_score -= 5
        if caption_words >= 12:
            overall_score += 2
    elif profile.name == "text_first":
        if caption_words >= 20:
            overall_score += 4
        elif caption_words < 8:
            overall_score -= 3
        if hook_words <= 10:
            overall_score += 2
    else:
        if hook_words >= 4 and transcript_words >= 20:
            overall_score += 2

    return min(100, max(0, overall_score))
