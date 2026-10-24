import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Analysis
from app.services.ai_tasks import analyze_jd_details
from app.services.ats_scorer import calculate_ats_score
from app.services.skill_extractor import extract_skills
from app.services.skill_matcher import match_skills
from app.services.skill_normalizer import normalize_skills

router = APIRouter()
logger = logging.getLogger(__name__)


class JDRequest(BaseModel):
    text: str = Field(min_length=30, description="Job description text")
    resume_skills: list[str]
    resume_text: str = ""
    resume_filename: str | None = None


# "def" (not "async def") because Gemini calls block; FastAPI runs this in a thread.
@router.post("/analyze-jd")
def analyze_jd(request: JDRequest, db: Session = Depends(get_db)):
    try:
        jd_skills = normalize_skills(extract_skills(request.text))
    except Exception:
        logger.exception("JD skill extraction failed")
        raise HTTPException(
            status_code=502,
            detail="Could not analyze the job description. Please try again.",
        )

    if not jd_skills:
        raise HTTPException(
            status_code=422,
            detail="No technical skills were found in this job description. Please paste the full description.",
        )

    match_result = match_skills(request.resume_skills, jd_skills)
    ats = calculate_ats_score(match_result["match_percentage"], request.resume_text)

    # Extra details are nice to have: if Gemini fails here, we still return the core result.
    details = {
        "job_title": "",
        "experience_required": "",
        "qualifications": [],
        "keywords": [],
        "suggestions": [],
    }
    try:
        details = analyze_jd_details(
            request.text, request.resume_text, match_result["missing_skills"]
        )
    except Exception:
        logger.exception("JD details failed")

    analysis_id = None
    try:
        row = Analysis(
            resume_filename=request.resume_filename,
            resume_skills=normalize_skills(request.resume_skills),
            jd_skills=jd_skills,
            matched_skills=match_result["matched_skills"],
            missing_skills=match_result["missing_skills"],
            additional_skills=match_result["additional_skills"],
            match_percentage=match_result["match_percentage"],
            ats_score=ats["score"],
        )
        db.add(row)
        db.commit()
        analysis_id = row.id
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not save analysis")

    return {
        "message": "JD analyzed successfully",
        "analysis_id": analysis_id,
        "jd_skills": jd_skills,
        "matched_skills": match_result["matched_skills"],
        "missing_skills": match_result["missing_skills"],
        "additional_skills": match_result["additional_skills"],
        "match_percentage": match_result["match_percentage"],
        "ats_score": ats["score"],
        "ats_details": ats,
        "jd_details": details,
    }