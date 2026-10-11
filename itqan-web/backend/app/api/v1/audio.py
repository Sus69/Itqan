import uuid
import hashlib
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import Response
from app.api.deps import get_tajweed_evaluator

TTS_CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "tts_cache"
TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/audio", tags=["AI Audio Recitation & Teacher Feedback"])


@router.get("/tts")
async def generate_arabic_tts(text: str, voice: str = "ar-SA-HamedNeural", rate: str = "+0%"):
    """
    Synthesizes authentic Arabic neural pronunciation with disk caching.
    Supports individual letters, words, and Quranic verses.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text parameter is required.")

    clean_text = text.strip()
    cache_key = hashlib.md5(f"{clean_text}:{voice}:{rate}".encode("utf-8")).hexdigest()
    cache_file = TTS_CACHE_DIR / f"{cache_key}.mp3"

    if cache_file.exists():
        return Response(content=cache_file.read_bytes(), media_type="audio/mpeg")

    try:
        import edge_tts
        communicate = edge_tts.Communicate(clean_text, voice, rate=rate)
        audio_data = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.extend(chunk["data"])

        if not audio_data:
            raise HTTPException(status_code=500, detail="Speech generation produced empty audio.")

        cache_file.write_bytes(bytes(audio_data))
        return Response(content=bytes(audio_data), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")

@router.post("/evaluate")
async def evaluate_recitation_contract(
    audio_file: UploadFile = File(...),
    expected_text: str = Form(...),
    lesson_id: Optional[str] = Form("general"),
    evaluator = Depends(get_tajweed_evaluator)
):
    """
    Submits an audio recording for AI evaluation against expected text or Tajweed rule,
    returning structured pedagogical feedback as defined in api-contracts.md.
    """
    if not audio_file:
        raise HTTPException(status_code=400, detail="No audio file uploaded.")
    if not expected_text or not expected_text.strip():
        raise HTTPException(status_code=400, detail="Expected text string is required.")

    try:
        file_bytes = await audio_file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

        audio_array = evaluator.process_audio(file_bytes, filename=audio_file.filename or "")
        raw_result = evaluator.evaluate_tajweed_pipeline(audio_array, expected_text.strip())

        if raw_result.get("status") == "insufficient_speech":
            return {
                "success": False,
                "error": {
                    "code": "INSUFFICIENT_SPEECH",
                    "message": raw_result.get("details", "Audio too quiet or contains no valid Quranic speech.")
                }
            }

        phrase_info = raw_result.get("phrase_verification", {})
        evaluations = raw_result.get("evaluations", [])

        char_acc = phrase_info.get("character_accuracy_percentage", 0.0)
        similarity = phrase_info.get("similarity_percentage", 0.0)
        alignment_conf = raw_result.get("alignment_confidence", 80.0)

        # Calculate scores
        pronunciation_score = round(char_acc, 1)
        fluency_score = round(similarity, 1)
        
        # Rule scores
        passed_rules = [e for e in evaluations if e.get("status") == "passed"]
        rule_score = round((len(passed_rules) / max(1, len(evaluations))) * 100.0, 1) if evaluations else pronunciation_score
        
        overall_score = round((0.4 * pronunciation_score) + (0.3 * fluency_score) + (0.3 * rule_score), 1)
        mastery = overall_score >= 85.0

        # Translate rule evaluations into pedagogical teacher mistakes
        mistakes = []
        for e in evaluations:
            if e.get("status") in ("failed", "needs_review", "uncertain"):
                rule_name = e.get("rule_name", "")
                arabic_name = e.get("arabic_name", "")
                suggestion = e.get("suggestion", "")
                
                severity = "high" if e.get("status") == "failed" else "medium"
                mistakes.append({
                    "word": e.get("char_match") or expected_text.split()[-1] if expected_text.split() else "",
                    "mistake_type": "tajweed_rule",
                    "rule_id": e.get("rule_id"),
                    "rule_name": f"{rule_name} ({arabic_name})",
                    "severity": severity,
                    "expected_metric": e.get("expected_metric", ""),
                    "detected_metric": e.get("detected_metric", ""),
                    "ai_teacher_feedback": suggestion or f"Focus on perfecting the {rule_name} timing and acoustic resonance."
                })

        eval_id = f"eval_{uuid.uuid4().hex[:8]}"

        return {
            "success": True,
            "data": {
                "evaluation_id": eval_id,
                "overall_score": overall_score,
                "fluency_score": fluency_score,
                "pronunciation_score": pronunciation_score,
                "rule_compliance_score": rule_score,
                "asr_transcription": phrase_info.get("asr_transcription", ""),
                "expected_text": expected_text.strip(),
                "mistakes": mistakes,
                "mastery_achieved": mastery,
                "raw_evaluations": evaluations,
                "alignment": raw_result.get("alignment", [])
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio evaluation failed: {str(e)}")
