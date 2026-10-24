import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Roadmap
from app.services.ai_tasks import build_roadmap

router = APIRouter(tags=["roadmap"])
logger = logging.getLogger(__name__)


class RoadmapRequest(BaseModel):
    missing_skills: list[str]
    resume_skills: list[str] = []
    job_title: str = ""
    weeks: int = Field(default=4, ge=1, le=12)
    analysis_id: int | None = None


class ProgressRequest(BaseModel):
    completed_tasks: list[str]


@router.post("/roadmap")
def create_roadmap(request: RoadmapRequest, db: Session = Depends(get_db)):
    if not request.missing_skills:
        return {
            "roadmap_id": None,
            "summary": "You already cover every skill in this job description. Focus on interview practice.",
            "items": [],
            "completed_tasks": [],
        }

    try:
        data = build_roadmap(
            request.missing_skills, request.resume_skills, request.job_title, request.weeks
        )
    except Exception:
        logger.exception("Roadmap generation failed")
        raise HTTPException(
            status_code=502, detail="Could not create the roadmap. Please try again."
        )

    roadmap_id = None
    try:
        row = Roadmap(
            analysis_id=request.analysis_id,
            job_title=request.job_title[:255],
            summary=data["summary"],
            items=data["items"],
            completed_tasks=[],
        )
        db.add(row)
        db.commit()
        roadmap_id = row.id
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not save roadmap")

    return {"roadmap_id": roadmap_id, "completed_tasks": [], **data}


@router.put("/roadmap/{roadmap_id}/progress")
def save_progress(roadmap_id: int, request: ProgressRequest, db: Session = Depends(get_db)):
    row = db.get(Roadmap, roadmap_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Roadmap not found.")
    try:
        row.completed_tasks = list(request.completed_tasks)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not save progress")
        raise HTTPException(status_code=503, detail="Could not save progress.")
    return {"completed_tasks": row.completed_tasks}