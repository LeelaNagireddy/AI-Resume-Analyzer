from fastapi import FastAPI

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
    return {
        "status": "ok"
    }