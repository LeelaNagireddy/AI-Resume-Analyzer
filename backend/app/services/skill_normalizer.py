"""Normalize skill names so the same skill always has the same spelling."""

# Maps a lowercase alias to the one official name we use everywhere.
ALIASES = {
    "js": "JavaScript",
    "javascript": "JavaScript",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "react.js": "React",
    "reactjs": "React",
    "py": "Python",
    "html5": "HTML",
    "css3": "CSS",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongo": "MongoDB",
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "ai": "Artificial Intelligence",
    "natural language processing": "NLP",
    "llm": "LLMs",
    "llms": "LLMs",
    "large language models": "LLMs",
    "gen ai": "Generative AI",
    "genai": "Generative AI",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "restful api": "REST APIs",
    "restful apis": "REST APIs",
    "oop": "OOP",
    "oops": "OOP",
    "object oriented programming": "OOP",
    "object-oriented programming": "OOP",
    "dsa": "Data Structures and Algorithms",
    "vs code": "VS Code",
    "vscode": "VS Code",
    "visual studio code": "VS Code",
    "gcp": "Google Cloud",
    "google cloud platform": "Google Cloud",
    "sklearn": "scikit-learn",
    "tf": "TensorFlow",
}

# Skills that contain "/" but are ONE skill, so we must not split them.
DO_NOT_SPLIT = {"ci/cd", "tcp/ip", "a/b testing", "i/o"}


def normalize_skill(skill: str) -> str:
    """Return the official spelling of one skill."""
    cleaned = skill.strip()
    return ALIASES.get(cleaned.casefold(), cleaned)


def normalize_skills(skills: list[str]) -> list[str]:
    """Split combined skills, fix spellings, remove duplicates, keep order."""
    result = {}

    for raw in skills:
        raw = raw.strip()
        if not raw:
            continue

        # "Git/GitHub" -> ["Git", "GitHub"], but "CI/CD" stays whole.
        if "/" in raw and raw.casefold() not in DO_NOT_SPLIT:
            parts = raw.split("/")
        else:
            parts = [raw]

        for part in parts:
            skill = normalize_skill(part)
            if skill:
                result.setdefault(skill.casefold(), skill)

    return list(result.values())