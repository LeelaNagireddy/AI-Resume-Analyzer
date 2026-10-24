from app.services.ats_scorer import calculate_ats_score
from app.services.skill_matcher import match_skills
from app.services.skill_normalizer import normalize_skills


def test_normalize():
    result = normalize_skills(["JS", "Git/GitHub", "ML", "javascript", "CI/CD", ""])
    assert result == ["JavaScript", "Git", "GitHub", "Machine Learning", "CI/CD"]


def test_match():
    result = match_skills(
        ["Python", "JS", "Git/GitHub"],
        ["Python", "JavaScript", "Docker", "Git"],
    )
    assert result["matched_skills"] == ["Git", "JavaScript", "Python"]
    assert result["missing_skills"] == ["Docker"]
    assert result["additional_skills"] == ["GitHub"]
    assert result["match_percentage"] == 75.0


def test_match_empty_jd():
    assert match_skills(["Python"], [])["match_percentage"] == 0


def test_ats_score():
    text = "Education Experience Skills Projects"
    assert calculate_ats_score(75.0, text)["score"] == 82.5
    assert calculate_ats_score(75.0, "")["score"] == 52.5