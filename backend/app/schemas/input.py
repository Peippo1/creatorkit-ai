from pydantic import BaseModel, ConfigDict, Field


class AnalyzeInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    platform: str = Field(default="TikTok", examples=["TikTok"])
    content_type: str = Field(default="Short-form video", examples=["Short-form video"])
    hook: str = Field(default="", description="The opening line or angle.")
    caption: str = Field(default="", description="The post caption or description.")
    transcript: str = Field(default="", description="Transcript or body copy.")
    duration_seconds: int = Field(default=30, ge=1, le=10800)
    niche: str = Field(default="", description="Creator niche or audience segment.")
    has_cta: bool = Field(default=False, description="Whether the draft includes a clear call to action.")
