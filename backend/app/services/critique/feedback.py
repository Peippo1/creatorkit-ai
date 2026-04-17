from __future__ import annotations

from ...schemas.input import AnalyzeRequest
from ..scoring.profiles import (
    LONG_FORM_PLATFORMS,
    SHORT_FORM_PLATFORMS,
    TEXT_FIRST_PLATFORMS,
    normalize_text,
    word_count,
)


def build_feedback(
    payload: AnalyzeRequest,
    scores: dict[str, int],
) -> dict[str, object]:
    strengths: list[str] = []
    risks: list[str] = []
    suggestions: list[str] = []

    platform = normalize_text(payload.platform)
    content_type = normalize_text(payload.content_type)
    hook_words = word_count(payload.hook)
    caption_words = word_count(payload.caption)
    transcript_words = word_count(payload.transcript)
    overall_score = int(scores["overall_score"])
    hook_score = int(scores["hook_score"])
    clarity_score = int(scores["clarity_score"])
    platform_fit_score = int(scores["platform_fit_score"])

    if hook_score >= 75:
        strengths.append("The opening is strong enough to stop a scroll")
    elif hook_words > 0:
        strengths.append("There is a clear hook to sharpen")

    if clarity_score >= 70:
        strengths.append("The supporting copy explains the idea clearly")
    elif caption_words > 0 or transcript_words > 0:
        strengths.append("The draft has enough material to develop")

    if platform_fit_score >= 70:
        if platform in SHORT_FORM_PLATFORMS:
            strengths.append("The runtime suits a short-form feed")
        elif platform in LONG_FORM_PLATFORMS:
            strengths.append("The runtime is in range for a longer-form platform")
        elif platform in TEXT_FIRST_PLATFORMS:
            strengths.append("The format is concise enough for a text-first platform")
        else:
            strengths.append("The format and platform are broadly aligned")

    if payload.has_cta:
        strengths.append("The draft includes a clear next step")

    if hook_words == 0:
        risks.append("The hook is missing")
    elif hook_score < 55:
        risks.append("The opening feels too generic or under-specified")
    elif hook_score < 70:
        risks.append("The hook could land faster with a sharper payoff")

    if clarity_score < 55:
        risks.append("The supporting copy does not fully explain the value")
    elif clarity_score < 70:
        risks.append("The draft still needs a little more context to feel complete")

    if platform_fit_score < 55:
        risks.append("The runtime and platform look slightly mismatched")
    elif platform_fit_score < 70:
        risks.append("The format is close, but the platform fit could be tighter")

    if not payload.has_cta:
        risks.append("The next step is unclear without a CTA")
        suggestions.append("Add a direct CTA so viewers know what to do next")

    if hook_words == 0:
        suggestions.append("Write a hook around one concrete promise or surprise")
    elif hook_score < 70:
        suggestions.append("Rewrite the opening around a sharper payoff")

    if clarity_score < 70:
        if "thread" in content_type or "carousel" in content_type or "post" in content_type:
            suggestions.append("Add one sentence that clarifies the point of the post")
        else:
            suggestions.append("Add one concrete benefit or proof point in the supporting copy")

    if platform_fit_score < 70:
        if platform in SHORT_FORM_PLATFORMS:
            suggestions.append("Trim the runtime so the idea lands faster")
        elif platform in LONG_FORM_PLATFORMS:
            suggestions.append("Give the draft enough room to justify a longer watch time")
        elif platform in TEXT_FIRST_PLATFORMS:
            suggestions.append("Make the copy more concise and platform-native")
        else:
            suggestions.append("Tighten the format so it feels more native to the platform")

    if not suggestions:
        suggestions.append("Keep the opening sharp and the CTA explicit")
        suggestions.append("Preserve the clear structure, then tighten the language")

    if overall_score >= 80:
        critique = (
            f"This draft scores {overall_score}/100. "
            "It is close to publish-ready, with strong structure and only light polish needed."
        )
    elif overall_score >= 60:
        critique = (
            f"This draft scores {overall_score}/100. "
            "It is workable, but the opener, clarity, or platform fit would benefit from one more pass."
        )
    else:
        critique = (
            f"This draft scores {overall_score}/100. "
            "It needs a sharper hook and clearer framing before it is ready to publish."
        )

    if hook_score < clarity_score and hook_score < platform_fit_score:
        critique += " The opening is the weakest part."
    elif clarity_score < hook_score and clarity_score < platform_fit_score:
        critique += " The supporting copy needs the most work."
    elif platform_fit_score < hook_score and platform_fit_score < clarity_score:
        critique += " The platform and runtime need the most adjustment."

    return {
        "strengths": strengths,
        "risks": risks,
        "critique": critique,
        "suggestions": suggestions[:3],
    }
