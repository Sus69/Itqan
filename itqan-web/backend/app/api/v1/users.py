import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.database import get_db
from app.core.security import require_current_user
from app.schemas.progress import (
    ProgressUpdateRequest,
    LessonProgressResponse,
    UserStatsResponse,
    DailyActivityItem,
)

router = APIRouter(prefix="/users/me", tags=["User Progress & Mastery"])

@router.get("/progress", response_model=UserStatsResponse)
def get_user_progress_overview(user: dict = Depends(require_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Fetch all progress records
        cursor.execute("""
            SELECT * FROM user_progress WHERE user_id = ? ORDER BY last_practiced_at DESC
        """, (user["id"],))
        progress_rows = cursor.fetchall()
        
        progress_items = []
        tajweed_completed = 0
        qaida_completed = 0
        for r in progress_rows:
            item = dict(r)
            progress_items.append(LessonProgressResponse(
                id=item["id"],
                course_id=item["course_id"],
                lesson_id=item["lesson_id"],
                status=item["status"],
                score=item["score"],
                attempts=item["attempts"],
                mastery_level=item["mastery_level"],
                last_practiced_at=item["last_practiced_at"],
            ))
            if item["status"] == "completed":
                if item["course_id"] == "tajweed":
                    tajweed_completed += 1
                elif item["course_id"] == "qaida":
                    qaida_completed += 1
                    
        tajweed_pct = min(100, int((tajweed_completed / 24.0) * 100)) if tajweed_completed else 0
        qaida_pct = min(100, int((qaida_completed / 21.0) * 100)) if qaida_completed else 0
        
        # 2. Fetch recitation logs count
        cursor.execute("SELECT COUNT(*) as cnt FROM recitation_logs WHERE user_id = ?", (user["id"],))
        rec_cnt = cursor.fetchone()["cnt"]
        
        # 3. Fetch past 7 days activity
        cursor.execute("""
            SELECT activity_date, minutes_practiced, ayahs_recited, xp_earned
            FROM daily_activity
            WHERE user_id = ?
            ORDER BY activity_date DESC
            LIMIT 14
        """, (user["id"],))
        act_rows = cursor.fetchall()
        
        recent_activity = [
            DailyActivityItem(
                activity_date=r["activity_date"],
                minutes_practiced=r["minutes_practiced"],
                ayahs_recited=r["ayahs_recited"],
                xp_earned=r["xp_earned"]
            )
            for r in act_rows
        ]
        
        # Calculate total minutes
        cursor.execute("SELECT SUM(minutes_practiced) as total_mins FROM daily_activity WHERE user_id = ?", (user["id"],))
        total_mins_res = cursor.fetchone()["total_mins"]
        total_mins = total_mins_res if total_mins_res else 0

        return UserStatsResponse(
            streak_days=user["streak_days"],
            total_xp=user["total_xp"],
            total_recitations=rec_cnt,
            total_minutes_practiced=total_mins,
            tajweed_mastery_percentage=tajweed_pct,
            qaida_mastery_percentage=qaida_pct,
            recent_activity=recent_activity,
            progress_items=progress_items,
        )

@router.post("/progress", response_model=LessonProgressResponse)
def update_user_lesson_progress(req: ProgressUpdateRequest, user: dict = Depends(require_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()
        today = now[:10]
        
        mastery = "novice"
        if req.score >= 90:
            mastery = "mastered"
        elif req.score >= 70:
            mastery = "proficient"
            
        cursor.execute("""
            SELECT * FROM user_progress WHERE user_id = ? AND course_id = ? AND lesson_id = ?
        """, (user["id"], req.course_id, req.lesson_id))
        existing = cursor.fetchone()
        
        xp_to_add = 20 if req.status == "completed" else 5
        if req.score >= 90:
            xp_to_add += 15
            
        if existing:
            new_attempts = existing["attempts"] + 1
            best_score = max(existing["score"], req.score)
            status_val = "completed" if (existing["status"] == "completed" or req.status == "completed") else req.status
            
            cursor.execute("""
                UPDATE user_progress
                SET status = ?, score = ?, attempts = ?, mastery_level = ?, last_practiced_at = ?
                WHERE id = ?
            """, (status_val, best_score, new_attempts, mastery, now, existing["id"]))
            progress_id = existing["id"]
            attempts_val = new_attempts
        else:
            progress_id = f"prg_{uuid.uuid4().hex[:12]}"
            attempts_val = 1
            cursor.execute("""
                INSERT INTO user_progress (id, user_id, course_id, lesson_id, status, score, attempts, mastery_level, last_practiced_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (progress_id, user["id"], req.course_id, req.lesson_id, req.status, req.score, 1, mastery, now))
            
        # Update user total XP
        cursor.execute("UPDATE users SET total_xp = total_xp + ?, updated_at = ? WHERE id = ?", (xp_to_add, now, user["id"]))
        
        # Update daily activity record
        cursor.execute("SELECT * FROM daily_activity WHERE user_id = ? AND activity_date = ?", (user["id"], today))
        existing_act = cursor.fetchone()
        if existing_act:
            cursor.execute("""
                UPDATE daily_activity
                SET minutes_practiced = minutes_practiced + ?,
                    ayahs_recited = ayahs_recited + ?,
                    xp_earned = xp_earned + ?
                WHERE id = ?
            """, (req.minutes_spent or 3, req.ayahs_recited or 1, xp_to_add, existing_act["id"]))
        else:
            cursor.execute("""
                INSERT INTO daily_activity (id, user_id, activity_date, minutes_practiced, ayahs_recited, xp_earned)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (f"act_{uuid.uuid4().hex[:12]}", user["id"], today, req.minutes_spent or 3, req.ayahs_recited or 1, xp_to_add))
            
        return LessonProgressResponse(
            id=progress_id,
            course_id=req.course_id,
            lesson_id=req.lesson_id,
            status=req.status,
            score=req.score,
            attempts=attempts_val,
            mastery_level=mastery,
            last_practiced_at=now,
        )

@router.get("/recitations")
def get_user_recitations_history(
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_current_user)
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, target_text, transcription, accuracy_score, audio_duration_seconds,
                   passed_rules_count, failed_rules_count, similarity_percentage, character_accuracy, created_at
            FROM recitation_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (user["id"], limit))
        rows = cursor.fetchall()
        return {
            "total": len(rows),
            "recitations": [dict(r) for r in rows]
        }
