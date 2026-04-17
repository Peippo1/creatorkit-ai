from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from .input import AnalyzeRequest


class SavedDraftEntry(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id: int
    created_at: str
    title: str
    request: AnalyzeRequest


class SavedDraftResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    entry: SavedDraftEntry


class SavedDraftsResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    entries: list[SavedDraftEntry]


SavedDraftOutput = SavedDraftResponse
