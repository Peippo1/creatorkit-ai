from fastapi import APIRouter

from ...schemas.input import AnalyzeInput
from ...schemas.output import AnalyzeOutput
from ...services.critique.feedback import build_feedback
from ...services.scoring.predictor import score_submission

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalyzeOutput)
def analyze(payload: AnalyzeInput) -> AnalyzeOutput:
    scores = score_submission(payload)
    feedback = build_feedback(payload, scores)
    return AnalyzeOutput(**scores, **feedback)
