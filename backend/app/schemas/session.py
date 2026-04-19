from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class SessionClearResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    analyses_deleted: int = Field(..., ge=0)
    drafts_deleted: int = Field(..., ge=0)
    sessions_deleted: int = Field(..., ge=0)
