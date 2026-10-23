from fastapi import APIRouter
from pydantic import BaseModel

from app.services.skill_extractor import extract_skills
from app.services.skill_matcher import match_skills
from app.services.ats_scorer import calculate_ats_score

router = APIRouter()


class JDRequest(BaseModel):
    text: str
    resume_skills: list[str]


@router.post("/analyze-jd")
async def analyze_jd(request: JDRequest):
    jd_skills = extract_skills(request.text)

    match_result = match_skills(
        request.resume_skills,
        jd_skills
    )
    ats_score = calculate_ats_score(
    	match_result["match_percentage"]
)

    return {
        "message": "JD analyzed successfully",
        "jd_skills": jd_skills,
        "matched_skills": match_result["matched_skills"],
        "missing_skills": match_result["missing_skills"],
	"match_percentage": match_result["match_percentage"],
	"ats_score": ats_score
    }