from fastapi import APIRouter, Header, Request

from ..rate_limit import enforce_rate_limit
from ..internal_auth import build_canonical_json, verify_internal_request
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
    request: Request,
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
    x_internal_assertion: str | None = Header(default=None, alias="X-Creatorkit-Assertion"),
) -> AnalyzeResponse:
    route = request.url.path + (f"?{request.url.query}" if request.url.query else "")
    internal_request = verify_internal_request(
        assertion=x_internal_assertion,
        method=request.method,
        route=route,
        body=build_canonical_json(payload.model_dump(mode="json")),
    )
    account_key = resolve_account_key(
        client_id=x_client_id,
        fallback="anonymous",
        trusted_account_key=internal_request.account_key if internal_request else None,
    )
    enforce_rate_limit("analyze", account_key, limit=12, window_seconds=60)
    scores = score_submission(payload)
    feedback = build_feedback(payload, scores)
    result = AnalyzeResponse(**scores, **feedback)
    save_analysis(account_key, payload, result)
    return result
