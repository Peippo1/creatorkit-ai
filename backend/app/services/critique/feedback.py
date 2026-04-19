from __future__ import annotations

import re

from ...schemas.input import AnalyzeRequest
from ..scoring.profiles import (
    LONG_FORM_PLATFORMS,
    SHORT_FORM_PLATFORMS,
    TEXT_FIRST_PLATFORMS,
    normalize_content_type,
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


def _topic_phrase(niche: str) -> str:
    cleaned = " ".join(normalize_text(niche).split()).strip()
    if not cleaned:
        return "creators"

    lowered = cleaned.lower()
    direct_audiences = {
        "creators",
        "founders",
        "marketers",
        "builders",
        "operators",
        "designers",
        "writers",
        "coaches",
        "students",
        "educators",
        "consultants",
    }

    if lowered in direct_audiences or lowered.endswith("creators") or lowered.endswith("founders"):
        return cleaned

    if "creator" in lowered:
        return f"people working in {cleaned}"

    if " " in cleaned or lowered.endswith("ing"):
        return f"people working in {cleaned}"

    return cleaned


def _strip_leading_words(text: str) -> str:
    words = text.split()
    while words and words[0] in LEADING_WORDS:
        words.pop(0)
    return " ".join(words)


def _object_phrase(theme: str) -> str:
    cleaned = _strip_leading_words(theme)
    if not cleaned:
        return theme

    into_match = re.search(r"\binto\b\s+(?P<object>.+)$", cleaned)
    if into_match:
        cleaned = into_match.group("object").strip()

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

    first_word = cleaned.split()[0] if cleaned.split() else ""
    if first_word not in {"a", "an", "the", "this", "these", "those"}:
        lowered_theme = theme.lower()
        if "this one" in lowered_theme:
            cleaned = f"this one {cleaned}"
        elif "this" in lowered_theme:
            cleaned = f"this {cleaned}"

    return cleaned


def _sentence_case(text: str) -> str:
    if not text:
        return text
    return text[0].upper() + text[1:]


def _count_focus(count: str, rest: str) -> str:
    lowered = rest.lower()
    if "mistake" in lowered:
        noun = "mistakes"
    elif "step" in lowered:
        noun = "steps"
    elif "idea" in lowered:
        noun = "ideas"
    elif "edit" in lowered:
        noun = "edits"
    elif "point" in lowered:
        noun = "points"
    else:
        noun = "points"

    return f"these {count} {noun}"


def _rewrite_templates(
    platform_name: str,
    topic_clause: str,
    platform_label: str,
    focus_phrase: str,
    count_focus: str | None = None,
) -> list[str]:
    if count_focus is not None:
        if platform_name == "tiktok":
            return [
                f"Stop the scroll with {count_focus} {topic_clause}",
                f"Try this instead: lead with {count_focus}",
                f"A stronger TikTok hook {topic_clause}: {count_focus}",
            ]

        if platform_name == "instagram reels":
            return [
                f"Make the first second count with {count_focus} {topic_clause}",
                f"Try this instead: open with {count_focus}",
                f"A stronger Reels hook {topic_clause}: {count_focus}",
            ]

        if platform_name == "youtube shorts":
            return [
                f"Hook viewers fast with {count_focus} {topic_clause}",
                f"Try this instead: lead with {count_focus}",
                f"A stronger YouTube Shorts opener {topic_clause}: {count_focus}",
            ]

        if platform_name == "linkedin":
            return [
                f"Why {count_focus} work on LinkedIn {topic_clause}",
                f"Try this instead: open with {count_focus}",
                f"A stronger LinkedIn angle {topic_clause}: {count_focus}",
            ]

        if platform_name == "x":
            return [
                f"Make the first line earn the click with {count_focus} {topic_clause}",
                f"Try this instead: lead with {count_focus}",
                f"A stronger X post {topic_clause}: {count_focus}",
            ]

        if platform_name == "threads":
            return [
                f"Keep it conversational with {count_focus} {topic_clause}",
                f"Try this instead: open with {count_focus}",
                f"A stronger Threads post {topic_clause}: {count_focus}",
            ]

        if platform_name == "youtube":
            return [
                f"Why {count_focus} keep viewers watching {topic_clause}",
                f"Try this instead: open with {count_focus}",
                f"A stronger long-form angle {topic_clause}: make the payoff clear",
            ]

        if platform_name in SHORT_FORM_PLATFORMS:
            return [
                f"Stop the scroll with {count_focus} {topic_clause}",
                f"Try this instead: lead with {count_focus}",
                f"A stronger angle {topic_clause}: {count_focus}",
            ]

        if platform_name in LONG_FORM_PLATFORMS:
            return [
                f"Why {count_focus} keep viewers watching {topic_clause}",
                f"Try this instead: open with {count_focus}",
                f"A stronger angle {topic_clause}: make the payoff clear",
            ]

        if platform_name in TEXT_FIRST_PLATFORMS:
            return [
                f"Why {count_focus} work on {platform_label} {topic_clause}",
                f"Try this instead: lead with {count_focus}",
                f"A stronger angle {topic_clause}: keep it crisp and direct",
            ]

        return [
            f"Why {count_focus} matter {topic_clause}",
            f"Try this instead: lead with {count_focus}",
            f"A stronger angle {topic_clause}: {count_focus}",
        ]

    if platform_name == "tiktok":
        return [
            f"Stop the scroll with {focus_phrase} {topic_clause}",
            f"Try this instead: {focus_phrase}",
            f"A stronger TikTok hook {topic_clause}: {focus_phrase}",
        ]

    if platform_name == "instagram reels":
        return [
            f"Make the first second count with {focus_phrase} {topic_clause}",
            f"Try this instead: open with {focus_phrase}",
            f"A stronger Reels hook {topic_clause}: {focus_phrase}",
        ]

    if platform_name == "youtube shorts":
        return [
            f"Hook viewers fast with {focus_phrase} {topic_clause}",
            f"Try this instead: lead with {focus_phrase}",
            f"A stronger YouTube Shorts opener {topic_clause}: {focus_phrase}",
        ]

    if platform_name == "linkedin":
        return [
            f"Why {focus_phrase} works on LinkedIn {topic_clause}",
            f"Try this instead: open with {focus_phrase}",
            f"A stronger LinkedIn angle {topic_clause}: {focus_phrase}",
        ]

    if platform_name == "x":
        return [
            f"Make the first line earn the click with {focus_phrase} {topic_clause}",
            f"Try this instead: lead with {focus_phrase}",
            f"A stronger X post {topic_clause}: {focus_phrase}",
        ]

    if platform_name == "threads":
        return [
            f"Keep it conversational with {focus_phrase} {topic_clause}",
            f"Try this instead: open with {focus_phrase}",
            f"A stronger Threads post {topic_clause}: {focus_phrase}",
        ]

    if platform_name == "youtube":
        return [
            f"Why {focus_phrase} keeps viewers watching {topic_clause}",
            f"Try this instead: open with {focus_phrase}",
            f"A stronger long-form angle {topic_clause}: keep the payoff clear",
        ]

    return [
        f"Why {focus_phrase} works {topic_clause}",
        f"Try this instead: lead with {focus_phrase}",
        f"A stronger angle {topic_clause}: {focus_phrase}",
    ]


def rewrite_hook(hook: str, platform: str, niche: str) -> list[str]:
    platform_name = normalize_text(platform)
    niche_name = normalize_text(niche).strip()
    topic_phrase = _topic_phrase(niche_name)
    topic_clause = f"for {topic_phrase}"
    platform_label = _platform_label(platform)
    theme = _hook_theme(hook, niche_name)
    object_phrase = _object_phrase(theme)
    focus_phrase = object_phrase if object_phrase.lower() != theme.lower() else theme

    numeric_theme = re.match(r"^(?P<count>\d+)\s+(?P<rest>.+)$", theme)

    if numeric_theme:
        count = numeric_theme.group("count")
        rest = numeric_theme.group("rest")
        count_focus = _count_focus(count, rest)
        rewritten = _rewrite_templates(
            platform_name=platform_name,
            topic_clause=topic_clause,
            platform_label=platform_label,
            focus_phrase=count_focus,
            count_focus=count_focus,
        )
    else:
        rewritten = _rewrite_templates(
            platform_name=platform_name,
            topic_clause=topic_clause,
            platform_label=platform_label,
            focus_phrase=focus_phrase,
        )

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
    content_type = normalize_content_type(payload.content_type)
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
