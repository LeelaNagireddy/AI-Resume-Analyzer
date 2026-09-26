import re


SKILLS = [
    "Python",
    "Java",
    "C++",
    "JavaScript",
    "HTML",
    "CSS",
    "SQL",
    "MySQL",
    "Git",
    "GitHub",
    "Machine Learning",
    "Data Science",
    "Deep Learning",
    "FastAPI",
    "Flask",
    "React",
    "Node.js",
    "PostgreSQL",
    "Docker",
    "NLP",
]


def extract_skills(text: str) -> list[str]:
    """
    Extract known technical skills from text.
    """

    found_skills = []

    for skill in SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"

        if re.search(pattern, text, re.IGNORECASE):
            found_skills.append(skill)

    return found_skills