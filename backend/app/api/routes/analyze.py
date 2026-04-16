from fastapi import APIRouter

from ...schemas.input import AnalyzeRequest
from ...schemas.output import AnalyzeResponse
from ...services.critique.feedback import build_feedback
from ...services.scoring.predictor import score_submission

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    scores = score_submission(payload)
    feedback = build_feedback(payload)
    return AnalyzeResponse(**scores, **feedback)
