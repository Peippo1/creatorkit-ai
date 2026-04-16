from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes.analyze import router as analyze_router
from .api.routes.health import router as health_router


app = FastAPI(
    title="CreatorKit AI API",
    version="0.1.0",
    description="Heuristic creator content analysis API for the CreatorKit AI scaffold.",
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

app.include_router(health_router)
app.include_router(analyze_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "CreatorKit AI API"}
