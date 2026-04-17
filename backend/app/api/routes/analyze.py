from fastapi import APIRouter, Header

from ...schemas.input import AnalyzeRequest
from ...schemas.output import AnalyzeResponse
from ...services.critique.feedback import build_feedback
from ...services.history.store import save_analysis
from ...services.scoring.predictor import score_submission
from ..utils import resolve_account_key

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(
    payload: AnalyzeRequest,
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_account_key: str | None = Header(default=None, alias="X-Account-Key"),
) -> AnalyzeResponse:
    account_key = resolve_account_key(
        account_key=x_account_key,
        client_id=x_client_id,
        fallback="anonymous",
    )
    scores = score_submission(payload)
    feedback = build_feedback(payload, scores)
    result = AnalyzeResponse(**scores, **feedback)
    save_analysis(account_key, payload, result)
    return result
