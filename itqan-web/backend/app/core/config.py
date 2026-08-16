import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database
DB_PATH = os.getenv("DATABASE_PATH", str(DATA_DIR / "itqan.db"))

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "itqan-super-secret-production-key-2026-quranic-ai")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080")) # 7 days

# Vector DB
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", str(DATA_DIR / "vector_db.json"))

# CORS
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]
