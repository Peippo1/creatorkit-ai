from pydantic import BaseModel, ConfigDict, Field


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    platform: str = Field(..., max_length=80)
    content_type: str = Field(..., max_length=80)
    hook: str = Field(..., max_length=240)
    caption: str = Field(..., max_length=6000)
    transcript: str = Field(..., max_length=20000)
    duration_seconds: int = Field(..., ge=1)
    niche: str = Field(..., max_length=120)
    has_cta: bool = Field(...)


AnalyzeInput = AnalyzeRequest
