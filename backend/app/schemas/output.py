from pydantic import BaseModel, ConfigDict, Field


class AnalyzeOutput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    overall_score: int = Field(..., ge=0, le=100)
    hook_score: int = Field(..., ge=0, le=100)
    clarity_score: int = Field(..., ge=0, le=100)
    platform_fit_score: int = Field(..., ge=0, le=100)
    strengths: list[str]
    risks: list[str]
    critique: str
    suggestions: list[str]
