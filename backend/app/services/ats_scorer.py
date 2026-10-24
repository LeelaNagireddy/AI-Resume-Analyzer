import re

SECTION_PATTERNS = {
    "education": r"\beducation\b",
    "experience": r"\bexperience\b",
    "skills": r"\bskills\b",
    "projects": r"\bprojects?\b",
}

SKILL_WEIGHT = 0.70          # 70% of the score
POINTS_PER_SECTION = 7.5     # 4 sections x 7.5 = 30% of the score

FORMULA = (
    "score = 0.70 x skill_match_percentage "
    "+ 7.5 x (number of standard sections found: "
    "education, experience, skills, projects)"
)

DISCLAIMER = (
    "This is an estimate from our own formula, not a score from a real ATS. "
    "Automated scoring can make mistakes."
)


def calculate_ats_score(match_percentage: float, resume_text: str = "") -> dict:
    sections_found = [
        name for name, pattern in SECTION_PATTERNS.items()
        if re.search(pattern, resume_text or "", re.IGNORECASE)
    ]

    skill_part = SKILL_WEIGHT * match_percentage
    structure_part = POINTS_PER_SECTION * len(sections_found)

    return {
        "score": round(skill_part + structure_part, 2),
        "skill_component": round(skill_part, 2),
        "structure_component": round(structure_part, 2),
        "sections_found": sections_found,
        "formula": FORMULA,
        "disclaimer": DISCLAIMER,
    }