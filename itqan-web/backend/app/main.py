import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Prevent UnicodeEncodeError on Windows stdout
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="backslashreplace")
    except (AttributeError, OSError):
        pass

from app.core.config import VECTOR_DB_PATH, CORS_ORIGINS
from app.core.database import init_db
from app.core.seed import seed_dummy_users
from app.api.deps import engines
from app.matcher import VoiceMatcher
from app.tajweed import TajweedEvaluator

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
    # 1. Initialize SQLite database schema & seed dummy users
    print("Starting server lifespan: Initializing SQLite database...")
    init_db()
    seed_dummy_users()
    
    # 2. Warm load AI Engines
    print("Warm loading VoiceMatcher & TajweedEvaluator...")
    engines["matcher"] = VoiceMatcher(vector_db_path=VECTOR_DB_PATH)
    engines["tajweed"] = TajweedEvaluator()
    
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


@app.get("/health", tags=["System Health"])
def health_check():
    matcher = engines.get("matcher")
    tajweed_evaluator = engines.get("tajweed")
    return {
        "status": "healthy",
        "api_version": "2.1.0",
        "database": "sqlite_ready",
        "matcher_loaded": matcher is not None,
        "tajweed_loaded": tajweed_evaluator is not None,
        "qari_count": len(matcher.qari_names) if matcher else 0,
    }
