from pydantic import BaseModel, ConfigDict, Field


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    platform: str = Field(...)
    content_type: str = Field(...)
    hook: str = Field(...)
    caption: str = Field(...)
    transcript: str = Field(...)
    duration_seconds: int = Field(..., ge=1)
    niche: str = Field(...)
    has_cta: bool = Field(...)


AnalyzeInput = AnalyzeRequest
