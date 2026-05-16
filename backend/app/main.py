import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .api.routes.analyze import router as analyze_router
from .api.routes.account import router as account_router
from .api.routes.drafts import router as drafts_router
from .api.routes.health import router as health_router
from .api.routes.jobs import router as jobs_router
from .api.routes.history import router as history_router
from .api.routes.uploads import router as uploads_router
from .api.routes.session import router as session_router
from .core.env import EnvValidationError, validate_backend_env
from .core.redaction import redact_for_log
from .services.history.store import initialize_history_store

logger = logging.getLogger(__name__)


app = FastAPI(
    title="CreatorKit AI API",
    version="0.1.0",
    description="Account-aware creator content analysis API for the CreatorKit AI scaffold.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

app.include_router(health_router)
app.include_router(analyze_router)
app.include_router(account_router)
app.include_router(drafts_router)
app.include_router(uploads_router)
app.include_router(jobs_router)
app.include_router(history_router)
app.include_router(session_router)


@app.on_event("startup")
def startup() -> None:
    try:
        validate_backend_env()
    except EnvValidationError:
        logger.exception("Backend environment validation failed")
        raise

    try:
        initialize_history_store()
    except Exception as exc:
        logger.warning("History store initialization skipped: %s", redact_for_log(str(exc)))


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "CreatorKit AI API"}
