from __future__ import annotations

from ...schemas.input import AnalyzeRequest


def _word_count(text: str) -> int:
    return len([part for part in text.split() if part])


def build_feedback(
    payload: AnalyzeRequest,
    scores: dict[str, int],
) -> dict[str, object]:
    strengths: list[str] = []
    risks: list[str] = []
    suggestions: list[str] = []

    hook_words = _word_count(payload.hook)
    caption_words = _word_count(payload.caption)
    transcript_words = _word_count(payload.transcript)

    if hook_words > 0:
        strengths.append("Hook is present")
    if 0 < payload.duration_seconds <= 60:
        strengths.append("Short-form duration is suitable")
    if caption_words > 0 or transcript_words > 0:
        strengths.append("There is enough supporting copy to understand the idea")

    if not payload.has_cta:
        risks.append("No CTA")
        suggestions.append("Add a clearer CTA")
    if hook_words == 0:
        risks.append("Hook is missing")
    elif hook_words < 5:
        risks.append("Hook is too short")
    if payload.duration_seconds > 60:
        risks.append("Long duration")

    if hook_words < 5 or hook_words == 0:
        suggestions.append("Tighten the opening line")

    if not payload.platform.strip() or not payload.content_type.strip():
        suggestions.append("Improve platform fit by naming a clearer format and channel")
    elif payload.platform.strip().lower() not in {"tiktok", "instagram", "instagram reels", "youtube shorts", "youtube"}:
        suggestions.append("Improve platform fit by making the draft feel less generic")

    if not suggestions:
        suggestions.append("Tighten the opening line")
        suggestions.append("Add a clearer CTA")

    critique = (
        f"This draft scores {scores['overall_score']}/100. "
        "It is a workable MVP draft, but it will read stronger with a sharper opening, "
        "clearer viewer value, and a more obvious next step."
    )

    return {
        "strengths": strengths,
        "risks": risks,
        "critique": critique,
        "suggestions": suggestions[:3],
    }
