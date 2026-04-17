from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class AnalysisHistoryEntry(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id: int
    created_at: str
    platform: str
    content_type: str
    niche: str
    duration_seconds: int = Field(..., ge=1)
    overall_score: int = Field(..., ge=0, le=100)
    hook_score: int = Field(..., ge=0, le=100)
    clarity_score: int = Field(..., ge=0, le=100)
    platform_fit_score: int = Field(..., ge=0, le=100)
    critique: str
    top_suggestion: str


class AnalysisHistoryResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    entries: list[AnalysisHistoryEntry]


AnalysisHistoryOutput = AnalysisHistoryResponse
