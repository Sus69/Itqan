import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime
from app.core.config import DB_PATH

_local = threading.local()

def get_db_connection() -> sqlite3.Connection:
    """Get or create a thread-local SQLite connection."""
    if not hasattr(_local, "conn") or _local.conn is None:
        conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        _local.conn = conn
    return _local.conn

@contextmanager
def get_db():
    """Context manager for database operations with automatic commit/rollback."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise

def init_db():
    """Initialize all database tables on application startup."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            reference_qari_name TEXT DEFAULT 'Mahmoud Khalil Al-Husary',
            target_daily_minutes INTEGER DEFAULT 15,
            streak_days INTEGER DEFAULT 0,
            last_active_date TEXT,
            total_xp INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        """)

        # 2. User Progress Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_progress (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,      -- 'tajweed' | 'qaida' | 'makharij'
            lesson_id TEXT NOT NULL,      -- e.g. '1.1', 'madd_asli', 'lesson_01'
            status TEXT NOT NULL,         -- 'completed' | 'in_progress' | 'not_started'
            score INTEGER DEFAULT 0,      -- 0..100
            attempts INTEGER DEFAULT 0,
            mastery_level TEXT DEFAULT 'novice', -- 'novice', 'proficient', 'mastered'
            last_practiced_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE (user_id, course_id, lesson_id)
        );
        """)

        # 3. Recitation Logs Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS recitation_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            target_text TEXT NOT NULL,
            transcription TEXT,
            accuracy_score REAL NOT NULL,
            audio_duration_seconds REAL NOT NULL,
            passed_rules_count INTEGER DEFAULT 0,
            failed_rules_count INTEGER DEFAULT 0,
            similarity_percentage REAL DEFAULT 0.0,
            character_accuracy REAL DEFAULT 0.0,
            details_json TEXT,            -- Full JSON evaluation details
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        """)

        # 4. Daily Activity Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_activity (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            activity_date TEXT NOT NULL,  -- YYYY-MM-DD
            minutes_practiced INTEGER DEFAULT 0,
            ayahs_recited INTEGER DEFAULT 0,
            xp_earned INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE (user_id, activity_date)
        );
        """)
        
        conn.commit()
