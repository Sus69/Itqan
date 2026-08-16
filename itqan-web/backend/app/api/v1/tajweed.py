import json
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.api.deps import get_tajweed_evaluator
from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/tajweed", tags=["Tajweed Rules & Forced Alignment"])

@router.post("/analyze")
async def analyze_tajweed(
    file: UploadFile = File(...),
    text: str = Form(...),
    evaluator = Depends(get_tajweed_evaluator),
    current_user: Optional[dict] = Depends(get_current_user)
):
    if not file:
        raise HTTPException(status_code=400, detail="No audio file uploaded.")

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Target Arabic text string is required.")

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

        # 1. Force audio to 16kHz mono array
        audio_array = evaluator.process_audio(file_bytes, filename=file.filename or "")

        # 2. Run 5-Stage Architecture Pipeline
        result = evaluator.evaluate_tajweed_pipeline(audio_array, text.strip())
        result["filename"] = file.filename or ""

        # 3. Log recitation to SQLite database
        if result.get("status") == "success":
            user_id = current_user["id"] if current_user else None
            now = datetime.utcnow().isoformat()
            
            phrase_info = result.get("phrase_verification", {})
            evals = result.get("evaluations", [])
            passed_cnt = sum(1 for e in evals if e.get("status") == "passed")
            failed_cnt = sum(1 for e in evals if e.get("status") == "failed")
            
            acc_score = phrase_info.get("character_accuracy_percentage", 0.0)
            sim_score = phrase_info.get("similarity_percentage", 0.0)
            
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO recitation_logs (
                        id, user_id, target_text, transcription, accuracy_score,
                        audio_duration_seconds, passed_rules_count, failed_rules_count,
                        similarity_percentage, character_accuracy, details_json, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"rec_{uuid.uuid4().hex[:12]}",
                    user_id,
                    text.strip(),
                    phrase_info.get("asr_transcription", ""),
                    acc_score,
                    result.get("audio_duration_seconds", 0.0),
                    passed_cnt,
                    failed_cnt,
                    sim_score,
                    acc_score,
                    json.dumps(result, ensure_ascii=False),
                    now
                ))

        return JSONResponse(content=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tajweed evaluation failed: {str(e)}")
