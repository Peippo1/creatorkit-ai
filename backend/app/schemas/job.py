from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from .output import AnalyzeResponse


class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    complete = "complete"
    failed = "failed"


class GenerateUploadUrlRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    file_name: str = Field(..., max_length=255)
    content_type: str | None = Field(default=None, max_length=120)


class GenerateUploadUrlResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    upload_id: str
    upload_url: str
    method: str = "PUT"
    object_key: str
    expires_in_seconds: int = Field(default=900, ge=60)
    headers: dict[str, str]


class CreateJobRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    platform: str = Field(..., max_length=80)
    content_type: str = Field(..., max_length=80)
    niche: str = Field(..., max_length=120)
    duration_seconds: int = Field(..., ge=1)
    has_cta: bool = Field(...)
    upload_id: str | None = Field(default=None, max_length=120)
    upload_filename: str | None = Field(default=None, max_length=255)
    idea: str | None = Field(default=None, max_length=240)
    hook: str | None = Field(default=None, max_length=240)
    caption: str | None = Field(default=None, max_length=6000)
    transcript: str | None = Field(default=None, max_length=20000)


class AnalysisJobResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    job_id: str
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    upload_id: str | None = None
    upload_filename: str | None = None
    result: AnalyzeResponse | None = None
    error: str | None = None


class CreateJobResponse(AnalysisJobResponse):
    pass


class UploadUrlOutput(GenerateUploadUrlResponse):
    pass
