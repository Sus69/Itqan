from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.api.deps import get_voice_matcher

router = APIRouter(tags=["Voice Qari Matching"])

@router.post("/matcher/recommend")
async def recommend_qari(
    file: UploadFile = File(...),
    matcher = Depends(get_voice_matcher)
):
    if not file:
        raise HTTPException(status_code=400, detail="No audio file uploaded.")

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # 1. Universal audio decoding to 16kHz mono array
        audio_array = matcher.process_audio(file_bytes, filename=file.filename or "")

        # 2. Extract WavLM SV speaker x-vector embedding
        user_embedding = matcher.extract_embedding(audio_array)

        # 3. Perform Cosine Similarity against all 242 Qari vectors in RAM
        top_matches = matcher.find_match(user_embedding, top_k=3)

        return JSONResponse(
            content={
                "status": "success",
                "filename": file.filename,
                "duration_seconds": round(float(len(audio_array) / 16000.0), 2),
                "matches": top_matches,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice matching failed: {str(e)}")

@router.post("/voice/match")
async def match_voice_contract(
    audio_file: UploadFile = File(...),
    matcher = Depends(get_voice_matcher)
):
    """API contract compliant voice matching endpoint."""
    if not audio_file:
        raise HTTPException(status_code=400, detail="No audio file uploaded.")

    try:
        file_bytes = await audio_file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        audio_array = matcher.process_audio(file_bytes, filename=audio_file.filename or "")
        user_embedding = matcher.extract_embedding(audio_array)
        top_matches = matcher.find_match(user_embedding, top_k=3)

        formatted_matches = []
        for idx, m in enumerate(top_matches, start=1):
            q_name = m.get("qari")
            conf_pct = round(float(m.get("confidence", 0.0)) * 100.0, 1)
            formatted_matches.append({
                "qari_id": f"qri_{idx:02d}",
                "name": q_name,
                "confidence_score": conf_pct,
                "match_reasons": ["Similar vocal register", "Harmonic resonance match"]
            })

        return {
            "success": True,
            "data": {
                "matches": formatted_matches
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice matching failed: {str(e)}")
