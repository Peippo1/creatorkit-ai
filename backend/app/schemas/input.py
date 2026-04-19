from __future__ import annotations

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

ALLOWED_PLATFORM_VALUES = {
    "TikTok",
    "Instagram Reels",
    "YouTube Shorts",
    "YouTube",
    "LinkedIn",
    "X",
    "Threads",
}

PLATFORM_ALIASES = {
    "tiktok": "TikTok",
    "instagram reels": "Instagram Reels",
    "youtube shorts": "YouTube Shorts",
    "youtube": "YouTube",
    "linkedin": "LinkedIn",
    "x": "X",
    "threads": "Threads",
}

ALLOWED_CONTENT_TYPE_VALUES = {
    "short_video",
    "hook_led_video",
    "educational_carousel",
    "tutorial",
    "thread",
    "text_post",
    "long_form",
}

CONTENT_TYPE_ALIASES = {
    "short_video": "short_video",
    "short video": "short_video",
    "short form video": "short_video",
    "hook_led_video": "hook_led_video",
    "hook led video": "hook_led_video",
    "hook led short form video": "hook_led_video",
    "educational_carousel": "educational_carousel",
    "educational carousel": "educational_carousel",
    "tutorial": "tutorial",
    "thread": "thread",
    "text_post": "text_post",
    "text post": "text_post",
    "post draft": "text_post",
    "long_form": "long_form",
    "long form": "long_form",
    "long form script": "long_form",
    "long form video": "long_form",
}


def _normalize_choice(value: str) -> str:
    return re.sub(r"[\s_-]+", " ", value.strip().lower())


def display_content_type_label(value: str) -> str:
    labels = {
        "short_video": "Short-form video",
        "hook_led_video": "Hook-led video",
        "educational_carousel": "Educational carousel",
        "tutorial": "Tutorial",
        "thread": "Thread",
        "text_post": "Post draft",
        "long_form": "Long-form script",
    }
    return labels.get(value, value)


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    platform: str = Field(..., max_length=80)
    content_type: str = Field(..., max_length=80)
    hook: str = Field(..., max_length=240)
    caption: str = Field(..., max_length=6000)
    transcript: str = Field(..., max_length=20000)
    duration_seconds: int = Field(..., ge=1)
    niche: str = Field(..., max_length=120)
    has_cta: bool = Field(...)

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, value: str) -> str:
        normalized = _normalize_choice(value)
        canonical = PLATFORM_ALIASES.get(normalized)
        if canonical is None or canonical not in ALLOWED_PLATFORM_VALUES:
            raise ValueError("Unsupported platform")
        return canonical

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, value: str) -> str:
        normalized = _normalize_choice(value)
        canonical = CONTENT_TYPE_ALIASES.get(normalized)
        if canonical is None or canonical not in ALLOWED_CONTENT_TYPE_VALUES:
            raise ValueError("Unsupported content type")
        return display_content_type_label(canonical)


AnalyzeInput = AnalyzeRequest
