import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Prevent UnicodeEncodeError on Windows stdout
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="backslashreplace")
    except (AttributeError, OSError):
        pass

from app.matcher import VoiceMatcher
from app.tajweed import TajweedEvaluator

matcher: VoiceMatcher = None
tajweed_evaluator: TajweedEvaluator = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global matcher, tajweed_evaluator
    vector_db_path = os.getenv("VECTOR_DB_PATH", "data/vector_db.json")
    print("Starting server lifespan: Warm loading VoiceMatcher & TajweedEvaluator...")
    
    # 1. Warm load Qari Matcher
    matcher = VoiceMatcher(vector_db_path=vector_db_path)
    
    # 2. Warm load Tajweed Forced Alignment & DSP Engine
    tajweed_evaluator = TajweedEvaluator()
    
    yield
    print("Server lifespan shutdown complete.")


app = FastAPI(
    title="Itqān Quranic Voice Engine API",
    description="FastAPI backend providing Voice Qari Matching and Tajweed Rules Assessment.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "matcher_loaded": matcher is not None,
        "tajweed_loaded": tajweed_evaluator is not None,
        "qari_count": len(matcher.qari_names) if matcher else 0,
    }


@app.post("/api/v1/matcher/recommend")
async def recommend_qari(file: UploadFile = File(...)):
    if matcher is None:
        raise HTTPException(status_code=503, detail="VoiceMatcher engine is not initialized.")

    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")

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


@app.post("/api/v1/tajweed/analyze")
async def analyze_tajweed(
    file: UploadFile = File(...),
    text: str = Form(...),
):
    if tajweed_evaluator is None:
        raise HTTPException(status_code=503, detail="TajweedEvaluator engine is not initialized.")

    if not file:
        raise HTTPException(status_code=400, detail="No audio file uploaded.")

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Target Arabic text string is required.")

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

        # 1. Force audio to 16kHz mono array
        audio_array = tajweed_evaluator.process_audio(file_bytes, filename=file.filename or "")

        # 2. Run 5-Stage Architecture Pipeline
        result = tajweed_evaluator.evaluate_tajweed_pipeline(audio_array, text.strip())
        result["filename"] = file.filename or ""

        return JSONResponse(content=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tajweed evaluation failed: {str(e)}")
