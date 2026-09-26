def match_skills(resume_skills: list[str], jd_skills: list[str]) -> dict:
    """
    Compare resume skills with job description skills.
    """

    resume_set = {skill.lower() for skill in resume_skills}
    jd_set = {skill.lower() for skill in jd_skills}

    matched = resume_set.intersection(jd_set)
    missing = jd_set - resume_set

    match_percentage = (
        (len(matched) / len(jd_set)) * 100
        if jd_set
        else 0
    )

    return {
        "matched_skills": sorted(matched),
        "missing_skills": sorted(missing),
        "match_percentage": round(match_percentage, 2)
    }