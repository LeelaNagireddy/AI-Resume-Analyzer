import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import InterviewSession, InterviewTurn
from app.services.ai_tasks import evaluate_and_next, interview_summary, start_interview

router = APIRouter(prefix="/interview", tags=["interview"])
logger = logging.getLogger(__name__)


class StartRequest(BaseModel):
    resume_text: str = Field(min_length=50)
    resume_skills: list[str] = []
    jd_skills: list[str] = []
    missing_skills: list[str] = []
    analysis_id: int | None = None
    total_questions: int = Field(default=5, ge=3, le=10)


class AnswerRequest(BaseModel):
    answer: str = Field(min_length=5, max_length=4000)


@router.post("/start")
def start(request: StartRequest, db: Session = Depends(get_db)):
    try:
        data = start_interview(
            request.resume_text, request.resume_skills,
            request.missing_skills, request.jd_skills,
        )
    except Exception:
        logger.exception("Could not start interview")
        raise HTTPException(
            status_code=502, detail="Could not start the interview. Please try again."
        )

    question = data["question"]
    session = InterviewSession(
        analysis_id=request.analysis_id,
        profile_summary=data["profile_summary"],
        jd_skills=request.jd_skills,
        missing_skills=request.missing_skills,
        total_questions=request.total_questions,
    )
    session.turns.append(
        InterviewTurn(order_index=1, question_type=question["type"], question=question["text"])
    )
    try:
        db.add(session)
        db.commit()
        db.refresh(session)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not save interview session")
        raise HTTPException(status_code=503, detail="Database error. Please try again.")

    return {
        "session_id": session.id,
        "question": {"number": 1, "total": session.total_questions, **question},
    }


@router.post("/{session_id}/answer")
def submit_answer(session_id: int, request: AnswerRequest, db: Session = Depends(get_db)):
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    if session.status == "completed":
        raise HTTPException(status_code=409, detail="This interview is already finished.")

    turn = next((t for t in session.turns if t.answer is None), None)
    if turn is None:
        raise HTTPException(status_code=409, detail="There is no open question.")

    history = [
        {"type": t.question_type, "score": t.overall}
        for t in session.turns if t.answer is not None
    ]
    remaining = session.total_questions - turn.order_index

    try:
        result = evaluate_and_next(
            profile=session.profile_summary,
            jd_skills=session.jd_skills,
            missing_skills=session.missing_skills,
            history=history,
            question=turn.question,
            qtype=turn.question_type,
            answer=request.answer,
            remaining=remaining,
        )
    except Exception:
        logger.exception("Answer evaluation failed")
        raise HTTPException(
            status_code=502, detail="Could not evaluate your answer. Please submit it again."
        )

    ev = result["evaluation"]
    turn.answer = request.answer.strip()
    turn.relevance = ev["relevance"]
    turn.completeness = ev["completeness"]
    turn.clarity = ev["clarity"]
    turn.technical = ev["technical"]
    turn.overall = ev["overall"]
    turn.feedback = ev["feedback"]
    turn.improved_answer = ev["improved_answer"]

    next_question = None
    final = None

    if remaining > 0:
        q = result["next_question"]
        session.turns.append(
            InterviewTurn(order_index=turn.order_index + 1, question_type=q["type"], question=q["text"])
        )
        next_question = {
            "number": turn.order_index + 1,
            "total": session.total_questions,
            **q,
        }
    else:
        scores = [t.overall for t in session.turns if t.overall is not None]
        session.average_score = round(sum(scores) / len(scores), 1)
        session.status = "completed"
        try:
            summary = interview_summary(
                session.profile_summary,
                [{"type": t.question_type, "question": t.question, "score": t.overall}
                 for t in session.turns],
            )
        except Exception:
            logger.exception("Interview summary failed")
            summary = {"summary": "Summary unavailable.", "strengths": [],
                       "weaknesses": [], "next_steps": []}
        session.final_summary = summary
        final = {"average_score": session.average_score, **summary}

    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not save answer")
        raise HTTPException(status_code=503, detail="Could not save your answer. Please try again.")

    return {
        "evaluation": ev,
        "next_question": next_question,
        "finished": final is not None,
        "result": final,
    }


@router.get("/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return {
        "session_id": session.id,
        "status": session.status,
        "average_score": session.average_score,
        "final_summary": session.final_summary,
        "turns": [
            {"number": t.order_index, "type": t.question_type, "question": t.question,
             "answer": t.answer, "overall": t.overall, "feedback": t.feedback}
            for t in session.turns
        ],
    }