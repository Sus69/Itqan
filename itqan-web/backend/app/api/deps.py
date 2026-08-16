"""
Engine dependency providers for FastAPI routes.
"""
from fastapi import HTTPException

# Global instances populated during FastAPI lifespan in main.py
engines = {
    "matcher": None,
    "tajweed": None
}

def get_voice_matcher():
    matcher = engines.get("matcher")
    if matcher is None:
        from app.matcher import VoiceMatcher
        from app.core.config import VECTOR_DB_PATH
        engines["matcher"] = VoiceMatcher(vector_db_path=VECTOR_DB_PATH)
        matcher = engines["matcher"]
    return matcher

def get_tajweed_evaluator():
    evaluator = engines.get("tajweed")
    if evaluator is None:
        from app.tajweed import TajweedEvaluator
        engines["tajweed"] = TajweedEvaluator()
        evaluator = engines["tajweed"]
    return evaluator

