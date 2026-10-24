
import json
import re

from app.services.gemini_service import generate_text


def extract_skills(text: str) -> list[str]:
    """
    Extract explicitly mentioned skills using Gemini.
    Do not silently fall back to incomplete dictionary matching.
    """
    if not text or not text.strip():
        return []

    prompt = f"""
You are a technical skill extraction system.

Extract technical skills explicitly mentioned in the text.
Include programming languages, frameworks, databases, tools,
libraries, platforms, and relevant technical methods.

Rules:
1. Include only skills explicitly mentioned in the text.
2. Do not invent skills or infer skills that are not stated.
3. Preserve recognizable skill names, such as Ruby, Python,
   SQL, Node.js, and Machine Learning.
4. Remove duplicates.
5. Return ONLY a valid JSON array of strings.
6. If no technical skills are present, return [].

TEXT:
{text}
"""

    response = generate_text(prompt).strip()

    # Handle a response wrapped in a Markdown code block.
    response = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        response,
        flags=re.IGNORECASE
    ).strip()

    skills = json.loads(response)

    if not isinstance(skills, list) or not all(
        isinstance(skill, str) for skill in skills
    ):
        raise ValueError("Gemini returned an invalid skills format.")

    # Remove duplicates without losing the original skill names.
    unique_skills = {}
    for skill in skills:
        skill = skill.strip()
        if skill:
            unique_skills.setdefault(skill.casefold(), skill)

    return list(unique_skills.values())
