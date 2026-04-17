from fastapi import APIRouter, Header

from ...schemas.input import AnalyzeRequest
from ...schemas.output import AnalyzeResponse
from ...services.critique.feedback import build_feedback
from ...services.history.store import save_analysis
from ...services.scoring.predictor import score_submission

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(
    payload: AnalyzeRequest,
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> AnalyzeResponse:
    scores = score_submission(payload)
    feedback = build_feedback(payload, scores)
    result = AnalyzeResponse(**scores, **feedback)
    save_analysis(x_client_id or "anonymous", payload, result)
    return result
