from .skill_normalizer import normalize_skills


def match_skills(resume_skills: list[str], jd_skills: list[str]) -> dict:
    """Compare resume skills with job description skills (after normalizing)."""

    resume = {s.casefold(): s for s in normalize_skills(resume_skills)}
    jd = {s.casefold(): s for s in normalize_skills(jd_skills)}

    matched = resume.keys() & jd.keys()
    missing = jd.keys() - resume.keys()
    additional = resume.keys() - jd.keys()

    match_percentage = (len(matched) / len(jd)) * 100 if jd else 0

    return {
        "matched_skills": sorted(jd[k] for k in matched),
        "missing_skills": sorted(jd[k] for k in missing),
        "additional_skills": sorted(resume[k] for k in additional),
        "match_percentage": round(match_percentage, 2),
    }