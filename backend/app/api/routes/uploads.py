from fastapi import APIRouter

from ...schemas.job import GenerateUploadUrlRequest, GenerateUploadUrlResponse
from ...services.jobs.store import generate_upload_url

router = APIRouter(tags=["uploads"])


@router.post("/uploads/url", response_model=GenerateUploadUrlResponse)
def generate_upload_stub(payload: GenerateUploadUrlRequest) -> GenerateUploadUrlResponse:
    return generate_upload_url(payload.file_name, payload.content_type)
