import os
import sys
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Prevent UnicodeEncodeError on Windows stdout
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="backslashreplace")
    except (AttributeError, OSError):
        pass

from app.core.config import CORS_ORIGINS
from app.core.database import init_db
from app.core.seed import seed_dummy_users
from app.api.deps import engines, get_voice_matcher, get_tajweed_evaluator

# API Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.courses import router as courses_router
from app.api.v1.qaida import router as qaida_router
from app.api.v1.makharij import router as makharij_router
from app.api.v1.qaris import router as qaris_router
from app.api.v1.matcher import router as matcher_router
from app.api.v1.tajweed import router as tajweed_router
from app.api.v1.audio import router as audio_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQLite database schema & seed dummy users (<0.1s)
    print("Starting server lifespan: Initializing SQLite database...")
    init_db()
    seed_dummy_users()

    # 2. Warm load heavy AI Engines (WavLM, Whisper, XLS-R) in background daemon thread
    # This allows FastAPI & Uvicorn to bind port 8000 IMMEDIATELY (<1.5s) and accept requests
    def _warmup_worker():
        print("  [*] [Background] Warming up VoiceMatcher AI engine...")
        try:
            get_voice_matcher()
            print("  [✓] [Background] VoiceMatcher (WavLM SV) engine ready in memory.")
        except Exception as e:
            print(f"  [!] [Background] VoiceMatcher load notice: {e}")

        print("  [*] [Background] Warming up TajweedEvaluator (Whisper + XLS-R) engines...")
        try:
            get_tajweed_evaluator()
            print("  [✓] [Background] TajweedEvaluator ASR & alignment engines ready in memory.")
        except Exception as e:
            print(f"  [!] [Background] TajweedEvaluator load notice: {e}")

    threading.Thread(target=_warmup_worker, daemon=True, name="AI-Engine-Warmup").start()

    yield
    print("Server lifespan shutdown complete.")


app = FastAPI(
    title="Itqān Quranic Voice Engine & Learning Platform API",
    description="Comprehensive FastAPI backend providing Authentication, User Mastery, Curriculum Delivery, Voice Qari Matching, and 5-Stage Tajweed Rules DSP Assessment.",
    version="2.1.0",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all v1 API Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(courses_router, prefix="/api/v1")
app.include_router(qaida_router, prefix="/api/v1")
app.include_router(makharij_router, prefix="/api/v1")
app.include_router(qaris_router, prefix="/api/v1")
app.include_router(matcher_router, prefix="/api/v1")
app.include_router(tajweed_router, prefix="/api/v1")
app.include_router(audio_router, prefix="/api/v1")


@app.api_route("/health", methods=["GET", "HEAD"], tags=["System Health"])
def health_check():
    matcher = engines.get("matcher")
    tajweed_evaluator = engines.get("tajweed")
    return {
        "status": "healthy",
        "api_version": "2.1.0",
        "database": "sqlite_ready",
        "matcher_loaded": matcher is not None,
        "tajweed_loaded": tajweed_evaluator is not None,
        "qari_count": len(matcher.qari_names) if matcher else 242,
    }
