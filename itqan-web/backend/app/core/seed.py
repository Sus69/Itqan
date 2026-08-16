"""
Seed module for pre-populating dummy users, initial lesson mastery, and recitation logs.
"""

import uuid
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import hash_password

DUMMY_USERS = [
    {
        "id": "usr_ahmed_101",
        "email": "ahmed@itqan.app",
        "username": "ahmed_qari",
        "full_name": "Ahmed Al-Mansoor",
        "password": "Password123!",
        "reference_qari_name": "Mahmoud Khalil Al-Hussary",
        "target_daily_minutes": 20,
        "streak_days": 14,
        "total_xp": 1450,
        "progress": [
            {"course_id": "tajweed", "lesson_id": "1.1", "status": "completed", "score": 98, "mastery": "mastered"},
            {"course_id": "tajweed", "lesson_id": "1.2", "status": "completed", "score": 94, "mastery": "mastered"},
            {"course_id": "tajweed", "lesson_id": "2.1", "status": "completed", "score": 92, "mastery": "mastered"},
            {"course_id": "tajweed", "lesson_id": "3.3", "status": "completed", "score": 88, "mastery": "proficient"},
            {"course_id": "tajweed", "lesson_id": "4.1", "status": "completed", "score": 96, "mastery": "mastered"},
            {"course_id": "tajweed", "lesson_id": "6.1", "status": "completed", "score": 95, "mastery": "mastered"},
            {"course_id": "qaida", "lesson_id": "lesson_01", "status": "completed", "score": 100, "mastery": "mastered"},
            {"course_id": "qaida", "lesson_id": "lesson_02", "status": "completed", "score": 95, "mastery": "mastered"},
            {"course_id": "qaida", "lesson_id": "lesson_03", "status": "completed", "score": 90, "mastery": "mastered"},
        ],
        "recitations": [
            {
                "target_text": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
                "transcription": "الحمد لله رب العالمين",
                "accuracy_score": 96.5,
                "duration": 3.4,
                "passed_rules": 4,
                "failed_rules": 0
            },
            {
                "target_text": "قُلْ هُوَ اللَّهُ أَحَدٌ",
                "transcription": "قل هو الله احد",
                "accuracy_score": 94.0,
                "duration": 2.8,
                "passed_rules": 3,
                "failed_rules": 0
            }
        ]
    },
    {
        "id": "usr_fatima_202",
        "email": "fatima@itqan.app",
        "username": "fatima_reciter",
        "full_name": "Fatima Az-Zahra",
        "password": "Password123!",
        "reference_qari_name": "Mishary Rashid Alafasy",
        "target_daily_minutes": 15,
        "streak_days": 7,
        "total_xp": 720,
        "progress": [
            {"course_id": "tajweed", "lesson_id": "1.1", "status": "completed", "score": 90, "mastery": "mastered"},
            {"course_id": "tajweed", "lesson_id": "2.1", "status": "completed", "score": 85, "mastery": "proficient"},
            {"course_id": "tajweed", "lesson_id": "4.1", "status": "in_progress", "score": 75, "mastery": "proficient"},
            {"course_id": "qaida", "lesson_id": "lesson_01", "status": "completed", "score": 98, "mastery": "mastered"},
            {"course_id": "qaida", "lesson_id": "lesson_02", "status": "completed", "score": 92, "mastery": "mastered"},
        ],
        "recitations": [
            {
                "target_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                "transcription": "بسم الله الرحمن الرحيم",
                "accuracy_score": 92.0,
                "duration": 4.1,
                "passed_rules": 3,
                "failed_rules": 0
            }
        ]
    },
    {
        "id": "usr_demo_303",
        "email": "demo@itqan.app",
        "username": "demo_user",
        "full_name": "Demo Student",
        "password": "Password123!",
        "reference_qari_name": "Abdul Basit Abdul Samad",
        "target_daily_minutes": 10,
        "streak_days": 3,
        "total_xp": 260,
        "progress": [
            {"course_id": "qaida", "lesson_id": "lesson_01", "status": "completed", "score": 95, "mastery": "mastered"},
            {"course_id": "qaida", "lesson_id": "lesson_02", "status": "in_progress", "score": 80, "mastery": "proficient"},
            {"course_id": "tajweed", "lesson_id": "1.1", "status": "completed", "score": 88, "mastery": "proficient"},
        ],
        "recitations": [
            {
                "target_text": "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
                "transcription": "قل اعوذ برب الفلق",
                "accuracy_score": 88.0,
                "duration": 3.2,
                "passed_rules": 2,
                "failed_rules": 1
            }
        ]
    }
]

def seed_dummy_users():
    """Seeds default demo users if they don't already exist."""
    now = datetime.utcnow()
    today_str = now.strftime("%Y-%m-%d")

    with get_db() as conn:
        cursor = conn.cursor()
        
        for u in DUMMY_USERS:
            cursor.execute("SELECT id FROM users WHERE email = ? OR username = ?", (u["email"], u["username"]))
            row = cursor.fetchone()
            
            if not row:
                print(f"Seeding dummy user: {u['username']} ({u['email']})...")
                hashed_pwd = hash_password(u["password"])
                created_at = (now - timedelta(days=u["streak_days"])).isoformat()
                
                cursor.execute("""
                    INSERT INTO users (id, email, username, full_name, hashed_password, reference_qari_name, target_daily_minutes, streak_days, last_active_date, total_xp, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    u["id"], u["email"], u["username"], u["full_name"],
                    hashed_pwd, u["reference_qari_name"], u["target_daily_minutes"],
                    u["streak_days"], today_str, u["total_xp"], created_at, now.isoformat()
                ))
                
                # Seed user progress
                for p in u.get("progress", []):
                    cursor.execute("""
                        INSERT OR IGNORE INTO user_progress (id, user_id, course_id, lesson_id, status, score, attempts, mastery_level, last_practiced_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        f"prg_{uuid.uuid4().hex[:10]}",
                        u["id"],
                        p["course_id"],
                        p["lesson_id"],
                        p["status"],
                        p["score"],
                        2,
                        p.get("mastery", "proficient"),
                        now.isoformat()
                    ))
                    
                # Seed recitation history
                for r in u.get("recitations", []):
                    cursor.execute("""
                        INSERT INTO recitation_logs (
                            id, user_id, target_text, transcription, accuracy_score,
                            audio_duration_seconds, passed_rules_count, failed_rules_count,
                            similarity_percentage, character_accuracy, details_json, created_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        f"rec_{uuid.uuid4().hex[:10]}",
                        u["id"],
                        r["target_text"],
                        r["transcription"],
                        r["accuracy_score"],
                        r["duration"],
                        r["passed_rules"],
                        r["failed_rules"],
                        r["accuracy_score"],
                        r["accuracy_score"],
                        "{}",
                        now.isoformat()
                    ))
                    
                # Seed past daily activity
                for d in range(u["streak_days"]):
                    act_date = (now - timedelta(days=d)).strftime("%Y-%m-%d")
                    cursor.execute("""
                        INSERT OR IGNORE INTO daily_activity (id, user_id, activity_date, minutes_practiced, ayahs_recited, xp_earned)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        f"act_{uuid.uuid4().hex[:10]}",
                        u["id"],
                        act_date,
                        u["target_daily_minutes"] + (d % 5),
                        3 + (d % 4),
                        50 + (d * 10)
                    ))
                    
        conn.commit()
    print("Dummy users seed check complete.")
