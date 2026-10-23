def calculate_ats_score(match_percentage: float) -> float:
    """
    Calculate the initial ATS score from the skill match percentage.
    """

    return round(match_percentage, 2)