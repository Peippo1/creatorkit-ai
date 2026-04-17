from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path

from ...schemas.drafts import SavedDraftEntry
from ...schemas.history import AnalysisHistoryEntry
from ...schemas.input import AnalyzeRequest
from ...schemas.output import AnalyzeResponse

DEFAULT_DB_PATH = Path(__file__).resolve().parents[4] / "backend" / "data" / "analysis_history.sqlite3"
DB_PATH_ENV = "CREATORKIT_HISTORY_DB_PATH"


def _db_path() -> Path:
    configured = os.getenv(DB_PATH_ENV)
    if configured:
        return Path(configured).expanduser()
    return DEFAULT_DB_PATH


def _timestamp(now: datetime | None = None) -> str:
    value = now or datetime.now(UTC)
    return value.replace(microsecond=0).isoformat().replace("+00:00", "Z")


@contextmanager
def _connect():
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL")
    except sqlite3.DatabaseError:
        pass
    try:
        _ensure_schema(conn)
        yield conn
    finally:
        conn.close()


def initialize_history_store() -> None:
    with _connect():
        pass


def _ensure_schema(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            platform TEXT NOT NULL,
            content_type TEXT NOT NULL,
            niche TEXT NOT NULL,
            duration_seconds INTEGER NOT NULL,
            overall_score INTEGER NOT NULL,
            hook_score INTEGER NOT NULL,
            clarity_score INTEGER NOT NULL,
            platform_fit_score INTEGER NOT NULL,
            critique TEXT NOT NULL,
            top_suggestion TEXT NOT NULL,
            request_json TEXT NOT NULL,
            response_json TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_analyses_client_created
        ON analyses(client_id, created_at DESC, id DESC)
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS drafts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            title TEXT NOT NULL,
            request_json TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_drafts_client_created
        ON drafts(client_id, created_at DESC, id DESC)
        """
    )
    conn.commit()


def _top_suggestion(result: AnalyzeResponse) -> str:
    if result.suggestions:
        return result.suggestions[0]
    return "Keep tightening the opening and CTA."


def save_analysis(
    client_id: str,
    payload: AnalyzeRequest,
    result: AnalyzeResponse,
    *,
    created_at: datetime | None = None,
) -> AnalysisHistoryEntry:
    timestamp = _timestamp(created_at)
    request_json = json.dumps(payload.model_dump(), ensure_ascii=False)
    response_json = json.dumps(result.model_dump(), ensure_ascii=False)

    with _connect() as conn:
        cursor = conn.execute(
            """
            INSERT INTO analyses (
                client_id,
                created_at,
                platform,
                content_type,
                niche,
                duration_seconds,
                overall_score,
                hook_score,
                clarity_score,
                platform_fit_score,
                critique,
                top_suggestion,
                request_json,
                response_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                client_id,
                timestamp,
                payload.platform,
                payload.content_type,
                payload.niche,
                payload.duration_seconds,
                result.overall_score,
                result.hook_score,
                result.clarity_score,
                result.platform_fit_score,
                result.critique,
                _top_suggestion(result),
                request_json,
                response_json,
            ),
        )
        conn.commit()
        record_id = int(cursor.lastrowid)

    return AnalysisHistoryEntry(
        id=record_id,
        created_at=timestamp,
        platform=payload.platform,
        content_type=payload.content_type,
        niche=payload.niche,
        duration_seconds=payload.duration_seconds,
        overall_score=result.overall_score,
        hook_score=result.hook_score,
        clarity_score=result.clarity_score,
        platform_fit_score=result.platform_fit_score,
        critique=result.critique,
        top_suggestion=_top_suggestion(result),
    )


def list_recent_analyses(client_id: str, limit: int = 5) -> list[AnalysisHistoryEntry]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, created_at, platform, content_type, niche, duration_seconds,
                   overall_score, hook_score, clarity_score, platform_fit_score,
                   critique, top_suggestion
            FROM analyses
            WHERE client_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT ?
            """,
            (client_id, limit),
        ).fetchall()

    return [
        AnalysisHistoryEntry(
            id=int(row["id"]),
            created_at=str(row["created_at"]),
            platform=str(row["platform"]),
            content_type=str(row["content_type"]),
            niche=str(row["niche"]),
            duration_seconds=int(row["duration_seconds"]),
            overall_score=int(row["overall_score"]),
            hook_score=int(row["hook_score"]),
            clarity_score=int(row["clarity_score"]),
            platform_fit_score=int(row["platform_fit_score"]),
            critique=str(row["critique"]),
            top_suggestion=str(row["top_suggestion"]),
        )
        for row in rows
    ]


def _draft_title(payload: AnalyzeRequest) -> str:
    return f"{payload.platform} · {payload.content_type}"


def save_draft(
    client_id: str,
    payload: AnalyzeRequest,
    *,
    created_at: datetime | None = None,
) -> SavedDraftEntry:
    timestamp = _timestamp(created_at)
    request_json = json.dumps(payload.model_dump(), ensure_ascii=False)

    with _connect() as conn:
        cursor = conn.execute(
            """
            INSERT INTO drafts (
                client_id,
                created_at,
                title,
                request_json
            ) VALUES (?, ?, ?, ?)
            """,
            (
                client_id,
                timestamp,
                _draft_title(payload),
                request_json,
            ),
        )
        conn.commit()
        record_id = int(cursor.lastrowid)

    return SavedDraftEntry(
        id=record_id,
        created_at=timestamp,
        title=_draft_title(payload),
        request=payload,
    )


def list_saved_drafts(client_id: str, limit: int = 10) -> list[SavedDraftEntry]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, created_at, title, request_json
            FROM drafts
            WHERE client_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT ?
            """,
            (client_id, limit),
        ).fetchall()

    return [
        SavedDraftEntry(
            id=int(row["id"]),
            created_at=str(row["created_at"]),
            title=str(row["title"]),
            request=AnalyzeRequest.model_validate_json(str(row["request_json"])),
        )
        for row in rows
    ]
