from __future__ import annotations

from ...schemas.input import AnalyzeRequest


def build_feedback(payload: AnalyzeRequest) -> dict[str, object]:
    strengths: list[str] = []
    risks: list[str] = []
    suggestions = [
        "Add a clear call to action",
        "Tighten the opening hook",
    ]

    if payload.hook.strip():
        strengths.append("Strong hook")
    if payload.duration_seconds < 60:
        strengths.append("Concise duration")
    if not payload.has_cta:
        risks.append("No CTA")
    if payload.duration_seconds >= 60:
        risks.append("Long duration")

    critique = (
        "The draft has a workable foundation, but it can perform better with a sharper opening, "
        "more explicit framing, and a clearer action for the viewer."
    )

    return {
        "strengths": strengths,
        "risks": risks,
        "critique": critique,
        "suggestions": suggestions,
    }
