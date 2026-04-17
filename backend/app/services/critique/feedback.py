from __future__ import annotations

import re

from ...schemas.input import AnalyzeRequest
from ..scoring.profiles import (
    LONG_FORM_PLATFORMS,
    SHORT_FORM_PLATFORMS,
    TEXT_FIRST_PLATFORMS,
    normalize_text,
    word_count,
)


LEADING_WORDS = {
    "a",
    "an",
    "be",
    "before",
    "do",
    "for",
    "from",
    "here",
    "how",
    "if",
    "in",
    "is",
    "it",
    "make",
    "most",
    "many",
    "need",
    "of",
    "one",
    "our",
    "stop",
    "the",
    "these",
    "this",
    "to",
    "use",
    "why",
    "with",
    "you",
    "your",
}


def _platform_label(platform: str) -> str:
    cleaned = " ".join(platform.split())
    if not cleaned:
        return "your platform"
    return cleaned


def _hook_theme(hook: str, niche: str) -> str:
    text = normalize_text(hook).rstrip(".!?")
    if not text:
        fallback = normalize_text(niche).strip()
        return fallback if fallback else "your next post"

    words = text.split()
    if len(words) > 12:
        text = " ".join(words[:12])

    return text


def _strip_leading_words(text: str) -> str:
    words = text.split()
    while words and words[0] in LEADING_WORDS:
        words.pop(0)
    return " ".join(words)


def _object_phrase(theme: str) -> str:
    cleaned = _strip_leading_words(theme)
    if not cleaned:
        return theme

    imperative_match = re.match(
        r"^(?P<verb>make|stop|avoid|fix|build|use|write|create|turn|keep|add|get|lead|pitch|publish)\s+(?P<object>.+)$",
        cleaned,
    )
    if imperative_match:
        cleaned = _strip_leading_words(imperative_match.group("object"))
        if cleaned:
            return cleaned

    audience_match = re.match(
        r"^(?:most|many|some|few)\s+(?P<audience>[a-z0-9\s]+?)\s+(?P<verb>miss|make|avoid|fix|build|use|write|create|turn|keep|add|get|lead|pitch|publish)\s+(?P<object>.+)$",
        theme,
    )
    if audience_match:
        cleaned = _strip_leading_words(audience_match.group("object"))

    if not cleaned:
        return theme

    return cleaned


def _sentence_case(text: str) -> str:
    if not text:
        return text
    return text[0].upper() + text[1:]


def rewrite_hook(hook: str, platform: str, niche: str) -> list[str]:
    platform_name = normalize_text(platform)
    niche_name = normalize_text(niche).strip()
    audience = niche_name if niche_name else "creators"
    platform_label = _platform_label(platform)
    theme = _hook_theme(hook, niche_name)
    object_phrase = _object_phrase(theme)

    numeric_theme = re.match(r"^(?P<count>\d+)\s+(?P<rest>.+)$", theme)

    if numeric_theme:
        count = numeric_theme.group("count")
        rest = numeric_theme.group("rest")
        rewritten = [
            f"{count} {rest} {audience} should avoid",
            f"Stop making these {count} {rest}",
            f"If you're {audience}, avoid these {count} {rest}",
        ]
    elif platform_name in SHORT_FORM_PLATFORMS:
        rewritten = [
            f"Why {theme}",
            f"The {object_phrase} {audience} miss",
            f"Before you post on {platform_label}, avoid {object_phrase}",
        ]
    elif platform_name in LONG_FORM_PLATFORMS:
        rewritten = [
            f"Why {theme} keeps viewers watching",
            f"The {object_phrase} long-form creators should use",
            f"Before you film for {platform_label}, avoid {object_phrase}",
        ]
    elif platform_name in TEXT_FIRST_PLATFORMS:
        rewritten = [
            f"Why {theme} works on {platform_label}",
            f"The cleaner way to {object_phrase}",
            f"Before you post on {platform_label}, avoid {object_phrase}",
        ]
    else:
        rewritten = [
            f"Why {theme} matters for {audience}",
            f"The {object_phrase} {audience} should use",
            f"Before you publish, avoid {object_phrase}",
        ]

    rewritten = [_sentence_case(item.strip().rstrip(" .!?")) for item in rewritten]
    deduped: list[str] = []
    for item in rewritten:
        if item not in deduped:
            deduped.append(item)

    while len(deduped) < 3:
        deduped.append(_sentence_case(theme))

    return deduped[:3]


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
        "rewritten_hooks": rewrite_hook(payload.hook, payload.platform, payload.niche),
    }
