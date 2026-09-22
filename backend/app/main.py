from fastapi import FastAPI
from app.database import engine

app = FastAPI(
    title="AI Resume Analyzer API",
    description="Backend API for Resume Analysis and Adaptive Mock Interview System",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "AI Resume Analyzer API is running!"
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            return {
                "status": "ok",
                "database": "connected"
            }
    except Exception:
        return {
            "status": "error",
            "database": "disconnected"
        }

