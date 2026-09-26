from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.api.resume import router as resume_router

app = FastAPI(
    title="AI Resume Analyzer API",
    description="Backend API for Resume Analysis and Adaptive Mock Interview System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume_router)

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

@app.get("/status")
def status():
    return {
        "status": "ok"
    }

