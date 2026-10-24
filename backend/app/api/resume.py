import logging
import os

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.resume_parser import extract_resume_text_from_bytes
from app.services.skill_extractor import extract_skills

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    # 1. Check the file type first.
    original_name = os.path.basename(file.filename or "")
    extension = os.path.splitext(original_name)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload a PDF or DOCX resume.",
        )

    # 2. Read the file into memory (at most MAX_FILE_SIZE + 1 bytes).
    contents = await file.read(MAX_FILE_SIZE + 1)

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File is too large. The maximum size is 5 MB.",
        )

    # 3. Parse the resume directly from memory.
    try:
        extracted_text = extract_resume_text_from_bytes(contents, extension)
    except Exception:
        logger.exception("Failed to parse resume")
        raise HTTPException(
            status_code=422,
            detail="Could not read this file. It may be corrupted or password-protected.",
        )

    # 4. Scanned PDFs and blank files produce no text.
    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="No text found. The file may be a scanned image. Please upload a text-based PDF or DOCX.",
        )

    # 5. Extract skills (this calls Gemini, so it can fail).
    try:
        skills = extract_skills(extracted_text)
    except Exception:
        logger.exception("Skill extraction failed")
        raise HTTPException(
            status_code=502,
            detail="Skill extraction failed. Please try again in a moment.",
        )

    return {
        "filename": original_name,
        "message": "Resume uploaded successfully",
        "text": extracted_text,
        "skills": skills,
    }