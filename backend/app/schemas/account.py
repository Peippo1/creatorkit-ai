from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CreatorAccountEntry(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    account_key: str
    provider: str
    email: str = ""
    display_name: str = ""
    niche: str = ""
    brand_name: str = ""
    preferred_platform: str = ""
    created_at: str
    updated_at: str


class CreatorAccountUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    email: str | None = Field(default=None, max_length=320)
    display_name: str | None = Field(default=None, max_length=120)
    niche: str | None = Field(default=None, max_length=120)
    brand_name: str | None = Field(default=None, max_length=120)
    preferred_platform: str | None = Field(default=None, max_length=80)


class CreatorAccountResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    account: CreatorAccountEntry
    analyses_count: int
    drafts_count: int
