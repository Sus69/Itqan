"""
Engine dependency providers for FastAPI routes.
Thread-safe lazy-loading and background warm-loading for heavy AI models.
"""
import threading

# Global instances populated in background or on first use
engines = {
    "matcher": None,
    "tajweed": None
}

_matcher_lock = threading.Lock()
_tajweed_lock = threading.Lock()


def get_voice_matcher():
    """Returns VoiceMatcher instance, loading it on demand if not yet initialized."""
    with _matcher_lock:
        matcher = engines.get("matcher")
        if matcher is None:
            from app.matcher import VoiceMatcher
            from app.core.config import VECTOR_DB_PATH
            engines["matcher"] = VoiceMatcher(vector_db_path=VECTOR_DB_PATH)
            matcher = engines["matcher"]
        return matcher


def get_tajweed_evaluator():
    """Returns TajweedEvaluator instance, loading it on demand if not yet initialized."""
    with _tajweed_lock:
        evaluator = engines.get("tajweed")
        if evaluator is None:
            from app.tajweed import TajweedEvaluator
            engines["tajweed"] = TajweedEvaluator()
            evaluator = engines["tajweed"]
        return evaluator
