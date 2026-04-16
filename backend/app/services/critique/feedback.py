from __future__ import annotations

from ...schemas.input import AnalyzeInput


def _strengths(payload: AnalyzeInput, scores: dict[str, int]) -> list[str]:
    strengths: list[str] = []

    if scores["hook_score"] >= 70:
        strengths.append("The hook is sharp enough to stop a scroll or earn a click.")
    elif scores["hook_score"] >= 55:
        strengths.append("The opening has a usable angle and can be tightened quickly.")

    if scores["clarity_score"] >= 70:
        strengths.append("The draft is easy to understand and should not require much decoding.")
    elif payload.caption.strip():
        strengths.append("The caption gives the draft some structure and context.")

    if scores["platform_fit_score"] >= 70:
        strengths.append("The format is aligned with the selected platform.")

    if payload.has_cta:
        strengths.append("A call to action is already present.")

    if payload.niche.strip():
        strengths.append("The niche is specific enough to target a clear audience.")

    if not strengths:
        strengths.append("The idea has enough raw material to shape into a stronger post.")

    return strengths[:4]


def _risks(payload: AnalyzeInput, scores: dict[str, int]) -> list[str]:
    risks: list[str] = []

    if not payload.hook.strip():
        risks.append("There is no explicit hook, so the post may feel generic at the top.")
    if scores["hook_score"] < 55:
        risks.append("The opening does not yet create enough curiosity or urgency.")
    if scores["clarity_score"] < 60:
        risks.append("The draft may read like rough notes instead of a publish-ready post.")
    if not payload.has_cta:
        risks.append("Without a clear CTA, the post may not convert attention into action.")
    if scores["platform_fit_score"] < 60:
        risks.append("The format and timing may not match the chosen platform well.")
    if payload.duration_seconds > 90 and payload.platform.lower() in {"tiktok", "instagram reels", "youtube shorts"}:
        risks.append("The runtime looks long for a short-form platform.")

    return risks[:4]


def _critique(payload: AnalyzeInput, scores: dict[str, int]) -> str:
    platform = payload.platform.strip() or "the chosen platform"
    niche = payload.niche.strip() or "the audience"

    return (
        f"This draft scores {scores['overall_score']}/100. "
        f"It has {platform.lower()} potential, but the current version still needs sharper packaging for {niche}. "
        f"Improve the first line, make the value more explicit, and end with a clearer conversion path."
    )


def _suggestions(payload: AnalyzeInput, scores: dict[str, int]) -> list[str]:
    suggestions: list[str] = []

    if scores["hook_score"] < 70:
        suggestions.append("Rewrite the first sentence around a single promise, surprise, or outcome.")
    if scores["clarity_score"] < 70:
        suggestions.append("Trim the caption or transcript so the main point is obvious within a few seconds.")
    if scores["platform_fit_score"] < 70:
        suggestions.append("Adjust the format and length to better match the platform's native viewing behavior.")
    if not payload.has_cta:
        suggestions.append("Add one explicit CTA that fits the goal, such as save, comment, click, or follow.")
    if payload.niche.strip():
        suggestions.append("Bring the niche into the hook so the right audience knows this is for them.")
    if len(suggestions) < 3:
        suggestions.append("Test two versions of the hook and keep the one with the stronger opening tension.")

    return suggestions[:5]


def build_feedback(payload: AnalyzeInput, scores: dict[str, int]) -> dict[str, object]:
    return {
        "strengths": _strengths(payload, scores),
        "risks": _risks(payload, scores),
        "critique": _critique(payload, scores),
        "suggestions": _suggestions(payload, scores),
    }
