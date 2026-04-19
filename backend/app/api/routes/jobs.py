from fastapi import APIRouter, HTTPException, status

from ...schemas.job import AnalysisJobResponse, CreateJobRequest
from ...services.jobs.store import create_job, get_job

router = APIRouter(tags=["jobs"])


@router.post("/jobs", response_model=AnalysisJobResponse, status_code=status.HTTP_201_CREATED)
def create_analysis_job(payload: CreateJobRequest) -> AnalysisJobResponse:
    return create_job(payload)


@router.get("/jobs/{job_id}", response_model=AnalysisJobResponse)
def get_analysis_job(job_id: str) -> AnalysisJobResponse:
    try:
        return get_job(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found") from exc
