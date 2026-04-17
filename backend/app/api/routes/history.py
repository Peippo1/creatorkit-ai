from fastapi import APIRouter, Query

from ...schemas.history import AnalysisHistoryResponse
from ...services.history.store import list_recent_analyses

router = APIRouter(tags=["history"])


@router.get("/history", response_model=AnalysisHistoryResponse)
def history(
    client_id: str = Query("anonymous", min_length=1),
    limit: int = Query(5, ge=1, le=20),
) -> AnalysisHistoryResponse:
    return AnalysisHistoryResponse(entries=list_recent_analyses(client_id, limit))
