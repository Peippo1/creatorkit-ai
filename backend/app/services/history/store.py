from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path

from ...schemas.drafts import SavedDraftEntry
from ...schemas.account import CreatorAccountEntry, CreatorAccountResponse
from ...schemas.history import AnalysisHistoryEntry
from ...schemas.input import AnalyzeRequest, display_content_type_label
from ...schemas.output import AnalyzeResponse

DEFAULT_DB_PATH = Path(__file__).resolve().parents[4] / "backend" / "data" / "analysis_history.sqlite3"
DB_PATH_ENV = "CREATORKIT_HISTORY_DB_PATH"
SESSION_RETENTION_DAYS_ENV = "CREATORKIT_SESSION_RETENTION_DAYS"
SESSION_RETENTION_LIMIT_ENV = "CREATORKIT_SESSION_RETENTION_LIMIT"

def _db_path() -> Path:
    configured = os.getenv(DB_PATH_ENV)
    if configured:
        return Path(configured).expanduser()
    return DEFAULT_DB_PATH


def _timestamp(now: datetime | None = None) -> str:
    value = now or datetime.now(UTC)
    return value.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _is_anonymous_session(client_id: str) -> bool:
    return client_id.startswith("session:")


def _session_retention_days() -> int:
    return int(os.getenv(SESSION_RETENTION_DAYS_ENV, "30"))


def _session_retention_limit() -> int:
    return int(os.getenv(SESSION_RETENTION_LIMIT_ENV, "5"))


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
    prune_history_store()


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
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS creator_accounts (
            account_key TEXT PRIMARY KEY,
            provider TEXT NOT NULL,
            email TEXT NOT NULL,
            display_name TEXT NOT NULL,
            niche TEXT NOT NULL,
            brand_name TEXT NOT NULL,
            preferred_platform TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            client_id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            last_activity_at TEXT NOT NULL,
            analysis_count INTEGER NOT NULL DEFAULT 0,
            draft_count INTEGER NOT NULL DEFAULT 0
        )
        """
    )
    conn.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_sessions_last_activity
        ON sessions(last_activity_at DESC, created_at DESC)
        """
    )
    conn.commit()


def _touch_session(
    conn: sqlite3.Connection,
    client_id: str,
    *,
    analysis_delta: int = 0,
    draft_delta: int = 0,
    timestamp: str | None = None,
) -> None:
    if not _is_anonymous_session(client_id):
        return

    current_timestamp = timestamp or _timestamp()
    conn.execute(
        """
        INSERT INTO sessions (
            client_id,
            created_at,
            last_activity_at,
            analysis_count,
            draft_count
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(client_id) DO UPDATE SET
            last_activity_at = excluded.last_activity_at,
            analysis_count = sessions.analysis_count + excluded.analysis_count,
            draft_count = sessions.draft_count + excluded.draft_count
        """,
        (
            client_id,
            current_timestamp,
            current_timestamp,
            analysis_delta,
            draft_delta,
        ),
    )


def _prune_session_rows(conn: sqlite3.Connection) -> int:
    cutoff = _timestamp(datetime.now(UTC) - timedelta(days=_session_retention_days()))
    rows = conn.execute(
        """
        SELECT client_id
        FROM sessions
        WHERE client_id LIKE 'session:%'
        ORDER BY last_activity_at DESC, created_at DESC
        """,
    ).fetchall()
    session_ids = [str(row["client_id"]) for row in rows]
    protected = set(session_ids[:_session_retention_limit()])
    expired = [
        session_id
        for row in rows
        for session_id in [str(row["client_id"])]
        if session_id not in protected or str(row["last_activity_at"]) < cutoff
    ]

    if not expired:
        return 0

    conn.executemany("DELETE FROM analyses WHERE client_id = ?", ((session_id,) for session_id in expired))
    conn.executemany("DELETE FROM drafts WHERE client_id = ?", ((session_id,) for session_id in expired))
    conn.executemany("DELETE FROM sessions WHERE client_id = ?", ((session_id,) for session_id in expired))
    return len(expired)


def prune_history_store() -> int:
    with _connect() as conn:
        deleted = _prune_session_rows(conn)
        conn.commit()
        return deleted


def delete_session_data(client_id: str) -> dict[str, int]:
    if not _is_anonymous_session(client_id):
        raise ValueError("Only anonymous sessions can be cleared")

    with _connect() as conn:
        analyses_deleted = conn.execute(
            "DELETE FROM analyses WHERE client_id = ?",
            (client_id,),
        ).rowcount
        drafts_deleted = conn.execute(
            "DELETE FROM drafts WHERE client_id = ?",
            (client_id,),
        ).rowcount
        sessions_deleted = conn.execute(
            "DELETE FROM sessions WHERE client_id = ?",
            (client_id,),
        ).rowcount
        conn.commit()

    return {
        "analyses_deleted": int(analyses_deleted or 0),
        "drafts_deleted": int(drafts_deleted or 0),
        "sessions_deleted": int(sessions_deleted or 0),
    }


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
        if client_id.startswith("user:"):
            conn.execute(
                """
                INSERT INTO creator_accounts (
                    account_key,
                    provider,
                    email,
                    display_name,
                    niche,
                    brand_name,
                    preferred_platform,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(account_key) DO NOTHING
                """,
                (
                    client_id,
                    "clerk",
                    "",
                    "",
                    "",
                    "",
                    "",
                    timestamp,
                    timestamp,
                ),
            )
        _touch_session(conn, client_id, analysis_delta=1, timestamp=timestamp)
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
        _prune_session_rows(conn)
        conn.commit()
        record_id = int(cursor.lastrowid)

    return AnalysisHistoryEntry(
        id=record_id,
        created_at=timestamp,
        platform=payload.platform,
        content_type=display_content_type_label(payload.content_type),
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
            content_type=display_content_type_label(str(row["content_type"])),
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
    return f"{payload.platform} · {display_content_type_label(payload.content_type)}"


def save_draft(
    client_id: str,
    payload: AnalyzeRequest,
    *,
    created_at: datetime | None = None,
) -> SavedDraftEntry:
    timestamp = _timestamp(created_at)
    request_json = json.dumps(payload.model_dump(), ensure_ascii=False)

    with _connect() as conn:
        if client_id.startswith("user:"):
            conn.execute(
                """
                INSERT INTO creator_accounts (
                    account_key,
                    provider,
                    email,
                    display_name,
                    niche,
                    brand_name,
                    preferred_platform,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(account_key) DO NOTHING
                """,
                (
                    client_id,
                    "clerk",
                    "",
                    "",
                    "",
                    "",
                    "",
                    timestamp,
                    timestamp,
                ),
            )
        _touch_session(conn, client_id, draft_delta=1, timestamp=timestamp)
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
        _prune_session_rows(conn)
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


def _creator_provider(account_key: str, provider: str | None = None) -> str:
    if provider:
        return provider
    if account_key.startswith("user:"):
        return "clerk"
    return "session"


def _creator_defaults(account_key: str) -> dict[str, str]:
    return {
        "account_key": account_key,
        "provider": _creator_provider(account_key),
        "email": "",
        "display_name": "",
        "niche": "",
        "brand_name": "",
        "preferred_platform": "",
    }


def _creator_count(conn: sqlite3.Connection, table: str, account_key: str) -> int:
    row = conn.execute(
        f"SELECT COUNT(*) AS total FROM {table} WHERE client_id = ?",
        (account_key,),
    ).fetchone()
    return int(row["total"] if row is not None else 0)


def _creator_row_to_entry(row: sqlite3.Row) -> CreatorAccountEntry:
    return CreatorAccountEntry(
        account_key=str(row["account_key"]),
        provider=str(row["provider"]),
        email=str(row["email"]),
        display_name=str(row["display_name"]),
        niche=str(row["niche"]),
        brand_name=str(row["brand_name"]),
        preferred_platform=str(row["preferred_platform"]),
        created_at=str(row["created_at"]),
        updated_at=str(row["updated_at"]),
    )


def ensure_creator_account(
    account_key: str,
    *,
    provider: str | None = None,
    email: str | None = None,
    display_name: str | None = None,
    niche: str | None = None,
    brand_name: str | None = None,
    preferred_platform: str | None = None,
    created_at: datetime | None = None,
) -> CreatorAccountEntry:
    timestamp = _timestamp(created_at)
    defaults = _creator_defaults(account_key)

    with _connect() as conn:
        row = conn.execute(
            """
            SELECT account_key, provider, email, display_name, niche, brand_name, preferred_platform,
                   created_at, updated_at
            FROM creator_accounts
            WHERE account_key = ?
            """,
            (account_key,),
        ).fetchone()

        if row is None:
            conn.execute(
                """
                INSERT INTO creator_accounts (
                    account_key,
                    provider,
                    email,
                    display_name,
                    niche,
                    brand_name,
                    preferred_platform,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    defaults["account_key"],
                    _creator_provider(account_key, provider),
                    email or "",
                    display_name or "",
                    niche or "",
                    brand_name or "",
                    preferred_platform or "",
                    timestamp,
                    timestamp,
                ),
            )
            conn.commit()
            return CreatorAccountEntry(
                account_key=defaults["account_key"],
                provider=_creator_provider(account_key, provider),
                email=email or "",
                display_name=display_name or "",
                niche=niche or "",
                brand_name=brand_name or "",
                preferred_platform=preferred_platform or "",
                created_at=timestamp,
                updated_at=timestamp,
            )

        current = _creator_row_to_entry(row)
        next_entry = CreatorAccountEntry(
            account_key=current.account_key,
            provider=_creator_provider(account_key, provider) if provider is not None else current.provider,
            email=email if email is not None else current.email,
            display_name=display_name if display_name is not None else current.display_name,
            niche=niche if niche is not None else current.niche,
            brand_name=brand_name if brand_name is not None else current.brand_name,
            preferred_platform=preferred_platform if preferred_platform is not None else current.preferred_platform,
            created_at=current.created_at,
            updated_at=timestamp,
        )
        conn.execute(
            """
            UPDATE creator_accounts
            SET provider = ?, email = ?, display_name = ?, niche = ?, brand_name = ?, preferred_platform = ?, updated_at = ?
            WHERE account_key = ?
            """,
            (
                next_entry.provider,
                next_entry.email,
                next_entry.display_name,
                next_entry.niche,
                next_entry.brand_name,
                next_entry.preferred_platform,
                timestamp,
                account_key,
            ),
        )
        conn.commit()
        return next_entry


def get_creator_account(account_key: str) -> CreatorAccountEntry:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT account_key, provider, email, display_name, niche, brand_name, preferred_platform,
                   created_at, updated_at
            FROM creator_accounts
            WHERE account_key = ?
            """,
            (account_key,),
        ).fetchone()

    if row is None:
        return ensure_creator_account(account_key)
    return _creator_row_to_entry(row)


def get_creator_account_summary(account_key: str) -> CreatorAccountResponse:
    account = get_creator_account(account_key)

    with _connect() as conn:
        analyses_count = _creator_count(conn, "analyses", account_key)
        drafts_count = _creator_count(conn, "drafts", account_key)

    return CreatorAccountResponse(
        account=account,
        analyses_count=analyses_count,
        drafts_count=drafts_count,
    )
