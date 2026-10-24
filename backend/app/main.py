from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.interview import router as interview_router
from app.api.jd import router as jd_router
from app.api.resume import router as resume_router
from app.api.roadmap import router as roadmap_router
from app.database import engine
from app.models import Base

app = FastAPI(
    title="AI Resume Analyzer API",
    description="Backend API for Resume Analysis and Adaptive Mock Interview System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create any missing tables in Neon when the server starts.
try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    print(f"Warning: could not create tables: {exc}")

app.include_router(resume_router)
app.include_router(jd_router)
app.include_router(roadmap_router)
app.include_router(interview_router)


@app.get("/")
def root():
    return {"message": "AI Resume Analyzer API is running!"}


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        return {"status": "error", "database": "disconnected"}


@app.get("/status")
def status():
    return {"status": "ok"}